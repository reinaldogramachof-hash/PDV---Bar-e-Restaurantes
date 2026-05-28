import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cancelDeliveryOrder,
  createDeliveryOrder,
  createEntregador,
  deleteEntregador,
  deliverDeliveryOrder,
  dispatchDeliveryOrder,
  listDeliveryOrders,
  updateDeliveryOrder,
  updateEntregador,
} from './deliverySupabaseService';

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
  delete(): MockQuery { return this; }
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

const orderRow = {
  id: 'd1', empresa_id: 'empresa-a', customer_name: 'Joao', phone: '119', address: 'Rua 1', neighborhood: 'Centro',
  items: [{ name: 'Pizza', qty: 1, price: 10 }], subtotal: 10, delivery_fee: 2, discount: 0, total: 12,
  payment_method: 'pix' as const, status: 'recebido' as const, entregador_id: null, notes: null, cancel_reason: null,
  dispatched_at: null, delivered_at: null, created_at: '2026-05-25T10:00:00.000Z', updated_at: '2026-05-25T10:00:00.000Z',
};

const entregadorRow = {
  id: 'e1', empresa_id: 'empresa-a', name: 'Carlos', phone: '118', vehicle: 'moto' as const, status: 'disponivel' as const,
  repasse_type: 'por_entrega' as const, repasse_value: 8, created_at: '2026-05-25T10:00:00.000Z', updated_at: '2026-05-25T10:00:00.000Z',
};

describe('deliverySupabaseService', () => {
  beforeEach(() => {
    state.eqCalls = []; state.orderCalls = []; state.insertPayload = null; state.updatePayload = null; queue = [];
  });

  it('listDeliveryOrders filtra empresa_id e status opcional', async () => {
    queue.push({ data: [orderRow], error: null });
    await listDeliveryOrders('empresa-a', 'recebido');
    expect(state.eqCalls).toEqual([{ column: 'empresa_id', value: 'empresa-a' }, { column: 'status', value: 'recebido' }]);
  });

  it('createDeliveryOrder envia empresa_id no insert', async () => {
    queue.push({ data: orderRow, error: null });
    await createDeliveryOrder('empresa-a', {
      customerName: 'Joao', phone: '119', address: 'Rua 1', neighborhood: 'Centro', items: [{ name: 'Pizza', qty: 1, price: 10 }],
      subtotal: 10, deliveryFee: 2, discount: 0, total: 12, paymentMethod: 'pix', status: 'recebido',
    });
    expect(state.insertPayload?.empresa_id).toBe('empresa-a');
  });

  it('updateDeliveryOrder aplica WHERE id + empresa_id e guard null', async () => {
    queue.push({ data: null, error: null });
    await expect(updateDeliveryOrder('empresa-a', 'd1', { status: 'preparo' })).rejects.toThrow('Pedido de delivery nao encontrado para a empresa informada.');
  });

  it('cancelDeliveryOrder envia status cancelado e cancel_reason', async () => {
    queue.push({ data: { ...orderRow, status: 'cancelado', cancel_reason: 'Sem motoboy' }, error: null });
    await cancelDeliveryOrder('empresa-a', 'd1', 'Sem motoboy');
    expect(state.updatePayload?.status).toBe('cancelado');
    expect(state.updatePayload?.cancel_reason).toBe('Sem motoboy');
  });

  it('dispatchDeliveryOrder envia status rota, entregador e dispatched_at', async () => {
    queue.push({ data: { ...orderRow, status: 'rota', entregador_id: 'e1', dispatched_at: '2026-05-25T11:00:00.000Z' }, error: null });
    await dispatchDeliveryOrder('empresa-a', 'd1', 'e1');
    expect(state.updatePayload?.status).toBe('rota');
    expect(state.updatePayload?.entregador_id).toBe('e1');
    expect(typeof state.updatePayload?.dispatched_at).toBe('string');
  });

  it('deliverDeliveryOrder envia status entregue e delivered_at', async () => {
    queue.push({ data: { ...orderRow, status: 'entregue', delivered_at: '2026-05-25T11:00:00.000Z' }, error: null });
    await deliverDeliveryOrder('empresa-a', 'd1');
    expect(state.updatePayload?.status).toBe('entregue');
    expect(typeof state.updatePayload?.delivered_at).toBe('string');
  });

  it('createEntregador envia empresa_id no insert', async () => {
    queue.push({ data: entregadorRow, error: null });
    await createEntregador('empresa-a', { name: 'Carlos', phone: '118', vehicle: 'moto', status: 'disponivel', repasseType: 'por_entrega', repasseValue: 8 });
    expect(state.insertPayload?.empresa_id).toBe('empresa-a');
  });

  it('updateEntregador aplica WHERE id + empresa_id', async () => {
    queue.push({ data: entregadorRow, error: null });
    await updateEntregador('empresa-a', 'e1', { status: 'em_rota' });
    expect(state.eqCalls).toEqual([{ column: 'id', value: 'e1' }, { column: 'empresa_id', value: 'empresa-a' }]);
  });

  it('deleteEntregador aplica WHERE id + empresa_id', async () => {
    queue.push({ data: null, error: null });
    await deleteEntregador('empresa-a', 'e1');
    expect(state.eqCalls).toEqual([{ column: 'id', value: 'e1' }, { column: 'empresa_id', value: 'empresa-a' }]);
  });

  it('relanca erro tipado do Supabase', async () => {
    queue.push({ data: null, error: { message: 'falha-delivery' } });
    await expect(listDeliveryOrders('empresa-a')).rejects.toThrow('Erro ao listar pedidos de delivery: falha-delivery');
  });
});
