# Regra: Segurança

**Escopo:** Global — qualquer código que acessa dados ou autenticação  
**Severidade:** Crítica  
**Validação:** Code review manual obrigatório

---

## Regras Absolutas

### 1. Secrets em .env — Nunca no Código
```typescript
// Correto ✅
const url = import.meta.env.VITE_LICENSE_URL;

// Incorreto ❌
const url = 'https://api.plena.com.br/license?key=abc123';
```

### 2. Dados Isolados por Empresa
```typescript
// Correto ✅ — sempre escoped
const key = buildScopedStorageKey('products', empresaId);
localStorage.setItem(key, JSON.stringify(data));

// Incorreto ❌ — acesso global sem escopo
localStorage.setItem('products', JSON.stringify(data));
```

### 3. Import de Dados com Validação
```typescript
// Correto ✅ — valida antes de importar
const imported = JSON.parse(json);
if (imported.empresaId !== currentEmpresaId) {
  throw new Error('Dados de outra empresa — importação rejeitada');
}

// Incorreto ❌ — importa sem validar
const imported = JSON.parse(json);
setState(imported); // pode vazar dados cross-empresa
```

### 4. Sem Dados Sensíveis em Logs
```typescript
// Incorreto ❌
console.log('User data:', { email, password, token });
console.error('Auth failed', { empresaId, userId });
```

### 5. Queries Parametrizadas (se houver backend)
```typescript
// Correto ✅
db.query('SELECT * FROM orders WHERE empresa_id = $1', [empresaId]);

// Incorreto ❌ — SQL Injection
db.query(`SELECT * FROM orders WHERE empresa_id = '${empresaId}'`);
```

## Checklist de Segurança (por feature)

- [ ] Dados filtrados por `empresaId` em todos os pontos de acesso
- [ ] Storage usa `buildScopedStorageKey` (ou equivalente do projeto)
- [ ] Nenhum secret hardcoded no código
- [ ] Import/restore valida `empresaId` antes de aplicar dados
- [ ] Logs não expõem dados sensíveis
- [ ] Roles/permissões verificadas antes de renderizar módulos restritos

## Impacto de Violação

Vazamento de dados entre empresas clientes é falha crítica de segurança que pode resultar em perda de clientes, ação judicial e dano reputacional à Plena Informática.

---

> **Adaptar por projeto:** Adicionar regras específicas de autenticação/autorização.
