# =========================================================
#  SmartVacations - Enterprise 1.0
#  (by Leonardo Baladão and Marcio Roberto Cordeiro - 2025)
# =========================================================

from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends
from datetime import datetime
import uuid
from typing import List
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db
from ..schemas import OptimizationRequest, OptimizationResult, Employee, OptimizationJob
from ..services.optimization_engine import run_optimization

router = APIRouter()

@router.post("/run", response_model=OptimizationResult)
def run(req: OptimizationRequest) -> OptimizationResult:
    employees = req.employees or []
    if req.project_context and employees:
        employees = [e for e in employees if e.project_id == req.project_context.id]
    return run_optimization(employees, req)

# In-memory job store (simple; replace with Redis/Celery for production)
_JOBS: dict[str, OptimizationJob] = {}

@router.post("/jobs", response_model=OptimizationJob)
def create_job(req: OptimizationRequest, bg: BackgroundTasks) -> OptimizationJob:
    job_id = uuid.uuid4().hex[:8]
    job = OptimizationJob(id=job_id, status='PENDING', result=None, created_at=datetime.utcnow().isoformat())
    _JOBS[job_id] = job

    def task():
        try:
            _JOBS[job_id].status = 'PROCESSING'
            employees = req.employees or []
            if req.project_context and employees:
                employees_local = [e for e in employees if e.project_id == req.project_context.id]
            else:
                employees_local = employees
            result = run_optimization(employees_local, req)
            _JOBS[job_id] = OptimizationJob(id=job_id, status='SUCCESS', result=result, created_at=job.created_at)
        except Exception:
            _JOBS[job_id].status = 'FAILED'

    bg.add_task(task)
    return _JOBS[job_id]

@router.get("/jobs/{job_id}", response_model=OptimizationJob)
def get_job(job_id: str) -> OptimizationJob:
    job = _JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail='Job not found')
    return job

@router.post("/save", response_model=schemas.Simulation)
def save_simulation(req: schemas.SimulationCreate, db: Session = Depends(get_db)):
    sim = models.Simulation(
        name=req.name,
        created_at=datetime.utcnow(),
        project_id=req.project_id,
        configuration=req.configuration,
        result=req.result
    )
    db.add(sim)
    db.commit()
    db.refresh(sim)
    return sim

@router.get("/simulations", response_model=List[schemas.Simulation])
def list_simulations(project_id: str, db: Session = Depends(get_db)):
    return db.query(models.Simulation).filter(models.Simulation.project_id == project_id).order_by(models.Simulation.created_at.desc()).all()

@router.get("/simulations/{sim_id}", response_model=schemas.Simulation)
def get_simulation(sim_id: int, db: Session = Depends(get_db)):
    sim = db.query(models.Simulation).filter(models.Simulation.id == sim_id).first()
    if not sim:
        raise HTTPException(status_code=404, detail="Simulação não encontrada")
    return sim
