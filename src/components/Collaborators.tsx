import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Search, UserPlus, Shield, Briefcase, Calendar, Edit3, Trash2, CheckCircle2, XCircle, User } from 'lucide-react';
import { motion } from 'motion/react';

interface Collaborator {
  id: string;
  name: string;
  role: string;
  email: string;
  status: 'active' | 'inactive';
  joinedAt: string;
  permissions: 'admin' | 'staff' | 'waiter';
}

const mockStaff: Collaborator[] = [
  { id: '1', name: 'Reinaldo Silva', role: 'Administrador', email: 'reinaldo@barmanager.com', status: 'active', joinedAt: '2025-01-15', permissions: 'admin' },
  { id: '2', name: 'Maria Souza', role: 'Garçom / Atendente', email: 'maria.s@email.com', status: 'active', joinedAt: '2025-03-10', permissions: 'waiter' },
  { id: '3', name: 'João Santos', role: 'Cozinha Principal', email: 'joao.s@email.com', status: 'active', joinedAt: '2025-02-20', permissions: 'staff' },
  { id: '4', name: 'Pedro Lima', role: 'Garçom Noturno', email: 'pedro.l@email.com', status: 'inactive', joinedAt: '2025-04-05', permissions: 'waiter' },
];

export const Collaborators: React.FC = () => {
  const { theme } = useApp();
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex flex-col h-full gap-8 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">Equipe & Colaboradores</h2>
          <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-[#3A3A3C]' : 'text-gray-400'}`}>Gestão de acessos e cargos</p>
        </div>

        <div className="flex gap-3 w-full lg:w-auto">
          <div className={`flex items-center px-5 py-3 rounded-2xl border flex-1 lg:w-80 transition-all focus-within:ring-4 focus-within:ring-[#E85D75]/10 ${isDark ? 'bg-[#1C1C1E] border-[#2C2C2E] focus-within:border-[#E85D75]/40' : 'bg-white border-gray-200 focus-within:border-pink-300 shadow-sm'}`}>
            <Search className={`w-5 h-5 mr-3 ${isDark ? 'text-[#3A3A3C]' : 'text-gray-400'}`} />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Pesquisar por nome ou cargo..." className="bg-transparent border-none outline-none w-full text-sm font-bold placeholder:opacity-30" />
          </div>
          <button className="px-6 py-3 bg-[#E85D75] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-[#E85D75]/20 flex items-center gap-2 hover:scale-105 transition-all">
            <UserPlus className="w-4 h-4" /> Adicionar Membro
          </button>
        </div>
      </div>

      <div className={`rounded-[3rem] border overflow-hidden shadow-xl ${isDark ? 'bg-[#1C1C1E] border-[#2C2C2E]' : 'bg-white border-gray-100'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className={`text-[10px] uppercase font-black tracking-[0.2em] border-b ${isDark ? 'bg-[#252527] border-[#2C2C2E] text-[#636366]' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                <th className="px-8 py-6 text-center w-20">Avatar</th>
                <th className="px-8 py-6">Colaborador</th>
                <th className="px-8 py-6">Cargo / Função</th>
                <th className="px-8 py-6 text-center">Permissões</th>
                <th className="px-8 py-6 text-center">Status</th>
                <th className="px-8 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-[#2C2C2E]' : 'divide-gray-100'}`}>
              {mockStaff.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).map((member) => (
                <tr key={member.id} className={`transition-all hover:bg-current/[0.02]`}>
                  <td className="px-8 py-6">
                    <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-xl shadow-lg shadow-current/5 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                      <User className="w-6 h-6 opacity-30" />
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="font-black uppercase tracking-tight text-xs">{member.name}</span>
                      <span className="text-[10px] font-bold opacity-30">{member.email}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 opacity-60">
                      <Briefcase className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">{member.role}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      member.permissions === 'admin' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 
                      member.permissions === 'staff' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                      'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}>
                      {member.permissions}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                       {member.status === 'active' ? (
                         <span className="flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase"><CheckCircle2 className="w-3.5 h-3.5" /> Ativo</span>
                       ) : (
                         <span className="flex items-center gap-1 text-[9px] font-black text-red-500 opacity-40 uppercase"><XCircle className="w-3.5 h-3.5" /> Inativo</span>
                       )}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                       <button className="p-2.5 rounded-xl border border-current/10 hover:bg-[#E85D75] hover:text-white hover:border-[#E85D75] transition-all"><Edit3 className="w-4 h-4" /></button>
                       <button className="p-2.5 rounded-xl border border-current/10 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
