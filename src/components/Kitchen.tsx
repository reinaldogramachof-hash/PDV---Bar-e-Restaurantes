import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import {
  Bike,
  CheckCircle2,
  ChefHat,
  ChevronLeft,
  ChevronRight,
  Clock,
  Pause,
  Play,
  ShoppingBag,
  Smartphone,
  Timer,
  User,
  UtensilsCrossed,
} from 'lucide-react';
import {
  getKitchenOrderPriority,
  isBarCategory,
  KitchenBoardOrder,
  KitchenPriorityLevel,
  paginateKitchenOrders,
  splitKitchenOrders,
} from '../services/kitchenBoard';
import { KitchenItemStatus } from '../types';

type KitchenSectorFilter = 'todos' | 'cozinha' | 'bar';

const SOURCE_ICON = {
  mesa: UtensilsCrossed,
  balcao: ShoppingBag,
  delivery: Bike,
  online: Smartphone,
} as const;

const SECTOR_TABS: Array<{ id: KitchenSectorFilter; label: string }> = [
  { id: 'todos', label: 'Todos' },
  { id: 'cozinha', label: 'Cozinha' },
  { id: 'bar', label: 'Bar' },
];

const getItemKitchenStatus = (status?: KitchenItemStatus) => status ?? 'aguardando';

const matchesSectorFilter = (order: KitchenBoardOrder, filter: KitchenSectorFilter) => {
  if (filter === 'todos') return true;

  return order.items.some(item => {
    const isBar = isBarCategory(item.category);
    if (filter === 'bar') return isBar;
    return !isBar && Boolean(item.category);
  });
};

