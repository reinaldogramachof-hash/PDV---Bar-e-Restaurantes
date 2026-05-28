# Plena Gastro Manager

**Empresa:** Plena Informática — CNPJ 59.779.242/0001-78  
**Contato técnico:** tecnologia@plenainformatica.com.br | (12) 99219-1018  
**Versão:** 1.0.0

Plataforma SaaS de gestão operacional para bares, restaurantes e operações de delivery.

Cobre a jornada completa: do pedido do garçom ao fechamento do caixa, com mesas, cozinha, estoque, delivery, inteligência gerencial e gestão comercial em um único lugar. Arquitetura multiempresa com backend centralizado em Supabase (PostgreSQL + Auth JWT).

---

## Stack

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | React | 18.x |
| Linguagem | TypeScript | 5.3+ |
| Build | Vite | 6.x |
| Estilização | Tailwind CSS (via `@tailwindcss/vite`) | v4 |
| Animações | `motion/react` | — |
| Backend / Auth | Supabase (PostgreSQL + Auth JWT) | 2.x |
| PWA | `vite-plugin-pwa` | — |
| QR Code | `qrcode` | — |

---

## Scripts

```bash
npm install
npm run dev
npm run lint        # TypeScript strict — tsc --noEmit
npm run test
npm run build
```

---

## Módulos

### Operação
| Módulo | Descrição | Plano mínimo |
|--------|-----------|--------------|
| PDV | Lançamento de pedidos, combos, descontos | Essencial |
| Mesas | Gestão de mesas e comandas | Essencial |
| Cozinha | Fila de produção em tempo real (KDS) | Essencial |
| Caixa | Abertura, fechamento e sangrias | Essencial |
| Delivery | Canal próprio + integração iFood/Rappi: fila, entregadores, financeiro | Profissional |
| Pedidos Online | Recebimento de pedidos externos integrados | Profissional |
| Cardápio Digital | Menu público via QR code com configuração visual | Essencial |

### Gestão
| Módulo | Descrição | Plano mínimo |
|--------|-----------|--------------|
| Dashboard | Visão do dia com ranking de atendentes | Gestão |
| Relatórios | Fluxo de caixa, vendas, produtos, atendentes | Essencial |
| Inteligência | BI gerencial com motor de regras e recomendações | Gestão |
| Estoque | Controle de itens, movimentações e CMV real | Profissional |
| Ficha Técnica | Custo por receita, CMV por produto, baixa automática | Profissional |
| Produtos | Cardápio interno com categorias e preços | Essencial |
| Vendas | Promoções, combos, fidelidade e campanhas | Profissional |
| Clientes | Cadastro e histórico | Profissional |
| Fornecedores | Cadastro e contratos | Profissional |
| Colaboradores | Cargos, permissões e senhas de autorização | Gestão |

### Sistema
| Módulo | Descrição | Plano mínimo |
|--------|-----------|--------------|
| Diário Operacional | Registro de ocorrências com auditoria e anexos | Gestão |
| Segurança | Audit trail com filtros e export CSV | Gestão |
| Configurações | Empresa, backup manual/restore, plano atual | Gestão |
| Suporte | Central de atendimento | Todos |
| Manual | Documentação in-app | Todos |

### Plena (operador do sistema — interno)
| Módulo | Descrição | Acesso |
|--------|-----------|--------|
| Painel Master | Métricas cross-empresa, gestão de licenças | `role=master` + empresa Plena |
| PlenaHub | CRM pipeline de prospectos, MRR, upsell | `role=master` + empresa Plena |
| Composer | Envio de notificações segmentadas por plano | `role=master` + empresa Plena |

---

## Integração iFood

O sistema integra com a **API de Pedidos do iFood** (Merchant API v1.0) via app do tipo **Centralizado**.

### Credenciais de Teste

| Campo | Valor |
|-------|-------|
| Merchant ID | 3860495 |
| Merchant UUID | e00e450a-3b69-4db5-892b-d598fbf60fcf |
| App Type | Centralizado |

### Endpoints Consumidos

