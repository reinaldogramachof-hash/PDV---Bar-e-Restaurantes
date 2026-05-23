import React, { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { 
  Search, Plus, Edit2, Trash2, X, Filter, LayoutGrid, List, 
  ChevronRight, ArrowRight, BookOpen, Package, PlusCircle, MinusCircle, 
  Coffee, Utensils, Pizza, IceCream, GlassWater
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, RecipeItem } from '../types';
import { useAudit } from '../hooks/useAudit';

export const Products: React.FC = () => {
  const { currentEmpresa, products, stockItems, updateProduct, addProduct, deleteProduct, theme } = useApp();
  const isDark = theme === 'dark';
  const { log } = useAudit();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => (localStorage.getItem('viewMode_products') as any) || 'grid');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([]);

  const categories = ['Todas', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const toggleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('viewMode_products', mode);
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setRecipeItems(product.recipe || []);
    } else {
      setEditingProduct(null);
      setRecipeItems([]);
    }
    setIsModalOpen(true);
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const product: Product = {
      id: editingProduct?.id || Date.now().toString(),
      empresaId: editingProduct?.empresaId || currentEmpresa.id,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string),
      category: formData.get('category') as string,
      recipe: recipeItems
    };

    if (editingProduct) updateProduct(product);
    else addProduct(product);

    setIsModalOpen(false);
  };

  const handleDeleteProduct = (p: Product) => {
    deleteProduct(p.id);
    log('product_delete', `Produto excluído: ${p.name}`, { productId: p.id, category: p.category });
  };

  const addRecipeItem = () => {
    setRecipeItems([...recipeItems, { stockItemId: '', quantity: 0 }]);
  };

  const updateRecipeItem = (index: number, field: keyof RecipeItem, value: any) => {
    const next = [...recipeItems];
    next[index] = { ...next[index], [field]: field === 'quantity' ? parseFloat(value) : value };
    setRecipeItems(next);
  };

  const removeRecipeItem = (index: number) => {
    setRecipeItems(recipeItems.filter((_, i) => i !== index));
  };

  const calculateProductionCost = (recipe?: RecipeItem[]) => {
    if (!recipe) return 0;
    return recipe.reduce((acc, item) => {
      const stockItem = stockItems.find(si => si.id === item.stockItemId);
      return acc + (stockItem ? stockItem.costPrice * item.quantity : 0);
    }, 0);
  };

  const getIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'drinks': return <GlassWater className="w-5 h-5" />;
      case 'pratos': return <Utensils className="w-5 h-5" />;
      case 'hambúrgueres': return <Pizza className="w-5 h-5" />;
      case 'petiscos': return <Pizza className="w-5 h-5" />;
      case 'sobremesas': return <IceCream className="w-5 h-5" />;
      default: return <Coffee className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-700 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Cardápio & Vendas</h2>
          <p className="text-xs text-muted">Gestão de catálogo e fichas técnicas</p>
        </div>

        <div className="flex gap-3">
          <div className={`flex p-1 rounded-control ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
            <button onClick={() => toggleViewMode('grid')} className={`p-1.5 rounded-control transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-[var(--color-border)] shadow-sm text-[var(--color-accent)]' : 'opacity-40 hover:opacity-100'}`}><LayoutGrid className="w-3.5 h-3.5" /></button>
            <button onClick={() => toggleViewMode('list')} className={`p-1.5 rounded-control transition-all ${viewMode === 'list' ? 'bg-white dark:bg-[var(--color-border)] shadow-sm text-[var(--color-accent)]' : 'opacity-40 hover:opacity-100'}`}><List className="w-3.5 h-3.5" /></button>
          </div>
          <button
            onClick={() => openModal()}
            className="px-4 h-10 rounded-control bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-medium text-xs transition-all flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" /> Novo Produto
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-30" />
          <input
            type="text"
            placeholder="Buscar no cardápio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full h-10 pl-10 pr-4 rounded-panel border outline-none text-sm transition-all focus:ring-2 focus:ring-[var(--color-accent)]/20 ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-200'}`}
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 h-10 rounded-panel text-xs font-medium transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-white dark:bg-[var(--color-border)] text-[var(--color-accent)] shadow border border-current/10'
                  : 'opacity-40 hover:opacity-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(p => {
            const cost = calculateProductionCost(p.recipe);
            const margin = ((p.price - cost) / p.price) * 100;

            return (
              <motion.div
                layout
                key={p.id}
                className={`group relative flex flex-col p-6 rounded-panel border transition-all duration-500
                  ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)]/40' : 'bg-white border-gray-100 hover:border-[var(--color-accent)]/40 shadow-xl shadow-gray-200/10'}
                `}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-12 h-12 rounded-panel flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                    {getIcon(p.category)}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <button onClick={() => openModal(p)} className="p-2.5 rounded-control hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)] transition-all"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteProduct(p)} className="p-2.5 rounded-control hover:bg-red-500/10 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="space-y-4 flex-1">
                  <div>
                    <h4 className="text-sm font-semibold  truncate">{p.name}</h4>
                    <p className="text-xs font-bold opacity-30 line-clamp-2 mt-1">{p.description}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-semibold  opacity-20">Preço de Venda</span>
                      <span className="text-xl font-semibold ">R$ {p.price.toFixed(2)}</span>
                    </div>
                    {p.recipe && p.recipe.length > 0 ? (
                      <div className="flex justify-between items-center text-xs font-semibold ">
                        <span className="opacity-20">Margem Estimada</span>
                        <span className={margin > 60 ? 'text-emerald-500' : 'text-amber-500'}>{margin.toFixed(0)}%</span>
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-red-500  bg-red-500/5 px-2 py-1 rounded-lg w-fit">Sem Ficha Técnica</div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-dashed border-current/5">
                   <button onClick={() => openModal(p)} className="w-full flex items-center justify-between text-xs font-semibold  opacity-30 group-hover:opacity-100 transition-all">
                     <span className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5" /> Ficha Técnica</span>
                     <ArrowRight className="w-3 h-3 translate-x-0 group-hover:translate-x-1 transition-transform" />
                   </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className={`rounded-panel border overflow-hidden ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/10'}`}>
          <table className="w-full text-left">
            <thead className={`text-xs font-semibold  ${isDark ? 'bg-white/5 text-white/40' : 'bg-gray-50 text-gray-400'}`}>
              <tr>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Ficha Técnica</th>
                <th className="px-4 py-3">Custo Prod.</th>
                <th className="px-4 py-3">Preço Venda</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-current/[0.03]">
              {filteredProducts.map(p => {
                const cost = calculateProductionCost(p.recipe);
                return (
                  <tr key={p.id} className="group hover:bg-current/[0.01] transition-all">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-control flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>{getIcon(p.category)}</div>
                        <span className="font-semibold ">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                       <span className="text-xs font-bold opacity-40">{p.category}</span>
                    </td>
                    <td className="px-4 py-3">
                       <span className="text-xs font-bold opacity-40">{p.recipe?.length || 0} itens</span>
                    </td>
                    <td className="px-4 py-3">
                       <span className="font-mono text-xs font-bold opacity-60">R$ {cost.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3">
                       <span className="font-semibold text-[var(--color-accent)]">R$ {p.price.toFixed(2)}</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => openModal(p)} className="p-2 rounded-lg hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)]"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteProduct(p)} className="p-2 rounded-lg hover:bg-red-500/10 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }} 
              className={`relative w-full max-w-2xl rounded-panel overflow-hidden shadow-2xl flex flex-col max-h-[90vh] ${isDark ? 'bg-[var(--color-surface)] border border-[var(--color-border)]' : 'bg-white'}`}
            >
              <div className="px-5 py-4 border-b flex justify-between items-center">
                <div>
                  <h3 className="text-base font-semibold">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
                  <p className="text-xs text-muted">Configuração de Venda e Produção</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-control hover:bg-black/5 dark:hover:bg-white/5 opacity-40"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleProductSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
                {/* Basic Info */}
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-[var(--color-accent)]">Informações Básicas</h4>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted ml-1">Nome do Produto</label>
                      <input required name="name" defaultValue={editingProduct?.name} className={`w-full h-10 px-3 rounded-control border outline-none text-sm focus:ring-2 focus:ring-[var(--color-accent)]/20 ${isDark ? 'bg-transparent border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted ml-1">Categoria</label>
                        <input required name="category" defaultValue={editingProduct?.category} className={`w-full h-10 px-3 rounded-control border outline-none text-sm focus:ring-2 focus:ring-[var(--color-accent)]/20 ${isDark ? 'bg-transparent border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted ml-1">Preço de Venda (R$)</label>
                        <input required type="number" step="0.01" name="price" defaultValue={editingProduct?.price} className={`w-full h-10 px-3 rounded-control border outline-none text-sm focus:ring-2 focus:ring-[var(--color-accent)]/20 ${isDark ? 'bg-transparent border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted ml-1">Descrição (opcional)</label>
                      <textarea name="description" defaultValue={editingProduct?.description} rows={2} className={`w-full px-3 py-2 rounded-control border outline-none text-sm resize-none focus:ring-2 focus:ring-[var(--color-accent)]/20 ${isDark ? 'bg-transparent border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`} />
                    </div>
                  </div>
                </div>

                {/* Technical Sheet */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-medium text-[var(--color-accent)]">Ficha Técnica (Ingredientes)</h4>
                    <button type="button" onClick={addRecipeItem} className="flex items-center gap-1.5 text-xs font-medium opacity-40 hover:opacity-100 transition-all">
                      <PlusCircle className="w-3.5 h-3.5" /> Adicionar Insumo
                    </button>
                  </div>

                  <div className="space-y-2">
                    {recipeItems.length === 0 && (
                      <div className={`p-5 rounded-panel border border-dashed text-center space-y-2 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                        <Package className="w-6 h-6 mx-auto opacity-20" />
                        <p className="text-xs text-muted">Nenhum insumo vinculado a este produto.</p>
                        <button type="button" onClick={addRecipeItem} className="text-xs font-medium text-[var(--color-accent)]">Vincular agora</button>
                      </div>
                    )}
                    {recipeItems.map((item, idx) => (
                      <div key={idx} className="flex gap-3 items-end animate-in fade-in slide-in-from-top-2">
                        <div className="flex-[2] space-y-1.5">
                          <label className="text-xs text-muted ml-1">Insumo do Estoque</label>
                          <select
                            required
                            value={item.stockItemId}
                            onChange={e => updateRecipeItem(idx, 'stockItemId', e.target.value)}
                            className={`w-full h-10 px-3 rounded-control border outline-none text-xs appearance-none ${isDark ? 'bg-transparent border-[var(--color-border)] text-white' : 'bg-gray-50 border-gray-200'}`}
                          >
                            <option value="">Selecione...</option>
                            {stockItems.map(si => <option key={si.id} value={si.id}>{si.name} ({si.unit})</option>)}
                          </select>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <label className="text-xs text-muted ml-1">Quantidade</label>
                          <input
                            required
                            type="number"
                            step="0.001"
                            value={item.quantity}
                            onChange={e => updateRecipeItem(idx, 'quantity', e.target.value)}
                            className={`w-full h-10 px-3 rounded-control border outline-none text-xs ${isDark ? 'bg-transparent border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`}
                          />
                        </div>
                        <button type="button" onClick={() => removeRecipeItem(idx)} className="h-10 w-10 rounded-control flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"><MinusCircle className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>

                  {recipeItems.length > 0 && (
                    <div className={`px-4 py-3 rounded-control flex justify-between items-center ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <span className="text-xs text-muted">Custo Total de Produção</span>
                      <span className="font-mono font-semibold text-sm">R$ {calculateProductionCost(recipeItems).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className={`flex-1 h-10 rounded-panel text-xs font-medium ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>Cancelar</button>
                  <button type="submit" className="flex-[2] h-10 rounded-panel bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-medium transition-all">Salvar Produto</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
