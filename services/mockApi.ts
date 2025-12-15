
import { Employee, OptimizationConfig, OptimizationJob, OptimizationResult, Allocation } from '../types';
import { HolidayService } from './holidayApi';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to add days
const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

type OccupancyMap = Record<string, number>;

const generateResult = async (employees: Employee[], config: OptimizationConfig): Promise<OptimizationResult> => {
  let totalImpact = 0;
  let savings = 0;
  let conflictsAvoided = 0;
  const allocations: Allocation[] = [];
  const occupancy: OccupancyMap = {};
  const monthlyCashFlow: Record<string, number> = {};

  const monthlyRevenueTarget = config.project_context.budget / 12;
  const maxSimultaneousPeople = Math.ceil(employees.length * (config.project_context.max_concurrency_percent / 100));

  // Ordenar funcionários por Rate (Prioridade para os mais caros)
  const sortedEmployees = [...employees].sort((a, b) => b.rate - a.rate);

  for (const emp of sortedEmployees) {
    const holidays = await HolidayService.getHolidays(config.year, emp.local);

    let strategy = config.strategy_preference;
    if (strategy === 'SMART_HYBRID') {
        strategy = emp.rate > 180 ? 'SELL_10' : 'STANDARD_30';
    }

    let periods: number[] = [];
    let isSelling = false;

    if (strategy === 'SELL_10') {
        periods = [20];
        isSelling = true;
    } else if (strategy === 'SPLIT_2_PERIODS') {
        periods = [15, 15];
    } else if (strategy === 'SPLIT_3_PERIODS') {
        periods = [14, 8, 8];
    } else {
        periods = [30]; 
    }

    let periodStartDateConstraint = new Date(config.year, 0, 1);

    for (const duration of periods) {
        let bestStart: Date | null = null;
        let minCost = Infinity; // Agora buscamos o custo REAL mínimo (considerando pontes)
        let bestAllocatedHours = 0;

        // Otimização: Não apenas First Fit, mas Best Fit em uma janela de busca
        // Vamos olhar os primeiros 90 dias disponíveis para encontrar um bom slot "Ponte"
        let lookAheadDays = 90; 
        
        for (let i = 0; i < 360; i++) {
            const currentStart = addDays(new Date(config.year, 0, 1), i);
            
            if (currentStart < periodStartDateConstraint) continue;

            if (config.project_context.preferred_start_weekday > 0) {
                if (currentStart.getDay() !== config.project_context.preferred_start_weekday) continue;
            } else {
                if (currentStart.getDay() !== 1) continue;
            }

            if (!HolidayService.isValidStartDate(currentStart, holidays)) {
                conflictsAvoided++;
                continue;
            }

            const currentEnd = addDays(currentStart, duration - 1);
            
            let concurrencySafe = true;
            let tempDate = new Date(currentStart);
            while (tempDate <= currentEnd) {
                const dateKey = tempDate.toISOString().split('T')[0];
                if ((occupancy[dateKey] || 0) >= maxSimultaneousPeople) {
                    concurrencySafe = false;
                    break;
                }
                tempDate.setDate(tempDate.getDate() + 1);
            }
            if (!concurrencySafe) continue;

            // --- CÁLCULO DE CUSTO PRECISO (A JÓIA DO LEGADO) ---
            // Calcula horas úteis reais descontando Pontes e Feriados
            const realBillableHours = await HolidayService.getBridgeAwareBusinessHours(currentStart, currentEnd, emp.local);
            const currentCost = realBillableHours * emp.rate;

            if (currentCost < minCost) {
                minCost = currentCost;
                bestStart = currentStart;
                bestAllocatedHours = realBillableHours;
            }

            // Otimização heurística
            lookAheadDays--;
            if (lookAheadDays <= 0 && bestStart) break; 
        }

        if (bestStart) {
            const actualEnd = addDays(bestStart, duration - 1);
            
            // Registrar Ocupação
            let tempOcc = new Date(bestStart);
            while (tempOcc <= actualEnd) {
                const k = tempOcc.toISOString().split('T')[0];
                occupancy[k] = (occupancy[k] || 0) + 1;
                tempOcc.setDate(tempOcc.getDate() + 1);
            }

            // Atualizar Fluxo de Caixa Mensal
            const monthKey = bestStart.toLocaleString('pt-BR', { month: 'short' }).toUpperCase();
            monthlyCashFlow[monthKey] = (monthlyCashFlow[monthKey] || 0) + minCost;

            totalImpact += minCost;

            // --- WINDOW SLICING LOGIC ---
            // Calculate how much of this vacation falls into each user-defined window
            const windowImpacts: Record<string, number> = {};
            const windowHours: Record<string, number> = {};

            if (config.windows) {
                for (const win of config.windows) {
                    // Check overlap
                    // Convert dates to timestamps for comparison
                    const winStart = new Date(win.start).getTime();
                    const winEnd = new Date(win.end).getTime();
                    const vacStart = bestStart.getTime();
                    const vacEnd = actualEnd.getTime();

                    const overlapStart = Math.max(winStart, vacStart);
                    const overlapEnd = Math.min(winEnd, vacEnd);

                    if (overlapStart <= overlapEnd) {
                        const overlapStartDate = new Date(overlapStart);
                        const overlapEndDate = new Date(overlapEnd);
                        
                        const hoursInWindow = await HolidayService.getBridgeAwareBusinessHours(overlapStartDate, overlapEndDate, emp.local);
                        const costInWindow = hoursInWindow * emp.rate;

                        windowImpacts[win.id] = costInWindow;
                        windowHours[win.id] = hoursInWindow;
                    }
                }
            }

            allocations.push({
                employee_id: emp.id,
                employee_name: emp.name,
                start_date: bestStart.toISOString().split('T')[0],
                end_date: actualEnd.toISOString().split('T')[0],
                duration: duration,
                cost_impact: minCost,
                billable_hours: bestAllocatedHours,
                type: isSelling && duration === 20 ? 'SOLD_10_DAYS' : duration < 30 ? 'SPLIT_1' : 'STANDARD',
                window_impacts: windowImpacts,
                window_hours: windowHours
            });

            periodStartDateConstraint = addDays(actualEnd, 30);
        }
    }

    if (isSelling) {
        const savingAmount = emp.rate * 8 * 10;
        savings += savingAmount;
        
        allocations.push({
            employee_id: emp.id,
            employee_name: emp.name,
            start_date: addDays(periodStartDateConstraint, -10).toISOString().split('T')[0],
            end_date: periodStartDateConstraint.toISOString().split('T')[0],
            duration: 10,
            cost_impact: 0,
            billable_hours: 80,
            type: 'ABONO_PECUNIARIO',
            window_impacts: {},
            window_hours: {}
        });
    }
  }

  return {
    total_impact: totalImpact,
    financial_savings: savings,
    allocations: allocations.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()),
    clt_compliance_check: true,
    holiday_conflicts_avoided: conflictsAvoided,
    monthly_revenue_target: monthlyRevenueTarget,
    monthly_cash_flow: monthlyCashFlow
  };
};

export const MockOptimizationService = {
  trigger: async (employees: Employee[], config: OptimizationConfig): Promise<string> => {
    await delay(800); 
    const jobId = Math.random().toString(36).substring(7);
    sessionStorage.setItem(`job_${jobId}`, JSON.stringify({
      id: jobId, status: 'PENDING', created_at: new Date().toISOString()
    }));
    setTimeout(async () => {
        const result = await generateResult(employees, config);
        sessionStorage.setItem(`job_${jobId}`, JSON.stringify({
            id: jobId, status: 'SUCCESS', result: result, created_at: new Date().toISOString()
        }));
    }, 2000); 
    return jobId;
  },
  getStatus: async (jobId: string): Promise<OptimizationJob> => {
    await delay(200);
    const stored = sessionStorage.getItem(`job_${jobId}`);
    if (!stored) throw new Error("Job not found");
    return JSON.parse(stored);
  }
};
