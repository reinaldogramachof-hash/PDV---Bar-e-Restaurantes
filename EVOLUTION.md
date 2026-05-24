# EVOLUTION.md — Decisões Arquiteturais e Learnings

> Registro de decisões técnicas e estratégicas tomadas após o congelamento do ROADMAP-FASE-5.md.
> Cada entrada documenta o contexto, a decisão e o impacto na arquitetura.

---

## [2026-05-22] Densidade Visual Desktop-First

**Contexto:** Sistema original com espaçamentos generosos (mobile-friendly). Público-alvo opera em estações desktop em ambiente de restaurante.

**Decisão:** Migração de todos os módulos para tokens canônicos de densidade desktop:
- Tabelas: `px-4 py-3`
- Inputs: `h-10 px-3 rounded-control`
- Botões: `h-10 px-4 font-medium text-xs`
- Cards KPI: `p-5 rounded-panel`

**Commits:** `bfb8cf3`, `fd7f2c0`

**Impacto:** Todos os módulos migrados. Padrão canônico congelado em CLAUDE.md.

---

## [2026-05-23] Port Lógica de Negócio + SecurityGate

**Contexto:** `src copy/` continha implementações de `Dashboard.tsx` com edit/delete de pedidos fechados, `SecurityGate.tsx` e `dashboardOrderTools.ts` não portadas para `src/`.

**Decisão:** Port completo com adaptação de tokens visuais (eliminar `#D4AF37`, `#1C1C1E`, `rounded-[3rem]` — substituir por tokens canônicos).

**Commits:** `dde7440`, `ad2fb4a`

**Impacto:** `Collaborator` type recebeu campo `password?: string`. SecurityGate só autentica quando colaboradores têm senha configurada — requisito de QA para Reinaldo.

---

## [2026-05-23] Documentação de Segurança — Fase 2

**Contexto:** Antigravity gerou relatório de auditoria de segurança. Sem pasta dedicada para rastrear o tema.

**Decisão:** Criar `docs/security/` com README index, relatório completo e backlog de riscos para Fase 3.

**Riscos documentados:**
- R-01: localStorage plaintext → Web Crypto API (Fase 3)
- R-02: Estado React manipulável → JWT HttpOnly (Fase 3)
- R-03: Audit trail apagável → banco centralizado (Fase 3)

**Commit:** `d07fca6`

---

## [2026-05-24] Novos Módulos Aprovados — Sessão Estratégica

**Contexto:** Revisão estratégica dos módulos existentes e viabilidade de expansão do produto.

### Módulos Aprovados

**Delivery (canal próprio):**
- Ecossistema independente com fila kanban, entregadores freelance, financeiro próprio
- Sincroniza com Relatórios e Financeiro ao fim do turno
- Entregadores como tabela separada (não colaboradores) — terceiros/freelancers
- Visão futura documentada: portal do entregador freelance com disponibilidade online (Fase 3+)

**Inteligência Gerencial (`Intelligence.tsx`):**
- Motor de regras determinístico (12 regras implementadas)
- 4 tabs: Diagnóstico (health score), Tendências, Produtos, Recomendações
- Fonte: `orders`, `expenses`, `stockItems`, `deliveryOrders`, `collaborators`
- Sem biblioteca de gráficos externa — CSS puro para performance

**Notificações:**
- Canal de comunicação Plena → clientes
- Feed JSON remoto (URL controlada pela Plena) com cache 1h
- Tipos: update, security, feature, support, sales, info
- Bell icon no header (não na sidebar)
- Central de vendas internas: gatilhos automáticos em bloqueios de plano
- Composer no MasterDashboard para a Plena publicar notificações

---

## [2026-05-24] Decisão de Backend — Fase 3: Supabase

**Contexto:** Avaliação de PHP API por cliente para suportar alta demanda, cardápio digital com imagens e sistema de pedidos online.

**Problema com PHP por cliente:**
- 1 instância por restaurante = inferno operacional em escala
- Sem WebSocket nativo (pedidos online exigem real-time)
- Imagens sem CDN = lento
- Deploy manual por cliente a cada atualização

**Decisão:** Supabase como backend central multi-tenant para Fase 3.

**Arquitetura:**
```
Supabase (único projeto, multi-tenant via empresaId)
├── PostgreSQL    → dados (migração do localStorage)
├── Auth (JWT)    → login, resolve R-01/R-02 segurança
├── Storage + CDN → imagens do cardápio
├── Realtime      → pedidos online → cozinha em <1s
└── Edge Functions → lógica de negócio
```

**Cardápio Digital (Fase 3+):**
- Subdomínio por cliente: `cantina-brasil.plena.com.br`
- App leve (Vite/React) hospedado em Vercel/Cloudflare Pages
- Mesmo backend Supabase — sem servidor dedicado por cliente
- QR code → menu → pedido → Realtime → cozinha

**Roadmap Fase 3:**
```
Sprint 1: Supabase Auth + JWT (resolve R-01/R-02)
Sprint 2: Migrar localStorage → PostgreSQL por módulo
Sprint 3: Supabase Storage → imagens de produtos
Sprint 4: Cardápio digital (app separado, mesmo backend)
Sprint 5: Realtime (pedidos online → cozinha)
```

**Compatibilidade:** Arquitetura atual (empresaId, buildScopedStorageKey, multiempresa) foi desenhada para essa migração — zero refactoring estrutural necessário.

---

## Módulos Pendentes de Revisão (Gestão)

| Módulo | Pendência | Prioridade |
|--------|-----------|------------|
| `Security.tsx` | Filtros de audit + export CSV (F6 ROADMAP) | Média |
| `Settings.tsx` | Tab Backup + visibilidade do plano atual | Média |
| `Collaborators.tsx` | Campo `password` visível na UI | Alta (habilita SecurityGate) |
| `UserManual.tsx` | Migração densidade desktop (F8) | Baixa |
| `Support.tsx` | Migração densidade desktop (F8) | Baixa |

---

**Versão:** 1.0  
**Última atualização:** 2026-05-24  
**Próxima revisão:** Pós-implementação dos módulos aprovados em 2026-05-24
