import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Product } from '../types';

export interface ComandaDraftItem {
  product: Product;
  quantity: number;
  observation?: string;
}

interface ComandaLancamentoProps {
  tableLabel: string;
  products: Product[];
  items: ComandaDraftItem[];
  isOnline: boolean;
  onBack: () => void;
  onIncrement: (product: Product) => void;
  onDecrement: (productId: string) => void;
  onSetObservation: (productId: string, observation: string) => void;
  onProceed: () => void;
  onSaveOffline: () => void;
}

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const ComandaLancamento: React.FC<ComandaLancamentoProps> = React.memo(({
  tableLabel,
  products,
  items,
  isOnline,
  onBack,
  onIncrement,
  onDecrement,
  onSetObservation,
  onProceed,
  onSaveOffline,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const longPressRef = useRef<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedTerm(searchTerm.trim().toLowerCase());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const categories = useMemo(
    () => {
      const uniqueCategories = Array.from(new Set<string>(products.map(product => product.category)));
      uniqueCategories.sort((a, b) => a.localeCompare(b, 'pt-BR'));
      return ['todas', ...uniqueCategories];
    },
    [products],
  );

  const quantityMap = useMemo(() => {
    const map = new Map<string, ComandaDraftItem>();
    items.forEach(item => map.set(item.product.id, item));
    return map;
  }, [items]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'todas' || product.category === selectedCategory;
      const matchesSearch = debouncedTerm.length === 0 || product.name.toLowerCase().includes(debouncedTerm);
      return (product.active ?? true) && matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, debouncedTerm]);

  const totalItems = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const totalValue = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.product.price, 0), [items]);

  const beginLongPress = (product: Product) => {
    longPressRef.current = window.setTimeout(() => {
      const currentObservation = quantityMap.get(product.id)?.observation || '';
      const nextObservation = window.prompt(`Observação para ${product.name}`, currentObservation);
      if (nextObservation !== null) {
        onSetObservation(product.id, nextObservation.trim());
      }
    }, 500);
  };

  const endLongPress = () => {
    if (longPressRef.current !== null) {
      window.clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="h-9 px-3 rounded-control border border-border text-xs font-medium">
          Voltar
        </button>
        <p className="text-sm font-semibold">{tableLabel}</p>
      </div>

      <input
        value={searchTerm}
        onChange={event => setSearchTerm(event.target.value)}
        placeholder="Buscar produto..."
        className="w-full h-11 px-3 rounded-control border border-border bg-transparent text-sm"
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`h-8 px-3 rounded-full border text-xs whitespace-nowrap ${
              selectedCategory === category
                ? 'bg-accent text-white border-accent'
                : 'border-border text-muted'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filteredProducts.map(product => {
          const draftItem = quantityMap.get(product.id);
          return (
            <div
              key={product.id}
              onPointerDown={() => beginLongPress(product)}
              onPointerUp={endLongPress}
              onPointerLeave={endLongPress}
              className="rounded-panel border border-border p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted">{money(product.price)}</p>
                  {draftItem?.observation && (
                    <p className="text-[11px] text-warning mt-1 truncate">Obs: {draftItem.observation}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onDecrement(product.id)}
                    className="w-8 h-8 rounded-control border border-border text-sm font-semibold"
                  >
                    -
                  </button>
                  <span className="w-5 text-center text-sm font-semibold">{draftItem?.quantity || 0}</span>
                  <button
                    onClick={() => onIncrement(product)}
                    className="w-8 h-8 rounded-control bg-accent text-white text-sm font-semibold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!isOnline && (
        <div className="rounded-control border border-warning/40 bg-warning/10 p-3 text-xs text-warning space-y-2">
          <p>Sem conexão. Você pode salvar este pedido na fila local.</p>
          <button onClick={onSaveOffline} className="h-8 px-3 rounded-control border border-warning/50 font-semibold">
            Salvar pedido offline
          </button>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 px-3 pb-3">
        <div className="mx-auto max-w-md rounded-panel border border-border bg-surface p-3 flex items-center justify-between gap-3 shadow-lg">
          <div>
            <p className="text-xs text-muted">{totalItems} itens</p>
            <p className="text-sm font-semibold">{money(totalValue)}</p>
          </div>
          <button
            onClick={onProceed}
            disabled={!isOnline || totalItems === 0}
            className="h-10 px-4 rounded-control bg-accent text-white text-sm font-semibold disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
});
