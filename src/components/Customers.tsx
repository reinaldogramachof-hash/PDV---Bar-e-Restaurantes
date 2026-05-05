import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Search, Plus, UserPlus, Mail, Phone, MapPin, Edit3, Trash2, MoreVertical, Filter, ChevronRight, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
  lastVisit: string;
  loyaltyPoints: number;
}

const mockCustomers: Customer[] = [
  { id: '1', name: 'Ana Silva', email: 'ana.silva@email.com', phone: '(11) 98888-7777', totalSpent: 1250.50, lastVisit: '2026-05-01', loyaltyPoints: 125 },
  { id: '2', name: 'Bruno Oliveira', email: 'bruno.o@email.com', phone: '(11) 97777-6666', totalSpent: 450.00, lastVisit: '2026-04-28', loyaltyPoints: 45 },
  { id: '3', name: 'Carla Santos', email: 'carla.s@email.com', phone: '(11) 96666-5555', totalSpent: 2100.20, lastVisit: '2026-05-04', loyaltyPoints: 210 },
  { id: '4', name: 'Diego Costa', email: 'diego.c@email.com', phone: '(11) 95555-4444', totalSpent: 89.90, lastVisit: '2026-05-05', loyaltyPoints: 9 },
];

export const Customers: React.FC = () => {
  const { theme } = useApp();
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex flex-col h-full gap-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight">Gestão de Clientes</h2>
          <p className="text-sm font-semibold opacity-60">Base de dados e programa de fidelidade</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className={`flex items-center px-5 py-3 rounded-2xl border flex-1 md:w-80 transition-all focus-within:ring-4 focus-within:ring-[#E85D75]/10 ${isDark ? 'bg-[#1C1C1E] border-[#2C2C2E] focus-within:border-[#E85D75]/40' : 'bg-white border-gray-200 focus-within:border-pink-300 shadow-sm'}`}>
            <Search className="w-5 h-5 mr-3 opacity-40" />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Nome, e-mail ou telefone..." className="bg-transparent border-none outline-none w-full text-sm font-semibold placeholder:opacity-30" />
          </div>
          <button className="px-6 py-3 bg-[#E85D75] text-white rounded-2xl font-bold text-sm shadow-lg shadow-[#E85D75]/20 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all">
            <UserPlus className="w-4 h-4" /> Novo Cliente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mockCustomers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(customer => (
          <motion.div 
            key={customer.id} 
            className={`p-6 rounded-3xl border transition-all duration-300 hover:shadow-xl hover:border-transparent ${isDark ? 'bg-[#1C1C1E] border-[#2C2C2E]' : 'bg-white border-gray-100 shadow-sm'}`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}><User className="w-5 h-5 opacity-40" /></div>
              <div className="flex gap-1">
                 <button className="p-2 rounded-xl hover:bg-current/5 opacity-40 hover:opacity-100 transition-all"><Edit3 className="w-4 h-4" /></button>
                 <button className="p-2 rounded-xl hover:bg-red-500/10 text-red-500 opacity-40 hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="space-y-4">
              <div><h3 className="text-lg font-bold truncate">{customer.name}</h3><p className="text-xs font-semibold opacity-40">{customer.email}</p></div>
              <div className="flex items-center gap-2 opacity-60"><Phone className="w-4 h-4" /><span className="text-xs font-semibold">{customer.phone}</span></div>
            </div>

            <div className="mt-8 pt-6 border-t border-dashed border-current/10 grid grid-cols-2 gap-4">
              <div><p className="text-[10px] font-bold uppercase tracking-wider opacity-30 mb-1">Total Gasto</p><p className="text-2xl font-extrabold text-[#E85D75] tabular-nums tracking-tight">R$ {customer.totalSpent.toFixed(2)}</p></div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-30 mb-1">Pontos</p>
                <span className="px-3 py-1 bg-purple-500/10 text-purple-500 rounded-full text-xs font-bold tabular-nums">{customer.loyaltyPoints} pts</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
