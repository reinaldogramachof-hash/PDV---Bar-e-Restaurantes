# START — Plena Informática | Protocolo de Início de Sessão

Cole esta linha em qualquer agente para iniciar uma sessão:

> "Leia `_plena-architect/START.md` e siga o protocolo de início de sessão."

---

## Quem sou neste projeto?

Antes de tudo, identifique seu papel:

| Se você é... | Seu papel |
|--------------|-----------|
| **Claude** (externo) | Arquiteto — planeja missões, arbitra riscos críticos |
| **Codex** | DEV Sênior — implementa features, decide tecnicamente, reporta riscos |
| **DEV 1 Antigravity** (Fast) | Executor pontual — fixes, componentes isolados, lint |
| **DEV 2 Antigravity** (Deep Think) | Executor profundo — features multi-arquivo com Plan |
| **Claude Sonnet/Opus** (Antigravity) | Substituto de Claude externo em decisões arquiteturais |

---

## Passo 1 — Carregar contexto do projeto

Leia nesta ordem (use @ se estiver no Antigravity):

```
@_plena-architect/rules/tech-stack.md       ← stack obrigatória
@_plena-architect/rules/security.md         ← regras críticas
@_plena-architect/rules/architecture.md     ← estrutura de pastas
@ROADMAP-FASE-5.md                          ← features a implementar
```

---

## Passo 2 — Identificar o estado atual

```bash
git status
git log --oneline -5
```

Verificar: em qual branch estou? Qual foi o último commit? Há trabalho inacabado?

---

## Passo 3 — Identificar a feature da sessão

Abrir `ROADMAP-FASE-5.md` e localizar:
- Qual feature está marcada como próxima
- Quais subtasks já foram concluídas
- Qual é o critério de aceite da feature

---

## Passo 4 — Carregar skill relevante

Conforme a tarefa da sessão, carregar a skill correspondente:

| Tarefa | Skill |
|--------|-------|
| Criar componente React | `@_plena-architect/skills/component-pattern.md` |
| Criar service / hook de dados | `@_plena-architect/skills/api-design.md` |
| Escrever testes | `@_plena-architect/skills/test-strategy.md` |
| Painel Master (cross-empresa) | `@_plena-architect/skills/master-panel.md` |
| Sistema de planos e licenças | `@_plena-architect/skills/license-plan.md` |
| Backup e restore de dados | `@_plena-architect/skills/backup-restore.md` |
| Logs de auditoria | `@_plena-architect/skills/audit-log.md` |
| Fluxo de onboarding | `@_plena-architect/skills/onboarding-flow.md` |

---

## Passo 5 — Abrir sessão com report padrão

```markdown
### Sessão Aberta — [YYYY-MM-DD HH:MM]

**Agente:** [seu nome/modelo]
**Feature:** [nome conforme ROADMAP]
**Branch:** feat/<nome> (criar se não existir)
**Último commit:** [hash + mensagem]
**Servidor local:** [rodando em http://localhost:3000 / parado]
**Skill carregada:** [nome do arquivo]
**Riscos identificados:** [ou "Nenhum"]
```

---

## Referências rápidas

| Documento | Quando usar |
|-----------|-------------|
| `SESSION-PROTOCOL.md` | Fluxo completo de início, execução e fim |
| `MISSION-TEMPLATE.md` | Escrever missão para DEV Antigravity |
| `VALIDATION-CHECKLIST.md` | Gate de qualidade pós-implementação |
| `CLAUDE-ARCHITECT.md` | Papel do Claude e modelo de exceção |
| `ANTIGRAVITY-GUIDE.md` | Como usar Editor View e Manager View |
| `rules/` | Restrições permanentes — sempre ativas |
| `skills/` | Carregar apenas a skill da tarefa atual |

---

## Regra de ouro

> Codex implementa com autonomia e reporta exceções.  
> Claude arbitra só quando há 🔴 Risco.  
> Reinaldo aprova o fim de cada sessão.  
> Nenhuma sessão encerra sem commit + push + Risk Report.
