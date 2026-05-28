# Documento de Fluxo de Integração — iFood API

**Aplicativo:** Plena Gastro Manager  
**Empresa:** Plena Informática  
**CNPJ:** 59.779.242/0001-78  
**Merchant ID (teste):** 3860495  
**Merchant UUID:** e00e450a-3b69-4db5-892b-d598fbf60fcf  
**Tipo de App:** Centralizado  
**Data:** 28/05/2026  

---

## 1. Visão Geral

O Plena Gastro Manager integra com a API do iFood para recebimento e gestão de pedidos dentro do sistema de gestão operacional do restaurante. O app é do tipo **Centralizado**, utilizando autenticação OAuth2 com fluxo de Client Credentials.

---

## 2. Autenticação

**Endpoint:** `POST https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token`

**Parâmetros:**
```
grant_type=client_credentials
client_id={CLIENT_ID}
client_secret={CLIENT_SECRET}
```

**Fluxo:**
1. O sistema solicita token a cada inicialização
2. Token é armazenado em memória com TTL de 6 horas
3. Renovação automática 5 minutos antes do vencimento
4. Em caso de erro 401, o sistema renova o token e reenvia a requisição

---

## 3. Fluxo de Recebimento de Pedidos

### 3.1 Polling de Eventos

**Endpoint:** `GET https://merchant-api.ifood.com.br/order/v1.0/events/poll`

**Frequência:** A cada 60 segundos  
**Header:** `Authorization: Bearer {access_token}`

**Eventos tratados:**

| Evento | Ação do Sistema |
|--------|----------------|
| `PLACED` | Novo pedido recebido — exibe notificação sonora e visual |
| `CONFIRMED` | Confirmação registrada — exibe no KDS de cozinha |
| `DISPATCHED` | Pedido despachado — atualiza status para entregador |
| `CANCELLED` | Cancelamento — remove da fila operacional |

**Fluxo técnico:**
```
1. Sistema faz GET /events/poll a cada 60s
2. Para cada evento PLACED recebido:
   a. Busca detalhes: GET /orders/{orderId}
   b. Mapeia payload iFood → DeliveryOrder interno
   c. Salva no estado local (Supabase/localStorage)
   d. Exibe alerta visual + sonoro para operador
   e. Inicia contagem regressiva de 8 minutos
3. Após polling bem-sucedido: POST /events/acknowledgment
```

### 3.2 Tratamento do Timeout de Confirmação

O sistema exibe um contador regressivo de **8 minutos** para cada pedido PLACED. Se o operador não confirmar no prazo:
- Alerta visual intensificado (borda piscante)
- Notificação sonora repetida
- Ação de confirmação em destaque no card

---

## 4. Fluxo de Confirmação de Pedido

**Endpoint:** `POST https://merchant-api.ifood.com.br/order/v1.0/orders/{orderId}/confirm`

**Trigger:** Botão "Confirmar Pedido" no módulo Delivery do app

**Fluxo:**
```
Operador clica "Confirmar"
  → POST /orders/{orderId}/confirm
  → Sucesso (204): Status atualizado para "em_preparo"
  → Erro: Alerta ao operador + retry automático (1x)
```

---

## 5. Fluxo de Rejeição de Pedido

**Endpoint:** `POST https://merchant-api.ifood.com.br/order/v1.0/orders/{orderId}/requestCancellation`

**Trigger:** Botão "Rejeitar" no módulo Delivery

**Motivos mapeados:**
- Restaurante sem capacidade no momento
- Item indisponível no cardápio
- Problema técnico

**Fluxo:**
```
Operador clica "Rejeitar" → Seleciona motivo
  → POST /orders/{orderId}/requestCancellation
    { "cancellationCode": "501", "reason": "..." }
  → Sucesso: Pedido marcado como cancelado no sistema
```

---

## 6. Fluxo de Despacho (Delivery)

**Endpoint:** `POST https://merchant-api.ifood.com.br/order/v1.0/orders/{orderId}/dispatch`

**Trigger:** Botão "Despachar" após entregador associado

**Fluxo:**
```
Pedido em status "pronto"
  → Operador associa entregador
  → Clica "Despachar"
  → POST /orders/{orderId}/dispatch
  → Sucesso: Status atualizado para "despachado"
  → Entregador notificado no sistema interno
```

---

## 7. Mapeamento de Dados

O sistema mapeia o payload da API iFood para o modelo interno `DeliveryOrder`:

| Campo iFood | Campo interno | Transformação |
|-------------|--------------|---------------|
| `id` | `externalId` | prefixado com "ifood-" |
| `reference` | `externalReference` | direto |
| `customer.name` | `customerName` | direto |
| `customer.phone` | `phone` | direto |
| `delivery.deliveryAddress` | `address` | concatenação rua + número |
| `items[]` | `items[]` | nome + subItems concatenados |
| `payments[0].code` | `paymentMethod` | mapeamento: PIX→pix, CREDIT→credito, DEBIT→debito |
| `total.subTotal` | `subtotal` | direto |
| `total.deliveryFee` | `deliveryFee` | direto |
| `total.benefits` | `discount` | direto |
| `total.orderAmount` | `total` | direto |
| `isTest` | `isTest` | flag de pedido de teste |

---

## 8. Tratamento de Erros

| Código HTTP | Tratamento |
|-------------|------------|
| 401 | Renovar token e retentar |
| 404 | Pedido não encontrado — log + ignorar |
| 408 | Timeout — retentar em 30s |
| 422 | Dados inválidos — log detalhado + alerta operador |
| 5xx | Retry com backoff exponencial (3 tentativas) |

---

## 9. Dados de Teste Utilizados

Durante o desenvolvimento, foram utilizados pedidos mock com `isTest: true`:

- **IFOOD-TST-1001:** Delivery — Hamburguer + Batata, Pix, R$91,70
- **IFOOD-TST-1002:** Takeout — Marmita + Suco, Cartão, R$51,00
- **IFOOD-TST-1003:** Delivery — Pizza Margherita, Dinheiro, R$66,90

---

## 10. Segurança

- Credenciais armazenadas em variáveis de ambiente (nunca em código)
- Token OAuth2 em memória (não persiste em disco)
- HTTPS obrigatório em todos endpoints
- Merchant ID validado por empresa no banco de dados (multiempresa)
- Webhook secret validado via HMAC-SHA256 (quando ativado)

---

*Documento gerado pela equipe técnica da Plena Informática para processo de homologação iFood.*
