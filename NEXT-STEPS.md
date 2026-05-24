# NEXT-STEPS.md — Próximos Passos

> Documento de continuidade. Atualizado ao final da sessão 2026-05-24.

---

## 🔴 Imediato — Antes de Prosseguir

### 1. QA Reinaldo (validação humana obrigatória)
Testar na branch `feat/port-logica-negocio` antes do merge:

**Novos módulos desta sessão:**
- [ ] Delivery — kanban de fila, cadastro de entregadores, financeiro, export CSV
- [ ] Pedidos Online — carrinho no `/cardapio/:empresaId`, checkout WhatsApp, painel de status
- [ ] Inteligência — health score, tendências, produtos, recomendações (12 regras)
- [ ] Central de Vendas — promoções, combos, fidelidade, campanhas
- [ ] PlenaHub — pipeline de prospectos, MRR, composer de notificações (role=master)
- [ ] Notificações — bell no header, feed JSON, markAsRead

**Fluxos críticos:**
- [ ] Configurar WhatsApp em Cardápio Digital → Aparência → testar pedido completo
- [ ] Collaborators → criar colaborador com senha → testar SecurityGate
- [ ] Isolation multiempresa — Empresa A não vê dados de Empresa B

### 2. Merge para main
```bash
git checkout main
git merge feat/port-logica-negocio
git push origin main
```

---

## 🟡 Fase 3 — Supabase (próxima grande sessão)

Decisão aprovada em 2026-05-24: backend central Supabase multi-tenant.  
Ver detalhes completos em `EVOLUTION.md`.

### Sprint 1 — Auth JWT (prioridade máxima)
- Criar projeto Supabase
- Configurar Auth (email + password)
- Substituir `currentUser` do AppContext por sessão JWT
- Cookies HttpOnly + Secure + SameSite=Strict
- Resolve R-01 e R-02 do backlog de segurança (`docs/security/backlog-fase3.md`)

### Sprint 2 — Migrar localStorage → PostgreSQL
- Criar tabelas com RLS por `empresa_id`
- Migrar collections: orders, products, stock, collaborators, customers...
- Manter `buildScopedStorageKey` como camada de abstração durante transição
- Resolve R-03 (audit trail imutável)

### Sprint 3 — Supabase Storage
- Upload de imagens de produtos (hoje: base64 local)
- CDN automático para cardápio digital
- Resize server-side via Edge Function

### Sprint 4 — Cardápio Digital Público
- Subdomínio por cliente: `cantina-brasil.plena.com.br`
- App leve separado (Vite/React) hospedado em Vercel
- Mesmo backend Supabase — sem servidor por cliente

### Sprint 5 — Realtime (fecha o circuito Pedidos Online)
- Supabase Realtime → pedidos do cliente → OnlineOrders.tsx em <1s
- Substitui o fallback WhatsApp atual
- Estrutura `OnlineOrder` já compatível com PostgreSQL

---

## 🟢 Melhorias Futuras (baixa prioridade)

- Portal do entregador freelance (disponibilidade online) — Fase 3+
- Subdomínio por cliente para cardápio digital — Sprint 4
- Composer de notificações com agendamento — pós Supabase
- Testes automatizados: `deliveryService.test.ts`, `intelligenceService.test.ts`, etc. (arquivos criados, não commitados)

---

**Versão:** 1.0  
**Última atualização:** 2026-05-24  
**Responsável:** Reinaldo Gramacho (QA) + Claude (validação técnica)
