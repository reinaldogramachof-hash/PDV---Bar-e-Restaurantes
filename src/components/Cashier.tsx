import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import {
  AlertTriangle,
  Banknote,
  Calendar,
  CheckCircle,
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
  Clock,
  CheckSquare,
} from 'lucide-react';
import { useAudit } from '../hooks/useAudit';
import { CashierSession, Expense } from '../types';
import { getDeliveredOnlineOrdersInWindow, getOnlinePaymentBreakdown, getOnlineSalesTotal } from '../services/onlineOrdersService';

export const Cashier: React.FC = () => {
  const {
    currentEmpresa,
    cashierSession,
    cashierHistory,
    expenses,
    orders,
    onlineOrders,
    deliveryOrders,
    tables,
    theme,
    openCashier,
    closeCashier,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useApp();

  const isDark = theme === 'dark';
  const { log } = useAudit();

  const [activeTab, setActiveTab] = useState<'caixa' | 'agendamentos'>('caixa');

  // Formulário de movimentação do CAIXA (Despesas Pagas)
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseVal, setExpenseVal] = useState('');
  const [expenseEntryType, setExpenseEntryType] = useState<'saida' | 'entrada'>('saida');
  const [tipsTotal, setTipsTotal] = useState('');
  const [initialBalanceInput, setInitialBalanceInput] = useState('');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editExpenseDesc, setEditExpenseDesc] = useState('');
  const [editExpenseVal, setEditExpenseVal] = useState('');

  // CAI-001: contagem física de gaveta
  const [countedCashInput, setCountedCashInput] = useState('');

  // Cálculos do painel CAIXA
  const closedOrders = orders.filter(order => order.status === 'closed');
  const onlineSessionOrders = getDeliveredOnlineOrdersInWindow(onlineOrders, cashierSession?.openedAt ?? null);
  const activeOrdersCount = orders.filter(order => order.status === 'open').length;
  const occupiedTablesCount = tables.filter(table => table.status !== 'livre').length;

  const onlineSalesToday = getOnlineSalesTotal(onlineSessionOrders);
  const sessionOpenedAt = cashierSession ? new Date(cashierSession.openedAt).getTime() : 0;
  const deliverySalesToday = deliveryOrders
    .filter(d => d.status === 'entregue' && d.empresaId === currentEmpresa.id && new Date(d.createdAt).getTime() >= sessionOpenedAt)
    .reduce((acc, d) => acc + d.total, 0);

  const salesToday = closedOrders.reduce((acc, order) => acc + order.subtotal, 0) + onlineSalesToday + deliverySalesToday;
  const serviceChargeToday = closedOrders.reduce((acc, order) => acc + order.serviceCharge, 0);

  // Apenas despesas pagas impactam o caixa
  const paidExpenses = expenses.filter(e => e.status === 'pago');
  const expensesToday = paidExpenses.reduce((acc, expense) => {
    return expense.entryType === 'entrada' ? acc - expense.amount : acc + expense.amount;
  }, 0);

  const expectedBalance = (cashierSession?.initialBalance ?? 0) + salesToday + serviceChargeToday - expensesToday;
  const countedCashValue = countedCashInput ? parseFloat(countedCashInput.replace(',', '.')) : null;
  const cashBreakdownLive = countedCashValue !== null ? countedCashValue - expectedBalance : null;

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
  deliveryOrders
    .filter(d => d.status === 'entregue' && d.empresaId === currentEmpresa.id && new Date(d.createdAt).getTime() >= sessionOpenedAt)
    .forEach(d => {
      paymentBreakdown[d.paymentMethod] = (paymentBreakdown[d.paymentMethod] || 0) + d.total;
    });

  const canCloseCashier = activeOrdersCount === 0 && occupiedTablesCount === 0;
  const panelClass = isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-surface-light border-border-light';
  const fieldClass = isDark ? 'bg-elevated border-[var(--color-border)]' : 'bg-elevated-light border-border-light';

  // Handlers CAIXA
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
      entryType: expenseEntryType,
      timestamp: new Date().toISOString(),
    });

    const logLabel = expenseEntryType === 'entrada' ? 'Suprimento' : 'Saída';
    log('expense_edit', `${logLabel} registrado: ${expenseDesc} - R$${amount.toFixed(2)}`);
    setExpenseDesc('');
    setExpenseVal('');
    setExpenseEntryType('saida');
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
    log('expense_edit', `Movimentação editada: ${editExpenseDesc} - R$${v.toFixed(2)}`);
    setEditingExpense(null);
  };

  const handleDeleteExpense = (expense: Expense) => {
    deleteExpense(expense.id);
    log('expense_delete', `Movimentação removida: ${expense.description} - R$${expense.amount.toFixed(2)}`);
    if (editingExpense?.id === expense.id) setEditingExpense(null);
  };

  const handleCloseCashier = () => {
    if (!canCloseCashier) return;
    const tips = parseFloat(tipsTotal.replace(',', '.')) || 0;
    const countedCash = countedCashValue !== null && !isNaN(countedCashValue) ? countedCashValue : undefined;
    closeCashier(tips, countedCash);
    setTipsTotal('');
    setCountedCashInput('');
    log('cashier_close', 'Caixa foi fechado pelo usuário.', { tips, countedCash });
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

  return (
    <div className="space-y-5 animate-in fade-in duration-500 pb-10">
      
      {/* Abas Superiores */}
      <div className="flex justify-center mb-6">
        <div className={`flex p-1 rounded-control border ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-surface-light border-border-light'}`}>
          <button 
            onClick={() => setActiveTab('caixa')} 
            className={`px-6 h-10 rounded-panel text-sm font-medium transition-all ${activeTab === 'caixa' ? 'bg-[var(--color-accent)] text-white shadow-sm' : 'text-muted hover:text-foreground'}`}
          >
            Caixa Diário
          </button>
          <button 
            onClick={() => setActiveTab('agendamentos')} 
            className={`px-6 h-10 rounded-panel text-sm font-medium transition-all ${activeTab === 'agendamentos' ? 'bg-[var(--color-accent)] text-white shadow-sm' : 'text-muted hover:text-foreground'}`}
          >
            Agendamentos
          </button>
        </div>
      </div>

      {activeTab === 'caixa' && (
        !cashierSession ? (
          // --- CAIXA FECHADO ---
          <div className="space-y-5">
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
              <button onClick={handleOpenCashier} className="flex items-center justify-center gap-2 w-full max-w-xs h-11 bg-[var(--color-accent)] text-white rounded-control font-medium text-sm hover:brightness-110 active:scale-95 transition-all">
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
        ) : (
          // --- CAIXA ABERTO ---
          <div className="space-y-5">
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
                  <InfoCard label="Vendas (mesa/balcão)" value={closedOrders.reduce((acc, o) => acc + o.subtotal, 0)} icon={CreditCard} className={fieldClass} />
                  <InfoCard label="Serviço e taxas" value={serviceChargeToday} icon={Receipt} className={fieldClass} />
                  {onlineSalesToday > 0 && (
                    <InfoCard label="Pedidos online" value={onlineSalesToday} icon={Banknote} className={fieldClass} />
                  )}
                  {deliverySalesToday > 0 && (
                    <InfoCard label="Delivery entregue" value={deliverySalesToday} icon={TrendingUp} className={fieldClass} />
                  )}
                </div>

                <div className="pt-5 border-t border-current/10">
                  <h3 className="text-sm font-semibold mb-4">Despesas, sangrias e suprimentos</h3>
                  {paidExpenses.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted">Nenhuma movimentação registrada hoje.</div>
                  ) : (
                    <div className="space-y-2">
                      {paidExpenses.map(expense => {
                        const isEntrada = expense.entryType === 'entrada';
                        return (
                          <div key={expense.id} className={`flex items-center justify-between p-3 rounded-panel border ${isDark ? 'bg-elevated border-[var(--color-border)]' : 'bg-elevated-light border-border-light'}`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-panel flex items-center justify-center ${isEntrada ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                {isEntrada ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{expense.description}</p>
                                <p className="text-xs text-muted">
                                  {isEntrada ? 'Suprimento · ' : 'Saída · '}
                                  {new Date(expense.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`font-semibold ${isEntrada ? 'text-success' : 'text-danger'}`}>
                                {isEntrada ? '+' : '-'} R$ {expense.amount.toFixed(2)}
                              </span>
                              <button
                                onClick={() => handleEditExpense(expense)}
                                className={`w-8 h-8 rounded-control flex items-center justify-center border transition-all ${isDark ? 'border-[var(--color-border)] hover:bg-[var(--color-surface)]' : 'border-border-light hover:bg-surface-light'}`}
                                aria-label="Editar movimentação"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(expense)}
                                className="w-8 h-8 rounded-control flex items-center justify-center border border-danger/20 text-danger transition-all hover:bg-danger/10"
                                aria-label="Remover movimentação"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>

              <aside className="lg:col-span-4 space-y-5">
                <section className={`p-5 rounded-panel border ${panelClass}`}>
                  <h3 className="text-sm font-semibold mb-4">Registrar movimentação</h3>
                  <div className="space-y-4">
                    <div className={`flex rounded-control border overflow-hidden ${fieldClass}`}>
                      <button
                        onClick={() => setExpenseEntryType('saida')}
                        className={`flex-1 h-11 text-xs font-medium transition-all ${expenseEntryType === 'saida' ? 'bg-danger/20 text-danger' : 'text-muted hover:text-foreground'}`}
                      >
                        Saída / Sangria
                      </button>
                      <button
                        onClick={() => setExpenseEntryType('entrada')}
                        className={`flex-1 h-11 text-xs font-medium transition-all border-l ${isDark ? 'border-[var(--color-border)]' : 'border-border-light'} ${expenseEntryType === 'entrada' ? 'bg-success/20 text-success' : 'text-muted hover:text-foreground'}`}
                      >
                        Entrada / Suprimento
                      </button>
                    </div>
                    <Field
                      label="Descrição"
                      value={expenseDesc}
                      onChange={setExpenseDesc}
                      placeholder={expenseEntryType === 'entrada' ? 'Ex: Reforço de troco, suprimento...' : 'Ex: Pagamento fornecedor, retirada...'}
                      className={fieldClass}
                    />
                    <Field label="Valor" value={expenseVal} onChange={setExpenseVal} placeholder="0,00" className={fieldClass} prefix="R$" />
                    <button
                      onClick={handleAddExpense}
                      className={`w-full h-11 rounded-control font-medium text-sm active:scale-95 transition-all ${expenseEntryType === 'entrada' ? 'bg-success text-white hover:brightness-110' : 'bg-[var(--color-accent)] text-white hover:brightness-110'}`}
                    >
                      {expenseEntryType === 'entrada' ? 'Confirmar suprimento' : 'Confirmar saída'}
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

                      <div className={`p-4 rounded-panel border space-y-3 ${fieldClass}`}>
                        <p className="text-xs font-semibold text-muted uppercase tracking-wide">Contagem de gaveta (opcional)</p>
                        <Field
                          label="Dinheiro em espécie apurado"
                          value={countedCashInput}
                          onChange={setCountedCashInput}
                          placeholder="0,00"
                          className={fieldClass}
                          prefix="R$"
                        />
                        {cashBreakdownLive !== null && (
                          <div className={`flex items-center gap-2 text-sm font-semibold rounded-control px-3 py-2 ${
                            cashBreakdownLive === 0
                              ? 'bg-success/10 text-success'
                              : cashBreakdownLive > 0
                                ? 'bg-success/10 text-success'
                                : 'bg-danger/10 text-danger'
                          }`}>
                            <CheckCircle className="w-4 h-4 shrink-0" />
                            {cashBreakdownLive === 0
                              ? 'Caixa conferido ✓'
                              : cashBreakdownLive > 0
                                ? `Sobra de ${money(cashBreakdownLive)}`
                                : `Falta de ${money(Math.abs(cashBreakdownLive))}`
                            }
                          </div>
                        )}
                      </div>

                      <button onClick={handleWhatsAppReport} className={`w-full h-11 rounded-control border font-medium text-sm transition-all flex items-center justify-center gap-2 ${fieldClass}`}>
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
          </div>
        )
      )}

      {/* --- AGENDAMENTOS (Contas a Pagar) --- */}
      {activeTab === 'agendamentos' && (
        <AgendamentosTab isDark={isDark} panelClass={panelClass} fieldClass={fieldClass} />
      )}

      {/* Modal de edição de movimentação */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-panel border shadow-2xl overflow-hidden ${panelClass}`}>
            <div className={`px-5 py-4 flex items-center justify-between border-b ${isDark ? 'border-[var(--color-border)]' : 'border-border-light'}`}>
              <div>
                <h3 className="font-semibold text-base">Editar movimentação</h3>
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
            <div className={`p-5 border-t grid grid-cols-2 gap-3 ${isDark ? 'bg-elevated border-[var(--color-border)]' : 'bg-elevated-light border-border-light'}`}>
              <button
                onClick={() => handleDeleteExpense(editingExpense)}
                className="h-11 rounded-control border border-danger/20 text-danger font-medium text-sm transition-all hover:bg-danger/10 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Excluir
              </button>
              <button
                onClick={handleSaveEditExpense}
                className="h-11 rounded-control bg-[var(--color-accent)] text-white font-medium text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2"
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

// ─── Sub-componentes ──────────────────────────────────────────────────────────

const AgendamentosTab: React.FC<{ isDark: boolean, panelClass: string, fieldClass: string }> = ({ isDark, panelClass, fieldClass }) => {
  const { currentEmpresa, expenses, addExpense, updateExpense, deleteExpense, suppliers, collaborators } = useApp();
  const { log } = useAudit();
  
  const [desc, setDesc] = useState('');
  const [val, setVal] = useState('');
  const [cat, setCat] = useState('Outros');
  const [date, setDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<import('../types').PaymentMethod | ''>('');
  const [supplierId, setSupplierId] = useState<string>('');
  const [collaboratorId, setCollaboratorId] = useState<string>('');

  const scheduledExpenses = expenses.filter(e => e.status === 'pendente').sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const totalPending = scheduledExpenses.reduce((acc, e) => acc + e.amount, 0);
  const overdueExpenses = scheduledExpenses.filter(e => e.dueDate && new Date(e.dueDate) < new Date(new Date().setHours(0,0,0,0)));
  const totalOverdue = overdueExpenses.reduce((acc, e) => acc + e.amount, 0);

  const handleAddSchedule = () => {
    const amount = parseFloat(val.replace(',', '.'));
    if (!desc.trim() || Number.isNaN(amount) || amount <= 0 || !date) return;

    addExpense({
      id: Date.now().toString(),
      empresaId: currentEmpresa.id,
      description: desc,
      amount,
      category: cat as any,
      status: 'pendente',
      entryType: 'saida',
      dueDate: date,
      paymentMethod: paymentMethod || undefined,
      supplierId: cat === 'Insumos' && supplierId ? supplierId : undefined,
      collaboratorId: cat === 'Pessoal' && collaboratorId ? collaboratorId : undefined,
      timestamp: new Date().toISOString(),
    });

    log('expense_edit', `Agendamento registrado: ${desc} - R$${amount.toFixed(2)} para ${date}`);
    setDesc('');
    setVal('');
    setDate('');
    setPaymentMethod('');
    setSupplierId('');
    setCollaboratorId('');
  };

  const handlePaySchedule = (expense: Expense) => {
    updateExpense({
      ...expense,
      status: 'pago',
      timestamp: new Date().toISOString() // atualiza o timestamp pro momento do pagamento para entrar no caixa de hoje
    });
    log('expense_edit', `Agendamento pago: ${expense.description} - R$${expense.amount.toFixed(2)}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      <section className={`lg:col-span-8 p-5 rounded-panel border ${panelClass}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2"><Clock className="w-5 h-5 text-[var(--color-accent)]" /> Contas a Pagar</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className={`p-4 rounded-panel border ${fieldClass}`}>
             <p className="text-sm text-muted mb-1">Total Pendente</p>
             <p className="text-2xl font-semibold">R$ {totalPending.toFixed(2)}</p>
          </div>
          <div className={`p-4 rounded-panel border ${totalOverdue > 0 ? 'bg-danger/10 border-danger/20 text-danger' : fieldClass}`}>
             <p className={`text-sm mb-1 ${totalOverdue > 0 ? 'opacity-80' : 'text-muted'}`}>Total Atrasado</p>
             <p className="text-2xl font-semibold">R$ {totalOverdue.toFixed(2)}</p>
          </div>
        </div>

        <div className="pt-2">
          {scheduledExpenses.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted">Nenhum agendamento pendente.</div>
          ) : (
            <div className="space-y-3">
              {scheduledExpenses.map(expense => {
                const isOverdue = expense.dueDate && new Date(expense.dueDate) < new Date(new Date().setHours(0,0,0,0));
                const supplier = expense.supplierId ? suppliers.find(s => s.id === expense.supplierId) : null;
                const collaborator = expense.collaboratorId ? collaborators.find(c => c.id === expense.collaboratorId) : null;
                const displayTitle = supplier ? supplier.companyName : collaborator ? collaborator.name : expense.description;
                const displaySub = (supplier || collaborator) ? expense.description : expense.category;
                
                return (
                  <div key={expense.id} className={`flex items-center justify-between p-4 rounded-panel border ${isDark ? 'bg-elevated border-[var(--color-border)]' : 'bg-elevated-light border-border-light'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-panel flex items-center justify-center ${isOverdue ? 'bg-danger/10 text-danger' : 'bg-surface/5'}`}>
                        {isOverdue ? <AlertTriangle className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{displayTitle}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className={`text-xs ${isOverdue ? 'text-danger font-medium' : 'text-muted'}`}>
                            {expense.dueDate ? `Vence em ${new Date(expense.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}` : 'Sem vencimento'}
                            {' · '}{displaySub}
                          </p>
                          {expense.paymentMethod && (
                            <span className="px-1.5 py-0.5 rounded-sm bg-[var(--color-accent)]/10 text-[var(--color-accent)] text-[10px] font-bold uppercase tracking-wider">
                              {expense.paymentMethod}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-[var(--color-accent)] text-lg">
                        R$ {expense.amount.toFixed(2)}
                      </span>
                      <button
                        onClick={() => handlePaySchedule(expense)}
                        className={`px-4 h-11 rounded-control flex items-center justify-center gap-2 border transition-all hover:bg-success/10 hover:text-success hover:border-success/30 font-medium text-xs ${isDark ? 'border-[var(--color-border)]' : 'border-border-light'}`}
                      >
                        <CheckSquare className="w-4 h-4" /> Dar Baixa
                      </button>
                      <button
                        onClick={() => deleteExpense(expense.id)}
                        className="w-11 h-11 rounded-control flex items-center justify-center border border-danger/20 text-danger transition-all hover:bg-danger/10"
                        aria-label="Remover agendamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <aside className="lg:col-span-4 space-y-5">
        <section className={`p-5 rounded-panel border ${panelClass}`}>
          <h3 className="text-sm font-semibold mb-4">Novo Agendamento</h3>
          <div className="space-y-4">
            <Field label="Descrição" value={desc} onChange={setDesc} placeholder="Ex: Fornecedor Bebidas" className={fieldClass} />
            <div className="grid grid-cols-2 gap-3">
               <Field label="Valor" value={val} onChange={setVal} placeholder="0,00" className={fieldClass} prefix="R$" />
               <label className="space-y-1 block">
                  <span className="text-xs text-muted">Vencimento</span>
                  <div className={`relative h-11 rounded-control border transition-all focus-within:border-[var(--color-accent)] focus-within:ring-1 focus-within:ring-[var(--color-accent)] ${fieldClass}`}>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className={`w-full h-full bg-transparent outline-none text-sm font-medium px-3 ${isDark ? 'text-white' : 'text-gray-900'} [color-scheme:dark]`} />
                  </div>
               </label>
            </div>
            <label className="space-y-1 block">
              <span className="text-xs text-muted">Categoria</span>
              <div className={`relative h-11 rounded-control border transition-all focus-within:border-[var(--color-accent)] focus-within:ring-1 focus-within:ring-[var(--color-accent)] ${fieldClass}`}>
                <select value={cat} onChange={e => { setCat(e.target.value); setSupplierId(''); setCollaboratorId(''); }} className={`w-full h-full bg-transparent outline-none text-sm font-medium px-3 appearance-none ${isDark ? 'text-white [color-scheme:dark]' : 'text-gray-900'}`}>
                  <option className={isDark ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-900'} value="Insumos">Insumos (Mercadoria)</option>
                  <option className={isDark ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-900'} value="Pessoal">Pessoal (Salário/Vale)</option>
                  <option className={isDark ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-900'} value="Aluguel">Aluguel / Imóvel</option>
                  <option className={isDark ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-900'} value="Utilidades">Utilidades (Água, Luz)</option>
                  <option className={isDark ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-900'} value="Outros">Outros</option>
                </select>
              </div>
            </label>

            {cat === 'Insumos' && (
              <label className="space-y-1 block animate-in fade-in duration-300">
                <span className="text-xs text-muted">Vincular Fornecedor (Opcional)</span>
                <div className={`relative h-11 rounded-control border transition-all focus-within:border-[var(--color-accent)] focus-within:ring-1 focus-within:ring-[var(--color-accent)] ${fieldClass}`}>
                  <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className={`w-full h-full bg-transparent outline-none text-sm font-medium px-3 appearance-none ${isDark ? 'text-white [color-scheme:dark]' : 'text-gray-900'}`}>
                    <option className={isDark ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-900'} value="">Selecione um fornecedor...</option>
                    {suppliers.map(s => (
                      <option key={s.id} className={isDark ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-900'} value={s.id}>{s.companyName}</option>
                    ))}
                  </select>
                </div>
              </label>
            )}

            {cat === 'Pessoal' && (
              <label className="space-y-1 block animate-in fade-in duration-300">
                <span className="text-xs text-muted">Vincular Colaborador (Opcional)</span>
                <div className={`relative h-11 rounded-control border transition-all focus-within:border-[var(--color-accent)] focus-within:ring-1 focus-within:ring-[var(--color-accent)] ${fieldClass}`}>
                  <select value={collaboratorId} onChange={e => setCollaboratorId(e.target.value)} className={`w-full h-full bg-transparent outline-none text-sm font-medium px-3 appearance-none ${isDark ? 'text-white [color-scheme:dark]' : 'text-gray-900'}`}>
                    <option className={isDark ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-900'} value="">Selecione um colaborador...</option>
                    {collaborators.map(c => (
                      <option key={c.id} className={isDark ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-900'} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </label>
            )}

            <label className="space-y-1 block">
              <span className="text-xs text-muted">Forma de Pagamento Prevista</span>
              <div className={`relative h-11 rounded-control border transition-all focus-within:border-[var(--color-accent)] focus-within:ring-1 focus-within:ring-[var(--color-accent)] ${fieldClass}`}>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className={`w-full h-full bg-transparent outline-none text-sm font-medium px-3 appearance-none ${isDark ? 'text-white [color-scheme:dark]' : 'text-gray-900'}`}>
                  <option className={isDark ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-900'} value="">Indefinida</option>
                  <option className={isDark ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-900'} value="dinheiro">Dinheiro</option>
                  <option className={isDark ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-900'} value="pix">PIX</option>
                  <option className={isDark ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-900'} value="credito">Cartão de Crédito</option>
                  <option className={isDark ? 'bg-[#1a1a1a] text-white' : 'bg-white text-gray-900'} value="debito">Cartão de Débito</option>
                </select>
              </div>
            </label>

            <button
              onClick={handleAddSchedule}
              className={`w-full h-11 mt-2 rounded-control font-medium text-sm active:scale-95 transition-all bg-[var(--color-accent)] text-white hover:brightness-110`}
            >
              Confirmar Agendamento
            </button>
          </div>
        </section>
      </aside>

    </div>
  )
}

interface CashierStatCardProps {
  label: string;
  value: number;
  icon: React.FC<{ className?: string }>;
  tone: 'success' | 'danger' | 'accent';
  panelClass: string;
}

const CashierStatCard: React.FC<CashierStatCardProps> = ({ label, value, icon: Icon, tone, panelClass }) => {
  const tones: Record<'success' | 'danger' | 'accent', string> = {
    success: 'text-success bg-success/10 border-success/20',
    danger: 'text-danger bg-danger/10 border-danger/20',
    accent: 'text-[var(--color-accent)] bg-[var(--color-accent)]/10 border-[var(--color-accent)]/20',
  };

  return (
    <div className={`p-5 rounded-panel border ${panelClass}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-panel border ${tones[tone]}`}><Icon className="w-5 h-5" /></div>
        <div className="text-right">
          <p className="text-xs text-muted mb-1">{label}</p>
          <p className="text-xl font-semibold">R$ {value.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

interface InfoCardProps {
  label: string;
  value: number;
  icon: React.FC<{ className?: string }>;
  className: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ label, value, icon: Icon, className }) => (
  <div className={`p-4 rounded-panel border ${className}`}>
    <div className="flex items-center gap-2 mb-3 text-muted">
      <Icon className="w-4 h-4" />
      <span className="text-sm">{label}</span>
    </div>
    <p className="text-xl font-semibold">R$ {value.toFixed(2)}</p>
  </div>
);

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className: string;
  prefix?: string;
}

const Field: React.FC<FieldProps> = ({ label, value, onChange, placeholder, className, prefix }) => (
  <label className="space-y-1 block">
    <span className="text-xs text-muted">{label}</span>
    <div className={`relative h-11 rounded-control border transition-all focus-within:border-[var(--color-accent)] focus-within:ring-1 focus-within:ring-[var(--color-accent)] ${className}`}>
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

interface HistoryTableProps {
  sessions: CashierSession[];
  isDark: boolean;
  panelClass: string;
}

const HistoryTable: React.FC<HistoryTableProps> = ({ sessions, isDark, panelClass }) => (
  <div className={`rounded-panel border overflow-hidden ${panelClass}`}>
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-sm text-left min-w-[800px] border-collapse">
        <thead>
          <tr className={`text-xs font-medium text-muted border-b ${isDark ? 'border-[var(--color-border)] bg-elevated' : 'border-border-light bg-elevated-light'}`}>
            <th className="px-4 py-3">Abertura</th>
            <th className="px-4 py-3 text-right">Pedidos</th>
            <th className="px-4 py-3 text-right">Faturamento</th>
            <th className="px-4 py-3 text-right">Despesas</th>
            <th className="px-4 py-3 text-right">Saldo final</th>
            <th className="px-4 py-3 text-right">Quebra</th>
          </tr>
        </thead>
        <tbody className={isDark ? 'divide-y divide-[var(--color-border)]' : 'divide-y divide-border-light'}>
          {[...sessions].reverse().map((session, index) => {
            const breakdown = session.cashBreakdown;
            const hasBreakdown = breakdown !== undefined && breakdown !== null;
            return (
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
                <td className="px-4 py-4 text-right">
                  {hasBreakdown ? (
                    <span className={`px-3 py-1 rounded-full font-medium text-xs ${
                      breakdown === 0
                        ? 'bg-success/10 text-success'
                        : (breakdown ?? 0) > 0
                          ? 'bg-success/10 text-success'
                          : 'bg-danger/10 text-danger'
                    }`}>
                      {breakdown === 0 ? '✓' : `${(breakdown ?? 0) > 0 ? '+' : ''}R$ ${(breakdown ?? 0).toFixed(2)}`}
                    </span>
                  ) : (
                    <span className="text-muted text-xs">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);
