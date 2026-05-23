# Protocolo de Sessão — Início, Execução e Fim

**Princípio:** Qualquer agente que inicie uma sessão deve seguir este protocolo.  
O fluxo é agnóstico ao agente — Claude, Codex, DEV Antigravity ou modelo substituto.

---

## INÍCIO DE SESSÃO — Checklist Obrigatório

Todo agente que iniciar uma sessão executa estes passos antes de qualquer implementação:

```
[ ] 1. Identificar qual feature será trabalhada (ROADMAP.md)
[ ] 2. Ler os arquivos diretamente impactados (@arquivo)
[ ] 3. Ler regras relevantes (.agent/rules/ — security, architecture, multiempresa)
[ ] 4. Verificar estado do repositório (git status + git log --oneline -5)
[ ] 5. Confirmar que o servidor local está rodando (http://localhost:3000)
[ ] 6. Registrar abertura de sessão (quem iniciou, feature, timestamp)
```

### Report de Abertura (formato padrão)

```markdown
### Sessão Aberta — [YYYY-MM-DD HH:MM]

**Agente:** [Claude | Codex | DEV 1 Antigravity | Claude Sonnet Antigravity | ...]
**Feature:** [Nome conforme ROADMAP]
**Branch:** [nome da branch — criar se não existir: feat/<nome>]
**Estado inicial:**
- Git: [branch atual + últimos 2 commits]
- Servidor: [rodando / parado]
- Arquivos em foco: [lista]

**Riscos identificados antes de iniciar:**
- [ou "Nenhum identificado"]
```

---

## DURANTE A SESSÃO — Modelo de Execução

### Codex (DEV Sênior — autônomo)

Codex executa com autonomia total. Não precisa de aprovação por commit.

Codex **escala para Claude obrigatoriamente** se:
- Encontrar `🔴 Risco` de segurança ou multiempresa
- Spec for ambígua e a decisão impactar arquitetura
- Bundle size aumentar >10% sem justificativa

Para tudo mais, Codex decide e registra no Risk Report final.

### DEV 1 / DEV 2 Antigravity (execução pontual)

Recebem missões com escopo fechado. Não tomam decisões arquiteturais.  
Se encontrarem ambiguidade → pausar, documentar, escalar para Codex.

---

## FIM DE SESSÃO — Checklist Obrigatório

Todo agente que encerrar uma sessão executa estes passos antes de marcar como concluído:

### 1. Validação de Qualidade

```
[ ] npm run lint      → 0 erros
[ ] npm run build     → sem erros críticos
[ ] npm run test      → >80% coverage nos arquivos novos
[ ] grep console.log  → nenhum em arquivos de produção
[ ] Bundle size       → abaixo de 500KB gzip
```

### 2. Validação de Padrões

```
[ ] Nenhum arquivo fora do escopo modificado
[ ] buildScopedStorageKey usado em todos os acessos ao storage
[ ] Sem any types introduzidos
[ ] Tokens de design usados (sem hex hardcoded)
[ ] Sem font-black / uppercase tracking-widest em UI de dados
```

### 3. Artefatos (quando Antigravity estiver na sessão)

```
[ ] Task List gerada antes da execução
[ ] Plano de Implementação revisado antes do código
[ ] Walkthrough documenta fluxo feliz + edge cases
[ ] Browser Recording confirma UI em http://localhost:3000
```

### 4. Commit Padronizado

```bash
# Formato obrigatório
git add [arquivos específicos — nunca git add .]
git commit -m "tipo(escopo): descrição clara em português

- Detalhe 1
- Detalhe 2

Feature: [nome conforme ROADMAP]
Agente: [quem implementou]"

# Tipos aceitos: feat | fix | refactor | test | docs | perf | chore
# Exemplos:
# feat(licencas): adicionar LicenseBanner com aviso 30 dias
# fix(storage): corrigir escopo de buildScopedStorageKey em Reports
# perf(bundle): aplicar React.lazy em todas as views
```

### 5. Push

```bash
# Branch de feature → push normal
git push origin feat/<nome>

# Se primeira vez na branch
git push -u origin feat/<nome>
```

> Push só acontece após lint + build + testes passarem.  
> Nunca fazer push com erros de lint ou TypeScript.

### 6. Risk Report (obrigatório — todo agente, toda sessão)

```markdown
### Risk Report — [YYYY-MM-DD] — [Nome da Feature]

**Agente:** [quem executou]
**Commit:** [hash curto]
**Branch:** feat/<nome>

✅ Implementado:
- [item 1]
- [item 2]

⚠️ Atenção (decisões tomadas sem spec explícita):
- [decisão + justificativa — ou "Nenhuma"]

🔴 Risco (escalar para Claude / Reinaldo):
- [risco + impacto — ou "Nenhum"]

🔧 Pendente (fora do escopo desta sessão):
- [item — ou "Nenhum"]

**Próxima ação sugerida:** [próxima feature ou sub-task conforme ROADMAP]
```

---

## APROVAÇÃO FINAL

```
Risco 🔴 presente?
  → Sim: Claude ou Claude Sonnet/Opus Antigravity avalia antes de merge
  → Não: Reinaldo revisa Risk Report e aprova direto

Reinaldo aprova?
  → Sim: merge para main / próxima sessão pode iniciar
  → Não: Codex recebe lista de correções, nova sessão com escopo fechado
```

---

## Escalação de Risco em Tempo Real

Se um agente detectar risco **durante** a execução (não só no fim):

```
1. Pausar implementação imediatamente
2. Documentar: o que foi encontrado, qual o impacto, qual seria a decisão
3. Escalar para Claude (se disponível) ou Claude Sonnet 4.6 Thinking (Antigravity)
4. Aguardar decisão antes de continuar
5. Registrar decisão tomada no Risk Report final
```

**Exemplos de risco que exigem pausa imediata:**
- Modificação de AppContext.tsx fora do escopo da missão
- Qualquer acesso direto ao localStorage sem buildScopedStorageKey
- Import/restore de dados sem validação de empresaId
- Breaking change em interface usada por >1 componente
- Bundle crescendo acima de 500KB gzip

---

## Substituição de Agente (Claude indisponível)

Quando Claude externo não estiver na sessão, invocar no Antigravity:

| Necessidade | Modelo a invocar |
|-------------|-----------------|
| Arbitrar risco arquitetural | Claude Sonnet 4.6 (Thinking) |
| Decisão crítica de bloqueio | Claude Opus 4.6 (Thinking) |
| Revisão de qualidade / testes | Gemini 3.1 Pro (High) |
| Tasks pontuais / componentes | Gemini 3.5 Flash (Medium) |

O Risk Report deve registrar qual modelo foi usado na sessão.
