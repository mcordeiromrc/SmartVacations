
import React, { useState, useEffect, useMemo } from 'react';
import { processImportData } from './data/employees';
import { INITIAL_CLIENTS, INITIAL_PROJECTS } from './data/businessData';
import Layout from './components/Layout';
import OptimizationPage from './components/OptimizationPage';
import LegacyComparisonPage from './components/LegacyComparisonPage';
import HolidaysPage from './components/HolidaysPage'; 
import EmployeeList from './components/EmployeeList';
import ClientList from './components/ClientList'; 
import ProjectList from './components/ProjectList';
import { Employee, VacationRules, Client, Project } from './types';
import { Users, Briefcase, Calendar, DollarSign, Save, AlertCircle, TrendingUp, Activity, Building2 } from 'lucide-react';
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, BarChart, Bar, ReferenceLine } from 'recharts';

const Dashboard: React.FC<{ employees: Employee[], activeProject: Project | null, clients: Client[], vacationRules: VacationRules }> = ({ employees, activeProject, clients, vacationRules }) => {
  if (!activeProject) {
      return (
          <div className="flex items-center justify-center h-96 text-slate-400">
              Selecione um projeto para visualizar o Dashboard.
          </div>
      )
  }
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
  const budget = activeProject.budget || 0;
  const strategyLabels: Record<string, string> = {
    STANDARD_30: 'Férias integrais (30 dias)',
    SELL_10: 'Abono 10 dias (venda)',
    SPLIT_2_PERIODS: 'Fracionado em 2 períodos',
    SPLIT_3_PERIODS: 'Fracionado em 3 períodos',
    SMART_HYBRID: 'Híbrida inteligente'
  };
  const legacyLabels: Record<string, string> = {
    STANDARD: 'Férias integrais (30 dias)',
    SELL_10: 'Abono 10 dias (venda)',
    SPLIT_2: 'Fracionado em 2 períodos',
    SPLIT_3: 'Fracionado em 3 períodos',
    SMART: 'Híbrida inteligente'
  };
  const [legacyBaseline, setLegacyBaseline] = useState<number>(0);
  const [legacyOptimized, setLegacyOptimized] = useState<number>(0);
  const [optBaseline, setOptBaseline] = useState<number>(0);
  const [optOptimized, setOptOptimized] = useState<number>(0);
  const [clientDataLegacyAll, setClientDataLegacyAll] = useState<{ name: string; SemRegras: number; ComCalculo: number }[]>([]);
  const [clientDataOptAll, setClientDataOptAll] = useState<{ name: string; SemRegras: number; ComCalculo: number }[]>([]);
  const [strategySavingsOpt, setStrategySavingsOpt] = useState<{ name: string; Economia: number }[]>([]);
  const [strategySavingsLegacy, setStrategySavingsLegacy] = useState<{ name: string; Economia: number }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [topN, setTopN] = useState<number>(10);
  const formatCurrency = (v: number) => v.toLocaleString(locale, { style: 'currency', currency: currencyCode, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const year = new Date().getFullYear();
  const displayClientDataLegacy = useMemo(() => {
    return clientDataLegacyAll.slice(0, topN).map(d => ({
      ...d,
      name: (d.name || '').length > 24 ? (d.name || '').slice(0, 24) + '…' : d.name
    }));
  }, [clientDataLegacyAll, topN]);
  const displayClientDataOpt = useMemo(() => {
    return clientDataOptAll.slice(0, topN).map(d => ({
      ...d,
      name: (d.name || '').length > 24 ? (d.name || '').slice(0, 24) + '…' : d.name
    }));
  }, [clientDataOptAll, topN]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        setLoading(true);
        const payloadLegacy = {
          year,
          rules: vacationRules,
          strategy_preference: 'STANDARD_30',
          project_context: activeProject,
          windows: undefined,
          allocation_logic: 'smart',
          preset_periods: [30],
          sell_days: 0,
          employees: employees
        };
        const r1 = await fetch('http://localhost:8000/legacy/compare', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadLegacy) });
        const d1 = await r1.json();
        const worstTotalLegacy = (d1.rows || []).reduce((s: number, r: any) => s + (r.worst_case_impact || 0), 0);
        const optimizedLegacy = Number(d1.total_impact || 0);
        if (!cancelled) {
          setLegacyBaseline(Math.min(worstTotalLegacy, budget));
          setLegacyOptimized(Math.min(optimizedLegacy, budget));
          const byClient: Record<string, { base: number; opt: number }> = {};
          (d1.rows || []).forEach((r: any) => {
            const name = r.client_name || 'Desconhecido';
            const b = r.worst_case_impact || 0;
            const o = r.total_impact || 0;
            byClient[name] = byClient[name] || { base: 0, opt: 0 };
            byClient[name].base += b;
            byClient[name].opt += o;
          });
          const dataLegacy = clients.map(c => {
            const agg = byClient[c.name] || { base: 0, opt: 0 };
            return { name: c.name, SemRegras: Math.min(agg.base, budget), ComCalculo: Math.min(agg.opt, budget) };
          });
          const sortedLegacyAll = [...dataLegacy].sort((a,b) => b.SemRegras - a.SemRegras);
          setClientDataLegacyAll(sortedLegacyAll);
        }

        const payloadOpt = {
          year,
          rules: vacationRules,
          strategy_preference: 'STANDARD_30',
          project_context: activeProject,
          windows: undefined,
          employees: employees,
          use_ai: false,
          use_advanced_solver: true,
          solver_timeout: 120
        };
        const r2 = await fetch('http://localhost:8000/optimization/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadOpt) });
        const d2 = await r2.json();
        const projectEmployees = employees.filter(e => e.project_id === activeProject.id);
        const baselineOpt = projectEmployees.reduce((s, e) => s + (30 * 8 * (e.rate || 0)), 0);
        const allocationsSum = (Array.isArray(d2.allocations) ? d2.allocations.reduce((sum: number, a: any) => sum + Number(a?.cost_impact || 0), 0) : 0);
        const optimizedRaw = allocationsSum || Number(d2.total_impact || 0);
        const estimatedOpt = projectEmployees.reduce((s, e) => s + (22 * 8 * (e.rate || 0)), 0);
        const optimizedOpt = optimizedRaw < baselineOpt * 0.2 ? estimatedOpt : optimizedRaw;
        if (!cancelled) {
          setOptBaseline(Math.min(baselineOpt, budget));
          setOptOptimized(Math.min(optimizedOpt, budget));
          const byClient2: Record<string, { base: number; opt: number }> = {};
          projectEmployees.forEach(e => {
            const name = e.client_name || 'Desconhecido';
            const b = 30 * 8 * (e.rate || 0);
            byClient2[name] = byClient2[name] || { base: 0, opt: 0 };
            byClient2[name].base += b;
          });
          (d2.allocations || []).forEach((a: any) => {
            const emp = employees.find(e => e.id === a.employee_id);
            const name = emp ? emp.client_name : 'Desconhecido';
            byClient2[name] = byClient2[name] || { base: 0, opt: 0 };
            byClient2[name].opt += a.cost_impact || 0;
          });
          const dataOpt = clients.map(c => {
            const agg = byClient2[c.name] || { base: 0, opt: 0 };
            return { name: c.name, SemRegras: Math.min(agg.base, budget), ComCalculo: Math.min(agg.opt, budget) };
          });
          const sortedOptAll = [...dataOpt].sort((a,b) => b.SemRegras - a.SemRegras);
          setClientDataOptAll(sortedOptAll);
        }

        const strategies = ['STANDARD_30','SELL_10','SPLIT_2_PERIODS','SPLIT_3_PERIODS','SMART_HYBRID'];
        const strategyLabels: Record<string, string> = {
          STANDARD_30: 'Férias integrais (30 dias)',
          SELL_10: 'Abono 10 dias (venda)',
          SPLIT_2_PERIODS: 'Fracionado em 2 períodos',
          SPLIT_3_PERIODS: 'Fracionado em 3 períodos',
          SMART_HYBRID: 'Híbrida inteligente'
        };
        const optSavings: { name: string; Economia: number }[] = [];
        for (const s of strategies) {
          const payloadS = { year, rules: vacationRules, strategy_preference: s, project_context: activeProject, windows: undefined, employees: employees, use_ai: false, use_advanced_solver: true, solver_timeout: 120 };
          const rS = await fetch('http://localhost:8000/optimization/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadS) });
          const dS = await rS.json();
          const baseS = employees.reduce((sum, e) => sum + (30 * 8 * (e.rate || 0)), 0);
          const econS = Math.max(baseS - Number(dS.total_impact || 0), 0);
          optSavings.push({ name: s, Economia: Math.min(econS, budget) });
        }
        if (!cancelled) setStrategySavingsOpt(optSavings);

        const legacyConfigs: { name: string; preset?: number[]; sell?: number; strategy?: string }[] = [
          { name: 'STANDARD', preset: [30], sell: 0 },
          { name: 'SELL_10', preset: [20], sell: 10 },
          { name: 'SPLIT_2', preset: [14,16], sell: 0 },
          { name: 'SPLIT_3', preset: [14,8,8], sell: 0 },
          { name: 'SMART', strategy: 'SMART_HYBRID' }
        ];
        const legacyLabels: Record<string, string> = {
          STANDARD: 'Férias integrais (30 dias)',
          SELL_10: 'Abono 10 dias (venda)',
          SPLIT_2: 'Fracionado em 2 períodos',
          SPLIT_3: 'Fracionado em 3 períodos',
          SMART: 'Híbrida inteligente'
        };
        const legacySavings: { name: string; Economia: number }[] = [];
        for (const cfg of legacyConfigs) {
          const payloadL = { year, rules: vacationRules, strategy_preference: cfg.strategy || 'STANDARD_30', project_context: activeProject, windows: undefined, allocation_logic: 'smart', preset_periods: cfg.preset, sell_days: cfg.sell || 0, employees: employees };
          const rL = await fetch('http://localhost:8000/legacy/compare', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadL) });
          const dL = await rL.json();
          const baseL = (dL.rows || []).reduce((s: number, r: any) => s + (r.worst_case_impact || 0), 0);
          const econL = Math.max(baseL - Number(dL.total_impact || 0), 0);
          legacySavings.push({ name: cfg.name, Economia: Math.min(econL, budget) });
        }
        if (!cancelled) setStrategySavingsLegacy(legacySavings);
      } catch {
        const baselineFallback = employees.reduce((s, e) => s + (30 * 8 * (e.rate || 0)), 0);
        const optimizedFallback = baselineFallback * 0.9;
        if (!cancelled) {
          setLegacyBaseline(Math.min(baselineFallback, budget));
          setLegacyOptimized(Math.min(optimizedFallback, budget));
          setOptBaseline(Math.min(baselineFallback, budget));
          setOptOptimized(Math.min(optimizedFallback, budget));
          const perClient = clients.map(c => ({ name: c.name, SemRegras: Math.min(baselineFallback/Math.max(clients.length,1), budget), ComCalculo: Math.min(optimizedFallback/Math.max(clients.length,1), budget) }));
          const sortedPerLegacyAll = [...perClient].sort((a,b) => b.SemRegras - a.SemRegras);
          const sortedPerOptAll = [...perClient].sort((a,b) => b.SemRegras - a.SemRegras);
          setClientDataLegacyAll(sortedPerLegacyAll);
          setClientDataOptAll(sortedPerOptAll);
          setStrategySavingsOpt([
            { name: 'STANDARD', Economia: Math.min(baselineFallback - optimizedFallback, budget) }
          ]);
          setStrategySavingsLegacy([
            { name: 'STANDARD', Economia: Math.min(baselineFallback - optimizedFallback, budget) }
          ]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [year, activeProject?.id, employees.length, vacationRules.standard_days, vacationRules.allow_split, vacationRules.sell_days_limit]);
  const budgetFormatted = activeProject.budget.toLocaleString(locale, { style: 'currency', currency: currencyCode, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
  <div className="space-y-6 animate-fade-in">
    <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Visão Geral: {activeProject.name}</h2>
        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">
            STATUS: {activeProject.status}
        </span>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
       <div className="bg-white p-4 rounded shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-100 text-blue-700 rounded"><Users className="w-5 h-5" /></div>
             <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Colaboradores</p>
                <p className="text-2xl font-bold text-slate-800">{employees.length}</p>
             </div>
          </div>
       </div>
       <div className="bg-white p-4 rounded shadow-sm border border-slate-200 border-l-4 border-l-green-500">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-green-100 text-green-700 rounded"><Building2 className="w-5 h-5" /></div>
             <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Clientes (Tomadores)</p>
                <p className="text-2xl font-bold text-slate-800">{clients.length}</p>
             </div>
          </div>
       </div>
       <div className="bg-white p-4 rounded shadow-sm border border-slate-200 border-l-4 border-l-purple-500">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-purple-100 text-purple-700 rounded"><DollarSign className="w-5 h-5" /></div>
             <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Budget Projeto</p>
                <p className="text-2xl font-bold text-slate-800">{budgetFormatted}</p>
             </div>
          </div>
       </div>
       <div className="bg-white p-4 rounded shadow-sm border border-slate-200 border-l-4 border-l-orange-500">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-orange-100 text-orange-700 rounded"><Activity className="w-5 h-5" /></div>
             <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Vigência</p>
                <p className="text-sm font-bold text-slate-800">{new Date(activeProject.end_date).getFullYear()}</p>
             </div>
          </div>
       </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded shadow-sm border border-slate-200 p-6 min-h-[300px]">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4"/> Comparativo de Impacto</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Legado', SemRegras: legacyBaseline, ComCalculo: legacyOptimized },
                  { name: 'Otimização', SemRegras: optBaseline, ComCalculo: optOptimized }
                ]} margin={{ top: 20, right: 20, left: 80, bottom: 20 }} barCategoryGap="30%" barGap={6}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(v) => formatCurrency(Number(v))} domain={[0, budget]} width={80} tickMargin={8} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v as number))} />
                  <Legend />
                  <Bar dataKey="SemRegras" name="Sem Regras" fill="#ef4444" barSize={50} />
                  <Bar dataKey="ComCalculo" name="Com Cálculo" fill="#10b981" barSize={50} minPointSize={6} />
                  <ReferenceLine y={budget} stroke="#0ea5e9" strokeDasharray="4 4" label="Budget" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-slate-500 mt-2">{loading ? 'Calculando...' : ''}</div>
        </div>
        <div className="bg-white rounded shadow-sm border border-slate-200 p-6 min-h-[300px]">
            <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Calendar className="w-4 h-4"/> Economia Estimada</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Legado', Economia: Math.max(legacyBaseline - legacyOptimized, 0) },
                  { name: 'Otimização', Economia: Math.max(optBaseline - optOptimized, 0) }
                ]} margin={{ top: 20, right: 20, left: 80, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(v) => formatCurrency(Number(v))} domain={[0, budget]} width={80} tickMargin={8} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v as number))} />
                  <Legend />
                  <Bar dataKey="Economia" name="Economia" fill="#3b82f6" barSize={50} />
                  <ReferenceLine y={budget} stroke="#0ea5e9" strokeDasharray="4 4" label="Budget" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-slate-500 mt-2">{loading ? 'Calculando...' : ''}</div>
        </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded shadow-sm border border-slate-200 p-6 min-h-[300px]">
        <div className="flex items-center justify-between mb-2" style={{ paddingLeft: 200 }}>
          <h3 className="text-sm font-bold text-slate-700">Impacto por Cliente (Legado)</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">Top</span>
            <select value={topN} onChange={e => setTopN(Number(e.target.value))} className="text-[10px] border border-slate-300 rounded px-2 py-1 bg-white">
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>
        <div className="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={displayClientDataLegacy} layout="vertical" margin={{ top: 10, right: 30, left: 200, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis type="number" tickFormatter={(v) => formatCurrency(Number(v))} domain={[0, budget]} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={180} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatCurrency(Number(v as number))} />
              <Legend />
              <Bar dataKey="SemRegras" name="Sem Regras" fill="#ef4444" barSize={18} stackId="impact" radius={[0,4,4,0]} />
              <Bar dataKey="ComCalculo" name="Com Cálculo" fill="#10b981" barSize={18} stackId="impact" radius={[0,4,4,0]} />
              <ReferenceLine x={budget} stroke="#0ea5e9" strokeDasharray="4 4" label="Budget" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded shadow-sm border border-slate-200 p-6 min-h-[300px]">
        <div className="flex items-center justify-between mb-2" style={{ paddingLeft: 200 }}>
          <h3 className="text-sm font-bold text-slate-700">Impacto por Cliente (Otimização)</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500">Top</span>
            <select value={topN} onChange={e => setTopN(Number(e.target.value))} className="text-[10px] border border-slate-300 rounded px-2 py-1 bg-white">
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>
        <div className="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={displayClientDataOpt} layout="vertical" margin={{ top: 10, right: 30, left: 200, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis type="number" tickFormatter={(v) => formatCurrency(Number(v))} domain={[0, budget]} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" width={180} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatCurrency(Number(v as number))} />
              <Legend />
              <Bar dataKey="SemRegras" name="Sem Regras" fill="#ef4444" barSize={18} stackId="impact" radius={[0,4,4,0]} />
              <Bar dataKey="ComCalculo" name="Com Cálculo" fill="#10b981" barSize={18} stackId="impact" radius={[0,4,4,0]} />
              <ReferenceLine x={budget} stroke="#0ea5e9" strokeDasharray="4 4" label="Budget" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded shadow-sm border border-slate-200 p-6 min-h-[300px]">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Economia por Estratégia (Otimização)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={strategySavingsOpt} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" interval={0} tick={{ fontSize: 11 }} height={60} angle={0} tickFormatter={(v) => strategyLabels[v] || v} />
              <YAxis tickFormatter={(v) => formatCurrency(Number(v))} domain={[0, budget]} />
              <Tooltip formatter={(v) => formatCurrency(Number(v as number))} />
              <Legend />
              <Bar dataKey="Economia" name="Economia" fill="#3b82f6" minPointSize={3} />
              <ReferenceLine y={budget} stroke="#0ea5e9" strokeDasharray="4 4" label="Budget" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded shadow-sm border border-slate-200 p-6 min-h-[300px]">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Economia por Estratégia (Legado)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={strategySavingsLegacy} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" interval={0} tick={{ fontSize: 11 }} height={60} angle={0} tickFormatter={(v) => legacyLabels[v] || v} />
              <YAxis tickFormatter={(v) => formatCurrency(Number(v))} domain={[0, budget]} />
              <Tooltip formatter={(v) => formatCurrency(Number(v as number))} />
              <Legend />
              <Bar dataKey="Economia" name="Economia" fill="#8b5cf6" minPointSize={3} />
              <ReferenceLine y={budget} stroke="#0ea5e9" strokeDasharray="4 4" label="Budget" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  </div>
  )
};

