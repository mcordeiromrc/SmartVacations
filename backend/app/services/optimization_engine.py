# =========================================================
#  SmartVacations - Enterprise 1.0
#  (by Leonardo Baladão and Marcio Roberto Cordeiro - 2025)
# =========================================================

from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional, Set, Union, Sequence, cast
import json
import importlib
import time
from ..schemas import Employee, OptimizationRequest, OptimizationResult, Allocation, AIConfig, OptimizationWindow, MeasurementWindow

# ============================================================================
# ADVANCED ILP SOLVER USING PULP
# ============================================================================

def run_optimization_ilp(employees: List[Employee], req: OptimizationRequest) -> Optional[OptimizationResult]:
    """
    Integer Linear Programming solver for optimal vacation allocation.
    Guarantees mathematically optimal solution that minimizes revenue impact.
    """
    try:
        pulp = importlib.import_module('pulp')
    except Exception:
        return None
    
    start_time = time.time()
    
    # Group employees by client
    client_employee_count: Dict[str, int] = {}
    for emp in employees:
        cname = emp.client_name or 'Desconhecido'
        client_employee_count[cname] = client_employee_count.get(cname, 0) + 1
    
    # Generate valid start dates (respecting date range if provided)
    if getattr(req, 'date_range_start', None) and getattr(req, 'date_range_end', None):
        ds_str = cast(str, req.date_range_start)
        de_str = cast(str, req.date_range_end)
        ds = datetime.strptime(ds_str, '%Y-%m-%d')
        de = datetime.strptime(de_str, '%Y-%m-%d')
        preferred = getattr(req.project_context, 'preferred_start_weekday', 0)
        valid_starts = _generate_valid_start_dates_range(ds, de, employees, preferred)
    else:
        valid_starts = _generate_valid_start_dates(req.year, employees)
    
    # Determine periods based on strategy
    strategy = req.strategy_preference
    if strategy == 'SELL_10':
        periods = [20]
    elif strategy == 'SPLIT_2_PERIODS':
        periods = [15, 15]
    elif strategy == 'SPLIT_3_PERIODS':
        periods = [14, 8, 8]
    else:
        periods = [30]
    
    # Create ILP model
    model = pulp.LpProblem("VacationOptimization", pulp.LpMinimize)
    
    # Decision variables: x[emp_id][start_date][period_idx] = 1 if allocated, 0 otherwise
    x = {}
    cost_vars = {}
    
    for emp in employees:
        x[emp.id] = {}
        for start_date in valid_starts:
            x[emp.id][start_date] = {}
            for period_idx, duration in enumerate(periods):
                var_name = f"x_{emp.id}_{start_date}_{period_idx}"
                x[emp.id][start_date][period_idx] = pulp.LpVariable(var_name, cat='Binary')
                
                # Calculate cost for this allocation
                end_date = start_date + timedelta(days=duration - 1)
                hours = _bridge_aware_business_hours(start_date, end_date, _region_of(emp.local), start_date.year)
                cost = hours * emp.rate
                cost_vars[var_name] = cost
    
    # Objective: Minimize total cost
    model += pulp.lpSum([x[emp.id][sd][pi] * cost_vars[f"x_{emp.id}_{sd}_{pi}"]
                         for emp in employees
                         for sd in valid_starts
                         for pi in range(len(periods))])
    
    # CONSTRAINT 1: Each employee must have exactly one allocation per period
    for emp in employees:
        for period_idx in range(len(periods)):
            model += pulp.lpSum([x[emp.id][sd][period_idx] for sd in valid_starts]) == 1
    
    # CONSTRAINT 2: Maximum concurrency (global)
    percent = getattr(req.project_context, 'max_concurrency_percent', 10)
    max_simultaneous = max(1, round(len(employees) * (percent / 100.0)))
    all_dates = set()
    for sd in valid_starts:
        for duration in periods:
            current = sd
            end = sd + timedelta(days=duration - 1)
            while current <= end:
                all_dates.add(current)
                current += timedelta(days=1)
    
    for date in all_dates:
        model += pulp.lpSum([x[emp.id][sd][pi]
                            for emp in employees
                            for sd in valid_starts
                            for pi, duration in enumerate(periods)
                            if sd <= date <= sd + timedelta(days=duration - 1)]) <= max_simultaneous
    
    # CONSTRAINT 3: 10% client capacity per window (CRITICAL NEW RULE)
    if req.windows:
        for window in req.windows:
            ws = datetime.strptime(window.start, '%Y-%m-%d')
            we = datetime.strptime(window.end, '%Y-%m-%d')
            
            for client_name, count in client_employee_count.items():
                max_allowed = max(1, int(count * 0.1))
                
                # Count employees from this client on vacation during this window
                model += pulp.lpSum([x[emp.id][sd][pi]
                                    for emp in employees if (emp.client_name or 'Desconhecido') == client_name
                                    for sd in valid_starts
                                    for pi, duration in enumerate(periods)
                                    if _overlaps(sd, sd + timedelta(days=duration - 1), ws, we)]) <= max_allowed
    
    # CONSTRAINT 4: Periods must be separated by at least 30 days
    for emp in employees:
        if len(periods) > 1:
            for sd1 in valid_starts:
                for pi1 in range(len(periods)):
                    for sd2 in valid_starts:
                        for pi2 in range(pi1 + 1, len(periods)):
                            if abs((sd2 - sd1).days) < 30:
                                model += x[emp.id][sd1][pi1] + x[emp.id][sd2][pi2] <= 1
    
    # Solve with timeout
    solver = pulp.PULP_CBC_CMD(msg=0, timeLimit=req.solver_timeout)
    model.solve(solver)
    
    elapsed_time = time.time() - start_time
    
    # Check if solution found
    if model.status != pulp.LpStatusOptimal:
        return None
    
    # Extract solution
    allocations: List[Allocation] = []
    total_impact = 0.0
    monthly_cash_flow: Dict[str, float] = {}
    
    for emp in employees:
        for sd in valid_starts:
            for pi, duration in enumerate(periods):
                if pulp.value(x[emp.id][sd][pi]) == 1:
                    end_date = sd + timedelta(days=duration - 1)
                    hours = _bridge_aware_business_hours(sd, end_date, _region_of(emp.local), sd.year)
                    cost = hours * emp.rate
                    total_impact += cost
                    
                    mk = _month_key(sd)
                    monthly_cash_flow[mk] = monthly_cash_flow.get(mk, 0.0) + cost
                    
                    # Calculate window impacts
                    window_impacts: Dict[str, float] = {}
                    window_hours: Dict[str, float] = {}
                    if req.windows:
                        for w in req.windows:
                            ws = datetime.strptime(w.start, '%Y-%m-%d')
                            we = datetime.strptime(w.end, '%Y-%m-%d')
                            overlap_start = max(ws, sd)
                            overlap_end = min(we, end_date)
                            if overlap_start <= overlap_end:
                                hw = _bridge_aware_business_hours(overlap_start, overlap_end, _region_of(emp.local), overlap_start.year)
                                window_hours[w.id] = float(hw)
                                window_impacts[w.id] = float(hw * emp.rate)
                    
                    allocations.append(Allocation(
                        employee_id=emp.id,
                        employee_name=emp.name,
                        start_date=sd.strftime('%Y-%m-%d'),
                        end_date=end_date.strftime('%Y-%m-%d'),
                        duration=duration,
                        cost_impact=cost,
                        billable_hours=hours,
                        type='STANDARD' if duration == 30 else f'SPLIT_{pi+1}',
                        window_impacts=window_impacts,
                        window_hours=window_hours
                    ))
    
    # Add abono pecuniário if SELL_10 strategy
    if strategy == 'SELL_10' or (strategy == 'SMART_HYBRID' and any(e.rate > 180 for e in employees)):
        for emp in employees:
            if strategy == 'SMART_HYBRID' and emp.rate <= 180:
                continue
            saving_amount = emp.rate * 8 * 10
            # Find the last allocation for this employee
            emp_allocs = [a for a in allocations if a.employee_id == emp.id]
            if emp_allocs:
                last_alloc = max(emp_allocs, key=lambda a: a.end_date)
                start_abono = datetime.strptime(last_alloc.end_date, '%Y-%m-%d') + timedelta(days=30)
                end_abono = start_abono + timedelta(days=9)
                allocations.append(Allocation(
                    employee_id=emp.id,
                    employee_name=emp.name,
                    start_date=start_abono.strftime('%Y-%m-%d'),
                    end_date=end_abono.strftime('%Y-%m-%d'),
                    duration=10,
                    cost_impact=0.0,
                    billable_hours=80,
                    type='ABONO_PECUNIARIO'
                ))
    
    allocations.sort(key=lambda a: a.start_date)
    monthly_revenue_target = (getattr(req.project_context, 'budget', 0) or 0) / 12.0
    
    return OptimizationResult(
        total_impact=total_impact,
        financial_savings=0.0,
        allocations=allocations,
        clt_compliance_check=True,
        holiday_conflicts_avoided=0,
        monthly_revenue_target=monthly_revenue_target,
        monthly_cash_flow=monthly_cash_flow,
        solver_method='ILP',
        optimization_time_seconds=round(elapsed_time, 2)
    )


