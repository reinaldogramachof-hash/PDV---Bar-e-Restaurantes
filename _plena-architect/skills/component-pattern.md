# Skill: Padrão de Componente React

**Quando usar:** Criar qualquer componente React novo  
**Tempo:** 15–30min (simples) | 1–2h (complexo)  
**Dependências:** rules/tech-stack.md, rules/architecture.md

---

## Procedimento

### 1. Definir Interface de Props

```typescript
interface NomeComponenteProps {
  // Props obrigatórias primeiro
  label: string;
  value: number;
  // Props opcionais depois
  trend?: number;
  className?: string;
  onAction?: () => void;
}
```

### 2. Estrutura do Componente

```typescript
import React from 'react';
import { IconName } from 'lucide-react';
import { useApp } from '../store/AppContext';

export const NomeComponente: React.FC<NomeComponenteProps> = ({
  label,
  value,
  trend,
  onAction,
}) => {
  const { theme } = useApp();
  const isDark = theme === 'dark';

  return (
    <div className={`p-5 rounded-panel border ${
      isDark 
        ? 'bg-[var(--color-surface)] border-[var(--color-border)]'
        : 'bg-white border-gray-200'
    }`}>
      {/* conteúdo */}
    </div>
  );
};
```

### 3. Tokens de Design (usar SEMPRE)

```
Backgrounds:    var(--color-app-base) | var(--color-surface) | var(--color-elevated)
Bordas:         var(--color-border)
Texto:          var(--color-text) | var(--color-muted)
Ação:           var(--color-accent) | var(--color-accent-hover)
Status:         var(--color-success) | var(--color-warning) | var(--color-danger)
Radius:         rounded-control (6px) | rounded-panel (8px) | rounded-section (12px)
```

### 4. Padrão de Densidade Desktop-First

```
Tabelas:        px-4 py-3
Inputs:         h-10 px-3 rounded-control
Botões:         h-10 px-4 font-medium text-xs
Modal header:   px-5 py-4 border-b
Modal body:     p-5 space-y-4
Cards KPI:      p-5 rounded-panel
Labels:         text-xs text-[var(--color-muted)]
Títulos módulo: text-xl font-semibold
```

**PROIBIDO:** `font-black`, `uppercase tracking-widest`, emojis

### 5. Memoização (quando usar)

```typescript
// Componente com props estáveis que re-renderiza desnecessariamente
export const MetricCard = React.memo<MetricCardProps>(({ label, value }) => {
  return <div>...</div>;
});

// Componente simples sem problema de re-render → não precisa de memo
```

### 6. Componente com Estado Local

```typescript
export const SearchInput: React.FC<SearchInputProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  
  // Debounce para inputs de busca
  useEffect(() => {
    const timer = setTimeout(() => onSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  return (
    <input
      value={query}
      onChange={e => setQuery(e.target.value)}
      className="h-10 px-3 rounded-control border border-[var(--color-border)]
                 bg-[var(--color-surface)] text-[var(--color-text)]
                 focus:border-[var(--color-accent)] outline-none"
    />
  );
};
```

## Checklist de Validação

- [ ] Interface de Props definida (sem any)
- [ ] Exportação nomeada (não default)
- [ ] Tokens de design usados (sem hex hardcoded)
- [ ] isDark pattern para tema dual
- [ ] Sem console.log
- [ ] Lint passa sem erros
