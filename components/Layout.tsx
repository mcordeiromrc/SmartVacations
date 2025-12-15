// =========================================================
//  SmartVacations - Enterprise 1.0
//  (by Leonardo Baladão and Marcio Roberto Cordeiro - 2025)
// =========================================================

import React, { ReactNode } from 'react';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Settings,
  Zap,
  LogOut,
  Bell,
  Search,
  Menu,
  HelpCircle,
  Building2,
  ChevronDown,
  History,
  Calendar
} from 'lucide-react';
import { Project } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onNavigate: (page: string) => void;
  activeProject: Project | null;
  projects: Project[];
  onProjectChange: (projectId: string) => void;
}

const SidebarItem: React.FC<{
  icon: React.ElementType,
  label: string,
  active: boolean,
  onClick: () => void
}> = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors
      ${active
        ? 'bg-blue-900 text-white border-l-4 border-blue-400'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white border-l-4 border-transparent'
      }`}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

const Layout: React.FC<LayoutProps> = ({
  children,
  activePage,
  onNavigate,
  activeProject,
  projects,
  onProjectChange
}) => {
  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">

      {/* Sidebar - Enterprise Dark Style */}
      <aside className="w-64 bg-slate-900 flex-shrink-0 flex flex-col shadow-xl z-20">
        <div className="h-14 flex items-center px-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-bold tracking-tight">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-xs">SV</div>
            <span>SmartVacations</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-1">
          <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Gestão do Projeto
          </div>
          <SidebarItem
            icon={LayoutDashboard}
            label="Dashboard Executivo"
            active={activePage === 'dashboard'}
            onClick={() => onNavigate('dashboard')}
          />
          <SidebarItem
            icon={Building2}
            label="Carteira de Clientes"
            active={activePage === 'clients'}
            onClick={() => onNavigate('clients')}
          />
          <SidebarItem
            icon={Users}
            label="Colaboradores"
            active={activePage === 'employees'}
            onClick={() => onNavigate('employees')}
          />

          <div className="mt-6 px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Admin Global
          </div>
          <SidebarItem
            icon={Briefcase}
            label="Meus Projetos"
            active={activePage === 'projects'}
            onClick={() => onNavigate('projects')}
          />
          <SidebarItem
            icon={Calendar}
            label="Feriados (LATAM)"
            active={activePage === 'holidays'}
            onClick={() => onNavigate('holidays')}
          />

          <div className="mt-6 px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Intelligence
          </div>
          <SidebarItem
            icon={Zap}
            label="Motor de Otimização"
            active={activePage === 'optimization'}
            onClick={() => onNavigate('optimization')}
          />
          <SidebarItem
            icon={History}
            label="Comparativo Legado"
            active={activePage === 'legacy'}
            onClick={() => onNavigate('legacy')}
          />
          <SidebarItem
            icon={Zap}
            label="Configuração IA (Em desenvolvimento)"
            active={activePage === 'ai-config'}
            onClick={() => onNavigate('ai-config')}
          />

          <div className="mt-6 px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            System
          </div>
          <SidebarItem
            icon={Settings}
            label="Configuração CLT"
            active={activePage === 'config'}
            onClick={() => onNavigate('config')}
          />
        </div>

        <div className="p-4 border-t border-slate-800">
          <button className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors w-full">
            <LogOut className="w-4 h-4" /> Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Navigation Bar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-slate-500"><Menu className="w-5 h-5" /></button>

            {/* Project Context Selector */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 hover:border-blue-400 transition-colors cursor-pointer group relative">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase leading-none">Contexto do Projeto</span>
                <select
                  value={activeProject?.id || ''}
                  onChange={(e) => onProjectChange(e.target.value)}
                  className="bg-transparent text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer pr-4"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 bottom-2 pointer-events-none" />
            </div>

            <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>

            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar Transações, ID..."
                className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 w-64 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-slate-500 hover:text-slate-700 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <button className="text-slate-500 hover:text-slate-700">
              <HelpCircle className="w-5 h-5" />
            </button>
            <div className="h-8 w-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
              AD
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-bold text-slate-700">Admin User</p>
              <p className="text-[10px] text-slate-500">SmartVacations Ent.</p>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
          {children}

          <footer className="mt-auto pt-6 pb-2 text-right">
            <p className="text-xs text-slate-400 font-medium">
              SmartVacations - Enterprise - (by Leonardo Baladão and Marcio Roberto Cordeiro - 2025)
            </p>
          </footer>        </main>
      </div>
    </div>
  );
};

export default Layout;