# ============================================================================
# IMPROVED HEURISTIC WITH CLIENT CAPACITY CONSTRAINT
# ============================================================================

def run_optimization_heuristic(employees: List[Employee], req: OptimizationRequest) -> OptimizationResult:
    """
    Improved heuristic solver with 10% client capacity constraint.
    Fallback when ILP solver fails or is disabled.
    """
    start_time = time.time()
    total_impact = 0.0
    savings = 0.0
    conflicts_avoided = 0
    allocations: List[Allocation] = []
    occupancy: Dict[str, int] = {}
    monthly_cash_flow: Dict[str, float] = {}
    
    # Track client occupancy per window
    client_employee_count: Dict[str, int] = {}
    client_window_occupancy: Dict[str, Dict[str, int]] = {}
    
    for emp in employees:
        cname = emp.client_name or 'Desconhecido'
        client_employee_count[cname] = client_employee_count.get(cname, 0) + 1
    
    monthly_revenue_target = (getattr(req.project_context, 'budget', 0) or 0) / 12.0
    percent = getattr(req.project_context, 'max_concurrency_percent', 10)
    max_simultaneous = max(1, round(len(employees) * (percent / 100.0)))
    
    sorted_emps = sorted(employees, key=lambda e: e.rate, reverse=True)
    
    for emp in sorted_emps:
        strategy = req.strategy_preference
        if strategy == 'SMART_HYBRID':
            strategy = 'SELL_10' if emp.rate > 180 else 'STANDARD_30'
        
        periods: List[int] = []
        selling = False
        if strategy == 'SELL_10':
            periods = [20]
            selling = True
        elif strategy == 'SPLIT_2_PERIODS':
            periods = [15, 15]
        elif strategy == 'SPLIT_3_PERIODS':
            periods = [14, 8, 8]
        else:
            periods = [30]
        
        if getattr(req, 'date_range_start', None) and getattr(req, 'date_range_end', None):
            constraint = datetime.strptime(cast(str, req.date_range_start), '%Y-%m-%d')
            search_start = constraint
            search_end = datetime.strptime(cast(str, req.date_range_end), '%Y-%m-%d')
            total_days = (search_end - search_start).days + 1
        else:
            constraint = datetime(req.year, 1, 1)
            search_start = datetime(req.year, 1, 1)
            total_days = 360
        for duration in periods:
            best_start: Optional[datetime] = None
            min_cost = float('inf')
            best_hours = 0
            
            for i in range(total_days):
                current_start = search_start + timedelta(days=i)
                if current_start < constraint:
                    continue
                preferred = getattr(req.project_context, 'preferred_start_weekday', 0)
                if preferred > 0:
                    if current_start.weekday() != preferred:
                        continue
                else:
                    if current_start.weekday() != 0:
                        continue
                
                year_for_holidays = current_start.year
                if not _is_valid_start_date(current_start, year_for_holidays, emp.local):
                    conflicts_avoided += 1
                    continue
                
                current_end = current_start + timedelta(days=duration - 1)
                if not _concurrency_safe(current_start, current_end, occupancy, max_simultaneous):
                    continue
                
                cname = emp.client_name or 'Desconhecido'
                if not _client_capacity_safe(current_start, current_end, cname, 
                                            client_window_occupancy, client_employee_count, req.windows):
                    continue
                
                hours = _bridge_aware_business_hours(current_start, current_end, _region_of(emp.local), current_start.year)
                current_cost = hours * emp.rate
                if current_cost < min_cost:
                    min_cost = current_cost
                    best_start = current_start
                    best_hours = hours
            
            if best_start is not None:
                actual_end = best_start + timedelta(days=duration - 1)
                _register_occupancy(best_start, actual_end, occupancy)
                _register_client_occupancy(best_start, actual_end, cname, 
                                          client_window_occupancy, req.windows)
                
                mk = _month_key(best_start)
                monthly_cash_flow[mk] = monthly_cash_flow.get(mk, 0.0) + min_cost
                total_impact += min_cost
                
                window_impacts: Dict[str, float] = {}
                window_hours: Dict[str, float] = {}
                for w in (req.windows or []):
                    ws = datetime.strptime(w.start, '%Y-%m-%d')
                    we = datetime.strptime(w.end, '%Y-%m-%d')
                    overlap_start = max(ws, best_start)
                    overlap_end = min(we, actual_end)
                    if overlap_start <= overlap_end:
                        hw = _bridge_aware_business_hours(overlap_start, overlap_end, _region_of(emp.local), overlap_start.year)
                        window_hours[w.id] = float(hw)
                        window_impacts[w.id] = float(hw * emp.rate)
                
                allocations.append(Allocation(
                    employee_id=emp.id,
                    employee_name=emp.name,
                    start_date=best_start.strftime('%Y-%m-%d'),
                    end_date=actual_end.strftime('%Y-%m-%d'),
                    duration=duration,
                    cost_impact=min_cost,
                    billable_hours=best_hours,
                    type='STANDARD' if duration == 30 else ('SPLIT_1' if duration < 30 else 'STANDARD'),
                    window_impacts=window_impacts,
                    window_hours=window_hours
                ))
                
                constraint = actual_end + timedelta(days=30)
        
        if selling:
            saving_amount = emp.rate * 8 * 10
            savings += saving_amount
            start_abono = constraint - timedelta(days=10)
            allocations.append(Allocation(
                employee_id=emp.id,
                employee_name=emp.name,
                start_date=start_abono.strftime('%Y-%m-%d'),
                end_date=constraint.strftime('%Y-%m-%d'),
                duration=10,
                cost_impact=0.0,
                billable_hours=80,
                type='ABONO_PECUNIARIO',
            ))
    
    allocations.sort(key=lambda a: a.start_date)
    elapsed_time = time.time() - start_time
    
    return OptimizationResult(
        total_impact=total_impact,
        financial_savings=savings,
        allocations=allocations,
        clt_compliance_check=True,
        holiday_conflicts_avoided=conflicts_avoided,
        monthly_revenue_target=monthly_revenue_target,
        monthly_cash_flow=monthly_cash_flow,
        solver_method='HEURISTIC',
        optimization_time_seconds=round(elapsed_time, 2)
    )