export const Kitchen: React.FC = () => {
  const {
    deliveryOrders,
    onlineOrders,
    orders,
    products,
    settings,
    theme,
    updateOrderItemKitchenStatus,
    waiters,
  } = useApp();

  const isDark = theme === 'dark';
  const kitchenMode = settings.kitchenMode ?? 'display';
  const isInteractiveMode = kitchenMode === 'interactive';
  const panelClass = isDark ? 'bg-surface border-border' : 'bg-surface-light border-border-light';
  const subtlePanelClass = isDark ? 'bg-elevated border-border' : 'bg-elevated-light border-border-light';
  const fieldClass = isDark ? 'bg-elevated border-border' : 'bg-elevated-light border-border-light';

  const [pageIndex, setPageIndex] = useState(0);
  const [clock, setClock] = useState(() => new Date());
  const [isAutoPlayPaused, setIsAutoPlayPaused] = useState(false);
  const [sectorFilter, setSectorFilter] = useState<KitchenSectorFilter>('todos');

  const { productionOrders, openEmptyOrders } = useMemo(
    () => splitKitchenOrders(orders, deliveryOrders, onlineOrders, products),
    [orders, deliveryOrders, onlineOrders, products]
  );

  const filteredProductionOrders = useMemo(
    () => productionOrders.filter(order => matchesSectorFilter(order, sectorFilter)),
    [productionOrders, sectorFilter]
  );

  const orderPages = useMemo(
    () => paginateKitchenOrders(filteredProductionOrders),
    [filteredProductionOrders]
  );

  const pageCount = Math.max(orderPages.length, 1);
  const visibleOrders = orderPages[pageIndex] ?? [];
  const urgentCount = filteredProductionOrders.filter(
    order => getKitchenOrderPriority(order).level === 'atrasado'
  ).length;
  const totalItems = filteredProductionOrders.reduce(
    (sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  );
  const readyOrdersCount = filteredProductionOrders.filter(
    order => order.items.length > 0 && order.items.every(item => getItemKitchenStatus(item.kitchenStatus) === 'pronto')
  ).length;

  useEffect(() => {
    const timer = window.setInterval(() => setClock(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (pageIndex >= pageCount) setPageIndex(0);
  }, [pageCount, pageIndex]);

  useEffect(() => {
    if (pageCount <= 1 || isAutoPlayPaused) return;
    const timer = window.setInterval(
      () => setPageIndex(current => (current + 1) % pageCount),
      8000
    );
    return () => window.clearInterval(timer);
  }, [isAutoPlayPaused, pageCount]);

  const money = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const elapsed = (timestamp: string) => {
    const minutes = Math.max(0, Math.floor(
      (Date.now() - new Date(timestamp).getTime()) / 60000
    ));
    return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
  };

  const getWaiterName = (waiterId?: string) =>
    waiters.find(waiter => waiter.id === waiterId)?.name ?? 'Operação';

  const priorityClass: Record<KitchenPriorityLevel, string> = {
    normal: 'bg-success/10 text-success border-success/20',
    atencao: 'bg-warning/10 text-warning border-warning/20',
    atrasado: 'bg-danger/10 text-danger border-danger/20',
    aguardando: 'bg-muted/10 text-muted border-current/10',
  };

  const kitchenStatusClass: Record<KitchenItemStatus, string> = {
    aguardando: 'bg-muted/10 text-muted border-current/10',
    preparo: 'bg-warning/10 text-warning border-warning/20',
    pronto: 'bg-success/10 text-success border-success/20',
  };

  const movePage = (direction: 'previous' | 'next') => {
    if (pageCount <= 1) return;
    setPageIndex(current =>
      direction === 'previous'
        ? (current - 1 + pageCount) % pageCount
        : (current + 1) % pageCount
    );
  };

  return (
    <div className="h-full flex flex-col gap-5 animate-in fade-in duration-500">
      <section className={`rounded-panel border ${panelClass}`}>
        <div className="p-6 border-b border-current/5">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-panel bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <ChefHat className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold">Cozinha</h2>
                    <span className={`px-2.5 py-1 rounded-full border text-[10px] font-semibold ${
                      isInteractiveMode
                        ? 'bg-warning/10 text-warning border-warning/20'
                        : 'bg-success/10 text-success border-success/20'
                    }`}>
                      {isInteractiveMode ? 'Modo Interativo' : 'Modo Visualização'}
                    </span>
                  </div>
                  <p className="text-sm text-muted">Fila ativa de preparo com origens unificadas.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                <KitchenStat label="Produção" value={filteredProductionOrders.length.toString()} className={fieldClass} />
                <KitchenStat label="Itens" value={totalItems.toString()} className={fieldClass} />
                <KitchenStat label="Atrasados" value={urgentCount.toString()} className={fieldClass} />
                <KitchenStat label="Prontos" value={readyOrdersCount.toString()} className={fieldClass} />
                <KitchenStat
                  label="Horário"
                  value={clock.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  className={fieldClass}
                />
                <KitchenStat label="Página" value={`${pageIndex + 1}/${pageCount}`} className={fieldClass} />
              </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className={`flex w-fit p-1 gap-1 rounded-panel border ${fieldClass}`}>
                {SECTOR_TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setSectorFilter(tab.id);
                      setPageIndex(0);
                    }}
                    className={`h-10 px-4 text-xs rounded-control font-medium transition-all ${
                      sectorFilter === tab.id ? 'bg-accent text-white' : 'text-muted hover:text-current'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => movePage('previous')}
                  disabled={pageCount <= 1}
                  className={`w-12 h-12 rounded-panel border flex items-center justify-center transition-all disabled:opacity-30 ${fieldClass}`}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setIsAutoPlayPaused(current => !current)}
                  className={`w-12 h-12 rounded-panel border flex items-center justify-center transition-all ${fieldClass}`}
                  aria-label={isAutoPlayPaused ? 'Retomar auto-play' : 'Pausar auto-play'}
                >
                  {isAutoPlayPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                </button>
                <button
                  onClick={() => movePage('next')}
                  disabled={pageCount <= 1}
                  className={`w-12 h-12 rounded-panel border flex items-center justify-center transition-all disabled:opacity-30 ${fieldClass}`}
                  aria-label="Próxima página"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex-1 min-h-0">
        {visibleOrders.length === 0 ? (
          <div className={`h-full min-h-[320px] rounded-panel border ${panelClass} flex items-center justify-center text-center p-8`}>
            <div className="space-y-3 text-muted">
              <Timer className="w-10 h-10 mx-auto" />
              <div>
                <p className="text-sm font-medium">Nenhum pedido em produção</p>
                <p className="text-xs mt-1">As comandas abertas aparecem aqui conforme entram na fila.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visibleOrders.map(order => {
              const priority = getKitchenOrderPriority(order);
              const allItemsReady = order.items.length > 0 && order.items.every(
                item => getItemKitchenStatus(item.kitchenStatus) === 'pronto'
              );
              const SourceIcon = SOURCE_ICON[order.source];

              return (
                <article key={order.id} className={`rounded-panel border overflow-hidden ${panelClass}`}>
                  <div className="p-5 border-b border-current/5 flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <SourceIcon className="w-3.5 h-3.5" />
                        <span>{order.label}</span>
                        {order.customerName && <span className="truncate">• {order.customerName}</span>}
                      </div>
                      <div>
                        <p className="text-xs text-muted mb-1">Origem</p>
                        <h3 className="text-2xl font-semibold">
                          {order.source === 'mesa' && order.tableNumber
                            ? order.tableNumber.toString().padStart(2, '0')
                            : order.label}
                        </h3>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className={`px-3 py-1.5 rounded-full border text-xs font-medium ${priorityClass[priority.level]}`}>
                        {priority.label} • {priority.minutes}m
                      </div>
                      {isInteractiveMode && allItemsReady && (
                        <div className="px-3 py-1.5 rounded-full border text-xs font-semibold bg-success/10 text-success border-success/20 animate-pulse">
                          Pedido Pronto
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between gap-3 text-xs text-muted">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        {getWaiterName(order.waiterId)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {elapsed(order.timestamp)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {order.items.map((item, itemIndex) => {
                        const itemStatus = getItemKitchenStatus(item.kitchenStatus);

                        return (
                          <div key={item.id} className={`p-3 rounded-control ${subtlePanelClass}`}>
                            <div className="flex justify-between gap-3 items-start">
                              <div className={`min-w-0 ${itemStatus === 'pronto' ? 'opacity-50 line-through' : ''}`}>
                                <p className="text-sm font-medium">{item.quantity}x {item.name}</p>
                                {item.note && <p className="text-xs text-muted mt-1 line-clamp-2">{item.note}</p>}
                              </div>
                              <div className="flex flex-col items-end gap-2 shrink-0">
                                <span className="text-xs text-muted">{money(item.price * item.quantity)}</span>
                                {isInteractiveMode && (
                                  <span className={`px-2 py-1 rounded-full border text-[10px] font-semibold ${kitchenStatusClass[itemStatus]}`}>
                                    {itemStatus === 'aguardando' ? 'Aguardando' : itemStatus === 'preparo' ? 'Preparo' : 'Pronto'}
                                  </span>
                                )}
                              </div>
                            </div>

                            {isInteractiveMode && (
                              <div className="flex gap-2 mt-3">
                                {itemStatus === 'aguardando' && (
                                  <button
                                    onClick={() => updateOrderItemKitchenStatus(order.id, itemIndex, 'preparo')}
                                    className="h-10 px-4 rounded-control bg-warning text-white text-xs font-medium"
                                  >
                                    Iniciar
                                  </button>
                                )}
                                {itemStatus === 'preparo' && (
                                  <button
                                    onClick={() => updateOrderItemKitchenStatus(order.id, itemIndex, 'pronto')}
                                    className="h-10 px-4 rounded-control bg-success text-white text-xs font-medium"
                                  >
                                    Pronto
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-current/10">
                      <span className="text-xs text-muted">Total</span>
                      <span className="text-sm font-semibold text-accent">{money(order.total)}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {sectorFilter === 'todos' && openEmptyOrders.length > 0 && (
        <section className={`rounded-panel border p-4 ${panelClass}`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">Mesas aguardando itens:</span>
            {openEmptyOrders.map(order => {
              const priority = getKitchenOrderPriority(order);
              return (
                <span key={order.id} className={`px-3 py-1 rounded-full border text-xs font-medium ${priorityClass[priority.level]}`}>
                  Mesa {order.tableNumber ?? '--'} • {priority.minutes}m
                </span>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

const KitchenStat = ({ label, value, className }: { label: string; value: string; className: string }) => (
  <div className={`min-w-[112px] rounded-panel border px-4 py-3 ${className}`}>
    <p className="text-xs text-muted mb-1">{label}</p>
    <p className="text-lg font-semibold">{value}</p>
  </div>
);
