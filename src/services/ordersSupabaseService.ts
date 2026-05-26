import { supabase } from '../lib/supabase';
import type { Order, OrderItem, PartialPaymentItem, PaymentItem } from '../types';

interface OrderRow {
  id: string;
  empresa_id: string;
  mode: 'mesa' | 'balcao';
  table_number: number | null;
  customer_name: string | null;
  customer_count: number | null;
  adult_count: number | null;
  children_count: number | null;
  items: OrderItem[];
  subtotal: number;
  service_charge: number;
  total: number;
  payments: PaymentItem[];
  partial_payments: PartialPaymentItem[] | null;
  status: 'open' | 'closed';
  waiter_id: string;
  customer_id: string | null;
  loyalty_discount: number | null;
  loyalty_points_earned: number | null;
  loyalty_points_redeemed: number | null;
  timestamp: string;
  created_at: string;
  updated_at: string;
}

export type CreateOrderInput = Omit<Order, 'id' | 'empresaId' | 'createdAt' | 'updatedAt'>;

export type UpdateOrderInput = Partial<Omit<Order, 'id' | 'empresaId' | 'createdAt' | 'updatedAt'>>;

export interface CloseOrderInput {
  payments: PaymentItem[];
  serviceCharge: number;
  total: number;
  loyaltyDiscount?: number;
  loyaltyPointsEarned?: number;
  loyaltyPointsRedeemed?: number;
}

interface OrderInsertRow {
  empresa_id: string;
  mode: 'mesa' | 'balcao';
  table_number: number | null;
  customer_name: string | null;
  customer_count: number | null;
  adult_count: number | null;
  children_count: number | null;
  items: OrderItem[];
  subtotal: number;
  service_charge: number;
  total: number;
  payments: PaymentItem[];
  partial_payments: PartialPaymentItem[] | null;
  status: 'open' | 'closed';
  waiter_id: string;
  customer_id: string | null;
  loyalty_discount: number | null;
  loyalty_points_earned: number | null;
  loyalty_points_redeemed: number | null;
  timestamp: string;
}

interface OrderUpdateRow {
  mode?: 'mesa' | 'balcao';
  table_number?: number | null;
  customer_name?: string | null;
  customer_count?: number | null;
  adult_count?: number | null;
  children_count?: number | null;
  items?: OrderItem[];
  subtotal?: number;
  service_charge?: number;
  total?: number;
  payments?: PaymentItem[];
  partial_payments?: PartialPaymentItem[] | null;
  status?: 'open' | 'closed';
  waiter_id?: string;
  customer_id?: string | null;
  loyalty_discount?: number | null;
  loyalty_points_earned?: number | null;
  loyalty_points_redeemed?: number | null;
  timestamp?: string;
  updated_at?: string;
}

const throwSupabaseError = (message: string, error: { message: string } | null) => {
  if (error) {
    throw new Error(`${message}: ${error.message}`);
  }
};

