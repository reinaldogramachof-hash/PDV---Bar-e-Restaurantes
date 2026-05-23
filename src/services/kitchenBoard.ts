import { Order } from '../types';

export type KitchenPriorityLevel = 'normal' | 'atencao' | 'atrasado' | 'aguardando';
export const KITCHEN_ORDERS_PER_PAGE = 6;

export const getKitchenOrderPriority = (order: Order, now = Date.now()) => {
  if (order.items.length === 0) {
    return {
      level: 'aguardando' as KitchenPriorityLevel,
      label: 'Mesa aguardando',
      minutes: Math.max(0, Math.floor((now - new Date(order.timestamp).getTime()) / 60000)),
    };
  }
  const minutes = Math.max(0, Math.floor((now - new Date(order.timestamp).getTime()) / 60000));
  if (minutes >= 25) return { level: 'atrasado' as KitchenPriorityLevel, label: 'Atrasado', minutes };
  if (minutes >= 10) return { level: 'atencao' as KitchenPriorityLevel, label: 'Atenção', minutes };
  return { level: 'normal' as KitchenPriorityLevel, label: 'Novo pedido', minutes };
};

export const splitKitchenOrders = (orders: Order[]) => ({
  productionOrders: orders.filter(o =>
    o.status === 'open' && o.mode === 'mesa' && o.items.length > 0
  ),
  openEmptyOrders: orders.filter(o =>
    o.status === 'open' && o.mode === 'mesa' && o.items.length === 0
  ),
});

export const paginateKitchenOrders = (orders: Order[], pageSize = KITCHEN_ORDERS_PER_PAGE) => {
  const pages: Order[][] = [];
  for (let i = 0; i < orders.length; i += pageSize) {
    pages.push(orders.slice(i, i + pageSize));
  }
  return pages;
};
