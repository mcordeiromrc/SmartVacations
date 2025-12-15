
export interface Project {
  id: string; // Ex: 'PRJ-PRODESP'
  name: string;
  manager: string;
  budget: number;
  currency_code: string;
  start_date: string;
  end_date: string;
  status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  description?: string;
  // New Rules
  max_concurrency_percent: number; // Ex: 10%
  preferred_start_weekday: number; // 1 = Monday, 5 = Friday, etc.
  country_code: string; // 'BR', 'AR', 'CL', etc.
}

export interface Client {
  id: number;
  name: string; // Ex: 'CDHU', 'Detran' (O Cliente tomador do serviço)
  cnpj?: string;
  contact_person: string;
  email: string;
  project_ids: string[]; // Projetos contratados por este cliente
  status: 'ACTIVE' | 'INACTIVE';
}

// =========================================================
//  SmartVacations - Enterprise 1.0
//  (by Leonardo Baladão and Marcio Roberto Cordeiro - 2025)
// =========================================================

export interface Employee {
  id: number;
  name: string;
  admission_date: string;
  rate: number;
  client_id: number; // Foreign Key para Client
  client_name: string; // Denormalized for ease of display
  project_id: string; // O projeto macro
  local: string;
}

export interface MeasurementWindow {
  id: string;
  start: Date;
  end: Date;
  label: string;
  totalBusinessHours: number;
}

// Configuração do contexto de otimização
export interface OptimizationConfig {
  year: number;
  rules: VacationRules;
  strategy_preference: VacationStrategy['mode'];
  project_context: Project; // Otimização roda no contexto de um projeto
  windows?: MeasurementWindow[]; // Opcional: Para fatiamento de custos na view
}

export interface VacationStrategy {
  mode: 'STANDARD_30' | 'SELL_10' | 'SPLIT_2_PERIODS' | 'SPLIT_3_PERIODS' | 'SMART_HYBRID';
  label: string;
  description: string;
}

export interface VacationRules {
  standard_days: number;
  allow_split: boolean;
  min_main_period: number;
  min_other_period: number;
  sell_days_limit: number;
  allow_start_before_holiday: boolean;
  blackout_dates: string[];
}

export interface OptimizationJob {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  result?: OptimizationResult;
  created_at: string;
}

export interface Allocation {
  employee_id: number;
  employee_name: string;
  start_date: string;
  end_date: string;
  duration: number;
  cost_impact: number; // Custo considerando Pontes/Emendas
  billable_hours: number; // Horas reais faturáveis
  type: 'STANDARD' | 'SPLIT_1' | 'SPLIT_2' | 'SPLIT_3' | 'SOLD_10_DAYS' | 'ABONO_PECUNIARIO';
  warnings?: string[];
  // Detalhamento por janela (para grid complexa)
  window_impacts?: Record<string, number>;
  window_hours?: Record<string, number>;
}

export interface OptimizationResult {
  total_impact: number;
  financial_savings: number;
  allocations: Allocation[];
  clt_compliance_check: boolean;
  holiday_conflicts_avoided: number;
  monthly_revenue_target: number;
  monthly_cash_flow: Record<string, number>; // Novo: Fluxo de Caixa (Mês -> Valor)
  solver_method?: string; // 'ILP', 'HEURISTIC', or 'AI'
  optimization_time_seconds?: number; // Time taken to optimize
}

export interface Holiday {
  date: string;
  name: string;
  type: 'national' | 'state' | 'city';
  country?: string;
}
