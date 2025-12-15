# =========================================================
#  SmartVacations - Enterprise 1.0
#  (by Leonardo Baladão and Marcio Roberto Cordeiro - 2025)
# =========================================================

from fastapi import APIRouter
from ..schemas import LegacyComparisonRequest, LegacyComparisonResult, Employee
from ..services.legacy_engine import run_legacy_comparison

router = APIRouter()

@router.post("/compare", response_model=LegacyComparisonResult)
def compare(req: LegacyComparisonRequest) -> LegacyComparisonResult:
    employees = req.employees or []
    if req.project_context and employees:
        employees = [e for e in employees if e.project_id == req.project_context.id]
    return run_legacy_comparison(employees, req)

