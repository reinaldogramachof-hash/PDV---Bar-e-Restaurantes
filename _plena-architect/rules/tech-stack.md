# Regra: Tech Stack Obrigatória

**Escopo:** Global — todos os arquivos do projeto  
**Severidade:** Crítica  
**Validação:** TypeScript compiler + lint

---

## Regra

Usar exclusivamente a stack aprovada. Não introduzir novas bibliotecas sem aprovação explícita do Arquiteto (Claude).

## Stack Aprovada

**Frontend:**
- React 19+ (componentes funcionais + hooks APENAS — zero class components)
- TypeScript 5.8+ (strict mode — sem `any`, sem `@ts-ignore`)
- Tailwind CSS v4 (config via `@theme {}` em `src/index.css` — sem `tailwind.config.js`)
- Vite 6+ (build tool)
- Lucide React (ícones — sem emojis, sem FontAwesome, sem Material Icons)
- motion/react (animações — sem framer-motion direto)

**Estado:**
- AppContext + useState/useReducer (sem Redux, sem Zustand, sem Jotai)

**Testes:**
- tsx para domain tests (sem Jest, sem Vitest — a não ser que o projeto exija)

## Exemplo Correto ✅

```typescript
import { useState, useMemo } from 'react';
import { ShoppingCart } from 'lucide-react';

const MyComponent: React.FC<Props> = ({ items }) => {
  const total = useMemo(() => items.reduce((acc, i) => acc + i.price, 0), [items]);
  return <div className="bg-[var(--color-surface)]"><ShoppingCart /></div>;
};
```

## Exemplo Incorreto ❌

```typescript
import { Component } from 'react';    // class component — proibido
import moment from 'moment';          // biblioteca não aprovada
import { FaCart } from 'react-icons'; // biblioteca não aprovada
const x: any = {};                    // any — proibido
```

## Impacto de Violação

Introduzir bibliotecas não aprovadas aumenta bundle size, cria inconsistência visual e pode quebrar o build de produção.

---

> **Adaptar por projeto:** Atualizar a seção "Stack Aprovada" conforme o projeto.