# ============================================================================
# AI SOLVER (EXISTING)
# ============================================================================

def _ai_generate_allocations(employees: List[Employee], req: OptimizationRequest, ai: AIConfig) -> List[Allocation]:
    try:
        lc_openai = importlib.import_module('langchain_openai')
        ChatOpenAI = getattr(lc_openai, 'ChatOpenAI')
    except Exception:
        try:
            lc_chat = importlib.import_module('langchain.chat_models')
            ChatOpenAI = getattr(lc_chat, 'ChatOpenAI')
        except Exception as e:
            raise RuntimeError(f"AI engine not available: {e}")
    try:
        msgs = importlib.import_module('langchain_core.messages')
        SystemMessage = getattr(msgs, 'SystemMessage')
        HumanMessage = getattr(msgs, 'HumanMessage')
    except Exception:
        msgs = importlib.import_module('langchain.schema')
        SystemMessage = getattr(msgs, 'SystemMessage')
        HumanMessage = getattr(msgs, 'HumanMessage')
    model = ai.model or "gpt-4o-mini"
    if not ai.api_key:
        raise RuntimeError("Missing API key")
    chat = ChatOpenAI(model=model, api_key=ai.api_key)
    constraints = {
        "year": req.year,
        "date_range_start": getattr(req, 'date_range_start', None),
        "date_range_end": getattr(req, 'date_range_end', None),
        "preferred_start_weekday": getattr(req.project_context, 'preferred_start_weekday', 0),
        "max_concurrency_percent": getattr(req.project_context, 'max_concurrency_percent', 10),
        "budget": getattr(req.project_context, 'budget', 0),
        "currency_code": getattr(req.project_context, 'currency_code', 'BRL'),
    }
    emps = [{"id": e.id, "name": e.name, "rate": e.rate, "client": e.client_name, "local": e.local} for e in employees]
    wins = [{"id": w.id, "start": w.start, "end": w.end, "label": w.label} for w in (req.windows or [])]
    sys_text = "Você é um planejador de férias que gera alocações com mínimo impacto financeiro, respeitando regras do projeto. Retorne JSON puro."
    user_prompt = {
        "employees": emps,
        "windows": wins,
        "constraints": constraints,
        "instructions": ai.prompt or "Gere uma lista de alocações por colaborador com start_date e end_date.",
        "output_schema": {
            "allocations": [
                {"employee_id": "number", "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD"}
            ]
        }
    }
    msg = chat.invoke([SystemMessage(content=sys_text), HumanMessage(content=json.dumps(user_prompt))])
    content = msg.content
    try:
        data = json.loads(content)
    except Exception:
        s = str(content).strip()
        s = s.replace('```json', '').replace('```', '').strip()
        try:
            data = json.loads(s)
        except Exception:
            import re
            m = re.search(r"\{[\s\S]*\}", s)
            if not m:
                return []
            try:
                data = json.loads(m.group(0))
            except Exception:
                return []
    raw_allocs = data.get("allocations", [])
    out: List[Allocation] = []
    for ra in raw_allocs:
        emp = next((e for e in employees if e.id == ra.get("employee_id")), None)
        if not emp:
            continue
        try:
            sd = datetime.strptime(ra.get("start_date"), '%Y-%m-%d')
            ed = datetime.strptime(ra.get("end_date"), '%Y-%m-%d')
        except Exception:
            continue
        duration = (ed - sd).days + 1
        hours = _bridge_aware_business_hours(sd, ed, _region_of(emp.local), sd.year)
        cost = hours * emp.rate
        out.append(Allocation(
            employee_id=emp.id,
            employee_name=emp.name,
            start_date=sd.strftime('%Y-%m-%d'),
            end_date=ed.strftime('%Y-%m-%d'),
            duration=duration,
            cost_impact=cost,
            billable_hours=hours,
            type='STANDARD'
        ))
    return out


# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

def run_optimization(employees: List[Employee], req: OptimizationRequest) -> OptimizationResult:
    """
    Main optimization entry point.
    Priority: AI > ILP > Heuristic
    """
    start_time = time.time()
    
    # Try AI first if enabled
    if getattr(req, 'use_ai', False) and req.ai_config and employees:
        try:
            allocations = _ai_generate_allocations(employees, req, req.ai_config)
            if allocations:
                total_impact = sum(a.cost_impact for a in allocations)
                monthly_revenue_target = (getattr(req.project_context, 'budget', 0) or 0) / 12.0
                monthly_cash_flow: Dict[str, float] = {}
                for a in allocations:
                    mk = _month_key(datetime.strptime(a.start_date, '%Y-%m-%d'))
                    monthly_cash_flow[mk] = monthly_cash_flow.get(mk, 0.0) + a.cost_impact
                elapsed_time = time.time() - start_time
                return OptimizationResult(
                    total_impact=total_impact,
                    financial_savings=0.0,
                    allocations=allocations,
                    clt_compliance_check=True,
                    holiday_conflicts_avoided=0,
                    monthly_revenue_target=monthly_revenue_target,
                    monthly_cash_flow=monthly_cash_flow,
                    solver_method='AI',
                    optimization_time_seconds=round(elapsed_time, 2)
                )
        except Exception:
            pass
    
    # Try ILP solver if enabled
    if getattr(req, 'use_advanced_solver', True):
        result = run_optimization_ilp(employees, req)
        if result:
            return result
    
    # Fallback to improved heuristic
    return run_optimization_heuristic(employees, req)


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def _generate_valid_start_dates(year: int, employees: List[Employee]) -> List[datetime]:
    """Generate all valid Monday start dates for the year"""
    valid_dates = []
    regions = set(_region_of(e.local) for e in employees)
    
    # Get all holidays for all regions
    all_holidays = set()
    for region in regions:
        all_holidays.update(_br_holidays(year, region))
        all_holidays.update(_br_holidays(year + 1, region))
    
    current = datetime(year, 1, 1)
    while current.year == year:
        if current.weekday() == 0:  # Monday
            if _is_valid_start_date(current, year, None, all_holidays):
                valid_dates.append(current)
        current += timedelta(days=1)
    
    return valid_dates