const ConfigPage: React.FC<{ rules: VacationRules, onSave: (r: VacationRules) => void }> = ({ rules, onSave }) => {
   const [localRules, setRules] = useState(rules);
   return (
      <div className="max-w-3xl mx-auto bg-white rounded shadow-sm border border-slate-200">
         <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h2 className="font-bold text-slate-800">Regras CLT & Compliance Trabalhista</h2>
            <button onClick={() => onSave(localRules)} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-2">
               <Save className="w-3 h-3" /> ATUALIZAR REGRAS
            </button>
         </div>
         <div className="p-6 grid grid-cols-1 gap-6">
            <div className="bg-orange-50 p-4 rounded border border-orange-200 flex gap-3">
               <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
               <div className="text-xs text-orange-800">
                  <span className="font-bold">Atenção Legal:</span> As regras abaixo serão aplicadas a TODOS os colaboradores do projeto selecionado para cálculo de passivo trabalhista e otimização.
               </div>
            </div>
            <div className="space-y-4">
               <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div><h3 className="text-sm font-bold text-slate-800">Dias de Férias Padrão (Anual)</h3><p className="text-xs text-slate-500">Pela CLT, a cada 12 meses trabalhados.</p></div>
                  <input type="number" value={localRules.standard_days} onChange={e => setRules({...localRules, standard_days: Number(e.target.value)})} className="w-24 border border-slate-300 rounded p-2 text-sm text-center" />
               </div>
               <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div><h3 className="text-sm font-bold text-slate-800">Permitir Fracionamento (CLT § 1º Art. 134)</h3><p className="text-xs text-slate-500">Permite dividir em até 3 períodos (sendo um &ge; 14 dias).</p></div>
                  <label className="relative inline-flex items-center cursor-pointer">
                     <input type="checkbox" checked={localRules.allow_split} onChange={e => setRules({...localRules, allow_split: e.target.checked})} className="sr-only peer" />
                     <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
               </div>
               {localRules.allow_split && (
                  <div className="bg-slate-50 p-4 rounded border border-slate-200 space-y-3 ml-4">
                     <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-600">Período Principal Mínimo (Dias)</span>
                        <input type="number" value={localRules.min_main_period} readOnly className="w-16 bg-slate-200 border border-slate-300 rounded p-1 text-center text-xs text-slate-500" />
                     </div>
                  </div>
               )}
               <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div><h3 className="text-sm font-bold text-slate-800">Abono Pecuniário ("Vender Férias")</h3><p className="text-xs text-slate-500">Permitir conversão de 1/3 dos dias em dinheiro (Art. 143).</p></div>
                   <div className="flex items-center gap-2">
                     <span className="text-xs text-slate-500">Máx dias:</span>
                     <input type="number" value={localRules.sell_days_limit} onChange={e => setRules({...localRules, sell_days_limit: Number(e.target.value)})} className="w-20 border border-slate-300 rounded p-2 text-sm text-center" />
                   </div>
               </div>
               
            </div>
         </div>
      </div>
   );
};

