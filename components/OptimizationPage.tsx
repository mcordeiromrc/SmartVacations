
// =========================================================
//  SmartVacations - Enterprise 1.0
//  (by Leonardo Baladão and Marcio Roberto Cordeiro - 2025)
// =========================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
    Play,
    CheckCircle,
    Loader2,
    AlertTriangle,
    Calendar,
    DollarSign,
    TrendingDown,
    Info,
    ShieldCheck,
    Split,
    Banknote,
    Target,
    Globe,
    BarChart2,
    Download,
    Table as TableIcon,
    Layout as LayoutIcon,
    FileText,
    Filter,
    Settings,
    Trash2,
    X,
    ChevronDown,
    ChevronUp,
    Save
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, ReferenceLine } from 'recharts';
import { Employee, OptimizationJob, OptimizationResult, Project, VacationRules, VacationStrategy, MeasurementWindow } from '../types';
import { HolidayService } from '../services/holidayApi';

interface OptimizationPageProps {
    employees: Employee[];
    projectConfig: Project;
    vacationRules: VacationRules;
}

const STRATEGIES: VacationStrategy[] = [
    { mode: 'STANDARD_30', label: 'Padrão CLT (30 Dias)', description: '30 dias contínuos.' },
    { mode: 'SELL_10', label: 'Otimizar Abono (20+10)', description: 'Vende 1/3 das férias.' },
    { mode: 'SPLIT_2_PERIODS', label: 'Fracionado (15+15)', description: '2 períodos iguais.' },
    { mode: 'SPLIT_3_PERIODS', label: 'Máx Fracionamento', description: '3 períodos (14+8+8).' },
    { mode: 'SMART_HYBRID', label: 'Híbrido Inteligente', description: 'Melhor estratégia por pessoa.' },
];