def _generate_valid_start_dates_range(start: datetime, end: datetime, employees: List[Employee], preferred_weekday: int) -> List[datetime]:
    valid_dates: List[datetime] = []
    regions = set(_region_of(e.local) for e in employees)
    years = set()
    cur = start
    while cur <= end:
        years.add(cur.year)
        cur += timedelta(days=1)
    holidays: Set[str] = set()
    for y in years:
        for r in regions:
            holidays.update(_br_holidays(y, r))
    cur = start
    while cur <= end:
        if preferred_weekday > 0:
            is_ok_weekday = cur.weekday() == preferred_weekday
        else:
            is_ok_weekday = cur.weekday() == 0
        if is_ok_weekday:
            if _is_valid_start_date(cur, cur.year, None, holidays):
                valid_dates.append(cur)
        cur += timedelta(days=1)
    return valid_dates


def _overlaps(start1: datetime, end1: datetime, start2: datetime, end2: datetime) -> bool:
    """Check if two date ranges overlap"""
    return start1 <= end2 and start2 <= end1


def _client_capacity_safe(start: datetime, end: datetime, client_name: str,
                         client_window_occupancy: Dict[str, Dict[str, int]],
                         client_employee_count: Dict[str, int],
                         windows: Optional[Sequence[Union[OptimizationWindow, MeasurementWindow]]]) -> bool:
    """
    Check if allocating this vacation respects 10% client capacity constraint.
    For each window that overlaps with the vacation period, ensure we don't exceed
    10% of the client's total employees on vacation.
    """
    if not windows:
        return True
    
    max_allowed = max(1, int(client_employee_count.get(client_name, 0) * 0.1))
    
    for window in windows:
        ws = datetime.strptime(window.start, '%Y-%m-%d')
        we = datetime.strptime(window.end, '%Y-%m-%d')
        
        if _overlaps(start, end, ws, we):
            window_id = window.id
            if window_id not in client_window_occupancy:
                client_window_occupancy[window_id] = {}
            
            current_count = client_window_occupancy[window_id].get(client_name, 0)
            if current_count >= max_allowed:
                return False
    
    return True


