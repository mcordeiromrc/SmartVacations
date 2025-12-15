# =========================================================
#  SmartVacations - Enterprise 1.0
#  (by Leonardo Baladão and Marcio Roberto Cordeiro - 2025)
# =========================================================

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from sqlalchemy.orm import Session
from . import models, database
from .routers import legacy, optimization, employees
from .database import engine, get_db

# Create Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartVacations Enterprise API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed Initial Data
@app.on_event("startup")
def startup_event():
    db = next(database.get_db())
    # Seed Project
    project = db.query(models.Project).filter(models.Project.id == "PRJ-STF01").first()
    if not project:
        db.add(models.Project(
            id="PRJ-STF01",
            name="Projeto STF01",
            manager="Diretoria de Sistemas",
            budget=7343312.00,
            currency_code="BRL",
            start_date="2024-01-01",
            end_date="2028-12-31",
            status="IN_PROGRESS",
            description="Modernização dos sistemas de gestão do Estado.",
            max_concurrency_percent=10,
            preferred_start_weekday=1,
            country_code="BR"
        ))
        db.commit()
    
    # Seed Clients
    clients_data = [
        {"id": 1, "name": "CDHU", "email": "contato@cdhu.sp.gov.br", "project_ids": "PRJ-STF01"},
        {"id": 2, "name": "Detran", "email": "rh@detran.sp.gov.br", "project_ids": "PRJ-STF01"},
        {"id": 3, "name": "Fazenda", "email": "adm@fazenda.sp.gov.br", "project_ids": "PRJ-STF01"},
        {"id": 4, "name": "PGE", "email": "rh@pge.sp.gov.br", "project_ids": "PRJ-STF01"},
        {"id": 5, "name": "Mobile Cidadão", "email": "mobile@prodesp.br", "project_ids": "PRJ-STF01"},
    ]
    for c in clients_data:
        if not db.query(models.Client).filter(models.Client.id == c["id"]).first():
            db.add(models.Client(
                id=c["id"],
                name=c["name"],
                contact_person=f"Gestor {c['name']}",
                email=c["email"],
                status="ACTIVE",
                project_ids_str=c["project_ids"]
            ))
    db.commit()

app.include_router(legacy.router, prefix="/legacy", tags=["legacy"])
app.include_router(optimization.router, prefix="/optimization", tags=["optimization"])
app.include_router(employees.router, prefix="/employees", tags=["employees"])

# Serve frontend (if available) after API routes to avoid shadowing
static_dir = os.getenv("FASTAPI_STATIC_DIR")
if static_dir and os.path.isdir(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

