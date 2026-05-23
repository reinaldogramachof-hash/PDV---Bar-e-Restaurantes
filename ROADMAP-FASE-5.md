# ROADMAP — Fase 5: SaaS Comercial

**Status:** 🔒 Congelado  
**Data:** 2026-05-23  
**Proprietário:** Plena Informática  
**Custódio da Spec:** Claude (Validador Estratégico)

> Este documento é a spec congelada da Fase 5. Qualquer alteração deve ser documentada em EVOLUTION.md com justificativa.

---

## 🎯 Objetivo da Fase 5

Transformar o Sistema de Gestão Restaurantes em uma plataforma **SaaS comercializável**, com:
- Isolamento total de dados por empresa
- Controle de planos e licenças
- Onboarding automatizado para novos clientes
- Backup e auditoria robustos
- Painel de gestão cross-empresa para o operador Plena

---

## 📋 Features

### Feature 1 — Painel Master
**Prioridade:** Alta | **Estimativa:** 20h Codex | **Status:** ⏳ Não iniciado

**Objetivo:** Dashboard exclusivo para o operador Plena visualizar métricas agregadas de todas as empresas clientes.

**Requisitos Funcionais:**
- [ ] Rota `/master` protegida por role `master`
- [ ] Componente `MasterDashboard.tsx` em `src/components/`
- [ ] Cards de métricas por empresa: receita, pedidos, usuários ativos
- [ ] Filtros: período (dia/semana/mês), empresa, plano
- [ ] Tabela de empresas com status de licença, plano atual, última atividade
- [ ] Gráfico de crescimento MoM (Month-over-Month)
- [ ] Alertas de empresas com licença próxima do vencimento

**Requisitos Não-Funcionais:**
- [ ] Acesso restrito a `role === 'master'` + validação de super-access
- [ ] Dados agregados por `empresaId` (nunca cross-empresa sem permissão)
- [ ] Storage: `gestao-gastro:master:aggregated-metrics` (separado por empresa)
- [ ] Lazy-load do componente (não impacta bundle das rotas principais)
- [ ] `React.memo` nos cards de métricas

**Componentes:**
- `MasterDashboard.tsx` — container principal
- `MasterMetricCard.tsx` — card KPI reutilizável
- `MasterCompanyTable.tsx` — tabela de empresas
- `MasterFilterBar.tsx` — filtros de período/empresa/plano

**Risco:** Acesso cross-empresa. Mitigação: validar `role === 'master'` em cada query + testes de isolamento.

---

### Feature 2 — Sistema de Planos
**Prioridade:** Alta | **Estimativa:** 20h Codex | **Status:** ⏳ Não iniciado

**Objetivo:** Controlar quais módulos cada empresa pode acessar conforme seu plano contratado.

**Requisitos Funcionais:**
- [ ] Três planos implementados conforme `src/domain/saas.ts`:
  - `essencial`: pdv, mesas, caixa, produtos, relatorios
  - `profissional`: + cozinha, estoque, clientes, fornecedores
  - `gestao`: + dashboard, colaboradores, configuracoes, seguranca, suporte, manual
- [ ] `PlanGuard` — componente que bloqueia acesso a módulo fora do plano
- [ ] UI de plano atual visível em `Settings.tsx`
- [ ] Tela de upgrade (CTA para contato Plena) quando tenta acessar módulo bloqueado
- [ ] `canAccessModule(plan, role, moduleId)` já existe em `saas.ts` — usar

**Requisitos Não-Funcionais:**
- [ ] Verificação de plano no hook `useNavigation` (antes de renderizar)
- [ ] Storage: plano em `gestao-gastro:<empresaId>:settings`
- [ ] Sem hardcode de plano em componentes individuais — sempre via `canAccessModule`

**Componentes:**
- `PlanGuard.tsx` — wrapper de proteção de módulo
- `PlanUpgradeBanner.tsx` — CTA de upgrade
- Modificar `useNavigation.ts` para filtrar views por plano

**Risco:** Regressão em módulos existentes. Mitigação: testes de acesso para cada combinação role × plano.

---

### Feature 3 — Sistema de Licenças
**Prioridade:** Alta | **Estimativa:** 15h Codex | **Status:** ⏳ Não iniciado

**Objetivo:** Controlar validade de licença por empresa. Bloquear acesso quando licença expirada.

