import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { Product, Order } from '../types';
import { MenuList } from './MenuList';
import { X, Search, Minus, Trash2, Plus, MoveRight, Merge, Clock, Settings, Users, Baby, User, CalendarCheck, PlayCircle, Loader2, AlertTriangle, RefreshCw, ShoppingBag, ChevronRight, LayoutGrid, List, Package } from 'lucide-react';
import { CheckoutModal } from './CheckoutModal';
import { motion, AnimatePresence } from 'motion/react';

interface OrderModalProps {
  tableNumber: number | null;
  mode: 'mesa' | 'balcao';
  onClose: () => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({ tableNumber, mode, onClose }) => {
  const { currentEmpresa, tables, orders, waiters, theme, addOrder, updateOrder, transferTable, mergeTables, clearTable } = useApp();
  const isDark = theme === 'dark';

  const table = useMemo(() => tableNumber ? tables.find(t => t.number === tableNumber) : null, [tableNumber, tables]);
  const isLivre = table ? table.status === 'livre' : false;
  const isReservada = table ? table.status === 'reservada' : false;

  const [customerName, setCustomerName] = useState('');
  const [adultCount, setAdultCount] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [selectedWaiterId, setSelectedWaiterId] = useState(waiters[0]?.id || 'w1');
  
  const initialOrder = useMemo(() => {
    if (mode === 'mesa' && table?.activeOrderId) {
      return orders.find(o => o.id === table.activeOrderId) || null;
    }
    return null;
  }, [table?.activeOrderId, orders, mode]);

  const [activeOrder, setActiveOrder] = useState<Order | null>(initialOrder);
  const [isOpening, setIsOpening] = useState(isLivre && mode === 'mesa');
  const [isManaging, setIsManaging] = useState(false);
  const [isAddingItems, setIsAddingItems] = useState(true); // Default to true on desktop
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('Todos');
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    if (initialOrder) {
      setActiveOrder(initialOrder);
      setAdultCount(prev => initialOrder.adultCount ?? prev);
      setChildrenCount(prev => initialOrder.childrenCount ?? prev);
      setCustomerName(prev => initialOrder.customerName ?? prev);
      setIsOpening(false);
    }
  }, [initialOrder]);

  const handleOpenTable = () => {
    const newOrder: Order = {
      id: Date.now().toString(),
      empresaId: currentEmpresa.id,
      mode: 'mesa',
      tableNumber: tableNumber!,
      customerName,
      customerCount: adultCount + childrenCount,
      adultCount,
      childrenCount,
      items: [],
      subtotal: 0,
      serviceCharge: 0,
      total: 0,
      payments: [],
      status: 'open',
      waiterId: selectedWaiterId,
      timestamp: new Date().toISOString(),
    };
    addOrder(newOrder);
    setActiveOrder(newOrder);
    setIsOpening(false);
  };

  const handleUpdateCounts = (newAdults: number, newChildren: number) => {
    if (!activeOrder) return;
    const updated = { ...activeOrder, adultCount: newAdults, childrenCount: newChildren, customerCount: newAdults + newChildren };
    setActiveOrder(updated);
    if (mode === 'mesa') updateOrder(updated);
  };

  const addItemToOrder = (product: Product) => {
    if (!activeOrder) return;
    const existingIdx = activeOrder.items.findIndex(i => i.product.id === product.id);
    let updatedItems = [...activeOrder.items];
    if (existingIdx !== -1) {
      updatedItems[existingIdx] = { ...updatedItems[existingIdx], quantity: updatedItems[existingIdx].quantity + 1 };
    } else {
      updatedItems.push({ id: Date.now().toString() + Math.random(), product, quantity: 1, price: product.price });
    }
    const subtotal = updatedItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const updated = { ...activeOrder, items: updatedItems, subtotal, total: subtotal };
    setActiveOrder(updated);
    if (mode === 'mesa') updateOrder(updated);
  };

  const changeItemQty = (itemId: string, delta: number) => {
    if (!activeOrder) return;
    const updatedItems = activeOrder.items.map(i => i.id === itemId ? { ...i, quantity: i.quantity + delta } : i).filter(i => i.quantity > 0);
    const subtotal = updatedItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const updated = { ...activeOrder, items: updatedItems, subtotal, total: subtotal };
    setActiveOrder(updated);
    if (mode === 'mesa') updateOrder(updated);
  };

  const categories = ['Todos', 'Drinks', 'Petiscos', 'Pratos', 'Sobremesas'];
  const diffMin = activeOrder ? Math.floor((new Date().getTime() - new Date(activeOrder.timestamp).getTime()) / 60000) : 0;
  const timeStr = diffMin > 60 ? `${Math.floor(diffMin/60)}h ${diffMin%60}m` : `${diffMin}m`;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        className="w-full max-w-[1400px] h-full max-h-[900px] flex gap-6 overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        {(() => {
          // --- RESERVATION & OPENING VIEWS (Keep them centered/compact) ---
          if (isReservada || isOpening || isManaging || (!activeOrder && !isLivre)) {
             return (
               <div className="w-full h-full flex items-center justify-center">
                 {isReservada ? (
                    <div className={`w-full max-w-sm rounded-section border flex flex-col overflow-hidden shadow-2xl ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-100'}`}>
                      <div className={`p-8 flex justify-between items-center border-b ${isDark ? 'bg-[var(--color-elevated)] border-[var(--color-border)]' : 'bg-gray-50 border-gray-100'}`}>
                        <h3 className="font-black uppercase tracking-tight text-lg text-purple-500">Mesa Reservada</h3>
                        <button onClick={onClose} className="p-2 rounded-xl hover:bg-black/5"><X className="w-5 h-5 opacity-40" /></button>
                      </div>
                      <div className="p-10 space-y-8 text-center">
                        <div className="w-24 h-24 bg-purple-500/10 text-purple-500 rounded-section flex items-center justify-center mx-auto shadow-xl shadow-purple-500/5"><CalendarCheck className="w-12 h-12" /></div>
                        <div className="space-y-1"><h4 className="text-4xl font-black uppercase tracking-tighter">Mesa {tableNumber}</h4><p className="text-xs font-bold opacity-40 uppercase tracking-[0.2em]">{table?.reservationReason || 'Reserva Especial'}</p></div>
                        <div className="pt-6 space-y-4">
                          <button onClick={() => { clearTable(tableNumber!); setIsOpening(true); }} className="w-full py-6 bg-purple-500 text-white rounded-section font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-purple-500/40 flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all"><PlayCircle className="w-6 h-6" /> Iniciar Atendimento</button>
                          <button onClick={() => { clearTable(tableNumber!); onClose(); }} className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] opacity-40 hover:opacity-100 hover:text-red-500 transition-all`}>Remover Reserva</button>
                        </div>
                      </div>
                    </div>
                  ) : isOpening ? (
                    <div className={`w-full max-w-md rounded-panel border flex flex-col overflow-hidden shadow-2xl ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-100'}`}>
                      <div className={`px-5 py-4 flex justify-between items-center border-b ${isDark ? 'bg-[var(--color-elevated)] border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`}>
                         <div><h3 className="text-base font-semibold">Mesa {tableNumber?.toString().padStart(2, '0')}</h3><p className="text-xs text-muted">Configuração de Abertura</p></div>
                         <button onClick={onClose} className="p-2 rounded-control hover:bg-black/5 transition-colors"><X className="w-4 h-4 opacity-40" /></button>
                      </div>
                      <div className="p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5"><label className="text-xs text-muted ml-1">Atendente</label><select value={selectedWaiterId} onChange={e => setSelectedWaiterId(e.target.value)} className={`w-full h-10 px-3 rounded-control border outline-none text-sm transition-all focus:ring-2 focus:ring-[var(--color-accent)]/20 ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)] text-white' : 'bg-white border-gray-200'}`}>{waiters.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
                          <div className="space-y-1.5"><label className="text-xs text-muted ml-1">Identificação</label><input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nome (opcional)" className={`w-full h-10 px-3 rounded-control border outline-none text-sm transition-all focus:ring-2 focus:ring-[var(--color-accent)]/20 ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)] text-white' : 'bg-white border-gray-200'}`} /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <CountInput label="Adultos" value={adultCount} onChange={setAdultCount} isDark={isDark} min={1} />
                          <CountInput label="Crianças" value={childrenCount} onChange={setChildrenCount} isDark={isDark} min={0} />
                        </div>
                        <button onClick={handleOpenTable} className="w-full h-10 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] rounded-panel text-white font-medium text-sm shadow-lg shadow-[var(--color-accent)]/20 transition-all">Abrir Mesa</button>
                      </div>
                    </div>
                  ) : isManaging ? (
                    <div className={`w-full max-w-lg rounded-panel border flex flex-col overflow-hidden shadow-2xl ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-100'}`}>
                      <div className={`px-5 py-4 flex justify-between items-center border-b ${isDark ? 'bg-[var(--color-elevated)] border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`}>
                         <div><h3 className="text-base font-semibold">Gestão Operacional</h3><p className="text-xs text-muted">Mesa {tableNumber}</p></div>
                         <button onClick={() => setIsManaging(false)} className="p-2 rounded-control hover:bg-black/5 transition-colors"><X className="w-4 h-4 opacity-40" /></button>
                      </div>
                      <div className="p-5 space-y-5 overflow-y-auto max-h-[75vh] custom-scrollbar">
                        <div><h4 className="text-xs font-medium text-muted mb-3 flex items-center gap-2"><Users className="w-4 h-4" /> Pessoas na Mesa</h4><div className="grid grid-cols-2 gap-3"><CountInput label="Adultos" value={adultCount} onChange={(v:number) => { setAdultCount(v); handleUpdateCounts(v, childrenCount); }} isDark={isDark} min={1} /><CountInput label="Crianças" value={childrenCount} onChange={(v:number) => { setChildrenCount(v); handleUpdateCounts(adultCount, v); }} isDark={isDark} min={0} /></div></div>
                        <div><h4 className="text-xs font-medium text-[var(--color-accent)] mb-3 flex items-center gap-2"><MoveRight className="w-4 h-4" /> Transferir Mesa</h4><div className="grid grid-cols-6 gap-2">{tables.filter(t => t.status === 'livre' && t.number !== tableNumber).map(t => (<button key={t.number} onClick={() => { transferTable(tableNumber!, t.number); onClose(); }} className={`aspect-square rounded-control border flex items-center justify-center text-sm font-semibold transition-all hover:bg-[var(--color-accent)] hover:text-white hover:border-[var(--color-accent)] ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)]' : 'bg-gray-50 border-gray-100'}`}>{t.number}</button>))}</div></div>
                      </div>
                    </div>
                  ) : (
                    <div className={`w-full max-w-sm rounded-panel border p-6 flex flex-col items-center text-center gap-4 ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-100 shadow-2xl'}`}>
                      <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-panel flex items-center justify-center"><AlertTriangle className="w-6 h-6" /></div>
                      <div><h3 className="text-base font-semibold">Erro de Sincronia</h3><p className="text-xs text-muted mt-1 leading-relaxed">Esta mesa está sem comanda ativa no sistema.</p></div>
                      <div className="w-full space-y-2"><button onClick={() => { clearTable(tableNumber!); setIsOpening(true); }} className="w-full h-10 bg-amber-500 text-white rounded-panel text-xs font-medium shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 hover:bg-amber-600 transition-all"><RefreshCw className="w-3.5 h-3.5" /> Resetar Mesa</button><button onClick={onClose} className="w-full h-9 rounded-panel text-xs font-medium opacity-40 hover:opacity-100 transition-opacity">Voltar</button></div>
                    </div>
                  )}
               </div>
             );
          }

          // --- SPLIT DESKTOP VIEW ---
          if (activeOrder) {
            return (
              <div className="flex w-full gap-6 h-full items-stretch">
                {/* Product Selection (Left Side - Larger) */}
                <div className={`flex-1 rounded-3xl border flex flex-col overflow-hidden shadow-2xl ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-100'}`}>
                  <div className="px-5 py-4 border-b space-y-3">
                    <div className="flex justify-between items-center">
                       <h4 className="text-xs font-medium text-muted">Cardápio Digital</h4>
                       <div className="flex gap-1.5"><button className="p-1.5 rounded-control bg-current/5"><LayoutGrid className="w-3.5 h-3.5" /></button><button className="p-1.5 opacity-20"><List className="w-3.5 h-3.5" /></button></div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className={`flex items-center px-3 h-9 rounded-control border flex-1 transition-all focus-within:ring-2 focus-within:ring-[var(--color-accent)]/20 ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`}>
                        <Search className="w-3.5 h-3.5 mr-2.5 opacity-40 shrink-0" />
                        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Pesquisar..." className="bg-transparent border-none outline-none w-full text-xs placeholder:opacity-40" />
                      </div>
                      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                        {categories.map(cat => (
                          <button key={cat} onClick={() => setCategory(cat)} className={`shrink-0 px-3 h-9 rounded-control text-xs font-medium border transition-all ${category === cat ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white' : 'border-current/10 opacity-60 hover:opacity-100'}`}>{cat}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <MenuList category={category} searchTerm={searchTerm} onSelect={addItemToOrder} />
                  </div>
                </div>

                {/* Active Order (Right Side - Sidebar style but taller) */}
                <div className={`w-[450px] rounded-3xl border flex flex-col overflow-hidden shadow-2xl relative z-10 ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-100'}`}>
                  {/* Order Header */}
                  <div className={`px-5 py-4 border-b flex justify-between items-center ${isDark ? 'bg-[var(--color-elevated)] border-[var(--color-border)]' : 'bg-gray-50 border-gray-100'}`}>
                    <div>
                      <h3 className="text-base font-semibold leading-none">Mesa {tableNumber?.toString().padStart(2, '0')}</h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="flex items-center gap-1 text-[10px] font-medium bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full border border-blue-500/20"><Clock className="w-3 h-3" /> {timeStr}</span>
                        <span className="flex items-center gap-1 text-[10px] font-medium bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20"><User className="w-3 h-3" /> {activeOrder.adultCount} ADT</span>
                        {activeOrder.childrenCount! > 0 && <span className="flex items-center gap-1 text-[10px] font-medium bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20"><Baby className="w-3 h-3" /> {activeOrder.childrenCount} CRI</span>}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => setIsManaging(true)} className={`p-2 rounded-control border transition-all ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}><Settings className="w-4 h-4 opacity-60" /></button>
                      <button onClick={onClose} className={`p-2 rounded-control border transition-all ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}><X className="w-4 h-4 opacity-60" /></button>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5 custom-scrollbar">
                    <AnimatePresence initial={false}>
                      {activeOrder.items.length === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center opacity-20 py-12 text-center space-y-3">
                          <ShoppingBag className="w-12 h-12" />
                          <p className="text-xs font-medium">Comanda Vazia</p>
                        </motion.div>
                      ) : activeOrder.items.map(item => (
                        <motion.div layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} key={item.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-control group transition-all ${isDark ? 'bg-[var(--color-app-base)] hover:bg-[var(--color-app-base)]/80' : 'bg-gray-50/50 hover:bg-gray-50 border border-gray-100/50'}`}>
                          <div className={`w-8 h-8 rounded-control flex items-center justify-center shrink-0 ${isDark ? 'bg-white/5' : 'bg-white shadow-sm'}`}><Package className="w-3.5 h-3.5 text-[var(--color-accent)]" /></div>
                          <div className="flex-1 min-w-0"><p className="text-xs font-semibold truncate">{item.product.name}</p><p className="text-[10px] text-muted">R$ {item.price.toFixed(2)}</p></div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => changeItemQty(item.id, -1)} className={`w-7 h-7 rounded-control flex items-center justify-center border transition-all ${item.quantity === 1 ? 'text-red-500 border-red-500/20' : 'border-current/10'}`}>{item.quantity === 1 ? <Trash2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}</button>
                            <span className="w-4 text-center font-semibold text-sm">{item.quantity}</span>
                            <button onClick={() => addItemToOrder(item.product)} className="w-7 h-7 rounded-control flex items-center justify-center border border-current/10 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-all"><Plus className="w-3 h-3" /></button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Order Footer */}
                  <div className={`px-5 py-4 border-t flex justify-between items-center gap-4 ${isDark ? 'bg-[var(--color-elevated)] border-[var(--color-border)]' : 'bg-gray-50 border-gray-100'}`}>
                    <div>
                      <p className="text-xs text-muted">Total da Mesa</p>
                      <div className="flex items-baseline gap-1"><span className="text-sm font-medium text-[var(--color-accent)] opacity-60">R$</span><span className="text-2xl font-semibold text-[var(--color-accent)]">{activeOrder.total.toFixed(2)}</span></div>
                    </div>
                    <button disabled={activeOrder.items.length === 0} onClick={() => setCheckoutOpen(true)} className="px-5 h-10 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded-panel text-xs font-semibold shadow-lg shadow-[var(--color-accent)]/20 disabled:opacity-30 disabled:shadow-none transition-all">Pagar Conta</button>
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })()}

        {checkoutOpen && activeOrder && <CheckoutModal order={activeOrder} onClose={() => setCheckoutOpen(false)} onSuccess={() => { setCheckoutOpen(false); onClose(); }} />}
      </motion.div>
    </div>
  );
};

const CountInput = ({ label, value, onChange, isDark, min }: any) => (
  <div className={`p-3 rounded-control border ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)]' : 'bg-white border-gray-100 shadow-sm'}`}>
    <p className="text-[10px] text-muted text-center mb-2">{label}</p>
    <div className="flex items-center justify-between">
      <button onClick={() => onChange(Math.max(min, value - 1))} className={`w-8 h-8 rounded-control flex items-center justify-center font-semibold text-lg transition-all ${value === min ? 'opacity-10' : 'bg-current/5 hover:bg-current/10'}`}>-</button>
      <span className="text-lg font-semibold">{value}</span>
      <button onClick={() => onChange(value + 1)} className="w-8 h-8 rounded-control bg-current/5 hover:bg-current/10 flex items-center justify-center font-semibold text-lg transition-all">+</button>
    </div>
  </div>
);
