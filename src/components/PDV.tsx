import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Product, Order } from '../types';
import { MenuList } from './MenuList';
import { ArrowRight, Minus, Package, Plus, Search, ShoppingBag, Trash2, User } from 'lucide-react';
import { CheckoutModal } from './CheckoutModal';
import { AnimatePresence, motion } from 'motion/react';

export const PDV: React.FC = () => {
  const { currentEmpresa, waiters, theme } = useApp();
  const isDark = theme === 'dark';

  const createOrder = (): Order => ({
    id: Date.now().toString(),
    empresaId: currentEmpresa.id,
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

  const [activeOrder, setActiveOrder] = useState<Order>(createOrder);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('Todos');
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const categories = ['Todos', 'Drinks', 'Petiscos', 'Pratos', 'Sobremesas'];
  const totalItems = activeOrder.items.reduce((acc, item) => acc + item.quantity, 0);
  const panelClass = isDark ? 'bg-surface border-border' : 'bg-surface-light border-border-light';
  const fieldClass = isDark ? 'bg-elevated border-border' : 'bg-elevated-light border-border-light';

  const addItemToOrder = (product: Product) => {
    const existingIdx = activeOrder.items.findIndex(item => item.product.id === product.id);
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

    const subtotal = updatedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    setActiveOrder({ ...activeOrder, items: updatedItems, subtotal, total: subtotal });
  };

  const changeItemQty = (itemId: string, delta: number) => {
    const updatedItems = activeOrder.items
      .map(item => item.id === itemId ? { ...item, quantity: item.quantity + delta } : item)
      .filter(item => item.quantity > 0);
    const subtotal = updatedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    setActiveOrder({ ...activeOrder, items: updatedItems, subtotal, total: subtotal });
  };

  const handleSuccess = () => {
    setCheckoutOpen(false);
    setActiveOrder(createOrder());
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-112px)] gap-5">
      <section className="flex-1 flex flex-col min-w-0">
        <div className="mb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold leading-none">Venda rápida</h2>
            <p className="text-sm text-muted">Atendimento direto no balcão</p>
          </div>

          <div className={`flex items-center px-3 h-10 rounded-control border w-full md:w-80 transition-all focus-within:ring-2 focus-within:ring-accent/20 ${fieldClass}`}>
            <Search className="w-4 h-4 mr-3 text-muted" />
            <input
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="Pesquisar produto..."
              className="bg-transparent border-none outline-none w-full text-sm font-medium placeholder:text-muted"
            />
          </div>
        </div>

        <div className={`flex p-1 gap-1 rounded-panel border w-fit mb-5 overflow-x-auto scrollbar-none ${fieldClass}`}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-control text-sm font-medium transition-all ${
                category === cat
                  ? 'bg-accent text-white'
                  : isDark ? 'text-muted hover:bg-surface hover:text-text' : 'text-muted-light hover:bg-surface-light hover:text-text-light'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <MenuList category={category} searchTerm={searchTerm} onSelect={addItemToOrder} />
        </div>
      </section>

      <aside className={`w-full lg:w-[420px] flex flex-col rounded-panel border overflow-hidden shrink-0 ${panelClass}`}>
        <div className={`p-5 border-b flex items-center justify-between ${isDark ? 'bg-elevated border-border' : 'bg-elevated-light border-border-light'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-panel bg-accent flex items-center justify-center text-white">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Carrinho</h3>
              <div className="flex items-center gap-2 text-xs text-muted">
                <span>{totalItems} itens</span>
                <span>•</span>
                <span className="flex items-center gap-1"><User className="w-3 h-3" /> Balcão</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleSuccess}
            className="p-2 rounded-control transition-all hover:bg-danger/10 hover:text-danger text-muted"
            aria-label="Limpar carrinho"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
          <AnimatePresence initial={false}>
            {activeOrder.items.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center py-20 text-center space-y-3 text-muted">
                <ShoppingBag className="w-10 h-10" />
                <div>
                  <p className="text-sm font-medium">Carrinho vazio</p>
                  <p className="text-xs mt-1">Selecione produtos ao lado para iniciar a venda.</p>
                </div>
              </motion.div>
            ) : activeOrder.items.map(item => (
              <motion.div
                layout
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                key={item.id}
                className={`flex items-center gap-3 p-3 rounded-panel transition-colors ${isDark ? 'bg-elevated hover:bg-white/10' : 'bg-elevated-light hover:bg-gray-100'}`}
              >
                <div className={`w-9 h-9 rounded-panel flex items-center justify-center ${isDark ? 'bg-surface' : 'bg-surface-light'}`}>
                  <Package className="w-4 h-4 text-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.product.name}</p>
                  <p className="text-xs text-muted">R$ {item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => changeItemQty(item.id, -1)}
                    className={`w-8 h-8 rounded-control flex items-center justify-center border transition-all active:scale-95 ${
                      item.quantity === 1 ? 'border-danger/20 text-danger hover:bg-danger/10' : isDark ? 'border-border hover:bg-surface' : 'border-border-light hover:bg-surface-light'
                    }`}
                    aria-label="Reduzir quantidade"
                  >
                    {item.quantity === 1 ? <Trash2 className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  </button>
                  <span className="w-5 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => addItemToOrder(item.product)}
                    className={`w-8 h-8 rounded-control flex items-center justify-center border transition-all active:scale-95 ${isDark ? 'border-border hover:bg-accent/10 hover:text-accent' : 'border-border-light hover:bg-surface-light hover:text-accent'}`}
                    aria-label="Aumentar quantidade"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className={`p-5 border-t space-y-4 ${isDark ? 'bg-elevated border-border' : 'bg-elevated-light border-border-light'}`}>
          <div className="flex justify-between items-end gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted">Total do pedido</p>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-semibold text-accent">R$</span>
                <span className="text-3xl font-semibold text-accent">{activeOrder.total.toFixed(2)}</span>
              </div>
            </div>
            <button
              disabled={activeOrder.items.length === 0}
              onClick={() => setCheckoutOpen(true)}
              className="flex items-center gap-2 px-5 h-11 bg-accent text-white rounded-control font-medium text-sm hover:bg-accent-hover active:scale-95 transition-all disabled:opacity-40 disabled:scale-100"
            >
              Finalizar
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {checkoutOpen && (
        <CheckoutModal order={activeOrder} onClose={() => setCheckoutOpen(false)} onSuccess={handleSuccess} />
      )}
    </div>
  );
};
