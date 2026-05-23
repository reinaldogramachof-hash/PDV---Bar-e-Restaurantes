# Workflow: /session-close — Encerramento de Sessão

**Gatilho:** `/session-close`  
**Modo:** Fast  
**Tempo estimado:** 10min

---

## Procedimento

```
/session-close

1. RESUMO DO QUE FOI FEITO
   - Liste todos os arquivos criados nesta sessão
   - Liste todos os arquivos modificados nesta sessão
   - Descreva em 2-3 linhas o que foi implementado

2. VALIDAÇÃO FINAL RÁPIDA
   - npm run lint → reportar resultado
   - npm run build → reportar resultado
   - Verificar se há console.log esquecidos:
     grep -rn "console\." src/ --include="*.tsx" --include="*.ts"

3. STATUS DO ROADMAP
   - Feature desta sessão: ✅ Concluída | ⚠️ Parcial | ❌ Bloqueada
   - Próxima feature a implementar: [nome conforme ROADMAP]

4. GERAR RELATÓRIO DE SESSÃO

   ### Sessão [YYYY-MM-DD] — [Nome da Feature]
   
   **Status:** ✅ Aprovado | ⚠️ Ajustes | ❌ Bloqueado
   **Modo utilizado:** Fast | Deep Think
   
   **Arquivos desta sessão:**
   Criados:
     - src/[caminho/arquivo.tsx]
   Modificados:
     - src/[caminho/arquivo.tsx]
   
   **Checklist:**
   - [ ] Spec 100% implementada
   - [ ] Lint 100%
   - [ ] Build sem erros
   - [ ] Testes >80% coverage
   - [ ] Browser Recording validou UI
   - [ ] Sem console.log em produção
   - [ ] Nenhum arquivo fora do escopo modificado
   
   **Artefatos gerados:**
   - [ ] Task List
   - [ ] Plano de Implementação
   - [ ] Walkthrough
   - [ ] Browser Recording
   
   **Problemas encontrados:** [ou "Nenhum"]
   **Decisões arquiteturais documentadas:** [ou "Nenhuma"]
   
   **Próxima feature:** [nome conforme ROADMAP]
   
   > 🔴 Aguardando validação do Reinaldo para prosseguir.

5. SALVAR RELATÓRIO
   Salvar como: _plena-architect/missions/[YYYY-MM-DD]-[feature-name].md
```
