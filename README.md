# Gestão Gastro

Plataforma SaaS de gestão operacional para bares, restaurantes e operações de delivery.

Cobre a jornada completa: do pedido do garçom ao fechamento do caixa, com mesas, cozinha, estoque, delivery, inteligência gerencial e gestão comercial em um único lugar. Arquitetura multiempresa preparada para migração a backend centralizado (Fase 3).

## Stack

- React 18 + TypeScript 5.3
- Vite 6 + `@tailwindcss/vite` (Tailwind v4)
- `motion/react` para animações
- `qrcode` para geração de QR do cardápio digital
- PWA via `vite-plugin-pwa`
- Persistência local segmentada por empresa (`buildScopedStorageKey`)

## Scripts

```bash
npm install
npm run dev
npm run lint        # tsc --noEmit (TypeScript strict)
npm run test
npm run build
```

## Módulos

### Operação
| Módulo | Descrição | Plano mínimo |
|--------|-----------|--------------|
| PDV | Lançamento de pedidos, combos, descontos | Essencial |
| Mesas | Gestão de mesas e comandas | Essencial |
| Cozinha | Fila de produção em tempo real | Profissional |
| Caixa | Abertura, fechamento e sangrias | Essencial |
| Delivery | Canal próprio: fila, entregadores, financeiro | Profissional |

### Gestão
| Módulo | Descrição | Plano mínimo |
|--------|-----------|--------------|
| Dashboard | Visão do dia com ranking de atendentes | Gestão |
| Relatórios | Fluxo de caixa, vendas, produtos, atendentes | Essencial |
| Inteligência | BI gerencial com motor de regras e recomendações | Gestão |
| Estoque | Controle de itens e movimentações | Profissional |
| Produtos | Cardápio interno com categorias e preços | Essencial |
| Cardápio Digital | Menu público via QR code com configuração visual | Profissional |
| Vendas | Promoções, combos, fidelidade e campanhas | Profissional |
| Clientes | Cadastro e histórico | Profissional |
| Fornecedores | Cadastro e contratos | Profissional |
| Colaboradores | Cargos, permissões e senhas de autorização | Gestão |

### Sistema
| Módulo | Descrição | Plano mínimo |
|--------|-----------|--------------|
| Segurança | Audit trail com filtros e export CSV | Gestão |
| Configurações | Empresa, backup manual/restore, plano atual | Gestão |
| Notificações | Feed de comunicados da Plena (atualizações, ofertas) | Todos |
| Suporte | Central de atendimento | Todos |
| Manual | Documentação in-app | Todos |

### Plena (operador do sistema)
| Módulo | Descrição | Acesso |
|--------|-----------|--------|
| Painel Master | Métricas cross-empresa, gestão de licenças | `role=master` |
| PlenaHub | CRM pipeline de prospectos, MRR, upsell | `role=master` |
| Composer | Envio de notificações segmentadas por plano | `role=master` |

## Estrutura Principal

```
src/
├── components/       # Todos os módulos da UI
├── services/         # Lógica de negócio (deliveryService, intelligenceService, salesService...)
├── store/
│   └── AppContext.tsx # Estado global + persistência multiempresa
├── domain/
│   └── saas.ts       # Planos, permissões, módulos — source of truth
├── hooks/            # useAudit, useNavigation, etc.
└── types.ts          # Contratos de domínio

docs/
├── security/         # Auditoria de segurança Fase 2 + backlog Fase 3
└── designs/          # Referências visuais
```

## Configuração

Copie `.env.example` para `.env`:

```bash
VITE_APP_NAME="Gestão Gastro"
VITE_LICENSE_STATUS_URL=""         # vazio = uso local liberado
VITE_DEFAULT_EMPRESA_ID="demo-empresa"
VITE_NOTIFICATIONS_URL=""          # URL do feed JSON de notificações da Plena
```

Quando `VITE_LICENSE_STATUS_URL` estiver preenchido, a URL deve retornar `BLOQUEADO` para suspender o acesso do cliente.

Quando `VITE_NOTIFICATIONS_URL` estiver preenchido, o app busca o feed de notificações ao abrir (cache de 1h). Sem a variável, o sino permanece silencioso.

## Cardápio Digital

Cada empresa tem uma rota pública de cardápio acessível sem login:

```
/cardapio/:empresaId
```

Configure em **Cardápio Digital → QR Code** para gerar e baixar o QR code para impressão.

Na Fase 3 (Supabase), este endereço será publicado como subdomínio:
`cantina-brasil.plena.com.br`

## Planos

| Módulo | Essencial | Profissional | Gestão |
|--------|:---------:|:------------:|:------:|
| PDV, Mesas, Caixa, Produtos, Relatórios | ✔ | ✔ | ✔ |
| Cozinha, Estoque, Clientes, Fornecedores, Delivery, Cardápio Digital, Vendas | ❌ | ✔ | ✔ |
| Dashboard, Colaboradores, Segurança, Configurações, Inteligência | ❌ | ❌ | ✔ |

## Segurança

Modelo **Local-First** com defesa em profundidade (3 camadas):
1. Sidebar — item não renderizado sem permissão
2. PlanGuard — view não montada no DOM
3. Validação interna por `hasPermission`

Riscos conhecidos e plano de mitigação para Fase 3 em `docs/security/`.

## Direção de Evolução — Fase 3 (Supabase)

```
Sprint 1: Auth JWT + HttpOnly cookies (resolve localStorage plaintext)
Sprint 2: Migrar collections → PostgreSQL multi-tenant
Sprint 3: Supabase Storage → imagens de produtos + cardápio
Sprint 4: Cardápio digital público (subdomínio por cliente)
Sprint 5: Realtime → pedidos online para cozinha em <1s
```

Toda a arquitetura atual (`empresaId`, `buildScopedStorageKey`, multiempresa) foi desenhada para essa migração — sem refactoring estrutural necessário.

Ver decisão completa em `EVOLUTION.md`.
