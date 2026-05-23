# 🚀 ANTIGRAVITY PROTOCOL — Sistema de Gestão Restaurantes

**Versão:** 1.0  
**Data:** 23 de maio de 2026  
**Plataforma:** Google Antigravity (Gemini 3 Pro/Deep Think, 2M tokens)  
**Proprietário:** Plena Informática  
**Status:** ✅ Ativo — Guia obrigatório para orquestração no Antigravity IDE

---

## 📋 Sumário Executivo

Este documento define como **Claude**, **Codex** e **Antigravity** trabalham em conjunto para orquestrar desenvolvimento do Sistema de Gestão Restaurantes (SaaS multiempresa).

O protocolo implementa três camadas:
1. **Constitution** (.agent/rules/) — Restrições permanentes de execução
2. **Toolkit** (.agent/skills/) — Pacotes reutilizáveis de expertise
3. **Missions** (prompts + artifacts) — Tarefas atômicas delegadas

---

## 🎯 Papéis e Responsabilidades

### **Claude — Validador Estratégico**

**Contexto:** Parceiro de arquitetura, qualidade e visão do Plena  
**Localização Primária:** Manager View (Planning + Validation)

#### Responsabilidades
- **Planning:** Recebe intenção do usuário, analisa ROADMAP-FASE-5.md, desenha plano atômico em Mission Control
- **Validação Arquitetural:** Valida specs contra multiempresa, segurança, performance antes de Codex executar
- **Validação Pós-Implementação:** Revisa código, testes, documentação contra critérios de sucesso
- **Gestão de Risco:** Identifica technical debt, breaking changes, impactos multiempresa
- **Documentação:** Mantém CLAUDE.md, DISCOVERY-NOTE.md, spec.md, EVOLUTION.md como source of truth

#### Tempo (Fase 5)
- **30 horas** distribuídas em:
  - Planning: 8h (repartidas em 7 features)
  - Validação: 15h (2-3h por feature)
  - Documentação: 5h
  - Overhead: 2h

#### Como Chamar Claude
```
"Validar fluxo de [feature] contra spec. Risco: [situação]?"
"Planejar integração de backup automatizado. Impacto multiempresa?"
"Rever implementação de auditoria. Atende critérios?"
```

---

### **Codex — Executor Principal**

**Contexto:** Agent especializado em React/TypeScript/Tailwind, responsável por execução tática  
**Localização Primária:** Editor View (Cmd+I fast edits) + Manager View (complex missions)

#### Responsabilidades
- **Implementação:** Executa planos de Claude conforme ROADMAP-FASE-5.md, specs congeladas
- **Decisões Tácticas:** Resolve ambiguidades de spec, propõe mitigações técnicas, valida feasibilidade
- **Testing:** Implementa testes unitários, fluxos críticos, validação básica
- **Code Quality:** Segue padrões do projeto, lint 100%, TypeScript strict, sem console.error
- **Documentação:** Mantém CODEX.md, code comments, README técnico, exemplos de uso
- **Mitigação de Risco:** Propõe refatorações se detecta riscos, consulta Claude antes de desviar

#### Tempo (Fase 5)
- **100 horas** distribuídas em:
  - Feature 1 (Painel Master): 20h
  - Feature 2 (Sistema de Planos): 20h
  - Feature 3 (Licenças): 15h
  - Feature 4 (Onboarding): 15h
  - Feature 5 (Backup): 12h
  - Feature 6 (Auditoria): 10h
  - Feature 7 (Isolamento): 8h

#### Como Chamar Codex
```
Editor View (Fast):
  Cmd+I: "Implementar [componente simples]"
  Cmd+I: "Fix lint error em [arquivo]"

Manager View (Complex):
  /mission: "Implementar fluxo de [feature] conforme ROADMAP-FASE-5.md, seção [X]"
  /mission: "Integrar [API] com validação de multiempresa"
```

---

### **Antigravity — Orquestrador de Plataforma**

**Contexto:** Platform que coordena Claude + Codex, gerencia contexto, cria artifacts  
**Localização:** Dual-view sync (Manager View ↔ Editor View)

