import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MenuDigitalConfig, RecipeItem } from '../types';

interface ProductRow {
  id: string;
  empresa_id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  recipe: RecipeItem[] | null;
  image: string | null;
  active: boolean | null;
  menu_digital: MenuDigitalConfig | null;
  created_at: string;
  updated_at: string;
}

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

let currentResult: QueryResult<unknown> = { data: null, error: null };

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

  order(column: string, options?: { ascending?: boolean }): MockQuery {
    state.orderCalls.push({ column, ascending: options?.ascending ?? true });
    return this;
  }

  maybeSingle<T>(): Promise<QueryResult<T>> {
    return Promise.resolve(currentResult as QueryResult<T>);
  }

  single<T>(): Promise<QueryResult<T>> {
    return Promise.resolve(currentResult as QueryResult<T>);
  }

  returns<T>(): MockQuery {
    return this;
  }

  then<TResult1 = QueryResult<unknown>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<unknown>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(currentResult).then(onfulfilled, onrejected);
  }
}

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => new MockQuery()),
  },
}));

import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  toggleProductActive,
  updateProduct,
} from './productsSupabaseService';

const sampleRow: ProductRow = {
  id: 'prod-1',
  empresa_id: 'empresa-a',
  name: 'Pizza',
  description: 'Mussarela',
  price: 49.9,
  category: 'Pizzas',
  recipe: [{ stockItemId: 'stock-1', quantity: 0.3 }],
  image: 'img-base64',
  active: true,
  menu_digital: { visible: true },
  created_at: '2026-05-25T10:00:00.000Z',
  updated_at: '2026-05-25T10:10:00.000Z',
};

describe('productsSupabaseService', () => {
  beforeEach(() => {
    state.eqCalls = [];
    state.orderCalls = [];
    state.insertPayload = null;
    state.updatePayload = null;
    currentResult = { data: null, error: null };
  });

  it('listProducts retorna array mapeado corretamente', async () => {
    currentResult = { data: [sampleRow], error: null };

    const products = await listProducts('empresa-a');

    expect(products).toHaveLength(1);
    expect(products[0].empresaId).toBe('empresa-a');
    expect(products[0].menuDigital?.visible).toBe(true);
    expect(state.eqCalls).toEqual([{ column: 'empresa_id', value: 'empresa-a' }]);
    expect(state.orderCalls).toEqual([
      { column: 'category', ascending: true },
      { column: 'name', ascending: true },
    ]);
  });

  it('createProduct envia empresa_id no insert', async () => {
    currentResult = { data: sampleRow, error: null };

    await createProduct('empresa-a', {
      name: 'Pizza',
      description: 'Mussarela',
      price: 49.9,
      category: 'Pizzas',
      recipe: [{ stockItemId: 'stock-1', quantity: 0.3 }],
      image: 'img-base64',
      active: true,
      menuDigital: { visible: true },
    });

    expect(state.insertPayload?.empresa_id).toBe('empresa-a');
  });

  it('updateProduct valida filtro com id e empresa_id', async () => {
    currentResult = { data: sampleRow, error: null };

    await updateProduct('empresa-a', 'prod-1', { name: 'Pizza Premium' });

    expect(state.eqCalls).toEqual([
      { column: 'id', value: 'prod-1' },
      { column: 'empresa_id', value: 'empresa-a' },
    ]);
  });

  it('deleteProduct valida filtro com id e empresa_id', async () => {
    currentResult = { data: null, error: null };

    await deleteProduct('empresa-a', 'prod-1');

    expect(state.eqCalls).toEqual([
      { column: 'id', value: 'prod-1' },
      { column: 'empresa_id', value: 'empresa-a' },
    ]);
  });

  it('relanca erro tipado do Supabase', async () => {
    currentResult = { data: null, error: { message: 'falha-rpc' } };

    await expect(listProducts('empresa-a')).rejects.toThrow('Erro ao listar produtos: falha-rpc');
  });

  it('cross-empresa retorna null/sem vazamento quando RLS filtra', async () => {
    currentResult = { data: null, error: null };

    const product = await getProduct('empresa-b', 'prod-empresa-a');

    expect(product).toBeNull();
  });

  it('toggleProductActive atualiza active com isolamento por empresa', async () => {
    currentResult = { data: null, error: null };

    await toggleProductActive('empresa-a', 'prod-1', false);

    expect(state.eqCalls).toEqual([
      { column: 'id', value: 'prod-1' },
      { column: 'empresa_id', value: 'empresa-a' },
    ]);
    expect(state.updatePayload?.active).toBe(false);
  });
});
