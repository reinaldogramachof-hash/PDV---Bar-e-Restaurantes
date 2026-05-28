import assert from 'node:assert/strict';
import { OnlineOrder, StockItem } from '../types';
import {
  buildOnlineOrderStockAdjustments,
  getDeliveredOnlineOrdersInWindow,
  getIdleReceivedOrderIds,
  getOnlinePaymentBreakdown,
  getOnlineSalesTotal,
} from './onlineOrdersService';

const baseOrder: OnlineOrder = {
  id: 'online-1',
  empresaId: 'empresa-1',
  channel: 'delivery',
  status: 'recebido',
  items: [
    { productId: 'prod-burger', name: 'Hamburguer', qty: 2, price: 25 },
    { productId: 'prod-soda', name: 'Refrigerante', qty: 1, price: 8 },
    { productId: 'prod-missing', name: 'Molho especial', qty: 1, price: 3 },
  ],
  customerName: 'Joana',
  total: 61,
  createdAt: '2026-05-24T12:00:00.000Z',
};

(() => {
  const nowMs = new Date('2026-05-24T12:01:10.000Z').getTime();
  const orders: OnlineOrder[] = [
    baseOrder,
    {
      ...baseOrder,
      id: 'online-2',
      status: 'confirmado',
      createdAt: '2026-05-24T12:00:00.000Z',
    },
    {
      ...baseOrder,
      id: 'online-3',
      createdAt: '2026-05-24T12:00:40.000Z',
    },
  ];

  assert.deepEqual(getIdleReceivedOrderIds(orders, nowMs), ['online-1']);
})();

(() => {
  const stockItems: StockItem[] = [
    {
      id: 'prod-burger',
      empresaId: 'empresa-1',
      name: 'Hamburguer',
      category: 'Lanches',
      unit: 'un',
      currentStock: 10,
      minStock: 2,
      costPrice: 12,
    },
    {
      id: 'stock-soda',
      empresaId: 'empresa-1',
      name: 'Refrigerante',
      category: 'Bebidas',
      unit: 'un',
      currentStock: 5,
      minStock: 1,
      costPrice: 4,
    },
  ];

  const result = buildOnlineOrderStockAdjustments(baseOrder, stockItems, 'empresa-1', '2026-05-24T12:05:00.000Z');

  assert.equal(result.updatedStockItems[0].currentStock, 8);
  assert.equal(result.updatedStockItems[1].currentStock, 4);
  assert.equal(result.movements.length, 2);
  assert.equal(result.movements[0].stockItemId, 'prod-burger');
  assert.equal(result.movements[0].quantity, 2);
  assert.equal(result.movements[1].stockItemId, 'stock-soda');
})();

(() => {
  const orders: OnlineOrder[] = [
    {
      ...baseOrder,
      id: 'online-10',
      status: 'entregue',
      total: 85,
      paymentMethod: 'pix',
      deliveredAt: '2026-05-24T13:10:00.000Z',
    },
    {
      ...baseOrder,
      id: 'online-11',
      status: 'entregue',
      total: 32,
      paymentMethod: 'credito',
      deliveredAt: '2026-05-24T12:50:00.000Z',
    },
    {
      ...baseOrder,
      id: 'online-12',
      status: 'confirmado',
      total: 44,
    },
  ];

  const sessionOrders = getDeliveredOnlineOrdersInWindow(orders, '2026-05-24T13:00:00.000Z');
  assert.deepEqual(sessionOrders.map(order => order.id), ['online-10']);
  assert.equal(getOnlineSalesTotal(sessionOrders), 85);
  assert.deepEqual(getOnlinePaymentBreakdown(sessionOrders), { pix: 85 });
})();

console.log('onlineOrdersService tests passed');