const toOrder = (row: OrderRow): Order => ({
  id: row.id,
  empresaId: row.empresa_id,
  mode: row.mode,
  tableNumber: row.table_number ?? undefined,
  customerName: row.customer_name ?? undefined,
  customerCount: row.customer_count ?? undefined,
  adultCount: row.adult_count ?? undefined,
  childrenCount: row.children_count ?? undefined,
  items: row.items,
  subtotal: row.subtotal,
  serviceCharge: row.service_charge,
  total: row.total,
  payments: row.payments,
  partialPayments: row.partial_payments ?? undefined,
  status: row.status,
  waiterId: row.waiter_id,
  customerId: row.customer_id ?? undefined,
  loyaltyDiscount: row.loyalty_discount ?? undefined,
  loyaltyPointsEarned: row.loyalty_points_earned ?? undefined,
  loyaltyPointsRedeemed: row.loyalty_points_redeemed ?? undefined,
  timestamp: row.timestamp,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toOrderInsertRow = (empresaId: string, data: CreateOrderInput): OrderInsertRow => ({
  empresa_id: empresaId,
  mode: data.mode,
  table_number: data.tableNumber ?? null,
  customer_name: data.customerName ?? null,
  customer_count: data.customerCount ?? null,
  adult_count: data.adultCount ?? null,
  children_count: data.childrenCount ?? null,
  items: data.items,
  subtotal: data.subtotal,
  service_charge: data.serviceCharge,
  total: data.total,
  payments: data.payments,
  partial_payments: data.partialPayments ?? null,
  status: data.status,
  waiter_id: data.waiterId,
  customer_id: data.customerId ?? null,
  loyalty_discount: data.loyaltyDiscount ?? null,
  loyalty_points_earned: data.loyaltyPointsEarned ?? null,
  loyalty_points_redeemed: data.loyaltyPointsRedeemed ?? null,
  timestamp: data.timestamp,
});

const toOrderUpdateRow = (data: UpdateOrderInput): OrderUpdateRow => {
  const payload: OrderUpdateRow = { updated_at: new Date().toISOString() };

  if (data.mode !== undefined) payload.mode = data.mode;
  if (data.tableNumber !== undefined) payload.table_number = data.tableNumber;
  if (data.customerName !== undefined) payload.customer_name = data.customerName;
  if (data.customerCount !== undefined) payload.customer_count = data.customerCount;
  if (data.adultCount !== undefined) payload.adult_count = data.adultCount;
  if (data.childrenCount !== undefined) payload.children_count = data.childrenCount;
  if (data.items !== undefined) payload.items = data.items;
  if (data.subtotal !== undefined) payload.subtotal = data.subtotal;
  if (data.serviceCharge !== undefined) payload.service_charge = data.serviceCharge;
  if (data.total !== undefined) payload.total = data.total;
  if (data.payments !== undefined) payload.payments = data.payments;
  if (data.partialPayments !== undefined) payload.partial_payments = data.partialPayments;
  if (data.status !== undefined) payload.status = data.status;
  if (data.waiterId !== undefined) payload.waiter_id = data.waiterId;
  if (data.customerId !== undefined) payload.customer_id = data.customerId;
  if (data.loyaltyDiscount !== undefined) payload.loyalty_discount = data.loyaltyDiscount;
  if (data.loyaltyPointsEarned !== undefined) payload.loyalty_points_earned = data.loyaltyPointsEarned;
  if (data.loyaltyPointsRedeemed !== undefined) payload.loyalty_points_redeemed = data.loyaltyPointsRedeemed;
  if (data.timestamp !== undefined) payload.timestamp = data.timestamp;

  return payload;
};

export async function listOpenOrders(empresaId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('status', 'open')
    .order('timestamp', { ascending: true })
    .returns<OrderRow[]>();

  throwSupabaseError('Erro ao listar pedidos abertos', error);

  return (data ?? []).map(toOrder);
}

export async function listClosedOrders(empresaId: string, limit = 100): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('status', 'closed')
    .order('timestamp', { ascending: false })
    .limit(limit)
    .returns<OrderRow[]>();

  throwSupabaseError('Erro ao listar pedidos fechados', error);

  return (data ?? []).map(toOrder);
}

export async function getOrder(empresaId: string, id: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('id', id)
    .maybeSingle<OrderRow>();

  throwSupabaseError('Erro ao buscar pedido', error);

  return data ? toOrder(data) : null;
}

export async function createOrder(empresaId: string, data: CreateOrderInput): Promise<Order> {
  const payload = toOrderInsertRow(empresaId, data);

  const { data: created, error } = await supabase
    .from('orders')
    .insert(payload)
    .select('*')
    .single<OrderRow>();

  throwSupabaseError('Erro ao criar pedido', error);

  if (!created) {
    throw new Error('Erro ao criar pedido: resposta vazia do Supabase.');
  }

  return toOrder(created);
}

export async function updateOrder(empresaId: string, id: string, data: UpdateOrderInput): Promise<Order> {
  const payload = toOrderUpdateRow(data);

  const { data: updated, error } = await supabase
    .from('orders')
    .update(payload)
    .eq('id', id)
    .eq('empresa_id', empresaId)
    .select('*')
    .maybeSingle<OrderRow>();

  throwSupabaseError('Erro ao atualizar pedido', error);

  if (!updated) {
    throw new Error('Pedido nao encontrado para a empresa informada.');
  }

  return toOrder(updated);
}

export async function closeOrder(empresaId: string, id: string, data: CloseOrderInput): Promise<Order> {
  const now = new Date().toISOString();

  const { data: closed, error } = await supabase
    .from('orders')
    .update({
      status: 'closed',
      payments: data.payments,
      service_charge: data.serviceCharge,
      total: data.total,
      loyalty_discount: data.loyaltyDiscount ?? null,
      loyalty_points_earned: data.loyaltyPointsEarned ?? null,
      loyalty_points_redeemed: data.loyaltyPointsRedeemed ?? null,
      updated_at: now,
    })
    .eq('id', id)
    .eq('empresa_id', empresaId)
    .select('*')
    .maybeSingle<OrderRow>();

  throwSupabaseError('Erro ao fechar pedido', error);

  if (!closed) {
    throw new Error('Pedido nao encontrado para a empresa informada.');
  }

  return toOrder(closed);
}

export async function deleteOrder(empresaId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', id)
    .eq('empresa_id', empresaId);

  throwSupabaseError('Erro ao excluir pedido', error);
}

export async function updateOrderItems(empresaId: string, id: string, items: OrderItem[]): Promise<Order> {
  const now = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from('orders')
    .update({ items, updated_at: now })
    .eq('id', id)
    .eq('empresa_id', empresaId)
    .select('*')
    .maybeSingle<OrderRow>();

  throwSupabaseError('Erro ao atualizar itens do pedido', error);

  if (!updated) {
    throw new Error('Pedido nao encontrado para a empresa informada.');
  }

  return toOrder(updated);
}
