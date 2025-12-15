# =========================================================
#  SmartVacations - Enterprise 1.0
#  (by Leonardo Baladão and Marcio Roberto Cordeiro - 2025)
# =========================================================

from datetime import datetime, timedelta
from typing import List, Dict, Optional, Set, Tuple
from ..schemas import Employee, LegacyComparisonRequest, LegacyComparisonResult, LegacyWindow, LegacyResultRow

def _mondays(year: int) -> List[datetime]:
    start = datetime(year, 1, 1)
    days = [start + timedelta(days=i) for i in range(366)]
    return [d for d in days if d.year == year and d.weekday() == 0]

def _business_days_with_pontes(start: datetime, end: datetime, holidays: List[str]) -> int:
    hset = set(holidays)
    ponte_days: Set[str] = set()
    for h in holidays:
        d = datetime.strptime(h, '%Y-%m-%d')
        if d.weekday() == 1:
            ponte_days.add((d - timedelta(days=1)).strftime('%Y-%m-%d'))
        elif d.weekday() == 3:
            ponte_days.add((d + timedelta(days=1)).strftime('%Y-%m-%d'))
    c = 0
    cur = start
    while cur <= end:
        ds = cur.strftime('%Y-%m-%d')
        if cur.weekday() < 5 and ds not in hset and ds not in ponte_days:
            c += 1
        cur += timedelta(days=1)
    return c

def _month_windows(year: int) -> List[LegacyWindow]:
    wins: List[LegacyWindow] = []
    for m in range(1, 13):
        s = datetime(year, m, 1)
        if m == 12:
            e = datetime(year, 12, 31)
        else:
            e = datetime(year, m+1, 1) - timedelta(days=1)
        wins.append(LegacyWindow(id=f"{year}-{m:02d}", start=s.strftime('%Y-%m-%d'), end=e.strftime('%Y-%m-%d'), label=s.strftime('%d/%m/%Y a ') + e.strftime('%d/%m/%Y')))
    return wins

def _is_valid_start_monday_legacy(date: datetime, holidays: List[str]) -> bool:
    ds = date.strftime('%Y-%m-%d')
    if ds in holidays:
        return False
    p1 = (date + timedelta(days=1)).strftime('%Y-%m-%d')
    p2 = (date + timedelta(days=2)).strftime('%Y-%m-%d')
    if p1 in holidays or p2 in holidays:
        return False
    return True

def _br_holidays(year: int) -> List[str]:
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
        f"{year}-07-09",
    ]
    mov = [carnaval.strftime('%Y-%m-%d'), good_friday.strftime('%Y-%m-%d'), corpus.strftime('%Y-%m-%d')]
    return fixed + mov

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

