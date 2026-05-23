import React, { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { Download, TrendingUp, TrendingDown, Calendar, PieChart, Users, ShoppingBag, ArrowUpRight, DollarSign, Clock, FileText, ChevronRight, BarChart3, Target, Plus, Trash2, Receipt, CreditCard, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Expense } from '../types';

type Tab = 'dashboard' | 'fluxo' | 'vendas' | 'produtos' | 'atendentes';
type Period = 'hoje' | 'semana' | 'mes' | 'total';

const EXPENSE_CATEGORIES = ['Insumos', 'Pessoal', 'Aluguel', 'Utilidades', 'Marketing', 'Impostos', 'Outros'] as const;

const downloadCSV = (filename: string, rows: string[][]) => {
  const bom = '﻿';
  const content = bom + rows.map(r => r.map(c => `"${c}"`).join(';')).join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const Reports: React.FC = () => {
  const { currentEmpresa, orders, waiters, theme, expenses, addExpense, deleteExpense, stockItems } = useApp();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [period, setPeriod] = useState<Period>('mes');
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    category: 'Outros',
    status: 'pago',
    amount: 0,
    description: '',
  });

  // Filter orders by period
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(o => {
      const orderDate = new Date(o.timestamp);
      if (period === 'hoje') return orderDate.toDateString() === now.toDateString();
      if (period === 'semana') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return orderDate >= weekAgo;
      }
      if (period === 'mes') {
        return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [orders, period]);

  // Filter expenses by period
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter(e => {
      const expenseDate = new Date(e.timestamp);
      if (period === 'hoje') return expenseDate.toDateString() === now.toDateString();
      if (period === 'semana') {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return expenseDate >= weekAgo;
      }
      if (period === 'mes') {
        return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [expenses, period]);

  const salesData = [...filteredOrders].reverse();
  const totalRevenue = filteredOrders.reduce((acc, o) => acc + o.subtotal, 0);
  const totalService = filteredOrders.reduce((acc, o) => acc + o.serviceCharge, 0);
  const totalSalesAmount = totalRevenue + totalService;
  const totalExpensesAmount = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  
  const cmvTotal = filteredOrders.flatMap(o => o.items).reduce((acc, item) => {
    const productRecipe = item.product.recipe || [];
    const itemCost = productRecipe.reduce((recipeAcc, recipeItem) => {
      const stockItem = stockItems.find(si => si.id === recipeItem.stockItemId);
      return recipeAcc + (stockItem ? stockItem.costPrice * recipeItem.quantity : 0);
    }, 0);
    return acc + (item.quantity * itemCost);
  }, 0);

  const netProfit = totalSalesAmount - totalExpensesAmount - cmvTotal;

  // Stats for products
  const productStats = filteredOrders.flatMap(o => o.items).reduce<Record<string, { qty: number; revenue: number; category: string }>>((acc, item) => {
    const name = item.product.name;
    if (!acc[name]) acc[name] = { qty: 0, revenue: 0, category: item.product.category };
    acc[name].qty += item.quantity;
    acc[name].revenue += item.price * item.quantity;
    return acc;
  }, {});

  const productRanking = (Object.entries(productStats) as [string, { qty: number; revenue: number; category: string }][])
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .map(([name, stats]) => ({ name, ...stats }));

  // Stats for categories (Sales)
  const categoryStats = (Object.values(productStats) as { qty: number; revenue: number; category: string }[]).reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.revenue;
    return acc;
  }, {});

  // Stats for expense categories
  const expenseCategoryStats = filteredExpenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {});

  // Stats for waiters
  const waiterStats = waiters.map(w => {
    const wOrders = filteredOrders.filter(o => o.waiterId === w.id);
    const revenue = wOrders.reduce((acc, o) => acc + o.total, 0);
    const serviceCharge = wOrders.reduce((acc, o) => acc + o.serviceCharge, 0);
    return {
      id: w.id,
      name: w.name,
      ordersCount: wOrders.length,
      revenue,
      commission: serviceCharge,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount) return;

    const expense: Expense = {
      id: Date.now().toString(),
      empresaId: currentEmpresa.id,
      description: newExpense.description,
      amount: Number(newExpense.amount),
      category: newExpense.category as any,
      status: newExpense.status as any,
      timestamp: new Date().toISOString(),
    };

    addExpense(expense);
    setIsExpenseModalOpen(false);
    setNewExpense({ category: 'Outros', status: 'pago', amount: 0, description: '' });
  };

  const handleExport = () => {
    const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    if (activeTab === 'vendas') {
      const header = ['Data/Hora', 'Pedido', 'Modo', 'Mesa', 'Forma de Pagamento', 'Total (R$)'];
      const rows = salesData.map(o => [
        new Date(o.timestamp).toLocaleString('pt-BR'),
        `#${o.id.slice(-6)}`,
        o.mode === 'mesa' ? 'Mesa' : 'Balcão',
        o.tableNumber?.toString() || '',
        o.payments.map(p => p.method).join(' + ') || '-',
        o.total.toFixed(2),
      ]);
      downloadCSV(`vendas_${period}_${dateStr}.csv`, [header, ...rows]);
    }
  };

  return (
    <div className="flex flex-col min-h-full gap-5 animate-in fade-in duration-700 pb-8">
      {/* Header with Filters */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-4">
        <div className="space-y-0.5">
          <h2 className="text-xl font-semibold leading-none">BI & Financeiro</h2>
          <p className="text-xs text-muted">Gestão Consolidada de Fluxo e Operação</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex p-1 gap-1 rounded-panel bg-black/5 dark:bg-white/5 border border-white/10">
            {(['hoje', 'semana', 'mes', 'total'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-control text-xs font-medium transition-all ${period === p ? 'bg-white dark:bg-[var(--color-border)] shadow text-[var(--color-accent)]' : 'opacity-40 hover:opacity-100'}`}
              >
                {p}
              </button>
            ))}
          </div>
          <button onClick={() => setIsExpenseModalOpen(true)} className="px-4 h-10 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded-panel flex items-center gap-2 transition-all text-xs font-medium">
             <Plus className="w-3.5 h-3.5" />
             Lançar Despesa
          </button>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex-shrink-0 flex p-1 gap-1 rounded-panel bg-black/5 dark:bg-white/5 border border-white/10 w-fit">
        {(['dashboard', 'fluxo', 'vendas', 'produtos', 'atendentes'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-1.5 rounded-control text-xs font-medium transition-all duration-200 relative ${activeTab === t ? 'bg-white dark:bg-[var(--color-border)] shadow text-[var(--color-accent)]' : 'opacity-40 hover:opacity-80'}`}
          >
            {t === 'fluxo' ? 'Gestão de Caixa' : t}
          </button>
        ))}
      </div>

      <div className="flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-5">
              {/* Main KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Entradas (Vendas)', value: `R$ ${totalSalesAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                  { label: 'Saídas (Despesas)', value: `R$ ${totalExpensesAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10' },
                  { label: 'Lucro Líquido Real', value: `R$ ${netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: netProfit >= 0 ? 'text-blue-500' : 'text-[var(--color-accent)]', bg: netProfit >= 0 ? 'bg-blue-500/10' : 'bg-[var(--color-accent)]/10' },
                  { label: 'Margem Líquida', value: `${totalSalesAmount ? ((netProfit / totalSalesAmount) * 100).toFixed(1) : 0}%`, icon: Target, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                ].map((kpi, i) => (
                  <div key={i} className={`p-5 rounded-panel border ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/20'}`}>
                    <div className={`w-9 h-9 rounded-control ${kpi.bg} ${kpi.color} flex items-center justify-center mb-3`}>
                      <kpi.icon className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-medium text-muted mb-0.5">{kpi.label}</p>
                    <p className="text-xl font-semibold">{kpi.value}</p>
                  </div>
                ))}
              </div>

              {/* Advanced Views */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className={`lg:col-span-2 p-5 rounded-panel border ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-100 shadow-xl'}`}>
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-sm font-semibold">Estrutura de Gastos</h3>
                    <PieChart className="w-4 h-4 opacity-20" />
                  </div>
                  <div className="space-y-3">
                    {Object.entries(expenseCategoryStats).length === 0 ? (
                      <div className="py-8 text-center text-muted text-xs">Nenhuma despesa lançada no período</div>
                    ) : (
                      Object.entries(expenseCategoryStats).map(([cat, rev]) => (
                        <div key={cat} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-medium">
                            <span>{cat}</span>
                            <span className="text-muted">R$ {Number(rev).toLocaleString('pt-BR')}</span>
                          </div>
                          <div className="h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(Number(rev) / totalExpensesAmount) * 100}%` }} className="h-full bg-red-500/50 rounded-full" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className={`p-5 rounded-panel border ${isDark ? 'bg-gradient-to-br from-[var(--color-accent)]/10 to-transparent border-[var(--color-accent)]/20' : 'bg-pink-50/30 border-pink-100'}`}>
                   <div className="flex items-center gap-3 mb-4">
                      <Clock className="w-4 h-4 text-[var(--color-accent)]" />
                      <h3 className="text-sm font-semibold">DRE Resumido</h3>
                   </div>
                   <div className="space-y-1">
                      <div className="flex justify-between items-center py-2 border-b border-current/5">
                         <span className="text-xs text-muted">Faturamento</span>
                         <span className="text-sm font-semibold">R$ {totalSalesAmount.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-current/5">
                         <span className="text-xs text-muted">CMV (Custo Produtos)</span>
                         <span className="text-sm font-medium text-red-400">-(R$ {cmvTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-current/5">
                         <span className="text-xs text-muted">Despesas (Insumos/Gerais)</span>
                         <span className="text-sm font-medium text-red-400">-(R$ {totalExpensesAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</span>
                      </div>
                      <div className={`flex justify-between items-center px-3 py-2.5 rounded-control mt-2 ${netProfit >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                         <span className="text-xs font-medium">Resultado Final</span>
                         <span className="text-base font-semibold">R$ {netProfit.toLocaleString('pt-BR')}</span>
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'fluxo' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className={`rounded-section border overflow-hidden ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-100 shadow-2xl'}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className={`text-xs font-semibold  border-b ${isDark ? 'bg-white/5 border-white/5 text-white/30' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                        <th className="px-4 py-3">Data</th>
                        <th className="px-4 py-3">Categoria</th>
                        <th className="px-4 py-3">Descrição</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Valor</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-current/5">
                      {filteredExpenses.length === 0 && (
                        <tr><td colSpan={6} className="py-20 text-center opacity-30 text-xs font-semibold ">Nenhum lançamento extra registrado</td></tr>
                      )}
                      {filteredExpenses.reverse().map(e => (
                        <tr key={e.id} className="group hover:bg-current/[0.01] transition-all">
                          <td className="px-4 py-3 text-xs text-muted">{new Date(e.timestamp).toLocaleDateString('pt-BR')}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-current/5 border border-current/10">{e.category}</span>
                          </td>
                          <td className="px-4 py-3 text-xs font-medium">{e.description}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${e.status === 'pago' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                              {e.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-danger">R$ {e.amount.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => deleteExpense(e.id)} className="p-1.5 rounded-control text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100 transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'vendas' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`rounded-section border overflow-hidden ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-100 shadow-2xl'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className={`text-xs font-semibold  border-b ${isDark ? 'bg-white/5 border-white/5 text-white/30' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                      <th className="px-4 py-3 font-medium">Data & Hora</th>
                      <th className="px-4 py-3 font-medium">Ticket</th>
                      <th className="px-4 py-3 font-medium">Operação</th>
                      <th className="px-4 py-3 font-medium">Pagamento</th>
                      <th className="px-4 py-3 text-right font-medium">Valor</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-border' : 'divide-gray-100'}`}>
                    {salesData.map(o => (
                      <tr key={o.id} className={`group transition-colors ${isDark ? 'hover:bg-elevated' : 'hover:bg-gray-50'}`}>
                        <td className="px-4 py-3 text-xs text-muted">{new Date(o.timestamp).toLocaleString('pt-BR')}</td>
                        <td className="px-4 py-3 text-xs font-medium">#{o.id.slice(-6)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                            {o.mode === 'mesa' ? `Mesa ${o.tableNumber}` : 'Balcão'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted">{o.payments.map(p => p.method).join(' + ')}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-[var(--color-accent)]">R$ {o.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'produtos' && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {productRanking.map((p, i) => (
                  <div key={p.name} className={`p-5 rounded-panel border relative overflow-hidden ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-100 shadow-xl'}`}>
                    <div className="absolute top-0 right-0 p-3">
                       <span className={`text-3xl font-semibold opacity-5 ${i < 3 ? 'text-[var(--color-accent)]' : ''}`}>{i + 1}º</span>
                    </div>
                    <div className="space-y-0.5 mb-4">
                       <p className="text-xs text-muted">{p.category}</p>
                       <h4 className="text-sm font-semibold truncate pr-8">{p.name}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                       <div className="p-3 rounded-control bg-black/5 dark:bg-white/5 border border-current/5">
                          <p className="text-xs text-muted mb-1">Volume</p>
                          <p className="text-lg font-semibold">{p.qty}</p>
                       </div>
                       <div className="p-3 rounded-control bg-[var(--color-accent)]/5 border border-[var(--color-accent)]/10">
                          <p className="text-xs text-[var(--color-accent)]/60 mb-1">Receita</p>
                          <p className="text-lg font-semibold text-[var(--color-accent)]">R$ {p.revenue.toFixed(0)}</p>
                       </div>
                    </div>
                  </div>
                ))}
             </motion.div>
          )}

          {activeTab === 'atendentes' && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {waiterStats.map((w) => (
                  <div key={w.id} className={`p-5 rounded-panel border flex flex-col md:flex-row justify-between items-center gap-5 ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-100 shadow-xl'}`}>
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-panel bg-gradient-to-br from-[var(--color-accent)] to-orange-400 flex items-center justify-center text-white text-base font-semibold">
                           {w.name[0]}
                        </div>
                        <div>
                           <h4 className="text-sm font-semibold">{w.name}</h4>
                           <p className="text-xs text-muted">{w.ordersCount} Pedidos Finalizados</p>
                        </div>
                     </div>

                     <div className="flex gap-6 items-center">
                        <div className="text-center">
                           <p className="text-xs text-muted mb-0.5">Vendas Totais</p>
                           <p className="text-base font-semibold">R$ {w.revenue.toFixed(2)}</p>
                        </div>
                        <div className="h-8 w-px bg-current/10" />
                        <div className="text-center">
                           <p className="text-xs text-emerald-500 mb-0.5">Comissão Acumulada</p>
                           <p className="text-base font-semibold text-emerald-500">R$ {w.commission.toFixed(2)}</p>
                        </div>
                        <button className="w-8 h-8 rounded-control bg-[var(--color-accent)]/10 text-[var(--color-accent)] flex items-center justify-center hover:bg-[var(--color-accent)] hover:text-white transition-all">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
                ))}
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Expense Modal */}
      <AnimatePresence>
        {isExpenseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsExpenseModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className={`relative w-full max-w-lg rounded-panel border shadow-2xl ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-100'}`}>
               <div className={`flex items-center gap-3 px-5 py-4 border-b ${isDark ? 'border-[var(--color-border)]' : 'border-gray-100'}`}>
                  <motion.div
                    layout
                    className={`w-8 h-8 rounded-control flex items-center justify-center transition-colors duration-500
                      ${newExpense.category === 'Aluguel' ? 'bg-blue-500/20 text-blue-500' :
                        newExpense.category === 'Insumos' ? 'bg-orange-500/20 text-orange-500' :
                        newExpense.category === 'Pessoal' ? 'bg-purple-500/20 text-purple-500' :
                        newExpense.category === 'Utilidades' ? 'bg-cyan-500/20 text-cyan-500' :
                        newExpense.category === 'Marketing' ? 'bg-pink-500/20 text-pink-500' :
                        newExpense.category === 'Impostos' ? 'bg-amber-500/20 text-amber-500' :
                        'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'}`}
                  >
                     <Receipt className="w-4 h-4" />
                  </motion.div>
                  <div>
                     <h3 className="text-base font-semibold">Novo Lançamento</h3>
                     <p className="text-xs text-muted">Registre uma saída financeira</p>
                  </div>
               </div>

               <form onSubmit={handleAddExpense} className="p-5 space-y-4">
                  <div className="space-y-2">
                     <label className="text-xs text-muted ml-1">Categoria</label>
                     <div className="grid grid-cols-4 gap-1.5">
                        {EXPENSE_CATEGORIES.map(cat => (
                           <button
                              key={cat}
                              type="button"
                              onClick={() => setNewExpense(prev => ({ ...prev, category: cat }))}
                              className={`py-2 px-1.5 rounded-control border text-xs font-medium transition-all flex flex-col items-center gap-1
                                 ${newExpense.category === cat
                                    ? cat === 'Aluguel' ? 'bg-blue-500 border-blue-500 text-white' :
                                      cat === 'Insumos' ? 'bg-orange-500 border-orange-500 text-white' :
                                      cat === 'Pessoal' ? 'bg-purple-500 border-purple-500 text-white' :
                                      cat === 'Utilidades' ? 'bg-cyan-500 border-cyan-500 text-white' :
                                      cat === 'Marketing' ? 'bg-pink-500 border-pink-500 text-white' :
                                      cat === 'Impostos' ? 'bg-amber-500 border-amber-500 text-white' :
                                      'bg-[var(--color-accent)] border-[var(--color-accent)] text-white'
                                    : isDark ? 'bg-white/5 border-white/5 opacity-40 hover:opacity-100' : 'bg-gray-50 border-gray-100 opacity-60 hover:opacity-100'}`}
                           >
                              {cat === 'Insumos' && <ShoppingBag className="w-3.5 h-3.5" />}
                              {cat === 'Pessoal' && <Users className="w-3.5 h-3.5" />}
                              {cat === 'Aluguel' && <Calendar className="w-3.5 h-3.5" />}
                              {cat === 'Utilidades' && <DollarSign className="w-3.5 h-3.5" />}
                              {cat === 'Marketing' && <Target className="w-3.5 h-3.5" />}
                              {cat === 'Impostos' && <FileText className="w-3.5 h-3.5" />}
                              {cat === 'Outros' && <AlertCircle className="w-3.5 h-3.5" />}
                              {cat}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-xs text-muted ml-1">Status</label>
                     <div className="flex gap-2">
                        {['pago', 'pendente'].map(status => (
                           <button
                              key={status}
                              type="button"
                              onClick={() => setNewExpense(prev => ({ ...prev, status: status as any }))}
                              className={`flex-1 h-9 rounded-control text-xs font-medium border transition-all
                                 ${newExpense.status === status
                                    ? status === 'pago' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-amber-500 border-amber-500 text-white'
                                    : isDark ? 'bg-white/5 border-white/5 opacity-30' : 'bg-gray-50 border-gray-100 opacity-60'}`}
                           >
                              {status}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-xs text-muted ml-1">Descrição / Favorecido</label>
                     <input
                        required
                        type="text"
                        value={newExpense.description}
                        onChange={e => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Ex: Aluguel Mensal, Pagamento Staff..."
                        className={`w-full h-10 px-3 rounded-control border bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 ${isDark ? 'border-[var(--color-border)]' : 'border-gray-200'}`}
                     />
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-xs text-muted ml-1">Valor Total</label>
                     <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-30" />
                        <input
                           required
                           type="number"
                           step="0.01"
                           value={newExpense.amount || ''}
                           onChange={e => setNewExpense(prev => ({ ...prev, amount: Number(e.target.value) }))}
                           placeholder="0,00"
                           className={`w-full h-10 pl-9 pr-3 rounded-control border bg-transparent text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 ${isDark ? 'border-[var(--color-border)]' : 'border-gray-200'}`}
                        />
                     </div>
                  </div>

                  <div className="flex gap-3 pt-1">
                     <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="flex-1 h-10 rounded-control text-xs font-medium opacity-40 hover:opacity-100 transition-all">Cancelar</button>
                     <button type="submit" className="flex-[2] h-10 rounded-control bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-medium transition-all">Confirmar Lançamento</button>
                  </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
