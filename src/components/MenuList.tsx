import React from 'react';
import { useApp } from '../store/AppContext';
import { Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Package, ShoppingCart } from 'lucide-react';

interface MenuListProps {
  category: string;
  searchTerm: string;
  onSelect: (product: Product) => void;
}

export const MenuList: React.FC<MenuListProps> = ({ category, searchTerm, onSelect }) => {
  const { products, theme } = useApp();
  const isDark = theme === 'dark';

  const filteredProducts = products.filter(p => {
    const matchesCategory = category === 'Todos' || p.category === category;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getEmoji = (cat: string) => {
    switch (cat) {
      case 'Drinks': return '🍸';
      case 'Petiscos': return '🍟';
      case 'Pratos': return '🍽️';
      case 'Sobremesas': return '🍰';
      default: return '📦';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <AnimatePresence mode="popLayout">
        {filteredProducts.map((product) => (
          <motion.button
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            key={product.id}
            onClick={() => onSelect(product)}
            className={`group relative flex flex-col items-start p-8 rounded-[3rem] border text-left transition-all duration-500
              ${isDark ? 'bg-[#121214] border-[#2C2C2E] hover:bg-[#1C1C1E] hover:border-[#E85D75]/40' : 'bg-white border-gray-100 hover:border-[#E85D75]/40 shadow-sm hover:shadow-2xl shadow-gray-200/20'}
            `}
          >
            {/* Price Tag */}
            <div className={`absolute top-6 right-6 px-4 py-2 rounded-2xl font-black text-[11px] tracking-widest shadow-sm
              ${isDark ? 'bg-white/5 text-white' : 'bg-[#E85D75] text-white shadow-[#E85D75]/20'}`}>
              R$ {product.price.toFixed(2)}
            </div>

            {/* Icon/Emoji Container */}
            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-4xl mb-6 transition-all duration-700 group-hover:scale-110 group-hover:rotate-12
              ${isDark ? 'bg-white/5' : 'bg-gray-50 group-hover:bg-white'}`}>
              {getEmoji(product.category)}
            </div>

            {/* Product Info */}
            <div className="space-y-1.5 w-full">
              <h4 className="text-base font-black uppercase tracking-tight group-hover:text-[#E85D75] transition-colors leading-tight">
                {product.name}
              </h4>
              <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.1em] line-clamp-2 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Stock Indicator & Add Button */}
            <div className="mt-8 pt-6 border-t border-dashed border-current/10 flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${product.stock > 10 ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                  {product.stock} DISP.
                </span>
              </div>
              <div className={`p-3 rounded-xl transition-all duration-500 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 translate-x-4 group-hover:translate-x-0
                ${isDark ? 'bg-white/10 text-white' : 'bg-[#E85D75]/10 text-[#E85D75]'}`}>
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
};
