// =========================================================
//  SmartVacations - Enterprise 1.0
//  (by Leonardo Baladão and Marcio Roberto Cordeiro - 2025)
// =========================================================

import React, { useState } from 'react';
import { Employee, Client } from '../types';
import { Edit2, Save, X, Search, MapPin, Briefcase, Upload } from 'lucide-react';

interface EmployeeListProps {
   employees: Employee[];
   clients: Client[];
   onUpdateEmployee: (updated: Employee) => void;
   onImportXlsx: (file: File) => void;
}

const EmployeeList: React.FC<EmployeeListProps> = ({ employees, clients, onUpdateEmployee, onImportXlsx }) => {
   const [editingId, setEditingId] = useState<number | null>(null);
   const [editForm, setEditForm] = useState<Employee | null>(null);
   const [searchTerm, setSearchTerm] = useState('');
   const [fileInputId] = useState(`import_emps_${Math.random().toString(36).slice(2)}`);

   const handleEditClick = (emp: Employee) => {
      setEditingId(emp.id);
      setEditForm({ ...emp });
   };

   const handleSave = () => {
      if (editForm) {
         // Find client name based on ID
         const selectedClient = clients.find(c => c.id === editForm.client_id);
         const updatedEmployee = {
            ...editForm,
            client_name: selectedClient ? selectedClient.name : editForm.client_name
         };

         onUpdateEmployee(updatedEmployee);
         setEditingId(null);
         setEditForm(null);
      }
   };

   const filteredEmployees = employees.filter(e =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.local.toLowerCase().includes(searchTerm.toLowerCase())
   );

   return (
      <div className="space-y-4">
         {/* Header Actions */}
         <div className="flex justify-between items-center bg-white p-4 rounded border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
               <Briefcase className="w-5 h-5 text-blue-700" />
               Gestão de Colaboradores
            </h2>
            <div className="flex items-center gap-3">
               <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                     type="text"
                     placeholder="Buscar por nome, cliente..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="pl-9 pr-4 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 w-64"
                  />
               </div>
               <div>
                  <input id={fileInputId} type="file" accept=".xlsx" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportXlsx(f); e.currentTarget.value = ''; }} />
                  <label htmlFor={fileInputId} className="px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-sm font-bold flex items-center gap-2 cursor-pointer">
                     <Upload className="w-4 h-4" /> Importar Colaboradores
                  </label>
               </div>
            </div>
         </div>

         {/* Table */}
         <div className="bg-white rounded shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-300">
                     <tr>
                        <th className="px-6 py-3">ID</th>
                        <th className="px-6 py-3">Nome Completo</th>
                        <th className="px-6 py-3">Cliente Alocado</th>
                        <th className="px-6 py-3">Localidade</th>
                        <th className="px-6 py-3">Admissão</th>
                        <th className="px-6 py-3 text-right">Taxa (Rate/h)</th>
                        <th className="px-6 py-3 text-center">Ações</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {filteredEmployees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-blue-50 transition-colors group">
                           <td className="px-6 py-3 font-mono text-slate-500">{emp.id.toString().padStart(4, '0')}</td>
                           <td className="px-6 py-3 font-medium text-slate-800">{emp.name}</td>
                           <td className="px-6 py-3">
                              <span className="px-2 py-1 bg-slate-100 rounded text-slate-600 border border-slate-200">{emp.client_name}</span>
                           </td>
                           <td className="px-6 py-3 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {emp.local}
                           </td>
                           <td className="px-6 py-3">{emp.admission_date}</td>
                           <td className="px-6 py-3 text-right font-mono font-medium text-blue-700">
                              R$ {emp.rate.toFixed(2)}
                           </td>
                           <td className="px-6 py-3 text-center">
                              <button
                                 onClick={() => handleEditClick(emp)}
                                 className="text-slate-400 hover:text-blue-600 transition-colors"
                              >
                                 <Edit2 className="w-4 h-4" />
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
               <span>Mostrando {filteredEmployees.length} registros</span>
               <span>Atualizado: {new Date().toLocaleDateString()}</span>
            </div>
         </div>

         {/* Edit Modal */}
         {editingId && editForm && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
               <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
                  <div className="bg-blue-700 px-6 py-4 flex justify-between items-center text-white">
                     <h3 className="font-bold text-lg">Editar Colaborador</h3>
                     <button onClick={() => setEditingId(null)} className="hover:bg-blue-600 rounded p-1"><X className="w-5 h-5" /></button>
                  </div>

                  <div className="p-6 space-y-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                        <input
                           value={editForm.name}
                           onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                           className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cliente Alocado</label>
                           <select
                              value={editForm.client_id}
                              onChange={e => setEditForm({ ...editForm, client_id: Number(e.target.value) })}
                              className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white focus:outline-none"
                           >
                              {clients.map(c => (
                                 <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                           </select>
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Localidade (Cidade)</label>
                           <select
                              value={editForm.local}
                              onChange={e => setEditForm({ ...editForm, local: e.target.value })}
                              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none bg-white"
                           >
                              <option value="São Paulo">São Paulo</option>
                              <option value="Rio de Janeiro">Rio de Janeiro</option>
                              <option value="Porto Alegre">Porto Alegre</option>
                              <option value="Salvador">Salvador</option>
                              <option value="Goiânia">Goiânia</option>
                              <option value="Campinas">Campinas</option>
                              <option value="Santos">Santos</option>
                              <option value="Alegrete">Alegrete</option>
                           </select>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Admissão</label>
                           <input
                              value={editForm.admission_date}
                              onChange={e => setEditForm({ ...editForm, admission_date: e.target.value })}
                              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Taxa Horária (Rate)</label>
                           <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
                              <input
                                 type="number"
                                 value={editForm.rate}
                                 onChange={e => setEditForm({ ...editForm, rate: parseFloat(e.target.value) })}
                                 className="w-full border border-slate-300 rounded pl-8 pr-3 py-2 text-sm font-mono text-blue-700 font-bold focus:border-blue-500 focus:outline-none"
                              />
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-200">
                     <button onClick={() => setEditingId(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded text-sm font-medium">Cancelar</button>
                     <button onClick={handleSave} className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-sm font-bold flex items-center gap-2">
                        <Save className="w-4 h-4" /> Salvar Alterações
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default EmployeeList;