**Requisitos Funcionais:**
- [ ] `LicenseLock.tsx` já existe — refinar para mostrar data de expiração e contato
- [ ] `licenseService.ts` em `src/services/` — verificar status, calcular dias restantes
- [ ] Verificação de licença no boot da aplicação (antes de mostrar qualquer módulo)
- [ ] Banner de aviso quando licença vence em ≤ 30 dias
- [ ] `license.status` file (já existe) como fallback offline
- [ ] Tipos `Licenca` e `LicenseStatus` já em `types.ts` — usar

**Requisitos Não-Funcionais:**
- [ ] Verificação via `LICENSE_STATUS_URL` (env var) com fallback para arquivo local
- [ ] Cache de status por 1h em sessionStorage (evitar requests excessivos)
- [ ] Graceful degradation: se URL inacessível, usar último status conhecido
- [ ] Empresas com `trial` têm acesso limitado a 14 dias

**Componentes:**
- `LicenseLock.tsx` — refinar UI (já existe)
- `LicenseBanner.tsx` — aviso de vencimento próximo
- `src/services/licenseService.ts` — lógica de verificação

**Risco:** Loop de verificação pode causar flicker na UI. Mitigação: loading state + cache agressivo.

---

### Feature 4 — Onboarding Automatizado
**Prioridade:** Média | **Estimativa:** 15h Codex | **Status:** ⏳ Não iniciado

**Objetivo:** Guiar novo cliente desde o signup até o primeiro pedido em <10 minutos.

**Requisitos Funcionais:**
- [ ] Tela de signup: nome da empresa, CNPJ, plano escolhido, admin do sistema
- [ ] Wizard de configuração inicial:
  1. Dados da empresa (nome, logo, endereço)
  2. Configuração de mesas (quantidade, capacidade)
  3. Primeiro produto no cardápio
  4. Configuração do caixa (moeda, forma de pagamento padrão)
- [ ] Progresso do wizard salvo em localStorage (retomar se fechar)
- [ ] Checklist de "Primeiros Passos" visível no Dashboard até 100% completo
- [ ] Email de boas-vindas (via `@google/genai` para gerar conteúdo personalizado)

**Requisitos Não-Funcionais:**
- [ ] Wizard completamente isolado por `empresaId`
- [ ] Gera `empresaId` único no signup (UUID v4)
- [ ] Mock data resetado após onboarding (empresa começa limpa)
- [ ] Acessível apenas na primeira sessão (flag `onboardingComplete` em settings)

**Componentes:**
- `OnboardingWizard.tsx` — container do wizard
- `OnboardingStep*.tsx` — um componente por passo (4 steps)
- `OnboardingChecklist.tsx` — widget no Dashboard
- `src/services/onboardingService.ts` — lógica de progresso

**Risco:** Gerar `empresaId` duplicado. Mitigação: UUID v4 + verificação de colisão.

---

### Feature 5 — Backup Automatizado
**Prioridade:** Média | **Estimativa:** 12h Codex | **Status:** ⏳ Não iniciado

**Objetivo:** Backup periódico dos dados de cada empresa, com restore validado.

**Requisitos Funcionais:**
- [ ] `exportData()` já existe em `AppContext` — expor na UI de Settings
- [ ] Schedule automático: backup diário às 23h (via `setInterval` + timestamp)
- [ ] Backup manual via botão em `Settings.tsx`
- [ ] Restore com validação: verificar `empresaId` do arquivo antes de importar
- [ ] Histórico de backups: lista com data/hora/tamanho (últimos 7)
- [ ] Download de backup como JSON com nome `gestao-gastro-<empresaId>-<date>.json`

**Requisitos Não-Funcionais:**
- [ ] `importData` deve validar que `empresaId` do JSON = `empresaId` atual (bug conhecido)
- [ ] Backup comprimido se >1MB (usar `CompressionStream` API)
- [ ] Backup não inclui dados de outras empresas (isolamento garantido)
- [ ] Testes: exportar empresa A, importar em empresa B → deve rejeitar

**Componentes:**
- `BackupManager.tsx` — UI em Settings (tab "Backup")
- `src/services/backupService.ts` — lógica de export/import/schedule
- Corrigir `importData` em `AppContext.tsx` (validação empresaId)

**Risco:** `importData` sem validação de `empresaId` (bug documentado). Mitigação: validação obrigatória antes de merge.

---

### Feature 6 — Auditoria Completa
**Prioridade:** Média | **Estimativa:** 10h Codex | **Status:** ⏳ Não iniciado

**Objetivo:** Registrar todas as operações sensíveis com actor, timestamp e contexto.

