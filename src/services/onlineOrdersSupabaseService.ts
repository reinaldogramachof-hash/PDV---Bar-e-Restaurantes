import { supabase } from '../lib/supabase';
import type { CartItem, OnlineOrder, OnlineOrderStatus, PaymentMethod } from '../types';

interface OnlineOrderRow {
  id: string;
  empresa_id: string;
  channel: OnlineOrder['channel'];
  status: OnlineOrderStatus;
  items: CartItem[];
  customer_name: string;
  customer_phone: string | null;
  table_ref: string | null;
  address: string | null;
  notes: string | null;
  total: number;
  payment_method: PaymentMethod | null;
  confirmed_at: string | null;
  ready_at: string | null;
  delivered_at: string | null;
  canceled_at: string | null;
  cancel_reason: string | null;
  stock_deducted_at: string | null;
  cashier_recorded_at: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateOnlineOrderInput = Omit<OnlineOrder, 'id' | 'empresaId' | 'createdAt' | 'updatedAt'>;

export interface UpdateOnlineOrderStatusInput {
  status: OnlineOrderStatus;
  confirmedAt?: string;
  readyAt?: string;
  deliveredAt?: string;
  canceledAt?: string;
  cancelReason?: string;
  stockDeductedAt?: string;
  cashierRecordedAt?: string;
}

interface OnlineOrderInsertRow {
  empresa_id: string;
  channel: OnlineOrder['channel'];
  status: OnlineOrderStatus;
  items: CartItem[];
  customer_name: string;
  customer_phone: string | null;
  table_ref: string | null;
  address: string | null;
  notes: string | null;
  total: number;
  payment_method: PaymentMethod | null;
  confirmed_at: string | null;
  ready_at: string | null;
  delivered_at: string | null;
  canceled_at: string | null;
  cancel_reason: string | null;
  stock_deducted_at: string | null;
  cashier_recorded_at: string | null;
}

interface OnlineOrderUpdateRow {
  status?: OnlineOrderStatus;
  confirmed_at?: string | null;
  ready_at?: string | null;
  delivered_at?: string | null;
  canceled_at?: string | null;
  cancel_reason?: string | null;
  stock_deducted_at?: string | null;
  cashier_recorded_at?: string | null;
  updated_at?: string;
}

const throwSupabaseError = (message: string, error: { message: string } | null) => {
  if (error) {
    throw new Error(`${message}: ${error.message}`);
  }
};

const toOnlineOrder = (row: OnlineOrderRow): OnlineOrder => ({
  id: row.id,
  empresaId: row.empresa_id,
  channel: row.channel,
  status: row.status,
  items: row.items,
  customerName: row.customer_name,
  customerPhone: row.customer_phone ?? undefined,
  tableRef: row.table_ref ?? undefined,
  address: row.address ?? undefined,
  notes: row.notes ?? undefined,
  total: row.total,
  paymentMethod: row.payment_method ?? undefined,
  createdAt: row.created_at,
  confirmedAt: row.confirmed_at ?? undefined,
  readyAt: row.ready_at ?? undefined,
  deliveredAt: row.delivered_at ?? undefined,
  canceledAt: row.canceled_at ?? undefined,
  cancelReason: row.cancel_reason ?? undefined,
  stockDeductedAt: row.stock_deducted_at ?? undefined,
  cashierRecordedAt: row.cashier_recorded_at ?? undefined,
});

const toInsertRow = (empresaId: string, data: CreateOnlineOrderInput): OnlineOrderInsertRow => ({
  empresa_id: empresaId,
  channel: data.channel,
  status: data.status,
  items: data.items,
  customer_name: data.customerName,
  customer_phone: data.customerPhone ?? null,
  table_ref: data.tableRef ?? null,
  address: data.address ?? null,
  notes: data.notes ?? null,
  total: data.total,
  payment_method: data.paymentMethod ?? null,
  confirmed_at: data.confirmedAt ?? null,
  ready_at: data.readyAt ?? null,
  delivered_at: data.deliveredAt ?? null,
  canceled_at: data.canceledAt ?? null,
  cancel_reason: data.cancelReason ?? null,
  stock_deducted_at: data.stockDeductedAt ?? null,
  cashier_recorded_at: data.cashierRecordedAt ?? null,
});

export async function listOnlineOrders(empresaId: string, status?: OnlineOrderStatus): Promise<OnlineOrder[]> {
  let query = supabase
    .from('online_orders')
    .select('*')
    .eq('empresa_id', empresaId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .returns<OnlineOrderRow[]>();

  throwSupabaseError('Erro ao listar pedidos online', error);

  return (data ?? []).map(toOnlineOrder);
}

export async function getOnlineOrder(empresaId: string, id: string): Promise<OnlineOrder | null> {
  const { data, error } = await supabase
    .from('online_orders')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('id', id)
    .maybeSingle<OnlineOrderRow>();

  throwSupabaseError('Erro ao buscar pedido online', error);

  return data ? toOnlineOrder(data) : null;
}

export async function createOnlineOrder(empresaId: string, data: CreateOnlineOrderInput): Promise<OnlineOrder> {
  const payload = toInsertRow(empresaId, data);

  const { data: created, error } = await supabase
    .from('online_orders')
    .insert(payload)
    .select('*')
    .single<OnlineOrderRow>();

  throwSupabaseError('Erro ao criar pedido online', error);

  if (!created) {
    throw new Error('Erro ao criar pedido online: resposta vazia do Supabase.');
  }

  return toOnlineOrder(created);
}

export async function updateOnlineOrderStatus(empresaId: string, id: string, data: UpdateOnlineOrderStatusInput): Promise<OnlineOrder> {
  const payload: OnlineOrderUpdateRow = {
    status: data.status,
    confirmed_at: data.confirmedAt,
    ready_at: data.readyAt,
    delivered_at: data.deliveredAt,
    canceled_at: data.canceledAt,
    cancel_reason: data.cancelReason,
    stock_deducted_at: data.stockDeductedAt,
    cashier_recorded_at: data.cashierRecordedAt,
    updated_at: new Date().toISOString(),
  };

  const { data: updated, error } = await supabase
    .from('online_orders')
    .update(payload)
    .eq('id', id)
    .eq('empresa_id', empresaId)
    .select('*')
    .maybeSingle<OnlineOrderRow>();

  throwSupabaseError('Erro ao atualizar status do pedido online', error);

  if (!updated) {
    throw new Error('Pedido online nao encontrado para a empresa informada.');
  }

  return toOnlineOrder(updated);
}

export async function cancelOnlineOrder(empresaId: string, id: string, reason: string): Promise<OnlineOrder> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('online_orders')
    .update({ status: 'cancelado', canceled_at: now, cancel_reason: reason, updated_at: now })
    .eq('id', id)
    .eq('empresa_id', empresaId)
    .select('*')
    .maybeSingle<OnlineOrderRow>();

  throwSupabaseError('Erro ao cancelar pedido online', error);

  if (!data) {
    throw new Error('Pedido online nao encontrado para a empresa informada.');
  }

  return toOnlineOrder(data);
}

export async function markStockDeducted(empresaId: string, id: string): Promise<OnlineOrder> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('online_orders')
    .update({ stock_deducted_at: now, updated_at: now })
    .eq('id', id)
    .eq('empresa_id', empresaId)
    .select('*')
    .maybeSingle<OnlineOrderRow>();

  throwSupabaseError('Erro ao marcar baixa de estoque do pedido online', error);

  if (!data) {
    throw new Error('Pedido online nao encontrado para a empresa informada.');
  }

  return toOnlineOrder(data);
}

export async function markCashierRecorded(empresaId: string, id: string): Promise<OnlineOrder> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('online_orders')
    .update({ cashier_recorded_at: now, updated_at: now })
    .eq('id', id)
    .eq('empresa_id', empresaId)
    .select('*')
    .maybeSingle<OnlineOrderRow>();

  throwSupabaseError('Erro ao marcar registro no caixa do pedido online', error);

  if (!data) {
    throw new Error('Pedido online nao encontrado para a empresa informada.');
  }

  return toOnlineOrder(data);
}
