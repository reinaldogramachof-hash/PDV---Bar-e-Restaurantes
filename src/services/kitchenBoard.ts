import { DeliveryOrder, OnlineOrder, Order, KitchenItemStatus, Product } from '../types';

export type KitchenPriorityLevel = 'normal' | 'atencao' | 'atrasado' | 'aguardando';
export type KitchenOrderSource = 'mesa' | 'balcao' | 'delivery' | 'online';

export interface KitchenBoardItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category?: string;
  note?: string;
  addedAt?: string;
  kitchenStatus: KitchenItemStatus;
}

export interface KitchenBoardOrder {
  id: string;
  source: KitchenOrderSource;
  label: string;
  tableNumber?: number;
  waiterId?: string;
  customerName?: string;
  timestamp: string;
  total: number;
  items: KitchenBoardItem[];
}

export const KITCHEN_ORDERS_PER_PAGE = 6;

const BAR_CATEGORIES = ['bebidas', 'drinks', 'cervejas', 'bar', 'coquetel', 'coqueteis', 'cocktails', 'refrigerantes', 'sucos'];

const normalizeCategory = (value?: string) => value?.trim().toLocaleLowerCase('pt-BR');

const resolveProductCategory = (
  itemName: string,
  productId: string | undefined,
  productsById: Map<string, Product>,
  productsByName: Map<string, Product>,
) => {
  if (productId && productsById.has(productId)) {
    return productsById.get(productId)?.category;
  }

  return productsByName.get(itemName.trim().toLocaleLowerCase('pt-BR'))?.category;
};

const normalizeOrderItems = (order: Order): KitchenBoardItem[] =>
  order.items.map(item => ({
    id: item.id,
    name: item.product.name,
    quantity: item.quantity,
    price: item.price,
    category: item.product.category,
    note: item.product.description,
    addedAt: item.addedAt ?? order.timestamp,
    kitchenStatus: item.kitchenStatus ?? 'aguardando',
  }));

const normalizeDeliveryItems = (
  order: DeliveryOrder,
  productsById: Map<string, Product>,
  productsByName: Map<string, Product>,
): KitchenBoardItem[] =>
  order.items.map((item, index) => ({
    id: `${order.id}-${index}`,
    name: item.name,
    quantity: item.qty,
    price: item.price,
    category: resolveProductCategory(item.name, undefined, productsById, productsByName),
    note: order.notes,
    addedAt: item.addedAt ?? order.createdAt,
    kitchenStatus: item.kitchenStatus ?? 'aguardando',
  }));

const normalizeOnlineItems = (
  order: OnlineOrder,
  productsById: Map<string, Product>,
  productsByName: Map<string, Product>,
): KitchenBoardItem[] =>
  order.items.map((item, index) => ({
    id: `${order.id}-${index}`,
    name: item.name,
    quantity: item.qty,
    price: item.price,
    category: item.category ?? resolveProductCategory(item.name, item.productId, productsById, productsByName),
    note: item.notes ?? order.notes,
    addedAt: item.addedAt ?? order.createdAt,
    kitchenStatus: item.kitchenStatus ?? 'aguardando',
  }));

const getOldestPendingItemTime = (order: KitchenBoardOrder) => {
  const pendingItems = order.items.filter(item => item.kitchenStatus !== 'pronto');
  if (pendingItems.length === 0) return null;

  return pendingItems.reduce((oldest, item) => {
    const itemTime = new Date(item.addedAt ?? order.timestamp).getTime();
    return Math.min(oldest, itemTime);
  }, Number.POSITIVE_INFINITY);
};

export const isBarCategory = (category?: string) => {
  const normalized = normalizeCategory(category);
  return normalized ? BAR_CATEGORIES.includes(normalized) : false;
};

export const getKitchenOrderPriority = (order: KitchenBoardOrder, now = Date.now()) => {
  if (order.items.length === 0) {
    return {
      level: 'aguardando' as KitchenPriorityLevel,
      label: 'Aguardando itens',
      minutes: Math.max(0, Math.floor((now - new Date(order.timestamp).getTime()) / 60000)),
    };
  }

  const oldestPendingTime = getOldestPendingItemTime(order);
  if (oldestPendingTime === null) {
    return {
      level: 'normal' as KitchenPriorityLevel,
      label: 'Pedido pronto',
      minutes: 0,
    };
  }

  const minutes = Math.max(0, Math.floor((now - oldestPendingTime) / 60000));
  if (minutes >= 25) return { level: 'atrasado' as KitchenPriorityLevel, label: 'Atrasado', minutes };
  if (minutes >= 10) return { level: 'atencao' as KitchenPriorityLevel, label: 'Atenção', minutes };
  return { level: 'normal' as KitchenPriorityLevel, label: 'Novo pedido', minutes };
};

export const splitKitchenOrders = (
  orders: Order[],
  deliveryOrders: DeliveryOrder[],
  onlineOrders: OnlineOrder[],
  products: Product[] = [],
) => {
  const productsById = new Map(products.map(product => [product.id, product]));
  const productsByName = new Map(products.map(product => [product.name.trim().toLocaleLowerCase('pt-BR'), product]));

  const productionOrders: KitchenBoardOrder[] = [
    ...orders
      .filter(order => order.status === 'open' && (order.mode === 'mesa' || order.mode === 'balcao') && order.items.length > 0)
      .map(order => ({
        id: order.id,
        source: order.mode,
        label: order.mode === 'mesa' ? `Mesa ${order.tableNumber ?? '--'}` : 'Balcão',
        tableNumber: order.tableNumber,
        waiterId: order.waiterId,
        customerName: order.customerName,
        timestamp: order.timestamp,
        total: order.subtotal,
        items: normalizeOrderItems(order),
      })),
    ...deliveryOrders
      .filter(order => order.status !== 'entregue' && order.status !== 'cancelado' && order.items.length > 0)
      .map(order => ({
        id: order.id,
        source: 'delivery' as const,
        label: 'Delivery',
        customerName: order.customerName,
        timestamp: order.createdAt,
        total: order.total,
        items: normalizeDeliveryItems(order, productsById, productsByName),
      })),
    ...onlineOrders
      .filter(order => order.status !== 'entregue' && order.status !== 'cancelado' && order.items.length > 0)
      .map(order => ({
        id: order.id,
        source: 'online' as const,
        label: 'Online',
        customerName: order.customerName,
        tableNumber: order.channel === 'mesa' && order.tableRef ? Number(order.tableRef) : undefined,
        timestamp: order.createdAt,
        total: order.total,
        items: normalizeOnlineItems(order, productsById, productsByName),
      })),
  ];

  const openEmptyOrders: KitchenBoardOrder[] = orders
    .filter(order => order.status === 'open' && order.mode === 'mesa' && order.items.length === 0)
    .map(order => ({
      id: order.id,
      source: 'mesa',
      label: `Mesa ${order.tableNumber ?? '--'}`,
      tableNumber: order.tableNumber,
      waiterId: order.waiterId,
      customerName: order.customerName,
      timestamp: order.timestamp,
      total: order.subtotal,
      items: [],
    }));

  return { productionOrders, openEmptyOrders };
};

export const paginateKitchenOrders = (orders: KitchenBoardOrder[], pageSize = KITCHEN_ORDERS_PER_PAGE) => {
  const pages: KitchenBoardOrder[][] = [];
  for (let i = 0; i < orders.length; i += pageSize) {
    pages.push(orders.slice(i, i + pageSize));
  }
  return pages;
};
