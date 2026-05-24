import { Collaborator, Order, PaymentMethod } from '../types';

const normalize = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const labelFromId = (id: string) =>
  id.split(/[-_\s]+/).filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');

export const resolveAttendanceName = (waiterId: string, collaborators: Collaborator[]) => {
  const byId = collaborators.find(c => c.id === waiterId);
  if (byId) return byId.name;
  const waiterLabel = labelFromId(waiterId);
  const byName = collaborators.find(c => normalize(c.name) === normalize(waiterLabel));
  return byName?.name || waiterLabel || 'Operador Desconhecido';
};

export const getAttendanceRanking = (orders: Order[], collaborators: Collaborator[]) => {
  const totals = orders
    .filter(o => o.status === 'closed')
    .reduce<Record<string, { name: string; total: number; ordersCount: number }>>((acc, o) => {
      const name = resolveAttendanceName(o.waiterId, collaborators);
      if (!acc[name]) acc[name] = { name, total: 0, ordersCount: 0 };
      acc[name].total += o.total;
      acc[name].ordersCount += 1;
      return acc;
    }, {});
  return Object.values(totals).sort((a, b) => b.total - a.total).slice(0, 5);
};

export const buildEditedClosedOrder = (
  order: Order, subtotal: number, serviceCharge: number, paymentMethod: PaymentMethod
): Order => ({
  ...order,
  subtotal,
  serviceCharge,
  total: subtotal + serviceCharge,
  payments: subtotal + serviceCharge > 0 ? [{ method: paymentMethod, amount: subtotal + serviceCharge }] : [],
  status: 'closed',
});
