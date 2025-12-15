from typing import List

try:
    from backend.app.schemas import Employee, OptimizationRequest, OptimizationResult
    from backend.app.services.optimization_engine import run_optimization as _run_optimization
except Exception:
    from app.schemas import Employee, OptimizationRequest, OptimizationResult
    from app.services.optimization_engine import run_optimization as _run_optimization

def run_optimization(employees: List[Employee], req: OptimizationRequest) -> OptimizationResult:
    return _run_optimization(employees, req)

try:
    from backend.app.services.optimization_engine import run_optimization_ilp as _run_optimization_ilp
except Exception:
    from app.services.optimization_engine import run_optimization_ilp as _run_optimization_ilp

try:
    from backend.app.services.optimization_engine import run_optimization_heuristic as _run_optimization_heuristic
except Exception:
    from app.services.optimization_engine import run_optimization_heuristic as _run_optimization_heuristic

def run_optimization_ilp(employees: List[Employee], req: OptimizationRequest) -> OptimizationResult:
    return _run_optimization_ilp(employees, req)

def run_optimization_heuristic(employees: List[Employee], req: OptimizationRequest) -> OptimizationResult:
    return _run_optimization_heuristic(employees, req)
