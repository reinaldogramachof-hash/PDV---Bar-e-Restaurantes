import React, { useEffect, useState } from 'react';
import { useApp } from '../store/AppContext';
import { OrderModal } from './OrderModal';
import { CalendarCheck, Check, CheckCircle2, Clock, Search, Users, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface StatCardProps {
  label: string;
  value: string;
  subValue: string;
  icon: React.ElementType;
  tone: string;
  panelClass: string;
}

const formatCurrency = (value: number) =>
  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const TableTimer: React.FC<{ timestamp: string; status: string }> = ({ timestamp, status }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const diffMin = Math.floor((now - new Date(timestamp).getTime()) / 60000);
  const hours = Math.floor(diffMin / 60);
  const minutes = diffMin % 60;
  const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  const color = status === 'ocupada' ? 'text-accent' : 'text-warning';

  return (
    <div className={`flex items-center gap-1.5 ${color}`}>
      <Clock className="w-3 h-3 opacity-70" />
      <span className="text-xs font-medium">{timeStr}</span>
    </div>
  );
};

export const Tables: React.FC = () => {
  const { tables, theme, orders, reserveTable } = useApp();
  const isDark = theme === 'dark';
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'todos' | 'livre' | 'ocupada' | 'aguardando' | 'reservada'>('todos');
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedForReservation, setSelectedForReservation] = useState<number[]>([]);
  const [reservationReason, setReservationReason] = useState('');

  const closedOrders = orders.filter(order => order.status === 'closed');
  const salesToday = closedOrders.reduce((acc, order) => acc + order.total, 0);
  const occupiedCount = tables.filter(table => table.status === 'ocupada').length;
  const waitingCount = tables.filter(table => table.status === 'aguardando').length;
  const reservedCount = tables.filter(table => table.status === 'reservada').length;
  const panelClass = isDark ? 'bg-surface border-border' : 'bg-surface-light border-border-light';
  const fieldClass = isDark ? 'bg-elevated border-border' : 'bg-elevated-light border-border-light';

  const filteredTables = tables.filter(table => {
    const matchesSearch = table.number.toString().includes(searchTerm);
    const matchesFilter = filter === 'todos' || table.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleTableClick = (number: number) => {
    if (isSelecting) {
      const table = tables.find(item => item.number === number);
      if (table?.status !== 'livre') return;
      setSelectedForReservation(prev => prev.includes(number) ? prev.filter(item => item !== number) : [...prev, number]);
      return;
    }

    setSelectedTable(number);
  };

  const handleConfirmReservation = () => {
    reserveTable(selectedForReservation, reservationReason || 'Reserva de mesa');
    setIsSelecting(false);
    setSelectedForReservation([]);
    setReservationReason('');
  };

  return (
    <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-5">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold leading-none">Mapa de Mesas</h2>
            <p className="text-sm text-muted">Gestão do salão em tempo real</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1 lg:max-w-3xl">
            <StatCard label="Ocupação" value={`${occupiedCount}/${tables.length}`} subValue={`${((occupiedCount / tables.length) * 100).toFixed(0)}%`} icon={Users} tone="success" panelClass={panelClass} />
            <StatCard label="Aguardando" value={waitingCount.toString()} subValue="Pedidos" icon={Clock} tone="warning" panelClass={panelClass} />
            <StatCard label="Reservas" value={reservedCount.toString()} subValue="Bloqueadas" icon={CalendarCheck} tone="purple" panelClass={panelClass} />
            <StatCard label="Vendas" value={`R$ ${salesToday.toFixed(0)}`} subValue="Hoje" icon={CheckCircle2} tone="accent" panelClass={panelClass} />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 pt-5 border-t border-current/5">
          <div className={`flex p-1 gap-1 rounded-panel border w-full lg:w-fit overflow-x-auto scrollbar-none ${fieldClass}`}>
            {['todos', 'livre', 'ocupada', 'aguardando', 'reservada'].map(item => (
              <button
                key={item}
                onClick={() => setFilter(item as 'todos' | 'livre' | 'ocupada' | 'aguardando' | 'reservada')}
                className={`flex-1 lg:flex-none px-4 py-2 rounded-control text-sm font-medium transition-all ${filter === item ? 'bg-accent text-white' : isDark ? 'text-muted hover:bg-surface hover:text-text' : 'text-muted-light hover:bg-surface-light hover:text-text-light'}`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex gap-3 w-full lg:w-auto">
            <div className={`flex items-center px-3 h-10 rounded-control border flex-1 lg:w-64 transition-all focus-within:ring-2 focus-within:ring-accent/20 ${fieldClass}`}>
              <Search className="w-4 h-4 mr-3 text-muted" />
              <input
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                placeholder="Pesquisar mesa..."
                className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder:text-muted"
              />
            </div>
            <button
              onClick={() => { setIsSelecting(!isSelecting); setSelectedForReservation([]); }}
              className={`px-4 h-10 rounded-control font-medium text-sm flex items-center gap-2 border transition-all ${
                isSelecting ? 'bg-danger text-white border-danger' : 'bg-accent text-white border-accent hover:bg-accent-hover'
              }`}
            >
              {isSelecting ? <X className="w-4 h-4" /> : <CalendarCheck className="w-4 h-4" />}
              {isSelecting ? 'Cancelar' : 'Reservar'}
            </button>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredTables.map(table => {
            const isLivre = table.status === 'livre';
            const isOcupada = table.status === 'ocupada';
            const isAguardando = table.status === 'aguardando';
            const isReservada = table.status === 'reservada';
            const isSelected = selectedForReservation.includes(table.number);
            const order = table.activeOrderId ? orders.find(item => item.id === table.activeOrderId) : undefined;
            const statusClass = isOcupada
              ? 'border-accent text-accent'
              : isAguardando
                ? 'border-warning text-warning'
                : isReservada
                  ? 'border-purple-500 text-accent'
                  : isDark ? 'border-border text-muted' : 'border-border-light text-muted-light';

            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                key={table.number}
              >
                <button
                  onClick={() => handleTableClick(table.number)}
                  disabled={isSelecting && !isLivre && !isSelected}
                  className={`relative w-full aspect-[1/1.05] flex flex-col items-center justify-center rounded-panel border transition-all overflow-hidden ${panelClass} ${statusClass} ${
                    isSelected ? 'ring-2 ring-accent/40 border-accent' : ''
                  } ${isSelecting && !isLivre && !isSelected ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-elevated active:scale-95'}`}
                >
                  <span className="text-4xl font-semibold tracking-tight">{table.number.toString().padStart(2, '0')}</span>
                  {order && (isOcupada || isAguardando) && <TableTimer timestamp={order.timestamp} status={table.status} />}
                  {order && (isOcupada || isAguardando) && (
                    <span className="absolute bottom-3 text-[10px] text-muted">
                      {formatCurrency(order.subtotal)}
                    </span>
                  )}
                  {isReservada && (
                    <div className="flex flex-col items-center text-accent max-w-[80%] text-center mt-1">
                      <CalendarCheck className="w-4 h-4 mb-1" />
                      <span className="text-xs font-medium truncate w-full">{table.reservationReason}</span>
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute inset-0 bg-accent/15 flex items-center justify-center">
                      <Check className="w-10 h-10 text-accent stroke-[3px]" />
                    </div>
                  )}
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isSelecting && selectedForReservation.length > 0 && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] w-full max-w-xl px-4">
            <div className={`p-4 rounded-panel border shadow-elevated flex items-center gap-4 ${panelClass}`}>
              <div className="flex-1">
                <p className="text-xs font-medium text-accent mb-1">{selectedForReservation.length} mesas selecionadas</p>
                <input
                  autoFocus
                  value={reservationReason}
                  onChange={event => setReservationReason(event.target.value)}
                  placeholder="Motivo da reserva..."
                  className="bg-transparent border-none outline-none w-full font-medium text-sm placeholder:text-muted"
                />
              </div>
              <button onClick={handleConfirmReservation} className="px-5 h-10 bg-accent text-white rounded-control font-medium text-sm hover:bg-accent-hover active:scale-95 transition-all">
                Confirmar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedTable !== null && (
        <OrderModal tableNumber={selectedTable} mode="mesa" onClose={() => setSelectedTable(null)} />
      )}
    </div>
  );
};

const StatCard = ({ label, value, subValue, icon: Icon, tone, panelClass }: StatCardProps) => {
  const tones: Record<string, string> = {
    success: 'text-success bg-success/10 border-success/20',
    warning: 'text-warning bg-warning/10 border-warning/20',
    accent: 'text-accent bg-accent/10 border-accent/20',
    purple: 'text-accent bg-accent/10 border-purple-500/20',
  };
  const toneClass = tones[tone] ?? tones.accent;

  return (
    <div className={`p-4 rounded-panel border ${panelClass}`}>
      <div className="flex justify-between items-start mb-3">
        <div className={`p-2 rounded-panel border ${toneClass}`}><Icon className="w-4 h-4" /></div>
        <div className="text-right">
          <p className="text-xs text-muted mb-1">{label}</p>
          <p className="text-xl font-semibold">{value}</p>
        </div>
      </div>
      <p className="text-xs text-muted">{subValue}</p>
    </div>
  );
};
