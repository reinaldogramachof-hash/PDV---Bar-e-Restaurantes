import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearTable,
  listTables,
  reserveTables,
  setTableOccupied,
  transferTable,
  updateTable,
} from './tablesSupabaseService';

interface QueryResult<T> {
  data: T | null;
  error: { message: string } | null;
}

interface QueryState {
  eqCalls: Array<{ column: string; value: string | number }>;
  inCalls: Array<{ column: string; values: number[] }>;
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
  select(): MockQuery {
    return this;
  }

  update(payload: Record<string, unknown>): MockQuery {
    state.updatePayload = payload;
    return this;
  }

  insert(): MockQuery {
    return this;
  }

  eq(column: string, value: string | number): MockQuery {
    state.eqCalls.push({ column, value });
    return this;
  }

  in(column: string, values: number[]): MockQuery {
    state.inCalls.push({ column, values });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): MockQuery {
    state.orderCalls.push({ column, ascending: options?.ascending ?? true });
    return this;
  }

  maybeSingle<T>(): Promise<QueryResult<T>> {
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

const tableRow = {
  id: 'tbl-1',
  empresa_id: 'empresa-a',
  number: 1,
  status: 'livre' as const,
  sector: null,
  active_order_id: null,
  reservation_reason: null,
  created_at: '2026-05-25T10:00:00.000Z',
  updated_at: '2026-05-25T10:00:00.000Z',
};

describe('tablesSupabaseService', () => {
  beforeEach(() => {
    state.eqCalls = [];
    state.inCalls = [];
    state.orderCalls = [];
    state.updatePayload = null;
    queue = [];
  });

  it('listTables filtra empresa_id e ordena por number', async () => {
    queue.push({ data: [tableRow], error: null });

    await listTables('empresa-a');

    expect(state.eqCalls).toEqual([{ column: 'empresa_id', value: 'empresa-a' }]);
    expect(state.orderCalls).toEqual([{ column: 'number', ascending: true }]);
  });

  it('setTableOccupied envia status ocupada e active_order_id', async () => {
    queue.push({ data: { ...tableRow, status: 'ocupada', active_order_id: 'ord-1' }, error: null });

    await setTableOccupied('empresa-a', 1, 'ord-1');

    expect(state.updatePayload?.status).toBe('ocupada');
    expect(state.updatePayload?.active_order_id).toBe('ord-1');
  });

  it('clearTable envia status livre e limpa active_order_id', async () => {
    queue.push({ data: tableRow, error: null });

    await clearTable('empresa-a', 1);

    expect(state.updatePayload?.status).toBe('livre');
    expect(state.updatePayload?.active_order_id).toBeNull();
  });

  it('reserveTables usa status reservada e in(number)', async () => {
    queue.push({ data: null, error: null });

    await reserveTables('empresa-a', [1, 2, 3], 'Evento');

    expect(state.updatePayload?.status).toBe('reservada');
    expect(state.updatePayload?.reservation_reason).toBe('Evento');
    expect(state.inCalls).toEqual([{ column: 'number', values: [1, 2, 3] }]);
  });

  it('transferTable executa clearTable e setTableOccupied em sequencia', async () => {
    queue.push({ data: tableRow, error: null });
    queue.push({ data: { ...tableRow, number: 2, status: 'ocupada', active_order_id: 'ord-9' }, error: null });

    await transferTable('empresa-a', 1, 2, 'ord-9');

    expect(state.eqCalls).toEqual([
      { column: 'empresa_id', value: 'empresa-a' },
      { column: 'number', value: 1 },
      { column: 'empresa_id', value: 'empresa-a' },
      { column: 'number', value: 2 },
    ]);
  });

  it('updateTable lanca erro em guard null cross-empresa', async () => {
    queue.push({ data: null, error: null });

    await expect(updateTable('empresa-b', 1, { status: 'ocupada' })).rejects.toThrow(
      'Mesa nao encontrada para a empresa informada.',
    );
  });
});
