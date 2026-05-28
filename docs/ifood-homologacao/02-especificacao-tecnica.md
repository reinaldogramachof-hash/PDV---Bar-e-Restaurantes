# Especificação Técnica — Integração iFood API

**Aplicativo:** Plena Gastro Manager  
**Empresa:** Plena Informática  
**CNPJ:** 59.779.242/0001-78  
**Contato técnico:** tecnologia@plenainformatica.com.br  
**WhatsApp:** (12) 99219-1018  
**Data:** 28/05/2026  

---

## 1. Identificação do Aplicativo

| Campo | Valor |
|-------|-------|
| Nome | Plena Gastro Manager |
| Tipo | Centralizado |
| Versão | 1.0.0 |
| Merchant ID (teste) | 3860495 |
| Merchant UUID | e00e450a-3b69-4db5-892b-d598fbf60fcf |
| Idioma da interface | Português (Brasil) |
| Plataforma | Web (PWA — Progressive Web App) |

---

## 2. Stack Tecnológico

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | React | 18.x |
| Linguagem | TypeScript | 5.3+ |
| Build | Vite | 5.x |
| Estilização | Tailwind CSS | v4 |
| Backend / Auth | Supabase (PostgreSQL + Auth) | 2.x |
| Runtime | Node.js | 20.x |
| Hospedagem | Vercel / Netlify (produção) | — |

---

## 3. Módulos da API iFood Consumidos

| Módulo | Endpoints Utilizados | Finalidade |
|--------|---------------------|------------|
| **Authentication** | `POST /oauth/token` | Autenticação OAuth2 |
| **Order** | `GET /events/poll` | Polling de novos pedidos |
| **Order** | `GET /orders/{orderId}` | Detalhes do pedido |
| **Order** | `POST /orders/{orderId}/confirm` | Confirmar pedido |
| **Order** | `POST /orders/{orderId}/requestCancellation` | Rejeitar pedido |
| **Order** | `POST /orders/{orderId}/dispatch` | Despachar pedido |
| **Order** | `POST /events/acknowledgment` | Confirmar recebimento de eventos |
| **Merchant** | `GET /merchants` | Dados do estabelecimento |

---

## 4. Arquitetura de Integração

```
┌─────────────────────────────────────────────┐
│           Plena Gastro Manager               │
│                                              │
│  ┌─────────────┐    ┌──────────────────────┐ │
│  │  useIFood   │    │   Delivery Module    │ │
│  │  Orders.ts  │───▶│  (UI do Operador)    │ │
│  │  (hook)     │    │                      │ │
│  └──────┬──────┘    └──────────────────────┘ │
│         │                                    │
│  ┌──────▼──────┐                             │
│  │  ifoodSer-  │                             │
│  │  vice.ts    │                             │
│  └──────┬──────┘                             │
└─────────┼───────────────────────────────────┘
          │ HTTPS / OAuth2
          ▼
┌─────────────────────┐
│   iFood Merchant    │
│       API           │
│  merchant-api.      │
│  ifood.com.br       │
└─────────────────────┘
```

**Padrão:** Adapter Pattern  
O serviço `ifoodService.ts` isola completamente a lógica de integração do domínio da aplicação. O módulo de Delivery não conhece a origem dos pedidos — recebe sempre o tipo interno `DeliveryOrder`.

---

## 5. Modelo de Dados — DeliveryOrder

Modelo interno que representa um pedido de qualquer plataforma:

```typescript
interface DeliveryOrder {
  id: string;                    // "ifood-{externalId}"
  empresaId: string;             // ID da empresa no sistema
  customerName: string;
  phone: string;
  address: string;
  neighborhood: string;
  items: DeliveryOrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: 'pix' | 'credito' | 'debito' | 'dinheiro' | 'voucher';
  status: 'recebido' | 'confirmado' | 'em_preparo' | 'pronto' | 'despachado' | 'entregue' | 'cancelado';
  notes?: string;                // "iFood #IFOOD-REF-001"
  createdAt: string;
  sourcePlatform: 'ifood' | 'rappi' | 'aiqfome' | 'proprio';
  externalId?: string;           // ID original na plataforma
  externalReference?: string;    // Referência legível (ex: IFOOD-TST-1001)
  isTest: boolean;               // Flag para pedidos de teste
}
```

---

## 6. Configuração por Empresa (Multiempresa)

O sistema é SaaS multiempresa. Cada restaurante configura suas próprias credenciais iFood:

**Tabela:** `integration_platforms` (Supabase PostgreSQL)

```sql
CREATE TABLE integration_platforms (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     text NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  platform_id    text NOT NULL CHECK (platform_id IN ('ifood','rappi','99food','aiqfome')),
  merchant_id    text,
  merchant_uuid  text,
  client_id      text,
  client_secret  text,
  webhook_secret text,
  enabled        boolean DEFAULT false,
  status         text DEFAULT 'disconnected'
                 CHECK (status IN ('connected','disconnected','error')),
  last_sync_at   timestamptz,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now(),
  UNIQUE (empresa_id, platform_id)
);
```

Row Level Security (RLS) habilitado — cada empresa acessa apenas suas próprias credenciais.

---

## 7. Fluxo de Autenticação OAuth2

```
1. App carrega → chama getIFoodToken(clientId, clientSecret)
2. POST /authentication/v1.0/oauth/token
   { grant_type: "client_credentials", clientId, clientSecret }
3. Resposta: { access_token, token_type: "Bearer", expires_in: 21600 }
4. Token armazenado em memória (variável de módulo, não persiste)
5. Todas requisições: Header "Authorization: Bearer {token}"
6. Token renovado automaticamente 5min antes do vencimento
```

---

## 8. Controle de Qualidade Implementado

- **Timeout de confirmação:** Timer de 8 minutos visível por pedido, com alertas progressivos
- **Retry automático:** 3 tentativas com backoff exponencial em erros 5xx
- **Deduplicação:** Pedidos com mesmo `externalId` não são duplicados
- **Filtro de testes:** Interface permite filtrar/ocultar pedidos com `isTest: true`
- **Log de auditoria:** Todas ações (confirmar, rejeitar, despachar) registradas com timestamp e usuário
- **Isolamento por empresa:** Pedidos iFood vinculados ao `empresaId` do operador logado

---

## 9. Ambiente de Desenvolvimento e Produção

| Ambiente | URL Base API | Credenciais |
|----------|-------------|-------------|
| Desenvolvimento | `https://merchant-api.ifood.com.br` | Mock local (sem chamadas reais) |
| Homologação | `https://merchant-api.ifood.com.br` | Credenciais de sandbox iFood |
| Produção | `https://merchant-api.ifood.com.br` | Credenciais de produção por merchant |

---

## 10. Conformidade com Políticas iFood

- **Polling:** Intervalo de 60 segundos (dentro do limite recomendado)
- **Confirmação:** Sistema garante confirmação dentro de 8 minutos
- **Dados do cliente:** Armazenados apenas durante operação (sem persistência além do necessário)
- **Segurança:** Credenciais em variáveis de ambiente criptografadas (Supabase Vault)
- **Rate limiting:** Implementado controle de requisições no hook de integração

---

*Especificação técnica gerada pela equipe de desenvolvimento da Plena Informática para processo de homologação junto ao iFood.*

**Responsável técnico:** Reinaldo Gramacho  
**E-mail:** tecnologia@plenainformatica.com.br  
**Telefone:** (12) 99219-1018
