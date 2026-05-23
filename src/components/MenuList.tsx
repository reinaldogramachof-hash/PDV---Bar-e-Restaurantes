import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, ShoppingCart } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { Product } from '../types';

interface MenuListProps {
  category: string;
  searchTerm: string;
  onSelect: (product: Product) => void;
}

export const MenuList: React.FC<MenuListProps> = ({ category, searchTerm, onSelect }) => {
  const { products, theme } = useApp();
  const isDark = theme === 'dark';

  const filteredProducts = products.filter((product) => {
    const matchesCategory = category === 'Todos' || product.category === category;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      <AnimatePresence mode="popLayout">
        {filteredProducts.map((product) => (
          <motion.button
            layout
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            whileTap={{ scale: 0.98 }}
            key={product.id}
            onClick={() => onSelect(product)}
            className={`group relative flex flex-col items-start p-5 rounded-panel border text-left transition-colors
              ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)]/40' : 'bg-white border-gray-200 hover:border-[var(--color-accent)]/40'}
            `}
          >
            <div className={`absolute top-4 right-4 px-2.5 py-1 rounded-control text-xs font-semibold ${isDark ? 'bg-white/5 text-white' : 'bg-[var(--color-accent)] text-white'}`}>
              R$ {product.price.toFixed(2)}
            </div>

            <div className={`w-11 h-11 rounded-panel flex items-center justify-center mb-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
              <Package className="w-5 h-5 text-[var(--color-accent)]" />
            </div>

            <div className="space-y-1 w-full flex-1 pr-12">
              <h4 className="text-sm font-semibold group-hover:text-[var(--color-accent)] transition-colors leading-snug line-clamp-2">
                {product.name}
              </h4>
              <p className="text-xs text-[var(--color-muted)] line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-dashed border-current/10 flex items-center justify-between w-full">
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${product.stock > 10 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-xs text-[var(--color-muted)]">{product.stock} em estoque</span>
              </div>
              <div className={`p-2 rounded-control transition-colors ${isDark ? 'bg-white/10 text-white' : 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'}`}>
                <ShoppingCart className="w-3.5 h-3.5" />
              </div>
            </div>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
};
