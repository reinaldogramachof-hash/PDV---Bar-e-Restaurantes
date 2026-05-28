import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createEntry, listEntries, listAuditLog, logAction } from './diarioService';

interface QueryResult<T> {
  data: T | null;
  error: { message: string } | null;
}

interface QueryState {
  eqCalls: Array<{ column: string; value: string }>;
  neqCalls: Array<{ column: string; value: string }>;
  insertPayload: Record<string, unknown> | null;
  updatePayload: Record<string, unknown> | null;
}

const state: QueryState = {
  eqCalls: [],
  neqCalls: [],
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
  neq(column: string, value: string): MockQuery { state.neqCalls.push({ column, value }); return this; }
  order(): MockQuery { return this; }
  limit(): MockQuery { return this; }
  single<T>(): Promise<QueryResult<T>> { return Promise.resolve((queue.shift() ?? { data: null, error: null }) as QueryResult<T>); }
  maybeSingle<T>(): Promise<QueryResult<T>> { return Promise.resolve((queue.shift() ?? { data: null, error: null }) as QueryResult<T>); }
  returns<T>(): Promise<QueryResult<T>> { return Promise.resolve((queue.shift() ?? { data: [], error: null }) as QueryResult<T>); }
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
    storage: {
      listBuckets: vi.fn(async () => ({ data: [], error: null })),
      createBucket: vi.fn(async () => ({ data: null, error: null })),
      from: vi.fn(() => ({
        upload: vi.fn(async () => ({ data: {}, error: null })),
        createSignedUrl: vi.fn(async () => ({ data: { signedUrl: 'x' }, error: null })),
      })),
    },
  },
}));

describe('diarioService', () => {
  beforeEach(() => {
    state.eqCalls = [];
    state.neqCalls = [];
    state.insertPayload = null;
    state.updatePayload = null;
    queue = [];
  });

  it('cria entry com empresa_id correto', async () => {
    queue.push({ data: null, error: null });
    queue.push({
      data: {
        id: 'e1', empresa_id: 'empresa-a', author_id: 'u1', author_codigo: null, categoria: 'operacional',
        titulo: 't', corpo: 'c', resolucao: null, ocorrencias: 1, status: 'aberto', escalado_em: null,
        attachments: [], expires_at: '2028-01-01T00:00:00.000Z', created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z', updated_by: null,
      }, error: null,
    });

    await createEntry({
      empresaId: 'empresa-a',
      authorId: 'u1',
      categoria: 'operacional',
      titulo: 't',
      corpo: 'c',
      attachments: [],
      expiresAt: '2028-01-01T00:00:00.000Z',
    });

    expect(state.insertPayload?.empresa_id).toBe('empresa-a');
  });

  it('reincidencia na 3a ocorrencia escala automaticamente', async () => {
    queue.push({
      data: {
        id: 'e1', empresa_id: 'empresa-a', author_id: 'u1', author_codigo: null, categoria: 'operacional',
        titulo: 't', corpo: 'c', resolucao: null, ocorrencias: 2, status: 'aberto', escalado_em: null,
        attachments: [], expires_at: '2028-01-01T00:00:00.000Z', created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z', updated_by: null,
      }, error: null,
    });
    queue.push({
      data: {
        id: 'e1', empresa_id: 'empresa-a', author_id: 'u1', author_codigo: null, categoria: 'operacional',
        titulo: 't2', corpo: 'c2', resolucao: null, ocorrencias: 3, status: 'escalado', escalado_em: '2026-01-01T01:00:00.000Z',
        attachments: [], expires_at: '2028-01-01T00:00:00.000Z', created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T01:00:00.000Z', updated_by: null,
      }, error: null,
    });

    await createEntry({
      empresaId: 'empresa-a',
      authorId: 'u1',
      categoria: 'operacional',
      titulo: 't2',
      corpo: 'c2',
      attachments: [],
      expiresAt: '2028-01-01T00:00:00.000Z',
    });

    expect(state.updatePayload?.ocorrencias).toBe(3);
    expect(state.updatePayload?.status).toBe('escalado');
  });

  it('isolamento multiempresa: query sempre inclui empresa_id', async () => {
    queue.push({ data: [], error: null });
    await listEntries('empresa-b');
    expect(state.eqCalls).toContainEqual({ column: 'empresa_id', value: 'empresa-b' });
  });

  it('master sem filtro de autor consulta todas as entries da empresa', async () => {
    queue.push({ data: [], error: null });
    await listEntries('empresa-a');
    expect(state.eqCalls).toContainEqual({ column: 'empresa_id', value: 'empresa-a' });
    expect(state.eqCalls.some(call => call.column === 'author_id')).toBe(false);
  });

  it('audit log registra actions create, escalate e resolve', async () => {
    queue.push({ data: null, error: null });
    await logAction({ empresaId: 'empresa-a', entryId: 'e1', userId: 'u1', userRole: 'gerente', action: 'create', metadata: {} });
    expect(state.insertPayload?.action).toBe('create');

    queue.push({ data: null, error: null });
    await logAction({ empresaId: 'empresa-a', entryId: 'e1', userId: 'u1', userRole: 'gerente', action: 'escalate', metadata: {} });
    expect(state.insertPayload?.action).toBe('escalate');

    queue.push({ data: null, error: null });
    await logAction({ empresaId: 'empresa-a', entryId: 'e1', userId: 'u1', userRole: 'gerente', action: 'resolve', metadata: {} });
    expect(state.insertPayload?.action).toBe('resolve');
  });

  it('gerente pode filtrar por proprio authorId', async () => {
    queue.push({ data: [], error: null });
    await listEntries('empresa-a', { authorId: 'gerente-1' });
    expect(state.eqCalls).toContainEqual({ column: 'author_id', value: 'gerente-1' });
  });

  it('listAuditLog filtra por empresa no select', async () => {
    queue.push({ data: [], error: null });
    await listAuditLog('empresa-a');
    expect(state.eqCalls).toContainEqual({ column: 'empresa_id', value: 'empresa-a' });
  });
});