#### Responsabilidades
- **Delegação:** Transforma tarefas de Claude em prompts executáveis para Codex
- **Context Management:** Gerencia 2M tokens, carrega .agent/rules/ + skills dynamicamente
- **Artifact Generation:** Cria automaticamente Task Lists, Implementation Plans, Walkthroughs, Browser Recordings
- **Cognitive Selection:** Escolhe Fast Mode (Gemini 3 Flash/Pro) vs Deep Think (raciocínio pesado para refactoring)
- **Loop Closure:** Valida completude de missions antes de retornar a Claude
- **Dynamic Rule Activation:** Aplica regras baseado em Glob patterns, modelo decide relevância

#### Tempo (Orquestração)
- **20 horas** overhead distribuído em:
  - Context management: 8h
  - Artifact generation: 7h
  - Rule/skill loading: 3h
  - Escalação para Claude: 2h

---

## 🔄 Fluxo de Orquestração End-to-End

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER INTENT (Reinaldo via chat Antigravity IDE)          │
│    "Implementar painel master com métricas de empresa"      │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. CLAUDE — MANAGER VIEW — PLANNING                         │
│    • Lê ROADMAP-FASE-5.md, seção "Painel Master"           │
│    • Valida spec (escopo, riscos, multiempresa)            │
│    • Desenha plano atômico:                                │
│      - Novo componente MasterDashboard                      │
│      - API /api/master/metrics (aggregação multiempresa)   │
│      - Storage: gestao-gastro:master:metrics               │
│      - Componentes: MetricCard, TrendChart, FilterBar      │
│    • Identifica riscos: acesso cross-empresa → mitigar     │
│    • Cria Mission Control artifact                          │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. ANTIGRAVITY — DELEGATION + CONTEXT                       │
│    • Recebe plano de Claude                                 │
│    • Carrega .agent/rules/:                                │
│      - tech-stack.md (React, TypeScript, Tailwind)         │
│      - security.md (validação empresaId, CORS)            │
│      - multiempresa.md (baseEntity, buildScopedStorageKey) │
│      - performance.md (lazy load, memoization)             │
│    • Carrega .agent/skills/:                               │
│      - api-design.md (endpoints CRUD, validação)          │
│      - component-pattern.md (BaseEntity, Props typing)     │
│      - test-strategy.md (unit + integration tests)         │
│    • Seleciona modo cognitivo: Fast (Gemini 3 Pro)        │
│    • Traduz para prompt Codex                              │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. CODEX — EDITOR VIEW (Fast edits) + MANAGER VIEW (Complex)│
│    • Recebe prompt estruturado com rules/skills             │
│    • Editor View: Cmd+I para componentes pequenos          │
│      - MasterDashboard.tsx boilerplate                      │
│      - MetricCard.tsx component                             │
│    • Manager View: /mission para integração complexa        │
│      - API endpoints com validação empresaId               │
│      - Storage com buildScopedStorageKey                   │
│      - Testes: unit (components) + integration (API)       │
│    • Implementa conforme spec congelada                     │
│    • Faz commits atômicos com mensagens descritivas         │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. ANTIGRAVITY — ARTIFACT GENERATION                        │
│    • Task List: ✅ todos os subtasks completados            │
│    • Implementation Plan: detalhado, com timestamps         │
│    • Walkthrough: fluxos críticos testados (UI + API)      │
│    • Browser Recording: interação usuário painel master     │
│    Artifacts visíveis em Manager View                       │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. CLAUDE — MANAGER VIEW — VALIDATION                       │
│    • Lê implementação Codex (código + testes + docs)       │
│    • Valida contra:                                         │
│      ✓ Spec congelada (ROADMAP-FASE-5.md)                 │
│      ✓ Padrões arquiteturais (multiempresa, storage)      │
│      ✓ Qualidade (lint 100%, tests, TypeScript strict)    │
│      ✓ Segurança (empresaId validation, CORS)             │
│    • Aprovação: ✅ Pronto para produção                    │
│      OU Ajustes: ❌ Lista específica de correções          │
│    • Documentar decisão em EVOLUTION.md                    │
└──────────────────┬──────────────────────────────────────────┘
                   ↓
        ┌─────────────────────────┐
        │ ✅ PRONTO PARA DEPLOY   │
        │ ou                      │
        │ ❌ Retornar a Codex     │
        └─────────────────────────┘
