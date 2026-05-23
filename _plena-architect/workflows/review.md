# Workflow: /review — Revisão de Código Abrangente

**Gatilho:** `/review`  
**Modo:** Deep Think  
**Tempo estimado:** 30–60min

---

## Procedimento

```
/review

1. CARREGAMENTO DE CONTEXTO
   - Identifique todos os arquivos alterados no branch atual vs main:
     git diff --name-only main
   - Liste arquivos modificados no relatório

2. ANÁLISE ESTÁTICA
   - Execute: npm run lint
   - Execute: npm run build
   - Execute: npm run test -- --coverage
   - Capture e reporte a saída de cada comando

3. REVISÃO SEMÂNTICA
   Para cada arquivo alterado, analise:
   
   QUALIDADE:
   - Nomes de variáveis/funções são descritivos?
   - Há placeholders (//...rest, // TODO)?
   - Há console.log/error em produção?
   - TypeScript strict respeitado (sem any)?
   
   SEGURANÇA:
   - Dados filtrados por empresaId?
   - Storage usando buildScopedStorageKey?
   - Secrets hardcoded?
   
   ARQUITETURA:
   - Arquivo no diretório correto?
   - Responsabilidade única respeitada?
   - Dependências circulares introduzidas?
   
   PERFORMANCE:
   - Componentes pesados com memo?
   - Cálculos com useMemo?
   - Bundle size impactado?

4. VALIDAÇÃO VISUAL (Browser Agent)
   - Abrir http://localhost:3000
   - Navegar para o módulo alterado
   - Testar fluxo principal
   - Capturar screenshot e incluir no Walkthrough

5. GERAÇÃO DE RELATÓRIO
   Formato:
   
   ## Revisão: [Data] — [Branch/Feature]
   
   ### Análise Estática
   - Lint: ✅ 0 erros | ❌ X erros
   - Build: ✅ OK | ❌ Falhou
   - Tests: ✅ X% coverage | ❌ X% (abaixo de 80%)
   
   ### Problemas Encontrados
   **Crítico:** [ou Nenhum]
   **Alto:** [ou Nenhum]
   **Médio:** [se houver — arquivo:linha — descrição]
   **Baixo/Sugestão:** [se houver]
   
   ### Recomendação
   ✅ Pronto para aprovação de Claude
   ⚠️ Ajustes necessários: [lista]
   ❌ Bloqueado: [risco crítico]
```
