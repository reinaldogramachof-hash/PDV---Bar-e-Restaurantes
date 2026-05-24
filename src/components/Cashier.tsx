import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import {
  AlertTriangle,
  Banknote,
  Calendar,
  CreditCard,
  Edit3,
  History,
  Lock,
  MessageSquare,
  Receipt,
  Save,
  TrendingDown,
  TrendingUp,
  Trash2,
  Unlock,
  Wallet,
  X,
} from 'lucide-react';
import { useAudit } from '../hooks/useAudit';
import { Expense } from '../types';
import { getDeliveredOnlineOrdersInWindow, getOnlinePaymentBreakdown, getOnlineSalesTotal } from '../services/onlineOrdersService';

export const Cashier: React.FC = () => {
  const { currentEmpresa, cashierSession, cashierHistory, expenses, orders, onlineOrders, tables, theme, openCashier, closeCashier, addExpense, updateExpense, deleteExpense } = useApp();
  const isDark = theme === 'dark';
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseVal, setExpenseVal] = useState('');
  const [tipsTotal, setTipsTotal] = useState('');
  const [initialBalanceInput, setInitialBalanceInput] = useState('');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editExpenseDesc, setEditExpenseDesc] = useState('');
  const [editExpenseVal, setEditExpenseVal] = useState('');
  const { log } = useAudit();

  const closedOrders = orders.filter(order => order.status === 'closed');
  const onlineSessionOrders = getDeliveredOnlineOrdersInWindow(onlineOrders, cashierSession?.openedAt || null);
  const activeOrdersCount = orders.filter(order => order.status === 'open').length;
  const occupiedTablesCount = tables.filter(table => table.status !== 'livre').length;

  const onlineSalesToday = getOnlineSalesTotal(onlineSessionOrders);
  const salesToday = closedOrders.reduce((acc, order) => acc + order.subtotal, 0) + onlineSalesToday;
  const serviceChargeToday = closedOrders.reduce((acc, order) => acc + order.serviceCharge, 0);
  const expensesToday = expenses.reduce((acc, expense) => acc + expense.amount, 0);
  const expectedBalance = (cashierSession?.initialBalance ?? 0) + salesToday + serviceChargeToday - expensesToday;
  const paymentBreakdown = closedOrders.reduce<Record<string, number>>((acc, order) => {
    order.payments.forEach(payment => {
      acc[payment.method] = (acc[payment.method] || 0) + payment.amount;
    });
    return acc;
  }, {});
  const onlinePaymentBreakdown = getOnlinePaymentBreakdown(onlineSessionOrders);
  Object.entries(onlinePaymentBreakdown).forEach(([method, value]) => {
    paymentBreakdown[method] = (paymentBreakdown[method] || 0) + value;
  });
  const canCloseCashier = activeOrdersCount === 0 && occupiedTablesCount === 0;
  const panelClass = isDark ? 'bg-surface border-border' : 'bg-surface-light border-border-light';
  const fieldClass = isDark ? 'bg-elevated border-border' : 'bg-elevated-light border-border-light';

  const handleAddExpense = () => {
    const amount = parseFloat(expenseVal.replace(',', '.'));
    if (!expenseDesc.trim() || Number.isNaN(amount) || amount <= 0) return;

    addExpense({
      id: Date.now().toString(),
      empresaId: currentEmpresa.id,
      description: expenseDesc,
      amount,
      category: 'Outros',
      status: 'pago',
      timestamp: new Date().toISOString(),
    });
    setExpenseDesc('');
    setExpenseVal('');
  };

  const handleOpenCashier = () => {
    const v = parseFloat(initialBalanceInput.replace(',', '.')) || 0;
    openCashier(v);
    setInitialBalanceInput('');
    log('cashier_open', `Caixa aberto com fundo de R$${v.toFixed(2)}`);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setEditExpenseDesc(expense.description);
    setEditExpenseVal(expense.amount.toString());
  };

  const handleSaveEditExpense = () => {
    if (!editingExpense) return;
    const v = parseFloat(editExpenseVal.replace(',', '.'));
    if (!editExpenseDesc.trim() || isNaN(v) || v <= 0) return;
    updateExpense({
      ...editingExpense,
      description: editExpenseDesc,
      amount: v,
    });
    log('expense_edit', `Saída editada: ${editExpenseDesc} - R$${v.toFixed(2)}`);
    setEditingExpense(null);
  };

  const handleDeleteExpense = (expense: Expense) => {
    deleteExpense(expense.id);
    log('expense_delete', `Saída removida: ${expense.description} - R$${expense.amount.toFixed(2)}`);
    if (editingExpense?.id === expense.id) setEditingExpense(null);
  };

  const handleCloseCashier = () => {
    if (!canCloseCashier) return;
    const tips = parseFloat(tipsTotal.replace(',', '.')) || 0;
    closeCashier(tips);
    setTipsTotal('');
    log('cashier_close', 'Caixa foi fechado pelo usuário.', { tips });
  };

  const money = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const generateWhatsAppReport = () => {
    if (!cashierSession) return '';
    const now = new Date();
    const openedAt = new Date(cashierSession.openedAt);
    const fmt = (d: Date) => d.toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });

    const lines = [
      `*Fechamento de Caixa*`,
      `Abertura: ${fmt(openedAt)}`,
      `Fechamento: ${fmt(now)}`,
      ``,
      `*Resumo Financeiro*`,
      `Fundo inicial: ${money(cashierSession.initialBalance ?? 0)}`,
      `Faturamento: ${money(salesToday)}`,
      `Taxa serviço: ${money(serviceChargeToday)}`,
      `Saídas: ${money(expensesToday)}`,
      ``,
      `*Saldo Final: ${money(expectedBalance)}*`,
    ];

    const methods = Object.entries(paymentBreakdown);
    if (methods.length > 0) {
      lines.push('', '*Por forma de pagamento*');
      methods.forEach(([method, value]) => {
        lines.push(`${method}: ${money(Number(value))}`);
      });
    }

    return lines.join('\n');
  };

  const handleWhatsAppReport = () => {
    const report = generateWhatsAppReport();
    const encoded = encodeURIComponent(report);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  if (!cashierSession) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
        <section className={`flex flex-col items-center justify-center p-10 rounded-panel border ${panelClass}`}>
          <div className="w-14 h-14 bg-danger/10 text-danger rounded-panel flex items-center justify-center mb-5">
            <Lock className="w-7 h-7" />
          </div>
          <div className="text-center space-y-2 mb-6">
            <h2 className="text-xl font-semibold">Caixa Encerrado</h2>
            <p className="text-sm text-muted">Aguardando abertura do próximo turno.</p>
          </div>
          <div className="w-full max-w-xs mb-5">
            <Field
              label="Fundo de troco"
              value={initialBalanceInput}
              onChange={setInitialBalanceInput}
              placeholder="Fundo de troco (opcional)"
              className={fieldClass}
              prefix="R$"
            />
          </div>
          <button onClick={handleOpenCashier} className="flex items-center gap-2 px-5 h-11 bg-accent text-white rounded-control font-medium text-sm hover:bg-accent-hover active:scale-95 transition-all">
            <Unlock className="w-4 h-4" /> Abrir novo turno
          </button>
        </section>

        {cashierHistory.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-3 text-muted">
              <History className="w-5 h-5" />
              <h3 className="text-sm font-semibold">Histórico de movimentação</h3>
            </div>
            <HistoryTable sessions={cashierHistory} isDark={isDark} panelClass={panelClass} />
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CashierStatCard label="Entradas" value={salesToday + serviceChargeToday} icon={TrendingUp} tone="success" panelClass={panelClass} />
        <CashierStatCard label="Saídas" value={expensesToday} icon={TrendingDown} tone="danger" panelClass={panelClass} />
        <CashierStatCard label="Saldo estimado" value={expectedBalance} icon={Wallet} tone="accent" panelClass={panelClass} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <section className={`lg:col-span-8 p-5 rounded-panel border ${panelClass}`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Movimentação Detalhada</h2>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 text-success rounded-full text-xs font-medium">
              <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" /> Ao vivo
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <InfoCard label="Vendas de balcão" value={salesToday} icon={CreditCard} className={fieldClass} />
            <InfoCard label="Serviço e taxas" value={serviceChargeToday} icon={Receipt} className={fieldClass} />
          </div>

          <div className="pt-5 border-t border-current/10">
            <h3 className="text-sm font-semibold mb-4">Despesas e sangrias</h3>
            {expenses.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted">Nenhuma saída registrada hoje.</div>
            ) : (
              <div className="space-y-2">
                {expenses.map(expense => (
                  <div key={expense.id} className={`flex items-center justify-between p-3 rounded-panel ${isDark ? 'bg-elevated' : 'bg-elevated-light'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-panel bg-danger/10 text-danger flex items-center justify-center">
                        <TrendingDown className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{expense.description}</p>
                        <p className="text-xs text-muted">{new Date(expense.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-danger">- R$ {expense.amount.toFixed(2)}</span>
                      <button
                        onClick={() => handleEditExpense(expense)}
                        className={`w-8 h-8 rounded-control flex items-center justify-center border transition-all ${isDark ? 'border-border hover:bg-surface' : 'border-border-light hover:bg-surface-light'}`}
                        aria-label="Editar saída"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(expense)}
                        className="w-8 h-8 rounded-control flex items-center justify-center border border-danger/20 text-danger transition-all hover:bg-danger/10"
                        aria-label="Remover saída"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="lg:col-span-4 space-y-5">
          <section className={`p-5 rounded-panel border ${panelClass}`}>
            <h3 className="text-sm font-semibold mb-4">Registrar saída</h3>
            <div className="space-y-4">
              <Field label="Descrição" value={expenseDesc} onChange={setExpenseDesc} placeholder="Ex: Pagamento de gelo" className={fieldClass} />
              <Field label="Valor" value={expenseVal} onChange={setExpenseVal} placeholder="0,00" className={fieldClass} prefix="R$" />
              <button onClick={handleAddExpense} className="w-full h-10 bg-accent text-white rounded-control font-medium text-sm hover:bg-accent-hover active:scale-95 transition-all">
                Confirmar saída
              </button>
            </div>
          </section>

          <section className={`p-5 rounded-panel border ${!canCloseCashier ? 'border-warning/30 bg-warning/5' : 'border-danger/20 bg-danger/5'}`}>
            <h3 className={`text-sm font-semibold mb-4 ${!canCloseCashier ? 'text-warning' : 'text-danger'}`}>Encerramento</h3>

            {!canCloseCashier ? (
              <div className="p-4 rounded-panel bg-warning/10 border border-warning/20 space-y-3">
                <div className="flex items-center gap-2 text-warning font-medium text-sm">
                  <AlertTriangle className="w-4 h-4" /> Salão ocupado
                </div>
                <p className="text-sm text-muted leading-relaxed">
                  Existem {occupiedTablesCount} mesas ou {activeOrdersCount} pedidos em aberto. Feche todas as comandas antes de encerrar o caixa.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Field label="Gorjetas em espécie" value={tipsTotal} onChange={setTipsTotal} placeholder="0,00" className={fieldClass} prefix="R$" />
                <button onClick={handleWhatsAppReport} className={`w-full h-10 rounded-control border font-medium text-sm transition-all flex items-center justify-center gap-2 ${fieldClass}`}>
                  <MessageSquare className="w-4 h-4" />
                  Relatório WhatsApp
                </button>
                <button onClick={handleCloseCashier} className="w-full h-11 bg-danger text-white rounded-control font-medium text-sm hover:brightness-110 active:scale-95 transition-all">
                  Fechar caixa agora
                </button>
              </div>
            )}
          </section>
        </aside>
      </div>

      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-panel border shadow-2xl overflow-hidden ${panelClass}`}>
            <div className={`px-5 py-4 flex items-center justify-between border-b ${isDark ? 'border-border' : 'border-border-light'}`}>
              <div>
                <h3 className="font-semibold text-base">Editar saída</h3>
                <p className="text-xs text-muted">Ajuste a movimentação registrada</p>
              </div>
              <button
                onClick={() => setEditingExpense(null)}
                className="p-2 rounded-control transition-all hover:bg-danger/10 hover:text-danger text-muted"
                aria-label="Fechar edição"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <Field label="Descrição" value={editExpenseDesc} onChange={setEditExpenseDesc} placeholder="Descrição" className={fieldClass} />
              <Field label="Valor" value={editExpenseVal} onChange={setEditExpenseVal} placeholder="0,00" className={fieldClass} prefix="R$" />
            </div>
            <div className={`p-5 border-t grid grid-cols-2 gap-3 ${isDark ? 'bg-elevated border-border' : 'bg-elevated-light border-border-light'}`}>
              <button
                onClick={() => handleDeleteExpense(editingExpense)}
                className="h-10 rounded-control border border-danger/20 text-danger font-medium text-sm transition-all hover:bg-danger/10 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
              <button
                onClick={handleSaveEditExpense}
                className="h-10 rounded-control bg-accent text-white font-medium text-sm hover:bg-accent-hover transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CashierStatCard = ({ label, value, icon: Icon, tone, panelClass }: any) => {
  const tones = {
    success: 'text-success bg-success/10 border-success/20',
    danger: 'text-danger bg-danger/10 border-danger/20',
    accent: 'text-accent bg-accent/10 border-accent/20',
  }[tone as 'success' | 'danger' | 'accent'];

  return (
    <div className={`p-5 rounded-panel border ${panelClass}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-panel border ${tones}`}><Icon className="w-5 h-5" /></div>
        <div className="text-right">
          <p className="text-xs text-muted mb-1">{label}</p>
          <p className="text-xl font-semibold">R$ {value.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ label, value, icon: Icon, className }: any) => (
  <div className={`p-4 rounded-panel border ${className}`}>
    <div className="flex items-center gap-2 mb-3 text-muted">
      <Icon className="w-4 h-4" />
      <span className="text-sm">{label}</span>
    </div>
    <p className="text-xl font-semibold">R$ {value.toFixed(2)}</p>
  </div>
);

const Field = ({ label, value, onChange, placeholder, className, prefix }: any) => (
  <label className="space-y-1 block">
    <span className="text-xs text-muted">{label}</span>
    <div className={`relative h-10 rounded-control border ${className}`}>
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">{prefix}</span>}
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        className={`w-full h-full bg-transparent outline-none text-sm font-medium ${prefix ? 'pl-10' : 'pl-3'} pr-3 placeholder:text-muted`}
      />
    </div>
  </label>
);

const HistoryTable = ({ sessions, isDark, panelClass }: any) => (
  <div className={`rounded-panel border overflow-hidden ${panelClass}`}>
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className={`text-xs font-medium text-muted border-b ${isDark ? 'border-border bg-elevated' : 'border-border-light bg-elevated-light'}`}>
            <th className="px-4 py-3">Abertura</th>
            <th className="px-4 py-3 text-right">Pedidos</th>
            <th className="px-4 py-3 text-right">Faturamento</th>
            <th className="px-4 py-3 text-right">Despesas</th>
            <th className="px-4 py-3 text-right">Saldo final</th>
          </tr>
        </thead>
        <tbody className={isDark ? 'divide-y divide-border' : 'divide-y divide-border-light'}>
          {[...sessions].reverse().map((session, index) => (
            <tr key={index} className={isDark ? 'hover:bg-elevated' : 'hover:bg-elevated-light'}>
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted" />
                  <div>
                    <p className="font-medium">{new Date(session.openedAt).toLocaleDateString('pt-BR')}</p>
                    <p className="text-xs text-muted">{session.closedAt ? `Fechado às ${new Date(session.closedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Em aberto'}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-right font-medium">{session.ordersCount}</td>
              <td className="px-4 py-4 text-right font-medium text-success">R$ {(session.salesTotal + session.serviceTaxTotal).toFixed(2)}</td>
              <td className="px-4 py-4 text-right font-medium text-danger">R$ {session.expensesTotal.toFixed(2)}</td>
              <td className="px-4 py-4 text-right">
                <span className="px-3 py-1 bg-success/10 text-success rounded-full font-medium text-xs">R$ {(session.finalBalance ?? 0).toFixed(2)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
