import { OnlineOrder, PaymentMethod, StockItem, StockMovement } from '../types';

const IDLE_RECEIVED_MS = 60_000;

const normalizeText = (value: string) => value.trim().toLocaleLowerCase('pt-BR');

export const getIdleReceivedOrderIds = (orders: OnlineOrder[], nowMs: number, thresholdMs = IDLE_RECEIVED_MS) =>
  orders
    .filter(order => order.status === 'recebido' && nowMs - new Date(order.createdAt).getTime() > thresholdMs)
    .map(order => order.id);

export const buildOnlineOrderStockAdjustments = (
  order: OnlineOrder,
  stockItems: StockItem[],
  empresaId: string,
  timestamp: string,
) => {
  const updatedStockItems = [...stockItems];
  const movements: StockMovement[] = [];

  order.items.forEach(item => {
    const stockIndex = updatedStockItems.findIndex(stockItem =>
      stockItem.id === item.productId || normalizeText(stockItem.name) === normalizeText(item.name)
    );

    if (stockIndex === -1) return;

    const stockItem = updatedStockItems[stockIndex];
    updatedStockItems[stockIndex] = {
      ...stockItem,
      currentStock: Math.max(0, stockItem.currentStock - item.qty),
    };

    movements.push({
      id: `stock-online-${order.id}-${item.productId}`,
      empresaId,
      stockItemId: stockItem.id,
      type: 'out',
      quantity: item.qty,
      unitCost: stockItem.costPrice,
      reason: `Pedido online - ${order.customerName} - ${item.name}`,
      timestamp,
    });
  });

  return { updatedStockItems, movements };
};

export const getDeliveredOnlineOrdersInWindow = (orders: OnlineOrder[], openedAt?: string | null) => {
  if (!openedAt) return [];
  const openedAtMs = new Date(openedAt).getTime();

  return orders.filter(order =>
    order.status === 'entregue' &&
    typeof order.deliveredAt === 'string' &&
    new Date(order.deliveredAt).getTime() >= openedAtMs
  );
};

export const getOnlinePaymentBreakdown = (orders: OnlineOrder[]) =>
  orders.reduce<Record<string, number>>((acc, order) => {
    const key = order.paymentMethod ?? 'nao_informado';
    acc[key] = (acc[key] || 0) + order.total;
    return acc;
  }, {});

export const getOnlineSalesTotal = (orders: OnlineOrder[]) =>
  orders.reduce((sum, order) => sum + order.total, 0);

export const isSupportedOnlinePaymentMethod = (paymentMethod?: PaymentMethod): paymentMethod is PaymentMethod =>
  typeof paymentMethod === 'string' && paymentMethod.length > 0;