const OptimizationPage: React.FC<OptimizationPageProps> = ({ employees, projectConfig, vacationRules }) => {
    // Configuration State (Legacy UI Style)
    const [startDay, setStartDay] = useState(21);
    const [endDay, setEndDay] = useState(20);
    const [baseYear, setBaseYear] = useState(new Date().getFullYear());
    const [useDateRange, setUseDateRange] = useState(false);
    const [baseStartDate, setBaseStartDate] = useState<Date | null>(null);
    const [baseEndDate, setBaseEndDate] = useState<Date | null>(null);
    const expectedRevenue = 7343312.00;
    const [windows, setWindows] = useState<MeasurementWindow[]>([]);
    const [isConfigExpanded, setIsConfigExpanded] = useState(true); // State to toggle config panel
    const [excludeNewEmployees, setExcludeNewEmployees] = useState(false);

    // Optimization State
    const [jobId, setJobId] = useState<string | null>(null);
    const [status, setStatus] = useState<OptimizationJob['status'] | null>(null);
    const [result, setResult] = useState<OptimizationResult | null>(null);
    const [polling, setPolling] = useState(false);
    const [selectedStrategy, setSelectedStrategy] = useState<VacationStrategy['mode']>('STANDARD_30');
    const [activeTab, setActiveTab] = useState<'grid' | 'comparison' | 'dashboard'>('grid');
    const [useAI, setUseAI] = useState(false);
    const [useAdvancedSolver, setUseAdvancedSolver] = useState(true);
    const [solverTimeout, setSolverTimeout] = useState(300);

    // Simulation Persistence State
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [simName, setSimName] = useState("");
    const [savedSimulations, setSavedSimulations] = useState<any[]>([]);

    const handleSaveSimulation = async () => {
        if (!simName.trim()) { alert("Digite um nome para a simulação."); return; }
        try {
            const payload = {
                name: simName,
                project_id: projectConfig.id,
                configuration: {
                    year: baseYear,
                    rules: vacationRules,
                    strategy_preference: selectedStrategy,
                    project_context: projectConfig,
                    windows: windows.map(w => ({ id: w.id, start: w.start.toISOString().split('T')[0], end: w.end.toISOString().split('T')[0], label: w.label })),
                    use_ai: useAI,
                    use_advanced_solver: useAdvancedSolver
                },
                result: result
            };
            const res = await fetch("/optimization/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert("Simulação salva com sucesso!");
                setShowSaveModal(false);
                setSimName("");
            } else {
                alert("Erro ao salvar simulação.");
            }
        } catch (error) {
            console.error(error);
            alert("Erro de conexão ao salvar.");
        }
    };

    const loadSimulations = async () => {
        try {
            const res = await fetch(`/optimization/simulations?project_id=${projectConfig.id}`);
            if (res.ok) {
                const data = await res.json();
                setSavedSimulations(data);
                setShowLoadModal(true);
            }
        } catch (error) {
            console.error(error);
            alert("Erro ao carregar simulações.");
        }
    };

    const handleLoadSimulation = (sim: any) => {
        // Restore State
        if (sim.result) setResult(sim.result);
        if (sim.configuration) {
            // Restore windows if possible, need to parse dates back
            if (sim.configuration.windows) {
                const restoredWindows = sim.configuration.windows.map((w: any) => ({
                    ...w,
                    start: new Date(w.start),
                    end: new Date(w.end),
                    totalBusinessHours: 0 // Would need to re-calc or store
                }));
                // Ideally re-calc business hours here or store them. For MVP just restore structure.
                setWindows(restoredWindows);
            }
        }
        setShowLoadModal(false);
        setActiveTab('grid');
    };

    const availableStrategies = useMemo(() => {
        return STRATEGIES.filter(st => {
            if (st.mode === 'STANDARD_30' || st.mode === 'SMART_HYBRID') return true;
            if (st.mode === 'SELL_10') return vacationRules.sell_days_limit >= 10;
            if (st.mode.includes('SPLIT')) return vacationRules.allow_split;
            return true;
        });
    }, [vacationRules.allow_split, vacationRules.sell_days_limit]);

    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filters, setFilters] = useState<{
        employeeId?: number | null;
        employeeName?: string | null;
        clientName?: string | null;
        rateMin?: number | null;
        rateMax?: number | null;
        startDate?: string | null;
        endDate?: string | null;
    }>({});
    const [pendingFilters, setPendingFilters] = useState<{
        employeeId?: number | null;
        employeeName?: string | null;
        clientName?: string | null;
        rateMin?: number | null;
        rateMax?: number | null;
        startDate?: string | null;
        endDate?: string | null;
    }>({});
    const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);
    const clientsList = useMemo(() => {
        const set = new Set<string>();
        employees.forEach(e => { if (e.client_name) set.add(e.client_name); });
        return Array.from(set);
    }, [employees]);
    const filteredAllocations = useMemo(() => {
        const allocs = result?.allocations || [];
        return allocs.filter(a => {
            const emp = employees.find(e => e.id === a.employee_id);
            if (!emp) return false;
            if (filters.employeeId && a.employee_id !== filters.employeeId) return false;
            if (filters.employeeName && !((emp.name || '').toLowerCase().startsWith((filters.employeeName || '').toLowerCase()))) return false;
            if (filters.clientName && emp.client_name !== filters.clientName) return false;
            if (filters.rateMin && (emp.rate || 0) < (filters.rateMin || 0)) return false;
            if (filters.rateMax && (emp.rate || 0) > (filters.rateMax || 0)) return false;
            if (filters.startDate && new Date(a.start_date) < new Date(filters.startDate)) return false;
            if (filters.endDate && new Date(a.end_date) > new Date(filters.endDate)) return false;
            return true;
        });
    }, [result, employees, filters]);
    const isFiltered = useMemo(() => {
        const f = filters;
        return !!(f.employeeId || f.employeeName || f.clientName || f.rateMin || f.rateMax || f.startDate || f.endDate);
    }, [filters]);
    const clearFilters = () => {
        setFilters({});
        setPendingFilters({});
    };
    const totalImpactFiltered = useMemo(() => {
        return filteredAllocations.reduce((s, a) => s + (a.cost_impact || 0), 0);
    }, [filteredAllocations]);

    useEffect(() => {
        const isAvailable = availableStrategies.find(s => s.mode === selectedStrategy);
        if (!isAvailable) {
            setSelectedStrategy('STANDARD_30');
        }
    }, [availableStrategies, selectedStrategy]);

    // --- WINDOW GENERATION LOGIC (FROM LEGACY) ---
    const generateWindowsManual = async () => {
        if (startDay < 1 || startDay > 31 || endDay < 1 || endDay > 31) {
            alert("Dias inválidos. Por favor verifique.");
            return;
        }

        const newWindows: MeasurementWindow[] = [];

        const makeStartForMonth = (y: number, m: number) => {
            const lastDay = new Date(y, m + 1, 0).getDate();
            const d = Math.min(startDay, lastDay);
            return new Date(y, m, d);
        };
        const makeEndForMonth = (y: number, m: number) => {
            let endMonth = m;
            let endYear = y;
            if (endDay < startDay) {
                endMonth = m + 1;
                if (endMonth > 11) { endMonth = 0; endYear++; }
            }
            const lastDay = new Date(endYear, endMonth + 1, 0).getDate();
            const d = Math.min(endDay, lastDay);
            return new Date(endYear, endMonth, d);
        };

        if (useDateRange) {
            if (!baseStartDate || !baseEndDate) {
                alert('Selecione Data Base inicial e final.');
                return;
            }
            if (baseStartDate.getTime() > baseEndDate.getTime()) {
                alert('Data Base inicial deve ser anterior à final.');
                return;
            }
            let y = baseStartDate.getFullYear();
            let m = baseStartDate.getMonth();
            let idx = 0;
            while (true) {
                const start = makeStartForMonth(y, m);
                const end = makeEndForMonth(y, m);
                const startClamped = start.getTime() < baseStartDate.getTime() ? baseStartDate : start;
                const endClamped = end.getTime() > baseEndDate.getTime() ? baseEndDate : end;
                if (startClamped.getTime() > baseEndDate.getTime()) break;
                // Skip windows that end before start boundary
                if (endClamped.getTime() >= baseStartDate.getTime()) {
                    const businessHours = await HolidayService.getBridgeAwareBusinessHours(startClamped, endClamped, 'São Paulo');
                    newWindows.push({
                        id: `win_${idx}`,
                        start: startClamped,
                        end: endClamped,
                        label: `${startClamped.toLocaleDateString('pt-BR')} a ${endClamped.toLocaleDateString('pt-BR')}`,
                        totalBusinessHours: businessHours
                    });
                    idx++;
                }
                m += 1;
                if (m > 11) { m = 0; y += 1; }
                const nextStart = makeStartForMonth(y, m);
                if (nextStart.getTime() > baseEndDate.getTime()) break;
                if (idx > 120) break; // safety guard for very long spans
            }
        } else {
            let currentDate = new Date(baseYear, 0, startDay);
            for (let i = 0; i < 12; i++) {
                const start = new Date(currentDate);
                const end = makeEndForMonth(start.getFullYear(), start.getMonth());
                const businessHours = await HolidayService.getBridgeAwareBusinessHours(start, end, 'São Paulo');
                newWindows.push({ id: `win_${i}`, start, end, label: `${start.toLocaleDateString('pt-BR')} a ${end.toLocaleDateString('pt-BR')}`, totalBusinessHours: businessHours });
                let nextStartMonth = start.getMonth() + 1;
                let nextStartYear = start.getFullYear();
                if (nextStartMonth > 11) { nextStartMonth = 0; nextStartYear++; }
                const lastDayOfNextStartMonth = new Date(nextStartYear, nextStartMonth + 1, 0).getDate();
                const actualStartDay = Math.min(startDay, lastDayOfNextStartMonth);
                currentDate = new Date(nextStartYear, nextStartMonth, actualStartDay);
            }
        }
        setWindows(newWindows);
        setResult(null);
    };

    const handleRemoveWindow = (id: string) => {
        setWindows(prev => prev.filter(w => w.id !== id));
        if (result) setResult(null);
    };

    // --- OPTIMIZATION TRIGGER ---
    const handleOptimize = async () => {
        if (windows.length === 0) {
            alert("Por favor, gere as Janelas de Medição primeiro (Botão 'Gerar Janelas').");
            return;
        }

        try {
            setStatus('PENDING');
            setResult(null);
            setActiveTab('grid');
            const aiCfgRaw = localStorage.getItem('sv.ai.config');
            let ai_config: any = undefined;
            if (useAI && aiCfgRaw) {
                try {
                    const obj = JSON.parse(aiCfgRaw);
                    ai_config = { provider: obj.provider, model: obj.model, api_key: obj.apiKey, prompt: obj.prompt || null };
                    if (!ai_config?.provider || !ai_config?.model || !ai_config?.api_key) {
                        alert('Configuração IA incompleta. Preencha Provedor, Modelo e API Key em Configuração IA.');
                        setStatus('FAILED');
                        return;
                    }
                    const employeesInProject = employees.filter(e => e.project_id === projectConfig.id);
                    if (employeesInProject.length === 0) {
                        alert('Nenhum colaborador encontrado para o projeto selecionado. Verifique o cadastro.');
                        setStatus('FAILED');
                        return;
                    }
                } catch (_) {
                    ai_config = undefined;
                }
            }
            const effectiveYear = useDateRange && baseStartDate ? baseStartDate.getFullYear() : baseYear;
            const referenceDate = (() => {
                if (useDateRange && baseStartDate) return baseStartDate;
                if (windows.length > 0) {
                    const minTs = Math.min(...windows.map(w => w.start.getTime()));
                    return new Date(minTs);
                }
                return new Date(effectiveYear, 0, 1);
            })();
            const effectiveEmployees = excludeNewEmployees ? employees.filter(e => {
                const adm = new Date(e.admission_date);
                if (!isFinite(adm.getTime())) return false;
                const diffMs = referenceDate.getTime() - adm.getTime();
                return diffMs >= 365 * 24 * 60 * 60 * 1000;
            }) : employees;
            const payload = {
                year: effectiveYear,
                date_range_start: useDateRange && baseStartDate ? baseStartDate.toISOString().split('T')[0] : null,
                date_range_end: useDateRange && baseEndDate ? baseEndDate.toISOString().split('T')[0] : null,
                rules: vacationRules,
                strategy_preference: selectedStrategy,
                project_context: projectConfig,
                windows: windows.map(w => ({ id: w.id, start: w.start.toISOString().split('T')[0], end: w.end.toISOString().split('T')[0], label: w.label })),
                employees: effectiveEmployees,
                ai_config,
                use_ai: useAI,
                use_advanced_solver: useAdvancedSolver,
                solver_timeout: solverTimeout
            };
            const res = await fetch('/optimization/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const job: OptimizationJob = await res.json();
            setJobId(job.id);
            setPolling(true);
            setIsConfigExpanded(false);
        } catch (error) {
            console.error('Optimization trigger failed', error);
            setStatus('FAILED');
        }
    };

    useEffect(() => {
        let interval: number | undefined;
        if (polling && jobId) {
            interval = window.setInterval(async () => {
                try {
                    const res = await fetch(`/optimization/jobs/${jobId}`);
                    const job: OptimizationJob = await res.json();
                    setStatus(job.status);
                    if (job.status === 'SUCCESS' || job.status === 'FAILED') {
                        setPolling(false);
                        if (job.result) setResult(job.result);
                    }
                } catch (e) {
                    setPolling(false);
                    setStatus('FAILED');
                }
            }, 1000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [polling, jobId]);

    // Helpers
    const currencyCode = projectConfig.currency_code || 'BRL';
    const locale = currencyCode === 'BRL' ? 'pt-BR' : (
        currencyCode === 'ARS' ? 'es-AR' :
            currencyCode === 'CLP' ? 'es-CL' :
                currencyCode === 'COP' ? 'es-CO' :
                    currencyCode === 'MXN' ? 'es-MX' :
                        currencyCode === 'PEN' ? 'es-PE' :
                            currencyCode === 'UYU' ? 'es-UY' :
                                currencyCode === 'PYG' ? 'es-PY' :
                                    currencyCode === 'BOB' ? 'es-BO' : 'pt-BR'
    );
    const formatCurrency = (val: number) => val.toLocaleString(locale, { style: 'currency', currency: currencyCode, minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formatHours = (h: number) => {
        const hh = Math.floor(h);
        const mm = Math.round((h - hh) * 60);
        return `${hh}:${String(mm).padStart(2, '0')}`;
    };
    const formatWindowHeaderHours = (h: number) => {
        const totalHours = Math.floor(h);
        return `(${String(totalHours).padStart(3, '0')}:00)`;
    };
    const getEmployeeDetails = (id: number) => employees.find(e => e.id === id);

    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const cashData = useMemo(() => {
        const sums: Record<string, number> = {};
        months.forEach(m => { sums[m] = 0; });
        filteredAllocations.forEach(a => {
            const d = new Date(a.start_date);
            const mk = months[d.getMonth()];
            sums[mk] = (sums[mk] || 0) + (a.cost_impact || 0);
        });
        return months.map(m => ({ name: m, valor: sums[m] || 0 }));
    }, [filteredAllocations]);
    const scheduleData = useMemo(() => {
        const counts: Record<string, number> = {} as Record<string, number>;
        months.forEach(m => { counts[m] = 0; });
        if (filteredAllocations) {
            filteredAllocations.forEach(a => {
                const d = new Date(a.start_date);
                const idx = d.getMonth();
                const mk = months[idx];
                counts[mk] = (counts[mk] || 0) + 1;
            });
        }
        return months.map(m => ({ name: m, inicios: counts[m] || 0 }));
    }, [filteredAllocations]);
    const strategyLabel = useMemo(() => {
        const found = STRATEGIES.find(s => s.mode === selectedStrategy);
        return found?.label || selectedStrategy;
    }, [selectedStrategy]);
    const comparisonData = useMemo(() => {
        if (!filteredAllocations || filteredAllocations.length === 0) return [] as Array<{ employee_id: number; employee_name: string; label: string; rate: number; worst: number; total: number; savings: number; savings_pct: number }>;
        const byEmp: Record<number, number> = {};
        filteredAllocations.forEach(a => { byEmp[a.employee_id] = (byEmp[a.employee_id] || 0) + (a.cost_impact || 0); });
        const ids = Object.keys(byEmp).map(id => parseInt(id, 10));
        return ids.map(id => {
            const emp = getEmployeeDetails(id);
            const rate = emp?.rate || 0;
            const worst = 30 * 8 * rate;
            const total = byEmp[id] || 0;
            const savings = Math.max(worst - total, 0);
            const savings_pct = worst ? (savings / worst) : 0;
            return { employee_id: id, employee_name: emp?.name || String(id), label: strategyLabel, rate, worst, total, savings, savings_pct };
        });
    }, [filteredAllocations, employees, strategyLabel]);

    const buildExportTable = () => {
        if (!result) return { headers: [], rows: [] };
        const headers = [
            'Colaborador',
            'Cliente',
            'Rate',
            'Início',
            'Fim',
            'Dias',
            'Horas Úteis',
            'Custo Total'
        ];
        windows.forEach(w => {
            headers.push(`Impacto - ${w.label}`);
            headers.push(`Horas - ${w.label} ${formatWindowHeaderHours(Number(w.totalBusinessHours || 0))}`);
        });

        const rows = result.allocations.map(alloc => {
            const empDetails = getEmployeeDetails(alloc.employee_id);
            const base = [
                alloc.employee_name,
                empDetails?.client_name || '-',
                empDetails?.rate ? formatCurrency(empDetails.rate) : '-',
                new Date(alloc.start_date).toLocaleDateString('pt-BR'),
                new Date(alloc.end_date).toLocaleDateString('pt-BR'),
                String(alloc.duration),
                formatHours(Number(alloc.billable_hours || 0)),
                formatCurrency(alloc.cost_impact)
            ];
            windows.forEach(w => {
                const winImpact = alloc.window_impacts?.[w.id];
                const winHours = alloc.window_hours?.[w.id];
                base.push(winImpact && winImpact > 0 ? formatCurrency(winImpact) : '');
                base.push(winHours && winHours > 0 ? formatHours(Number(winHours)) : '');
            });
            return base;
        });

        return { headers, rows };
    };

    const exportCSV = () => {
        const { headers, rows } = buildExportTable();
        const sep = ';';
        const footer = "SmartVacations - Enterprise - (by Leonardo Baladão and Marcio Roberto Cordeiro - 2025)";

        let csvContent = headers.join(sep) + '\n';
        csvContent += rows.map(r => r.map(v => typeof v === 'string' ? `"${String(v).replace(/"/g, '""')}"` : v).join(sep)).join('\n');
        csvContent += '\n\n' + footer; // Footer at the end

        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Otimizacao_Ferias_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const exportExcel = () => {
        const { headers, rows } = buildExportTable();
        const footer = "SmartVacations - Enterprise - (by Leonardo Baladão and Marcio Roberto Cordeiro - 2025)";

        const tableHead = `<tr>${headers.map(h => `<th style="border:1px solid #ccc;padding:4px">${h}</th>`).join('')}</tr>`;
        const tableBody = rows.map(r => `<tr>${r.map(c => `<td style="border:1px solid #eee;padding:4px">${c}</td>`).join('')}</tr>`).join('');
        const tableFooter = `<tr><td colspan="${headers.length}" style="text-align:right;padding:10px;font-style:italic;color:#666;font-size:10px;">${footer}</td></tr>`;

        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><table>${tableHead}${tableBody}${tableFooter}</table></body></html>`;
        const blob = new Blob([html], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Otimizacao_Ferias_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const exportPDF = () => {
        const { headers, rows } = buildExportTable();
        const footerText = "SmartVacations - Enterprise - (by Leonardo Baladão and Marcio Roberto Cordeiro - 2025)";

        const head = `<tr>${headers.map(h => `<th style="border-bottom:1px solid #ddd;text-align:left;padding:6px;font-size:10px">${h}</th>`).join('')}</tr>`;
        const body = rows.map(r => `<tr>${r.map(c => `<td style="border-bottom:1px solid #f0f0f0;padding:6px;font-size:10px">${c}</td>`).join('')}</tr>`).join('');
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Relatório de Otimização</title>
            <style>
                body{font-family:Arial, sans-serif; font-size:10px;} 
                table{width:100%;border-collapse:collapse; margin-bottom: 20px;} 
                .footer { text-align: right; font-size: 8px; color: #666; margin-top: 20px; border-top: 1px solid #ccc; padding-top: 5px; }
                @media print { table { page-break-inside:auto } tr { page-break-inside:avoid; page-break-after:auto } }
            </style>
        </head>
        <body>
            <h3>Relatório de Otimização de Férias</h3>
            <table>${head}${body}</table>
            <div class="footer">${footerText}</div>
        </body>
        </html>`;

        const w = window.open('', '_blank');
        if (!w) return;
        w.document.open();
        w.document.write(html);
        w.document.close();
        w.focus();
        w.print();
    };

    return (
        <div className="w-full max-w-none space-y-6 pb-10 px-4">

            {/* HEADER */}
            <div className="flex justify-between items-end border-b border-slate-200 pb-2">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Target className="w-6 h-6 text-blue-700" /> Motor de Otimização ILP
                    </h1>
                    <p className="text-xs text-slate-500">Programação Linear Inteira - Solução Matematicamente Ótima</p>
                </div>
                <div className="text-xs text-slate-400 font-mono">Engine: PuLP/CBC</div>
            </div>

            {/* CONFIGURATION PANEL (COLLAPSIBLE) */}
            <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
                <div
                    className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => setIsConfigExpanded(!isConfigExpanded)}
                >
                    <div className="flex items-center gap-2 text-slate-700 font-bold text-sm uppercase">
                        <Settings className="w-4 h-4" /> Configuração do Modelo e Janelas
                    </div>
                    <div className="text-slate-400 flex items-center gap-2">
                        {!isConfigExpanded && windows.length > 0 && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{windows.length} Janelas Configuradas</span>}
                        {isConfigExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                </div>

                {isConfigExpanded && (
                    <div className="p-5 space-y-5 animate-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Strategy Selector */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                                    <Filter className="w-3 h-3" /> Estratégia Preferencial
                                </label>
                                <select
                                    value={selectedStrategy}
                                    onChange={(e) => setSelectedStrategy(e.target.value as VacationStrategy['mode'])}
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white font-medium text-slate-800"
                                >
                                    {availableStrategies.map(st => (
                                        <option key={st.mode} value={st.mode}>{st.label}</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-slate-400 mt-1">{availableStrategies.find(s => s.mode === selectedStrategy)?.description}</p>
                            </div>

                            {/* Expected Revenue */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                    <DollarSign className="w-3 h-3" /> Faturamento Esperado (Anual)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={expectedRevenue}
                                    disabled
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-100 text-slate-500"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                    Target Mensal: {formatCurrency(expectedRevenue / 12)}
                                </p>
                            </div>

                            {/* Active Rules Badge */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Regras Ativas</label>
                                <div className="flex flex-wrap gap-2">
                                    <RuleBadge active={true} label={`Max ${projectConfig.max_concurrency_percent}% Simultâneo`} icon={Target} />
                                    <RuleBadge active={true} label={`Início: Dia ${projectConfig.preferred_start_weekday}`} icon={Calendar} />
                                    <RuleBadge active={true} label="Súmula 171 (2 Dias)" icon={ShieldCheck} />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 space-y-3">
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                    <input type="checkbox" checked={useAdvancedSolver} onChange={e => setUseAdvancedSolver(e.target.checked)} className="w-4 h-4" /> Usar Solver ILP (Recomendado)
                                </label>
                                <p className="text-[10px] text-slate-400 mt-1">Programação Linear Inteira garante solução ótima. Desative para usar heurística rápida.</p>
                            </div>
                            {useAdvancedSolver && (
                                <div className="ml-6">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Timeout do Solver (segundos)</label>
                                    <input
                                        type="number"
                                        value={solverTimeout}
                                        onChange={e => setSolverTimeout(Number(e.target.value))}
                                        min="30"
                                        max="600"
                                        className="w-32 border border-slate-300 rounded px-3 py-1 text-sm"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">Tempo máximo para encontrar solução ótima (30-600s)</p>
                                </div>
                            )}
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                    <input type="checkbox" checked={useAI} onChange={e => setUseAI(e.target.checked)} className="w-4 h-4" /> Calcular com IA <span className="text-red-600 font-normal ml-1">(Em desenvolvimento)</span>
                                </label>
                                <p className="text-[10px] text-slate-400 mt-1">Quando ativo, usa OpenAI com seu prompt para gerar a grade.</p>
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                    <input type="checkbox" checked={excludeNewEmployees} onChange={e => setExcludeNewEmployees(e.target.checked)} className="w-4 h-4" /> Excluir colaboradores com menos de 1 ano de admissão
                                </label>
                            </div>
                        </div>

                        {/* WINDOWS DEFINITION */}
                        <div className="pt-2 border-t border-slate-100">
                            <div className="text-xs font-bold text-slate-400 uppercase mb-3">Definição de Janelas (Medição)</div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Dia Início</label>
                                    <input type="number" value={startDay} onChange={(e) => setStartDay(Number(e.target.value))} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Dia Fim</label>
                                    <input type="number" value={endDay} onChange={(e) => setEndDay(Number(e.target.value))} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Período de Medição</label>
                                    <div className="flex items-center gap-3">
                                        <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                            <input type="checkbox" checked={useDateRange} onChange={e => setUseDateRange(e.target.checked)} className="w-4 h-4" /> Usar Data Base (Período)
                                        </label>
                                        {!useDateRange && (
                                            <>
                                                <span className="text-[10px] text-slate-500">Ano Base</span>
                                                <input type="number" value={baseYear} onChange={(e) => setBaseYear(Number(e.target.value))} className="w-24 border border-slate-300 rounded px-2 py-1 text-sm" />
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={generateWindowsManual} className="flex-1 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded text-sm font-bold flex items-center justify-center gap-2">
                                        <Calendar className="w-4 h-4" /> Gerar Janelas
                                    </button>
                                    {windows.length > 0 && (
                                        <button onClick={() => { setWindows([]); setResult(null); }} className="px-3 py-2 border border-slate-300 rounded hover:bg-red-50 hover:border-red-200 text-slate-500 hover:text-red-600">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            {/* SIMULATION BUTTONS */}
                            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 justify-end">
                                <button
                                    onClick={() => setShowSaveModal(true)}
                                    disabled={!result}
                                    className={`px-4 py-2 rounded text-sm font-bold flex items-center gap-2 ${!result ? 'bg-slate-100 text-slate-400' : 'bg-green-600 text-white hover:bg-green-700'}`}
                                >
                                    <Save className="w-4 h-4" /> Salvar Simulação
                                </button>
                                <button
                                    onClick={loadSimulations}
                                    className="px-4 py-2 rounded text-sm font-bold flex items-center gap-2 bg-slate-600 text-white hover:bg-slate-700"
                                >
                                    <Filter className="w-4 h-4" /> Simulações Salvas
                                </button>
                            </div>

                            {/* MODALS */}
                            {showSaveModal && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                                    <div className="bg-white p-6 rounded shadow-lg w-96">
                                        <h3 className="text-lg font-bold mb-4">Salvar Simulação</h3>
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Nome do Cenário (ex: Cenário Otimista)"
                                            value={simName}
                                            onChange={e => setSimName(e.target.value)}
                                            className="w-full border border-slate-300 rounded px-3 py-2 mb-4"
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setShowSaveModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded">Cancelar</button>
                                            <button onClick={handleSaveSimulation} className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800">Salvar</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {showLoadModal && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                                    <div className="bg-white p-6 rounded shadow-lg w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-bold">Simulações Salvas</h3>
                                            <button onClick={() => setShowLoadModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
                                        </div>
                                        <div className="overflow-y-auto flex-1 space-y-2 pr-2">
                                            {savedSimulations.length === 0 ? (
                                                <p className="text-slate-500 text-center py-8">Nenhuma simulação salva.</p>
                                            ) : (
                                                savedSimulations.map((sim: any) => (
                                                    <div key={sim.id} onClick={() => handleLoadSimulation(sim)} className="border border-slate-200 p-3 rounded hover:bg-blue-50 cursor-pointer flex justify-between items-center transition-colors">
                                                        <div>
                                                            <div className="font-bold text-slate-800">{sim.name}</div>
                                                            <div className="text-xs text-slate-500">{new Date(sim.created_at).toLocaleString()}</div>
                                                        </div>
                                                        <div className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                                            Carregar
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {useDateRange && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Data Base Inicial</label>
                                        <input type="date" value={baseStartDate ? baseStartDate.toISOString().split('T')[0] : ''} onChange={e => setBaseStartDate(e.target.value ? new Date(e.target.value) : null)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Data Base Final</label>
                                        <input type="date" value={baseEndDate ? baseEndDate.toISOString().split('T')[0] : ''} onChange={e => setBaseEndDate(e.target.value ? new Date(e.target.value) : null)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* GENERATED WINDOWS DISPLAY */}
                        {windows.length > 0 && (
                            <div className="mt-4 pt-2 border-t border-slate-100">
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Janelas Geradas ({windows.length}):</h4>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
                                    {windows.map(w => (
                                        <div key={w.id} className="group relative min-w-[180px] px-3 py-3 bg-blue-50 border border-blue-200 text-blue-800 rounded text-xs flex items-center justify-between gap-2 shadow-sm flex-shrink-0">
                                            <div><div className="font-bold">{w.label}</div></div>
                                            <button onClick={() => handleRemoveWindow(w.id)} className="p-1 hover:bg-blue-200 rounded-full text-blue-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-center pt-2">
                                    <button
                                        onClick={handleOptimize}
                                        disabled={status === 'PENDING' || status === 'PROCESSING' || windows.length === 0}
                                        className={`flex items-center gap-3 px-8 py-3 rounded-full text-sm font-bold shadow-md transition-all transform hover:scale-105
                                ${(status === 'PENDING' || status === 'PROCESSING' || windows.length === 0)
                                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                : 'bg-blue-700 hover:bg-blue-800 text-white cursor-pointer'}`}
                                    >
                                        {(status === 'PENDING' || status === 'PROCESSING') ? (
                                            <><Loader2 className="w-5 h-5 animate-spin" /> Calculando Otimização...</>
                                        ) : (
                                            <><Play className="w-5 h-5" /> EXECUTAR SOLVER INTELIGENTE</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* RESULTS AREA */}
            {!result && !polling ? (
                <div className="mt-8 h-48 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-300 rounded text-slate-400">
                    <TrendingDown className="w-12 h-12 mb-3 opacity-20" />
                    <p className="font-medium">Aguardando execução.</p>
                    <p className="text-xs mt-1">Configure janelas e clique em Executar Solver.</p>
                </div>
            ) : (
                <div className="animate-fade-in space-y-4">

                    <div className="flex items-center justify-between border-b border-slate-200 bg-white rounded-t-md px-2 pt-2">
                        <div className="flex">
                            <button
                            onClick={() => setActiveTab('grid')}
                            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'grid' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            <TableIcon className="w-4 h-4" /> Férias Inteligentes (Grid)
                            </button>
                            <button
                            onClick={() => setActiveTab('comparison')}
                            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'comparison' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            <FileText className="w-4 h-4" /> Comparação
                            </button>
                            <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'dashboard' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                        >
                            <LayoutIcon className="w-4 h-4" /> Dashboard & Gráficos
                            </button>
                        </div>
                        <div className="flex items-center gap-2 pr-2">
                            <button
                                onClick={() => { 
                                    setPendingFilters(filters); 
                                    setShowFilterModal(true); 
                                }}
                                className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded bg-blue-700 hover:bg-blue-800 text-white border border-blue-700"
                            >
                                <Filter className="w-3 h-3" /> Filtrar Dados
                            </button>
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                            >
                                <Trash2 className="w-3 h-3" /> Limpar Filtro
                            </button>
                        </div>
                    </div>

                    {showFilterModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                            <div className="bg-white rounded shadow-lg border border-slate-300 w-full max-w-xl">
                                <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-slate-800">Filtrar Dados</h3>
                                    <button onClick={() => setShowFilterModal(false)} className="text-slate-500 hover:text-slate-700"><X className="w-4 h-4" /></button>
                                </div>
                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Colaborador</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Digite o nome"
                                                value={pendingFilters.employeeName ?? ''}
                                                onFocus={() => setEmployeeDropdownOpen(true)}
                                                onChange={e => { setEmployeeDropdownOpen(true); setPendingFilters(prev => ({ ...prev, employeeName: e.target.value || null })); }}
                                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                            />
                                            {employeeDropdownOpen && (pendingFilters.employeeName || '').length > 0 && (
                                                <div className="absolute z-10 mt-1 w-full bg-white border border-slate-300 rounded shadow max-h-40 overflow-auto">
                                                    {employees
                                                        .filter(e => ((e.name || '').toLowerCase()).startsWith((pendingFilters.employeeName || '').toLowerCase()))
                                                        .map(e => (
                                                            <div
                                                                key={e.id}
                                                                className="px-3 py-2 text-sm hover:bg-slate-100 cursor-pointer"
                                                                onClick={() => { setPendingFilters(prev => ({ ...prev, employeeId: e.id, employeeName: e.name || '' })); setEmployeeDropdownOpen(false); }}
                                                            >
                                                                {e.name}
                                                            </div>
                                                        ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cliente</label>
                                        <select
                                            value={pendingFilters.clientName || ''}
                                            onChange={e => setPendingFilters(prev => ({ ...prev, clientName: e.target.value || null }))}
                                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
                                        >
                                            <option value="">Todos</option>
                                            {clientsList.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rate mínimo</label>
                                            <input
                                                type="number"
                                                value={pendingFilters.rateMin ?? ''}
                                                onChange={e => setPendingFilters(prev => ({ ...prev, rateMin: e.target.value ? Number(e.target.value) : null }))}
                                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rate máximo</label>
                                            <input
                                                type="number"
                                                value={pendingFilters.rateMax ?? ''}
                                                onChange={e => setPendingFilters(prev => ({ ...prev, rateMax: e.target.value ? Number(e.target.value) : null }))}
                                                className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Início de Férias</label>
                                        <input
                                            type="date"
                                            value={pendingFilters.startDate ?? ''}
                                            onChange={e => setPendingFilters(prev => ({ ...prev, startDate: e.target.value || null }))}
                                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fim de Férias</label>
                                        <input
                                            type="date"
                                            value={pendingFilters.endDate ?? ''}
                                            onChange={e => setPendingFilters(prev => ({ ...prev, endDate: e.target.value || null }))}
                                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
                                    <button onClick={() => { setPendingFilters(filters); setShowFilterModal(false); }} className="px-4 py-2 text-xs font-bold rounded bg-white text-slate-700 border border-slate-300 hover:bg-slate-50">Cancelar</button>
                                    <button onClick={() => { setFilters(pendingFilters); setShowFilterModal(false); }} className="px-4 py-2 text-xs font-bold rounded bg-blue-700 hover:bg-blue-800 text-white border border-blue-700">Aplicar Filtros</button>
                                </div>
                            </div>
                    </div>
                    )}

                    {polling && !result && (
                        <div className="flex items-center justify-center py-12">
                            <div className="flex flex-col items-center gap-4 text-slate-600">
                                <Loader2 className="w-48 h-48 animate-spin" />
                                <span className="text-sm font-medium">Gerando grade otimizada...</span>
                            </div>
                        </div>
                    )}

                    {/* TAB: GRID (COMPLEX) */}
                    {activeTab === 'grid' && result && (
                        <div className="bg-white rounded-b border border-slate-300 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-600 uppercase bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">
                                        {filteredAllocations.length} Alocações
                                    </span>
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3 text-green-500" /> Solver Otimizado
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={exportExcel} className="text-xs bg-white border border-green-600 text-green-700 hover:bg-green-50 px-3 py-1.5 rounded flex items-center gap-2 font-bold">
                                        <Download className="w-3 h-3" /> Exportar Excel
                                    </button>
                                    <button onClick={exportCSV} className="text-xs bg-white border border-blue-600 text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded flex items-center gap-2 font-bold">
                                        <FileText className="w-3 h-3" /> Exportar CSV
                                    </button>
                                    <button onClick={exportPDF} className="text-xs bg-white border border-red-600 text-red-700 hover:bg-red-50 px-3 py-1.5 rounded flex items-center gap-2 font-bold">
                                        <FileText className="w-3 h-3" /> Exportar PDF
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-auto max-h-[60vh]">
                                <table className="w-full text-xs text-left whitespace-nowrap">
                                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="px-4 py-3 border-r border-slate-200">Colaborador</th>
                                            <th className="px-4 py-3 border-r border-slate-200">Cliente</th>
                                            <th className="px-4 py-3 text-right border-r border-slate-200">Rate</th>
                                            <th className="px-4 py-3 text-center border-r border-slate-200">Início</th>
                                            <th className="px-4 py-3 text-center border-r border-slate-200">Fim</th>
                                            <th className="px-4 py-3 text-center border-r border-slate-200 bg-yellow-50">Dias</th>
                                            <th className="px-4 py-3 text-center border-r border-slate-200 bg-yellow-50">Horas Úteis</th>
                                            <th className="px-4 py-3 text-right border-r border-slate-200 bg-blue-50 text-blue-800">Custo Total</th>
                                            {/* DYNAMIC WINDOW COLUMNS */}
                                            {windows.map(w => (
                                                <React.Fragment key={w.id}>
                                                    <th className="px-4 py-3 text-right border-b border-slate-200 bg-white min-w-[160px] border-l border-slate-200 text-blue-700">
                                                        Impacto - {w.label}
                                                    </th>
                                                    <th className="px-4 py-3 text-center border-b border-slate-200 bg-slate-50 min-w-[180px] border-r text-slate-600">
                                                        Horas - {w.label} {formatWindowHeaderHours(Number(w.totalBusinessHours || 0))}
                                                    </th>
                                                </React.Fragment>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredAllocations.map((alloc, idx) => {
                                            const empDetails = getEmployeeDetails(alloc.employee_id);
                                            return (
                                                <tr key={`${alloc.employee_id}-${idx}`} className="hover:bg-blue-50 transition-colors">
                                                    <td className="px-4 py-2 font-medium text-slate-800 border-r border-slate-100">{alloc.employee_name}</td>
                                                    <td className="px-4 py-2 text-slate-600 border-r border-slate-100">{empDetails?.client_name || '-'}</td>
                                                    <td className="px-4 py-2 text-right font-mono text-slate-600 border-r border-slate-100">{empDetails?.rate ? formatCurrency(empDetails.rate) : '-'}</td>
                                                    <td className="px-4 py-2 text-center border-r border-slate-100">{new Date(alloc.start_date).toLocaleDateString('pt-BR')}</td>
                                                    <td className="px-4 py-2 text-center border-r border-slate-100 text-slate-500">{new Date(alloc.end_date).toLocaleDateString('pt-BR')}</td>
                                                    <td className="px-4 py-2 text-center font-bold bg-yellow-50/30 border-r border-slate-100">{alloc.duration}</td>
                                                    <td className="px-4 py-2 text-center font-mono text-slate-600 bg-yellow-50/30 border-r border-slate-100">{formatHours(Number(alloc.billable_hours || 0))}</td>
                                                    <td className="px-4 py-2 text-right font-mono font-bold text-blue-700 bg-blue-50/30 border-r border-slate-100">
                                                        {formatCurrency(alloc.cost_impact)}
                                                    </td>
                                                    {/* DYNAMIC WINDOW CELLS */}
                                                    {windows.map(w => {
                                                        const winImpact = alloc.window_impacts?.[w.id];
                                                        const winHours = alloc.window_hours?.[w.id];
                                                        const impactStr = winImpact && winImpact > 0 ? formatCurrency(winImpact) : '';
                                                        const hoursStr = winHours && winHours > 0 ? formatHours(Number(winHours)) : '';
                                                        return (
                                                            <React.Fragment key={w.id}>
                                                                <td className="px-4 py-2 text-right border-l border-slate-100 text-blue-700 bg-blue-50/50 font-bold">
                                                                    {impactStr}
                                                                </td>
                                                                <td className="px-4 py-2 text-center border-r border-slate-100 text-slate-600 bg-slate-50/50 text-[11px] font-mono">
                                                                    {hoursStr}
                                                                </td>
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'comparison' && result && (
                        <div className="bg-white rounded-b border border-slate-300 shadow-sm overflow-hidden">
                            <div className="overflow-auto max-h-[60vh]">
                                <table className="w-full text-xs border-collapse">
                                    <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="px-4 py-3 text-left border-b border-slate-200">Colaborador</th>
                                            <th className="px-4 py-3 text-center border-b border-slate-200">Prog. Férias</th>
                                            <th className="px-4 py-3 text-right border-b border-slate-200">Rate</th>
                                            <th className="px-4 py-3 text-right border-b border-slate-200 bg-red-50">Pior Cenário</th>
                                            <th className="px-4 py-3 text-right border-b border-slate-200 bg-blue-50">Modelo Real</th>
                                            <th className="px-4 py-3 text-right border-b border-slate-200 bg-green-50">Diferença</th>
                                            <th className="px-4 py-3 text-right border-b border-slate-200 bg-green-50">Economia %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {comparisonData.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="px-4 py-2 border-b border-slate-100 font-medium">{row.employee_name}</td>
                                                <td className="px-4 py-2 border-b border-slate-100 text-center"><span className="px-2 py-1 bg-slate-100 rounded text-[10px] text-slate-600">{row.label}</span></td>
                                                <td className="px-4 py-2 border-b border-slate-100 text-right">{formatCurrency(row.rate)}</td>
                                                <td className="px-4 py-2 border-b border-slate-100 text-right text-red-700 bg-red-50/50">{formatCurrency(row.worst)}</td>
                                                <td className="px-4 py-2 border-b border-slate-100 text-right text-blue-700 bg-blue-50/50 font-bold">{formatCurrency(row.total)}</td>
                                                <td className="px-4 py-2 border-b border-slate-100 text-right text-green-700 bg-green-50/50 font-bold">{formatCurrency(row.savings)}</td>
                                                <td className="px-4 py-2 border-b border-slate-100 text-right text-green-700 bg-green-50/50">{(row.savings_pct * 100).toFixed(2)}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB: DASHBOARD */}
                    {activeTab === 'dashboard' && result && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white p-4 rounded border border-slate-300 shadow-sm border-l-4 border-l-slate-500">
                                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Impacto Financeiro Real</div>
                                    <div className="text-2xl font-bold text-slate-800">{formatCurrency(result.total_impact)}</div>
                                </div>
                                <div className="bg-white p-4 rounded border border-slate-300 shadow-sm border-l-4 border-l-green-500">
                                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Saving Gerado (Otimização)</div>
                                    <div className="text-2xl font-bold text-green-700">{formatCurrency(result.financial_savings)}</div>
                                </div>
                                <div className="bg-white p-4 rounded border border-slate-300 shadow-sm border-l-4 border-l-blue-500">
                                    <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Conflitos Evitados</div>
                                    <div className="text-2xl font-bold text-blue-700">{result.holiday_conflicts_avoided}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded border border-purple-300 shadow-sm">
                                    <div className="text-xs text-purple-700 uppercase font-semibold mb-1 flex items-center gap-2">
                                        <Info className="w-3 h-3" /> Método de Otimização
                                    </div>
                                    <div className="text-xl font-bold text-purple-900">
                                        {result.solver_method === 'ILP' && '🎯 ILP (Ótimo Garantido)'}
                                        {result.solver_method === 'HEURISTIC' && '⚡ Heurística Melhorada'}
                                        {result.solver_method === 'AI' && '🤖 Inteligência Artificial'}
                                    </div>
                                    <p className="text-[10px] text-purple-600 mt-1">
                                        {result.solver_method === 'ILP' && 'Solução matematicamente ótima usando PuLP'}
                                        {result.solver_method === 'HEURISTIC' && 'Solução heurística com 10% por cliente'}
                                        {result.solver_method === 'AI' && 'Gerado por modelo de linguagem'}
                                    </p>
                                </div>
                                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded border border-orange-300 shadow-sm">
                                    <div className="text-xs text-orange-700 uppercase font-semibold mb-1 flex items-center gap-2">
                                        <Loader2 className="w-3 h-3" /> Tempo de Processamento
                                    </div>
                                    <div className="text-xl font-bold text-orange-900">
                                        {result.optimization_time_seconds ? `${result.optimization_time_seconds}s` : 'N/A'}
                                    </div>
                                    <p className="text-[10px] text-orange-600 mt-1">
                                        Tempo total de execução do solver
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded border border-slate-200 shadow-sm">
                                    <div className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                        <BarChart2 className="w-4 h-4" /> Fluxo de Caixa Mensal
                                    </div>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={cashData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="name" />
                                                <YAxis tickFormatter={(v) => formatCurrency(Number(v))} />
                                                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                                                <Legend />
                                                <ReferenceLine y={result?.monthly_revenue_target || 0} stroke="#0ea5e9" strokeDasharray="4 4" label="Target" />
                                                <Bar dataKey="valor" name="Impacto" fill="#059669">
                                                    {cashData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.valor > (result?.monthly_revenue_target || 0) ? '#ef4444' : '#059669'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded border border-slate-200 shadow-sm">
                                    <div className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                        <BarChart2 className="w-4 h-4" /> Cronograma de Inícios de Férias
                                    </div>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={scheduleData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <Tooltip />
                                                <Bar dataKey="inicios" name="Inícios" fill="#1d4ed8" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )
            }
        </div >
    );
};

const RuleBadge: React.FC<{ active: boolean; label: string; icon: any }> = ({ active, label, icon: Icon }) => (
    <span className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded border font-medium ${active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-400 border-slate-200 line-through decoration-slate-400'}`}>
        <Icon className="w-3 h-3" /> {label}
    </span>
);

export default OptimizationPage;
