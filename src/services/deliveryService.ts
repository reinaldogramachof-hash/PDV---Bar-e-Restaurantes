import { DeliveryOrder, Entregador } from '../types';
import { buildScopedStorageKey } from '../domain/saas';

interface EntregadorRepasseRow {
  entregadorId: string;
  entregadorName: string;
  deliveries: number;
  repasseType?: Entregador['repasseType'];
  repasseValue?: number;
  repasseAmount: number | null;
}

const readCollection = <T,>(collection: string, empresaId: string): T[] => {
  if (typeof localStorage === 'undefined') return [];

  try {
    const raw = localStorage.getItem(buildScopedStorageKey(collection, empresaId));
    return raw ? JSON.parse(raw) as T[] : [];
  } catch {
    return [];
  }
};

const writeCollection = <T,>(collection: string, empresaId: string, items: T[]) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(buildScopedStorageKey(collection, empresaId), JSON.stringify(items));
};

export const deliveryStorageKeys = {
  orders: (empresaId: string) => buildScopedStorageKey('deliveryOrders', empresaId),
  entregadores: (empresaId: string) => buildScopedStorageKey('entregadores', empresaId),
};

export const getDeliveryOrders = (empresaId: string) =>
  readCollection<DeliveryOrder>('deliveryOrders', empresaId).filter(order => order.empresaId === empresaId);

export const saveDeliveryOrders = (empresaId: string, orders: DeliveryOrder[]) =>
  writeCollection('deliveryOrders', empresaId, orders.filter(order => order.empresaId === empresaId));

export const addDeliveryOrderToStorage = (empresaId: string, order: DeliveryOrder) => {
  const orders = getDeliveryOrders(empresaId);
  const scopedOrder = { ...order, empresaId };
  saveDeliveryOrders(empresaId, [...orders, scopedOrder]);
  return scopedOrder;
};

export const updateDeliveryOrderInStorage = (empresaId: string, order: DeliveryOrder) => {
  const scopedOrder = { ...order, empresaId };
  const orders = getDeliveryOrders(empresaId).map(current => current.id === order.id ? scopedOrder : current);
  saveDeliveryOrders(empresaId, orders);
  return scopedOrder;
};

export const cancelDeliveryOrderInStorage = (empresaId: string, id: string) => {
  const orders = getDeliveryOrders(empresaId).map(order =>
    order.id === id ? { ...order, empresaId, status: 'cancelado' as const } : order
  );
  saveDeliveryOrders(empresaId, orders);
};

export const getEntregadores = (empresaId: string) =>
  readCollection<Entregador>('entregadores', empresaId).filter(entregador => entregador.empresaId === empresaId);

export const saveEntregadores = (empresaId: string, entregadores: Entregador[]) =>
  writeCollection('entregadores', empresaId, entregadores.filter(entregador => entregador.empresaId === empresaId));

export const addEntregadorToStorage = (empresaId: string, entregador: Entregador) => {
  const entregadores = getEntregadores(empresaId);
  const scopedEntregador = { ...entregador, empresaId };
  saveEntregadores(empresaId, [...entregadores, scopedEntregador]);
  return scopedEntregador;
};

export const updateEntregadorInStorage = (empresaId: string, entregador: Entregador) => {
  const scopedEntregador = { ...entregador, empresaId };
  const entregadores = getEntregadores(empresaId).map(current =>
    current.id === entregador.id ? scopedEntregador : current
  );
  saveEntregadores(empresaId, entregadores);
  return scopedEntregador;
};

export const syncToReports = (orders: DeliveryOrder[]) =>
  orders.filter(order => order.status === 'entregue');

export const calcDeliveryFinancials = (orders: DeliveryOrder[]) => {
  const delivered = syncToReports(orders);
  const receita = delivered.reduce((total, order) => total + order.total, 0);
  const taxas = delivered.reduce((total, order) => total + order.deliveryFee, 0);
  const cancelamentos = orders.filter(order => order.status === 'cancelado').length;

  return {
    receita,
    taxas,
    cancelamentos,
    ticketMedio: delivered.length ? receita / delivered.length : 0,
  };
};

export const calcEntregadorRepasseRows = (orders: DeliveryOrder[], entregadores: Entregador[]) => {
  const deliveredOrders = syncToReports(orders);

  const rows: EntregadorRepasseRow[] = entregadores.map(entregador => {
    const deliveries = deliveredOrders.filter(order => order.entregadorId === entregador.id).length;

    if (entregador.repasseType === 'por_entrega' && typeof entregador.repasseValue === 'number') {
      return {
        entregadorId: entregador.id,
        entregadorName: entregador.name,
        deliveries,
        repasseType: entregador.repasseType,
        repasseValue: entregador.repasseValue,
        repasseAmount: deliveries * entregador.repasseValue,
      };
    }

    if (entregador.repasseType === 'fixo_diario' && typeof entregador.repasseValue === 'number') {
      return {
        entregadorId: entregador.id,
        entregadorName: entregador.name,
        deliveries,
        repasseType: entregador.repasseType,
        repasseValue: entregador.repasseValue,
        repasseAmount: entregador.repasseValue,
      };
    }

    return {
      entregadorId: entregador.id,
      entregadorName: entregador.name,
      deliveries,
      repasseType: entregador.repasseType,
      repasseValue: entregador.repasseValue,
      repasseAmount: null,
    };
  });

  return {
    rows,
    total: rows.reduce((sum, row) => sum + (row.repasseAmount ?? 0), 0),
  };
};