```

---

## 📁 Estrutura .agent/ — Three-Layer Strategy

### Layer 1: Constitution (.agent/rules/)
Restrições permanentes de execução. Carregadas dinamicamente por Glob pattern.

```
.agent/rules/
  ├── tech-stack.md              # React 18+, TypeScript 5.3+, Tailwind v4
  ├── security.md                # CORS, empresaId validation, JWT
  ├── multiempresa.md            # BaseEntity, buildScopedStorageKey, isolamento
  ├── architecture.md            # Componentes, hooks, serviços
  ├── performance.md             # Lazy load, memoization, bundle size
  └── code-quality.md            # Lint, build, testes, documentação
```

Cada arquivo segue formato:
```markdown
# [Regra]

## Escopo
[Quando esta regra se aplica]

## Restrição
[O que fazer / o que não fazer]

## Exemplo Correto
[Código/padrão aprovado]

## Exemplo Incorreto
[Código/padrão proibido]

## Validação
[Como Antigravity verifica compliance]
```

### Layer 2: Toolkit (.agent/skills/)
Pacotes reutilizáveis de expertise. Cada skill é um procedimento atômico.

```
.agent/skills/
  ├── api-design.md              # Contract de endpoints CRUD
  ├── component-pattern.md       # Padrão React (Props, State, Hooks)
  ├── test-strategy.md           # Unit + Integration + E2E
  ├── db-migration.md            # Script de migração de schema
  ├── deploy.md                  # Procedimento de deploy
  ├── backup.md                  # Procedimento de backup automatizado
  ├── audit.md                   # Procedimento de auditoria
  └── troubleshooting.md         # Diagnosticar e fix bugs comuns
```

Cada skill segue formato:
```markdown
# [Skill Name]

## Quando Usar
[Descrição de quando esta skill é relevante]

## Pré-requisitos
[O que precisa estar em place antes]

## Procedimento Passo-a-Passo
1. [Passo 1]
2. [Passo 2]
...

## Validação Checklist
- [ ] [Critério 1]
- [ ] [Critério 2]

## Troubleshooting
[Problemas comuns + soluções]
```

### Layer 3: Missions (Prompts + Artifacts)
Tarefas atômicas delegadas para execução. Geradas por Claude, orquestradas por Antigravity, executadas por Codex.

Formato de Mission:
```
/mission [Feature Name] — [Short Description]

Context:
  • Spec reference: ROADMAP-FASE-5.md, seção [X]
  • Risk mitigation: [X]
  • Dependencies: [Y]

Deliverables:
  - [ ] Componentes React (com tipos TS completos)
  - [ ] API endpoints (com validação empresaId)
  - [ ] Storage integration (com buildScopedStorageKey)
  - [ ] Testes (unit + integration, >80% coverage)
  - [ ] Documentação (README, exemplos de uso)

Success Criteria:
  - [ ] Lint 100%
  - [ ] Build success
  - [ ] Todos os fluxos críticos testados
  - [ ] TypeScript strict mode
  - [ ] Sem console.error ou warnings

Validation Gate:
  Claude aprovará após confirmar todos os critérios.
```

---

## 🔧 Configuração Inicial — Como Ativar

### 1. Clonar Estrutura .agent/
```bash
mkdir -p .agent/rules .agent/skills .agent/workflows
```

### 2. Criar Rules
Copiar template de cada rule em .agent/rules/ (vide Apêndice A)

### 3. Criar Skills
Copiar template de cada skill em .agent/skills/ (vide Apêndice B)

### 4. Criar Workflows
Vide Apêndice C

### 5. Atualizar .gitignore
```
.agent/logs/
.agent/cache/
```

### 6. Documentar no README.md
```markdown
## Development Workflow

Este projeto usa Google Antigravity para orquestração. Vide [04-ANTIGRAVITY-PROTOCOL.md](./04-ANTIGRAVITY-PROTOCOL.md).

### Planning
Claude desenha plano em Manager View. Vide ROADMAP-FASE-5.md.

### Implementation
Codex executa via Cmd+I (fast edits) ou /mission (complex tasks).

### Validation
Claude valida contra spec, arquitetura, qualidade.

