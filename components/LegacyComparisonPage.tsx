
// =========================================================
//  SmartVacations - Enterprise 1.0
//  (by Leonardo Baladão and Marcio Roberto Cordeiro - 2025)
// =========================================================

import React, { useState, useEffect, useMemo } from 'react';
import { Employee, Project, VacationRules } from '../types';
import { Play, Calendar as CalendarIcon, Table as TableIcon, BarChart2, FileText, Download, AlertCircle, History as HistoryIcon, Settings, Trash2, DollarSign, ListFilter, Clock, X, Layers, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface LegacyComparisonPageProps {
    employees: Employee[];
    activeProject: Project;
    vacationRules: VacationRules;
}

interface MeasurementWindow {
    id: string;
    start: Date;
    end: Date;
    label: string;
    totalBusinessHours: number;
}

interface LegacyResultRow {
    employee_id: number;
    employee_name: string;
    client_name: string;
    start_dates: string[];
    end_dates: string[];
    breakdown: string;
    total_impact: number;
    total_business_hours: number;
    window_impacts: Record<string, number>;
    window_hours: Record<string, number>;
    worst_case_impact: number;
    savings: number;
    savings_percent: number;
    vacation_type_label: string;
}

type VacationPresetType = 'MANUAL' | 'STD_30' | 'ABONO_20_10' | 'SPLIT_14_6_10' | 'SPLIT_15_15' | 'SPLIT_20_10' | 'SPLIT_14_7_9';

interface VacationPreset {
    id: VacationPresetType;
    label: string;
    periods: number[];
    sellDays: number;
    description: string;
}

const VACATION_PRESETS: Record<string, VacationPreset> = {
    'MANUAL': { id: 'MANUAL', label: 'Dias corridos (Manual)', periods: [], sellDays: 0, description: 'Inserção manual de dias.' },
    'STD_30': { id: 'STD_30', label: '1 Parcela: 30 dias de férias', periods: [30], sellDays: 0, description: 'Período completo.' },
    'ABONO_20_10': { id: 'ABONO_20_10', label: '1 Parcela: 20 dias férias + 10 dias abono', periods: [20], sellDays: 10, description: 'Venda de 1/3 das férias.' },
    'SPLIT_15_15': { id: 'SPLIT_15_15', label: '2 Parcelas: 15 dias + 15 dias', periods: [15, 15], sellDays: 0, description: 'Meio a meio.' },
    'SPLIT_20_10': { id: 'SPLIT_20_10', label: '2 Parcelas: 20 dias + 10 dias', periods: [20, 10], sellDays: 0, description: 'Dois períodos sem abono.' },
    'SPLIT_14_6_10': { id: 'SPLIT_14_6_10', label: '2 Parcelas: 14 dias + 6 dias + 10 abono', periods: [14, 6], sellDays: 10, description: 'Dois períodos com abono.' },
    'SPLIT_14_7_9': { id: 'SPLIT_14_7_9', label: '3 Parcelas: 14 + 7 + 9 dias', periods: [14, 7, 9], sellDays: 0, description: 'Fracionamento máximo.' },
};

// --- MOTOR DE CÁLCULO ---
const getEaster = (year: number): Date => {
    const f = Math.floor,
        G = year % 19,
        C = f(year / 100),
        H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
        I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)),
        J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7,
        L = I - J,
        month = 3 + f((L + 40) / 44),
        day = L + 28 - 31 * f(month / 4);
    return new Date(year, month - 1, day);
};

const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

const getHolidaysLegacy = (year: number): Date[] => {
    const fixedHolidays = [
        [0, 1], [3, 21], [4, 1], [6, 9], [8, 7], [9, 12], [10, 2], [10, 15], [11, 25]
    ];
    const holidays: Date[] = fixedHolidays.map(([m, d]) => new Date(year, m, d));
    const easter = getEaster(year);
    const carnival = addDays(easter, -47);
    const goodFriday = addDays(easter, -2);
    const corpusChristi = addDays(easter, 60);
    holidays.push(carnival, goodFriday, corpusChristi);
    return holidays.map(d => new Date(d.getFullYear(), d.getMonth(), d.getDate()));
};

