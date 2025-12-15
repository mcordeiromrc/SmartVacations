from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
import pandas as pd
# =========================================================
#  SmartVacations - Enterprise 1.0
#  (by Leonardo Baladão and Marcio Roberto Cordeiro - 2025)
# =========================================================

from typing import List, Optional
from io import BytesIO
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db

router = APIRouter()

@router.get("/", response_model=List[schemas.Employee])
def get_employees(db: Session = Depends(get_db)):
    employees = db.query(models.Employee).all()
    # Populate client_name manually if needed or rely on ORM lazy load if Pydantic config set
    # ORM doesn't auto-fetch related fields for Pydantic unless specified.
    # We will just map it.
    out = []
    for e in employees:
        e.client_name = e.client.name if e.client else "Desconhecido"
        out.append(e)
    return out

@router.get("/clients", response_model=List[schemas.Client])
def get_clients(db: Session = Depends(get_db)):
    clients = db.query(models.Client).all()
    for c in clients:
        c.project_ids = c.project_ids_str.split(',') if c.project_ids_str else []
    return clients

@router.get("/projects", response_model=List[schemas.Project])
def get_projects(db: Session = Depends(get_db)):
    return db.query(models.Project).all()

def _normalize_header(h: str) -> str:
    return ''.join(ch for ch in h.lower().strip() if ch.isalnum())

@router.post("/import")
async def import_employees(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        content = await file.read()
        try:
            df = pd.read_excel(BytesIO(content))
        except:
            df = pd.read_csv(BytesIO(content), sep=';')
    except Exception:
        raise HTTPException(status_code=400, detail="Arquivo inválido ou não suportado")

    if df.empty:
        return {"employees": []}

    mapping = {}
    headers = [str(h) for h in df.columns]
    norm = { _normalize_header(h): h for h in headers }

    def pick(*candidates):
        for c in candidates:
            k = _normalize_header(c)
            if k in norm:
                return norm[k]
        return None

    mapping['name'] = pick('Nome', 'Nome Completo', 'Colaborador')
    mapping['admission_date'] = pick('Data de Admissão', 'Admissao', 'Admissão', 'DataAdmissao')
    mapping['rate'] = pick('Rate', 'Taxa', 'Taxa Horária', 'ValorHora')
    mapping['client_name'] = pick('Cliente', 'Cliente Alocado', 'Tomador')
    mapping['local'] = pick('Local', 'Cidade', 'Localidade')

    required = ['name','admission_date','rate','client_name','local']
    if any(mapping.get(r) is None for r in required):
        raise HTTPException(status_code=400, detail="Planilha sem colunas necessárias")

    records = []
    
    # Pre-fetch existing clients to minimize DB hits
    existing_clients = {c.name.lower(): c for c in db.query(models.Client).all()}
    max_client_id = max([c.id for c in existing_clients.values()] or [0])
    
    # Pre-fetch existing employees to avoid dupes (key: name+admission)
    # Ideally use ID, but for import we use composite key
    existing_emps = {(e.name.lower(), e.admission_date): e for e in db.query(models.Employee).all()}
    max_emp_id = max([e.id for e in existing_emps.values()] or [0])

    for _, row in df.iterrows():
        name = str(row.get(mapping['name'], '')).strip()
        admission = str(row.get(mapping['admission_date'], '')).strip()
        rate_raw = row.get(mapping['rate'], 0)
        try:
            rate = float(str(rate_raw).replace(',', '.').strip())
        except Exception:
            rate = 0.0
        client_name = str(row.get(mapping['client_name'], '')).strip()
        local = str(row.get(mapping['local'], '')).strip()

        if not name or not admission:
            continue
            
        # Resolve Client
        client = existing_clients.get(client_name.lower())
        if not client and client_name:
            max_client_id += 1
            client = models.Client(
                id=max_client_id,
                name=client_name,
                contact_person="Pendente",
                email="pendente@email.com",
                status="ACTIVE",
                project_ids_str="PRJ-STF01"
            )
            db.add(client)
            existing_clients[client_name.lower()] = client
            db.flush() # Get ID
        
        client_id = client.id if client else 1 # Fallback, should not happen if logic holds
        
        # Create/Update Employee
        key = (name.lower(), admission)
        if key not in existing_emps:
            max_emp_id += 1
            emp = models.Employee(
                id=max_emp_id,
                name=name,
                admission_date=admission,
                rate=rate,
                client_id=client_id,
                project_id="PRJ-STF01",
                local=local or "São Paulo"
            )
            db.add(emp)
            existing_emps[key] = emp
            records.append({
                "name": name, 
                "admission_date": admission, 
                "rate": rate, 
                "client_name": client_name,
                "local": local
            })

    db.commit()
    return {"employees": records, "message": f"{len(records)} colaboradores importados com sucesso."}
