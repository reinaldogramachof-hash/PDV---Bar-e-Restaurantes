import React, { useEffect, useMemo, useState } from 'react';
import {
  Bike,
  Calendar,
  CheckCircle2,
  Download,
  Edit2,
  MapPin,
  Plus,
  ShieldAlert,
  Timer,
  Truck,
  UserRound,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { DeliveryOrder, Entregador, PaymentMethod } from '../types';
import { useApp } from '../store/AppContext';
import { calcDeliveryFinancials, calcEntregadorRepasseRows, syncToReports } from '../services/deliveryService';
import { SecurityGate } from './SecurityGate';
import { useIFoodOrders } from '../hooks/useIFoodOrders';

type Tab = 'fila' | 'novo' | 'entregadores' | 'financeiro' | 'ifood';
type Period = 'hoje' | 'semana' | 'mes';
type DeliveryItemDraft = { name: string; qty: number; price: number };

const statusColumns: Array<{ id: DeliveryOrder['status']; label: string }> = [
  { id: 'recebido', label: 'Recebido' },
  { id: 'preparo', label: 'Preparo' },
  { id: 'rota', label: 'Saiu para Entrega' },
  { id: 'entregue', label: 'Entregue' },
  { id: 'cancelado', label: 'Cancelado' },
];

const deliveryPaymentMethods: PaymentMethod[] = ['dinheiro', 'pix', 'credito', 'debito'];

const paymentLabels: Record<PaymentMethod, string> = {
  dinheiro: 'Dinheiro',
  pix: 'Pix',
  credito: 'Cartao credito',
  debito: 'Cartao debito',
  vr: 'VR',
  va: 'VA',
  voucher: 'Voucher',
};

const vehicleLabels: Record<Entregador['vehicle'], string> = {
  moto: 'Moto',
  bike: 'Bike',
  carro: 'Carro',
  a_pe: 'A pe',
};

const statusLabels: Record<Entregador['status'], string> = {
  disponivel: 'Disponivel',
  em_rota: 'Em rota',
  inativo: 'Inativo',
};

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const columnAccent: Record<DeliveryOrder['status'], string> = {
  recebido: 'var(--color-accent)',
  preparo: 'var(--color-accent)',
  rota: 'var(--color-warning)',
  entregue: 'var(--color-success)',
  cancelado: 'var(--color-danger)',
};

const cancelReasonOptions = [
  'Cliente desistiu',
  'Endereco nao encontrado',
  'Sem entregador disponivel',
  'Problema na cozinha',
  'Outro',
] as const;

const downloadCSV = (filename: string, rows: string[][]) => {
  const bom = '\uFEFF';
  const content = bom + rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(';')).join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const getElapsedLabel = (createdAt: string, nowMs: number) => {
  const diff = Math.max(0, nowMs - new Date(createdAt).getTime());
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}min`;
  return `${minutes}min`;
};

const isInPeriod = (dateValue: string, period: Period) => {
  const now = new Date();
  const date = new Date(dateValue);
  if (period === 'hoje') return date.toDateString() === now.toDateString();
  if (period === 'semana') {
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    return date >= weekAgo;
  }
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
};

const isOrderDelayed = (order: DeliveryOrder, nowMs: number) => {
  if (order.status === 'recebido' || order.status === 'preparo') {
    return nowMs - new Date(order.createdAt).getTime() > 30 * 60000;
  }
  if (order.status === 'rota') {
    return nowMs - new Date(order.createdAt).getTime() > 15 * 60000;
  }
  return false;
};

const getIFoodCountdownLabel = (createdAt: string, nowMs: number) => {
  const remainingMs = 8 * 60 * 1000 - (nowMs - new Date(createdAt).getTime());
  if (remainingMs <= 0) return { label: 'Expirado', expired: true };
  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  return { label: `${minutes}:${String(seconds).padStart(2, '0')}`, expired: false };
};

const repasseModelLabel = (repasseType?: Entregador['repasseType']) => {
  if (repasseType === 'por_entrega') return 'Por entrega';
  if (repasseType === 'fixo_diario') return 'Diária fixa';
  return '—';
};

const emptyEntregador = (empresaId: string): Entregador => ({
  id: '',
  empresaId,
  name: '',
  phone: '',
  vehicle: 'moto',
  status: 'disponivel',
  repasseType: undefined,
  repasseValue: undefined,
  createdAt: new Date().toISOString(),
});

export const Delivery: React.FC = () => {
  const {
    currentEmpresa,
    theme,
    deliveryOrders,
    entregadores,
    addDeliveryOrder,
    updateDeliveryOrder,
    addEntregador,
    updateEntregador,
  } = useApp();
  const {
    orders: ifoodOrders,
    loading: ifoodLoading,
    error: ifoodError,
    config: ifoodConfig,
    confirm: confirmIFood,
    reject: rejectIFood,
    dispatch: dispatchIFood,
    confirmPickup: confirmIFoodPickup,
    refresh: refreshIFood,
  } = useIFoodOrders();
  const isDark = theme === 'dark';
  const panelClass = isDark ? 'bg-surface border-border' : 'bg-surface-light border-border-light';
  const mutedPanelClass = isDark ? 'bg-elevated border-border' : 'bg-elevated-light border-border-light';

  const [activeTab, setActiveTab] = useState<Tab>('fila');
  const [nowMs, setNowMs] = useState(Date.now());
  const [period, setPeriod] = useState<Period>('hoje');
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [customCancelReason, setCustomCancelReason] = useState('');
  const [cancelSecurityOpen, setCancelSecurityOpen] = useState(false);
  const [entregadorModalOpen, setEntregadorModalOpen] = useState(false);
  const [editingEntregador, setEditingEntregador] = useState<Entregador>(() => emptyEntregador(currentEmpresa.id));
  const [showOnlyIFoodTests, setShowOnlyIFoodTests] = useState(false);
  const [pickupValidationOrderId, setPickupValidationOrderId] = useState<string | null>(null);
  const [pickupValidationInput, setPickupValidationInput] = useState('');
  const [pickupValidationError, setPickupValidationError] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<DeliveryItemDraft[]>([{ name: '', qty: 1, price: 0 }]);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const mergedDeliveryOrders = useMemo(() => {
    const manualOrders = deliveryOrders.map(order => ({
      ...order,
      sourcePlatform: order.sourcePlatform || 'manual',
    }));

    const byId = new Map<string, DeliveryOrder>();
    manualOrders.forEach(order => byId.set(order.id, order));
    ifoodOrders.forEach(order => byId.set(order.id, order));

    return Array.from(byId.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [deliveryOrders, ifoodOrders]);

  const queueOrders = useMemo(() => {
    if (!showOnlyIFoodTests) return mergedDeliveryOrders;
    return mergedDeliveryOrders.filter(order => order.sourcePlatform === 'ifood' && order.isTest);
  }, [mergedDeliveryOrders, showOnlyIFoodTests]);

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + Number(item.qty || 0) * Number(item.price || 0), 0),
    [items],
  );
  const total = Math.max(0, subtotal + Number(deliveryFee || 0) - Number(discount || 0));

  const availableEntregadores = entregadores.filter(entregador => entregador.status === 'disponivel');
  const deliveredOrders = useMemo(() => syncToReports(mergedDeliveryOrders), [mergedDeliveryOrders]);
  const filteredDeliveredOrders = useMemo(
    () => deliveredOrders.filter(order => isInPeriod(order.deliveredAt || order.createdAt, period)),
    [deliveredOrders, period],
  );
  const deliveryFinancials = useMemo(() => calcDeliveryFinancials(
    mergedDeliveryOrders.filter(order => isInPeriod(order.deliveredAt || order.createdAt, period)),
  ), [mergedDeliveryOrders, period]);
  const entregadorRepasse = useMemo(
    () => calcEntregadorRepasseRows(
      mergedDeliveryOrders.filter(order => isInPeriod(order.deliveredAt || order.createdAt, period)),
      entregadores,
    ),
    [mergedDeliveryOrders, entregadores, period],
  );

  const createOrder = (event: React.FormEvent) => {
    event.preventDefault();
    const validItems = items
      .filter(item => item.name.trim() && Number(item.qty) > 0 && Number(item.price) >= 0)
      .map(item => ({ name: item.name.trim(), qty: Number(item.qty), price: Number(item.price) }));

    if (!customerName.trim() || !phone.trim() || !address.trim() || !neighborhood.trim() || validItems.length === 0) return;

    const order: DeliveryOrder = {
      id: `del-${Date.now()}`,
      empresaId: currentEmpresa.id,
      customerName: customerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      neighborhood: neighborhood.trim(),
      items: validItems,
      subtotal,
      deliveryFee: Number(deliveryFee || 0),
      discount: Number(discount || 0),
      total,
      paymentMethod,
      status: 'recebido',
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    addDeliveryOrder(order);
    setCustomerName('');
    setPhone('');
    setAddress('');
    setNeighborhood('');
    setNotes('');
    setItems([{ name: '', qty: 1, price: 0 }]);
    setDeliveryFee(0);
    setDiscount(0);
    setPaymentMethod('pix');
    setActiveTab('fila');
  };

  const advanceOrder = (order: DeliveryOrder) => {
    const transitions: Record<string, DeliveryOrder['status'] | undefined> = {
      recebido: 'preparo',
      preparo: 'rota',
      rota: 'entregue',
    };
    const nextStatus = transitions[order.status];
    if (!nextStatus) return;

    const updatedOrder: DeliveryOrder = {
      ...order,
      status: nextStatus,
      dispatchedAt: nextStatus === 'rota' ? new Date().toISOString() : order.dispatchedAt,
      deliveredAt: nextStatus === 'entregue' ? new Date().toISOString() : order.deliveredAt,
    };
    updateDeliveryOrder(updatedOrder);

    if (nextStatus === 'entregue' && order.entregadorId) {
      const entregador = entregadores.find(item => item.id === order.entregadorId);
      if (entregador) updateEntregador({ ...entregador, status: 'disponivel' });
    }
  };

  const assignEntregador = (order: DeliveryOrder, entregadorId: string) => {
    const previous = entregadores.find(entregador => entregador.id === order.entregadorId);
    if (previous && previous.id !== entregadorId) updateEntregador({ ...previous, status: 'disponivel' });

    const next = entregadores.find(entregador => entregador.id === entregadorId);
    if (next) updateEntregador({ ...next, status: 'em_rota' });
    updateDeliveryOrder({ ...order, entregadorId: entregadorId || undefined });
  };

  const confirmCancel = () => {
    if (!cancelTargetId) return;
    const order = mergedDeliveryOrders.find(item => item.id === cancelTargetId);
    const resolvedReason = cancelReason === 'Outro' ? customCancelReason.trim() : cancelReason;
    if (!order || !resolvedReason) return;
    if (order.sourcePlatform === 'ifood') {
      void rejectIFood(order.id, resolvedReason);
      setCancelSecurityOpen(false);
      setCancelTargetId(null);
      setCancelReason('');
      setCustomCancelReason('');
      return;
    }
    if (order?.entregadorId) {
      const entregador = entregadores.find(item => item.id === order.entregadorId);
      if (entregador) updateEntregador({ ...entregador, status: 'disponivel' });
    }
    updateDeliveryOrder({
      ...order,
      status: 'cancelado',
      cancelReason: resolvedReason,
    });
    setCancelSecurityOpen(false);
    setCancelTargetId(null);
    setCancelReason('');
    setCustomCancelReason('');
  };

  const openEntregadorModal = (entregador?: Entregador) => {
    setEditingEntregador(entregador || emptyEntregador(currentEmpresa.id));
    setEntregadorModalOpen(true);
  };

  const saveEntregador = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingEntregador.name.trim() || !editingEntregador.phone.trim()) return;
    const payload = {
      ...editingEntregador,
      id: editingEntregador.id || `ent-${Date.now()}`,
      empresaId: currentEmpresa.id,
      name: editingEntregador.name.trim(),
      phone: editingEntregador.phone.trim(),
      repasseValue: typeof editingEntregador.repasseValue === 'number' && !Number.isNaN(editingEntregador.repasseValue)
        ? editingEntregador.repasseValue
        : undefined,
      createdAt: editingEntregador.createdAt || new Date().toISOString(),
    };
    if (editingEntregador.id) updateEntregador(payload);
    else addEntregador(payload);
    setEntregadorModalOpen(false);
  };

  const toggleEntregadorStatus = (entregador: Entregador) => {
    const nextStatus: Record<Entregador['status'], Entregador['status']> = {
      disponivel: 'em_rota',
      em_rota: 'inativo',
      inativo: 'disponivel',
    };
    updateEntregador({ ...entregador, status: nextStatus[entregador.status] });
  };

  const openCancelFlow = (orderId: string) => {
    setCancelTargetId(orderId);
    setCancelReason('');
    setCustomCancelReason('');
    setCancelSecurityOpen(false);
  };

  const closeCancelFlow = () => {
    setCancelTargetId(null);
    setCancelReason('');
    setCustomCancelReason('');
    setCancelSecurityOpen(false);
  };

  const submitCancelReason = () => {
    const resolvedReason = cancelReason === 'Outro' ? customCancelReason.trim() : cancelReason;
    if (!resolvedReason) return;
    setCancelSecurityOpen(true);
  };

  const updateItem = (index: number, patch: Partial<DeliveryItemDraft>) => {
    setItems(prev => prev.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  };

  const openPickupValidation = (orderId: string) => {
    setPickupValidationOrderId(orderId);
    setPickupValidationInput('');
    setPickupValidationError(null);
  };

  const closePickupValidation = () => {
    setPickupValidationOrderId(null);
    setPickupValidationInput('');
    setPickupValidationError(null);
  };

  const submitPickupValidation = async () => {
    if (!pickupValidationOrderId) return;
    const targetOrder = mergedDeliveryOrders.find(order => order.id === pickupValidationOrderId);
    if (!targetOrder || !targetOrder.pickupCode) return;

    if (pickupValidationInput.trim() !== targetOrder.pickupCode.trim()) {
      setPickupValidationError('Código incorreto. Verifique com o cliente.');
      return;
    }

    await confirmIFoodPickup(targetOrder.id);
    closePickupValidation();
  };

  const exportFinancialCSV = () => {
    const rows = filteredDeliveredOrders.map(order => {
      const entregador = entregadores.find(item => item.id === order.entregadorId);
      return [
        new Date(order.deliveredAt || order.createdAt).toLocaleString('pt-BR'),
        order.customerName,
        paymentLabels[order.paymentMethod],
        money(order.total),
        entregador?.name || '-',
      ];
    });
    downloadCSV(`delivery_${period}.csv`, [['Data', 'Cliente', 'Pagamento', 'Valor', 'Entregador'], ...rows]);
  };

  const statusBadgeClass = (status: Entregador['status']) => {
    if (status === 'disponivel') return 'bg-success/10 text-success border-success/20';
    if (status === 'em_rota') return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-danger/10 text-danger border-danger/20';
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Delivery</h2>
          <p className="text-xs text-muted mt-1">Fila, entregadores e financeiro de entregas.</p>
        </div>
        <div className={`flex w-full overflow-x-auto p-1 gap-1 rounded-panel border lg:w-fit ${mutedPanelClass}`}>
          {([
            ['fila', 'Fila'],
            ['novo', 'Novo Pedido'],
            ['entregadores', 'Entregadores'],
            ['financeiro', 'Financeiro Delivery'],
            ['ifood', 'iFood'],
          ] as Array<[Tab, string]>).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`whitespace-nowrap px-3 py-2 rounded-control text-xs font-medium transition-all ${activeTab === id ? 'bg-accent text-white' : 'text-muted hover:text-current'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'ifood' && (
        <section className={`rounded-panel border p-5 space-y-4 ${panelClass}`}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-control bg-[#EA1D2C] text-white flex items-center justify-center text-sm font-semibold">
              iF
            </div>
            <div>
              <h3 className="text-sm font-semibold">Integração iFood</h3>
              <p className="text-xs text-muted">Configuração operacional do hub de delivery.</p>
            </div>
            <span className={`ml-auto px-2 py-1 rounded-full border text-[11px] font-semibold ${
              ifoodConfig.status === 'connected'
                ? 'bg-success/10 text-success border-success/30'
                : ifoodConfig.status === 'error'
                  ? 'bg-danger/10 text-danger border-danger/30'
                  : 'bg-warning/10 text-warning border-warning/30'
            }`}>
              {ifoodConfig.status === 'connected' ? 'Conectado' : ifoodConfig.status === 'error' ? 'Erro' : 'Em desenvolvimento'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className="text-xs text-muted">Merchant ID</span>
              <input value={ifoodConfig.merchantId} readOnly className={`w-full h-10 px-3 rounded-control border bg-transparent text-sm ${isDark ? 'border-border' : 'border-border-light'}`} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-muted">Merchant UUID</span>
              <input value={ifoodConfig.merchantUuid} readOnly className={`w-full h-10 px-3 rounded-control border bg-transparent text-sm ${isDark ? 'border-border' : 'border-border-light'}`} />
            </label>
          </div>

          <div className={`rounded-panel border p-3 text-xs ${mutedPanelClass}`}>
            Credenciais de produção serão liberadas após homologação iFood. Pedidos de teste já estão sendo simulados.
          </div>

          {ifoodError && (
            <p className="text-xs text-danger">Falha na sincronização iFood: {ifoodError}</p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setShowOnlyIFoodTests(true);
                setActiveTab('fila');
              }}
              className="h-9 px-3 rounded-control bg-accent text-white text-xs font-medium"
            >
              Ver pedidos de teste
            </button>
            <button
              onClick={() => void refreshIFood()}
              className={`h-9 px-3 rounded-control border text-xs font-medium ${isDark ? 'border-border' : 'border-border-light'}`}
            >
              {ifoodLoading ? 'Sincronizando...' : 'Sincronizar agora'}
            </button>
          </div>
        </section>
      )}

      {activeTab === 'fila' && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-muted">
              {showOnlyIFoodTests ? 'Mostrando somente pedidos iFood de teste.' : 'Mostrando todos os pedidos de delivery.'}
            </div>
            <button
              onClick={() => setShowOnlyIFoodTests(prev => !prev)}
              className={`h-8 px-3 rounded-control border text-xs font-medium ${isDark ? 'border-border' : 'border-border-light'}`}
            >
              {showOnlyIFoodTests ? 'Ver todos os pedidos' : 'Filtrar pedidos de teste iFood'}
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {statusColumns.map(column => {
            const columnOrders = queueOrders.filter(order => order.status === column.id);
            return (
              <div key={column.id} className={`rounded-panel border border-t-2 min-h-[420px] ${panelClass}`} style={{ borderTopColor: columnAccent[column.id] }}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-current/10">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: columnAccent[column.id] }} />
                    <h3 className="text-sm font-semibold">{column.label}</h3>
                  </div>
                  <span className="text-xs text-muted tabular-nums">{columnOrders.length}</span>
                </div>
                <div className="p-3 space-y-3">
                  {columnOrders.length === 0 && (
                    <div className="py-12 text-center text-xs text-muted">Sem pedidos nesta etapa</div>
                  )}
                  {columnOrders.map(order => {
                    const assigned = entregadores.find(entregador => entregador.id === order.entregadorId);
                    const assignable = [...availableEntregadores, ...(assigned ? [assigned] : [])]
                      .filter((item, index, array) => array.findIndex(current => current.id === item.id) === index);
                    const delayed = isOrderDelayed(order, nowMs);
                    const isIFood = order.sourcePlatform === 'ifood';
                    const isIFoodTakeout = isIFood && Boolean(order.pickupCode);
                    const ifoodCountdown = isIFood && order.status === 'recebido'
                      ? getIFoodCountdownLabel(order.createdAt, nowMs)
                      : null;
                    const canMutateOrder = order.status !== 'entregue' && order.status !== 'cancelado';
                    return (
                      <article key={order.id} className={`rounded-panel border p-3 space-y-3 ${mutedPanelClass} ${delayed ? 'border-[var(--color-danger)]' : ''}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold truncate">{order.customerName}</h4>
                            <p className="text-xs text-muted truncate">{order.neighborhood}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-sm font-semibold text-accent">{money(order.total)}</span>
                            {isIFood && (
                              <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/30 text-[10px] font-semibold">
                                iFood
                              </span>
                            )}
                            {isIFoodTakeout && (
                              <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/30 text-[10px] font-semibold">
                                Retirada
                              </span>
                            )}
                            {delayed && (
                              <span className="px-2 py-0.5 rounded-full bg-danger/10 text-danger border border-danger/20 text-[10px] font-semibold">
                                Atrasado
                              </span>
                            )}
                            {ifoodCountdown && (
                              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${
                                ifoodCountdown.expired
                                  ? 'bg-danger/10 text-danger border-danger/20'
                                  : 'bg-warning/10 text-warning border-warning/20'
                              }`}>
                                Confirmar em {ifoodCountdown.label}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1.5 text-xs text-muted">
                          <p className="flex gap-2"><MapPin className="w-3.5 h-3.5 shrink-0" /> <span>{order.address}</span></p>
                          <p className="flex gap-2"><Timer className="w-3.5 h-3.5 shrink-0" /> {getElapsedLabel(order.createdAt, nowMs)}</p>
                          {isIFoodTakeout && (
                            <p className="text-xl font-bold text-accent">Código: {order.pickupCode}</p>
                          )}
                          {order.status === 'cancelado' && order.cancelReason && (
                            <p className="text-danger">Motivo: {order.cancelReason}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <select
                            value={order.entregadorId || ''}
                            onChange={event => assignEntregador(order, event.target.value)}
                            disabled={!canMutateOrder || isIFood}
                            className={`w-full h-9 px-2 rounded-control border bg-transparent text-xs ${isDark ? 'border-border' : 'border-border-light'}`}
                          >
                            <option value="">Atribuir entregador</option>
                            {assignable.map(entregador => (
                              <option key={entregador.id} value={entregador.id}>{entregador.name}</option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            {isIFood ? (
                              <>
                                <button
                                  onClick={() => void confirmIFood(order.id)}
                                  disabled={!canMutateOrder || order.status !== 'recebido'}
                                  className="flex-1 h-9 rounded-control bg-success text-white text-xs font-medium disabled:opacity-40"
                                >
                                  Confirmar
                                </button>
                                <button
                                  onClick={() => void rejectIFood(order.id, 'Rejeitado pelo operador')}
                                  disabled={order.status === 'cancelado' || order.status === 'entregue'}
                                  className="flex-1 h-9 rounded-control bg-danger/10 text-danger text-xs font-medium disabled:opacity-40"
                                >
                                  Rejeitar
                                </button>
                                <button
                                  onClick={() => {
                                    if (isIFoodTakeout) {
                                      openPickupValidation(order.id);
                                      return;
                                    }
                                    void dispatchIFood(order.id);
                                  }}
                                  disabled={!canMutateOrder || (order.status !== 'preparo' && order.status !== 'recebido')}
                                  className="flex-1 h-9 rounded-control bg-accent text-white text-xs font-medium disabled:opacity-40"
                                >
                                  {isIFoodTakeout ? 'Confirmar Retirada' : 'Despachar'}
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => advanceOrder(order)}
                                  disabled={!canMutateOrder}
                                  className="flex-1 h-9 rounded-control bg-accent text-white text-xs font-medium disabled:opacity-40"
                                >
                                  {order.status === 'entregue' ? 'Concluido' : order.status === 'cancelado' ? 'Cancelado' : 'Avancar'}
                                </button>
                                <button
                                  onClick={() => openCancelFlow(order.id)}
                                  disabled={order.status === 'cancelado'}
                                  className="w-9 h-9 rounded-control bg-danger/10 text-danger flex items-center justify-center"
                                  aria-label="Cancelar pedido"
                                >
                                  <ShieldAlert className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
          </div>
        </section>
      )}

      {activeTab === 'novo' && (
        <form onSubmit={createOrder} className={`rounded-panel border p-5 space-y-5 ${panelClass}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ['Cliente', customerName, setCustomerName],
              ['Telefone', phone, setPhone],
              ['Endereco', address, setAddress],
              ['Bairro', neighborhood, setNeighborhood],
            ].map(([label, value, setter]) => (
              <label key={label as string} className="space-y-1.5">
                <span className="text-xs text-muted">{label as string}</span>
                <input
                  required
                  value={value as string}
                  onChange={event => (setter as React.Dispatch<React.SetStateAction<string>>)(event.target.value)}
                  className={`w-full h-10 px-3 rounded-control border bg-transparent text-sm ${isDark ? 'border-border' : 'border-border-light'}`}
                />
              </label>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Itens</h3>
              <button type="button" onClick={() => setItems(prev => [...prev, { name: '', qty: 1, price: 0 }])} className="h-8 px-3 rounded-control bg-accent/10 text-accent text-xs font-medium flex items-center gap-2">
                <Plus className="w-3.5 h-3.5" /> Item
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-[1fr_76px_120px_36px] gap-2">
                  <input value={item.name} onChange={event => updateItem(index, { name: event.target.value })} placeholder="Nome do item" className={`h-10 px-3 rounded-control border bg-transparent text-sm ${isDark ? 'border-border' : 'border-border-light'}`} />
                  <input type="number" min="1" value={item.qty} onChange={event => updateItem(index, { qty: Number(event.target.value) })} className={`h-10 px-3 rounded-control border bg-transparent text-sm ${isDark ? 'border-border' : 'border-border-light'}`} />
                  <input type="number" min="0" step="0.01" value={item.price} onChange={event => updateItem(index, { price: Number(event.target.value) })} className={`h-10 px-3 rounded-control border bg-transparent text-sm ${isDark ? 'border-border' : 'border-border-light'}`} />
                  <button type="button" onClick={() => setItems(prev => prev.filter((_, itemIndex) => itemIndex !== index))} className="h-10 rounded-control bg-danger/10 text-danger flex items-center justify-center" aria-label="Remover item">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <label className="space-y-1.5">
              <span className="text-xs text-muted">Taxa de entrega</span>
              <input type="number" min="0" step="0.01" value={deliveryFee} onChange={event => setDeliveryFee(Number(event.target.value))} className={`w-full h-10 px-3 rounded-control border bg-transparent text-sm ${isDark ? 'border-border' : 'border-border-light'}`} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-muted">Desconto</span>
              <input type="number" min="0" step="0.01" value={discount} onChange={event => setDiscount(Number(event.target.value))} className={`w-full h-10 px-3 rounded-control border bg-transparent text-sm ${isDark ? 'border-border' : 'border-border-light'}`} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs text-muted">Pagamento</span>
              <select value={paymentMethod} onChange={event => setPaymentMethod(event.target.value as PaymentMethod)} className={`w-full h-10 px-3 rounded-control border bg-transparent text-sm ${isDark ? 'border-border' : 'border-border-light'}`}>
                {deliveryPaymentMethods.map(value => <option key={value} value={value}>{paymentLabels[value]}</option>)}
              </select>
            </label>
            <div className={`rounded-panel border p-3 ${mutedPanelClass}`}>
              <p className="text-xs text-muted">Total automatico</p>
              <p className="text-xl font-semibold text-accent">{money(total)}</p>
            </div>
          </div>

          <label className="space-y-1.5 block">
            <span className="text-xs text-muted">Observacoes</span>
            <textarea value={notes} onChange={event => setNotes(event.target.value)} rows={3} className={`w-full px-3 py-2 rounded-control border bg-transparent text-sm ${isDark ? 'border-border' : 'border-border-light'}`} />
          </label>

          <button type="submit" className="h-11 px-5 rounded-control bg-accent text-white text-sm font-medium">Criar pedido</button>
        </form>
      )}

      {activeTab === 'entregadores' && (
        <section className={`rounded-panel border overflow-hidden ${panelClass}`}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-current/10">
            <h3 className="text-sm font-semibold">Entregadores</h3>
            <button onClick={() => openEntregadorModal()} className="h-9 px-3 rounded-control bg-accent text-white text-xs font-medium flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" /> Cadastrar
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className={`text-xs border-b ${isDark ? 'bg-surface-light/5 border-border text-muted' : 'bg-elevated-light border-border-light text-muted-light'}`}>
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Telefone</th>
                  <th className="px-4 py-3">Veiculo</th>
                  <th className="px-4 py-3">Repasse</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-current/5">
                {entregadores.length === 0 && <tr><td colSpan={6} className="py-16 text-center text-xs text-muted">Nenhum entregador cadastrado</td></tr>}
                {entregadores.map(entregador => (
                  <tr key={entregador.id}>
                    <td className="px-4 py-3 text-sm font-medium">{entregador.name}</td>
                    <td className="px-4 py-3 text-xs text-muted">{entregador.phone}</td>
                    <td className="px-4 py-3 text-xs">{vehicleLabels[entregador.vehicle]}</td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {entregador.repasseType && typeof entregador.repasseValue === 'number'
                        ? `${repasseModelLabel(entregador.repasseType)} · ${money(entregador.repasseValue)}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleEntregadorStatus(entregador)} className={`px-2 py-1 rounded-full border text-xs font-medium ${statusBadgeClass(entregador.status)}`}>
                        {statusLabels[entregador.status]}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEntregadorModal(entregador)} className="w-8 h-8 rounded-control bg-accent/10 text-accent inline-flex items-center justify-center" aria-label="Editar entregador">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'financeiro' && (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className={`flex w-fit p-1 gap-1 rounded-panel border ${mutedPanelClass}`}>
              {(['hoje', 'semana', 'mes'] as Period[]).map(item => (
                <button key={item} onClick={() => setPeriod(item)} className={`px-3 py-1.5 rounded-control text-xs font-medium ${period === item ? 'bg-accent text-white' : 'text-muted'}`}>
                  {item}
                </button>
              ))}
            </div>
            <button onClick={exportFinancialCSV} className="h-9 px-3 rounded-control bg-accent text-white text-xs font-medium flex items-center gap-2 w-fit">
              <Download className="w-3.5 h-3.5" /> Exportar CSV
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            {[
              ['Receita bruta', money(deliveryFinancials.receita), Truck],
              ['Total de taxas', money(deliveryFinancials.taxas), MapPin],
              ['Pedidos entregues', String(filteredDeliveredOrders.length), CheckCircle2],
              ['Cancelamentos', String(deliveryFinancials.cancelamentos), ShieldAlert],
              ['Ticket medio', money(deliveryFinancials.ticketMedio), Calendar],
            ].map(([label, value, Icon]) => (
              <div key={label as string} className={`rounded-panel border p-4 ${panelClass}`}>
                {React.createElement(Icon as typeof Truck, { className: 'w-4 h-4 text-accent mb-3' })}
                <p className="text-xs text-muted">{label as string}</p>
                <p className="text-lg font-semibold mt-1">{value as string}</p>
              </div>
            ))}
          </div>

          <div className={`rounded-panel border overflow-hidden ${panelClass}`}>
            <div className="px-5 py-4 border-b border-current/10">
              <h3 className="text-sm font-semibold">Repasse por Entregador</h3>
              <p className="text-xs text-muted mt-1">Apuração operacional do valor devido aos entregadores no período.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className={`text-xs border-b ${isDark ? 'bg-surface-light/5 border-border text-muted' : 'bg-elevated-light border-border-light text-muted-light'}`}>
                  <tr>
                    <th className="px-4 py-3">Entregador</th>
                    <th className="px-4 py-3">Entregas</th>
                    <th className="px-4 py-3">Modelo</th>
                    <th className="px-4 py-3 text-right">Valor a Repassar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-current/5">
                  {entregadorRepasse.rows.length === 0 && <tr><td colSpan={4} className="py-16 text-center text-xs text-muted">Nenhum entregador cadastrado</td></tr>}
                  {entregadorRepasse.rows.map(row => (
                    <tr key={row.entregadorId}>
                      <td className="px-4 py-3 text-sm font-medium">{row.entregadorName}</td>
                      <td className="px-4 py-3 text-xs">{row.deliveries}</td>
                      <td className="px-4 py-3 text-xs text-muted">
                        {row.repasseType && typeof row.repasseValue === 'number'
                          ? `${repasseModelLabel(row.repasseType)} · ${money(row.repasseValue)}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-accent">
                        {row.repasseAmount === null ? '—' : money(row.repasseAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className={`border-t ${isDark ? 'border-border bg-surface-light/5' : 'border-border-light bg-elevated-light'}`}>
                  <tr>
                    <td className="px-4 py-3 text-sm font-semibold" colSpan={3}>Total consolidado</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-accent">{money(entregadorRepasse.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className={`rounded-panel border overflow-hidden ${panelClass}`}>
            <div className="px-5 py-4 border-b border-current/10">
              <h3 className="text-sm font-semibold">Pedidos concluidos</h3>
              <p className="text-xs text-muted mt-1">Esta receita é consolidada em Relatórios automaticamente</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className={`text-xs border-b ${isDark ? 'bg-surface-light/5 border-border text-muted' : 'bg-elevated-light border-border-light text-muted-light'}`}>
                  <tr>
                    <th className="px-4 py-3">Data</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Entregador</th>
                    <th className="px-4 py-3">Pagamento</th>
                    <th className="px-4 py-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-current/5">
                  {filteredDeliveredOrders.length === 0 && <tr><td colSpan={5} className="py-16 text-center text-xs text-muted">Nenhum pedido entregue no período</td></tr>}
                  {filteredDeliveredOrders.map(order => {
                    const entregador = entregadores.find(item => item.id === order.entregadorId);
                    return (
                      <tr key={order.id}>
                        <td className="px-4 py-3 text-xs text-muted">{new Date(order.deliveredAt || order.createdAt).toLocaleString('pt-BR')}</td>
                        <td className="px-4 py-3 text-sm font-medium">{order.customerName}</td>
                        <td className="px-4 py-3 text-xs">{entregador?.name || '-'}</td>
                        <td className="px-4 py-3 text-xs text-muted">{paymentLabels[order.paymentMethod]}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-accent">{money(order.total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <AnimatePresence>
        {pickupValidationOrderId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closePickupValidation} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              className={`relative w-full max-w-md rounded-panel border shadow-2xl ${panelClass}`}
            >
              <div className="px-5 py-4 border-b border-current/10">
                <h3 className="text-base font-semibold">Confirmar retirada</h3>
                <p className="text-xs text-muted mt-1">Digite o código do cliente para concluir a entrega no balcão.</p>
              </div>
              <div className="p-5 space-y-3">
                <label className="space-y-1.5 block">
                  <span className="text-xs text-muted">Digite o código do cliente</span>
                  <input
                    value={pickupValidationInput}
                    onChange={event => {
                      setPickupValidationInput(event.target.value);
                      if (pickupValidationError) setPickupValidationError(null);
                    }}
                    className={`w-full h-10 px-3 rounded-control border bg-transparent text-sm ${isDark ? 'border-border' : 'border-border-light'}`}
                  />
                </label>
                {pickupValidationError && <p className="text-xs text-danger">{pickupValidationError}</p>}
              </div>
              <div className="flex gap-3 px-5 pb-5">
                <button type="button" onClick={closePickupValidation} className="flex-1 h-10 rounded-control text-xs font-medium text-muted">Cancelar</button>
                <button type="button" onClick={() => void submitPickupValidation()} className="flex-[2] h-10 rounded-control bg-accent text-white text-xs font-medium">
                  Confirmar Retirada
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SecurityGate
        isOpen={cancelSecurityOpen}
        onClose={() => setCancelSecurityOpen(false)}
        onSuccess={confirmCancel}
        title="Cancelar pedido delivery"
      />

      <AnimatePresence>
        {cancelTargetId !== null && !cancelSecurityOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeCancelFlow} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.96 }} className={`relative w-full max-w-md rounded-panel border shadow-2xl ${panelClass}`}>
              <div className="flex items-center gap-3 px-5 py-4 border-b border-current/10">
                <div className="w-9 h-9 rounded-control bg-danger/10 text-danger flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">Motivo do cancelamento</h3>
                  <p className="text-xs text-muted">Informe o motivo antes de prosseguir.</p>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <label className="space-y-1.5 block">
                  <span className="text-xs text-muted">Motivo</span>
                  <select value={cancelReason} onChange={event => setCancelReason(event.target.value)} className={`w-full h-10 px-3 rounded-control border bg-transparent text-sm ${isDark ? 'border-border' : 'border-border-light'}`}>
                    <option value="">Selecione</option>
                    {cancelReasonOptions.map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                {cancelReason === 'Outro' && (
                  <label className="space-y-1.5 block">
                    <span className="text-xs text-muted">Descreva o motivo</span>
                    <input value={customCancelReason} onChange={event => setCustomCancelReason(event.target.value)} className={`w-full h-10 px-3 rounded-control border bg-transparent text-sm ${isDark ? 'border-border' : 'border-border-light'}`} />
                  </label>
                )}
              </div>
              <div className="flex gap-3 px-5 pb-5">
                <button type="button" onClick={closeCancelFlow} className="flex-1 h-10 rounded-control text-xs font-medium text-muted">Voltar</button>
                <button type="button" onClick={submitCancelReason} disabled={cancelReason === '' || (cancelReason === 'Outro' && customCancelReason.trim() === '')} className="flex-[2] h-10 rounded-control bg-danger text-white text-xs font-medium disabled:opacity-40">
                  Continuar cancelamento
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {entregadorModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEntregadorModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.form
              onSubmit={saveEntregador}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              className={`relative w-full max-w-md rounded-panel border shadow-2xl ${panelClass}`}
            >
              <div className="flex items-center gap-3 px-5 py-4 border-b border-current/10">
                <div className="w-9 h-9 rounded-control bg-accent/10 text-accent flex items-center justify-center">
                  <UserRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">{editingEntregador.id ? 'Editar entregador' : 'Novo entregador'}</h3>
                  <p className="text-xs text-muted">Cadastro operacional do delivery</p>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <label className="space-y-1.5 block">
                  <span className="text-xs text-muted">Nome</span>
                  <input required value={editingEntregador.name} onChange={event => setEditingEntregador(prev => ({ ...prev, name: event.target.value }))} className={`w-full h-10 px-3 rounded-control border bg-transparent text-sm ${isDark ? 'border-border' : 'border-border-light'}`} />
                </label>
                <label className="space-y-1.5 block">
                  <span className="text-xs text-muted">Telefone</span>
                  <input required value={editingEntregador.phone} onChange={event => setEditingEntregador(prev => ({ ...prev, phone: event.target.value }))} className={`w-full h-10 px-3 rounded-control border bg-transparent text-sm ${isDark ? 'border-border' : 'border-border-light'}`} />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1.5">
                    <span className="text-xs text-muted">Modelo de repasse</span>
                    <select value={editingEntregador.repasseType || ''} onChange={event => setEditingEntregador(prev => ({ ...prev, repasseType: event.target.value ? event.target.value as Entregador['repasseType'] : undefined }))} className={`w-full h-10 px-3 rounded-control border bg-transparent text-sm ${isDark ? 'border-border' : 'border-border-light'}`}>
                      <option value="">Nao configurar</option>
                      <option value="por_entrega">Por entrega</option>
                      <option value="fixo_diario">Diária fixa</option>
                    </select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs text-muted">Valor de repasse</span>
                    <input type="number" min="0" step="0.01" value={editingEntregador.repasseValue ?? ''} onChange={event => setEditingEntregador(prev => ({ ...prev, repasseValue: event.target.value === '' ? undefined : Number(event.target.value) }))} placeholder="0,00" className={`w-full h-10 px-3 rounded-control border bg-transparent text-sm ${isDark ? 'border-border' : 'border-border-light'}`} />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1.5">
                    <span className="text-xs text-muted">Veiculo</span>
                    <select value={editingEntregador.vehicle} onChange={event => setEditingEntregador(prev => ({ ...prev, vehicle: event.target.value as Entregador['vehicle'] }))} className={`w-full h-10 px-3 rounded-control border bg-transparent text-sm ${isDark ? 'border-border' : 'border-border-light'}`}>
                      {Object.entries(vehicleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs text-muted">Status</span>
                    <select value={editingEntregador.status} onChange={event => setEditingEntregador(prev => ({ ...prev, status: event.target.value as Entregador['status'] }))} className={`w-full h-10 px-3 rounded-control border bg-transparent text-sm ${isDark ? 'border-border' : 'border-border-light'}`}>
                      {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 px-5 pb-5">
                <button type="button" onClick={() => setEntregadorModalOpen(false)} className="flex-1 h-10 rounded-control text-xs font-medium text-muted">Cancelar</button>
                <button type="submit" className="flex-[2] h-10 rounded-control bg-accent text-white text-xs font-medium">Salvar</button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
