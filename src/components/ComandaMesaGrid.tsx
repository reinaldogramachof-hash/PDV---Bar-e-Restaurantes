import React from 'react';
import type { Table } from '../types';

interface ComandaMesaGridProps {
  tables: Table[];
  onSelectTable: (table: Table) => void;
  onSelectBalcao: () => void;
}

const statusClass: Record<Table['status'], string> = {
  livre: 'border-success bg-success/10 text-success',
  ocupada: 'border-accent bg-accent/10 text-accent',
  reservada: 'border-blue-500 bg-blue-500/10 text-blue-500',
  aguardando: 'border-warning bg-warning/10 text-warning',
};

const statusLabel: Record<Table['status'], string> = {
  livre: 'Livre',
  ocupada: 'Ocupada',
  reservada: 'Reservada',
  aguardando: 'Aguardando',
};

export const ComandaMesaGrid: React.FC<ComandaMesaGridProps> = React.memo(({ tables, onSelectTable, onSelectBalcao }) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Selecione a mesa</h2>
        <p className="text-xs text-muted">Toque na mesa para abrir a comanda.</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {tables.map(table => (
          <button
            key={table.number}
            onClick={() => onSelectTable(table)}
            className={`h-20 rounded-panel border-2 transition-all ${statusClass[table.status]} active:scale-[0.98]`}
          >
            <p className="text-sm font-semibold">Mesa {table.number}</p>
            <p className="text-[11px] mt-1">{statusLabel[table.status]}</p>
          </button>
        ))}
      </div>

      <button
        onClick={onSelectBalcao}
        className="w-full h-12 rounded-control bg-accent text-white text-sm font-semibold"
      >
        Nova Comanda Balcão
      </button>
    </div>
  );
});
