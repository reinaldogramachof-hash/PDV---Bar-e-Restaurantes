# Estratégia de Produto

## Posicionamento

O Gestão Gastro deve ser tratado como plataforma de gestão operacional para bares e restaurantes, não como apenas um sistema PDV.

A proposta central é: do pedido do garçom ao fechamento do caixa, com controle de mesas, cozinha, estoque e gestão em um único lugar.

## Relação Com Projetos Validados

Soluções já entregues para clientes reais servem como referência de mercado, fluxo e aderência operacional. Elas não devem ser copiadas como identidade, dados, textos ou regras específicas.

O produto base deve evoluir acima de implementações sob encomenda: mais genérico, modular, seguro, multiempresa e comercialmente replicável.

## Princípio de Decisão

Toda funcionalidade deve responder:

> Essa funcionalidade ajuda o produto a ser vendido e utilizado por vários restaurantes, sem depender de customização individual?

Se a resposta for não, a funcionalidade deve ser reavaliada.

## Critérios de Prioridade

Quando houver dúvida entre abordagens, escolher a que favorece:

1. Escalabilidade.
2. Segurança.
3. Reaproveitamento.
4. Manutenção simples.
5. Implantação rápida.
6. Menor dependência de customização.
7. Clareza para usuário final.

## Fases

### Fase 1: Base Técnica

Organizar documentação, identidade, contratos de domínio, variáveis de ambiente, permissões iniciais e storage local segmentado por empresa.

### Fase 2: Domínio do Produto

Separar regras de negócio da interface, consolidar entidades e preparar serviços de API.

### Fase 3: Multiempresa

Tornar `empresa_id` obrigatório no backend, autenticação, permissões e consultas.

### Fase 4: Operação Validada

Consolidar garçom, mesas, cozinha, caixa, baixa de estoque e relatório de vendas.

### Fase 5: SaaS Comercial

Criar painel master, planos, licenças, onboarding, backup e auditoria.
