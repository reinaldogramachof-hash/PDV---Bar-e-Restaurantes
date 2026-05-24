# EVOLUTION.md — Decisões Arquiteturais e Learnings

> Registro de decisões técnicas e estratégicas tomadas após o congelamento do ROADMAP-FASE-5.md.
> Cada entrada documenta o contexto, a decisão e o impacto na arquitetura.

---

## [2026-05-24] Revisão Operacional — Módulos PDV, Mesas, Delivery, Pedidos Online, Cozinha e Caixa

**Contexto:** Antes de avançar para a Fase 3 (Supabase), todos os módulos operacionais passaram por auditoria completa (Antigravity) e aplicação de melhorias aprovadas (Codex). Foco em qualidade de código, lógica de negócio e UX real de operação.

**Metodologia:** Claude (Arquiteto) → Antigravity audita → Reinaldo aprova → Codex implementa → Claude valida.

---

### PDV (Balcão)
**Melhorias aplicadas:**
- `PDV-001`: carrinho do balcão persistido por empresa no `AppContext` via `buildScopedStorageKey` — sem perda ao navegar ou recarregar
- `PDV-002`: interface `CountInputProps` explícita em `OrderModal.tsx` — eliminado `any`
- `PDV-003`: confirmação antes de limpar carrinho — cancelamento acidental bloqueado
- `PDV-004`: lógica de rateio de combo extraída para `allocateComboItems` em `salesService.ts` — função pura com teste
- `PDV-005`: pagamento parcial por mesa — `PartialPaymentItem[]` em `Order`, mesa fecha automaticamente ao quitar saldo

**Commits:** `b7db058`, `aecebcb`, `ba385ce`

---

### Mesas
**Melhorias aplicadas:**
- `MESA-001`: interface `StatCardProps` explícita em `Tables.tsx` — eliminado `any`
- `MESA-002`: valor parcial da comanda exibido no card da mesa no mapa do salão
- `MESA-004`: botão "Juntar Mesas" na UI — expõe `mergeTables` do `AppContext` com confirmação
- `MESA-005`: campo `sector?: string` em `Table` + sub-abas de filtro por setor no mapa

**Decisão de produto:** `MESA-003` rejeitado — mesa ocupada sem itens permanece "ocupada" por design intencional (controle manual do operador).

**Commits:** `db14bb7`, `a644081`, `a3ae797`, `7971d7e`

---

### Delivery
**Melhorias aplicadas:**
- `DEL-003`: modelo de repasse por entregador (`repasseType`, `repasseValue`) + tabela de repasse na aba Financeiro
- `DEL-004`: cancelamento com motivo obrigatório (select de opções) + alerta visual de pedidos atrasados no kanban
- `DEL-005`: identidade visual por coluna do kanban (laranja/roxo/verde/vermelho)
- `DEL-006`: enum de pagamento unificado com `PaymentMethod` global — eliminado `cartao_credito`/`cartao_debito` divergentes

**Débito técnico documentado (defer Fase 3):**
- `DEL-001`: integração com catálogo de produtos no formulário Novo Pedido
- `DEL-002`: receita de delivery integrada ao `CashierSession` — resolvido parcialmente no CAI-002

**Commit:** `f96bf0a`

---

### Pedidos Online
**Melhorias aplicadas:**
- `ONL-001`: HEX hardcoded substituídos por `var(--color-*)` em `CustomerMenuView.tsx`
- `ONL-002`: receita de pedidos online integrada ao `CashierSession` via `registerOnlineSale`
- `ONL-003`: baixa de estoque ao confirmar pedido online via `applyOnlineOrderStockDeduction`
- `ONL-004`: alerta sonoro (`Audio`) + visual pulse para pedidos ociosos >60s na coluna "Recebido"
- `ONL-005`: chips de motivo rápido no cancelamento — substituído `textarea` obrigatório

**Arquivo novo:** `src/services/onlineOrdersService.ts` com helper e teste.

**Commit:** `a4f5cd9`

---

### Cozinha (KDS)
**Melhorias aplicadas:**
- `COZ-001`: KDS exibe pedidos de todas as origens (mesa, balcão, delivery, online) com ícone identificador por canal — eliminada restrição `mode === 'mesa'`
- `COZ-002`: modo KDS modular configurável em Settings: `display` (visualização passiva) ou `interactive` (cozinheiro marca status dos itens). `kitchenStatus?: KitchenItemStatus` em `OrderItem`
- `COZ-003`: timer de atraso usa `addedAt` do item mais antigo não servido — sobremesa lançada 2h depois não aparece como "Atrasada 120min"
- `COZ-004`: pause/play do auto-slide + setas de navegação manual (`ChevronLeft`/`ChevronRight`)
- `COZ-005`: filtro por setor no topo do KDS (Todos / Cozinha / Bar) via `isBarCategory`

**Decisão arquitetural:** COZ-002 implementado com arquitetura modular por decisão do Reinaldo — futuro produto terá as duas opções e o cliente escolhe em Settings.

**Commit:** `754f6c8`

---