### Artifacts
Antigravity gera Task List, Plan, Walkthrough, Recording automaticamente.
```

---

## 📊 Cognitive Selection Matrix

Antigravity escolhe modo baseado em task complexity:

| Task | Complexity | Modo | Agente | Tempo |
|------|-----------|------|--------|-------|
| Corrigir lint error | Trivial | Fast | Codex (Cmd+I) | <5min |
| Implementar componente simples | Baixa | Fast | Codex (Cmd+I) | 15-30min |
| Implementar feature (conforme spec) | Média | Fast+Planning | Claude (plan) → Codex (/mission) | 2-4h |
| Refactoring complexo | Alta | Deep Think | Claude (plan) + Codex (/mission) | 4-8h |
| Decisão arquitetural | Crítica | Deep Think | Claude (análise) + Codex (mitigação) | 2-3h |

---

## 🎯 Exemplos de Prompts — Simples vs Complexo

### Exemplo 1: Fast Edit (Trivial)
```
Cmd+I: "Adicionar ícone de check em CheckoutModal.tsx quando pedido fechado"

Antigravity:
  • Modo: Fast (Gemini 3 Flash)
  • Rules aplicadas: component-pattern.md
  • Tempo esperado: <5min
  • Validação: Lint + build local
```

### Exemplo 2: Fast Mission (Baixa Complexidade)
```
Cmd+I: "Implementar MetricCard component conforme design

Props:
  - label: string
  - value: number
  - trend?: number

Return inline JSX com Tailwind."

Antigravity:
  • Modo: Fast (Gemini 3 Pro)
  • Rules aplicadas: tech-stack.md, component-pattern.md
  • Tempo esperado: 20-30min
  • Validação: TypeScript strict, lint
```

### Exemplo 3: Manager View Mission (Média Complexidade)
```
/mission Implementar Painel Master — Agregação de Métricas Multiempresa

Spec: ROADMAP-FASE-5.md, Feature 1
Risk: Acesso cross-empresa → validar empresaId em API

Deliverables:
  - MasterDashboard.tsx (chamada para API /api/master/metrics)
  - API endpoint com agregação + validação
  - Storage com buildScopedStorageKey
  - Testes unit + integration

Validation: Claude aprovará após testes >80% coverage.

Antigravity:
  • Modo: Fast + Planning
  • Claude desenha plano (30min)
  • Codex implementa (/mission, 3-4h)
  • Claude valida (1h)
  • Artifacts: Task List + Plan + Walkthrough
```

### Exemplo 4: Deep Think Mission (Alta Complexidade)
```
/mission Refactoring de Isolamento de Dados por Empresa

Current: Validação empresaId em Controllers  
Target: Middleware + Policy pattern para garantir isolamento 100%

Risk: Breaking change em todos os endpoints → mitigação via feature flag

Deliverables:
  - Middleware de isolamento
  - Policy pattern para autorização
  - Migração de endpoints (com feature flag)
  - Testes e9e de isolamento cross-empresa

Validação: Claude aprovará + Reinaldo (QA humano) testará cenários críticos.

Antigravity:
  • Modo: Deep Think (Gemini 3 Deep Think — reasoning pesado)
  • Claude desenha plano arquitetural (2h)
  • Codex implementa em sprints de 2h
  • Claude valida a cada sprint
  • Artifacts: Architecture diagram + Plan + Walkthrough + Recording
```

---

## 📋 Matriz de Responsabilidade

| Atividade | Claude | Codex | Antigravity |
|-----------|--------|-------|-------------|
| Planning | ✅ Primário | — | — |
| Decisão técnica | ✅ Primário | ⚠️ Consulta | — |
| Implementação | — | ✅ Primário | — |
| Code review | ✅ Primário (pós) | ⚠️ Local (durante) | — |
| Testes | — | ✅ Primário (escrita) | ⚠️ Orquestração |
| Documentação | ✅ Specs/evolução | ✅ Code docs | — |
| Context management | — | — | ✅ Primário |
| Artifact generation | — | — | ✅ Primário |
| Rule/skill loading | — | — | ✅ Primário |
| Escalação de risco | ✅ Decisão | ⚠️ Sinaliza | ⚠️ Roteia |

Legenda: ✅ Primário | ⚠️ Secundário/Suporte | — Não aplica

---

## 🚨 Escalação de Risco

Quando Codex detecta risk, fluxo de escalação:

```
Codex deteta risk
  ↓
Codex pause implementação + documenta risk em PR
  ↓
Antigravity notifica Claude
  ↓
Claude analisa risk:
  • Crítico? → Bloqueia, propõe mitigação
  • Alto? → Aprova com condição (feature flag, rollback plan)
  • Médio? → Aprova com ajuste
  • Baixo? → Aprova, documento aprendizado
  ↓
