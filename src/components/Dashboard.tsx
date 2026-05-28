import React, { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import {
  Clock,
  Edit3,
  Package,
  Printer,
  Save,
  ShoppingBag,
  Table as TableIcon,
  Trash2,
  Trophy,
  TrendingUp,
  X,
  AlertTriangle,
  Tag,
  Calendar,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { SecurityGate } from './SecurityGate';
import { ReceiptModal } from './ReceiptModal';
import { buildEditedClosedOrder, getAttendanceRanking, resolveAttendanceName } from '../services/dashboardOrderTools';
import { Order, PaymentMethod } from '../types';

export const Dashboard: React.FC = () => {
  const { orders, tables, products, expenses, collaborators, stockItems, theme, updateOrder, deleteOrder } = useApp();
  const isDark = theme === 'dark';

  const closedOrders = useMemo(() => orders.filter(o => o.status === 'closed'), [orders]);
  const salesToday = useMemo(() => closedOrders.reduce((acc, o) => acc + o.total, 0), [closedOrders]);
  const totalOrders = closedOrders.length;
  const avgTicket = totalOrders > 0 ? salesToday / totalOrders : 0;
  const occupiedTables = useMemo(() => tables.filter(t => t.status !== 'livre').length, [tables]);
  const sortedOperators = useMemo(() => getAttendanceRanking(closedOrders, collaborators), [closedOrders, collaborators]);
  const expensesToday = useMemo(() => expenses.reduce((acc, e) => acc + e.amount, 0), [expenses]);
  const netProfit = salesToday - expensesToday;
  const openOrders = useMemo(() => orders.filter(o => o.status === 'open').length, [orders]);

  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [subtotalInput, setSubtotalInput] = useState('');
  const [serviceInput, setServiceInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('dinheiro');
  const [gateOpen, setGateOpen] = useState(false);
  const [gateTitle, setGateTitle] = useState('');
  const [onGateSuccess, setOnGateSuccess] = useState<() => void>(() => () => {});
  const [reprintOrder, setReprintOrder] = useState<Order | null>(null);

  const categorySales = useMemo(() => closedOrders.flatMap(o => o.items).reduce<Record<string, number>>((acc, item) => {
    acc[item.product.category] = (acc[item.product.category] || 0) + item.price * item.quantity;
    return acc;
  }, {}), [closedOrders]);

  const recentOrders = useMemo(() => [...closedOrders].reverse().slice(0, 6), [closedOrders]);

  const productSales = useMemo(() => closedOrders.flatMap(o => o.items).reduce((acc, item) => {
    if (!acc[item.product.id]) {
      acc[item.product.id] = { name: item.product.name, qty: 0, category: item.product.category };
    }
    acc[item.product.id].qty += item.quantity;
    return acc;
  }, {} as Record<string, { name: string; qty: number; category: string }>), [closedOrders]);

  const topProducts = useMemo(() => (Object.values(productSales) as Array<{ name: string; qty: number; category: string }>)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5), [productSales]);

  const expiringItems = useMemo(() => {
    const now = new Date();
    now.setHours(0,0,0,0);
    return stockItems
      .filter(item => item.expirationDate && item.currentStock > 0)
      .map(item => {
        const expDate = new Date(item.expirationDate!);
        const [year, month, day] = item.expirationDate!.split('-').map(Number);
        const localExpDate = new Date(year, month - 1, day);
        localExpDate.setHours(0,0,0,0);
        
        const diffTime = localExpDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let alertLevel = '';
        let tone: 'danger' | 'warning' | 'accent' | '' = '';
        let suggestPromotion = false;

        if (diffDays < 0) {
          alertLevel = 'Vencido';
          tone = 'danger';
        } else if (diffDays <= 3) {
          alertLevel = `Em ${diffDays} dias`;
          tone = 'danger';
          suggestPromotion = true;
        } else if (diffDays <= 7) {
          alertLevel = `Em ${diffDays} dias`;
          tone = 'warning';
        } else if (diffDays <= 15) {
          alertLevel = `Em ${diffDays} dias`;
          tone = 'accent';
        } else {
          return null;
        }
        return { ...item, diffDays, alertLevel, tone, suggestPromotion };
      })
      .filter((i): i is NonNullable<typeof i> => i !== null)
      .sort((a, b) => a.diffDays - b.diffDays);
  }, [stockItems]);

  const startEditOrder = (order: Order) => {
    setEditingOrder(order);
    setSubtotalInput(order.subtotal.toString().replace('.', ','));
    setServiceInput(order.serviceCharge.toString().replace('.', ','));
    setPaymentMethod(order.payments[0]?.method || 'dinheiro');
  };

  const parseMoney = (value: string) => parseFloat(value.replace(',', '.'));

  const handleSaveOrderEdit = () => {
    if (!editingOrder) return;
    const subtotal = parseMoney(subtotalInput);
    const serviceCharge = parseMoney(serviceInput);
    if (isNaN(subtotal) || subtotal < 0 || isNaN(serviceCharge) || serviceCharge < 0) return;
    setGateTitle('Autorizar Edição de Pedido');
    setOnGateSuccess(() => () => {
      updateOrder(buildEditedClosedOrder(editingOrder, subtotal, serviceCharge, paymentMethod));
      setEditingOrder(null);
    });
    setGateOpen(true);
  };

  const handleDeleteOrder = (order: Order, skipConfirm = false) => {
    if (!skipConfirm && !window.confirm(`Excluir o pedido #${order.id.slice(-6)} no valor de R$ ${order.total.toFixed(2)}?`)) return;
    setGateTitle('Autorizar Exclusão de Pedido');
    setOnGateSuccess(() => () => {
      deleteOrder(order.id);
      if (editingOrder?.id === order.id) setEditingOrder(null);
    });
    setGateOpen(true);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Data/Hora', 'Modo', 'Status', 'Total', 'Operador'];
    const rows = recentOrders.map(o => [
      o.id,
      new Date(o.timestamp).toLocaleString('pt-BR'),
      o.mode,
      o.status,
      o.total.toFixed(2).replace('.', ','),
      resolveAttendanceName(o.waiterId, collaborators)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pedidos_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const kpis = [
    { label: 'Vendas hoje', value: `R$ ${salesToday.toFixed(2)}`, icon: TrendingUp, tone: 'text-success', bg: 'bg-success/10', detail: `${totalOrders} fechados` },
    { label: 'Ticket médio', value: `R$ ${avgTicket.toFixed(2)}`, icon: ShoppingBag, tone: 'text-blue-500', bg: 'bg-blue-500/10', detail: 'Por pedido' },
    { label: 'Pedidos', value: totalOrders.toString(), icon: Clock, tone: 'text-accent', bg: 'bg-accent/10', detail: `${openOrders} abertos` },
    { label: 'Mesas ocupadas', value: occupiedTables.toString(), icon: TableIcon, tone: 'text-warning', bg: 'bg-warning/10', detail: `${occupiedTables}/${tables.length}` },
  ];

  const panelClass = isDark ? 'bg-surface border-border' : 'bg-surface-light border-border-light';
  const subtlePanelClass = isDark ? 'bg-elevated border-border' : 'bg-elevated-light border-border-light';

  return (
    <div className="space-y-5 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold leading-none">Visão Geral</h2>
          <p className="text-sm text-muted">Resumo operacional e métricas de desempenho</p>
        </div>
        <span className={`px-3 py-2 rounded-control text-xs font-medium border ${subtlePanelClass}`}>
          {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className={`p-5 rounded-panel border ${panelClass}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-panel ${kpi.bg}`}>
                <kpi.icon className={`w-5 h-5 ${kpi.tone}`} />
              </div>
              <span className={`text-xs font-medium ${kpi.label === 'Mesas ocupadas' ? 'text-muted' : 'text-success'}`}>{kpi.detail}</span>
            </div>
            <h3 className="text-xs font-medium text-muted mb-1">{kpi.label}</h3>
            <p className="text-2xl font-semibold">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      <div className={`p-4 rounded-panel border flex items-center justify-between text-sm ${panelClass}`}>
        <div className="flex gap-4">
          <span className="text-muted">Despesas do dia:</span>
          <span className="font-semibold text-danger">R$ {expensesToday.toFixed(2)}</span>
        </div>
        <div className="flex gap-4">
          <span className="text-muted">Lucro Líquido:</span>
          <span className="font-semibold text-success">R$ {netProfit.toFixed(2)}</span>
        </div>
      </div>

      {expiringItems.length > 0 && (
        <section className={`p-5 rounded-panel border ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-surface-light border-border-light shadow-2xl shadow-warning/10'}`}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-panel bg-warning/10 flex items-center justify-center text-warning">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-warning">Alertas de Vencimento</h3>
              <p className="text-xs font-medium text-muted">Insumos exigindo sua atenção nos próximos dias</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {expiringItems.map(item => (
              <div key={item.id} className={`p-4 rounded-panel border flex flex-col ${isDark ? 'bg-elevated border-[var(--color-border)]' : 'bg-elevated-light border-border-light'}`}>
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-sm max-w-[70%] truncate">{item.name}</h4>
                  <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider bg-${item.tone}/10 text-${item.tone}`}>
                    {item.alertLevel}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-muted mb-4">
                  <Package className="w-3.5 h-3.5" /> {item.currentStock.toFixed(2)} {item.unit}
                </div>
                {item.suggestPromotion && (
                  <div className={`mt-auto p-2.5 rounded-md text-xs font-bold flex items-center justify-center gap-2 border bg-${item.tone}/5 border-${item.tone}/20 text-${item.tone}`}>
                    <Tag className="w-3.5 h-3.5" /> Sugerir Promoção
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className={`p-5 rounded-panel border ${panelClass}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-sm">Vendas por categoria</h3>
            <div className="w-8 h-8 rounded-panel bg-accent/10 text-accent flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-5">
            {(Object.entries(categorySales) as Array<[string, number]>)
              .sort((a, b) => b[1] - a[1])
              .map(([category, value]) => {
                const pct = salesToday > 0 ? (value / salesToday) * 100 : 0;
                return (
                  <div key={category}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-muted">{category}</span>
                      <span className="font-semibold">R$ {value.toFixed(2)}</span>
                    </div>
                    <div className={`h-2 w-full rounded-full overflow-hidden ${isDark ? 'bg-elevated' : 'bg-elevated-light'}`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="h-full bg-accent"
                      />
                    </div>
                  </div>
                );
              })}
            {Object.keys(categorySales).length === 0 && (
              <EmptyState icon={ShoppingBag} title="Sem vendas hoje" description="As categorias aparecem quando pedidos forem fechados." />
            )}
          </div>
        </section>

        <section className={`p-5 rounded-panel border lg:col-span-2 ${panelClass}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-sm">Últimos pedidos</h3>
            <button onClick={handleExportCSV} className={`px-3 py-2 rounded-control text-sm font-medium border transition-colors ${subtlePanelClass}`}>
              Exportar
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className={`text-xs font-medium text-muted border-b ${isDark ? 'border-border' : 'border-border-light'}`}>
                  <th className="px-3 py-3">ID</th>
                  <th className="px-3 py-3">Hora</th>
                  <th className="px-3 py-3">Modo</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Valor</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-border' : 'divide-border-light'}`}>
                {recentOrders.map(order => (
                  <tr key={order.id} className={`group ${isDark ? 'hover:bg-elevated' : 'hover:bg-elevated-light'}`}>
                    <td className="px-3 py-3 text-muted">#{order.id.slice(-6)}</td>
                    <td className="px-3 py-3 font-medium">
                      {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.mode === 'mesa' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                        {order.mode}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center gap-2 ${order.status === 'closed' ? 'text-success' : 'text-warning'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${order.status === 'closed' ? 'bg-success' : 'bg-warning'}`} />
                        <span className="text-xs font-medium">{order.status === 'closed' ? 'Concluído' : 'Aberto'}</span>
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold">R$ {order.total.toFixed(2)}</td>
                    <td className="px-3 py-3">
                      {order.status === 'closed' && (
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEditOrder(order)} title="Editar"
                            className="w-7 h-7 rounded-control flex items-center justify-center text-accent hover:bg-accent/10 transition-all">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setReprintOrder(order)} title="Reimprimir"
                            className="w-7 h-7 rounded-control flex items-center justify-center text-muted hover:bg-accent/10 hover:text-accent transition-all">
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteOrder(order)} title="Excluir"
                            className="w-7 h-7 rounded-control flex items-center justify-center text-danger hover:bg-danger/10 transition-all">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentOrders.length === 0 && (
              <div className="py-12">
                <EmptyState icon={Clock} title="Nenhum pedido fechado hoje" description="Pedidos concluídos serão listados aqui." />
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className={`p-5 rounded-panel border ${panelClass}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-sm">Mais pedidos</h3>
            <div className="w-8 h-8 rounded-panel bg-warning/10 text-warning flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div key={product.name} className={`flex items-center justify-between p-3 rounded-panel ${isDark ? 'bg-elevated' : 'bg-elevated-light'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-panel flex items-center justify-center ${isDark ? 'bg-surface' : 'bg-surface-light'}`}>
                    <Package className="w-4 h-4 text-muted" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted">{product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-accent">{product.qty}</p>
                  <p className="text-xs text-muted">#{index + 1}</p>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && (
              <EmptyState icon={Trophy} title="Sem ranking ainda" description="O ranking aparece após as primeiras vendas." />
            )}
          </div>
        </section>

        <section className={`p-5 rounded-panel border ${panelClass}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-sm">Ranking / Atendimento</h3>
            <div className="w-8 h-8 rounded-panel bg-success/10 text-success flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-3">
            {sortedOperators.length > 0 ? (
              sortedOperators.map((operator, index) => (
                <div key={operator.name} className={`flex items-center justify-between p-3 rounded-panel ${isDark ? 'bg-elevated' : 'bg-elevated-light'}`}>
                  <div>
                    <p className="text-sm font-medium">{operator.name}</p>
                    <p className="text-xs text-muted">{operator.ordersCount} pedido(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-accent">R$ {operator.total.toFixed(2)}</p>
                    <p className="text-xs text-muted">#{index + 1}</p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState icon={Trophy} title="Sem atendimento fechado" description="O ranking aparece após os primeiros pedidos fechados." />
            )}
          </div>
        </section>
      </div>

      <SecurityGate isOpen={gateOpen} onClose={() => setGateOpen(false)} onSuccess={onGateSuccess} title={gateTitle} />

      {reprintOrder && (
        <ReceiptModal order={reprintOrder} onClose={() => setReprintOrder(null)} copyLabel="2ª VIA" />
      )}

      <AnimatePresence>
        {editingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className={`w-full max-w-lg overflow-hidden rounded-panel border shadow-2xl ${isDark ? 'bg-surface border-border' : 'bg-surface-light border-border-light'}`}
            >
              <div className="flex items-center justify-between border-b border-current/10 px-5 py-4">
                <div>
                  <h3 className="text-lg font-semibold">Editar Pedido</h3>
                  <p className="text-xs text-muted">#{editingOrder.id.slice(-6)} · {new Date(editingOrder.timestamp).toLocaleString('pt-BR')}</p>
                </div>
                <button onClick={() => setEditingOrder(null)}
                  className={`w-8 h-8 rounded-control flex items-center justify-center ${isDark ? 'bg-elevated hover:bg-border' : 'bg-elevated-light hover:bg-border-light'}`}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[{ label: 'Faturamento', value: subtotalInput, set: setSubtotalInput }, { label: 'Taxa de Serviço', value: serviceInput, set: setServiceInput }].map(f => (
                    <div key={f.label} className="space-y-1.5">
                      <label className="text-xs text-muted">{f.label}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted">R$</span>
                        <input type="text" value={f.value} onChange={e => f.set(e.target.value)}
                          className={`w-full h-10 pl-8 pr-3 rounded-control border outline-none text-sm font-medium ${isDark ? 'bg-elevated border-border focus:border-accent' : 'bg-elevated-light border-border-light focus:border-accent'}`} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted">Forma de Pagamento</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['dinheiro','credito','debito','pix','vr','va','voucher'] as PaymentMethod[]).map(m => (
                      <button key={m} onClick={() => setPaymentMethod(m)}
                        className={`h-9 rounded-control text-xs font-medium border transition-all ${paymentMethod === m ? 'border-accent bg-accent/10 text-accent' : isDark ? 'border-border bg-elevated' : 'border-border-light bg-elevated-light'}`}>
                        {m.charAt(0).toUpperCase() + m.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={`flex items-center justify-between rounded-control px-4 py-3 ${isDark ? 'bg-elevated' : 'bg-elevated-light'}`}>
                  <span className="text-xs text-muted">Total ajustado</span>
                  <span className="text-lg font-semibold text-accent">R$ {((parseMoney(subtotalInput) || 0) + (parseMoney(serviceInput) || 0)).toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleDeleteOrder(editingOrder, true)}
                    className="h-10 rounded-control bg-danger/10 text-danger text-xs font-medium flex items-center justify-center gap-2 hover:bg-danger/20 transition-all">
                    <Trash2 className="w-4 h-4" /> Excluir
                  </button>
                  <button onClick={handleSaveOrderEdit}
                    className="h-10 rounded-control bg-accent text-white text-xs font-medium flex items-center justify-center gap-2 hover:bg-accent-hover transition-all">
                    <Save className="w-4 h-4" /> Salvar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

type EmptyStateProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
};

const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center text-muted">
    <Icon className="w-10 h-10 mb-3" />
    <p className="text-sm font-medium text-current">{title}</p>
    <p className="text-xs mt-1 max-w-xs">{description}</p>
  </div>
);
