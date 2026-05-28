import assert from 'node:assert/strict';
import { Collaborator, DeliveryOrder, Expense, Order, Product, StockItem } from '../types';
import { computeInsights } from './intelligenceService';

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

const product = (id: string, name: string, price: number): Product => ({
  id,
  empresaId: 'empresa-a',
  name,
  description: '',
  price,
  category: 'Teste',
});

const order = (id: string, days: number, total: number, productName = 'Prato A'): Order => ({
  id,
  empresaId: 'empresa-a',
  mode: 'balcao',
  items: [{ id: `${id}-item`, product: product(productName, productName, total), quantity: 1, price: total }],
  subtotal: total,
  serviceCharge: 0,
  total,
  payments: [{ method: 'pix', amount: total }],
  status: 'closed',
  waiterId: 'w1',
  timestamp: daysAgo(days),
});

const deliveryOrder = (id: string, total: number, status: DeliveryOrder['status']): DeliveryOrder => ({
  id,
  empresaId: 'empresa-a',
  customerName: 'Cliente',
  phone: '11999990000',
  address: 'Rua A',
  neighborhood: 'Centro',
  items: [{ name: 'Combo', qty: 1, price: total }],
  subtotal: total,
  deliveryFee: 5,
  discount: 0,
  total,
  paymentMethod: 'pix',
  status,
  createdAt: daysAgo(1),
  deliveredAt: status === 'entregue' ? daysAgo(1) : undefined,
});

const orders: Order[] = [
  order('current-1', 1, 100),
  order('current-2', 2, 80),
  order('previous-1', 8, 200),
  order('previous-2', 9, 180),
  order('stale-product', 10, 60, 'Prato Parado'),
];

const expenses: Expense[] = [{
  id: 'expense-1',
  empresaId: 'empresa-a',
  description: 'Despesa alta',
  amount: 600,
  category: 'Outros',
  status: 'pago',
  timestamp: daysAgo(1),
}];

const stockItems: StockItem[] = [{
  id: 'stock-1',
  empresaId: 'empresa-a',
  name: 'Queijo',
  category: 'Insumos',
  unit: 'kg',
  currentStock: 2,
  minStock: 5,
  costPrice: 20,
}];

const insights = computeInsights(
  orders,
  expenses,
  stockItems,
  [deliveryOrder('delivery-1', 400, 'entregue'), deliveryOrder('delivery-2', 20, 'cancelado')],
  [] as Collaborator[],
);

const titles = insights.map(insight => insight.title);
assert.ok(titles.includes('Receita caiu mais de 15% vs semana anterior'));
assert.ok(titles.includes('Despesas acima de 70% da receita'));
assert.ok(titles.includes('Item abaixo do estoque minimo'));
assert.ok(titles.includes('Cancelamentos acima de 5%'));
assert.ok(titles.includes('Delivery ja representa mais de 30% da receita'));
assert.ok(insights.some(insight => insight.title.includes('Produto sem venda ha 7 dias')));

const severities = insights.map(insight => insight.severity);
assert.equal(severities[0], 'critico');

console.log('intelligence service tests passed');
