# Skill: Auditoria — Log de Ações Sensíveis

**Quando usar:** Registrar ações críticas do sistema (login, backup, restore, exclusão, caixa)  
**Tempo:** 2–4h  
**Dependências:** rules/security.md — sem dados sensíveis em logs

---

## Conceito Central

```
Ação sensível ocorre
      ↓
auditService.log() registra: quem, o quê, quando, qual empresa
      ↓
Log armazenado no storage isolado por empresa
      ↓
AuditLog view exibe histórico (somente leitura)
```

---

## 1. Tipos de Evento de Auditoria

```typescript
// src/domain/saas.ts — adicionar
export type AuditEventType =
  | 'login'
  | 'logout'
  | 'backup_export'
  | 'backup_restore'
  | 'caixa_aberto'
  | 'caixa_fechado'
  | 'produto_excluido'
  | 'pedido_cancelado'
  | 'usuario_criado'
  | 'usuario_removido'
  | 'plano_alterado'
  | 'licenca_renovada';

export interface AuditLog {
  id: string;
  empresaId: string;
  userId: string;
  userNome: string;
  eventType: AuditEventType;
  descricao: string;       // Resumo legível da ação
  metadata: Record<string, string | number | boolean>; // Dados adicionais sem info sensível
  createdAt: string;       // ISO 8601
}
```

---

## 2. Audit Service

```typescript
// src/services/auditService.ts
import { buildScopedStorageKey, AuditLog, AuditEventType } from '../domain/saas';

const COLLECTION = 'audit_logs';
const MAX_LOGS = 1000; // evitar crescimento ilimitado

export const auditService = {
  log: (
    event: AuditEventType,
    descricao: string,
    empresaId: string,
    userId: string,
    userNome: string,
    metadata: AuditLog['metadata'] = {}
  ): void => {
    const entry: AuditLog = {
      id: crypto.randomUUID(),
      empresaId,
      userId,
      userNome,
      eventType: event,
      descricao,
      metadata,
      createdAt: new Date().toISOString(),
    };

    const key = buildScopedStorageKey(COLLECTION, empresaId);
    const existing: AuditLog[] = JSON.parse(localStorage.getItem(key) || '[]');

    // Manter apenas os últimos MAX_LOGS registros
    const updated = [entry, ...existing].slice(0, MAX_LOGS);
    localStorage.setItem(key, JSON.stringify(updated));
  },

  getAll: (empresaId: string): AuditLog[] => {
    const key = buildScopedStorageKey(COLLECTION, empresaId);
    return JSON.parse(localStorage.getItem(key) || '[]');
  },

  getByEvent: (type: AuditEventType, empresaId: string): AuditLog[] => {
    return auditService.getAll(empresaId).filter(l => l.eventType === type);
  },
};
```

---

## 3. Exemplos de Uso no Código

```typescript
// Ao fechar caixa
auditService.log(
  'caixa_fechado',
  `Caixa fechado. Total: R$ ${total.toFixed(2)}`,
  empresaId,
  userId,
  userNome,
  { totalVendas: total, quantidadePedidos: pedidos.length }
);

// Ao fazer restore de backup
auditService.log(
  'backup_restore',
  `Restore realizado a partir de backup de ${exportedAt}`,
  empresaId,
  userId,
  userNome,
  { backupEmpresaId: data.empresaId, backupData: data.exportedAt }
);

// Ao excluir produto
auditService.log(
  'produto_excluido',
  `Produto "${produto.nome}" removido do cardápio`,
  empresaId,
  userId,
  userNome,
  { produtoId: produto.id }
);
```

---

## 4. Regras de Segurança para Logs

```typescript
// CORRETO ✅ — metadata sem dados sensíveis
metadata: { produtoId: produto.id, total: 150.00 }

// INCORRETO ❌ — nunca logar senha, token, CPF, dados de pagamento
metadata: { senha: usuario.senha, token: jwt }
```

---

## Checklist de Validação

- [ ] `auditService.log()` chamado em todas as ações sensíveis listadas em `AuditEventType`
- [ ] `metadata` não contém senha, token, ou dados pessoais
- [ ] Log armazenado via `buildScopedStorageKey` (isolado por empresa)
- [ ] Limite de MAX_LOGS implementado para evitar storage infinito
- [ ] View de auditoria é somente leitura (sem delete de logs)
- [ ] Testes verificam que log é criado com campos obrigatórios corretos
