# Regra: Arquitetura de Projeto

**Escopo:** Global — estrutura de arquivos e responsabilidades  
**Severidade:** Alta  
**Validação:** Revisão manual + grep de dependências

---

## Estrutura de Diretórios

```
src/
  components/   → Componentes React (PascalCase.tsx)
  hooks/        → Custom hooks (useNome.ts — prefixo 'use' obrigatório)
  services/     → Lógica de negócio pura (sem JSX)
  domain/       → Regras de domínio, tipos, constantes
  store/        → Estado global (Context + Provider)
  types.ts      → Interfaces e tipos compartilhados
```

## Regras de Responsabilidade

| Camada | O que pode | O que não pode |
|--------|-----------|----------------|
| `components/` | JSX, hooks, props | Lógica de negócio direta, fetch |
| `hooks/` | Estado, efeitos, chamar services | JSX |
| `services/` | Lógica pura, storage, cálculos | JSX, hooks React |
| `domain/` | Constantes, tipos, validações puras | Estado, efeitos |
| `store/` | Estado global, mutations | Lógica de negócio complexa |

## Proibições

```
❌ Circular dependencies (A importa B, B importa A)
❌ Lógica de negócio em componente (mover para service/hook)
❌ Múltiplos componentes no mesmo arquivo
❌ index.ts com código — só barrel exports
❌ Importar de src/ usando paths relativos ../../.. (usar alias @/)
```

## Nomenclatura

```
Componentes:    PascalCase      → OrderModal.tsx, Dashboard.tsx
Hooks:          camelCase       → useNavigation.ts, useCashier.ts
Services:       camelCase       → licenseService.ts, auditService.ts
Tipos/Enums:    PascalCase      → OrderItem, PaymentMethod
Constantes:     UPPER_SNAKE     → DEFAULT_EMPRESA_ID, APP_NAME
```

## Exemplo Correto ✅

```
src/
  components/LicenseBanner.tsx   → só JSX + props
  hooks/useLicense.ts            → busca status, retorna { status, daysRemaining }
  services/licenseService.ts     → checkLicense(), cache, fallback
```

## Exemplo Incorreto ❌

```
src/
  components/LicenseBanner.tsx   → contém fetch, lógica de cache, validação
  // tudo numa camada só — viola separação de responsabilidades
```

---

> **Adaptar por projeto:** Adicionar padrões específicos do projeto neste arquivo.
