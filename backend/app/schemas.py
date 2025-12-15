# =========================================================
#  SmartVacations - Enterprise 1.0
#  (by Leonardo Baladão and Marcio Roberto Cordeiro - 2025)
# =========================================================

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

# --- DB Models Schemas ---
class ProjectBase(BaseModel):
    id: str
    name: str
    manager: str
    budget: float
    currency_code: str
    start_date: str
    end_date: str
    status: str
    description: Optional[str] = None
    max_concurrency_percent: int
    preferred_start_weekday: int
    country_code: str

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    class Config:
        from_attributes = True

class ClientBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    status: str
    project_ids: Optional[List[str]] = None

class ClientCreate(ClientBase):
    pass

class Client(ClientBase):
    id: int
    project_ids_str: Optional[str] = None
    class Config:
        from_attributes = True

class EmployeeBase(BaseModel):
    name: str
    admission_date: str
    rate: float
    client_id: int
    project_id: str
    local: str

class EmployeeCreate(EmployeeBase):
    pass

class Employee(EmployeeBase):
    id: int
    client_name: Optional[str] = None
    class Config:
        from_attributes = True

# --- Application/Logic Schemas ---

class VacationRules(BaseModel):
    standard_days: int
    allow_split: bool
    min_main_period: int
    min_other_period: int
    sell_days_limit: int
    allow_start_before_holiday: bool
    blackout_dates: List[str]

class MeasurementWindow(BaseModel):
    id: str
    start: str
    end: str
    label: str
    totalBusinessHours: Optional[float] = 0

class LegacyWindow(BaseModel):
    id: str
    start: str
    end: str
    label: str

class OptimizationWindow(BaseModel):
    id: str
    start: str
    end: str
    label: str
    totalBusinessHours: Optional[float] = 0

class LegacyResultRow(BaseModel):
    employee_id: int
    employee_name: str
    client_name: str
    start_dates: List[str]
    end_dates: List[str]
    breakdown: str
    total_impact: float
    total_business_hours: float
    window_impacts: Dict[str, float]
    window_hours: Dict[str, float]
    worst_case_impact: float
    savings: float
    savings_percent: float
    vacation_type_label: str

class LegacyComparisonRequest(BaseModel):
    year: int
    rules: VacationRules
    strategy_preference: str
    project_context: Optional[Project] = None
    windows: Optional[List[LegacyWindow]] = None 
    allocation_logic: str # 'smart' ...
    preset_periods: Optional[List[int]] = None
    sell_days: Optional[int] = 0
    employees: Optional[List[Employee]] = None

class LegacyComparisonResult(BaseModel):
    windows: List[LegacyWindow]
    rows: List[LegacyResultRow]
    total_impact: float
    total_business_hours: float
    savings_total: float
    employees_count: int

class Allocation(BaseModel):
    employee_id: int
    employee_name: str
    start_date: str
    end_date: str
    duration: int
    cost_impact: float
    billable_hours: float
    type: str
    warnings: Optional[List[str]] = None
    window_impacts: Optional[Dict[str, float]] = None
    window_hours: Optional[Dict[str, float]] = None

class AIConfig(BaseModel):
    provider: Optional[str] = "openai"
    model: Optional[str] = "gpt-4o-mini"
    api_key: Optional[str] = None
    prompt: Optional[str] = None

class OptimizationRequest(BaseModel):
    year: int
    rules: VacationRules
    strategy_preference: str
    project_context: Optional[Project] = None
    windows: Optional[List[MeasurementWindow]] = None
    employees: Optional[List[Employee]] = None
    use_ai: Optional[bool] = False
    ai_config: Optional[AIConfig] = None
    use_advanced_solver: Optional[bool] = True
    solver_timeout: Optional[int] = 120
    # Date range filters
    date_range_start: Optional[str] = None
    date_range_end: Optional[str] = None

class OptimizationResult(BaseModel):
    total_impact: float
    financial_savings: float
    allocations: List[Allocation]
    clt_compliance_check: bool
    holiday_conflicts_avoided: int
    monthly_revenue_target: float
    monthly_cash_flow: Dict[str, float]
    solver_method: Optional[str] = None
    optimization_time_seconds: Optional[float] = None

class OptimizationJob(BaseModel):
    id: str
    status: str
    result: Optional[OptimizationResult] = None
    created_at: str

# --- Simulation Persistence Schemas ---

class SimulationBase(BaseModel):
    name: str
    project_id: str
    configuration: Dict[str, Any] # Serialized OptimizationRequest
    result: Dict[str, Any] # Serialized OptimizationResult

class SimulationCreate(SimulationBase):
    pass

class Simulation(SimulationBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True