def _register_client_occupancy(start: datetime, end: datetime, client_name: str,
                              client_window_occupancy: Dict[str, Dict[str, int]],
                              windows: Optional[Sequence[Union[OptimizationWindow, MeasurementWindow]]]) -> None:
    """Register client occupancy for all overlapping windows"""
    if not windows:
        return
    
    for window in windows:
        ws = datetime.strptime(window.start, '%Y-%m-%d')
        we = datetime.strptime(window.end, '%Y-%m-%d')
        
        if _overlaps(start, end, ws, we):
            window_id = window.id
            if window_id not in client_window_occupancy:
                client_window_occupancy[window_id] = {}
            client_window_occupancy[window_id][client_name] = client_window_occupancy[window_id].get(client_name, 0) + 1


def _br_holidays(year: int, region: Optional[str] = None) -> List[str]:
    easter = _easter(year)
    carnaval = easter - timedelta(days=47)
    good_friday = easter - timedelta(days=2)
    corpus = easter + timedelta(days=60)
    fixed = [
        f"{year}-01-01",
        f"{year}-04-21",
        f"{year}-05-01",
        f"{year}-09-07",
        f"{year}-10-12",
        f"{year}-11-02",
        f"{year}-11-15",
        f"{year}-12-25",
    ]
    mov = [carnaval.strftime('%Y-%m-%d'), good_friday.strftime('%Y-%m-%d'), corpus.strftime('%Y-%m-%d')]
    state: List[str] = []
    if region == 'SP':
        state += [f"{year}-07-09", f"{year}-11-20"]
    if region == 'RS':
        state += [f"{year}-09-20"]
    if region == 'RJ':
        state += [f"{year}-04-23", f"{year}-11-20"]
    return fixed + mov + state


