import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { 
  ChevronDown, 
  Lock, 
  Unlock, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Plus, 
  History, 
  ArrowUpRight, 
  Calendar,
  CreditCard,
  Banknote,
  Receipt,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Cashier: React.FC = () => {
  const { cashierSession, cashierHistory, expenses, orders, tables, theme, openCashier, closeCashier, addExpense } = useApp();
  const isDark = theme === 'dark';

  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseVal, setExpenseVal] = useState('');
  const [tipsTotal, setTipsTotal] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const closedOrders = orders.filter(o => o.status === 'closed');
  const activeOrdersCount = orders.filter(o => o.status === 'open').length;
  const occupiedTablesCount = tables.filter(t => t.status !== 'livre').length;

  const salesToday = closedOrders.reduce((acc, o) => acc + o.subtotal, 0);
  const serviceChargeToday = closedOrders.reduce((acc, o) => acc + o.serviceCharge, 0);
  const expensesToday = expenses.reduce((acc, e) => acc + e.amount, 0);
  const saldoPrevisto = salesToday + serviceChargeToday - expensesToday;

  const canCloseCashier = activeOrdersCount === 0 && occupiedTablesCount === 0;

  const handleAddExpense = () => {
    const v = parseFloat(expenseVal.replace(',', '.'));
    if (!expenseDesc.trim() || isNaN(v) || v <= 0) return;
    addExpense({ id: Date.now().toString(), description: expenseDesc, amount: v, timestamp: new Date().toISOString() });
    setExpenseDesc('');
    setExpenseVal('');
  };

  const handleCloseCashier = () => {
    if(!canCloseCashier) return;
    const tips = parseFloat(tipsTotal.replace(',', '.')) || 0;
    closeCashier(tips);
    setTipsTotal('');
  };

  // — Caixa Fechado —
  if (!cashierSession) {
    return (
      <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className={`flex flex-col items-center justify-center p-16 rounded-[3rem] border shadow-2xl relative overflow-hidden
          ${isDark ? 'bg-[#1C1C1E] border-[#2C2C2E]' : 'bg-white border-gray-200'}`}>
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500/50 via-red-500 to-red-500/50" />
          <motion.div initial={{ scale: 0.8, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} className="w-24 h-24 bg-red-500/10 text-red-500 rounded-[2rem] flex items-center justify-center mb-8 shadow-xl shadow-red-500/5"><Lock className="w-10 h-10" /></motion.div>
          <div className="text-center space-y-2 mb-10"><h2 className="text-4xl font-black tracking-tighter uppercase">Caixa Encerrado</h2><p className={`text-sm font-medium uppercase tracking-widest opacity-40`}>Aguardando abertura do próximo turno</p></div>
          <button onClick={openCashier} className="group flex items-center gap-3 px-10 py-5 bg-[#E85D75] text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-[#E85D75]/40 hover:scale-105 active:scale-95 transition-all"><Unlock className="w-4 h-4" /> Abrir Novo Turno</button>
        </div>

        {cashierHistory.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3"><History className="w-5 h-5 opacity-40" /><h3 className="text-sm font-black uppercase tracking-widest opacity-40">Histórico de Movimentação</h3></div>
            <div className={`rounded-[2.5rem] border overflow-hidden shadow-xl ${isDark ? 'bg-[#1C1C1E] border-[#2C2C2E]' : 'bg-white border-gray-100'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead><tr className={`text-[10px] uppercase font-black tracking-[0.2em] border-b ${isDark ? 'bg-[#252527] border-[#2C2C2E] text-[#636366]' : 'bg-gray-50 border-gray-100 text-gray-400'}`}><th className="px-8 py-5">Abertura / Fechamento</th><th className="px-8 py-5 text-right">Pedidos</th><th className="px-8 py-5 text-right">Faturamento</th><th className="px-8 py-5 text-right">Despesas</th><th className="px-8 py-5 text-right">Saldo Final</th></tr></thead>
                  <tbody className={`divide-y ${isDark ? 'divide-[#2C2C2E]' : 'divide-gray-100'}`}>
                    {[...cashierHistory].reverse().map((s, idx) => (
                      <tr key={idx} className={`transition-colors ${isDark ? 'hover:bg-[#252527]' : 'hover:bg-gray-50/50'}`}>
                        <td className="px-8 py-6"><div className="flex items-center gap-3"><div className={`p-2 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}><Calendar className="w-4 h-4 opacity-40" /></div><div><p className="font-black text-xs">{new Date(s.openedAt).toLocaleDateString('pt-BR')} {new Date(s.openedAt).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</p><p className="text-[10px] font-bold opacity-30">{s.closedAt ? `Fechado às ${new Date(s.closedAt).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}` : 'Em aberto'}</p></div></div></td>
                        <td className="px-8 py-6 text-right font-black opacity-60">{s.ordersCount}</td>
                        <td className="px-8 py-6 text-right font-black text-emerald-500">R$ {(s.salesTotal + s.serviceTaxTotal).toFixed(2)}</td>
                        <td className="px-8 py-6 text-right font-black text-red-500">R$ {s.expensesTotal.toFixed(2)}</td>
                        <td className="px-8 py-6 text-right"><span className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-full font-black text-xs">R$ {(s.finalBalance ?? 0).toFixed(2)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // — Caixa Aberto —
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CashierStatCard label="Entradas (Vendas)" value={salesToday + serviceChargeToday} icon={TrendingUp} color="emerald" isDark={isDark} />
        <CashierStatCard label="Saídas (Despesas)" value={expensesToday} icon={TrendingDown} color="rose" isDark={isDark} />
        <CashierStatCard label="Saldo Estimado" value={saldoPrevisto} icon={Wallet} color="blue" isDark={isDark} isTotal />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className={`lg:col-span-8 p-10 rounded-[3rem] border shadow-xl flex flex-col ${isDark ? 'bg-[#1C1C1E] border-[#2C2C2E]' : 'bg-white border-gray-100'}`}>
          <div className="flex justify-between items-center mb-10"><h2 className="text-2xl font-black uppercase tracking-tighter">Movimentação Detalhada</h2><div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Ao vivo</div></div>
          <div className="space-y-6 flex-1">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-[#121214] border-[#2C2C2E]' : 'bg-gray-50/50 border-gray-100'}`}><div className="flex items-center gap-3 mb-4 opacity-40"><CreditCard className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-widest">Vendas de Balcão</span></div><p className="text-2xl font-black tracking-tight">R$ {salesToday.toFixed(2)}</p></div>
               <div className={`p-6 rounded-[2rem] border ${isDark ? 'bg-[#121214] border-[#2C2C2E]' : 'bg-gray-50/50 border-gray-100'}`}><div className="flex items-center gap-3 mb-4 opacity-40"><Receipt className="w-4 h-4" /><span className="text-[10px] font-black uppercase tracking-widest">Serviço & Taxas</span></div><p className="text-2xl font-black tracking-tight">R$ {serviceChargeToday.toFixed(2)}</p></div>
             </div>
             <div className="pt-8 border-t border-dashed border-current/10">
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-6">Despesas e Sangrias</h3>
               {expenses.length === 0 ? (<div className="py-10 text-center opacity-20 italic text-sm">Nenhuma saída registrada hoje.</div>) : (
                 <div className="space-y-3">{expenses.map(e => (<div key={e.id} className={`flex items-center justify-between p-5 rounded-2xl ${isDark ? 'bg-[#121214]' : 'bg-gray-50'}`}><div className="flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center"><TrendingDown className="w-5 h-5" /></div><div><p className="font-black uppercase text-xs">{e.description}</p><p className="text-[10px] font-bold opacity-30">{new Date(e.timestamp).toLocaleTimeString('pt-BR')}</p></div></div><span className="font-black text-red-500">- R$ {e.amount.toFixed(2)}</span></div>))}</div>
               )}
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className={`p-8 rounded-[3rem] border shadow-xl ${isDark ? 'bg-[#1C1C1E] border-[#2C2C2E]' : 'bg-white border-gray-100'}`}>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-6 opacity-40">Registrar Saída</h3>
            <div className="space-y-4">
              <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest opacity-30 ml-2">Descrição</label><input type="text" placeholder="Ex: Pagamento Gelo" value={expenseDesc} onChange={e => setExpenseDesc(e.target.value)} className={`w-full p-4 rounded-2xl border outline-none font-bold text-sm ${isDark ? 'bg-[#121214] border-[#2C2C2E]' : 'bg-gray-50 border-gray-200'}`} /></div>
              <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest opacity-30 ml-2">Valor</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-sm opacity-20">R$</span><input type="text" placeholder="0,00" value={expenseVal} onChange={e => setExpenseVal(e.target.value)} className={`w-full pl-10 pr-4 py-4 rounded-2xl border outline-none font-bold text-sm ${isDark ? 'bg-[#121214] border-[#2C2C2E]' : 'bg-gray-50 border-gray-200'}`} /></div></div>
              <button onClick={handleAddExpense} className="w-full py-4 bg-[#E85D75] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-[#E85D75]/20 hover:scale-[1.02] active:scale-95 transition-all">Confirmar Saída</button>
            </div>
          </div>

          <div className={`p-8 rounded-[3rem] border shadow-2xl relative overflow-hidden transition-all ${!canCloseCashier ? 'border-amber-500/30 bg-amber-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
            <h3 className={`text-sm font-black uppercase tracking-[0.2em] mb-6 ${!canCloseCashier ? 'text-amber-500' : 'text-red-500'}`}>Encerramento</h3>
            
            {!canCloseCashier ? (
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-6 space-y-3 animate-in slide-in-from-top-2">
                 <div className="flex items-center gap-2 text-amber-500 font-black uppercase text-[10px]"><AlertTriangle className="w-4 h-4" /> Salão Ocupado</div>
                 <p className="text-[10px] font-bold opacity-60 leading-relaxed">Você possui **{occupiedTablesCount} mesas** ou **{activeOrdersCount} pedidos** em aberto. Feche todas as comandas antes de encerrar o caixa.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Gorjetas em Espécie</label><input type="text" placeholder="R$ 0,00" value={tipsTotal} onChange={e => setTipsTotal(e.target.value)} className={`w-full p-4 rounded-2xl border border-red-500/20 outline-none font-bold text-sm ${isDark ? 'bg-black/20' : 'bg-white'}`} /></div>
                <button onClick={handleCloseCashier} className="w-full py-5 bg-red-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-red-500/30 hover:scale-[1.02] active:scale-95 transition-all">Fechar Caixa Agora</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CashierStatCard = ({ label, value, icon: Icon, color, isDark, isTotal }: any) => {
  const colors = {
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    rose: 'text-red-500 bg-red-500/10 border-red-500/20',
    blue: 'text-[#E85D75] bg-[#E85D75]/10 border-[#E85D75]/20',
  }[color as 'emerald' | 'rose' | 'blue'];

  return (
    <div className={`p-8 rounded-[2.5rem] border transition-all ${isDark ? 'bg-[#1C1C1E] border-[#2C2C2E]' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/20'}`}>
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-2xl ${colors}`}><Icon className="w-5 h-5" /></div>
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">{label}</p>
          <div className="flex items-baseline justify-end gap-1"><span className={`text-sm font-black opacity-30 ${isTotal ? 'text-[#E85D75] opacity-50' : ''}`}>R$</span><p className={`text-3xl font-black tracking-tighter ${isTotal ? 'text-[#E85D75]' : ''}`}>{value.toFixed(2)}</p></div>
        </div>
      </div>
      <div className="flex items-center gap-2"><div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}><motion.div initial={{ width: 0 }} animate={{ width: '70%' }} className={`h-full rounded-full ${color === 'rose' ? 'bg-red-500' : color === 'emerald' ? 'bg-emerald-500' : 'bg-[#E85D75]'}`} /></div></div>
    </div>
  );
};
