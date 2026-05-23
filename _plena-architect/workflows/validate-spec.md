# Workflow: /validate-spec — Validação Contra ROADMAP

**Gatilho:** `/validate-spec [Feature Name]`  
**Modo:** Deep Think  
**Tempo estimado:** 20–30min

---

## Procedimento

```
/validate-spec [Nome da Feature]

1. CARREGAMENTO DA SPEC
   - Ler @ROADMAP-FASE-5.md, seção "[Feature Name]"
   - Listar todos os Requisitos Funcionais
   - Listar todos os Requisitos Não-Funcionais
   - Identificar Componentes especificados

2. MAPEAMENTO CÓDIGO vs SPEC
   Para cada requisito:
   - Verificar se está implementado
   - Verificar se está testado
   - Marcar: ✅ Completo | ⚠️ Parcial | ❌ Faltando

3. VALIDAÇÃO DE COMPONENTES
   Para cada componente especificado no ROADMAP:
   - Verificar se o arquivo existe em src/components/
   - Verificar se as props estão tipadas corretamente
   - Verificar se está integrado ao fluxo de navegação

4. VALIDAÇÃO DE STORAGE
   - Verificar se dados usam buildScopedStorageKey
   - Verificar se key de storage corresponde ao especificado no ROADMAP

5. VALIDAÇÃO DE TESTES
   - Verificar se há testes para fluxos críticos
   - Verificar coverage dos novos arquivos

6. RELATÓRIO
   
   ## Validação de Spec: [Feature Name]
   
   ### Requisitos Funcionais
   - [x] RF1: [descrição] → implementado em [arquivo]
   - [x] RF2: [descrição] → implementado em [arquivo]
   - [ ] RF3: [descrição] → NÃO implementado (gap)
   
   ### Requisitos Não-Funcionais
   - [x] RNF1: [descrição] → OK
   - [ ] RNF2: [descrição] → NÃO atendido
   
   ### Gaps Identificados
   **Crítico:** [ou Nenhum]
   **Médio:** [itens faltando]
   
   ### Status
   ✅ 100% da spec implementada → Pronto para validação de Claude
   ⚠️ X% da spec implementada → Gaps: [lista]
   ❌ Spec não atendida → Retornar para implementação
```
