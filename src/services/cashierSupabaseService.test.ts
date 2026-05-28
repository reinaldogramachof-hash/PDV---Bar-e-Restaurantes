import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CloseSessionInput, CreateExpenseInput } from './cashierSupabaseService';
import {
  addExpense,
  closeSession,
  deleteExpense,
  getCurrentSession,
  getExpensesByWindow,
  openSession,
  updateExpense,
} from './cashierSupabaseService';

interface QueryResult<T> {
  data: T | null;
  error: { message: string } | null;
}

interface QueryState {
  eqCalls: Array<{ column: string; value: string }>;
  gteCalls: Array<{ column: string; value: string }>;
  orderCalls: Array<{ column: string; ascending: boolean }>;
  limitCalls: number[];
  insertPayload: Record<string, unknown> | null;
  updatePayload: Record<string, unknown> | null;
}

const state: QueryState = {
  eqCalls: [],
  gteCalls: [],
  orderCalls: [],
  limitCalls: [],
  insertPayload: null,
  updatePayload: null,
};

let queue: QueryResult<unknown>[] = [];

class MockQuery {
  select(): MockQuery {
    return this;
  }

  insert(payload: Record<string, unknown>): MockQuery {
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

  gte(column: string, value: string): MockQuery {
    state.gteCalls.push({ column, value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): MockQuery {
    state.orderCalls.push({ column, ascending: options?.ascending ?? true });
    return this;
  }

  limit(value: number): MockQuery {
    state.limitCalls.push(value);
    return this;
  }

  maybeSingle<T>(): Promise<QueryResult<T>> {
    const result = queue.shift() ?? { data: null, error: null };
    return Promise.resolve(result as QueryResult<T>);
  }

  single<T>(): Promise<QueryResult<T>> {
    const result = queue.shift() ?? { data: null, error: null };
    return Promise.resolve(result as QueryResult<T>);
  }

  returns<T>(): MockQuery {
    return this;
  }

  then<TResult1 = QueryResult<unknown>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<unknown>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    const result = queue.shift() ?? { data: null, error: null };
    return Promise.resolve(result).then(onfulfilled, onrejected);
  }
}

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => new MockQuery()),
  },
}));

const sampleSessionRow = {
  id: 'sess-1',
  empresa_id: 'empresa-a',
  opened_at: '2026-05-25T10:00:00.000Z',
  closed_at: null,
  initial_balance: 100,
  sales_total: 0,
  service_tax_total: 0,
  expenses_total: 0,
  tips_total: 0,
  final_balance: null,
  orders_count: 0,
  status: 'open' as const,
  counted_cash: null,
  cash_breakdown: null,
  created_at: '2026-05-25T10:00:00.000Z',
  updated_at: '2026-05-25T10:00:00.000Z',
};

const sampleExpenseRow = {
  id: 'exp-1',
  empresa_id: 'empresa-a',
  description: 'Gas',
  amount: 50,
  category: 'Insumos' as const,
  status: 'pago' as const,
  entry_type: 'saida' as const,
  payment_method: 'pix' as const,
  due_date: null,
  timestamp: '2026-05-25T11:00:00.000Z',
  cashier_session_id: 'sess-1',
  created_at: '2026-05-25T11:00:00.000Z',
  updated_at: '2026-05-25T11:00:00.000Z',
};

