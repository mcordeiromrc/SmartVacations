
// =========================================================
//  SmartVacations - Enterprise 1.0
//  (by Leonardo Baladão and Marcio Roberto Cordeiro - 2025)
// =========================================================

import React, { useState } from 'react';
import { Client, Project } from '../types';
import { Edit2, Save, X, Search, Building2, Plus, Trash2, Link } from 'lucide-react';

interface ClientListProps {
   clients: Client[];
   activeProject: Project | null;
   onUpdateClient: (updated: Client) => void;
   onAddClient: (client: Client) => void;
   onDeleteClient: (id: number) => void;
}

const ClientList: React.FC<ClientListProps> = ({ clients, activeProject, onUpdateClient, onAddClient, onDeleteClient }) => {
   const [editingId, setEditingId] = useState<number | null>(null);
   const [isAdding, setIsAdding] = useState(false);
   const [formData, setFormData] = useState<Partial<Client>>({});
   const [searchTerm, setSearchTerm] = useState('');

   const handleEditClick = (client: Client) => {
      setEditingId(client.id);
      setFormData({ ...client });
      setIsAdding(false);
   };

   const handleAddClick = () => {
      setFormData({
         id: Math.max(...clients.map(c => c.id), 0) + 1,
         status: 'ACTIVE',
         name: '',
         contact_person: '',
         email: '',
         project_ids: activeProject ? [activeProject.id] : []
      });
      setIsAdding(true);
      setEditingId(null);
   };

   const handleSave = () => {
      if (formData.name && formData.id) {
         if (isAdding) {
            onAddClient(formData as Client);
         } else {
            onUpdateClient(formData as Client);
         }
         setEditingId(null);
         setIsAdding(false);
         setFormData({});
      }
   };

   // Filter clients that are linked to the active project
   const filteredClients = clients.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
      const linkedToProject = activeProject ? c.project_ids.includes(activeProject.id) : true;
      return matchesSearch && linkedToProject;
   });

   return (
      <div className="space-y-4">
         {/* Header Actions */}
         <div className="flex justify-between items-center bg-white p-4 rounded border border-slate-200 shadow-sm">
            <div>
               <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-700" />
                  Gestão de Clientes (Tomadores de Serviço)
               </h2>
               {activeProject && <p className="text-xs text-slate-500 ml-7">Vinculados ao projeto: <span className="font-bold">{activeProject.name}</span></p>}
            </div>
            <div className="flex gap-3">
               <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                     type="text"
                     placeholder="Buscar clientes..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="pl-9 pr-4 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:border-blue-500 w-64"
                  />
               </div>
               <button
                  onClick={handleAddClick}
                  className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2"
               >
                  <Plus className="w-4 h-4" /> Novo Cliente
               </button>
            </div>
         </div>

         {/* Table */}
         <div className="bg-white rounded shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-300">
                     <tr>
                        <th className="px-6 py-3">ID</th>
                        <th className="px-6 py-3">Cliente / Entidade</th>
                        <th className="px-6 py-3">Responsável</th>
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3 text-center">Status</th>
                        <th className="px-6 py-3 text-center">Projetos</th>
                        <th className="px-6 py-3 text-center">Ações</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {filteredClients.map((client) => (
                        <tr key={client.id} className="hover:bg-blue-50 transition-colors">
                           <td className="px-6 py-3 font-mono text-slate-500">{client.id.toString().padStart(3, '0')}</td>
                           <td className="px-6 py-3 font-medium text-slate-800">{client.name}</td>
                           <td className="px-6 py-3">{client.contact_person}</td>
                           <td className="px-6 py-3 text-blue-600 underline cursor-pointer">{client.email}</td>
                           <td className="px-6 py-3 text-center">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold border ${client.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                 {client.status === 'ACTIVE' ? 'ATIVO' : 'INATIVO'}
                              </span>
                           </td>
                           <td className="px-6 py-3 text-center">
                              <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-mono border border-slate-200">
                                 {client.project_ids.length} Links
                              </span>
                           </td>
                           <td className="px-6 py-3 text-center flex justify-center gap-2">
                              <button onClick={() => handleEditClick(client)} className="text-slate-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => onDeleteClient(client.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Modal (Add/Edit) */}
         {(editingId || isAdding) && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
               <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border border-slate-200 animate-in fade-in zoom-in duration-200">
                  <div className="bg-blue-700 px-6 py-4 flex justify-between items-center text-white rounded-t-lg">
                     <h3 className="font-bold text-lg">{isAdding ? 'Novo Cliente' : 'Editar Cliente'}</h3>
                     <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="hover:bg-blue-600 rounded p-1"><X className="w-5 h-5" /></button>
                  </div>

                  <div className="p-6 space-y-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Cliente</label>
                        <input
                           value={formData.name || ''}
                           onChange={e => setFormData({ ...formData, name: e.target.value })}
                           className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CNPJ (Opcional)</label>
                           <input
                              value={formData.cnpj || ''}
                              onChange={e => setFormData({ ...formData, cnpj: e.target.value })}
                              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                           <select
                              value={formData.status || 'ACTIVE'}
                              onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                              className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
                           >
                              <option value="ACTIVE">Ativo</option>
                              <option value="INACTIVE">Inativo</option>
                           </select>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contato</label>
                           <input
                              value={formData.contact_person || ''}
                              onChange={e => setFormData({ ...formData, contact_person: e.target.value })}
                              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                           <input
                              value={formData.email || ''}
                              onChange={e => setFormData({ ...formData, email: e.target.value })}
                              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                           />
                        </div>
                     </div>

                     {activeProject && (
                        <div className="bg-slate-50 p-3 rounded text-xs text-slate-600 flex items-center gap-2 border border-slate-200">
                           <Link className="w-3 h-3 text-blue-500" />
                           Este cliente será vinculado automaticamente ao projeto <strong>{activeProject.name}</strong>.
                        </div>
                     )}
                  </div>

                  <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-200 rounded-b-lg">
                     <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded text-sm font-medium">Cancelar</button>
                     <button onClick={handleSave} className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded text-sm font-bold flex items-center gap-2">
                        <Save className="w-4 h-4" /> Salvar
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default ClientList;
