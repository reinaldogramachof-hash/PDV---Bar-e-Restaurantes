import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { OrderModal } from './OrderModal';
import { 
  Users, 
  Clock, 
  Search,
  CheckCircle2,
  CalendarCheck,
  Check,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const TableTimer: React.FC<{ timestamp: string; isDark: boolean; status: string }> = ({ timestamp, isDark, status }) => {
  const [now, setNow] = useState(Date.now());
  
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const diffMin = Math.floor((now - new Date(timestamp).getTime()) / 60000);
  const hours = Math.floor(diffMin / 60);
  const minutes = diffMin % 60;
  
  const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  const color = status === 'ocupada' ? 'text-[#E85D75]' : 'text-amber-500';

  return (
    <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-500">
      <Clock className={`w-3 h-3 ${color} opacity-60`} />
      <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${color}`}>
        {timeStr}
      </span>
    </div>
  );
};

export const Tables: React.FC = () => {
  const { tables, theme, orders, reserveTable, clearTable } = useApp();
  const isDark = theme === 'dark';
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'todos' | 'livre' | 'ocupada' | 'aguardando' | 'reservada'>('todos');
  
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedForReservation, setSelectedForReservation] = useState<number[]>([]);
  const [reservationReason, setReservationReason] = useState('');

  const closedOrders = orders.filter(o => o.status === 'closed');
  const salesToday = closedOrders.reduce((acc, o) => acc + o.total, 0);
  const occupiedCount = tables.filter(t => t.status === 'ocupada').length;
  const waitingCount = tables.filter(t => t.status === 'aguardando').length;
  const reservedCount = tables.filter(t => t.status === 'reservada').length;

  const filteredTables = tables.filter(t => {
    const matchesSearch = t.number.toString().includes(searchTerm);
    const matchesFilter = filter === 'todos' || t.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleTableClick = (num: number) => {
    if (isSelecting) {
      const table = tables.find(t => t.number === num);
      if (table?.status !== 'livre') return;
      setSelectedForReservation(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]);
    } else {
      setSelectedTable(num);
    }
  };

  const handleConfirmReservation = () => {
    reserveTable(selectedForReservation, reservationReason || 'Reserva de Mesa');
    setIsSelecting(false);
    setSelectedForReservation([]);
    setReservationReason('');
  };

  return (
    <div className="flex flex-col h-full gap-8 animate-in fade-in duration-700">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-6">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Mapa de Mesas</h2>
            <p className="text-sm font-semibold opacity-60">Gestão operacional do salão</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 lg:max-w-3xl">
            <StatCard label="Ocupação" value={`${occupiedCount}/${tables.length}`} subValue={`${((occupiedCount/tables.length)*100).toFixed(0)}%`} icon={Users} color="emerald" isDark={isDark} />
            <StatCard label="Aguardando" value={waitingCount.toString()} subValue="Pedidos" icon={Clock} color="amber" isDark={isDark} />
            <StatCard label="Reservas" value={reservedCount.toString()} subValue="Bloqueadas" icon={CalendarCheck} color="purple" isDark={isDark} />
            <StatCard label="Vendas" value={`R$ ${salesToday.toFixed(0)}`} subValue="Hoje" icon={CheckCircle2} color="rose" isDark={isDark} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-current/5">
          <div className="flex flex-wrap gap-2 p-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-current/5">
            {['todos', 'livre', 'ocupada', 'aguardando', 'reservada'].map((f) => (
              <button key={f} onClick={() => setFilter(f as any)} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${filter === f ? 'bg-white dark:bg-[#2C2C2E] shadow-md text-[#E85D75]' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>{f}</button>
            ))}
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <div className={`flex items-center px-5 py-3 rounded-2xl border flex-1 sm:w-64 transition-all focus-within:ring-4 focus-within:ring-[#E85D75]/10 ${isDark ? 'bg-[#1C1C1E] border-[#2C2C2E] focus-within:border-[#E85D75]/40' : 'bg-white border-gray-200 focus-within:border-pink-300 shadow-sm'}`}>
              <Search className="w-4 h-4 mr-3 opacity-40" />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Pesquisar mesa..." className="bg-transparent border-none outline-none w-full text-sm font-semibold placeholder:opacity-30" />
            </div>
            <button onClick={() => { setIsSelecting(!isSelecting); setSelectedForReservation([]); }} className={`px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 border transition-all ${isSelecting ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/30' : 'bg-purple-500 text-white border-purple-500 shadow-lg shadow-purple-500/20'}`}>
              {isSelecting ? <X className="w-4 h-4" /> : <CalendarCheck className="w-4 h-4" />}
              {isSelecting ? 'Cancelar' : 'Reservar'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredTables.map(table => {
            const isLivre = table.status === 'livre';
            const isOcupada = table.status === 'ocupada';
            const isAguardando = table.status === 'aguardando';
            const isReservada = table.status === 'reservada';
            const isSelected = selectedForReservation.includes(table.number);
            
            let orderTimestamp = '';
            if(!isLivre && table.activeOrderId) {
               const order = orders.find(o => o.id === table.activeOrderId);
               if(order) orderTimestamp = order.timestamp;
            }

            return (
              <motion.div
                layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                key={table.number}
                className="relative"
              >
                <button
                  onClick={() => handleTableClick(table.number)}
                  disabled={isSelecting && !isLivre && !isSelected}
                  className={`relative w-full aspect-[1/1.1] flex flex-col items-center justify-center rounded-3xl transition-all duration-500 overflow-hidden
                    ${isDark ? 'bg-[#1C1C1E]' : 'bg-white shadow-xl shadow-gray-200/40 border border-gray-100'}
                    ${isLivre ? `border-dashed hover:border-[#E85D75]/40` : ''}
                    ${isOcupada ? 'ring-4 ring-[#E85D75]/10 border-2 border-[#E85D75] scale-105 z-10 shadow-2xl shadow-[#E85D75]/10' : ''}
                    ${isAguardando ? 'ring-4 ring-amber-500/10 border-2 border-amber-500' : ''}
                    ${isReservada ? 'ring-4 ring-purple-500/10 border-2 border-purple-500' : ''}
                    ${isSelected ? 'ring-8 ring-purple-500/30 border-4 border-purple-500 scale-110 z-20 shadow-2xl' : ''}
                    ${isSelecting && !isLivre && !isSelected ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer active:scale-95'}
                  `}
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 blur-[60px] opacity-20 rounded-full transition-transform duration-700 group-hover:scale-150
                    ${isLivre ? 'bg-gray-500' : isOcupada ? 'bg-[#E85D75]' : isReservada ? 'bg-purple-500' : 'bg-amber-500'}`} />

                  <span className={`text-6xl font-black mb-2 transition-all duration-500 tracking-tighter
                    ${isDark ? 'text-white' : 'text-[#1A1A2E]'}`}>
                    {table.number.toString().padStart(2, '0')}
                  </span>

                  {(isOcupada || isAguardando) && orderTimestamp && (
                    <TableTimer timestamp={orderTimestamp} isDark={isDark} status={table.status} />
                  )}

                  {isReservada && (
                    <div className="flex flex-col items-center text-purple-500 animate-in fade-in duration-500 max-w-[80%] text-center">
                      <CalendarCheck className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-black uppercase tracking-tight truncate w-full">{table.reservationReason}</span>
                    </div>
                  )}

                  {isSelected && (
                    <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center backdrop-blur-[2px]">
                      <Check className="w-16 h-16 text-purple-500 stroke-[5px]" />
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
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] w-full max-w-xl px-4">
            <div className={`p-5 rounded-[2.5rem] border shadow-2xl flex items-center gap-6 ${isDark ? 'bg-[#1C1C1E] border-[#2C2C2E]' : 'bg-white border-gray-100'}`}>
              <div className="flex-1 pl-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#E85D75] mb-1">{selectedForReservation.length} Mesas Selecionadas</p>
                <input autoFocus value={reservationReason} onChange={e => setReservationReason(e.target.value)} placeholder="Motivo da reserva..." className="bg-transparent border-none outline-none w-full font-black text-sm placeholder:opacity-20" />
              </div>
              <button onClick={handleConfirmReservation} className="px-8 py-4 bg-purple-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-purple-500/30 hover:scale-105 active:scale-95 transition-all">Confirmar</button>
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

const StatCard = ({ label, value, subValue, icon: Icon, color, isDark }: any) => {
  const colors = {
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    rose: 'text-[#E85D75] bg-[#E85D75]/10 border-[#E85D75]/20',
    purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
  }[color as 'emerald' | 'amber' | 'blue' | 'rose' | 'purple'];

  return (
    <div className={`p-5 rounded-[2rem] border transition-all hover:scale-[1.02] ${isDark ? 'bg-[#1C1C1E] border-[#2C2C2E]' : 'bg-white border-gray-100 shadow-sm'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl border ${colors}`}><Icon className="w-4 h-4" /></div>
        <div className="text-right">
          <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">{label}</p>
          <p className="text-2xl font-black tracking-tighter">{value}</p>
        </div>
      </div>
      <p className="text-[9px] font-bold opacity-30 uppercase tracking-widest">{subValue}</p>
    </div>
  );
};