describe('cashierSupabaseService', () => {
  beforeEach(() => {
    state.eqCalls = [];
    state.gteCalls = [];
    state.orderCalls = [];
    state.limitCalls = [];
    state.insertPayload = null;
    state.updatePayload = null;
    queue = [];
  });

  it('getCurrentSession retorna null quando nao ha sessao aberta', async () => {
    queue.push({ data: null, error: null });

    const result = await getCurrentSession('empresa-a');

    expect(result).toBeNull();
  });

  it('openSession lanca erro quando ja existe sessao aberta', async () => {
    queue.push({ data: sampleSessionRow, error: null });

    await expect(openSession('empresa-a', { initialBalance: 100 })).rejects.toThrow(
      'Ja existe uma sessao de caixa aberta para esta empresa.',
    );
  });

  it('openSession insere com empresa_id quando nao existe sessao aberta', async () => {
    queue.push({ data: null, error: null });
    queue.push({ data: sampleSessionRow, error: null });

    await openSession('empresa-a', { initialBalance: 100 });

    expect(state.insertPayload?.empresa_id).toBe('empresa-a');
    expect(state.insertPayload?.status).toBe('open');
  });

  it('closeSession aplica update com WHERE id + empresa_id', async () => {
    const closeInput: CloseSessionInput = {
      salesTotal: 100,
      serviceTaxTotal: 10,
      expensesTotal: 20,
      tipsTotal: 5,
      finalBalance: 195,
      ordersCount: 4,
      countedCash: 200,
      cashBreakdown: 5,
    };

    queue.push({
      data: {
        ...sampleSessionRow,
        status: 'closed',
        closed_at: '2026-05-25T12:00:00.000Z',
      },
      error: null,
    });

    await closeSession('empresa-a', 'sess-1', closeInput);

    expect(state.eqCalls).toEqual([
      { column: 'id', value: 'sess-1' },
      { column: 'empresa_id', value: 'empresa-a' },
    ]);
  });

  it('closeSession lanca erro quando maybeSingle retorna null (cross-empresa)', async () => {
    const closeInput: CloseSessionInput = {
      salesTotal: 100,
      serviceTaxTotal: 10,
      expensesTotal: 20,
      tipsTotal: 5,
      finalBalance: 195,
      ordersCount: 4,
    };

    queue.push({ data: null, error: null });

    await expect(closeSession('empresa-b', 'sess-empresa-a', closeInput)).rejects.toThrow(
      'Sessao de caixa nao encontrada para a empresa informada.',
    );
  });

  it('addExpense inclui empresa_id no insert', async () => {
    const input: CreateExpenseInput = {
      description: 'Gas',
      amount: 50,
      category: 'Insumos',
      status: 'pago',
      entryType: 'saida',
      paymentMethod: 'pix',
      timestamp: '2026-05-25T11:00:00.000Z',
      cashierSessionId: 'sess-1',
    };

    queue.push({ data: sampleExpenseRow, error: null });

    await addExpense('empresa-a', input);

    expect(state.insertPayload?.empresa_id).toBe('empresa-a');
  });

  it('updateExpense aplica WHERE id + empresa_id', async () => {
    queue.push({ data: sampleExpenseRow, error: null });

    await updateExpense('empresa-a', 'exp-1', { description: 'Gas atualizado' });

    expect(state.eqCalls).toEqual([
      { column: 'id', value: 'exp-1' },
      { column: 'empresa_id', value: 'empresa-a' },
    ]);
  });

  it('deleteExpense aplica WHERE id + empresa_id', async () => {
    queue.push({ data: null, error: null });

    await deleteExpense('empresa-a', 'exp-1');

    expect(state.eqCalls).toEqual([
      { column: 'id', value: 'exp-1' },
      { column: 'empresa_id', value: 'empresa-a' },
    ]);
  });

  it('relanca erro tipado do Supabase', async () => {
    queue.push({ data: null, error: { message: 'falha-supabase' } });

    await expect(getCurrentSession('empresa-a')).rejects.toThrow(
      'Erro ao buscar sessao de caixa aberta: falha-supabase',
    );
  });

  it('getExpensesByWindow filtra por empresa_id + timestamp >= openedAt', async () => {
    queue.push({ data: [sampleExpenseRow], error: null });

    await getExpensesByWindow('empresa-a', '2026-05-25T10:00:00.000Z');

    expect(state.eqCalls).toEqual([{ column: 'empresa_id', value: 'empresa-a' }]);
    expect(state.gteCalls).toEqual([{ column: 'timestamp', value: '2026-05-25T10:00:00.000Z' }]);
  });
});
