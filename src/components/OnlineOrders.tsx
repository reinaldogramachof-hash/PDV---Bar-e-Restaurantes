import React, { useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowDownUp, CheckCircle2, ChevronDown, Clock,
  Download, Filter, Package, ReceiptText, ShoppingBag, X, Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../store/AppContext';
import type { OnlineOrder, OnlineOrderChannel, OnlineOrderStatus } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'kanban' | 'lista' | 'historico';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const relTime = (iso: string) => {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'agora';
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  return `há ${h}h`;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

// ─── Kanban config ────────────────────────────────────────────────────────────

const KANBAN_COLS: { status: OnlineOrderStatus; label: string; accent: string }[] = [
  { status: 'recebido',   label: 'Recebido',    accent: 'text-warning' },
  { status: 'confirmado', label: 'Confirmado',  accent: 'text-accent' },
  { status: 'preparo',    label: 'Em Preparo',  accent: 'text-accent' },
  { status: 'pronto',     label: 'Pronto',      accent: 'text-success' },
  { status: 'entregue',   label: 'Entregue',    accent: 'text-success' },
];

const NEXT_STATUS: Partial<Record<OnlineOrderStatus, { status: OnlineOrderStatus; label: string; extra?: Partial<OnlineOrder> }>> = {
  recebido:   { status: 'confirmado', label: 'Confirmar',       extra: { confirmedAt: new Date().toISOString() } },
  confirmado: { status: 'preparo',    label: 'Iniciar Preparo' },
  preparo:    { status: 'pronto',     label: 'Marcar Pronto',   extra: { readyAt: new Date().toISOString() } },
  pronto:     { status: 'entregue',   label: 'Marcar Entregue', extra: { deliveredAt: new Date().toISOString() } },
};

const STATUS_BADGE: Record<OnlineOrderStatus, string> = {
  recebido:   'bg-warning/10 text-warning',
  confirmado: 'bg-accent/10 text-accent',
  preparo:    'bg-accent/10 text-accent',
  pronto:     'bg-success/10 text-success',
  entregue:   'bg-success/10 text-success',
  cancelado:  'bg-danger/10 text-danger',
};

const STATUS_LABEL: Record<OnlineOrderStatus, string> = {
  recebido: 'Recebido', confirmado: 'Confirmado', preparo: 'Em Preparo',
  pronto: 'Pronto', entregue: 'Entregue', cancelado: 'Cancelado',
};

const CHANNEL_ICON: Record<OnlineOrderChannel, React.ComponentType<{ className?: string }>> = {
  mesa: Package, delivery: ShoppingBag, balcao: ReceiptText,
};

const CHANNEL_LABEL: Record<OnlineOrderChannel, string> = {
  mesa: 'Mesa', delivery: 'Delivery', balcao: 'Balcão',
};

// ─── Cancel Modal ─────────────────────────────────────────────────────────────

interface CancelModalProps {
  order: OnlineOrder;
  onConfirm: (reason: string) => void;
  onClose: () => void;
  isDark: boolean;
  elevatedClass: string;
  panelClass: string;
}

const CancelModal: React.FC<CancelModalProps> = ({ order, onConfirm, onClose, isDark, elevatedClass, panelClass }) => {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-sm rounded-section border shadow-elevated ${panelClass}`}
      >
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-border' : 'border-border-light'}`}>
          <h3 className="text-sm font-semibold text-danger">Cancelar pedido</h3>
          <button onClick={onClose} className="text-muted"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-muted">Pedido de <strong className="text-text">{order.customerName}</strong></p>
          <div>
            <label className="block text-xs text-muted mb-1">Motivo do cancelamento</label>
            <textarea
              id="cancel-reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 rounded-control border text-sm resize-none ${elevatedClass}`}
              placeholder="Ex: Produto indisponível, cliente solicitou..."
            />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className={`flex-1 h-10 rounded-control border text-xs font-medium ${elevatedClass}`}>Voltar</button>
            <button
              id="confirm-cancel"
              onClick={() => onConfirm(reason)}
              disabled={!reason.trim()}
              className="flex-1 h-10 rounded-control bg-danger text-white text-xs font-medium disabled:opacity-40"
            >
              Cancelar pedido
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Order Card (Kanban) ──────────────────────────────────────────────────────

interface OrderCardProps {
  order: OnlineOrder;
  onAdvance?: () => void;
  onCancel: () => void;
  isDark: boolean;
  elevatedClass: string;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onAdvance, onCancel, isDark, elevatedClass }) => {
  const next = NEXT_STATUS[order.status];
  const ChannelIcon = CHANNEL_ICON[order.channel];
  const visibleItems = order.items.slice(0, 3);
  const extraCount = order.items.length - 3;

  return (
    <div className={`p-4 rounded-panel border ${elevatedClass}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-sm font-semibold leading-tight">{order.customerName}</p>
          <span className="inline-flex items-center gap-1 text-xs text-muted mt-0.5">
            <ChannelIcon className="w-3 h-3" />
            {CHANNEL_LABEL[order.channel]}
            {order.tableRef && ` — Mesa ${order.tableRef}`}
            {order.address && ` — ${order.address.slice(0, 20)}...`}
          </span>
        </div>
        <span className="text-xs font-medium text-muted flex items-center gap-1 shrink-0">
          <Clock className="w-3 h-3" />{relTime(order.createdAt)}
        </span>
      </div>

      <div className="space-y-0.5 mb-3">
        {visibleItems.map(item => (
          <p key={item.productId} className="text-xs text-muted">
            {item.qty}x {item.name}
          </p>
        ))}
        {extraCount > 0 && <p className="text-xs text-muted">e mais {extraCount} item{extraCount > 1 ? 's' : ''}</p>}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{fmtBRL(order.total)}</span>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className={`h-7 w-7 flex items-center justify-center rounded-control border hover:border-danger hover:text-danger transition-colors ${elevatedClass}`}
            title="Cancelar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          {next && (
            <button
              onClick={onAdvance}
              className="h-7 px-3 rounded-control bg-accent text-white text-xs font-medium hover:bg-accent-hover transition-colors"
            >
              {next.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── KPI Tile ─────────────────────────────────────────────────────────────────

interface KpiProps { label: string; value: string; icon: React.ComponentType<{ className?: string }>; tone: string; bg: string; panelClass: string }

const KpiTile: React.FC<KpiProps> = ({ label, value, icon: Icon, tone, bg, panelClass }) => (
  <section className={`p-5 rounded-panel border flex items-center gap-4 ${panelClass}`}>
    <div className={`w-10 h-10 rounded-panel flex items-center justify-center ${bg}`}>
      <Icon className={`w-5 h-5 ${tone}`} />
    </div>
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  </section>
);

// ─── Export CSV ───────────────────────────────────────────────────────────────

const exportCSV = (orders: OnlineOrder[]) => {
  const header = 'ID,Cliente,Canal,Total,Status,Criado em\n';
  const rows = orders.map(o =>
    `${o.id},"${o.customerName}",${o.channel},${o.total},${o.status},"${fmtDate(o.createdAt)}"`
  ).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'pedidos-online.csv'; a.click();
  URL.revokeObjectURL(url);
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const OnlineOrders: React.FC = () => {
  const {
    onlineOrders, updateOnlineOrderStatus, cancelOnlineOrder, theme,
  } = useApp();

  const isDark = theme === 'dark';
  const panelClass = isDark ? 'bg-surface border-border' : 'bg-surface-light border-border-light';
  const elevatedClass = isDark ? 'bg-elevated border-border' : 'bg-elevated-light border-border-light';

  const [activeTab, setActiveTab] = useState<Tab>('kanban');
  const [cancelTarget, setCancelTarget] = useState<OnlineOrder | null>(null);

  // Filters (lista tab)
  const [filterStatus, setFilterStatus] = useState<OnlineOrderStatus | 'todos'>('todos');
  const [filterChannel, setFilterChannel] = useState<OnlineOrderChannel | 'todos'>('todos');

  const today = new Date().toDateString();

  const todayOrders = useMemo(
    () => onlineOrders.filter(o => new Date(o.createdAt).toDateString() === today),
    [onlineOrders, today]
  );

  const openOrders = useMemo(
    () => onlineOrders.filter(o => !['entregue', 'cancelado'].includes(o.status)),
    [onlineOrders]
  );

  const todayRevenue = useMemo(
    () => todayOrders.filter(o => o.status === 'entregue').reduce((acc, o) => acc + o.total, 0),
    [todayOrders]
  );

  const filteredList = useMemo(() => {
    return onlineOrders.filter(o => {
      if (['historico'].includes(activeTab) && !['entregue', 'cancelado'].includes(o.status)) return false;
      if (activeTab === 'lista' && ['entregue', 'cancelado'].includes(o.status)) return false;
      if (filterStatus !== 'todos' && o.status !== filterStatus) return false;
      if (filterChannel !== 'todos' && o.channel !== filterChannel) return false;
      return true;
    });
  }, [onlineOrders, activeTab, filterStatus, filterChannel]);

  const histOrders = useMemo(
    () => onlineOrders.filter(o => ['entregue', 'cancelado'].includes(o.status)),
    [onlineOrders]
  );

  const histRevenue = histOrders.filter(o => o.status === 'entregue').reduce((acc, o) => acc + o.total, 0);
  const avgTicket = histOrders.filter(o => o.status === 'entregue').length > 0
    ? histRevenue / histOrders.filter(o => o.status === 'entregue').length
    : 0;
  const cancelPct = histOrders.length > 0
    ? Math.round((histOrders.filter(o => o.status === 'cancelado').length / histOrders.length) * 100)
    : 0;

  const handleAdvance = (order: OnlineOrder) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    updateOnlineOrderStatus(order.id, next.status, {
      ...next.extra,
      [next.status === 'confirmado' ? 'confirmedAt' :
       next.status === 'pronto' ? 'readyAt' :
       next.status === 'entregue' ? 'deliveredAt' : '']: new Date().toISOString(),
    });
  };

  const handleCancel = (reason: string) => {
    if (!cancelTarget) return;
    cancelOnlineOrder(cancelTarget.id, reason);
    setCancelTarget(null);
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: 'kanban', label: 'Kanban' },
    { id: 'lista', label: 'Lista' },
    { id: 'historico', label: 'Histórico' },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-500 pb-12 max-w-full">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">Pedidos Online</h2>
            <span className="inline-flex items-center gap-1.5 h-6 px-3 rounded-full bg-warning/10 text-warning text-[10px] font-semibold border border-warning/20">
              <Zap className="w-3 h-3" />Fase 3 Ready
            </span>
          </div>
          <p className="text-xs text-muted">Central de pedidos recebidos via cardápio digital</p>
        </div>
        {/* Tab bar */}
        <div className={`flex items-center gap-1 p-1 rounded-panel border ${elevatedClass}`}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`h-8 px-4 rounded-control text-xs font-medium transition-all ${
                activeTab === tab.id ? 'bg-accent text-white' : 'text-muted hover:text-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiTile label="Total hoje" value={String(todayOrders.length)} icon={ShoppingBag} tone="text-accent" bg="bg-accent/10" panelClass={panelClass} />
        <KpiTile label="Em aberto" value={String(openOrders.length)} icon={Clock} tone="text-warning" bg="bg-warning/10" panelClass={panelClass} />
        <KpiTile label="Faturamento do dia" value={fmtBRL(todayRevenue)} icon={ReceiptText} tone="text-success" bg="bg-success/10" panelClass={panelClass} />
      </div>

      {/* ── Tab: Kanban ──────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === 'kanban' && (
          <motion.div
            key="kanban"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {onlineOrders.filter(o => !['entregue', 'cancelado'].includes(o.status)).length === 0 ? (
              <EmptyState message="Nenhum pedido em aberto no momento." />
            ) : (
              <div className="overflow-x-auto pb-2">
                <div className="flex gap-4 min-w-max">
                  {KANBAN_COLS.map(col => {
                    const colOrders = onlineOrders.filter(o => o.status === col.status);
                    return (
                      <div key={col.status} className="w-72 shrink-0">
                        <div className="flex items-center gap-2 mb-3 px-1">
                          <span className={`text-xs font-semibold ${col.accent}`}>{col.label}</span>
                          <span className={`text-xs rounded-full px-1.5 py-0.5 font-medium ${isDark ? 'bg-elevated text-muted' : 'bg-elevated-light text-muted'}`}>
                            {colOrders.length}
                          </span>
                        </div>
                        <div className="space-y-3">
                          {colOrders.map(order => (
                            <OrderCard
                              key={order.id}
                              order={order}
                              onAdvance={() => handleAdvance(order)}
                              onCancel={() => setCancelTarget(order)}
                              isDark={isDark}
                              elevatedClass={elevatedClass}
                            />
                          ))}
                          {colOrders.length === 0 && (
                            <div className={`h-20 rounded-panel border border-dashed flex items-center justify-center text-xs text-muted ${isDark ? 'border-border' : 'border-border-light'}`}>
                              Vazio
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Tab: Lista ──────────────────────────────────────────────────────── */}
        {activeTab === 'lista' && (
          <motion.div key="lista" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <section className={`rounded-section border ${panelClass}`}>
              <div className={`flex flex-wrap items-center gap-3 px-5 py-4 border-b ${isDark ? 'border-border' : 'border-border-light'}`}>
                <Filter className="w-3.5 h-3.5 text-muted" />
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value as OnlineOrderStatus | 'todos')}
                  className={`h-8 px-3 rounded-control border text-xs ${elevatedClass}`}
                >
                  <option value="todos">Todos status</option>
                  {(Object.keys(STATUS_LABEL) as OnlineOrderStatus[]).map(s => (
                    <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                  ))}
                </select>
                <select
                  value={filterChannel}
                  onChange={e => setFilterChannel(e.target.value as OnlineOrderChannel | 'todos')}
                  className={`h-8 px-3 rounded-control border text-xs ${elevatedClass}`}
                >
                  <option value="todos">Todos canais</option>
                  <option value="mesa">Mesa</option>
                  <option value="delivery">Delivery</option>
                  <option value="balcao">Balcão</option>
                </select>
                <button
                  onClick={() => exportCSV(filteredList)}
                  className={`ml-auto h-8 px-3 rounded-control border text-xs font-medium flex items-center gap-1.5 ${elevatedClass}`}
                >
                  <Download className="w-3.5 h-3.5" /> Exportar CSV
                </button>
              </div>
              <OrderTable
                orders={filteredList}
                onAdvance={handleAdvance}
                onCancel={setCancelTarget}
                isDark={isDark}
                elevatedClass={elevatedClass}
              />
            </section>
          </motion.div>
        )}

        {/* ── Tab: Histórico ───────────────────────────────────────────────────── */}
        {activeTab === 'historico' && (
          <motion.div key="historico" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
            {/* Sumário */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                { label: 'Total pedidos', value: String(histOrders.length) },
                { label: 'Faturamento', value: fmtBRL(histRevenue) },
                { label: 'Ticket médio', value: fmtBRL(avgTicket) },
                { label: 'Taxa cancelamento', value: `${cancelPct}%` },
              ].map(kpi => (
                <div key={kpi.label} className={`p-4 rounded-panel border ${panelClass}`}>
                  <p className="text-xs text-muted mb-1">{kpi.label}</p>
                  <p className="text-lg font-semibold">{kpi.value}</p>
                </div>
              ))}
            </div>
            <section className={`rounded-section border ${panelClass}`}>
              <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-border' : 'border-border-light'}`}>
                <h3 className="text-sm font-semibold">Pedidos concluídos e cancelados</h3>
                <button
                  onClick={() => exportCSV(histOrders)}
                  className={`h-8 px-3 rounded-control border text-xs font-medium flex items-center gap-1.5 ${elevatedClass}`}
                >
                  <Download className="w-3.5 h-3.5" /> Exportar CSV
                </button>
              </div>
              <OrderTable
                orders={histOrders}
                onAdvance={handleAdvance}
                onCancel={setCancelTarget}
                isDark={isDark}
                elevatedClass={elevatedClass}
                readOnly
              />
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Painel Fase 3 ──────────────────────────────────────────────────────── */}
      <section className={`rounded-panel border-2 border-accent/30 p-5 flex gap-4 items-start ${isDark ? 'bg-accent/5' : 'bg-accent/5'}`}>
        <div className="w-9 h-9 rounded-panel bg-accent/10 flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-accent" />
        </div>
        <div>
          <p className="text-sm font-semibold text-accent">Realtime na Fase 3</p>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            Hoje os pedidos chegam via WhatsApp. Na Fase 3 (Supabase), pedidos aparecem aqui automaticamente
            em menos de 1 segundo, sem recarregar a página.
          </p>
        </div>
      </section>

      {/* Cancel Modal */}
      <AnimatePresence>
        {cancelTarget && (
          <CancelModal
            order={cancelTarget}
            onConfirm={handleCancel}
            onClose={() => setCancelTarget(null)}
            isDark={isDark}
            elevatedClass={elevatedClass}
            panelClass={panelClass}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Order Table ──────────────────────────────────────────────────────────────

interface OrderTableProps {
  orders: OnlineOrder[];
  onAdvance: (o: OnlineOrder) => void;
  onCancel: (o: OnlineOrder) => void;
  isDark: boolean;
  elevatedClass: string;
  readOnly?: boolean;
}

const OrderTable: React.FC<OrderTableProps> = ({ orders, onAdvance, onCancel, isDark, elevatedClass, readOnly }) => {
  if (orders.length === 0) {
    return <EmptyState message="Nenhum pedido encontrado." />;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead>
          <tr className={`border-b text-xs font-medium text-muted ${isDark ? 'border-border' : 'border-border-light'}`}>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Canal</th>
            <th className="px-4 py-3">Itens</th>
            <th className="px-4 py-3">Total</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Horário</th>
            {!readOnly && <th className="px-4 py-3 text-right">Ações</th>}
          </tr>
        </thead>
        <tbody className={`divide-y ${isDark ? 'divide-border' : 'divide-border-light'}`}>
          {orders.map(order => {
            const next = NEXT_STATUS[order.status];
            const ChannelIcon = CHANNEL_ICON[order.channel];
            return (
              <tr key={order.id} className={isDark ? 'hover:bg-elevated' : 'hover:bg-elevated-light'}>
                <td className="px-4 py-3 font-medium">{order.customerName}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-xs text-muted">
                    <ChannelIcon className="w-3 h-3 text-accent" />
                    {CHANNEL_LABEL[order.channel]}
                    {order.tableRef && ` ${order.tableRef}`}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted max-w-[180px] truncate">
                  {order.items.map(i => `${i.qty}x ${i.name}`).join(', ')}
                </td>
                <td className="px-4 py-3 font-semibold">{fmtBRL(order.total)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[order.status]}`}>
                    {STATUS_LABEL[order.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted">{fmtDate(order.createdAt)}</td>
                {!readOnly && (
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => onCancel(order)}
                        className="h-7 w-7 flex items-center justify-center rounded-control border text-muted hover:text-danger hover:border-danger transition-colors"
                        title="Cancelar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      {next && (
                        <button
                          onClick={() => onAdvance(order)}
                          className="h-7 px-3 rounded-control bg-accent text-white text-xs font-medium hover:bg-accent-hover"
                        >
                          {next.label}
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="py-20 text-center">
    <ShoppingBag className="w-10 h-10 mx-auto mb-3 text-muted opacity-40" />
    <p className="text-sm text-muted">{message}</p>
  </div>
);
