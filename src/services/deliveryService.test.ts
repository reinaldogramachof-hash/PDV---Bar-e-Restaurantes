import assert from 'node:assert/strict';
import { DeliveryOrder, Entregador } from '../types';
import { calcDeliveryFinancials, calcEntregadorRepasseRows, syncToReports } from './deliveryService';

const baseOrder = {
  empresaId: 'empresa-a',
  customerName: 'Cliente Teste',
  phone: '11999990000',
  address: 'Rua A, 10',
  neighborhood: 'Centro',
  items: [{ name: 'Combo', qty: 2, price: 25 }],
  subtotal: 50,
  deliveryFee: 8,
  discount: 3,
  total: 55,
  paymentMethod: 'pix',
  createdAt: '2026-05-24T12:00:00.000Z',
} satisfies Omit<DeliveryOrder, 'id' | 'status'>;

const orders: DeliveryOrder[] = [
  { ...baseOrder, id: 'entregue-1', status: 'entregue', deliveredAt: '2026-05-24T12:40:00.000Z' },
  { ...baseOrder, id: 'cancelado-1', status: 'cancelado', total: 40 },
  { ...baseOrder, id: 'rota-1', status: 'rota', total: 60 },
];

const reportOrders = syncToReports(orders);
assert.deepEqual(reportOrders.map(order => order.id), ['entregue-1']);

const financials = calcDeliveryFinancials(orders);
assert.equal(financials.receita, 55);
assert.equal(financials.taxas, 8);
assert.equal(financials.cancelamentos, 1);
assert.equal(financials.ticketMedio, 55);

const entregadores: Entregador[] = [
  {
    id: 'ent-1',
    empresaId: 'empresa-a',
    name: 'Carlos',
    phone: '11999990001',
    vehicle: 'moto',
    status: 'disponivel',
    createdAt: '2026-05-24T10:00:00.000Z',
    repasseType: 'por_entrega',
    repasseValue: 7.5,
  },
  {
    id: 'ent-2',
    empresaId: 'empresa-a',
    name: 'Ana',
    phone: '11999990002',
    vehicle: 'bike',
    status: 'disponivel',
    createdAt: '2026-05-24T10:00:00.000Z',
    repasseType: 'fixo_diario',
    repasseValue: 50,
  },
  {
    id: 'ent-3',
    empresaId: 'empresa-a',
    name: 'Joao',
    phone: '11999990003',
    vehicle: 'carro',
    status: 'inativo',
    createdAt: '2026-05-24T10:00:00.000Z',
  },
];

const repasseRows = calcEntregadorRepasseRows(
  [
    { ...orders[0], entregadorId: 'ent-1' },
    { ...orders[0], id: 'entregue-2', entregadorId: 'ent-1' },
    { ...orders[0], id: 'entregue-3', entregadorId: 'ent-2' },
  ],
  entregadores,
);

assert.deepEqual(
  repasseRows.rows.map(row => ({
    entregadorId: row.entregadorId,
    entregas: row.deliveries,
    modelo: row.repasseType,
    valor: row.repasseAmount,
  })),
  [
    { entregadorId: 'ent-1', entregas: 2, modelo: 'por_entrega', valor: 15 },
    { entregadorId: 'ent-2', entregas: 1, modelo: 'fixo_diario', valor: 50 },
    { entregadorId: 'ent-3', entregas: 0, modelo: undefined, valor: null },
  ],
);
assert.equal(repasseRows.total, 65);

console.log('delivery service tests passed');
