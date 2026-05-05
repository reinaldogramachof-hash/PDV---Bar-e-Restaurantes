import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Search, Plus, Truck, Package, Phone, Mail, MapPin, Edit3, Trash2, ExternalLink, Box, User } from 'lucide-react';
import { motion } from 'motion/react';

interface Supplier {
  id: string;
  companyName: string;
  category: string;
  contactName: string;
  phone: string;
  email: string;
  lastDelivery: string;
  deliveryPerformance: number;
}

const mockSuppliers: Supplier[] = [
  { id: '1', companyName: 'Bebidas Prime Distribuidora', category: 'Bebidas', contactName: 'Ricardo L.', phone: '(11) 4004-9000', email: 'vendas@prime.com.br', lastDelivery: '2026-05-02', deliveryPerformance: 98 },
  { id: '2', companyName: 'Hortifruti da Fazenda', category: 'Perecíveis', contactName: 'Dona Maria', phone: '(11) 91234-5678', email: 'fazenda@email.com', lastDelivery: '2026-05-04', deliveryPerformance: 100 },
  { id: '3', companyName: 'Atacadão Carnes & Cia', category: 'Proteínas', contactName: 'Carlos M.', phone: '(11) 3322-1100', email: 'comercial@atacadao.com', lastDelivery: '2026-04-30', deliveryPerformance: 85 },
  { id: '4', companyName: 'Limpeza Express S/A', category: 'Limpeza', contactName: 'Felipe G.', phone: '(11) 2211-4433', email: 'contato@limpezaexpress.com', lastDelivery: '2026-04-15', deliveryPerformance: 92 },
];

export const Suppliers: React.FC = () => {
  const { theme } = useApp();
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="flex flex-col h-full gap-8 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">Fornecedores & Parceiros</h2>
          <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? 'text-[#3A3A3C]' : 'text-gray-400'}`}>Cadeia de suprimentos e compras</p>
        </div>

        <div className="flex gap-3 w-full lg:w-auto">
          <div className={`flex items-center px-5 py-3 rounded-2xl border flex-1 lg:w-80 transition-all focus-within:ring-4 focus-within:ring-[#E85D75]/10 ${isDark ? 'bg-[#1C1C1E] border-[#2C2C2E] focus-within:border-[#E85D75]/40' : 'bg-white border-gray-200 focus-within:border-pink-300 shadow-sm'}`}>
            <Search className={`w-5 h-5 mr-3 ${isDark ? 'text-[#3A3A3C]' : 'text-gray-400'}`} />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Pesquisar fornecedor..." className="bg-transparent border-none outline-none w-full text-sm font-bold placeholder:opacity-30" />
          </div>
          <button className="px-6 py-3 bg-[#E85D75] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-[#E85D75]/20 flex items-center gap-2 hover:scale-105 transition-all">
            <Plus className="w-4 h-4" /> Novo Fornecedor
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockSuppliers.filter(s => s.companyName.toLowerCase().includes(searchTerm.toLowerCase())).map(supplier => (
          <motion.div 
            whileHover={{ scale: 1.01 }}
            key={supplier.id} 
            className={`p-8 rounded-[3.5rem] border transition-all ${isDark ? 'bg-[#1C1C1E] border-[#2C2C2E]' : 'bg-white border-gray-100 shadow-sm hover:shadow-2xl shadow-gray-200/20'}`}
          >
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center text-2xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <Truck className="w-7 h-7 text-[#E85D75]" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">{supplier.companyName}</h3>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>{supplier.category}</span>
                </div>
              </div>
              <div className="flex gap-2">
                 <button className="p-3 rounded-2xl border border-current/10 hover:bg-current/5 transition-all"><Edit3 className="w-4 h-4 opacity-40" /></button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 opacity-60"><Phone className="w-4 h-4" /><span className="text-[11px] font-black tracking-tight">{supplier.phone}</span></div>
                <div className="flex items-center gap-3 opacity-60"><Mail className="w-4 h-4" /><span className="text-[11px] font-black tracking-tight">{supplier.email}</span></div>
                <div className="flex items-center gap-3 opacity-60"><User className="w-4 h-4" /><span className="text-[11px] font-black tracking-tight">Falar com: {supplier.contactName}</span></div>
              </div>
              <div className={`p-6 rounded-[2.5rem] flex flex-col justify-between ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                 <div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-30 mb-2">Qualidade Entrega</p>
                    <div className="flex items-center gap-3">
                       <div className="flex-1 h-2 bg-current/10 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${supplier.deliveryPerformance}%` }} />
                       </div>
                       <span className="text-[11px] font-black text-emerald-500">{supplier.deliveryPerformance}%</span>
                    </div>
                 </div>
                 <div className="mt-4 pt-4 border-t border-dashed border-current/10">
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-30">Último Recebimento</p>
                    <p className="text-[11px] font-black">{new Date(supplier.lastDelivery).toLocaleDateString('pt-BR')}</p>
                 </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-4">
               <button className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 hover:text-[#E85D75] transition-all"><Box className="w-4 h-4" /> Ver Histórico de Pedidos</button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