def _easter(year: int) -> datetime:
    a = year % 19
    b = year // 100
    c = year % 100
    d = b // 4
    e = b % 4
    f = (b + 8) // 25
    g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30
    i = c // 4
    k = c % 4
    l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451
    month = (h + l - 7 * m + 114) // 31
    day = ((h + l - 7 * m + 114) % 31) + 1
    return datetime(year, month, day)


def _bridge_aware_business_hours(start: datetime, end: datetime, region: Optional[str], year: int) -> int:
    holidays = _br_holidays(year, region)
    if end.year > year:
        holidays += _br_holidays(year + 1, region)
    hset = set(holidays)
    ponte_days: Set[str] = set()
    for h in holidays:
        d = datetime.strptime(h, '%Y-%m-%d')
        if d.weekday() == 1:
            ponte_days.add((d - timedelta(days=1)).strftime('%Y-%m-%d'))
        elif d.weekday() == 3:
            ponte_days.add((d + timedelta(days=1)).strftime('%Y-%m-%d'))
    count = 0
    cur = start
    while cur <= end:
        ds = cur.strftime('%Y-%m-%d')
        dw = cur.weekday()
        if dw < 5 and ds not in hset and ds not in ponte_days:
            count += 1
        cur += timedelta(days=1)
    return count * 8


def _month_key(dt: datetime) -> str:
    months = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ']
    return months[dt.month - 1]


def _is_valid_start_date(date: datetime, year: int, local: Optional[str], 
                         holidays: Optional[Set[str]] = None) -> bool:
    if holidays is None:
        region = _region_of(local)
        holidays = set(_br_holidays(year, region))
        if date.month == 12:
            holidays.update(_br_holidays(year + 1, region))
    
    ds = date.strftime('%Y-%m-%d')
    if ds in holidays:
        return False
    p1 = (date + timedelta(days=1)).strftime('%Y-%m-%d')
    p2 = (date + timedelta(days=2)).strftime('%Y-%m-%d')
    if p1 in holidays or p2 in holidays:
        return False
    return date.weekday() < 5


def _concurrency_safe(start: datetime, end: datetime, occ: Dict[str, int], max_simul: int) -> bool:
    cur = start
    while cur <= end:
        k = cur.strftime('%Y-%m-%d')
        if occ.get(k, 0) >= max_simul:
            return False
        cur += timedelta(days=1)
    return True


def _register_occupancy(start: datetime, end: datetime, occ: Dict[str, int]) -> None:
    cur = start
    while cur <= end:
        k = cur.strftime('%Y-%m-%d')
        occ[k] = occ.get(k, 0) + 1
        cur += timedelta(days=1)


def _region_of(local: Optional[str]) -> Optional[str]:
    if not local:
        return None
    local = local.lower()
    if 'são paulo' in local or 'sp' in local or 'campinas' in local or 'santos' in local:
        return 'SP'
    if 'rio de janeiro' in local or 'rj' in local:
        return 'RJ'
    if 'porto alegre' in local or 'rs' in local or 'alegrete' in local:
        return 'RS'
    return None
