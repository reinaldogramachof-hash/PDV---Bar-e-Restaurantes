import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  listKitchenOnlineOrders,
  listKitchenOrders,
  updateOnlineOrderStatus,
  updateOrderItems,
} from './kitchenSupabaseService';

interface QueryResult<T> {
  data: T | null;
  error: { message: string } | null;
}

interface QueryState {
  eqCalls: Array<{ column: string; value: string }>;
  inCalls: Array<{ column: string; values: string[] }>;
  orderCalls: Array<{ column: string; ascending: boolean }>;
  updatePayload: Record<string, unknown> | null;
}

const state: QueryState = {
  eqCalls: [],
  inCalls: [],
  orderCalls: [],
  updatePayload: null,
};

let queue: QueryResult<unknown>[] = [];

class MockQuery {
  select(): MockQuery { return this; }
  update(payload: Record<string, unknown>): MockQuery { state.updatePayload = payload; return this; }
  eq(column: string, value: string): MockQuery { state.eqCalls.push({ column, value }); return this; }
  in(column: string, values: string[]): MockQuery { state.inCalls.push({ column, values }); return this; }
  order(column: string, options?: { ascending?: boolean }): MockQuery {
    state.orderCalls.push({ column, ascending: options?.ascending ?? true });
    return this;
  }
  maybeSingle<T>(): Promise<QueryResult<T>> {
    return Promise.resolve((queue.shift() ?? { data: null, error: null }) as QueryResult<T>);
  }
  returns<T>(): MockQuery { return this; }
  then<TResult1 = QueryResult<unknown>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<unknown>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(queue.shift() ?? { data: null, error: null }).then(onfulfilled, onrejected);
  }
}

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => new MockQuery()),
  },
}));

const orderRow = {
  id: 'ord-1', empresa_id: 'empresa-a', mode: 'mesa' as const, table_number: 1, customer_name: 'Mesa 1',
  customer_count: 2, adult_count: 2, children_count: 0, items: [{ id: 'item-1', product: { id: 'p1', empresaId: 'empresa-a', name: 'Pizza', description: '', price: 20, category: 'Pizzas' }, quantity: 1, price: 20, kitchenStatus: 'aguardando' as const }],
  subtotal: 20, service_charge: 2, total: 22, payments: [], partial_payments: null, status: 'open' as const,
  waiter_id: 'w1', customer_id: null, loyalty_discount: null, loyalty_points_earned: null, loyalty_points_redeemed: null,
  timestamp: '2026-05-25T10:00:00.000Z', created_at: '2026-05-25T10:00:00.000Z', updated_at: '2026-05-25T10:00:00.000Z',
};

const onlineRow = {
  id: 'on-1', empresa_id: 'empresa-a', channel: 'delivery' as const, status: 'confirmado' as const,
  items: [{ productId: 'p1', name: 'Pizza', qty: 1, price: 20, kitchenStatus: 'aguardando' as const }],
  customer_name: 'Cliente', customer_phone: '119', table_ref: null, address: 'Rua A', notes: null,
  total: 20, payment_method: 'pix' as const, confirmed_at: null, ready_at: null, delivered_at: null,
  canceled_at: null, cancel_reason: null, stock_deducted_at: null, cashier_recorded_at: null,
  created_at: '2026-05-25T11:00:00.000Z', updated_at: '2026-05-25T11:00:00.000Z',
};

describe('kitchenSupabaseService', () => {
  beforeEach(() => {
    state.eqCalls = [];
    state.inCalls = [];
    state.orderCalls = [];
    state.updatePayload = null;
    queue = [];
  });

  it('listKitchenOrders retorna array mapeado', async () => {
    queue.push({ data: [orderRow], error: null });
    const result = await listKitchenOrders('empresa-a');
    expect(result).toHaveLength(1);
    expect(result[0].empresaId).toBe('empresa-a');
    expect(result[0].items[0].kitchenStatus).toBe('aguardando');
  });

  it('listKitchenOnlineOrders retorna array mapeado', async () => {
    queue.push({ data: [onlineRow], error: null });
    const result = await listKitchenOnlineOrders('empresa-a');
    expect(result).toHaveLength(1);
    expect(result[0].empresaId).toBe('empresa-a');
    expect(result[0].items[0].kitchenStatus).toBe('aguardando');
  });

  it('listKitchenOnlineOrders filtra por empresa_id', async () => {
    queue.push({ data: [onlineRow], error: null });
    await listKitchenOnlineOrders('empresa-a');
    expect(state.eqCalls).toEqual([{ column: 'empresa_id', value: 'empresa-a' }]);
  });

  it('updateOrderItems aplica WHERE id + empresa_id', async () => {
    queue.push({ data: orderRow, error: null });
    await updateOrderItems('empresa-a', 'ord-1', orderRow.items);
    expect(state.eqCalls).toEqual([
      { column: 'id', value: 'ord-1' },
      { column: 'empresa_id', value: 'empresa-a' },
    ]);
  });

  it('updateOrderItems lanca erro quando maybeSingle retorna null', async () => {
    queue.push({ data: null, error: null });
    await expect(updateOrderItems('empresa-b', 'ord-1', orderRow.items)).rejects.toThrow(
      'Pedido nao encontrado para a empresa informada.',
    );
  });

  it('updateOnlineOrderStatus aplica WHERE id + empresa_id', async () => {
    queue.push({ data: onlineRow, error: null });
    await updateOnlineOrderStatus('empresa-a', 'on-1', 'preparo');
    expect(state.eqCalls).toEqual([
      { column: 'id', value: 'on-1' },
      { column: 'empresa_id', value: 'empresa-a' },
    ]);
  });

  it('updateOnlineOrderStatus lanca erro quando null', async () => {
    queue.push({ data: null, error: null });
    await expect(updateOnlineOrderStatus('empresa-b', 'on-1', 'pronto')).rejects.toThrow(
      'Pedido online nao encontrado para a empresa informada.',
    );
  });

  it('relanca erro tipado do Supabase', async () => {
    queue.push({ data: null, error: { message: 'falha-kitchen' } });
    await expect(listKitchenOrders('empresa-a')).rejects.toThrow('Erro ao listar pedidos da cozinha: falha-kitchen');
  });
});
