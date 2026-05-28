import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { ComandaDraftItem } from './ComandaLancamento';

interface ComandaConfirmacaoProps {
  tableLabel: string;
  items: ComandaDraftItem[];
  generalObservation: string;
  setGeneralObservation: (value: string) => void;
  isOnline: boolean;
  success: boolean;
  onBack: () => void;
  onConfirm: () => void;
}

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const ComandaConfirmacao: React.FC<ComandaConfirmacaoProps> = React.memo(({
  tableLabel,
  items,
  generalObservation,
  setGeneralObservation,
  isOnline,
  success,
  onBack,
  onConfirm,
}) => {
  const total = items.reduce((sum, item) => sum + item.quantity * item.product.price, 0);

  if (success) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-3">
        <CheckCircle2 className="w-14 h-14 text-success animate-bounce-subtle" />
        <h3 className="text-lg font-semibold">Pedido enviado</h3>
        <p className="text-xs text-muted">A cozinha já recebeu esta comanda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="h-9 px-3 rounded-control border border-border text-xs font-medium">
          Voltar
        </button>
        <p className="text-sm font-semibold">{tableLabel}</p>
      </div>

      <div className="rounded-panel border border-border p-3 space-y-2">
        {items.map(item => (
          <div key={item.product.id} className="flex items-start justify-between gap-2 text-sm">
            <div className="min-w-0">
              <p className="font-medium truncate">{item.quantity}x {item.product.name}</p>
              {item.observation && <p className="text-[11px] text-warning truncate">Obs: {item.observation}</p>}
            </div>
            <p className="font-semibold">{money(item.quantity * item.product.price)}</p>
          </div>
        ))}
        <div className="pt-2 border-t border-border flex items-center justify-between">
          <span className="text-xs text-muted">Total</span>
          <span className="text-base font-semibold">{money(total)}</span>
        </div>
      </div>

      <label className="space-y-1 block">
        <span className="text-xs text-muted">Observação geral da comanda</span>
        <textarea
          value={generalObservation}
          onChange={event => setGeneralObservation(event.target.value)}
          rows={3}
          className="w-full rounded-control border border-border bg-transparent px-3 py-2 text-sm"
          placeholder="Ex: sem cebola, alergia a lactose..."
        />
      </label>

      <button
        onClick={onConfirm}
        className="w-full h-12 rounded-control bg-accent text-white text-sm font-semibold"
      >
        {isOnline ? 'Confirmar e Enviar para Cozinha' : 'Salvar na fila offline'}
      </button>
    </div>
  );
});
