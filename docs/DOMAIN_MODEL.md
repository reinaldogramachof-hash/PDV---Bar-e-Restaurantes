# Modelo de Domínio

## Entidade Base

Dados operacionais devem carregar vínculo com empresa.

```ts
interface BaseEntity {
  id: string;
  empresaId: string;
  createdAt?: string;
  updatedAt?: string;
}
```

No backend futuro, esse campo deve corresponder a `empresa_id` no banco relacional e estar presente em filtros, índices e políticas de acesso.

## Entidades Principais

- Empresa: restaurante cliente, plano e licença.
- Usuário: pessoa autenticada, papel e empresa.
- Produto e categoria: cardápio comercial.
- Insumo e ficha técnica: custo e consumo de estoque.
- Mesa e pedido: atendimento do salão e balcão.
- Item do pedido: produto, quantidade e preço vendido.
- Cliente: histórico de consumo e fidelidade.
- Colaborador: função, permissões e vendas atribuídas.
- Fornecedor: contato, categoria e histórico.
- Estoque e movimentações: entradas, saídas e perdas.
- Caixa, despesas e pagamentos: operação financeira por sessão.
- Auditoria: registro futuro de ações críticas.

## Papéis

- Master: administração global do produto.
- Gerente: gestão completa da empresa.
- Caixa: PDV, mesas, caixa e relatórios básicos.
- Garçom: mesas e pedidos.
- Cozinha: fila de preparo.
- Estoque: insumos, produtos e fornecedores.
- Suporte: leitura operacional e apoio.

## Planos

- Essencial: PDV, mesas, caixa, produtos e relatórios.
- Profissional: Essencial + cozinha, estoque, ficha técnica, clientes e fornecedores.
- Gestão: Profissional + colaboradores, relatórios avançados, auditoria, suporte prioritário e multiusuários avançado.

## Jornada Operacional

1. Garçom seleciona mesa e lança produtos.
2. Pedido entra como consumo da mesa.
3. Cozinha acompanha preparo e status.
4. Caixa fecha pedido com formas de pagamento, taxa de serviço e comprovante.
5. Ficha técnica baixa estoque.
6. Relatórios consolidam vendas, produtos, atendentes, despesas e caixa.

## Regra de Isolamento

Nenhum dado operacional novo deve ser salvo sem `empresaId`. Na fase atual, o frontend usa storage local com chaves no formato:

```txt
gestao-gastro:<empresaId>:<colecao>
```

Na evolução com backend, todo endpoint deve inferir ou validar a empresa pela sessão autenticada, não por confiança cega no corpo da requisição.

## Dívidas Técnicas Conscientes da Fase 1

- `currentEmpresa` e `currentUser` ainda são sessão demo local. Devem ser substituídos por autenticação real na fase de backend/multiempresa.
- Garçons (`waiters`) ainda são dados de leitura nesta fase. A gestão completa de usuários, colaboradores e garçons deve entrar junto com autenticação e permissões reais.
- Mesas ainda usam `number` como chave operacional. Uma fase futura deve introduzir identificador próprio para suportar salão, áreas, andares e múltiplos ambientes.
