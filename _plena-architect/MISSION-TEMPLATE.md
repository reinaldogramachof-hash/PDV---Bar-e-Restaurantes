# Template de Missão — Antigravity

**Como usar:** Copiar este template, preencher os campos e enviar ao Antigravity (Manager View / Mission Control).

---

## Template Fast Mode (Editor View — Cmd+I)

Para tarefas simples em 1 arquivo, sem lógica de negócio:

```
Atue como desenvolvedor React/TypeScript especialista.

Arquivo: @[caminho/Componente.tsx]

Tarefa: [Descrição direta do que fazer]

Restrições:
- TypeScript strict, sem any
- Usar tokens de @src/index.css (sem valores hardcoded)
- Lucide React para ícones (sem emojis)
- SEM PLACEHOLDERS — implementação completa

Verificação: npm run lint deve passar após a alteração.
```

---

## Template Deep Think (Manager View — Mission Control)

Para features completas, multi-arquivo, lógica de negócio:

```
/mission [Nome da Feature] — [Descrição em uma linha]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAPEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Atue como Engenheiro de Software Sênior especialista em
React 19, TypeScript 5.8 e Tailwind v4 para plataforma SaaS
multiempresa de gestão de restaurantes.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTEXTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Spec de referência: @ROADMAP-FASE-5.md, seção "[Feature X]"
Stack: @.agent/rules/tech-stack.md
Arquivos principais: @[arquivo1.tsx] @[arquivo2.ts]
Estado atual: [O que existe hoje — o que funciona, o que não funciona]
Risco identificado: [O que pode quebrar se feito errado]
Dependências: [Outras features ou arquivos que este toca]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DIRETIVA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Implementar os seguintes itens em ordem:

1. [Subtask 1 — nome do arquivo + o que criar/alterar]
2. [Subtask 2 — nome do arquivo + o que criar/alterar]
3. [Subtask 3 — testes unitários cobrindo fluxos críticos]
4. [Subtask 4 — validação visual no browser]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESTRIÇÕES (NÃO NEGOCIÁVEIS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CÓDIGO:
  - TypeScript strict: sem any, sem as unknown, sem @ts-ignore
  - SEM PLACEHOLDERS: implementação completa em todos os arquivos
  - Sem console.log, console.error em produção
  - Lucide React para ícones — zero emojis

ARQUITETURA:
  - Componentes em src/components/
  - Lógica de negócio em src/services/ ou src/domain/
  - Estado global via AppContext (src/store/AppContext.tsx)
  - NÃO modificar: [arquivos fora do escopo desta missão]

DESIGN:
  - Usar apenas tokens de @src/index.css (sem valores hex hardcoded)
  - Padrão desktop-first: tabelas px-4 py-3 | inputs h-10 px-3 | botões h-10 px-4

MODO COGNITIVO: Deep Think — gerar Plano antes de qualquer código.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ARTEFATOS OBRIGATÓRIOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Antes de executar:
  [ ] Task List com todos os subtasks explícitos
  [ ] Plano de Implementação: lista de arquivos + o que muda em cada um

Após executar:
  [ ] Walkthrough: fluxos críticos testados (descrever o que foi validado)
  [ ] Browser Recording: abrir http://localhost:3000, navegar até [view]
      e gravar interação com a feature implementada
  [ ] npm run lint → capturar saída (deve ser 0 erros)
  [ ] npm run build → capturar saída (deve ser sucesso)
  [ ] npm run test → capturar coverage (deve ser >80%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITÉRIO DE ACEITE (DONE QUANDO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [ ] [Critério funcional 1]
  [ ] [Critério funcional 2]
  [ ] Lint 100%, build sem erros, testes >80%
  [ ] Nenhum arquivo fora do escopo foi modificado
  [ ] Sem regressões nos módulos existentes
```

---

## Exemplos de Missão Preenchida

### Exemplo 1 — Fast (componente simples)

```
Atue como desenvolvedor React/TypeScript especialista.

Arquivo: @src/components/LicenseBanner.tsx (criar)

Tarefa: Criar componente LicenseBanner que exibe aviso quando
licença vence em ≤30 dias.

Props:
  - daysRemaining: number
  - onDismiss: () => void

Comportamento:
  - Exibir banner amarelo no topo da tela quando daysRemaining <= 30
  - Mensagem: "Sua licença vence em X dias. Entre em contato."
  - Botão de fechar (X) chama onDismiss
  - Não renderizar nada se daysRemaining > 30

Restrições:
  - TypeScript strict, sem any
  - Usar --color-warning e --color-border de @src/index.css
  - Lucide React: AlertTriangle para ícone, X para fechar
  - SEM PLACEHOLDERS — implementação completa

Verificação: npm run lint deve passar.
```

### Exemplo 2 — Deep Think (feature completa)

```
/mission Feature 3 — Sistema de Licenças

PAPEL
Atue como Engenheiro de Software Sênior especialista em React 19,
TypeScript 5.8 e Tailwind v4.

CONTEXTO
Spec: @ROADMAP-FASE-5.md, seção "Feature 3 — Sistema de Licenças"
Arquivo existente: @src/components/LicenseLock.tsx (refinar)
Arquivo existente: @src/App.tsx (integrar verificação no boot)
Stack: @.agent/rules/tech-stack.md
Estado atual: LicenseLock existe mas não mostra data de expiração
Risco: Flicker na UI durante verificação assíncrona de licença

DIRETIVA
1. Criar src/services/licenseService.ts
   - checkLicense(url: string): Promise<LicenseInfo>
   - Cache em sessionStorage por 1h
   - Fallback para arquivo license.status se URL inacessível
   - Retorna: { status, expiresAt, daysRemaining, plan }
2. Refinar src/components/LicenseLock.tsx
   - Mostrar data de expiração formatada
   - Mostrar contato Plena (tecnologia@plenainformatica.com.br)
3. Criar src/components/LicenseBanner.tsx
   - Banner de aviso quando daysRemaining <= 30
   - Dispensável por sessão (fechar salva no sessionStorage)
4. Modificar src/App.tsx
   - Usar licenseService no boot
   - Loading spinner centralizado durante verificação

RESTRIÇÕES
- TypeScript strict, sem any
- SEM PLACEHOLDERS
- Sem console.log em produção
- NÃO modificar: AppContext.tsx, tipos existentes

MODO COGNITIVO: Deep Think

ARTEFATOS OBRIGATÓRIOS
[ ] Task List antes de executar
[ ] Plano de Implementação (arquivos + mudanças)
[ ] Walkthrough: testar boot com licença válida e inválida
[ ] Browser Recording: gravar boot do app em http://localhost:3000
[ ] npm run lint → 0 erros
[ ] npm run build → sucesso

CRITÉRIO DE ACEITE
[ ] Boot sem flicker (loading state adequado)
[ ] LicenseLock exibe data + contato
[ ] LicenseBanner aparece quando daysRemaining <= 30
[ ] Cache de 1h funciona (sem requests repetidos)
[ ] Fallback para arquivo local funciona offline
```

---

**Uso:** Salvar missões preenchidas em `_plena-architect/missions/[YYYY-MM-DD]-[feature].md`
