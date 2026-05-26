import { supabase } from '../lib/supabase';
import type {
  OnlineOrder,
  OnlineOrderStatus,
  CartItem,
  PaymentMethod,
  Order,
  OrderItem,
  PartialPaymentItem,
  PaymentItem,
} from '../types';

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

export async function listKitchenOrders(empresaId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('status', 'open')
    .order('timestamp', { ascending: true })
    .returns<OrderRow[]>();

  throwSupabaseError('Erro ao listar pedidos da cozinha', error);

  return (data ?? []).map(toOrder);
}

export async function listKitchenOnlineOrders(empresaId: string): Promise<OnlineOrder[]> {
  const { data, error } = await supabase
    .from('online_orders')
    .select('*')
    .eq('empresa_id', empresaId)
    .in('status', ['confirmado', 'preparo', 'pronto'])
    .order('created_at', { ascending: true })
    .returns<OnlineOrderRow[]>();

  throwSupabaseError('Erro ao listar pedidos online da cozinha', error);

  return (data ?? []).map(toOnlineOrder);
}

export async function updateOrderItems(empresaId: string, orderId: string, items: OrderItem[]): Promise<Order> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('orders')
    .update({ items, updated_at: now })
    .eq('id', orderId)
    .eq('empresa_id', empresaId)
    .select('*')
    .maybeSingle<OrderRow>();

  throwSupabaseError('Erro ao atualizar itens do pedido da cozinha', error);

  if (!data) {
    throw new Error('Pedido nao encontrado para a empresa informada.');
  }

  return toOrder(data);
}

export async function updateOnlineOrderStatus(empresaId: string, id: string, status: OnlineOrderStatus): Promise<OnlineOrder> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('online_orders')
    .update({ status, updated_at: now })
    .eq('id', id)
    .eq('empresa_id', empresaId)
    .select('*')
    .maybeSingle<OnlineOrderRow>();

  throwSupabaseError('Erro ao atualizar status do pedido online da cozinha', error);

  if (!data) {
    throw new Error('Pedido online nao encontrado para a empresa informada.');
  }

  return toOnlineOrder(data);
}
