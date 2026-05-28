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

const FALLBACK_RECIPE_ITEM: RecipeItem = {
  stockItemId: '',
  stockItemName: '',
  quantity: 0,
  unit: 'un',
  costPerUnit: 0,
};

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
  const [formPrice, setFormPrice] = useState(0);
  const [recipeSearchTerm, setRecipeSearchTerm] = useState('');

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
    const normalizeRecipeItem = (item: RecipeItem): RecipeItem => {
      const stockItem = stockItems.find(si => si.id === item.stockItemId);
      return {
        stockItemId: item.stockItemId,
        stockItemName: item.stockItemName || stockItem?.name || '',
        quantity: item.quantity || 0,
        unit: item.unit || stockItem?.unit || '',
        costPerUnit: item.costPerUnit || stockItem?.costPrice || 0,
      };
    };

    if (product) {
      setEditingProduct(product);
      setRecipeItems((product.recipe || []).map(normalizeRecipeItem));
      setFormPrice(product.price);
    } else {
      setEditingProduct(null);
      setRecipeItems([]);
      setFormPrice(0);
    }
    setRecipeSearchTerm('');
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
        .filter(item => item.stockItemId && item.quantity > 0)
        .map(item => {
          const stockItem = stockItems.find(si => si.id === item.stockItemId);
          return {
            stockItemId: item.stockItemId,
            stockItemName: stockItem?.name || item.stockItemName,
            quantity: item.quantity,
            unit: stockItem?.unit || item.unit || 'un',
            costPerUnit: stockItem?.costPrice ?? item.costPerUnit,
          };
        }),
    };

    if (editingProduct) updateProduct(product);
    else addProduct(product);

    setIsModalOpen(false);
  };

  const handleDeleteProduct = (p: Product) => {
    deleteProduct(p.id);
    log('product_delete', `Produto excluÃ­do: ${p.name}`, { productId: p.id, category: p.category });
  };

  const addRecipeItem = () => {
    setRecipeItems([...recipeItems, { ...FALLBACK_RECIPE_ITEM }]);
  };

  const updateRecipeStockItem = (index: number, stockItemId: string) => {
    const stockItem = stockItems.find(si => si.id === stockItemId);
    const next = [...recipeItems];
    next[index] = {
      ...next[index],
      stockItemId,
      stockItemName: stockItem?.name || '',
      unit: stockItem?.unit || '',
      costPerUnit: stockItem?.costPrice || 0,
    };
    setRecipeItems(next);
  };

  const updateRecipeQuantity = (index: number, quantity: number) => {
    const next = [...recipeItems];
    next[index] = { ...next[index], quantity: Number.isFinite(quantity) ? quantity : 0 };
    setRecipeItems(next);
  };

  const removeRecipeItem = (index: number) => {
    setRecipeItems(recipeItems.filter((_, i) => i !== index));
  };

  const calculateProductionCost = (recipe?: RecipeItem[]) => {
    if (!recipe) return 0;
    return recipe.reduce((acc, item) => {
      const stockItem = stockItems.find(si => si.id === item.stockItemId);
      const unitCost = stockItem?.costPrice ?? item.costPerUnit ?? 0;
      return acc + (unitCost * item.quantity);
    }, 0);
  };

  const getCmvPercent = (price: number, recipe?: RecipeItem[]) => {
    if (!price || price <= 0) return 0;
    const totalCost = calculateProductionCost(recipe);
    return (totalCost / price) * 100;
  };

  const getCmvBadgeClass = (cmv: number) => {
    if (cmv < 30) return 'text-success bg-success/10 border-success/30';
    if (cmv <= 45) return 'text-warning bg-warning/10 border-warning/30';
    return 'text-danger bg-danger/10 border-danger/30';
  };

  const filteredStockItems = useMemo(() => {
    const normalized = recipeSearchTerm.trim().toLowerCase();
    if (!normalized) return stockItems;
    return stockItems.filter(item => item.name.toLowerCase().includes(normalized));
  }, [recipeSearchTerm, stockItems]);

  const getIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'drinks': return <GlassWater className="w-5 h-5" />;
      case 'pratos': return <Utensils className="w-5 h-5" />;
      case 'hambÃºrgueres': return <Pizza className="w-5 h-5" />;
      case 'petiscos': return <Pizza className="w-5 h-5" />;
      case 'sobremesas': return <IceCream className="w-5 h-5" />;
      default: return <Coffee className="w-5 h-5" />;
    }
  };

  const modalRecipeCost = calculateProductionCost(recipeItems);
  const modalCmv = getCmvPercent(formPrice, recipeItems);

  return (
    <div className="space-y-5 animate-in fade-in duration-700 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">CardÃ¡pio & Vendas</h2>
          <p className="text-xs text-muted">GestÃ£o de catÃ¡logo e fichas tÃ©cnicas</p>
        </div>

        <div className="flex gap-3">
          <div className="flex flex-shrink-0 p-1 gap-1 rounded-control bg-black/5 bg-surface-light/5 border border-current/5">
            <button onClick={() => toggleViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-surface-light bg-elevated shadow-sm text-[var(--color-accent)]' : 'opacity-40 hover:opacity-100'}`}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => toggleViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-surface-light bg-elevated shadow-sm text-[var(--color-accent)]' : 'opacity-40 hover:opacity-100'}`}><List className="w-4 h-4" /></button>
          </div>
          <button
            onClick={() => openModal()}
            className="px-4 h-11 rounded-control bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-medium text-xs transition-all flex items-center gap-2"
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
            placeholder="Buscar no cardÃ¡pio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full h-11 pl-10 pr-4 rounded-panel border outline-none text-sm transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-200'}`}
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 h-11 rounded-panel text-xs font-medium transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-accent text-white shadow border border-accent/20'
                  : 'opacity-40 hover:opacity-100 hover:bg-current/5'
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
            const cmv = getCmvPercent(p.price, p.recipe);

            return (
              <motion.div
                layout
                key={p.id}
                className={`group relative flex flex-col p-6 rounded-panel border transition-all duration-500
                  ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)]/40' : 'bg-white border-gray-100 hover:border-[var(--color-accent)]/40 shadow-xl shadow-gray-200/10'}
                `}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-14 h-14 rounded-panel flex items-center justify-center relative ${isDark ? 'bg-surface-light/5' : 'bg-elevated-light'}`}>
                    {getIcon(p.category)}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                     <button onClick={() => openModal(p)} className={`p-2.5 rounded-control transition-all ${isDark ? 'bg-surface-light/5 hover:bg-surface-light/10' : 'bg-elevated-light hover:bg-elevated-light'}`}><Edit2 className="w-4 h-4 opacity-40" /></button>
                     <button onClick={() => handleDeleteProduct(p)} className="p-2.5 rounded-control bg-danger/10 text-danger hover:bg-danger/10 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="space-y-4 flex-1">
                  <div>
                    <h4 className="text-sm font-semibold  truncate">{p.name}</h4>
                    <p className="text-xs font-bold opacity-30 line-clamp-2 mt-1">{p.description}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-semibold  opacity-20">PreÃ§o de Venda</span>
                      <span className="text-xl font-semibold ">R$ {p.price.toFixed(2)}</span>
                    </div>
                    {p.recipe && p.recipe.length > 0 ? (
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="opacity-20">CMV</span>
                        <span className={`px-2 py-0.5 rounded-full border ${getCmvBadgeClass(cmv)}`}>{cmv.toFixed(1)}%</span>
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-red-500  bg-red-500/5 px-2 py-1 rounded-lg w-fit">Sem Ficha TÃ©cnica</div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-dashed border-current/5">
                   <button onClick={() => openModal(p)} className="w-full flex items-center justify-between text-xs font-semibold  opacity-30 group-hover:opacity-100 transition-all">
                     <span className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5" /> Ficha TÃ©cnica</span>
                     <ArrowRight className="w-3 h-3 translate-x-0 group-hover:translate-x-1 transition-transform" />
                   </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className={`rounded-panel border overflow-hidden ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/10'}`}>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[800px] border-collapse">
              <thead className={`text-xs font-semibold  ${isDark ? 'bg-white/5 text-white/40' : 'bg-gray-50 text-gray-400'}`}>
                <tr>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Ficha TÃ©cnica</th>
                <th className="px-4 py-3">Custo Prod.</th>
                <th className="px-4 py-3">CMV</th>
                <th className="px-4 py-3">PreÃ§o Venda</th>
                <th className="px-4 py-3 text-right">AÃ§Ãµes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-current/[0.03]">
              {filteredProducts.map(p => {
                const cost = calculateProductionCost(p.recipe);
                const cmv = getCmvPercent(p.price, p.recipe);
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
                      {p.recipe && p.recipe.length > 0 ? (
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${getCmvBadgeClass(cmv)}`}>{cmv.toFixed(1)}%</span>
                      ) : (
                        <span className="text-xs text-muted">â€”</span>
                      )}
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
                  <p className="text-xs text-muted">ConfiguraÃ§Ã£o de Venda e ProduÃ§Ã£o</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-control hover:bg-black/5 dark:hover:bg-white/5 opacity-40"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleProductSubmit} className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
                {/* Basic Info */}
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-[var(--color-accent)]">InformaÃ§Ãµes BÃ¡sicas</h4>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted ml-1">Nome do Produto</label>
                      <input required name="name" defaultValue={editingProduct?.name} className={`w-full h-11 px-3 rounded-control border outline-none text-sm transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] ${isDark ? 'bg-transparent border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted ml-1">Categoria</label>
                        <input required name="category" defaultValue={editingProduct?.category} className={`w-full h-11 px-3 rounded-control border outline-none text-sm transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] ${isDark ? 'bg-transparent border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted ml-1">PreÃ§o de Venda (R$)</label>
                        <input required type="number" step="0.01" name="price" value={formPrice || ''} onChange={e => setFormPrice(parseFloat(e.target.value) || 0)} className={`w-full h-11 px-3 rounded-control border outline-none text-sm transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] ${isDark ? 'bg-transparent border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted ml-1">DescriÃ§Ã£o (opcional)</label>
                      <textarea name="description" defaultValue={editingProduct?.description} rows={2} className={`w-full px-3 py-2 rounded-control border outline-none text-sm resize-none transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] ${isDark ? 'bg-transparent border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`} />
                    </div>
                  </div>
                </div>

                {/* Technical Sheet */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-medium text-[var(--color-accent)]">Ficha TÃ©cnica (Ingredientes)</h4>
                    <button type="button" onClick={addRecipeItem} className="flex items-center gap-1.5 text-xs font-medium opacity-40 hover:opacity-100 transition-all">
                      <PlusCircle className="w-3.5 h-3.5" /> Adicionar Insumo
                    </button>
                  </div>

                  <input
                    value={recipeSearchTerm}
                    onChange={e => setRecipeSearchTerm(e.target.value)}
                    placeholder="Buscar insumo por nome..."
                    className={`w-full h-10 px-3 rounded-control border outline-none text-xs transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] ${isDark ? 'bg-transparent border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`}
                  />

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
                            onChange={e => updateRecipeStockItem(idx, e.target.value)}
                            className={`w-full h-11 px-3 rounded-control border outline-none text-xs appearance-none transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] ${isDark ? 'bg-transparent border-[var(--color-border)] text-white' : 'bg-gray-50 border-gray-200'}`}
                          >
                            <option value="">Selecione...</option>
                            {filteredStockItems.map(si => <option key={si.id} value={si.id}>{si.name} ({si.unit})</option>)}
                          </select>
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <label className="text-xs text-muted ml-1">Quantidade</label>
                          <input
                            required
                            type="number"
                            step="0.001"
                            value={item.quantity}
                            onChange={e => updateRecipeQuantity(idx, parseFloat(e.target.value))}
                            className={`w-full h-11 px-3 rounded-control border outline-none text-xs transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] ${isDark ? 'bg-transparent border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`}
                          />
                        </div>
                        <div className={`min-w-[170px] h-11 px-3 rounded-control border flex flex-col justify-center ${isDark ? 'border-[var(--color-border)] bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                          <span className="text-[10px] text-muted">Unidade: {item.unit || '-'}</span>
                          <span className="text-[10px] text-muted">Custo un.: R$ {(item.costPerUnit || 0).toFixed(2)}</span>
                        </div>
                        <button type="button" onClick={() => removeRecipeItem(idx)} className="h-11 w-11 rounded-control flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"><MinusCircle className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>

                  {recipeItems.length > 0 && (
                    <div className={`px-4 py-3 rounded-control flex flex-col gap-2 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted">Custo total</span>
                        <span className="font-mono font-semibold text-sm">R$ {modalRecipeCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted">CMV (%)</span>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${getCmvBadgeClass(modalCmv)}`}>
                          {modalCmv.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className={`flex-1 h-11 rounded-panel text-xs font-medium ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>Cancelar</button>
                  <button type="submit" className="flex-[2] h-11 rounded-panel bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-medium transition-all">Salvar Produto</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