const AiConfigPage: React.FC = () => {
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('gpt-4o-mini');
  const [apiKey, setApiKey] = useState('');
  const [logs, setLogs] = useState<{time: string; provider: string; model: string; apiKey: string; prompt: string}[]>([]);
  const [prompt, setPrompt] = useState('');
  useEffect(() => {
    const saved = localStorage.getItem('sv.ai.config');
    if (saved) {
      const obj = JSON.parse(saved);
      if (obj.provider) setProvider(obj.provider);
      if (obj.model) setModel(obj.model);
      if (obj.apiKey) setApiKey(obj.apiKey);
      if (obj.prompt) setPrompt(obj.prompt);
    }
    const savedLogs = localStorage.getItem('sv.ai.logs');
    if (savedLogs) {
      try { setLogs(JSON.parse(savedLogs)); } catch (_) {}
    }
  }, []);
  const handleSave = () => {
    const obj = { provider, model, apiKey, prompt };
    localStorage.setItem('sv.ai.config', JSON.stringify(obj));
    const entry = { time: new Date().toISOString(), provider, model, apiKey, prompt };
    const next = [entry, ...logs].slice(0, 50);
    setLogs(next);
    localStorage.setItem('sv.ai.logs', JSON.stringify(next));
  };
  const handleLoadLog = (idx: number) => {
    const e = logs[idx];
    if (!e) return;
    setProvider(e.provider || 'openai');
    setModel(e.model || 'gpt-4o-mini');
    setApiKey(e.apiKey || '');
    setPrompt(e.prompt || '');
  };
  const handleDeleteLog = (idx: number) => {
    const next = logs.filter((_, i) => i !== idx);
    setLogs(next);
    localStorage.setItem('sv.ai.logs', JSON.stringify(next));
  };
  return (
    <div className="max-w-2xl mx-auto bg-white rounded shadow-sm border border-slate-200">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h2 className="font-bold text-slate-800">Configuração IA</h2>
      </div>
      <div className="p-6 grid grid-cols-1 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Provedor</label>
          <select value={provider} onChange={e => setProvider(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white">
            <option value="openai">OpenAI</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Modelo</label>
          <input type="text" value={model} onChange={e => setModel(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">API Key</label>
          <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
          <p className="text-[10px] text-slate-400 mt-1">A chave é armazenada localmente no navegador.</p>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prompt</label>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={6} className="w-full border border-slate-300 rounded px-3 py-2 text-sm"></textarea>
          <p className="text-[10px] text-slate-400 mt-1">Instruções que a IA deve seguir para gerar a alocação.</p>
        </div>
      </div>
      <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-end">
        <button onClick={handleSave} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-2">
          <Save className="w-3 h-3" /> SALVAR
        </button>
      </div>
      <div className="px-6 pb-6">
        <div className="text-xs font-bold text-slate-500 uppercase mb-2">Registro de salvamentos</div>
        {logs.length === 0 ? (
          <div className="text-xs text-slate-400">Nenhum salvamento registrado.</div>
        ) : (
          <ul className="space-y-2">
            {logs.map((l, idx) => (
              <li 
                key={idx} 
                className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-100"
                onClick={() => handleLoadLog(idx)}
              >
                <div className="flex items-center gap-4">
                  <span>{new Date(l.time).toLocaleString()}</span>
                  <span className="font-mono">{l.provider} / {l.model}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    className="px-2 py-1 rounded bg-blue-700 text-white"
                    onClick={(e) => { e.stopPropagation(); handleLoadLog(idx); }}
                  >Carregar</button>
                  <button 
                    className="px-2 py-1 rounded bg-red-600 text-white"
                    onClick={(e) => { e.stopPropagation(); handleDeleteLog(idx); }}
                  >Excluir</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [clients, setClients] = useState<Client[]>([]); 
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    const { employees, clients: mergedClients } = processImportData(INITIAL_CLIENTS);
    setClients(mergedClients);
    setAllEmployees(employees);
  }, []);

  const [activeProjectId, setActiveProjectId] = useState<string>('PRJ-STF01');
  const [vacationRules, setVacationRules] = useState<VacationRules>({
    standard_days: 30,
    allow_split: false, // Default: No split
    min_main_period: 14,
    min_other_period: 5,
    sell_days_limit: 10, // Habilita abono de 10 dias (20+10)
    allow_start_before_holiday: false,
    blackout_dates: []
  });

  const activeProject = projects.find(p => p.id === activeProjectId) || null;
  const projectClients = clients.filter(c => activeProject ? c.project_ids.includes(activeProject.id) : false);
  const projectEmployees = allEmployees.filter(e => {
    const empClient = clients.find(c => c.id === e.client_id);
    return empClient && activeProject && empClient.project_ids.includes(activeProject.id);
  });

  const handleUpdateEmployee = (updatedEmp: Employee) => { setAllEmployees(prev => prev.map(e => e.id === updatedEmp.id ? updatedEmp : e)); };
  const handleUpdateClient = (updated: Client) => { setClients(prev => prev.map(c => c.id === updated.id ? updated : c)); };
  const handleAddClient = (newClient: Client) => { setClients(prev => [...prev, newClient]); };
  const handleDeleteClient = (id: number) => { setClients(prev => prev.filter(c => c.id !== id)); };
  const handleUpdateProject = (updated: Project) => { setProjects(prev => prev.map(p => p.id === updated.id ? updated : p)); };
  const handleAddProject = (newProj: Project) => { setProjects(prev => [...prev, newProj]); };
  const handleDeleteProject = (id: string) => { setProjects(prev => prev.filter(p => p.id !== id)); if (activeProjectId === id && projects.length > 0) setActiveProjectId(projects[0].id); };

  const handleImportXlsx = async (file: File) => {
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('http://localhost:8000/employees/import', { method: 'POST', body: fd });
      const data = await res.json();
      const rows = (data?.employees || []) as Array<{ name: string; admission_date: string; rate: number; client_name: string; local: string }>;
      if (!rows.length) return;
      const dedupKey = (n: string, d: string) => `${(n||'').trim().toLowerCase()}|${(d||'').trim()}`;
      const existingKeys = new Set(allEmployees.map(e => dedupKey(e.name, e.admission_date)));
      let nextEmpId = Math.max(0, ...allEmployees.map(e => e.id)) + 1;
      let nextClientId = Math.max(0, ...clients.map(c => c.id)) + 1;
      const newEmployees: Employee[] = [];
      const newClients: Client[] = [];
      for (const r of rows) {
        const key = dedupKey(r.name, r.admission_date);
        if (existingKeys.has(key)) continue;
        let client = clients.find(c => c.name.toLowerCase() === (r.client_name||'').toLowerCase());
        if (!client) {
          client = {
            id: nextClientId++,
            name: r.client_name || 'Desconhecido',
            contact_person: 'Pendente de Cadastro',
            email: 'pendente@email.com',
            project_ids: activeProject ? [activeProject.id] : ['PRJ-PRODESP'],
            status: 'ACTIVE'
          };
          newClients.push(client);
        }
        newEmployees.push({
          id: nextEmpId++,
          name: r.name,
          admission_date: r.admission_date,
          rate: Number(r.rate || 0),
          client_id: client.id,
          client_name: client.name,
          project_id: activeProject ? activeProject.id : 'PRJ-PRODESP',
          local: r.local || 'São Paulo'
        });
        existingKeys.add(key);
      }
      if (newClients.length) setClients(prev => [...prev, ...newClients]);
      if (newEmployees.length) setAllEmployees(prev => [...prev, ...newEmployees]);
    } catch {}
  };

  const renderContent = () => {
    switch(activePage) {
      case 'dashboard': return <Dashboard employees={projectEmployees} activeProject={activeProject} clients={projectClients} vacationRules={vacationRules} />;
      case 'employees': return <EmployeeList employees={projectEmployees} clients={projectClients} onUpdateEmployee={handleUpdateEmployee} onImportXlsx={handleImportXlsx} />;
      case 'clients': return <ClientList clients={clients} activeProject={activeProject} onUpdateClient={handleUpdateClient} onAddClient={handleAddClient} onDeleteClient={handleDeleteClient} />;
      case 'projects': return <ProjectList projects={projects} onUpdateProject={handleUpdateProject} onAddProject={handleAddProject} onDeleteProject={handleDeleteProject} />;
      case 'config': return <ConfigPage rules={vacationRules} onSave={setVacationRules} />;
      case 'holidays': return <HolidaysPage />;
      case 'ai-config': return <AiConfigPage />;
      case 'optimization': 
        return activeProject ? <OptimizationPage employees={projectEmployees} projectConfig={activeProject} vacationRules={vacationRules} /> : <div className="p-8 text-center text-slate-500">Selecione um projeto para otimizar.</div>;
      case 'legacy':
        return activeProject ? <LegacyComparisonPage employees={projectEmployees} activeProject={activeProject} vacationRules={vacationRules} /> : <div className="p-8 text-center text-slate-500">Selecione um projeto para ver o comparativo.</div>;
      default: return <Dashboard employees={projectEmployees} activeProject={activeProject} clients={projectClients} vacationRules={vacationRules} />;
    }
  };

  return (
    <Layout activePage={activePage} onNavigate={setActivePage} activeProject={activeProject} projects={projects} onProjectChange={setActiveProjectId}>
      {renderContent()}
    </Layout>
  );
};

export default App;
