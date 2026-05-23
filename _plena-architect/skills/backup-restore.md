# Skill: Backup e Restore de Dados

**Quando usar:** Implementar export/import de dados por empresa  
**Tempo:** 3–5h  
**Dependências:** rules/security.md — validação de empresaId é obrigatória

---

## Conceito Central

```
Export: lê todos os dados da empresa → serializa em JSON → download
Restore: upload JSON → valida empresaId → aplica dados
```

Nunca restaurar dados sem validar que pertencem à empresa correta.

---

## 1. Estrutura do Arquivo de Backup

```typescript
// Formato obrigatório — sempre incluir metadados
interface BackupFile {
  version: '1.0';
  empresaId: string;          // CRÍTICO — validado no restore
  exportedAt: string;         // ISO 8601
  exportedBy: string;         // userId de quem exportou
  collections: {
    products: unknown[];
    orders: unknown[];
    stock: unknown[];
    suppliers: unknown[];
    cashier: unknown[];
    // adicionar conforme collections existentes
  };
}
```

---

## 2. Backup Service

```typescript
// src/services/backupService.ts
import { buildScopedStorageKey } from '../domain/saas';

const COLLECTIONS = ['products', 'orders', 'stock', 'suppliers', 'cashier'];

export const backupService = {
  export: (empresaId: string, userId: string): string => {
    const collections: Record<string, unknown[]> = {};

    for (const col of COLLECTIONS) {
      const key = buildScopedStorageKey(col, empresaId);
      const raw = localStorage.getItem(key);
      collections[col] = raw ? JSON.parse(raw) : [];
    }

    const backup: BackupFile = {
      version: '1.0',
      empresaId,
      exportedAt: new Date().toISOString(),
      exportedBy: userId,
      collections: collections as BackupFile['collections'],
    };

    return JSON.stringify(backup, null, 2);
  },

  download: (empresaId: string, userId: string): void => {
    const json = backupService.export(empresaId, userId);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${empresaId}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  validate: (json: string, currentEmpresaId: string): BackupFile => {
    let data: BackupFile;

    try {
      data = JSON.parse(json);
    } catch {
      throw new Error('Arquivo de backup inválido — JSON malformado');
    }

    if (!data.empresaId) {
      throw new Error('Arquivo de backup inválido — empresaId ausente');
    }

    if (data.empresaId !== currentEmpresaId) {
      throw new Error(
        `Backup pertence à empresa "${data.empresaId}". ` +
        `Empresa atual: "${currentEmpresaId}". Restore rejeitado.`
      );
    }

    if (!data.version || !data.collections) {
      throw new Error('Arquivo de backup inválido — estrutura incorreta');
    }

    return data;
  },

  restore: (json: string, currentEmpresaId: string): void => {
    // validate lança erro se empresaId não bater
    const data = backupService.validate(json, currentEmpresaId);

    for (const [col, items] of Object.entries(data.collections)) {
      const key = buildScopedStorageKey(col, currentEmpresaId);
      localStorage.setItem(key, JSON.stringify(items));
    }
  },
};
```

---

## 3. Componente de Restore com Confirmação

```typescript
// Nunca restaurar sem confirmação explícita do usuário
export const RestoreConfirmModal: React.FC<{
  fileName: string;
  exportedAt: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ fileName, exportedAt, onConfirm, onCancel }) => (
  <div role="dialog" aria-modal="true">
    <p>
      Isso irá <strong>substituir todos os dados atuais</strong> pelos dados do backup:
    </p>
    <p><strong>Arquivo:</strong> {fileName}</p>
    <p><strong>Exportado em:</strong> {new Date(exportedAt).toLocaleString('pt-BR')}</p>
    <p className="text-[var(--color-danger)]">Esta ação não pode ser desfeita.</p>
    <div>
      <button onClick={onCancel}>Cancelar</button>
      <button onClick={onConfirm}>Confirmar Restore</button>
    </div>
  </div>
);
```

---

## Checklist de Validação

- [ ] `backupService.validate()` sempre chamado antes do restore
- [ ] Erro explícito se `empresaId` não bater
- [ ] Modal de confirmação obrigatório antes de aplicar restore
- [ ] Cada collection restaurada via `buildScopedStorageKey`
- [ ] Testes cobrem: backup válido, empresaId errado, JSON malformado, restore OK
- [ ] Auditoria registra quem fez backup/restore e quando
