import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import { ChefHat, Clock, Timer, User } from 'lucide-react';
import {
  getKitchenOrderPriority,
  KitchenPriorityLevel,
  paginateKitchenOrders,
  splitKitchenOrders,
} from '../services/kitchenBoard';

export const Kitchen: React.FC = () => {
  const { orders, waiters, theme } = useApp();
  const isDark = theme === 'dark';
  const panelClass = isDark ? 'bg-surface border-border' : 'bg-surface-light border-border-light';
  const subtlePanelClass = isDark ? 'bg-elevated border-border' : 'bg-elevated-light border-border-light';
  const fieldClass = isDark ? 'bg-elevated border-border' : 'bg-elevated-light border-border-light';

  const [pageIndex, setPageIndex] = useState(0);
  const [clock, setClock] = useState(() => new Date());

  const { productionOrders, openEmptyOrders } = useMemo(
    () => splitKitchenOrders(orders),
    [orders]
  );
  const orderPages = useMemo(
    () => paginateKitchenOrders(productionOrders),
    [productionOrders]
  );
  const pageCount = Math.max(orderPages.length, 1);
  const visibleOrders = orderPages[pageIndex] ?? [];
  const urgentCount = productionOrders.filter(
    o => getKitchenOrderPriority(o).level === 'atrasado'
  ).length;
  const totalItems = productionOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
    0
  );

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (pageIndex >= pageCount) setPageIndex(0);
  }, [pageCount, pageIndex]);

  useEffect(() => {
    if (pageCount <= 1) return;
    const t = setInterval(
      () => setPageIndex(curr => (curr + 1) % pageCount),
      8000
    );
    return () => clearInterval(t);
  }, [pageCount]);

  const money = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const elapsed = (timestamp: string) => {
    const min = Math.max(0, Math.floor(
      (Date.now() - new Date(timestamp).getTime()) / 60000
    ));
    return min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}m` : `${min}m`;
  };

  const getWaiterName = (waiterId?: string) =>
    waiters.find(w => w.id === waiterId)?.name ?? 'Garçom';

  const priorityClass: Record<KitchenPriorityLevel, string> = {
    normal: 'bg-success/10 text-success border-success/20',
    atencao: 'bg-warning/10 text-warning border-warning/20',
    atrasado: 'bg-danger/10 text-danger border-danger/20',
    aguardando: 'bg-muted/10 text-muted border-current/10',
  };

  return (
    <div className="h-full flex flex-col gap-5 p-6 animate-in fade-in duration-500">
      <section className={`rounded-panel border ${panelClass}`}>
        <div className="p-6 border-b border-current/5">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-panel bg-accent/10 text-accent flex items-center justify-center shrink-0">
                <ChefHat className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">Cozinha</h2>
                <p className="text-sm text-muted">Fila ativa de preparo por mesa</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <KitchenStat label="Produção" value={productionOrders.length.toString()} className={fieldClass} />
              <KitchenStat label="Itens" value={totalItems.toString()} className={fieldClass} />
              <KitchenStat label="Atrasados" value={urgentCount.toString()} className={fieldClass} />
              <KitchenStat
                label="Horário"
                value={clock.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                className={fieldClass}
              />
              <KitchenStat label="Página" value={`${pageIndex + 1}/${pageCount}`} className={fieldClass} />
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
                <p className="text-xs mt-1">As comandas de mesa aparecerão aqui quando tiverem itens.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visibleOrders.map(order => {
              const priority = getKitchenOrderPriority(order);
              const hiddenItems = Math.max(0, order.items.length - 4);

              return (
                <article key={order.id} className={`rounded-panel border overflow-hidden ${panelClass}`}>
                  <div className="p-5 border-b border-current/5 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-muted mb-1">Mesa</p>
                      <h3 className="text-2xl font-semibold">{order.tableNumber?.toString().padStart(2, '0') ?? '--'}</h3>
                    </div>
                    <div className={`px-3 py-1.5 rounded-full border text-xs font-medium ${priorityClass[priority.level]}`}>
                      {priority.label} · {priority.minutes}m
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
                      {order.items.slice(0, 4).map(item => {
                        const note = (item as { note?: string }).note || item.product.description;
                        return (
                          <div key={item.id} className={`p-3 rounded-control ${subtlePanelClass}`}>
                            <div className="flex justify-between gap-3">
                              <p className="text-sm font-medium">{item.quantity}x {item.product.name}</p>
                              <span className="text-xs text-muted shrink-0">{money(item.price * item.quantity)}</span>
                            </div>
                            {note && <p className="text-xs text-muted mt-1 line-clamp-2">{note}</p>}
                          </div>
                        );
                      })}
                      {hiddenItems > 0 && (
                        <div className={`p-3 rounded-control text-sm text-muted ${subtlePanelClass}`}>
                          +{hiddenItems} itens
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-current/10">
                      <span className="text-xs text-muted">Total</span>
                      <span className="text-sm font-semibold text-accent">{money(order.subtotal)}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {openEmptyOrders.length > 0 && (
        <section className={`rounded-panel border p-4 ${panelClass}`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">Mesas aguardando itens:</span>
            {openEmptyOrders.map(order => {
              const priority = getKitchenOrderPriority(order);
              return (
                <span key={order.id} className={`px-3 py-1 rounded-full border text-xs font-medium ${priorityClass[priority.level]}`}>
                  Mesa {order.tableNumber ?? '--'} · {priority.minutes}m
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
