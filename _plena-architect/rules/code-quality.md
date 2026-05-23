# Regra: Qualidade de Código

**Escopo:** Global — todos os arquivos  
**Severidade:** Crítica  
**Validação:** lint, build, test

---

## Regras Inegociáveis

### 1. Sem Placeholders
```
NUNCA deixar:
  // ...rest of code
  // TODO: implement
  // implement later
  throw new Error('Not implemented')
```
Se o arquivo for grande demais para o contexto → dividir em subtasks menores.

### 2. Sem Console em Produção
```
NUNCA em código de produção:
  console.log(...)
  console.error(...)
  console.warn(...)
  console.debug(...)
```

### 3. TypeScript Strict
```
NUNCA usar:
  any
  as unknown as X
  @ts-ignore
  @ts-expect-error (exceto em testes)
```

### 4. Implementação Completa
Cada função, componente e hook deve ter implementação real.
Nenhum stub, nenhum mock em código de produção.

### 5. Commits Atômicos
Cada commit = uma mudança lógica.
Mensagem: `tipo: descrição breve` (feat, fix, refactor, test, docs)

## Verificação Obrigatória (em toda missão)

```bash
npm run lint    # deve retornar 0 erros
npm run build   # deve retornar sucesso
npm run test    # deve retornar >80% coverage
```

## Exemplo Correto ✅

```typescript
const calculateTotal = (items: OrderItem[]): number => {
  return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
};
```

## Exemplo Incorreto ❌

```typescript
const calculateTotal = (items: any[]): number => {
  // TODO: implement
  console.log('calculating...');
  return 0; // placeholder
};
```