| Módulo | Endpoint | Descrição |
|--------|----------|-----------|
| Authentication | `POST /authentication/v1.0/oauth/token` | OAuth2 client credentials |
| Order | `GET /order/v1.0/events/poll` | Polling a cada 60s |
| Order | `GET /order/v1.0/orders/{orderId}` | Detalhes do pedido |
| Order | `POST /order/v1.0/orders/{orderId}/confirm` | Confirmar pedido |
| Order | `POST /order/v1.0/orders/{orderId}/requestCancellation` | Rejeitar pedido |
| Order | `POST /order/v1.0/orders/{orderId}/dispatch` | Despachar pedido |
| Order | `POST /order/v1.0/events/acknowledgment` | Confirmar recebimento |

### Fluxo Operacional

```
Novo pedido iFood
  → Polling /events/poll (60s)
  → Mapeamento IFoodOrder → DeliveryOrder interno
  → Exibição no módulo Delivery com countdown 8min
  → Operador: Confirmar / Rejeitar
  → Preparo → Despachar
  → Entregador notificado
```

Documentação técnica completa: [`docs/ifood-homologacao/`](docs/ifood-homologacao/)

---

## Estrutura Principal

```
src/
├── components/           # Todos os módulos da UI
├── services/
│   ├── integrations/
│   │   └── ifoodService.ts   # Adapter iFood API
│   └── ...                   # deliveryService, intelligenceService, salesService...
├── store/
│   └── AppContext.tsx         # Estado global + persistência multiempresa
├── domain/
│   └── saas.ts               # Planos, permissões, módulos — source of truth
├── hooks/
│   ├── useIFoodOrders.ts      # Polling iFood + injeção no fluxo de delivery
│   └── ...
└── types.ts                   # Contratos de domínio

supabase/
├── migrations/               # Schema versionado
└── functions/                # Edge Functions (create-empresa, etc.)

docs/
├── ifood-homologacao/        # Documentação técnica para homologação iFood
└── designs/                  # Referências visuais
```

---

## Configuração

Copie `.env.example` para `.env`:

```bash
VITE_APP_NAME="Plena Gastro Manager"
VITE_LICENSE_STATUS_URL=""              # vazio = uso local liberado
VITE_DEFAULT_EMPRESA_ID="demo-empresa"
VITE_PLENA_EMPRESA_ID="demo-empresa"    # ID da empresa operadora Plena
VITE_NOTIFICATIONS_URL=""               # URL do feed JSON de notificações
VITE_IFOOD_MERCHANT_ID=""               # Merchant ID iFood (após homologação)
VITE_IFOOD_MERCHANT_UUID=""             # Merchant UUID iFood
```

---

## Planos

| Módulo | Essencial R$89 | Profissional R$189 | Gestão R$329 |
|--------|:---------:|:------------:|:------:|
| PDV, Mesas, Caixa, Produtos, Relatórios, Cozinha, Cardápio Digital | ✔ | ✔ | ✔ |
| Estoque, Ficha Técnica, Clientes, Fornecedores, Delivery, Vendas, Pedidos Online, Colaboradores | ❌ | ✔ | ✔ |
| Dashboard, Inteligência, Diário Operacional, Segurança, Configurações | ❌ | ❌ | ✔ |

---

## Segurança

Modelo **Supabase + RLS** com defesa em profundidade:

1. **Auth JWT** — Supabase Auth com sessão segura (HttpOnly cookies)
2. **Row Level Security** — PostgreSQL RLS em todas as tabelas sensíveis
3. **Sidebar** — item não renderizado sem permissão de plano + role
4. **PlanGuard** — view não montada no DOM sem acesso
5. **empresaId** — todas as entidades carregam `empresaId` e são filtradas por ele

---

## Supabase

**Project ref:** `fnzwbauyjhbznqynaupv`  
**Edge Functions deployadas:** `create-empresa`  
**Tabelas principais:** `empresas`, `profiles`, `integration_platforms`, `audit_log`

---

*Plena Informática — tecnologia@plenainformatica.com.br — (12) 99219-1018*