def run_legacy_comparison(employees: List[Employee], req: LegacyComparisonRequest) -> LegacyComparisonResult:
    mondays = _mondays(req.year)
    windows = [LegacyWindow(id=w.id, start=w.start, end=w.end, label=w.label) for w in (req.windows or _month_windows(req.year))]
    total_impact = 0.0
    total_hours = 0
    rows: List[LegacyResultRow] = []
    client_counts: Dict[str, int] = {}
    for e in employees:
        cname = e.client_name or 'Desconhecido'
        client_counts[cname] = client_counts.get(cname, 0) + 1
    occupancy_by_window_client: Dict[str, Dict[str, int]] = {}

    if req.allocation_logic == 'rate_desc':
        employees = sorted(employees, key=lambda e: e.rate, reverse=True)
    elif req.allocation_logic == 'rate_asc':
        employees = sorted(employees, key=lambda e: e.rate)
    else:
        rates = [e.rate for e in employees]
        median = sorted(rates)[len(rates)//2] if rates else 0
        employees = sorted(employees, key=lambda e: abs(e.rate - median))

    for emp in employees:
        hols = _br_holidays(req.year) + _br_holidays(req.year + 1)
        strategy = req.strategy_preference
        if strategy == 'SMART_HYBRID':
            strategy = 'SELL_10' if emp.rate > 180 else 'STANDARD_30'
        periods: List[int] = []
        label = ''
        sell_days = int(req.sell_days or 0)
        if req.preset_periods:
            periods = list(req.preset_periods)
            label = 'Manual'
        else:
            if strategy == 'SELL_10':
                periods = [20]
                sell_days = 10
                label = 'Venda de 10 dias'
            elif strategy == 'SPLIT_2_PERIODS':
                periods = [15, 15]
                label = 'Divisão em 2 períodos'
            elif strategy == 'SPLIT_3_PERIODS':
                periods = [14, 8, 8]
                label = 'Divisão em 3 períodos'
            else:
                periods = [30]
                label = 'Padrão 30 dias'

        scheduled_starts: List[datetime] = []
        scheduled_ends: List[datetime] = []
        emp_hours = 0
        emp_impact = 0.0
        emp_window_hours: Dict[str, float] = {}
        emp_window_impacts: Dict[str, float] = {}
        constraint = datetime(req.year, 1, 1)
        for d in periods:
            valid_options: List[Tuple[float, float, datetime]] = []
            for m in mondays:
                if m < constraint:
                    continue
                if not _is_valid_start_monday_legacy(m, hols):
                    continue
                end = m + timedelta(days=d-1)
                if end.year > req.year + 1:
                    continue
                hours_candidate = 0
                valid = True
                for w in windows:
                    ws = datetime.strptime(w.start, '%Y-%m-%d')
                    we = datetime.strptime(w.end, '%Y-%m-%d')
                    iStart = max(m, ws)
                    iEnd = min(end, we)
                    if iStart <= iEnd:
                        hours_candidate += _business_days_with_pontes(iStart, iEnd, hols) * 8
                        cname = emp.client_name or 'Desconhecido'
                        max_allowed = max(1, int(client_counts.get(cname, 0) * 0.1))
                        if occupancy_by_window_client.get(w.id, {}).get(cname, 0) >= max_allowed:
                            valid = False
                            break
                if not valid:
                    continue
                cost = hours_candidate * emp.rate
                valid_options.append((cost, hours_candidate, m))

            if valid_options:
                # Use MEDIAN instead of MIN to represent "Typical/Random" behavior (Legacy)
                # This prevents Legacy from looking artificially perfect.
                valid_options.sort(key=lambda x: x[0])
                median_idx = len(valid_options) // 2
                chosen_cost, chosen_hours, chosen_start = valid_options[median_idx]
                
                start_date = chosen_start
                end = start_date + timedelta(days=d-1)
                scheduled_starts.append(start_date)
                scheduled_ends.append(end)
                emp_hours += chosen_hours
                emp_impact += chosen_cost
                constraint = end + timedelta(days=30)
                for w in windows:
                    ws = datetime.strptime(w.start, '%Y-%m-%d')
                    we = datetime.strptime(w.end, '%Y-%m-%d')
                    iStart = max(start_date, ws)
                    iEnd = min(end, we)
                    if iStart <= iEnd:
                        cname = emp.client_name or 'Desconhecido'
                        if w.id not in occupancy_by_window_client:
                            occupancy_by_window_client[w.id] = {}
                        occupancy_by_window_client[w.id][cname] = occupancy_by_window_client[w.id].get(cname, 0) + 1

        for w in windows:
            s = datetime.strptime(w.start, '%Y-%m-%d')
            e = datetime.strptime(w.end, '%Y-%m-%d')
            total_hours_in_win = 0
            total_impact_in_win = 0.0
            for i, st in enumerate(scheduled_starts):
                en = scheduled_ends[i]
                iStart = max(st, s)
                iEnd = min(en, e)
                if iStart <= iEnd:
                    bd = _business_days_with_pontes(iStart, iEnd, hols)
                    h = bd * 8
                    total_hours_in_win += h
                    total_impact_in_win += h * emp.rate
            if total_hours_in_win > 0:
                emp_window_hours[w.id] = float(total_hours_in_win)
                emp_window_impacts[w.id] = float(total_impact_in_win)

        worst_days = sum(periods) + sell_days
        worst_impact = emp.rate * 8 * worst_days
        savings = max(worst_impact - emp_impact, 0.0)
        savings_pct = (savings / worst_impact) if worst_impact else 0.0
        rows.append(LegacyResultRow(
            employee_id=emp.id,
            employee_name=emp.name,
            client_name=emp.client_name or 'Desconhecido',
            start_dates=[s.strftime('%Y-%m-%d') for s in scheduled_starts],
            end_dates=[e.strftime('%Y-%m-%d') for e in scheduled_ends],
            breakdown=' + '.join(str(x) for x in periods) + (f" + {sell_days} Abono" if sell_days else ''),
            total_impact=emp_impact,
            total_business_hours=emp_hours,
            window_impacts=emp_window_impacts,
            window_hours=emp_window_hours,
            worst_case_impact=worst_impact,
            savings=savings,
            savings_percent=savings_pct,
            vacation_type_label=label
        ))
        total_impact += emp_impact
        total_hours += emp_hours

    return LegacyComparisonResult(
        windows=windows,
        rows=rows,
        total_impact=total_impact,
        total_business_hours=total_hours,
        savings_total=sum(r.savings for r in rows),
        employees_count=len(rows)
    )
