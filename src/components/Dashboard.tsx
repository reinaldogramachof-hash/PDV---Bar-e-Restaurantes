import React from 'react';
import { useApp } from '../store/AppContext';
import { 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Table as TableIcon,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';

export const Dashboard: React.FC = () => {
  const { orders, tables, theme } = useApp();
  const isDark = theme === 'dark';

  const closedOrders = orders.filter(o => o.status === 'closed');
  const salesToday = closedOrders.reduce((acc, o) => acc + o.total, 0);
  const totalOrders = closedOrders.length;
  const avgTicket = totalOrders > 0 ? salesToday / totalOrders : 0;
  const occupiedTables = tables.filter(t => t.status !== 'livre').length;

  const categorySales = closedOrders.flatMap(o => o.items).reduce<Record<string, number>>((acc, item) => {
    acc[item.product.category] = (acc[item.product.category] || 0) + (item.price * item.quantity);
    return acc;
  }, {});

  const recentOrders = [...orders].reverse().slice(0, 6);

  const kpis = [
    { label: 'Vendas Hoje', value: `R$ ${salesToday.toFixed(2)}`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10', trend: '+12.5%' },
    { label: 'Ticket Médio', value: `R$ ${avgTicket.toFixed(2)}`, icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-500/10', trend: '+3.2%' },
    { label: 'Nº Pedidos', value: totalOrders.toString(), icon: Clock, color: 'text-[#E85D75]', bg: 'bg-[#E85D75]/10', trend: '+5.4%' },
    { label: 'Mesas Ocupadas', value: occupiedTables.toString(), icon: TableIcon, color: 'text-amber-500', bg: 'bg-amber-500/10', trend: `${occupiedTables}/${tables.length}` },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Visão Geral</h1>
          <p className={`${isDark ? 'text-[#A1A1A6]' : 'text-gray-500'} text-sm`}>Bem-vindo de volta! Aqui está o resumo de hoje.</p>
        </div>
        <div className="flex items-center gap-2">
           <span className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${isDark ? 'bg-[#1C1C1E] border-[#2C2C2E]' : 'bg-white border-gray-200'}`}>
             📅 05 de Maio, 2026
           </span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
         {kpis.map((kpi, i) => (
           <motion.div 
             key={i}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: i * 0.1 }}
             className={`p-6 rounded-2xl border transition-all hover:shadow-xl ${
               isDark ? 'bg-[#1C1C1E] border-[#2C2C2E] hover:border-[#3a3a3c]' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
             }`}
           >
             <div className="flex justify-between items-start mb-4">
               <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                 <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
               </div>
               <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                 kpi.trend.includes('+') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-500'
               }`}>
                 {kpi.trend}
               </span>
             </div>
             <div>
               <h3 className={`text-xs font-semibold mb-1 ${isDark ? 'text-[#A1A1A6]' : 'text-gray-500'}`}>{kpi.label}</h3>
               <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
             </div>
           </motion.div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Sales by Category */}
         <div className={`p-8 rounded-2xl border ${isDark ? 'bg-[#1C1C1E] border-[#2C2C2E]' : 'bg-white border-gray-200 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-lg">Vendas por Categoria</h3>
              <button className="text-xs text-[#E85D75] font-semibold hover:underline">Ver tudo</button>
            </div>
            <div className="space-y-6">
              {(Object.entries(categorySales) as [string, number][]).sort((a, b) => b[1] - a[1]).map(([cat, val], i) => {
                 const pct = salesToday > 0 ? (val / salesToday) * 100 : 0;
                 return (
                   <div key={i} className="group">
                     <div className="flex justify-between text-sm mb-2">
                       <span className={`font-medium transition-colors ${isDark ? 'text-[#A1A1A6] group-hover:text-white' : 'text-gray-600 group-hover:text-black'}`}>{cat}</span>
                       <span className="font-bold">R$ {val.toFixed(2)}</span>
                     </div>
                     <div className={`h-2.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-[#252527]' : 'bg-gray-100'}`}>
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${pct}%` }}
                         transition={{ duration: 1, ease: "easeOut" }}
                         className="h-full bg-gradient-to-r from-[#E85D75] to-[#f39c12]"
                       ></motion.div>
                     </div>
                   </div>
                 )
              })}
              {Object.keys(categorySales).length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 opacity-50">
                  <ShoppingBag className="w-12 h-12 mb-3" />
                  <p className="text-sm">Sem dados de vendas hoje</p>
                </div>
              )}
            </div>
         </div>

         {/* Recent Orders */}
         <div className={`p-8 rounded-2xl border lg:col-span-2 ${isDark ? 'bg-[#1C1C1E] border-[#2C2C2E]' : 'bg-white border-gray-200 shadow-sm'}`}>
             <div className="flex items-center justify-between mb-8">
               <h3 className="font-bold text-lg">Últimos Pedidos</h3>
               <div className="flex gap-2">
                 <button className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${isDark ? 'bg-[#252527] hover:bg-[#2c2c2e]' : 'bg-gray-100 hover:bg-gray-200'}`}>Exportar</button>
                 <button className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${isDark ? 'bg-[#252527] hover:bg-[#2c2c2e]' : 'bg-gray-100 hover:bg-gray-200'}`}>Filtrar</button>
               </div>
             </div>
             <div className="overflow-x-auto -mx-2">
               <table className="w-full text-sm text-left border-separate border-spacing-y-2">
                 <thead>
                   <tr className={`text-[10px] uppercase tracking-widest ${isDark ? 'text-[#A1A1A6]' : 'text-gray-500'}`}>
                     <th className="px-4 py-2 font-bold">ID</th>
                     <th className="px-4 py-2 font-bold">Hora</th>
                     <th className="px-4 py-2 font-bold">Modo</th>
                     <th className="px-4 py-2 font-bold">Status</th>
                     <th className="px-4 py-2 font-bold text-right">Valor</th>
                   </tr>
                 </thead>
                 <tbody>
                   {recentOrders.map(o => (
                     <tr key={o.id} className={`group transition-all hover:translate-x-1 ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                       <td className="px-4 py-3 first:rounded-l-xl border-y border-transparent">
                         <span className="font-mono text-xs opacity-70">#{o.id.slice(-6)}</span>
                       </td>
                       <td className="px-4 py-3 border-y border-transparent font-medium">
                         {new Date(o.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </td>
                       <td className="px-4 py-3 border-y border-transparent">
                         <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                           o.mode === 'mesa' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'
                         }`}>
                           {o.mode}
                         </span>
                       </td>
                       <td className="px-4 py-3 border-y border-transparent">
                         <span className="flex items-center gap-1.5">
                           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                           <span className="text-xs font-medium">Concluído</span>
                         </span>
                       </td>
                       <td className="px-4 py-3 last:rounded-r-xl border-y border-transparent text-right font-bold">
                         R$ {o.total.toFixed(2)}
                       </td>
                     </tr>
                   ))}
                   {recentOrders.length === 0 && (
                     <tr>
                       <td colSpan={5} className="py-12 text-center">
                         <div className="opacity-30 flex flex-col items-center">
                           <Clock className="w-12 h-12 mb-3" />
                           <p className="text-sm font-medium">Nenhum pedido registrado hoje.</p>
                         </div>
                       </td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
         </div>
      </div>
    </div>
  );
}