const getBusinessDaysLegacy = (start: Date, end: Date) => {
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    let allHolidays: Date[] = getHolidaysLegacy(startYear);
    if (startYear !== endYear) {
        allHolidays = [...allHolidays, ...getHolidaysLegacy(endYear)];
    }
    // Adiciona feriados do ano anterior e posterior para tratar pontes em janelas que cruzam o ano
    allHolidays.push(...getHolidaysLegacy(startYear - 1), ...getHolidaysLegacy(endYear + 1));

    const pontes: string[] = [];
    allHolidays.forEach(h => {
        const day = h.getDay();
        if (day === 2) pontes.push(addDays(h, -1).toISOString().split('T')[0]);
        else if (day === 4) pontes.push(addDays(h, 1).toISOString().split('T')[0]);
    });

    let count = 0;
    let curDate = new Date(start);
    while (curDate <= end) {
        const curDateStr = curDate.toISOString().split('T')[0];
        const dayOfWeek = curDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isHoliday = allHolidays.some(h => h.toISOString().split('T')[0] === curDateStr);
        const isPonte = pontes.includes(curDateStr);
        if (!isWeekend && !isHoliday && !isPonte) count++;
        curDate.setDate(curDate.getDate() + 1);
    }
    return count;
};

const calculateMedian = (values: number[]) => {
    if (values.length === 0) return 0;
    values.sort((a, b) => a - b);
    const half = Math.floor(values.length / 2);
    if (values.length % 2) return values[half];
    return (values[half - 1] + values[half]) / 2.0;
};

