import { supabase } from '../lib/supabase';
import type { DeliveryOrder, DeliveryOrderItem, Entregador } from '../types';

interface DeliveryOrderRow {
  id: string;
  empresa_id: string;
  customer_name: string;
  phone: string;
  address: string;
  neighborhood: string;
  items: DeliveryOrderItem[];
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  payment_method: DeliveryOrder['paymentMethod'];
  status: DeliveryOrder['status'];
  entregador_id: string | null;
  notes: string | null;
  cancel_reason: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

interface EntregadorRow {
  id: string;
  empresa_id: string;
  name: string;
  phone: string;
  vehicle: Entregador['vehicle'];
  status: Entregador['status'];
  repasse_type: Entregador['repasseType'] | null;
  repasse_value: number | null;
  created_at: string;
  updated_at: string;
}

export type CreateDeliveryOrderInput = Omit<DeliveryOrder, 'id' | 'empresaId' | 'createdAt' | 'updatedAt'>;

export type UpdateDeliveryOrderInput = Partial<Omit<DeliveryOrder, 'id' | 'empresaId' | 'createdAt' | 'updatedAt'>>;

export type CreateEntregadorInput = Omit<Entregador, 'id' | 'empresaId' | 'createdAt'>;

interface DeliveryOrderInsertRow {
  empresa_id: string;
  customer_name: string;
  phone: string;
  address: string;
  neighborhood: string;
  items: DeliveryOrderItem[];
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  payment_method: DeliveryOrder['paymentMethod'];
  status: DeliveryOrder['status'];
  entregador_id: string | null;
  notes: string | null;
  cancel_reason: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
}

interface DeliveryOrderUpdateRow {
  customer_name?: string;
  phone?: string;
  address?: string;
  neighborhood?: string;
  items?: DeliveryOrderItem[];
  subtotal?: number;
  delivery_fee?: number;
  discount?: number;
  total?: number;
  payment_method?: DeliveryOrder['paymentMethod'];
  status?: DeliveryOrder['status'];
  entregador_id?: string | null;
  notes?: string | null;
  cancel_reason?: string | null;
  dispatched_at?: string | null;
  delivered_at?: string | null;
  updated_at?: string;
}

interface EntregadorInsertRow {
  empresa_id: string;
  name: string;
  phone: string;
  vehicle: Entregador['vehicle'];
  status: Entregador['status'];
  repasse_type: Entregador['repasseType'] | null;
  repasse_value: number | null;
}

interface EntregadorUpdateRow {
  name?: string;
  phone?: string;
  vehicle?: Entregador['vehicle'];
  status?: Entregador['status'];
  repasse_type?: Entregador['repasseType'] | null;
  repasse_value?: number | null;
  updated_at?: string;
}

const throwSupabaseError = (message: string, error: { message: string } | null) => {
  if (error) {
    throw new Error(`${message}: ${error.message}`);
  }
};

const toDeliveryOrder = (row: DeliveryOrderRow): DeliveryOrder => ({
  id: row.id,
  empresaId: row.empresa_id,
  customerName: row.customer_name,
  phone: row.phone,
  address: row.address,
  neighborhood: row.neighborhood,
  items: row.items,
  subtotal: row.subtotal,
  deliveryFee: row.delivery_fee,
  discount: row.discount,
  total: row.total,
  paymentMethod: row.payment_method,
  status: row.status,
  entregadorId: row.entregador_id ?? undefined,
  notes: row.notes ?? undefined,
  cancelReason: row.cancel_reason ?? undefined,
  createdAt: row.created_at,
  dispatchedAt: row.dispatched_at ?? undefined,
  deliveredAt: row.delivered_at ?? undefined,
});

const toEntregador = (row: EntregadorRow): Entregador => ({
  id: row.id,
  empresaId: row.empresa_id,
  name: row.name,
  phone: row.phone,
  vehicle: row.vehicle,
  status: row.status,
  repasseType: row.repasse_type ?? undefined,
  repasseValue: row.repasse_value ?? undefined,
  createdAt: row.created_at,
});

const toDeliveryOrderInsertRow = (empresaId: string, data: CreateDeliveryOrderInput): DeliveryOrderInsertRow => ({
  empresa_id: empresaId,
  customer_name: data.customerName,
  phone: data.phone,
  address: data.address,
  neighborhood: data.neighborhood,
  items: data.items,
  subtotal: data.subtotal,
  delivery_fee: data.deliveryFee,
  discount: data.discount,
  total: data.total,
  payment_method: data.paymentMethod,
  status: data.status,
  entregador_id: data.entregadorId ?? null,
  notes: data.notes ?? null,
  cancel_reason: data.cancelReason ?? null,
  dispatched_at: data.dispatchedAt ?? null,
  delivered_at: data.deliveredAt ?? null,
});

const toDeliveryOrderUpdateRow = (data: UpdateDeliveryOrderInput): DeliveryOrderUpdateRow => {
  const payload: DeliveryOrderUpdateRow = { updated_at: new Date().toISOString() };

  if (data.customerName !== undefined) payload.customer_name = data.customerName;
  if (data.phone !== undefined) payload.phone = data.phone;
  if (data.address !== undefined) payload.address = data.address;
  if (data.neighborhood !== undefined) payload.neighborhood = data.neighborhood;
  if (data.items !== undefined) payload.items = data.items;
  if (data.subtotal !== undefined) payload.subtotal = data.subtotal;
  if (data.deliveryFee !== undefined) payload.delivery_fee = data.deliveryFee;
  if (data.discount !== undefined) payload.discount = data.discount;
  if (data.total !== undefined) payload.total = data.total;
  if (data.paymentMethod !== undefined) payload.payment_method = data.paymentMethod;
  if (data.status !== undefined) payload.status = data.status;
  if (data.entregadorId !== undefined) payload.entregador_id = data.entregadorId;
  if (data.notes !== undefined) payload.notes = data.notes;
  if (data.cancelReason !== undefined) payload.cancel_reason = data.cancelReason;
  if (data.dispatchedAt !== undefined) payload.dispatched_at = data.dispatchedAt;
  if (data.deliveredAt !== undefined) payload.delivered_at = data.deliveredAt;

  return payload;
};

const toEntregadorInsertRow = (empresaId: string, data: CreateEntregadorInput): EntregadorInsertRow => ({
  empresa_id: empresaId,
  name: data.name,
  phone: data.phone,
  vehicle: data.vehicle,
  status: data.status,
  repasse_type: data.repasseType ?? null,
  repasse_value: data.repasseValue ?? null,
});

export async function listDeliveryOrders(empresaId: string, status?: DeliveryOrder['status']): Promise<DeliveryOrder[]> {
  let query = supabase
    .from('delivery_orders')
    .select('*')
    .eq('empresa_id', empresaId);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .returns<DeliveryOrderRow[]>();

  throwSupabaseError('Erro ao listar pedidos de delivery', error);

  return (data ?? []).map(toDeliveryOrder);
}

export async function getDeliveryOrder(empresaId: string, id: string): Promise<DeliveryOrder | null> {
  const { data, error } = await supabase
    .from('delivery_orders')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('id', id)
    .maybeSingle<DeliveryOrderRow>();

  throwSupabaseError('Erro ao buscar pedido de delivery', error);

  return data ? toDeliveryOrder(data) : null;
}

export async function createDeliveryOrder(empresaId: string, data: CreateDeliveryOrderInput): Promise<DeliveryOrder> {
  const payload = toDeliveryOrderInsertRow(empresaId, data);

  const { data: created, error } = await supabase
    .from('delivery_orders')
    .insert(payload)
    .select('*')
    .single<DeliveryOrderRow>();

  throwSupabaseError('Erro ao criar pedido de delivery', error);

  if (!created) {
    throw new Error('Erro ao criar pedido de delivery: resposta vazia do Supabase.');
  }

  return toDeliveryOrder(created);
}

export async function updateDeliveryOrder(empresaId: string, id: string, data: UpdateDeliveryOrderInput): Promise<DeliveryOrder> {
  const payload = toDeliveryOrderUpdateRow(data);

  const { data: updated, error } = await supabase
    .from('delivery_orders')
    .update(payload)
    .eq('id', id)
    .eq('empresa_id', empresaId)
    .select('*')
    .maybeSingle<DeliveryOrderRow>();

  throwSupabaseError('Erro ao atualizar pedido de delivery', error);

  if (!updated) {
    throw new Error('Pedido de delivery nao encontrado para a empresa informada.');
  }

  return toDeliveryOrder(updated);
}

export async function cancelDeliveryOrder(empresaId: string, id: string, reason: string): Promise<DeliveryOrder> {
  const { data, error } = await supabase
    .from('delivery_orders')
    .update({ status: 'cancelado', cancel_reason: reason, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('empresa_id', empresaId)
    .select('*')
    .maybeSingle<DeliveryOrderRow>();

  throwSupabaseError('Erro ao cancelar pedido de delivery', error);

  if (!data) {
    throw new Error('Pedido de delivery nao encontrado para a empresa informada.');
  }

  return toDeliveryOrder(data);
}

export async function dispatchDeliveryOrder(empresaId: string, id: string, entregadorId: string): Promise<DeliveryOrder> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('delivery_orders')
    .update({ status: 'rota', entregador_id: entregadorId, dispatched_at: now, updated_at: now })
    .eq('id', id)
    .eq('empresa_id', empresaId)
    .select('*')
    .maybeSingle<DeliveryOrderRow>();

  throwSupabaseError('Erro ao despachar pedido de delivery', error);

  if (!data) {
    throw new Error('Pedido de delivery nao encontrado para a empresa informada.');
  }

  return toDeliveryOrder(data);
}

export async function deliverDeliveryOrder(empresaId: string, id: string): Promise<DeliveryOrder> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('delivery_orders')
    .update({ status: 'entregue', delivered_at: now, updated_at: now })
    .eq('id', id)
    .eq('empresa_id', empresaId)
    .select('*')
    .maybeSingle<DeliveryOrderRow>();

  throwSupabaseError('Erro ao concluir pedido de delivery', error);

  if (!data) {
    throw new Error('Pedido de delivery nao encontrado para a empresa informada.');
  }

  return toDeliveryOrder(data);
}

export async function listEntregadores(empresaId: string): Promise<Entregador[]> {
  const { data, error } = await supabase
    .from('entregadores')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('name', { ascending: true })
    .returns<EntregadorRow[]>();

  throwSupabaseError('Erro ao listar entregadores', error);

  return (data ?? []).map(toEntregador);
}

export async function createEntregador(empresaId: string, data: CreateEntregadorInput): Promise<Entregador> {
  const payload = toEntregadorInsertRow(empresaId, data);

  const { data: created, error } = await supabase
    .from('entregadores')
    .insert(payload)
    .select('*')
    .single<EntregadorRow>();

  throwSupabaseError('Erro ao criar entregador', error);

  if (!created) {
    throw new Error('Erro ao criar entregador: resposta vazia do Supabase.');
  }

  return toEntregador(created);
}

export async function updateEntregador(empresaId: string, id: string, data: Partial<Entregador>): Promise<Entregador> {
  const payload: EntregadorUpdateRow = { updated_at: new Date().toISOString() };

  if (data.name !== undefined) payload.name = data.name;
  if (data.phone !== undefined) payload.phone = data.phone;
  if (data.vehicle !== undefined) payload.vehicle = data.vehicle;
  if (data.status !== undefined) payload.status = data.status;
  if (data.repasseType !== undefined) payload.repasse_type = data.repasseType;
  if (data.repasseValue !== undefined) payload.repasse_value = data.repasseValue;

  const { data: updated, error } = await supabase
    .from('entregadores')
    .update(payload)
    .eq('id', id)
    .eq('empresa_id', empresaId)
    .select('*')
    .maybeSingle<EntregadorRow>();

  throwSupabaseError('Erro ao atualizar entregador', error);

  if (!updated) {
    throw new Error('Entregador nao encontrado para a empresa informada.');
  }

  return toEntregador(updated);
}

export async function deleteEntregador(empresaId: string, id: string): Promise<void> {
  const { error } = await supabase
    .from('entregadores')
    .delete()
    .eq('id', id)
    .eq('empresa_id', empresaId);

  throwSupabaseError('Erro ao excluir entregador', error);
}