**Requisitos Funcionais:**
- [ ] `AuditLogEntry` já em `types.ts` — usar
- [ ] `Security.tsx` já existe — expandir para mostrar logs com filtros
- [ ] Eventos auditados:
  - Login / logout
  - Abertura/fechamento de caixa
  - Pedidos cancelados
  - Produtos excluídos
  - Alterações de preço
  - Exportação de dados
  - Restore de backup
  - Alterações de permissão
- [ ] Filtros: por tipo de evento, por usuário, por período
- [ ] Export de auditoria em CSV

**Requisitos Não-Funcionais:**
- [ ] Logs imutáveis (append-only em storage)
- [ ] Storage: `gestao-gastro:<empresaId>:auditLogs`
- [ ] Retenção: 90 dias (purge automático de entradas antigas)
- [ ] Logs não acessíveis por roles sem permissão `seguranca:read`

**Componentes:**
- Expandir `Security.tsx` (adicionar filtros + export CSV)
- `src/services/auditService.ts` — funções `logEvent`, `queryLogs`, `exportCSV`
- Hook `useAudit()` para disparar eventos de qualquer componente

**Risco:** Performance com muitos logs. Mitigação: paginação de 50 por página + virtual scroll.

---

### Feature 7 — Isolamento de Dados
**Prioridade:** Crítica | **Estimativa:** 8h Codex | **Status:** ⏳ Não iniciado

**Objetivo:** Garantir que nenhuma empresa veja dados de outra. Corrigir bugs conhecidos.

**Requisitos Funcionais:**
- [ ] Corrigir `importData`: validar `empresaId` antes de merge (bug documentado)
- [ ] Corrigir `closeCashier`: filtrar despesas apenas da sessão atual (bug documentado)
- [ ] Auditoria de todos os pontos de acesso ao storage: verificar uso de `buildScopedStorageKey`
- [ ] Teste de isolamento: criar empresa A + empresa B, verificar que dados não vazam
- [ ] Middleware de validação de `empresaId` em todas as mutations do `AppContext`

**Requisitos Não-Funcionais:**
- [ ] 100% das collections usando `buildScopedStorageKey`
- [ ] Testes automatizados de isolamento (empresa1 ≠ empresa2 em todos os módulos)
- [ ] Sem acesso a `localStorage` direto sem passar por `buildScopedStorageKey`

**Componentes:**
- Modificar `AppContext.tsx` — validação de `empresaId` em mutations
- Modificar `AppContext.tsx` — corrigir `importData` e `closeCashier`
- `src/domain/saas.test.ts` — expandir testes de isolamento

**Risco:** Breaking change em mutations. Mitigação: testes antes e depois + sem alterar API pública do context.

---

### Feature 8 — Migração de Componentes Pendentes
**Prioridade:** Baixa | **Estimativa:** 4h Codex | **Status:** ⏳ Não iniciado

**Objetivo:** Completar a migração para o padrão de densidade desktop-first.

**Componentes pendentes:**
- [ ] `UserManual.tsx`
- [ ] `CheckoutModal.tsx`
- [ ] `MenuList.tsx`
- [ ] `Support.tsx`

**Padrão:** Conforme tokens em `src/index.css` e CLAUDE.md (seção Padrão UI)

---

## 🔢 Ordem de Execução Recomendada

```
Sprint 1 (Paralelo):
  Track A: Feature 7 — Isolamento (fundação, desbloqueia tudo)
  Track B: Feature 3 — Licenças (fundação SaaS)
  Track C: Feature 8 — Migração pendente (baixo risco, paralelo)

Sprint 2 (Após Sprint 1):
  Track A: Feature 2 — Sistema de Planos (depende de licenças)
  Track B: Feature 6 — Auditoria (independente)

Sprint 3 (Após Sprint 2):
  Track A: Feature 1 — Painel Master (depende de planos + auditoria)
  Track B: Feature 4 — Onboarding (independente)
  Track C: Feature 5 — Backup (corrigir importData, bloqueia Feature 7)
```

---

## ✅ Critério de Conclusão da Fase 5

- [ ] Todas as 8 features implementadas e aprovadas por Claude
- [ ] Lint 100%, Build 100%, Tests >80% coverage
- [ ] Reinaldo testou cenários críticos de isolamento multiempresa
- [ ] EVOLUTION.md atualizado com learnings
- [ ] README_COMERCIAL.md atualizado com novas features

---

**Versão:** 1.0  
**Status:** 🔒 Congelado — alterações requerem aprovação + documentação em EVOLUTION.md
