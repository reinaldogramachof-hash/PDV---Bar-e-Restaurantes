# Regra: Performance

**Escopo:** Global  
**Severidade:** Alta  
**Validação:** npm run build (bundle size) + DevTools

---

## Regras de Bundle

```
Bundle principal (gzip): < 200KB  ← meta ideal com code splitting
Bundle total (gzip):     < 500KB  ← limite absoluto
```

Se bundle > 500KB → **obrigatório** code splitting com `React.lazy()`.

## Code Splitting Padrão

```typescript
// src/App.tsx — padrão obrigatório para projetos com >5 views
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./components/Dashboard'));
const PDV = lazy(() => import('./components/PDV'));
// ...outras views

// Apenas a view inicial pode ser eager (sem lazy)
import Layout from './components/Layout';  // eager OK — sempre renderizado
```

## Memoização

```typescript
// Componente que recebe props estáveis → React.memo
export const MetricCard = React.memo<MetricCardProps>(({ label, value }) => {
  return <div>...</div>;
});

// Cálculo derivado de state → useMemo
const total = useMemo(() => 
  items.reduce((acc, i) => acc + i.price, 0), 
  [items]
);

// Callback passado para filho → useCallback
const handleClose = useCallback(() => setOpen(false), []);
```

## Regras de Lista

```
Listas com > 100 itens → virtual scroll obrigatório
Listas com < 100 itens → renderização normal OK
```

## Regras de Input

```typescript
// Inputs de busca → debounce obrigatório (300ms padrão)
const [query, setQuery] = useState('');
const debouncedQuery = useDebounce(query, 300);
```

## Imports Tree-Shakeable

```typescript
// Correto ✅ — tree-shakeable
import { X, Check, AlertTriangle } from 'lucide-react';

// Incorreto ❌ — importa tudo
import * as Icons from 'lucide-react';
```

## Impacto de Violação

Bundle acima de 500KB aumenta tempo de carga inicial e penaliza score de performance, impactando experiência do usuário em conexões lentas.
