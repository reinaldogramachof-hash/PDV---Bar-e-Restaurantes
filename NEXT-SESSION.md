# Próxima Sessão — Plena Gastro Manager

**Data:** 2026-05-29 (manhã)
**Branch:** `feat/fase3-supabase`
**Status:** Sprint 3E concluída e commitada — branch pronta para merge

---

## Resumo da Sessão 2026-05-28

### Entregas concluídas hoje

| Sprint | Descrição | Commit |
|--------|-----------|--------|
| 3A | Acentos + bug Painel Master + gestão usuários | `06dc393` |
| 3B | Ficha Técnica + CMV Real + baixa automática | `25c876b` |
| 3C | Comanda Mobile PWA (App do Garçom) | `e0e00a1` |
| 3D | Hub iFood + Código de Coleta Takeout | `1dda610` + `9ca33ff` |
| 3D.2 | Código de Coleta Takeout iFood | `9ca33ff` |
| Débito | Diário: upload entryId real + thumbnails lightbox | `b1ec70e` + `40531a8` |
| 4A | MRR Real no Painel Master + CSV export | `a235935` |
| 3E | NFC-e via Focus NF-e (service + hook + UI + migration) | pendente push |
| Logo | PGM aplicado (favicon, manifest, sidebar) | `3c2e3b1` |

### Ações humanas concluídas hoje
- ✅ Ticket iFood homologação aberto — **#27970298 (Em análise)**
- ✅ Documentação técnica gerada (docs/ifood-homologacao/)
- ✅ App iFood registrado (Merchant ID: 3860495)

---

## Opção A — Merge e Deploy (Recomendado ao iniciar)

A branch `feat/fase3-supabase` está madura com 10+ sprints entregues.

**Checklist de validação antes do merge:**
- [ ] Login com usuário Supabase (tecnologia@plenainformatica.com.br)
- [ ] Painel Master visível APENAS para o usuário Plena
- [ ] Diário Operacional: criar entry + anexo (thumbnail aparece no card)
- [ ] Sidebar: validar grupos por role (garçom, gerente, master)
- [ ] Comanda Mobile: acessar /comanda no celular
- [ ] Caixa: botão "Emitir NFC-e" aparece quando Emissor Fiscal habilitado
- [ ] Delivery: pedido TAKEOUT com código de coleta "4521" (mock)
- [ ] Painel Master: MRR calculado, export CSV funciona
- [ ] `npm run build` sem erros

Após validação: **abrir PR e fazer merge feat/fase3-supabase → main**

---

## Opção B — Sprint 4B: Campos Fiscais por Produto

Débito técnico da Sprint 3E: NCM e CFOP fixos por produto.

**Escopo:**
- Campo `ncm` e `cfop` opcionais em Product (src/types.ts)
- Interface em Produtos → editar produto → aba "Dados Fiscais"
- Fallback mantido para produtos sem campos fiscais preenchidos

---

## Opção C — Sprint 4C: Rappi / Outras Plataformas

Expandir o Hub de Integrações além do iFood:
- Adapter Rappi (estrutura idêntica ao ifoodService)
- Adapter AiqFome
- Painel de integrações unificado em Configurações

---

## Opção D — Sprint 4D: Manual de Uso In-App

Reduzir tickets de suporte:
- Seções por módulo (PDV, Mesas, Cozinha, Caixa...)
- Busca por palavra-chave
- Checklist de onboarding para novos usuários

---

## Ações Humanas Pendentes

| Ação | Prioridade | Observação |
|------|-----------|------------|
| Criar conta gratuita Focus NF-e | Alta | Obter token de homologação para testar Sprint 3E |
| Acompanhar ticket iFood #27970298 | Alta | Responder perguntas em até 48h |
| Merge feat/fase3-supabase → main | Alta | Após validação humana completa |
| Contratar plano Retail Focus NF-e | Baixa | Só no go-live do módulo fiscal |

---

## Arquitetura Atual

```
src/
  domain/saas.ts              → Source of truth: planos, módulos, permissões, MRR
  components/
    Diario.tsx                → Módulo Diário (thumbnails + lightbox)
    Layout.tsx                → Sidebar 5 grupos semânticos
    Delivery.tsx              → Hub iFood + código de coleta takeout
    ComandaMobile.tsx         → PWA garçom (rota /comanda)
    MasterDashboard.tsx       → Painel Master + MRR + CSV
    CheckoutModal.tsx         → Fechamento + botão NFC-e
    Settings.tsx              → Configurações + Emissor Fiscal
  services/integrations/
    ifoodService.ts           → Adapter iFood (mock + stubs reais)
    focusNfeService.ts        → Adapter Focus NF-e (NFC-e modelo 65)
  hooks/
    useAuth.ts                → Auth Supabase → currentUser com codigoInterno
    useIFoodOrders.ts         → Polling iFood + fila de pedidos
    useNFCe.ts                → Config + emissão + log NFC-e
  store/AppContext.tsx         → Estado global multiempresa

supabase/
  migrations/
    20260528000001_integration_platforms.sql  → iFood/Rappi config por empresa
    20260528000002_nfce_config.sql            → NFC-e config + logs por empresa
```

**Planos:**
- `essencial` R$89 — PDV, Mesas, Cozinha, Cardápio, Caixa, Relatórios, Produtos
- `profissional` R$189 — + Delivery, Estoque, Clientes, Colaboradores, Fornecedores
- `gestao` R$329 — + Dashboard, IA, Diário, Configurações, Segurança

**Supabase project:** `fnzwbauyjhbznqynaupv`
**Edge Functions:** `create-empresa`
**iFood Merchant ID:** `3860495` | Ticket: `#27970298`
**Focus NF-e:** conta pendente de criação (homologação)

---

## Como Iniciar a Próxima Sessão

1. Reinaldo valida os fluxos (Opção A)
2. Se aprovado: merge feat/fase3-supabase → main
3. Escolher próximo sprint (B, C ou D)
4. Claude planeja → Codex implementa → Claude valida

> Nenhuma feature avança para produção sem aprovação humana final do Reinaldo.
