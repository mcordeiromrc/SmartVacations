// =========================================================
//  SmartVacations - Enterprise 1.0
//  (by Leonardo Baladão and Marcio Roberto Cordeiro - 2025)
// =========================================================

import React, { useState, useRef } from 'react';
import { Project } from '../types';
import { Edit2, Save, X, Search, Briefcase, Plus, Trash2, Globe, Users } from 'lucide-react';

interface ProjectListProps {
   projects: Project[];
   onUpdateProject: (updated: Project) => void;
   onAddProject: (proj: Project) => void;
   onDeleteProject: (id: string) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, onUpdateProject, onAddProject, onDeleteProject }) => {
   const [editingId, setEditingId] = useState<string | null>(null);
   const [isAdding, setIsAdding] = useState(false);
   const [formData, setFormData] = useState<Partial<Project>>({});
   const [searchTerm, setSearchTerm] = useState('');

   const handleEditClick = (proj: Project) => {
      setEditingId(proj.id);
      setFormData({ ...proj });
      setIsAdding(false);
   };

   const handleAddClick = () => {
      setFormData({
         id: `PRJ-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
         status: 'PLANNING',
         name: '',
         manager: '',
         budget: 0,
         currency_code: 'BRL',
         start_date: new Date().toISOString().split('T')[0],
         end_date: new Date().toISOString().split('T')[0],
         description: '',
         max_concurrency_percent: 10,
         preferred_start_weekday: 1, // Segunda
         country_code: 'BR'
      });
      setIsAdding(true);
      setEditingId(null);
   };

   const handleSave = () => {
      if (formData.name && formData.id) {
         const payload = { ...formData } as Project;

         if (isAdding) {
            onAddProject(payload);
         } else {
            onUpdateProject(payload);
         }
         setEditingId(null);
         setIsAdding(false);
         setFormData({});
      }
   };

   const filteredProjects = projects.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
   );

   return (
      <div className="space-y-4">
         {/* Header */}
         <div className="flex justify-between items-center bg-white p-4 rounded border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
               <Briefcase className="w-5 h-5 text-blue-700" />
               Gestão Global de Projetos
            </h2>
            <div className="flex gap-3">
               <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                     type="text"
                     placeholder="Buscar projetos..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="pl-9 pr-4 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 w-64"
                  />
               </div>
               <button onClick={handleAddClick} className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Novo Projeto
               </button>
            </div>
         </div>

         {/* Table */}
         <div className="bg-white rounded shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-300">
                     <tr>
                        <th className="px-6 py-3">ID Projeto</th>
                        <th className="px-6 py-3">Nome do Projeto</th>
                        <th className="px-6 py-3">Gerente</th>
                        <th className="px-6 py-3">Vigência</th>
                        <th className="px-6 py-3 text-right">Budget (Anual)</th>
                        <th className="px-6 py-3 text-center">Regras Férias</th>
                        <th className="px-6 py-3 text-center">Status</th>
                        <th className="px-6 py-3 text-center">Ações</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {filteredProjects.map((proj) => (
                        <tr key={proj.id} className="hover:bg-blue-50 transition-colors">
                           <td className="px-6 py-3 font-mono text-slate-500">{proj.id}</td>
                           <td className="px-6 py-3 font-medium text-slate-800">{proj.name}</td>
                           <td className="px-6 py-3">{proj.manager}</td>
                           <td className="px-6 py-3 text-slate-500">
                              {new Date(proj.start_date).toLocaleDateString('pt-BR')} - {new Date(proj.end_date).toLocaleDateString('pt-BR')}
                           </td>
                           <td className="px-6 py-3 text-right font-mono font-medium text-blue-700">
                              {proj.budget.toLocaleString(
                                 proj.currency_code === 'BRL' ? 'pt-BR' : (
                                    proj.currency_code === 'ARS' ? 'es-AR' :
                                       proj.currency_code === 'CLP' ? 'es-CL' :
                                          proj.currency_code === 'COP' ? 'es-CO' :
                                             proj.currency_code === 'MXN' ? 'es-MX' :
                                                proj.currency_code === 'PEN' ? 'es-PE' :
                                                   proj.currency_code === 'UYU' ? 'es-UY' :
                                                      proj.currency_code === 'PYG' ? 'es-PY' :
                                                         proj.currency_code === 'BOB' ? 'es-BO' : 'pt-BR'
                                 ),
                                 { style: 'currency', currency: proj.currency_code || 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }
                              )}
                           </td>
                           <td className="px-6 py-3 text-center text-xs text-slate-500">
                              <div className="flex justify-center items-center gap-2">
                                 <span title="Concorrência Máxima" className="bg-slate-100 px-1 rounded border border-slate-200">{proj.max_concurrency_percent || 10}% Max</span>
                                 <span title="Dia Preferencial" className="bg-blue-50 text-blue-700 px-1 rounded border border-blue-100 font-bold">Dia {proj.preferred_start_weekday || 1}</span>
                              </div>
                           </td>
                           <td className="px-6 py-3 text-center">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold border 
                             ${proj.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                    proj.status === 'COMPLETED' ? 'bg-green-100 text-green-700 border-green-200' :
                                       proj.status === 'PLANNING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                          'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                 {proj.status.replace('_', ' ')}
                              </span>
                           </td>
                           <td className="px-6 py-3 text-center flex justify-center gap-2">
                              <button onClick={() => handleEditClick(proj)} className="text-slate-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => onDeleteProject(proj.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Modal */}
         {(editingId || isAdding) && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
               <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl border border-slate-200 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                  <div className="bg-blue-700 px-6 py-4 flex justify-between items-center text-white rounded-t-lg sticky top-0 z-10">
                     <h3 className="font-bold text-lg">{isAdding ? 'Novo Projeto' : 'Editar Projeto'}</h3>
                     <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="hover:bg-blue-600 rounded p-1"><X className="w-5 h-5" /></button>
                  </div>

                  <div className="p-6 space-y-4">
                     <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ID (Gerado)</label>
                           <input value={formData.id} disabled className="w-full bg-slate-100 border border-slate-300 rounded px-3 py-2 text-sm font-mono text-slate-500" />
                        </div>
                        <div className="col-span-2">
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Projeto</label>
                           <input
                              value={formData.name || ''}
                              onChange={e => setFormData({ ...formData, name: e.target.value })}
                              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gerente Responsável</label>
                           <input
                              value={formData.manager || ''}
                              onChange={e => setFormData({ ...formData, manager: e.target.value })}
                              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Budget Anual</label>
                           <input
                              type="number"
                              step="0.01" // Permitir float/centavos
                              value={formData.budget || 0}
                              onChange={e => setFormData({ ...formData, budget: Number(e.target.value) })}
                              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                           />
                           <p className="text-[10px] text-slate-400 mt-1">Mensal Esperado: {((formData.budget || 0) / 12).toLocaleString(
                              (formData.currency_code || 'BRL') === 'BRL' ? 'pt-BR' : (
                                 formData.currency_code === 'ARS' ? 'es-AR' :
                                    formData.currency_code === 'CLP' ? 'es-CL' :
                                       formData.currency_code === 'COP' ? 'es-CO' :
                                          formData.currency_code === 'MXN' ? 'es-MX' :
                                             formData.currency_code === 'PEN' ? 'es-PE' :
                                                formData.currency_code === 'UYU' ? 'es-UY' :
                                                   formData.currency_code === 'PYG' ? 'es-PY' :
                                                      formData.currency_code === 'BOB' ? 'es-BO' : 'pt-BR'
                              ),
                              { style: 'currency', currency: formData.currency_code || 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }
                           )}</p>
                        </div>
                     </div>

                     {/* NOVOS CAMPOS DE REGRA */}
                     <div className="bg-slate-50 p-3 rounded border border-slate-200">
                        <h4 className="text-xs font-bold text-slate-600 uppercase mb-2 flex items-center gap-1"><Users className="w-3 h-3" /> Regras de Otimização Específicas</h4>
                        <div className="grid grid-cols-3 gap-4">
                           <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Max % Concorrência</label>
                              <input
                                 type="number"
                                 value={formData.max_concurrency_percent || 10}
                                 onChange={e => setFormData({ ...formData, max_concurrency_percent: Number(e.target.value) })}
                                 className="w-full border border-slate-300 rounded px-2 py-1 text-sm text-center"
                              />
                           </div>
                           <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dia Preferencial Início</label>
                              <select
                                 value={formData.preferred_start_weekday || 1}
                                 onChange={e => setFormData({ ...formData, preferred_start_weekday: Number(e.target.value) })}
                                 className="w-full border border-slate-300 rounded px-2 py-1 text-sm bg-white"
                              >
                                 <option value="1">Segunda-feira</option>
                                 <option value="2">Terça-feira</option>
                                 <option value="3">Quarta-feira</option>
                                 <option value="4">Quinta-feira</option>
                                 <option value="5">Sexta-feira</option>
                              </select>
                           </div>
                           <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">País (Feriados)</label>
                              <select
                                 value={formData.country_code || 'BR'}
                                 onChange={e => setFormData({ ...formData, country_code: e.target.value })}
                                 className="w-full border border-slate-300 rounded px-2 py-1 text-sm bg-white"
                              >
                                 <option value="BR">Brasil</option>
                                 <option value="AR">Argentina</option>
                                 <option value="CL">Chile</option>
                                 <option value="CO">Colômbia</option>
                                 <option value="MX">México</option>
                              </select>
                           </div>
                           <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Moeda</label>
                              <select
                                 value={formData.currency_code || 'BRL'}
                                 onChange={e => setFormData({ ...formData, currency_code: e.target.value })}
                                 className="w-full border border-slate-300 rounded px-2 py-1 text-sm bg-white"
                              >
                                 <option value="BRL">R$ Real (Brasil)</option>
                                 <option value="ARS">$ Peso (Argentina)</option>
                                 <option value="CLP">$ Peso (Chile)</option>
                                 <option value="COP">$ Peso (Colômbia)</option>
                                 <option value="MXN">$ Peso (México)</option>
                                 <option value="PEN">S/ Sol (Peru)</option>
                                 <option value="UYU">$ Peso (Uruguai)</option>
                                 <option value="PYG">₲ Guarani (Paraguai)</option>
                                 <option value="BOB">Bs Boliviano (Bolívia)</option>
                              </select>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Início</label>
                           <input
                              type="date"
                              value={formData.start_date}
                              onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Fim</label>
                           <input
                              type="date"
                              value={formData.end_date}
                              onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                           />
                        </div>
                     </div>

                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição</label>
                        <textarea
                           value={formData.description || ''}
                           onChange={e => setFormData({ ...formData, description: e.target.value })}
                           className="w-full border border-slate-300 rounded px-3 py-2 text-sm h-20"
                        />
                     </div>

                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status do Projeto</label>
                        <div className="flex gap-4">
                           {['PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'].map(st => (
                              <label key={st} className="flex items-center gap-2 cursor-pointer">
                                 <input
                                    type="radio"
                                    name="status"
                                    checked={formData.status === st}
                                    onChange={() => setFormData({ ...formData, status: st as any })}
                                    className="text-blue-600 focus:ring-blue-500"
                                 />
                                 <span className="text-sm text-slate-700 capitalize">{st.replace('_', ' ').toLowerCase()}</span>
                              </label>
                           ))}
                        </div>
                     </div>
                  </div>

                  <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-200 rounded-b-lg">
                     <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded text-sm font-medium">Cancelar</button>
                     <button onClick={handleSave} className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-sm font-bold flex items-center gap-2">
                        <Save className="w-4 h-4" /> Salvar Projeto
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default ProjectList;
