# Gestão Gastro

Plataforma de gestão operacional para bares e restaurantes.

O objetivo deste repositório é evoluir uma base comercial SaaS para operações gastronômicas, cobrindo a jornada do pedido do garçom ao fechamento do caixa, com mesas, cozinha, estoque e gestão em um único lugar.

## Stack

- React 19
- Vite 6
- TypeScript
- Tailwind CSS
- PWA via `vite-plugin-pwa`
- Persistência local segmentada por empresa nesta fase inicial

## Scripts

```bash
npm install
npm run dev
npm run lint
npm run test
npm run build
```

## Estrutura Principal

- `src/components`: telas operacionais e administrativas.
- `src/store/AppContext.tsx`: estado da aplicação, sessão demo e persistência local.
- `src/domain/saas.ts`: planos, permissões, módulos e storage multiempresa.
- `src/types.ts`: contratos de domínio usados pelo frontend.
- `docs/PRODUCT_STRATEGY.md`: posicionamento SaaS e princípios de decisão.
- `docs/DOMAIN_MODEL.md`: entidades, papéis, planos e regras de isolamento.

## Configuração

Copie `.env.example` para `.env` quando precisar configurar ambiente local.

```bash
VITE_APP_NAME="Gestão Gastro"
VITE_LICENSE_STATUS_URL=""
VITE_DEFAULT_EMPRESA_ID="demo-empresa"
```

Quando `VITE_LICENSE_STATUS_URL` estiver vazio, o app permite uso local. Quando preenchido, a URL deve retornar `BLOQUEADO` para suspender o acesso.

## Direção de Evolução

Esta fase prepara o frontend atual para SaaS sem implementar ainda backend real, painel master completo ou banco relacional. A próxima evolução deve substituir a persistência local por API autenticada, banco relacional e isolamento obrigatório por empresa.
