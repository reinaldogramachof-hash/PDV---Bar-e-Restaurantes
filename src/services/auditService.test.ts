import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logEvent, queryLogs, purgeOldLogs, exportCSV } from './auditService';
import { AuditLogEntry } from '../types';
import { buildScopedStorageKey } from '../domain/saas';

describe('auditService', () => {
  const empresaId = 'test-empresa-123';
  const storageKey = buildScopedStorageKey('auditLogs', empresaId);

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve registrar um novo evento de log', () => {
    logEvent({
      type: 'login',
      userId: 'u1',
      userName: 'User 1',
      detail: 'Login do usuário',
      empresaId,
    }, empresaId);

    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    expect(stored.length).toBe(1);
    expect(stored[0].type).toBe('login');
    expect(stored[0].empresaId).toBe(empresaId);
    expect(stored[0].id).toBeDefined();
    expect(stored[0].timestamp).toBeDefined();
  });

  it('deve realizar query dos logs com paginação e filtro', () => {
    logEvent({ type: 'login', userId: 'u1', userName: 'User 1', detail: 'Login', empresaId }, empresaId);
    logEvent({ type: 'cashier_open', userId: 'u2', userName: 'User 2', detail: 'Open', empresaId }, empresaId);
    logEvent({ type: 'login', userId: 'u3', userName: 'User 3', detail: 'Login 2', empresaId }, empresaId);

    const resAll = queryLogs(empresaId);
    expect(resAll.total).toBe(3);

    const resFilter = queryLogs(empresaId, { type: 'login' });
    expect(resFilter.total).toBe(2);
    expect(resFilter.logs[0].type).toBe('login');

    const resPagination = queryLogs(empresaId, { page: 1, pageSize: 2 });
    expect(resPagination.logs.length).toBe(2);
    expect(resPagination.pages).toBe(2);
  });

  it('deve exportar CSV corretamente', () => {
    vi.setSystemTime(new Date('2023-01-01T12:00:00Z'));
    logEvent({ type: 'login', userId: 'u1', userName: 'João', detail: 'Acesso', extra: { ip: '127.0.0.1' }, empresaId }, empresaId);
    
    const res = queryLogs(empresaId);
    const csv = exportCSV(res.logs);
    
    expect(csv).toContain('Data/Hora,Tipo,Usuário,Detalhe,Extras');
    expect(csv).toContain('"login","João","Acesso","{""ip"":""127.0.0.1""}"');
  });

  it('deve purgar logs antigos (> 90 dias)', () => {
    // Hoje é dia 100
    vi.setSystemTime(new Date('2023-04-10T12:00:00Z'));

    // Criar log com timestamp manual para forçar data antiga (dia 1)
    const logs: AuditLogEntry[] = [
      {
        id: '1',
        empresaId,
        type: 'login',
        userId: 'u1',
        userName: 'User 1',
        timestamp: new Date('2023-01-01T12:00:00Z').toISOString(), // 99 dias atrás (será removido)
        detail: 'Velho'
      },
      {
        id: '2',
        empresaId,
        type: 'login',
        userId: 'u1',
        userName: 'User 1',
        timestamp: new Date('2023-04-09T12:00:00Z').toISOString(), // 1 dia atrás (será mantido)
        detail: 'Novo'
      }
    ];
    localStorage.setItem(storageKey, JSON.stringify(logs));

    purgeOldLogs(empresaId);

    const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
    expect(stored.length).toBe(1);
    expect(stored[0].id).toBe('2');
  });

  it('logs da empresa-a não aparecem na empresa-b', () => {
    logEvent({ type: 'login', userId: 'u1', userName: 'User', detail: 'A', empresaId: 'empresa-a' }, 'empresa-a');
    const res = queryLogs('empresa-b');
    expect(res.total).toBe(0);
  });

  it('logEvent não lança exceção quando storage falha', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceeded'); });
    expect(() => logEvent({ type: 'login', userId: 'u1', userName: 'U', detail: 'X', empresaId }, empresaId)).not.toThrow();
  });
});
