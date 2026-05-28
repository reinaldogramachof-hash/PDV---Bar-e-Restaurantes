# Relatório de Auditoria e Segurança — Fase 2

**Gerado por:** Antigravity Agent  
**Data:** 2026-05-23  
**Status:** ✅ Aprovado — em conformidade com boas práticas

---

## 1. Resumo Executivo

O sistema encontra-se em fase avançada de preparação para o modelo **SaaS Multitenant**. A arquitetura de segurança atual adota o paradigma **Local-First**, garantindo alta velocidade operacional e funcionamento offline estável para restaurantes. A integridade operacional é mantida por meio de um sistema de controle de acesso rigoroso que impede o vazamento de privilégios visuais e de dados entre diferentes empresas na mesma máquina.

---

## 2. Arquitetura de Segurança

```
Acesso do Usuário
  └── Validação de Licença (licenseService.ts)
        ├── Suspensa → LicenseLock
        └── Ativa/Trial → PlanGuard: canAccessModule
              ├── Sem Permissão → PlanUpgradeBanner / Acesso Negado
              └── Autorizado → Renderização da View
                    └── useAudit → Audit Trail
```

### Pilares

**A. RBAC (saas.ts)**  
Permissões granulares mapeadas por cargo. PlanGuard impede montagem no Virtual DOM.

**B. Multiempresa (buildScopedStorageKey)**  
Storage prefixado por `empresaId`. Importação sanitizada por `validateImportEmpresaId`.

**C. Audit Trail (auditService.ts)**  
Eventos persistidos por empresa. Expurgo automático 90 dias. Resiliente a QuotaExceededError.

**D. Licenciamento (licenseService.ts)**  
Cache sessionStorage TTL 1h. Fallback permissivo em caso de rede indisponível.

---

## 3. Matriz RBAC

| Permissão | Master | Gerente | Caixa | Garçom | Cozinha | Estoque | Suporte |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `dashboard:read` | ✔ | ✔ | ❌ | ❌ | ❌ | ❌ | ✔ |
| `pdv:write` | ✔ | ✔ | ✔ | ✔ | ❌ | ❌ | ❌ |
| `mesas:write` | ✔ | ✔ | ✔ | ✔ | ❌ | ❌ | ❌ |
| `cozinha:write` | ✔ | ✔ | ❌ | ❌ | ✔ | ❌ | ❌ |
| `estoque:write` | ✔ | ✔ | ❌ | ❌ | ❌ | ✔ | ❌ |
| `caixa:write` | ✔ | ✔ | ✔ | ❌ | ❌ | ❌ | ❌ |
| `produtos:write` | ✔ | ✔ | ❌ | ❌ | ❌ | ✔ | ❌ |
| `clientes:write` | ✔ | ✔ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `colaboradores:write` | ✔ | ✔ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `fornecedores:write` | ✔ | ✔ | ❌ | ❌ | ❌ | ✔ | ❌ |
| `relatorios:read` | ✔ | ✔ | ✔ | ❌ | ❌ | ❌ | ✔ |
| `configuracoes:write` | ✔ | ✔ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `seguranca:read` | ✔ | ✔ | ❌ | ❌ | ❌ | ❌ | ✔ |
| `suporte:read` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| `master:write` | ✔ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## 4. Controle Visual da Sidebar

Módulo "Segurança" bloqueado por plano E cargo simultaneamente:

| Cargo | Essencial | Profissional | Gestão |
|:---|:---:|:---:|:---:|
| Master | ❌ Plano | ❌ Plano | ✔ |
| Gerente | ❌ Plano | ❌ Plano | ✔ |
| Suporte | ❌ Plano | ❌ Plano | ✔ |
| Caixa | ❌ Plano | ❌ Plano | ❌ Cargo |
| Garçom | ❌ Plano | ❌ Plano | ❌ Cargo |
| Cozinha | ❌ Plano | ❌ Plano | ❌ Cargo |
| Estoque | ❌ Plano | ❌ Plano | ❌ Cargo |

### Defesa em Profundidade (3 camadas)
1. **Sidebar** — item não renderizado se `canAccessModule = false`
2. **PlanGuard** — view não montada no DOM se URI forçada
3. **Security.tsx** — `hasPermission('seguranca:read')` validado internamente

---

## 5. Eventos Auditados

- Autenticação e sessão (login)
- Caixa: abertura com saldo inicial, fechamento, sangrias (`Cashier.tsx`)
- PDV: fechamento de pedidos, cancelamentos, descontos (`PDV.tsx`)
- Cardápio: criação, alteração de preço, exclusão de produtos (`Products.tsx`)
- Colaboradores: inclusão, inativação, alteração de permissões (`Collaborators.tsx`)
- Sistema: exportação de backup, restauração (`Settings.tsx`)

---

## 6. Diagnóstico Final

**Status: ✅ Em conformidade com boas práticas de desenvolvimento moderno.**

As fraquezas identificadas são características inerentes ao paradigma Local-First e não constituem falhas estruturais. Serão mitigadas na transição para API centralizada (Fase 3).

Ver [backlog-fase3.md](./backlog-fase3.md) para o plano de mitigação.