Codex retoma baseado em decisão Claude
```

Exemplos de risk crítico:
- Breaking change em API sem feature flag
- Violação de multiempresa (acesso cross-empresa)
- Security hole (injection, CORS bypass)
- Performance regression (bundle >10% increase)

---

## 📈 Métricas de Sucesso (Fase 5)

**Velocidade:**
- Feature complete em tempo estimado ±10%
- Replanejamento <1 por feature

**Qualidade:**
- Lint 100%, build 100%
- Test coverage >80%
- Zero console.error em produção
- Bugs pós-validação <1 por feature

**Processo:**
- Desvios de spec documentados
- Escalações resolvidas em <2h
- Artifacts gerados automaticamente 100%

**Produto:**
- Spec atendida 100%
- Clientes satisfeitos (score >8/10)
- Vendor-ready (vendável para restaurante genérico)

---

## 📌 Apêndice A — Template de Rule

```markdown
# [Rule Name]

**Escopo:** [Quando esta regra se aplica — Ex: "Em todos os endpoints da API"]  
**Severidade:** [Crítica | Alto | Médio]  
**Validação:** [Como Antigravity verifica — Ex: "ESLint, TypeScript compiler"]

## Regra

[Descrição clara da restrição]

## Exemplo Correto ✅

[Código aprovado]

## Exemplo Incorreto ❌

[Código proibido + por quê]

## Impacto de Violação

[O que quebra se não seguir]
```

---

## 📌 Apêndice B — Template de Skill

```markdown
# [Skill Name]

**Quando Usar:** [Descrição concisa]  
**Tempo:** [Estimativa]  
**Dependências:** [Outras skills que precisa]

## Procedimento

1. [Passo atômico]
2. [Passo atômico]
3. ...

## Validação Checklist

- [ ] [Critério]
- [ ] [Critério]

## Troubleshooting

**Erro X:** [Solução]  
**Erro Y:** [Solução]
```

---

## 📌 Apêndice C — Workflows Padrão

### /review — Code Review Estruturado
```
Codex submete PR com spec reference
  ↓
Claude lê código + commits + tests
  ↓
Claude valida contra:
  - Spec congelada
  - Regras de arquitetura
  - Qualidade
  ↓
Claude retorna: ✅ Aprovado | ⚠️ Ajustes | ❌ Bloqueado
```

### /test — Test Strategy Executado
```
Codex implementa testes:
  - Unit tests (componentes, funções)
  - Integration tests (API + storage)
  - E2E (fluxos críticos)
  ↓
Antigravity roda suite completa
  ↓
Coverage >80%? ✅ Pronto | ❌ Ajustar
```

### /validate-spec — Validação Contra Spec
```
Spec reference (ROADMAP-FASE-5.md, Feature X)
  ↓
Claude mapeia:
  - Requisitos funcionais ✓
  - Requisitos não-funcionais ✓
  - Casos de uso críticos ✓
  ↓
Tudo atende? ✅ Pronto | ⚠️ Gap identificado
```

---

## 🔐 Segurança — Prompt Injection Defense

Antigravity implementa defesa contra injection:

1. **Content isolation:** Rules + skills não contêm dados de usuário
2. **Validation:** Todos os inputs validados antes de passar para Codex
3. **Logging:** Todos os prompts/decisions logged para auditoria
4. **Escalation:** Prompts ambíguos escalados para Claude
5. **Rate limiting:** Missões complexas exigem aprovação explícita

---

## 🔄 Próximos Passos

1. ✅ Este documento (04-ANTIGRAVITY-PROTOCOL.md) congelado
2. ⏳ Criar .agent/rules/ com 6 files
3. ⏳ Criar .agent/skills/ com 8 files
4. ⏳ Criar .agent/workflows/ com 3 files
5. ⏳ Atualizar CLAUDE.md (alinhado com papéis Antigravity)
6. ⏳ Atualizar CODEX.md (alinhado com papéis Antigravity)
7. ⏳ Executar Fase 5 seguindo este protocolo

---

**Versão:** 1.0  
**Próxima revisão:** Quando houver mudança em .agent/ structure ou cognitive selection  
**Proprietário:** Plena Informática (Claude como custódio)  
**Status:** ✅ Ativo — Protocolo obrigatório para todas as sessões Antigravity
