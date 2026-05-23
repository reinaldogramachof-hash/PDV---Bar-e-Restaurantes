# _plena-architect — Sistema Portável de Orquestração Agêntica

**Versão:** 1.0  
**Proprietário:** Plena Informática  
**Compatível com:** Google Antigravity (Gemini 3 Pro + Deep Think)  
**Portabilidade:** Copiar esta pasta para qualquer projeto. Adaptar apenas o CONTEXT.md.

---

## O que é este sistema

Um framework de orquestração com três camadas de agentes:

| Camada | Agente | Papel |
|--------|--------|-------|
| **Estratégica** | Claude | Arquiteto — planeja, valida, bloqueia riscos. Nunca escreve código. |
| **Execução Sênior** | Codex | DEV Sênior — implementa features complexas, decisões técnicas, resolve ambiguidades de spec |
| **Execução Ágil** | DEV 1 (Fast/Editor) | Fixes rápidos, componentes simples, lint, refactoring de arquivo único |
| **Execução Profunda** | DEV 2 (Deep Think/Manager) | Features multi-arquivo, integrações, arquitetura — sempre gera Plan primeiro |

Claude escreve **Missões** que Codex e os DEVs Antigravity executam com autonomia máxima.

---

## Estrutura da Pasta

```
_plena-architect/
├── README.md                  ← Este arquivo. Como usar o sistema.
├── CLAUDE-ARCHITECT.md        ← Papel do Claude (Arquiteto/Orquestrador)
├── ANTIGRAVITY-GUIDE.md       ← Como usar o Antigravity corretamente
├── MISSION-TEMPLATE.md        ← Template de Missão (copiar e preencher)
├── SESSION-PROTOCOL.md        ← Protocolo de início e fim de sessão
├── VALIDATION-CHECKLIST.md    ← Gate de validação pós-implementação
│
├── rules/                     ← Copiar para .agent/rules/ do projeto
│   ├── tech-stack.md
│   ├── security.md
│   ├── architecture.md
│   ├── performance.md
│   └── code-quality.md
│
├── skills/                    ← Copiar para .agent/skills/ do projeto
│   ├── component-pattern.md
│   ├── api-design.md
│   └── test-strategy.md
│
├── workflows/                 ← Copiar para .agent/workflows/ do projeto
│   ├── review.md
│   ├── validate-spec.md
│   └── session-close.md
│
└── missions/                  ← Missões preenchidas (histórico por projeto)
    └── [YYYY-MM-DD]-[feature].md
```

---

## Como Usar em um Novo Projeto

```
1. Copiar _plena-architect/ para a raiz do novo projeto
2. Copiar rules/ para .agent/rules/
3. Copiar skills/ para .agent/skills/
4. Copiar workflows/ para .agent/workflows/
5. Adaptar regras para stack do projeto
6. Criar ROADMAP.md com features a implementar
7. Iniciar sessão conforme SESSION-PROTOCOL.md
```

---

## Fluxo Resumido

```
Reinaldo define intenção
        ↓
Claude lê ROADMAP → identifica feature → escreve Missão
        ↓
┌─────────────────────────────────────────────┐
│  Codex (DEV Sênior)                         │
│  • Features complexas (business logic)      │
│  • Decisões técnicas difíceis               │
│  • Resolve ambiguidades de spec             │
│  • Usa DEV 1 / DEV 2 internamente           │
└─────────────────────────────────────────────┘
        ↓
Antigravity carrega .agent/rules/ + .agent/skills/ → delega aos DEVs
        ↓
DEV 1 (Fast/Editor View): componentes, fixes, refactoring rápido
DEV 2 (Deep Think/Manager View): features complexas, integrações
        ↓
Antigravity gera Artefatos: Task List + Plan + Walkthrough + Browser Recording
        ↓
Claude valida Artefatos → Aprova / Devolve / Bloqueia
        ↓
Reinaldo aprova → próxima missão
```

---

**Regra de ouro:** Se o plano de implementação parecer ruim, corrija-o ANTES de executar. Feedback no Plano economiza 10x mais tempo do que refactoring pós-código.
