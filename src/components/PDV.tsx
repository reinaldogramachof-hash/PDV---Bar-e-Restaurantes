import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Product, Order } from '../types';
import { MenuList } from './MenuList';
import { ShoppingBag, Search, Minus, Trash2, Plus, ArrowRight, User, Hash } from 'lucide-react';
import { CheckoutModal } from './CheckoutModal';
import { motion, AnimatePresence } from 'motion/react';

export const PDV: React.FC = () => {
  const { waiters, theme, addOrder } = useApp();
  const isDark = theme === 'dark';

  const [activeOrder, setActiveOrder] = useState<Order>({
    id: Date.now().toString(),
    mode: 'balcao',
    items: [],
    subtotal: 0,
    serviceCharge: 0,
    total: 0,
    payments: [],
    status: 'open',
    waiterId: waiters[0]?.id || 'w1',
    timestamp: new Date().toISOString(),
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('Todos');
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const addItemToOrder = (product: Product) => {
    const existingIdx = activeOrder.items.findIndex(i => i.product.id === product.id);
    let updatedItems = [...activeOrder.items];

    if (existingIdx !== -1) {
      updatedItems[existingIdx] = {
        ...updatedItems[existingIdx],
        quantity: updatedItems[existingIdx].quantity + 1,
      };
    } else {
      updatedItems.push({
        id: Date.now().toString() + Math.random(),
        product,
        quantity: 1,
        price: product.price,
      });
    }

    const subtotal = updatedItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
    setActiveOrder({ ...activeOrder, items: updatedItems, subtotal, total: subtotal });
  };

  const changeItemQty = (itemId: string, delta: number) => {
    const updatedItems = activeOrder.items
      .map(i => i.id === itemId ? { ...i, quantity: i.quantity + delta } : i)
      .filter(i => i.quantity > 0);
    const subtotal = updatedItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
    setActiveOrder({ ...activeOrder, items: updatedItems, subtotal, total: subtotal });
  };

  const categories = ['Todos', 'Drinks', 'Petiscos', 'Pratos', 'Sobremesas'];
  const totalItems = activeOrder.items.reduce((acc, i) => acc + i.quantity, 0);

  const handleSuccess = () => {
    setCheckoutOpen(false);
    setActiveOrder({
      id: Date.now().toString(),
      mode: 'balcao',
      items: [],
      subtotal: 0,
      serviceCharge: 0,
      total: 0,
      payments: [],
      status: 'open',
      waiterId: waiters[0]?.id || 'w1',
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] gap-8">
      {/* Left side: Menu */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold tracking-tighter uppercase leading-none">Venda Rápida</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Atendimento Direto</p>
          </div>
          
          <div className={`flex items-center px-4 py-2.5 rounded-xl border w-full md:w-72 transition-all focus-within:ring-4 focus-within:ring-[#E85D75]/10 ${isDark ? 'bg-[#1C1C1E] border-[#2C2C2E] focus-within:border-[#E85D75]/40' : 'bg-white border-gray-100 focus-within:border-pink-300 shadow-sm'}`}>
            <Search className="w-5 h-5 mr-3 opacity-40" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Pesquisar produto..."
              className="bg-transparent border-none outline-none w-full text-sm font-semibold placeholder:opacity-30"
            />
          </div>
        </div>

        <div className="flex p-1 gap-1 rounded-2xl bg-black/5 dark:bg-white/5 border border-current/5 w-fit mb-8 overflow-x-auto scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`shrink-0 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300
                ${category === cat
                  ? 'bg-white dark:bg-[#2C2C2E] shadow-md text-[#E85D75]'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <MenuList category={category} searchTerm={searchTerm} onSelect={addItemToOrder} />
        </div>
      </div>

      {/* Right side: Cart */}
      <div className={`w-full lg:w-[450px] flex flex-col rounded-3xl border overflow-hidden shrink-0 shadow-2xl relative
        ${isDark ? 'bg-[#1C1C1E] border-[#2C2C2E]' : 'bg-white border-gray-100'}`}>
        
        {/* Cart Header */}
        <div className={`p-6 border-b flex items-center justify-between ${isDark ? 'bg-[#252527] border-[#2C2C2E]' : 'bg-gray-50 border-gray-100'}`}>
           <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-[#E85D75] flex items-center justify-center text-white">
                <ShoppingBag className="w-6 h-6" />
             </div>
             <div>
               <h3 className="font-bold uppercase tracking-tighter text-lg">Carrinho</h3>
               <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black uppercase text-[#E85D75]">{totalItems} Itens</span>
                 <span className="opacity-20 text-[10px]">|</span>
                 <span className={`text-[10px] font-black uppercase flex items-center gap-1 opacity-40`}><User className="w-3 h-3" /> Balcão</span>
               </div>
             </div>
           </div>
           <button onClick={() => handleSuccess()} className={`p-3 rounded-xl transition-all hover:bg-red-500/10 hover:text-red-500 opacity-20 hover:opacity-100`}>
              <Trash2 className="w-5 h-5" />
           </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[300px]">
          <AnimatePresence initial={false}>
            {activeOrder.items.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center py-20 text-center space-y-4">
                 <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <ShoppingBag className="w-8 h-8 opacity-10" />
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-20">O carrinho está limpo</p>
                    <p className="text-xs font-bold opacity-10">Selecione produtos ao lado</p>
                 </div>
              </motion.div>
            ) : activeOrder.items.map(item => (
              <motion.div 
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                key={item.id} 
                className={`flex items-center gap-3 p-3 rounded-2xl transition-all group ${isDark ? 'bg-[#121214] hover:bg-[#121214]/80' : 'bg-gray-50/50 hover:bg-gray-50 border border-gray-100/50'}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isDark ? 'bg-white/5' : 'bg-white shadow-sm'}`}>
                  {item.product.category === 'Drinks' ? '🍸' : item.product.category === 'Petiscos' ? '🍟' : '🍽️'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black uppercase truncate group-hover:text-[#E85D75] transition-colors leading-tight">{item.product.name}</p>
                  <p className={`text-[9px] font-black ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    R$ {item.price.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => changeItemQty(item.id, -1)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all active:scale-90
                      ${item.quantity === 1
                        ? 'border-red-500/20 text-red-500 hover:bg-red-500/10 hover:border-red-500'
                        : isDark ? 'border-[#2C2C2E] hover:bg-white/5' : 'border-gray-200 hover:bg-white shadow-sm'}`}
                  >
                    {item.quantity === 1 ? <Trash2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  </button>
                  <span className="w-4 text-center text-[11px] font-black tracking-tighter">{item.quantity}</span>
                  <button
                    onClick={() => addItemToOrder(item.product)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all active:scale-90
                      ${isDark ? 'border-[#2C2C2E] hover:bg-[#E85D75]/10 hover:text-[#E85D75] hover:border-[#E85D75]' : 'border-gray-200 hover:bg-white shadow-sm hover:text-[#E85D75] hover:border-[#E85D75]'}`}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Cart Footer */}
        <div className={`p-6 border-t space-y-4 ${isDark ? 'bg-[#252527] border-[#2C2C2E]' : 'bg-gray-50 border-gray-100'}`}>
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className={`text-[10px] uppercase font-black tracking-widest opacity-40`}>Total do Pedido</p>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-[#E85D75] opacity-50">R$</span>
                <span className="text-4xl font-black text-[#E85D75] tracking-tighter">{activeOrder.total.toFixed(2)}</span>
              </div>
            </div>
            <button
              disabled={activeOrder.items.length === 0}
              onClick={() => setCheckoutOpen(true)}
              className="flex items-center gap-2 px-8 py-4 bg-[#E85D75] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100"
            >
              Finalizar Venda
              <ArrowRight className="w-4 h-4 stroke-[3px]" />
            </button>
          </div>
        </div>
      </div>

      {checkoutOpen && (
        <CheckoutModal
          order={activeOrder}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};