### Caixa
**Melhorias aplicadas:**
- `CAI-001`: etapa de contagem física de gaveta no fechamento — campo opcional com feedback em tempo real (Sobra/Falta/Conferido). `countedCash` e `cashBreakdown` persistidos em `CashierSession`. Coluna "Quebra" no histórico
- `CAI-002`: receita de `deliveryOrders` com `status === 'entregue'` integrada ao `salesTotal`, `ordersCount` e `paymentBreakdown` do fechamento — eliminada cegueira contábil do delivery
- `CAI-003`: toggle Saída/Entrada no form de movimentação — `entryType?: 'saida' | 'entrada'` em `Expense`. Suprimento de troco documentado e somado corretamente ao saldo
- `CAI-004`: `cashierHistory` limitado a 30 sessões via `slice(-30)` — prevenção de `QuotaExceededError` em produção após meses de uso

**Commit:** `61636da`

---

**Branch:** `feat/port-logica-negocio`
**Status:** Aguardando QA Reinaldo → merge para main → início Fase 3 (Supabase)

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

## [2026-05-24] Central de Pedidos Online (OnlineOrders)

**Contexto:** Fechamento do circuito cliente → cozinha. CustomerMenuView existia apenas como vitrine; faltava o fluxo de pedido.

**Decisão estratégica:** Módulo implementado como infraestrutura de Fase 3.
- Fase 2 (atual): cliente faz pedido via WhatsApp — funcional e sem backend
- Fase 3 (Supabase): Realtime substitui WhatsApp automaticamente, estrutura de dados já compatível

**Arquitetura do fluxo:**
```
Cliente (/cardapio/:empresaId)
  → Carrinho + Checkout
  → WhatsApp (Fase 2) / Supabase Realtime (Fase 3)
    → OnlineOrders.tsx (dashboard staff)
      → Kanban: recebido → confirmado → preparo → pronto → entregue
```

**Decisão WhatsApp:** `menuConfig.whatsappPhone` configurado em Cardápio Digital → Aparência. Número sem +55, sem espaços. Mensagem formatada com canal, itens, total e observações.

**Tipos prontos para migração PostgreSQL:** `OnlineOrder`, `CartItem`, `OnlineOrderStatus`, `OnlineOrderChannel` — todos com `empresaId` e timestamps ISO.

**Commit:** `d25bfa3`

---

## Inventário Completo de Módulos — Fase 2 (2026-05-24)

### Operação
| Módulo | Arquivo | Status |
|--------|---------|--------|
| PDV | `PDV.tsx` | ✅ Completo |
| Mesas | `Tables.tsx` | ✅ Completo |
| Cozinha | `Kitchen.tsx` | ✅ Completo |
| Caixa | `CashRegister.tsx` | ✅ Completo |
| Delivery | `Delivery.tsx` | ✅ Completo |
| Pedidos Online | `OnlineOrders.tsx` | ✅ Completo (Fase 3 ready) |

### Gestão
| Módulo | Arquivo | Status |
|--------|---------|--------|
| Dashboard | `Dashboard.tsx` | ✅ Completo |
| Relatórios | `Reports.tsx` | ✅ Completo |
| Inteligência | `Intelligence.tsx` | ✅ Completo |
| Estoque | `Stock.tsx` | ✅ Completo |
| Produtos | `Products.tsx` | ✅ Completo |
| Cardápio Digital | `MenuDigital.tsx` + `CustomerMenuView.tsx` | ✅ Completo |
| Vendas | `SalesCenter.tsx` | ✅ Completo |
| Clientes | `Customers.tsx` | ✅ Completo |
| Fornecedores | `Suppliers.tsx` | ✅ Completo |
| Colaboradores | `Collaborators.tsx` | ⚠️ Pendente: campo password na UI |

### Sistema
| Módulo | Arquivo | Status |
|--------|---------|--------|
| Segurança | `Security.tsx` | ⚠️ Pendente: filtros + export CSV |
| Configurações | `Settings.tsx` | ⚠️ Pendente: tab Backup + visibilidade plano |
| Notificações | `NotificationPanel.tsx` | ✅ Completo |
| Suporte | `Support.tsx` | ⚠️ Pendente: densidade desktop |
| Manual | `UserManual.tsx` | ⚠️ Pendente: densidade desktop |

### Plena (role=master)
| Módulo | Arquivo | Status |
|--------|---------|--------|
| Painel Master | `MasterDashboard.tsx` | ✅ Completo |
| PlenaHub | `MasterDashboard.tsx` (tab) | ✅ Completo |
| Composer | `MasterDashboard.tsx` (tab) | ✅ Completo |

---

## [2026-05-24] Revisão e Fechamento de Módulos — Sessão Final Fase 2

**Contexto:** Revisão módulo a módulo dos pendentes antes do merge para main.

**Resultado da revisão:**
- `Security.tsx` — filtros de audit e export CSV já estavam implementados ✅ (falso positivo no backlog)
- `Settings.tsx` — tabs Dados & Backup e Plano Atual já existiam ✅ (falso positivo no backlog)
- `Collaborators.tsx` — campo `password` adicionado na aba Geral do formulário ✅ SecurityGate habilitado
- `Support.tsx` — migração completa para densidade desktop (p-5, rounded-panel, h-10) ✅
- `UserManual.tsx` — migração completa para densidade desktop, hero e cards compactos ✅

**Commit:** `6f099ff`

---

## Módulos Pendentes de Revisão (Gestão)

Todos os módulos da Fase 2 estão completos. Nenhuma pendência aberta.

| Módulo | Status |
|--------|--------|
| Todos os 24 módulos | ✅ Completo |

---

**Versão:** 1.1  
**Última atualização:** 2026-05-24  
**Próxima revisão:** Revisão dos módulos pendentes + merge feat/port-logica-negocio → main
