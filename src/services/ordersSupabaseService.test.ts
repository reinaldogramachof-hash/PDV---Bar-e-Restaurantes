import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OrderItem } from '../types';
import type { CloseOrderInput, CreateOrderInput } from './ordersSupabaseService';
import {
  closeOrder,
  createOrder,
  deleteOrder,
  listOpenOrders,
  updateOrder,
  updateOrderItems,
} from './ordersSupabaseService';

interface QueryResult<T> {
  data: T | null;
  error: { message: string } | null;
}

interface QueryState {
  eqCalls: Array<{ column: string; value: string }>;
  orderCalls: Array<{ column: string; ascending: boolean }>;
  insertPayload: Record<string, unknown> | Record<string, unknown>[] | null;
  updatePayload: Record<string, unknown> | null;
}

const state: QueryState = {
  eqCalls: [],
  orderCalls: [],
  insertPayload: null,
  updatePayload: null,
};

let queue: QueryResult<unknown>[] = [];

class MockQuery {
  select(): MockQuery {
    return this;
  }

  insert(payload: Record<string, unknown> | Record<string, unknown>[]): MockQuery {
    state.insertPayload = payload;
    return this;
  }

  update(payload: Record<string, unknown>): MockQuery {
    state.updatePayload = payload;
    return this;
  }

  delete(): MockQuery {
    return this;
  }

  eq(column: string, value: string): MockQuery {
    state.eqCalls.push({ column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): MockQuery {
    state.orderCalls.push({ column, ascending: options?.ascending ?? true });
    return this;
  }

  limit(): MockQuery {
    return this;
  }

  maybeSingle<T>(): Promise<QueryResult<T>> {
    return Promise.resolve((queue.shift() ?? { data: null, error: null }) as QueryResult<T>);
  }

  single<T>(): Promise<QueryResult<T>> {
    return Promise.resolve((queue.shift() ?? { data: null, error: null }) as QueryResult<T>);
  }

  returns<T>(): MockQuery {
    return this;
  }

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

const sampleOrderRow = {
  id: 'ord-1',
  empresa_id: 'empresa-a',
  mode: 'mesa' as const,
  table_number: 10,
  customer_name: 'Cliente',
  customer_count: 2,
  adult_count: 2,
  children_count: 0,
  items: [{ id: 'item-1', product: { id: 'p1', empresaId: 'empresa-a', name: 'Pizza', description: '', price: 10, category: 'Pizzas' }, quantity: 1, price: 10 }],
  subtotal: 10,
  service_charge: 1,
  total: 11,
  payments: [{ method: 'pix' as const, amount: 11 }],
  partial_payments: null,
  status: 'open' as const,
  waiter_id: 'w1',
  customer_id: null,
  loyalty_discount: null,
  loyalty_points_earned: null,
  loyalty_points_redeemed: null,
  timestamp: '2026-05-25T10:00:00.000Z',
  created_at: '2026-05-25T10:00:00.000Z',
  updated_at: '2026-05-25T10:00:00.000Z',
};

describe('ordersSupabaseService', () => {
  beforeEach(() => {
    state.eqCalls = [];
    state.orderCalls = [];
    state.insertPayload = null;
    state.updatePayload = null;
    queue = [];
  });

  it('listOpenOrders filtra por status open e empresa_id', async () => {
    queue.push({ data: [sampleOrderRow], error: null });

    await listOpenOrders('empresa-a');

    expect(state.eqCalls).toEqual([
      { column: 'empresa_id', value: 'empresa-a' },
      { column: 'status', value: 'open' },
    ]);
  });

  it('createOrder envia empresa_id no insert', async () => {
    const input: CreateOrderInput = {
      mode: 'mesa',
      tableNumber: 10,
      customerName: 'Cliente',
      customerCount: 2,
      adultCount: 2,
      childrenCount: 0,
      items: sampleOrderRow.items,
      subtotal: 10,
      serviceCharge: 1,
      total: 11,
      payments: [{ method: 'pix', amount: 11 }],
      status: 'open',
      waiterId: 'w1',
      timestamp: '2026-05-25T10:00:00.000Z',
    };

    queue.push({ data: sampleOrderRow, error: null });

    await createOrder('empresa-a', input);

    expect((state.insertPayload as Record<string, unknown>).empresa_id).toBe('empresa-a');
  });

  it('updateOrder aplica WHERE id + empresa_id', async () => {
    queue.push({ data: sampleOrderRow, error: null });

    await updateOrder('empresa-a', 'ord-1', { customerName: 'Novo Cliente' });

    expect(state.eqCalls).toEqual([
      { column: 'id', value: 'ord-1' },
      { column: 'empresa_id', value: 'empresa-a' },
    ]);
  });

  it('updateOrder lanca erro em guard null cross-empresa', async () => {
    queue.push({ data: null, error: null });

    await expect(updateOrder('empresa-b', 'ord-a', { total: 50 })).rejects.toThrow(
      'Pedido nao encontrado para a empresa informada.',
    );
  });

  it('closeOrder aplica WHERE id + empresa_id e status closed no payload', async () => {
    const input: CloseOrderInput = {
      payments: [{ method: 'pix', amount: 11 }],
      serviceCharge: 1,
      total: 11,
    };

    queue.push({ data: { ...sampleOrderRow, status: 'closed' }, error: null });

    await closeOrder('empresa-a', 'ord-1', input);

    expect(state.eqCalls).toEqual([
      { column: 'id', value: 'ord-1' },
      { column: 'empresa_id', value: 'empresa-a' },
    ]);
    expect(state.updatePayload?.status).toBe('closed');
  });

  it('deleteOrder aplica WHERE id + empresa_id', async () => {
    queue.push({ data: null, error: null });

    await deleteOrder('empresa-a', 'ord-1');

    expect(state.eqCalls).toEqual([
      { column: 'id', value: 'ord-1' },
      { column: 'empresa_id', value: 'empresa-a' },
    ]);
  });

  it('updateOrderItems envia items no payload com WHERE id + empresa_id', async () => {
    const items: OrderItem[] = sampleOrderRow.items;
    queue.push({ data: sampleOrderRow, error: null });

    await updateOrderItems('empresa-a', 'ord-1', items);

    expect(state.eqCalls).toEqual([
      { column: 'id', value: 'ord-1' },
      { column: 'empresa_id', value: 'empresa-a' },
    ]);
    expect(state.updatePayload?.items).toEqual(items);
  });

  it('relanca erro tipado do Supabase', async () => {
    queue.push({ data: null, error: { message: 'falha-orders' } });

    await expect(listOpenOrders('empresa-a')).rejects.toThrow('Erro ao listar pedidos abertos: falha-orders');
  });
});
