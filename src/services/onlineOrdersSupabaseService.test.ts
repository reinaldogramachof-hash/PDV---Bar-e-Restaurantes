import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cancelOnlineOrder,
  createOnlineOrder,
  listOnlineOrders,
  markCashierRecorded,
  markStockDeducted,
  updateOnlineOrderStatus,
} from './onlineOrdersSupabaseService';

interface QueryResult<T> {
  data: T | null;
  error: { message: string } | null;
}

interface QueryState {
  eqCalls: Array<{ column: string; value: string }>;
  orderCalls: Array<{ column: string; ascending: boolean }>;
  insertPayload: Record<string, unknown> | null;
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
  select(): MockQuery { return this; }
  insert(payload: Record<string, unknown>): MockQuery { state.insertPayload = payload; return this; }
  update(payload: Record<string, unknown>): MockQuery { state.updatePayload = payload; return this; }
  eq(column: string, value: string): MockQuery { state.eqCalls.push({ column, value }); return this; }
  order(column: string, options?: { ascending?: boolean }): MockQuery { state.orderCalls.push({ column, ascending: options?.ascending ?? true }); return this; }
  maybeSingle<T>(): Promise<QueryResult<T>> { return Promise.resolve((queue.shift() ?? { data: null, error: null }) as QueryResult<T>); }
  single<T>(): Promise<QueryResult<T>> { return Promise.resolve((queue.shift() ?? { data: null, error: null }) as QueryResult<T>); }
  returns<T>(): MockQuery { return this; }
  then<TResult1 = QueryResult<unknown>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<unknown>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(queue.shift() ?? { data: null, error: null }).then(onfulfilled, onrejected);
  }
}

vi.mock('../lib/supabase', () => ({ supabase: { from: vi.fn(() => new MockQuery()) } }));

const onlineRow = {
  id: 'o1', empresa_id: 'empresa-a', channel: 'delivery' as const, status: 'recebido' as const,
  items: [{ productId: 'p1', name: 'Pizza', qty: 1, price: 10 }], customer_name: 'Ana', customer_phone: '119',
  table_ref: null, address: 'Rua A', notes: null, total: 10, payment_method: 'pix' as const,
  confirmed_at: null, ready_at: null, delivered_at: null, canceled_at: null, cancel_reason: null,
  stock_deducted_at: null, cashier_recorded_at: null, created_at: '2026-05-25T10:00:00.000Z', updated_at: '2026-05-25T10:00:00.000Z',
};

describe('onlineOrdersSupabaseService', () => {
  beforeEach(() => {
    state.eqCalls = []; state.orderCalls = []; state.insertPayload = null; state.updatePayload = null; queue = [];
  });

  it('listOnlineOrders filtra por empresa_id e status opcional', async () => {
    queue.push({ data: [onlineRow], error: null });
    await listOnlineOrders('empresa-a', 'recebido');
    expect(state.eqCalls).toEqual([{ column: 'empresa_id', value: 'empresa-a' }, { column: 'status', value: 'recebido' }]);
  });

  it('createOnlineOrder envia empresa_id no insert', async () => {
    queue.push({ data: onlineRow, error: null });
    await createOnlineOrder('empresa-a', {
      channel: 'delivery', status: 'recebido', items: [{ productId: 'p1', name: 'Pizza', qty: 1, price: 10 }],
      customerName: 'Ana', address: 'Rua A', total: 10,
    });
    expect(state.insertPayload?.empresa_id).toBe('empresa-a');
  });

  it('updateOnlineOrderStatus aplica WHERE id + empresa_id com status no payload', async () => {
    queue.push({ data: { ...onlineRow, status: 'confirmado' }, error: null });
    await updateOnlineOrderStatus('empresa-a', 'o1', { status: 'confirmado' });
    expect(state.eqCalls).toEqual([{ column: 'id', value: 'o1' }, { column: 'empresa_id', value: 'empresa-a' }]);
    expect(state.updatePayload?.status).toBe('confirmado');
  });

  it('cancelOnlineOrder envia status cancelado, canceled_at e cancel_reason', async () => {
    queue.push({ data: { ...onlineRow, status: 'cancelado' }, error: null });
    await cancelOnlineOrder('empresa-a', 'o1', 'Cliente desistiu');
    expect(state.updatePayload?.status).toBe('cancelado');
    expect(typeof state.updatePayload?.canceled_at).toBe('string');
    expect(state.updatePayload?.cancel_reason).toBe('Cliente desistiu');
  });

  it('markStockDeducted envia stock_deducted_at', async () => {
    queue.push({ data: onlineRow, error: null });
    await markStockDeducted('empresa-a', 'o1');
    expect(typeof state.updatePayload?.stock_deducted_at).toBe('string');
  });

  it('markCashierRecorded envia cashier_recorded_at', async () => {
    queue.push({ data: onlineRow, error: null });
    await markCashierRecorded('empresa-a', 'o1');
    expect(typeof state.updatePayload?.cashier_recorded_at).toBe('string');
  });

  it('guard null cross-empresa em updateOnlineOrderStatus', async () => {
    queue.push({ data: null, error: null });
    await expect(updateOnlineOrderStatus('empresa-b', 'o1', { status: 'pronto' })).rejects.toThrow('Pedido online nao encontrado para a empresa informada.');
  });

  it('relanca erro tipado do Supabase', async () => {
    queue.push({ data: null, error: { message: 'falha-online' } });
    await expect(listOnlineOrders('empresa-a')).rejects.toThrow('Erro ao listar pedidos online: falha-online');
  });
});