const LegacyComparisonPage: React.FC<LegacyComparisonPageProps> = ({ employees, activeProject, vacationRules }) => {
    const [startDay, setStartDay] = useState(21);
    const [endDay, setEndDay] = useState(20);
    const [baseYear, setBaseYear] = useState(new Date().getFullYear());
    const [useDateRange, setUseDateRange] = useState(false);
    const [baseStartDate, setBaseStartDate] = useState<Date | null>(null);
    const [baseEndDate, setBaseEndDate] = useState<Date | null>(null);
    const [selectedPresetId, setSelectedPresetId] = useState<VacationPresetType>('STD_30');
    const [manualDuration, setManualDuration] = useState(30);
    const [expectedRevenue] = useState(activeProject.budget || 7343312.00);
    const [allocationLogic, setAllocationLogic] = useState<'smart' | 'rate_desc' | 'rate_asc'>('smart');
    const [windows, setWindows] = useState<MeasurementWindow[]>([]);
    const [results, setResults] = useState<LegacyResultRow[]>([]);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'detailed' | 'comparison'>('dashboard');
    const [isCalculating, setIsCalculating] = useState(false);
    const [configCollapsed, setConfigCollapsed] = useState(false);
    const [excludeNewEmployees, setExcludeNewEmployees] = useState(false);

    const [showFilterModal, setShowFilterModal] = useState(false);
    const [filters, setFilters] = useState({
        employeeId: null as number | null,
        employeeName: null as string | null,
        clientName: null as string | null,
        rateMin: null as number | null,
        rateMax: null as number | null,
        startDate: null as string | null,
        endDate: null as string | null,
    });
    const [pendingFilters, setPendingFilters] = useState({
        employeeId: null as number | null,
        employeeName: null as string | null,
        clientName: null as string | null,
        rateMin: null as number | null,
        rateMax: null as number | null,
        startDate: null as string | null,
        endDate: null as string | null,
    });
    const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);
    const clearFilters = () => {
        setFilters({
            employeeId: null,
            employeeName: null,
            clientName: null,
            rateMin: null,
            rateMax: null,
            startDate: null,
            endDate: null,
        });
        setPendingFilters({
            employeeId: null,
            employeeName: null,
            clientName: null,
            rateMin: null,
            rateMax: null,
            startDate: null,
            endDate: null,
        });
    };

    const rateByName = useMemo(() => {
        const m: Record<string, number> = {};
        employees.forEach(e => { m[e.name] = e.rate; });
        return m;
    }, [employees]);
    const rateById = useMemo(() => {
        const m: Record<number, number> = {};
        employees.forEach(e => { m[e.id] = e.rate; });
        return m;
    }, [employees]);
    const clientsList = useMemo(() => {
        const set = new Set<string>();
        employees.forEach(e => set.add(e.client_name || 'Desconhecido'));
        return Array.from(set);
    }, [employees]);

    const currencyCode = activeProject.currency_code || 'BRL';
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

    // UseMemo critical for preventing infinite loops and ensuring reactivity
    const availablePresets = useMemo(() => {
        return Object.values(VACATION_PRESETS).filter(p => {
            if (p.id === 'MANUAL' || p.id === 'STD_30') return true;
            if (p.id.includes('SPLIT') && !vacationRules.allow_split) return false;
            if (p.sellDays > 0 && vacationRules.sell_days_limit < 10) return false;
            return true;
        });
    }, [vacationRules.allow_split, vacationRules.sell_days_limit]);

    // Reset if current selection becomes invalid
    useEffect(() => {
        const exists = availablePresets.find(p => p.id === selectedPresetId);
        if (!exists) {
            setSelectedPresetId('STD_30');
        }
    }, [availablePresets, selectedPresetId]);

    const computeWindowFallback = (r: LegacyResultRow, w: MeasurementWindow) => {
        let totalH = 0;
        const starts = r.start_dates || [];
        const ends = r.end_dates || [];
        for (let i = 0; i < starts.length; i++) {
            const sParts = String(starts[i]).split('-').map(x => parseInt(x, 10));
            const eParts = String(ends[i]).split('-').map(x => parseInt(x, 10));
            const st = new Date(sParts[0], sParts[1] - 1, sParts[2]);
            const en = new Date(eParts[0], eParts[1] - 1, eParts[2]);
            const iStart = st.getTime() > w.start.getTime() ? st : w.start;
            const iEnd = en.getTime() < w.end.getTime() ? en : w.end;
            if (iStart.getTime() <= iEnd.getTime()) {
                const bd = getBusinessDaysLegacy(iStart, iEnd);
                totalH += bd * 8;
            }
        }
        const impact = totalH * (rateById[r.employee_id] || 0);
        return { hours: totalH, impact };
    };

    const filteredResults = useMemo(() => {
        let rows = results;
        if (filters.employeeId) {
            rows = rows.filter(r => r.employee_id === filters.employeeId);
        }
        if (filters.employeeName) {
            const q = (filters.employeeName || '').toLowerCase();
            rows = rows.filter(r => (r.employee_name || '').toLowerCase().startsWith(q));
        }
        if (filters.clientName) {
            rows = rows.filter(r => (r.client_name || '') === filters.clientName);
        }
        if (filters.rateMin !== null || filters.rateMax !== null) {
            rows = rows.filter(r => {
                const rate = rateById[r.employee_id] || 0;
                if (filters.rateMin !== null && rate < filters.rateMin) return false;
                if (filters.rateMax !== null && rate > filters.rateMax) return false;
                return true;
            });
        }
        if (filters.startDate || filters.endDate) {
            const startTs = filters.startDate ? new Date(filters.startDate).getTime() : -Infinity;
            const endTs = filters.endDate ? new Date(filters.endDate).getTime() : Infinity;
            rows = rows.filter(r => {
                const starts = (r.start_dates || []).map(d => new Date(d).getTime());
                return starts.some(ts => ts >= startTs && ts <= endTs);
            });
        }
        return rows;
    }, [results, filters, rateById]);

    const processedResults = useMemo(() => {
        return filteredResults.map(row => {
            const validation = { sumHours: 0, sumImpact: 0 };
            const windowData = windows.map(w => {
                const fb = computeWindowFallback(row, w);
                const wiBackend = row.window_impacts ? row.window_impacts[w.id] : undefined;
                const whBackend = row.window_hours ? row.window_hours[w.id] : undefined;
                const wi = (wiBackend !== undefined && wiBackend > 0) ? wiBackend : fb.impact;
                const wh = (whBackend !== undefined && whBackend > 0) ? whBackend : fb.hours;
                validation.sumHours += wh;
                validation.sumImpact += wi;
                return {
                    id: w.id,
                    impact: wi > 0 ? formatCurrency(wi) : '',
                    hours: wh > 0 ? formatHours(Number(wh || 0)) : '',
                };
            });

            return {
                ...row,
                rateFormatted: formatCurrency(rateById[row.employee_id] || 0),
                totalHoursFormatted: formatHours(Number(validation.sumHours || 0)),
                windowData,
                validation,
            };
        });
    }, [filteredResults, windows, rateById]);

    // Prepare Chart Data
    const chartData = useMemo(() => {
        if (!filteredResults.length || !windows.length) return [];
        return windows.map(w => {
            const totalImpact = filteredResults.reduce((sum, r) => {
                const backend = r.window_impacts ? r.window_impacts[w.id] : undefined;
                if (backend !== undefined && backend > 0) return sum + backend;
                const fb = computeWindowFallback(r, w);
                return sum + fb.impact;
            }, 0);
            return {
                name: w.label,
                shortName: `${w.start.getDate()}/${w.start.getMonth() + 1}`,
                impact: totalImpact
            };
        });
    }, [filteredResults, windows]);

    const generateWindowsManual = async () => {
        if (startDay < 1 || startDay > 31 || endDay < 1 || endDay > 31) {
            alert("Dias inválidos."); return;
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
            if (endDay < startDay) { endMonth = m + 1; if (endMonth > 11) { endMonth = 0; endYear++; } }
            const lastDay = new Date(endYear, endMonth + 1, 0).getDate();
            const d = Math.min(endDay, lastDay);
            return new Date(endYear, endMonth, d);
        };
        if (useDateRange) {
            if (!baseStartDate || !baseEndDate) { alert('Selecione Data Base inicial e final.'); return; }
            if (baseStartDate.getTime() > baseEndDate.getTime()) { alert('Data Base inicial deve ser anterior à final.'); return; }
            let y = baseStartDate.getFullYear();
            let m = baseStartDate.getMonth();
            let idx = 0;
            while (true) {
                const start = makeStartForMonth(y, m);
                const end = makeEndForMonth(y, m);
                const startClamped = start.getTime() < baseStartDate.getTime() ? baseStartDate : start;
                const endClamped = end.getTime() > baseEndDate.getTime() ? baseEndDate : end;
                if (startClamped.getTime() > baseEndDate.getTime()) break;
                if (endClamped.getTime() >= baseStartDate.getTime()) {
                    const businessDays = getBusinessDaysLegacy(startClamped, endClamped);
                    newWindows.push({ id: `win_${idx}`, start: startClamped, end: endClamped, label: `${startClamped.toLocaleDateString('pt-BR')} a ${endClamped.toLocaleDateString('pt-BR')}`, totalBusinessHours: businessDays * 8 });
                    idx++;
                }
                m += 1; if (m > 11) { m = 0; y += 1; }
                const nextStart = makeStartForMonth(y, m);
                if (nextStart.getTime() > baseEndDate.getTime()) break;
                if (idx > 120) break;
            }
        } else {
            let currentDate = new Date(baseYear, 0, startDay);
            for (let i = 0; i < 12; i++) {
                const start = new Date(currentDate);
                const end = makeEndForMonth(start.getFullYear(), start.getMonth());
                const businessDays = getBusinessDaysLegacy(start, end);
                newWindows.push({ id: `win_${i}`, start, end, label: `${start.toLocaleDateString('pt-BR')} a ${end.toLocaleDateString('pt-BR')}`, totalBusinessHours: businessDays * 8 });
                let nextStartMonth = start.getMonth() + 1;
                let nextStartYear = start.getFullYear();
                if (nextStartMonth > 11) { nextStartMonth = 0; nextStartYear++; }
                const lastDayOfNextStartMonth = new Date(nextStartYear, nextStartMonth + 1, 0).getDate();
                const actualStartDay = Math.min(startDay, lastDayOfNextStartMonth);
                currentDate = new Date(nextStartYear, nextStartMonth, actualStartDay);
            }
        }
        setWindows(newWindows);
        setResults([]);
    };

    const handleRemoveWindow = (id: string) => {
        setWindows(prev => prev.filter(w => w.id !== id));
        if (results.length > 0) setResults([]);
    };

    const runLegacyCalculation = async () => {
        if (windows.length === 0) { alert("Gere as janelas primeiro."); return; }
        setIsCalculating(true);
        const preset = VACATION_PRESETS[selectedPresetId];
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
            rules: vacationRules,
            strategy_preference: 'STANDARD_30',
            project_context: activeProject,
            windows: windows.map(w => ({ id: w.id, start: w.start.toISOString().split('T')[0], end: w.end.toISOString().split('T')[0], label: w.label })),
            allocation_logic: allocationLogic,
            preset_periods: selectedPresetId === 'MANUAL' ? [manualDuration] : preset.periods,
            sell_days: selectedPresetId === 'MANUAL' ? 0 : preset.sellDays,
            employees: effectiveEmployees
        };
        const res = await fetch('/legacy/compare', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await res.json();
        setResults(data.rows || []); // Apenas atualiza os resultados. As janelas já estão corretas.
        setIsCalculating(false);
        setActiveTab('detailed');
    };

    const buildDetailedTable = () => {
        const headers = [
            'Nome',
            'Cliente',
            'Rate',
            'Início das Férias',
            'Fim das Férias',
            'Dias de Férias Calculados',
            'Horas Úteis nas Férias',
            'Impacto'
        ];
        windows.forEach(w => {
            headers.push(`Impacto - ${w.label}`);
            headers.push(`Horas - ${w.label} ${formatWindowHeaderHours(Number(w.totalBusinessHours || 0))}`);
        });
        const rows = processedResults.map(r => {
            const base = [
                r.employee_name,
                r.client_name,
                r.rateFormatted,
                (r.start_dates || []).map(d => new Date(d).toLocaleDateString('pt-BR')).join(' | '),
                (r.end_dates || []).map(d => new Date(d).toLocaleDateString('pt-BR')).join(' | '),
                r.breakdown,
                r.totalHoursFormatted,
                formatCurrency(r.total_impact)
            ];
            r.windowData.forEach(wd => {
                base.push(wd.impact);
                base.push(wd.hours);
            });
            return base;
        });
        return { headers, rows };
    };

    const exportCSV = () => {
        const { headers, rows } = buildDetailedTable();
        const sep = ';';
        const csv = [headers.join(sep), ...rows.map(r => r.map(v => typeof v === 'string' ? `"${String(v).replace(/"/g, '""')}"` : v).join(sep))].join('\n');
        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Ferias_Inteligentes_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const exportExcel = () => {
        const { headers, rows } = buildDetailedTable();
        const tableHead = `<tr>${headers.map(h => `<th style="border:1px solid #ccc;padding:4px">${h}</th>`).join('')}</tr>`;
        const tableBody = rows.map(r => `<tr>${r.map(c => `<td style="border:1px solid #eee;padding:4px">${c}</td>`).join('')}</tr>`).join('');
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><table>${tableHead}${tableBody}</table></body></html>`;
        const blob = new Blob([html], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Ferias_Inteligentes_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const exportPDF = () => {
        const { headers, rows } = buildDetailedTable();
        const head = `<tr>${headers.map(h => `<th style="border-bottom:1px solid #ddd;text-align:left;padding:6px;font-size:10px">${h}</th>`).join('')}</tr>`;
        const body = rows.map(r => `<tr>${r.map(c => `<td style="border-bottom:1px solid #f0f0f0;padding:6px;font-size:10px">${c}</td>`).join('')}</tr>`).join('');
        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Export PDF</title><style>body{font-family:Arial, sans-serif} table{width:100%;border-collapse:collapse} @media print { table { page-break-inside:auto } tr { page-break-inside:avoid; page-break-after:auto } }</style></head><body><h3>Férias Inteligentes</h3><table>${head}${body}</table></body></html>`;
        const w = window.open('', '_blank');
        if (!w) return;
        w.document.open();
        w.document.write(html);
        w.document.close();
        w.focus();
        w.print();
    };


    return (
        <div className="w-full max-w-none space-y-6 animate-fade-in pb-10 px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-4 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <HistoryIcon className="w-6 h-6 text-slate-500" />
                        Comparativo: Legado vs. Enterprise
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Replica exata dos cálculos e relatórios da planilha Excel/Python original.</p>
                </div>
            </div>

            <div className={`bg-white rounded border border-slate-200 shadow-sm overflow-hidden`}>
                <div
                    className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => setConfigCollapsed(!configCollapsed)}
                >
                    <div className="flex items-center gap-2 text-slate-700 font-bold text-sm uppercase">
                        <Layers className="w-4 h-4" /> Programação de Férias e Janelas
                    </div>
                    <div className="text-slate-400 flex items-center gap-2">
                        {!configCollapsed && windows.length > 0 && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{windows.length} Janelas Configuradas</span>}
                        {configCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </div>
                </div>
                {!configCollapsed && (
                    <div className="p-5 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-6 xl:grid-cols-8 gap-6">
                            <div className="md:col-span-3 xl:col-span-4">
                                <select
                                    value={selectedPresetId}
                                    onChange={(e) => setSelectedPresetId(e.target.value as VacationPresetType)}
                                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white font-medium text-slate-800"
                                >
                                    {availablePresets.map(p => (
                                        <option key={p.id} value={p.id}>{p.label}</option>
                                    ))}
                                </select>
                            </div>
                            {selectedPresetId === 'MANUAL' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1"><Clock className="w-3 h-3 inline" /> Dias Corridos</label>
                                    <input type="number" value={manualDuration} onChange={(e) => setManualDuration(Number(e.target.value))} className="w-full border border-slate-300 rounded px-3 py-2 text-sm font-bold text-slate-700" />
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1"><DollarSign className="w-3 h-3 inline" /> Faturamento Esperado</label>
                                <input type="number" step="0.01" value={expectedRevenue} disabled className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-100 text-slate-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1"><ListFilter className="w-3 h-3 inline" /> Lógica de Alocação</label>
                                <select value={allocationLogic} onChange={(e) => setAllocationLogic(e.target.value as any)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white">
                                    <option value="smart">Lógica Inteligente (Mediana)</option>
                                    <option value="rate_desc">Rate Alto em meses CURTOS</option>
                                    <option value="rate_asc">Rate Alto em meses LONGOS</option>
                                </select>
                            </div>
                            <div className="md:col-span-3 xl:col-span-4">
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                    <input type="checkbox" checked={excludeNewEmployees} onChange={e => setExcludeNewEmployees(e.target.checked)} className="w-4 h-4" /> Excluir colaboradores com menos de 1 ano de admissão
                                </label>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100">
                            <div className="text-xs font-bold text-slate-400 uppercase mb-3">Definição de Janelas (Medição)</div>
                            <div className="grid grid-cols-1 md:grid-cols-6 xl:grid-cols-8 gap-4 items-end">
                                <div><label className="block text-xs font-bold text-slate-500 mb-1">Dia Início</label><input type="number" value={startDay} onChange={(e) => setStartDay(Number(e.target.value))} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" /></div>
                                <div><label className="block text-xs font-bold text-slate-500 mb-1">Dia Fim</label><input type="number" value={endDay} onChange={(e) => setEndDay(Number(e.target.value))} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" /></div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Período de Medição</label>
                                    <div className="flex items-center gap-3">
                                        <label className="flex items-center gap-2 text-xs font-bold text-slate-600"><input type="checkbox" checked={useDateRange} onChange={e => setUseDateRange(e.target.checked)} className="w-4 h-4" /> Usar Data Base (Período)</label>
                                        {!useDateRange && (<><span className="text-[10px] text-slate-500">Ano Base</span><input type="number" value={baseYear} onChange={(e) => setBaseYear(Number(e.target.value))} className="w-24 border border-slate-300 rounded px-2 py-1 text-sm" /></>)}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={generateWindowsManual} className="flex-1 bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded text-sm font-bold flex items-center justify-center gap-2"><CalendarIcon className="w-4 h-4" /> Gerar Janelas</button>
                                    {windows.length > 0 && (<button onClick={() => { setWindows([]); setResults([]); }} className="px-3 py-2 border border-slate-300 rounded hover:bg-red-50 hover:border-red-200 text-slate-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>)}
                                </div>
                            </div>
                            {useDateRange && (
                                <div className="grid grid-cols-1 md:grid-cols-6 xl:grid-cols-8 gap-4 mt-3">
                                    <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-500 mb-1">Data Base Inicial</label><input type="date" value={baseStartDate ? baseStartDate.toISOString().split('T')[0] : ''} onChange={e => setBaseStartDate(e.target.value ? new Date(e.target.value) : null)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" /></div>
                                    <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-500 mb-1">Data Base Final</label><input type="date" value={baseEndDate ? baseEndDate.toISOString().split('T')[0] : ''} onChange={e => setBaseEndDate(e.target.value ? new Date(e.target.value) : null)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" /></div>
                                </div>
                            )}
                        </div>

                        {windows.length > 0 && (
                            <div className="mt-4 pt-2 border-t border-slate-100">
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
                                    {windows.map(w => (
                                        <div key={w.id} className="group relative min-w-[180px] px-3 py-3 bg-blue-50 border border-blue-200 text-blue-800 rounded text-xs flex items-center justify-between gap-2 shadow-sm flex-shrink-0">
                                            <div className="font-bold">{w.label}</div>
                                            <button onClick={() => handleRemoveWindow(w.id)} className="p-1 hover:bg-blue-200 rounded-full text-blue-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div className="flex justify-center pt-2">
                            <button onClick={runLegacyCalculation} disabled={isCalculating || windows.length === 0} className={`flex items-center gap-3 px-8 py-3 rounded-full text-sm font-bold shadow-md transition-all transform hover:scale-105 ${windows.length === 0 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-green-700 hover:bg-green-800 text-white cursor-pointer'}`}>
                                {isCalculating ? 'Processando Algoritmo...' : <><Play className="w-5 h-5" /> EXECUTAR CÁLCULO LEGADO</>}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {isCalculating ? (
                <div className="flex flex-col items-center justify-center p-16 bg-slate-50 border-2 border-dashed border-slate-300 rounded text-slate-600 min-h-[400px]">
                    <Loader2 className="w-48 h-48 animate-spin mb-6" />
                    <p className="text-sm font-medium">Processando cálculo legado...</p>
                </div>
            ) : results.length > 0 ? (
                <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden min-h-[calc(100vh-220px)]">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-2">
                        <div className="flex">
                            <button onClick={() => setActiveTab('detailed')} className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'detailed' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><TableIcon className="w-4 h-4" /> Férias Inteligentes</button>
                            <button onClick={() => setActiveTab('comparison')} className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'comparison' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><FileText className="w-4 h-4" /> Comparação</button>
                            <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'dashboard' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><BarChart2 className="w-4 h-4" /> Dashboard</button>
                        </div>
                        <div className="flex items-center gap-2 pr-2">
                            <button onClick={() => { 
                                setPendingFilters(filters); 
                                setShowFilterModal(true); 
                            }} className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded bg-blue-700 hover:bg-blue-800 text-white border border-blue-700">
                                <ListFilter className="w-3 h-3" /> Filtrar Dados
                            </button>
                            <button onClick={clearFilters} className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded bg-white text-slate-700 border border-slate-300 hover:bg-slate-50">
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
                                            value={pendingFilters.clientName ?? ''}
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
                    <div className="p-0">
                        {activeTab === 'detailed' && (
                            <div className="flex justify-end gap-2 px-4 py-2 border-b border-slate-200 bg-slate-50">
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
                        )}
                        {activeTab === 'dashboard' && (
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="p-4 bg-slate-50 rounded border border-slate-200"><div className="text-xs text-slate-500 uppercase font-bold">Total Colaboradores</div><div className="text-2xl font-bold text-slate-800">{filteredResults.length}</div></div>
                                    <div className="p-4 bg-slate-50 rounded border border-slate-200"><div className="text-xs text-slate-500 uppercase font-bold">Faturamento Total</div><div className="text-2xl font-bold text-slate-800">{formatCurrency(expectedRevenue)}</div></div>
                                    <div className="p-4 bg-slate-50 rounded border border-slate-200"><div className="text-xs text-slate-500 uppercase font-bold">Impacto Total</div><div className="text-2xl font-bold text-blue-700">{formatCurrency(filteredResults.reduce((sum, r) => sum + r.total_impact, 0))}</div></div>
                                    <div className="p-4 bg-slate-50 rounded border border-slate-200"><div className="text-xs text-slate-500 uppercase font-bold">Impacto % Faturamento</div><div className="text-2xl font-bold text-blue-700">{(filteredResults.reduce((sum, r) => sum + r.total_impact, 0) / expectedRevenue * 100).toFixed(2)}%</div></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-green-50 rounded border border-green-200">
                                        <div className="text-xs text-green-700 uppercase font-bold">Saving Total</div>
                                        <div className="text-3xl font-bold text-green-800">{formatCurrency(filteredResults.reduce((sum, r) => sum + r.savings, 0))}</div>
                                        <p className="text-xs text-green-600 mt-1">Economia em relação ao pior cenário possível</p>
                                    </div>
                                    <div className="p-4 bg-green-50 rounded border border-green-200">
                                        <div className="text-xs text-green-700 uppercase font-bold">Saving %</div>
                                        <div className="text-3xl font-bold text-green-800">
                                            {(filteredResults.reduce((sum, r) => sum + r.savings, 0) / filteredResults.reduce((sum, r) => sum + r.worst_case_impact, 0) * 100).toFixed(2)}%
                                        </div>
                                    </div>
                                </div>
                                {/* CHART SECTION */}
                                <div className="bg-white p-4 rounded border border-slate-200 shadow-sm mt-6">
                                    <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                                        <BarChart2 className="w-4 h-4" /> Distribuição de Impacto Financeiro por Janela
                                    </h3>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis
                                                    dataKey="name"
                                                    angle={-45}
                                                    textAnchor="end"
                                                    height={80}
                                                    interval={0}
                                                    tick={{ fontSize: 10 }}
                                                />
                                                <YAxis
                                                    tickFormatter={(value) => formatCurrency(value)}
                                                    tick={{ fontSize: 11 }}
                                                />
                                                <Tooltip
                                                    formatter={(value: number) => formatCurrency(value)}
                                                    labelStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                                                />
                                                <Bar dataKey="impact" name="Impacto Financeiro" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'detailed' && (
                            <div className="overflow-auto max-h-[calc(100vh-260px)]">
                                <table className="w-full text-xs border-collapse whitespace-nowrap">
                                    <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="px-4 py-3 text-left border-b border-r border-slate-200 min-w-[200px] sticky left-0 bg-slate-100 z-20">Nome</th>
                                            <th className="px-4 py-3 text-left border-b border-r border-slate-200">Cliente</th>
                                            <th className="px-4 py-3 text-right border-b border-slate-200">Rate</th>
                                            <th className="px-4 py-3 text-center border-b border-slate-200">Início das Férias</th>
                                            <th className="px-4 py-3 text-center border-b border-slate-200">Fim das Férias</th>
                                            <th className="px-4 py-3 text-center border-b border-slate-200 bg-yellow-50">Dias de Férias Calculados</th>
                                            <th className="px-4 py-3 text-center border-b border-slate-200 bg-yellow-50">Horas Úteis nas Férias</th>
                                            <th className="px-4 py-3 text-right border-b border-slate-200 bg-blue-50 font-bold">Impacto (R$)</th>
                                            {windows.map(w => (
                                                <React.Fragment key={w.id}>
                                                    <th className="px-4 py-3 text-right border-b border-slate-200 bg-white min-w-[160px] text-blue-700">{`Impacto - ${w.label}`}</th>
                                                    <th className="px-4 py-3 text-center border-b border-r border-slate-200 bg-slate-50 min-w-[180px] text-slate-600">{`Horas - ${w.label} ${formatWindowHeaderHours(Number(w.totalBusinessHours || 0))}`}</th>
                                                </React.Fragment>
                                            ))}

                                        </tr>
                                    </thead>
                                    <tbody>
                                        {processedResults.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="px-4 py-2 border-b border-r border-slate-100 font-medium sticky left-0 bg-white z-10">{row.employee_name}</td>
                                                <td className="px-4 py-2 border-b border-r border-slate-100">{row.client_name}</td>
                                                <td className="px-4 py-2 border-b border-slate-100 text-right">{row.rateFormatted}</td>
                                                <td className="px-4 py-2 border-b border-slate-100 text-center">{(row.start_dates || []).map((d, i) => <div key={i}>{new Date(d).toLocaleDateString('pt-BR')}</div>)}</td>
                                                <td className="px-4 py-2 border-b border-slate-100 text-center">{(row.end_dates || []).map((d, i) => <div key={i}>{new Date(d).toLocaleDateString('pt-BR')}</div>)}</td>
                                                <td className="px-4 py-2 border-b border-slate-100 text-center bg-yellow-50/30 font-bold">{row.breakdown}</td>
                                                <td className="px-4 py-2 border-b border-slate-100 text-center bg-yellow-50/30">{row.totalHoursFormatted}</td>
                                                <td className="px-4 py-2 border-b border-slate-100 text-right font-bold bg-blue-50/50 text-blue-800">{formatCurrency(row.total_impact)}</td>
                                                {row.windowData.map(wd => (
                                                    <React.Fragment key={wd.id}>
                                                        <td className="px-4 py-2 border-b border-slate-100 text-right text-blue-700 bg-blue-50/50 font-bold">{wd.impact}</td>
                                                        <td className="px-4 py-2 border-b border-slate-100 text-center text-slate-600 bg-slate-50/50 font-mono text-[11px]">{wd.hours}</td>
                                                    </React.Fragment>
                                                ))}

                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {activeTab === 'comparison' && (
                            <div className="overflow-auto max-h-[600px]">
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
                                        {filteredResults.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50">
                                                <td className="px-4 py-2 border-b border-slate-100 font-medium">{row.employee_name}</td>
                                                <td className="px-4 py-2 border-b border-slate-100 text-center"><span className="px-2 py-1 bg-slate-100 rounded text-[10px] text-slate-600">{row.vacation_type_label}</span></td>
                                                <td className="px-4 py-2 border-b border-slate-100 text-right">{formatCurrency(rateById[row.employee_id] || 0)}</td>
                                                <td className="px-4 py-2 border-b border-slate-100 text-right text-red-700 bg-red-50/50">{formatCurrency(row.worst_case_impact)}</td>
                                                <td className="px-4 py-2 border-b border-slate-100 text-right text-blue-700 bg-blue-50/50 font-bold">{formatCurrency(row.total_impact)}</td>
                                                <td className="px-4 py-2 border-b border-slate-100 text-right text-green-700 bg-green-50/50 font-bold">{formatCurrency(row.savings)}</td>
                                                <td className="px-4 py-2 border-b border-slate-100 text-right text-green-700 bg-green-50/50">{row.worst_case_impact ? (row.savings_percent * 100).toFixed(2) : '0.00'}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-12 bg-slate-50 border-2 border-dashed border-slate-300 rounded text-slate-400 min-h-[400px]">
                    <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
                    <p className="font-medium">Nenhum cálculo realizado ainda.</p>
                    <p className="text-sm mt-2 max-w-md text-center">1. Configure os dias, ano e parâmetros de negócio acima.<br />2. Clique em "Gerar Janelas" para definir o cronograma.<br />3. Clique em "Executar Cálculo Legado" para processar.</p>
                </div>
            )}
        </div>
    );
};

export default LegacyComparisonPage;
