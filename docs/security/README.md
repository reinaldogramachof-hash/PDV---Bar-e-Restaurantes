# Segurança — Central de Documentação

Esta pasta centraliza toda a documentação de segurança do Sistema de Gestão Restaurantes.

## Fase Atual
**Local-First SaaS Prep** — Segurança implementada no cliente com defesa em profundidade.  
Transição para backend centralizado prevista na **Fase 3 SaaS**.

## Documentos

| Arquivo | Descrição | Status |
|---------|-----------|--------|
| [auditoria-fase2.md](./auditoria-fase2.md) | Relatório completo de auditoria Fase 2 (Antigravity) | ✅ Concluído |
| [backlog-fase3.md](./backlog-fase3.md) | Itens de segurança pendentes para Fase 3 SaaS | 🔴 Pendente |

## Pilares de Segurança Implementados (Fase 2)

1. **RBAC** — `src/domain/saas.ts` — permissões por cargo e plano
2. **Multiempresa** — `buildScopedStorageKey` + `validateImportEmpresaId`
3. **Audit Trail** — `src/services/auditService.ts` + `src/hooks/useAudit.ts`
4. **Licenciamento** — `src/services/licenseService.ts` com cache + fallback
5. **Defesa em Profundidade** — Sidebar → PlanGuard → hasPermission (3 camadas)

## Riscos Conhecidos (a endereçar na Fase 3)

| # | Risco | Severidade | Fase de Mitigação |
|---|-------|------------|-------------------|
| R-01 | localStorage em texto plano | Médio | Fase 3 (Web Crypto API) |
| R-02 | Estado React manipulável no cliente | Baixo (local-first) | Fase 3 (JWT HttpOnly) |
| R-03 | Audit Trail apagável pelo operador | Médio | Fase 3 (DB centralizado) |
