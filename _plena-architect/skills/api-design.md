# Skill: Design de Service / API

**Quando usar:** Criar serviços, hooks de dados, ou endpoints  
**Tempo:** 30min–2h  
**Dependências:** rules/security.md, rules/architecture.md

---

## Procedimento para Service (Frontend Storage)

### 1. Definir Contrato

```typescript
// Contrato claro antes de implementar
interface ServiceName {
  getAll(empresaId: string): Item[];
  getById(id: string, empresaId: string): Item | undefined;
  create(data: Omit<Item, 'id' | 'createdAt'>, empresaId: string): Item;
  update(item: Item, empresaId: string): void;
  delete(id: string, empresaId: string): void;
}
```

### 2. Implementação com Isolamento por Empresa

```typescript
// src/services/itemService.ts
import { buildScopedStorageKey } from '../domain/saas';

const COLLECTION = 'items';

export const itemService = {
  getAll: (empresaId: string): Item[] => {
    const key = buildScopedStorageKey(COLLECTION, empresaId);
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  },

  create: (data: Omit<Item, 'id' | 'empresaId' | 'createdAt'>, empresaId: string): Item => {
    const item: Item = {
      ...data,
      id: crypto.randomUUID(),
      empresaId,
      createdAt: new Date().toISOString(),
    };
    const all = itemService.getAll(empresaId);
    const key = buildScopedStorageKey(COLLECTION, empresaId);
    localStorage.setItem(key, JSON.stringify([...all, item]));
    return item;
  },
  
  // ...demais métodos
};
```

### 3. Hook Reutilizável

```typescript
// src/hooks/useItems.ts
import { useState, useEffect } from 'react';
import { itemService } from '../services/itemService';
import { useApp } from '../store/AppContext';

export const useItems = () => {
  const { currentEmpresa } = useApp();
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    setItems(itemService.getAll(currentEmpresa.id));
  }, [currentEmpresa.id]);

  const create = (data: Omit<Item, 'id' | 'empresaId' | 'createdAt'>) => {
    const created = itemService.create(data, currentEmpresa.id);
    setItems(prev => [...prev, created]);
    return created;
  };

  return { items, create };
};
```

### 4. Validação de Import (obrigatório quando recebe dados externos)

```typescript
export const validateAndImport = (json: string, currentEmpresaId: string): Item[] => {
  const data = JSON.parse(json);
  
  if (!data.empresaId || data.empresaId !== currentEmpresaId) {
    throw new Error(`Dados de empresa diferente. Esperado: ${currentEmpresaId}`);
  }
  
  return data.items.map((item: unknown) => normalizeItem(item, currentEmpresaId));
};
```

## Checklist de Validação

- [ ] Contrato definido antes de implementar
- [ ] Todos os métodos recebem `empresaId` como parâmetro
- [ ] Storage usa `buildScopedStorageKey` (nunca acesso direto ao localStorage)
- [ ] Import valida `empresaId` antes de aplicar dados
- [ ] Sem `any` nos tipos
- [ ] Hook separado do service
