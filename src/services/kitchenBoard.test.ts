import assert from 'node:assert/strict';
import { DeliveryOrder, OnlineOrder, Order, Product } from '../types';
import { getKitchenOrderPriority, splitKitchenOrders } from './kitchenBoard';

const burger: Product = {
  id: 'prod-burger',
  empresaId: 'empresa-1',
  name: 'Burger',
  description: 'Burger',
  price: 25,
  category: 'Pratos',
};

const beer: Product = {
  id: 'prod-beer',
  empresaId: 'empresa-1',
  name: 'Beer',
  description: 'Beer',
  price: 12,
  category: 'Bebidas',
};

const mesaOrder: Order = {
  id: 'mesa-1',
  empresaId: 'empresa-1',
  mode: 'mesa',
  tableNumber: 10,
  items: [
    {
      id: 'item-1',
      product: burger,
      quantity: 1,
      price: 25,
      addedAt: '2026-05-24T12:10:00.000Z',
      kitchenStatus: 'aguardando',
    },
    {
      id: 'item-2',
      product: beer,
      quantity: 1,
      price: 12,
      addedAt: '2026-05-24T12:40:00.000Z',
      kitchenStatus: 'pronto',
    },
  ],
  subtotal: 37,
  serviceCharge: 0,
  total: 37,
  payments: [],
  status: 'open',
  waiterId: 'w1',
  timestamp: '2026-05-24T12:00:00.000Z',
};

const balcaoOrder: Order = {
  ...mesaOrder,
  id: 'balcao-1',
  mode: 'balcao',
  tableNumber: undefined,
  items: [{ ...mesaOrder.items[0], id: 'item-3' }],
};

const deliveryOrder: DeliveryOrder = {
  id: 'delivery-1',
  empresaId: 'empresa-1',
  customerName: 'Carlos',
  phone: '11999999999',
  address: 'Rua A',
  neighborhood: 'Centro',
  items: [{ name: 'Beer', qty: 2, price: 12 }],
  subtotal: 24,
  deliveryFee: 5,
  discount: 0,
  total: 29,
  paymentMethod: 'pix',
  status: 'preparo',
  createdAt: '2026-05-24T12:15:00.000Z',
};

const onlineOrder: OnlineOrder = {
  id: 'online-1',
  empresaId: 'empresa-1',
  channel: 'delivery',
  status: 'confirmado',
  customerName: 'Julia',
  items: [{ productId: 'prod-burger', name: 'Burger', qty: 1, price: 25 }],
  total: 25,
  createdAt: '2026-05-24T12:20:00.000Z',
};

(() => {
  const result = splitKitchenOrders([mesaOrder, balcaoOrder], [deliveryOrder], [onlineOrder]);
  assert.deepEqual(
    result.productionOrders.map(order => ({ id: order.id, source: order.source })),
    [
      { id: 'mesa-1', source: 'mesa' },
      { id: 'balcao-1', source: 'balcao' },
      { id: 'delivery-1', source: 'delivery' },
      { id: 'online-1', source: 'online' },
    ],
  );
})();

(() => {
  const priority = getKitchenOrderPriority(
    {
      id: 'mesa-1',
      source: 'mesa',
      label: 'Mesa 10',
      timestamp: '2026-05-24T12:00:00.000Z',
      total: 37,
      items: [
        {
          id: 'item-1',
          name: 'Burger',
          quantity: 1,
          price: 25,
          kitchenStatus: 'aguardando',
          addedAt: '2026-05-24T12:10:00.000Z',
        },
        {
          id: 'item-2',
          name: 'Beer',
          quantity: 1,
          price: 12,
          kitchenStatus: 'pronto',
          addedAt: '2026-05-24T12:00:00.000Z',
        },
      ],
    },
    new Date('2026-05-24T12:40:00.000Z').getTime(),
  );

  assert.equal(priority.level, 'atrasado');
  assert.equal(priority.minutes, 30);
})();

console.log('kitchenBoard tests passed');
