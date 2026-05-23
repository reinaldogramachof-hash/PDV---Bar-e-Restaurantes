# Checklist de Validação — Gate de Qualidade

Claude valida cada missão concluída contra este checklist antes de aprovar.

---

## Critérios de Aprovação

### Qualidade de Código
- [ ] `npm run lint` → 0 erros (TypeScript strict)
- [ ] `npm run build` → sucesso sem warnings críticos
- [ ] `npm run test -- --coverage` → >80% coverage
- [ ] Sem `console.log`, `console.error`, `console.warn` em produção
- [ ] Sem `any`, `as unknown`, `@ts-ignore` no código novo
- [ ] Sem `// TODO`, `// ...rest of code`, `// implement` (zero placeholders)

### Arquitetura
- [ ] Componentes em `src/components/` (PascalCase)
- [ ] Hooks em `src/hooks/` (camelCase, prefixo `use`)
- [ ] Lógica de negócio em `src/services/` ou `src/domain/`
- [ ] Tipos em `src/types.ts` ou arquivo de tipos do módulo
- [ ] Sem circular dependencies
- [ ] Sem modificações em arquivos fora do escopo da missão

### Design e UI
- [ ] Apenas tokens de `src/index.css` (sem hex hardcoded)
- [ ] Lucide React para ícones (zero emojis)
- [ ] Padrão desktop: tabelas `px-4 py-3` | inputs `h-10 px-3` | botões `h-10 px-4`
- [ ] Proibido: `font-black uppercase tracking-widest` em UI de dados

### Artefatos do Antigravity
- [ ] Task List foi gerada antes da execução
- [ ] Plano de Implementação aprovado por Claude antes do código
- [ ] Walkthrough cobre fluxos feliz + pelo menos 1 edge case
- [ ] Browser Recording confirma UI em `http://localhost:3000`

### Spec (adaptar por projeto)
- [ ] Feature 100% implementada conforme ROADMAP
- [ ] Sem funcionalidades além do escopo definido
- [ ] Decisões de desvio da spec documentadas no relatório

---

## Decisão Final

### ✅ Aprovado — Critérios para Merge
- Todos os itens acima marcados
- Nenhum problema Crítico ou Alto encontrado
- Browser Recording confirma UI correta
- Reinaldo testou e aprovou

### ⚠️ Aprovado com Ajustes — Retornar ao Antigravity
Usar quando problemas são Médios ou menores. Lista específica de correções:
```
Ajustes necessários:
1. [arquivo.tsx:linha] — [o que corrigir]
2. [arquivo.ts:linha]  — [o que corrigir]
```
DEV corrige e resubmete. Claude valida novamente.

### ❌ Bloqueado — Redesenhar Missão
Usar quando há problemas Críticos ou Altos:
```
Bloqueio: [descrição do risco]
Impacto: [o que quebra se for para produção]
Redesenho necessário: [o que mudar na missão]
```

---

## Classificação de Problemas

| Severidade | Definição | Ação |
|-----------|-----------|------|
| **Crítico** | Quebra produção, violação de segurança, dados de empresa A visíveis por B | Bloquear |
| **Alto** | Breaking change sem flag, bundle >10% maior, regressão em módulo existente | Bloquear |
| **Médio** | Violação de padrão de código, placeholder deixado, arquivo errado modificado | Ajustes |
| **Baixo** | Sugestão de refactoring, melhoria opcional | Registrar, não bloquear |

---

## Regras de Bundle Size

| Situação | Ação |
|----------|------|
| Bundle < 500KB gzip | ✅ OK |
| Bundle 500–600KB gzip | ⚠️ Investigar — lazy load faltando? |
| Bundle > 600KB gzip | ❌ Bloquear — exigir code splitting |

**Fix padrão para bundle grande:**
```
Missão Fast: "Converter views em src/App.tsx para React.lazy() + import()
com Suspense. Manter Dashboard como eager. Meta: bundle principal < 200KB."
```

---

## Segurança (Checklist Adicional para Features com Dados)

- [ ] Dados sempre filtrados por `empresaId` atual (nunca cross-empresa)
- [ ] Storage sempre via `buildScopedStorageKey(collection, empresaId)`
- [ ] Nenhum dado sensível em `console.log`
- [ ] Secrets e URLs em `.env` (nunca hardcoded no código)
- [ ] Import de dados valida `empresaId` antes de merge

---

**Versão:** 1.0  
**Portabilidade:** ✅ Adaptar seção "Spec" para cada projeto
