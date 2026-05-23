import React, { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { 
  Plus, Check, X, Search, Package, ArrowUpRight, ArrowDownRight, 
  AlertTriangle, History, Trash2, Edit2, Coffee, Utensils, Pizza, 
  IceCream, GlassWater, TrendingDown, Minus, Filter, Truck, 
  DollarSign, Calendar, Info, ChevronRight, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { StockMovement, StockItem } from '../types';

type TabType = 'overview' | 'movements' | 'losses';

export const Stock: React.FC = () => {
  const { currentEmpresa, stockItems, updateStockItem, addStockItem, deleteStockItem, suppliers, stockMovements, addStockMovement, theme } = useApp();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  // Unified Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [isLossModalOpen, setIsLossModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');

  // Form State for Entry/Register
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: 'kg',
    minStock: 0,
    costPrice: 0,
    supplierId: '',
    addQuantity: 0 // Quantidade a ser somada ao estoque atual
  });

  // Form State for Loss
  const [lossData, setLossData] = useState({
    quantity: 0,
    reason: ''
  });

  const categories = ['Todas', ...Array.from(new Set(stockItems.map(i => i.category)))];

  const filteredItems = useMemo(() => {
    return stockItems.filter(i => {
      const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Todas' || i.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [stockItems, searchTerm, selectedCategory]);

  const sortedMovements = useMemo(() => {
    return [...stockMovements].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [stockMovements]);

  const handleOpenModal = (item?: StockItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        category: item.category,
        unit: item.unit,
        minStock: item.minStock,
        costPrice: item.costPrice,
        supplierId: item.supplierId || '',
        addQuantity: 0
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        category: '',
        unit: 'kg',
        minStock: 0,
        costPrice: 0,
        supplierId: '',
        addQuantity: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    
    const item: StockItem = {
      id: editingItem?.id || Date.now().toString(),
      empresaId: editingItem?.empresaId || currentEmpresa.id,
      name: formData.name,
      category: formData.category,
      unit: formData.unit,
      minStock: Number(formData.minStock),
      costPrice: Number(formData.costPrice),
      supplierId: formData.supplierId,
      currentStock: (editingItem?.currentStock || 0) + Number(formData.addQuantity)
    };

    if (editingItem) {
      updateStockItem(item);
    } else {
      addStockItem(item);
    }

    // Registrar movimento se houve entrada de quantidade
    if (Number(formData.addQuantity) > 0) {
      addStockMovement({
        id: Date.now().toString() + 'mv',
        empresaId: currentEmpresa.id,
        stockItemId: item.id,
        type: 'in',
        quantity: Number(formData.addQuantity),
        unitCost: item.costPrice,
        reason: editingItem ? 'Ajuste de Estoque / Entrada' : 'Estoque Inicial',
        timestamp: new Date().toISOString()
      });
    }

    setIsModalOpen(false);
  };

  const handleSaveLoss = (e: React.FormEvent) => {
    e.preventDefault();
    const si = stockItems.find(item => item.id === selectedItemId);
    if (si && lossData.quantity > 0) {
      updateStockItem({ ...si, currentStock: Math.max(0, si.currentStock - lossData.quantity) });
      addStockMovement({
        id: Date.now().toString(),
        empresaId: currentEmpresa.id,
        stockItemId: si.id,
        type: 'loss',
        quantity: lossData.quantity,
        unitCost: si.costPrice,
        reason: lossData.reason || 'Perda/Desperdício',
        timestamp: new Date().toISOString()
      });
      setIsLossModalOpen(false);
      setSelectedItemId('');
      setLossData({ quantity: 0, reason: '' });
    }
  };

  const getStatusInfo = (si: StockItem) => {
    if (si.currentStock <= 0) return { label: 'Esgotado', color: 'text-danger', bg: 'bg-danger/10' };
    if (si.currentStock <= si.minStock) return { label: 'Baixo', color: 'text-warning', bg: 'bg-warning/10' };
    return { label: 'OK', color: 'text-success', bg: 'bg-success/10' };
  };

  const alertCount = stockItems.filter(i => i.currentStock <= i.minStock).length;

  return (
    <div className="space-y-5 animate-in fade-in duration-500 pb-8">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold leading-none">Gestão de Suprimentos</h2>
          <p className="text-xs font-bold  opacity-40">Controle profundo de insumos e movimentações</p>
        </div>

        <div className={`flex p-1 rounded-panel ${isDark ? 'bg-surface-light/5' : 'bg-elevated-light'}`}>
          {[
            { id: 'overview', label: 'Insumos', icon: Package },
            { id: 'movements', label: 'Histórico', icon: History },
            { id: 'losses', label: 'Quebras', icon: AlertTriangle }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 h-10 px-4 rounded-control text-xs font-semibold  transition-all ${
                activeTab === tab.id
                  ? 'bg-[var(--color-accent)] text-white'
                  : `opacity-40 hover:opacity-100 ${isDark ? 'text-white' : 'text-text-light'}`
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col lg:flex-row gap-3">
            <div className={`relative flex-1 group`}>
              <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isDark ? 'text-white/20 group-focus-within:text-[var(--color-accent)]' : 'text-muted-light group-focus-within:text-[var(--color-accent)]'}`} />
              <input
                type="text"
                placeholder="Buscar por nome ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full h-10 pl-10 pr-4 rounded-panel border transition-all outline-none text-sm font-medium
                  ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)] focus:border-[var(--color-accent)]' : 'bg-surface-light border-border-light focus:border-[var(--color-accent)] shadow-sm'}
                `}
              />
            </div>

            <div className={`relative flex items-center px-3 h-10 rounded-panel border ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-surface-light border-border-light shadow-sm'}`}>
              <Filter className="w-4 h-4 mr-2 opacity-30" />
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="bg-transparent border-none outline-none text-xs font-medium appearance-none pr-8 cursor-pointer"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <button
              onClick={() => handleOpenModal()}
              className="flex items-center justify-center gap-2 px-4 h-10 rounded-panel bg-[var(--color-accent)] text-white font-medium text-sm transition-all hover:bg-[var(--color-accent-hover)]"
            >
              <Plus className="w-4 h-4" /> Novo Insumo
            </button>
          </div>

          {alertCount > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-panel bg-warning/5 border border-warning/20 text-amber-600"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <p className="text-xs font-medium">
                <strong>{alertCount}</strong> {alertCount === 1 ? 'insumo precisa' : 'insumos precisam'} de reposição imediata.
              </p>
            </motion.div>
          )}

          {/* Insumos Table */}
          <div className={`rounded-section border overflow-hidden ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-surface-light border-border-light shadow-2xl shadow-gray-200/10'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className={`text-xs font-medium ${isDark ? 'bg-surface-light/5 text-muted' : 'bg-elevated-light text-muted-light'}`}>
                  <tr>
                    <th className="px-4 py-3 font-medium">Insumo</th>
                    <th className="px-4 py-3 font-medium">Fornecedor</th>
                    <th className="px-4 py-3 font-medium">Saldo</th>
                    <th className="px-4 py-3 font-medium">Custo Un.</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-border' : 'divide-gray-100'}`}>
                  {filteredItems.map(si => {
                    const status = getStatusInfo(si);
                    const supplier = suppliers.find(s => s.id === si.supplierId);
                    return (
                      <tr key={si.id} className={`${isDark ? 'hover:bg-elevated' : 'hover:bg-elevated-light'} transition-colors group`}>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{si.name}</span>
                            <span className="text-xs text-muted">{si.category}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {supplier ? (
                            <span className="text-xs text-muted truncate max-w-[160px] block">{supplier.companyName}</span>
                          ) : (
                            <span className="text-xs text-muted opacity-40">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className={`text-sm font-semibold tabular-nums ${status.color}`}>
                              {si.currentStock.toFixed(3)} <span className="text-xs opacity-60 font-normal">{si.unit}</span>
                            </span>
                            <div className="w-16 h-1 bg-current/10 rounded-full overflow-hidden mt-1">
                              <div
                                className={`h-full ${status.color.replace('text', 'bg')}`}
                                style={{ width: `${Math.min((si.currentStock / (si.minStock * 2 || 1)) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-muted">R$ {si.costPrice.toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color} ${status.bg}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenModal(si)} className={`p-1.5 rounded-control transition-colors ${isDark ? 'hover:bg-elevated' : 'hover:bg-elevated-light'}`}><Edit2 className="w-3.5 h-3.5 opacity-50" /></button>
                            <button onClick={() => { setSelectedItemId(si.id); setIsLossModalOpen(true); }} className="p-1.5 rounded-control text-danger hover:bg-danger/10 transition-colors"><AlertTriangle className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleOpenModal(si)} className="p-1.5 rounded-control text-success hover:bg-success/10 transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Movements Tab */}
      {activeTab === 'movements' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className={`rounded-section border overflow-hidden ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-surface-light border-border-light shadow-2xl shadow-gray-200/10'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className={`text-xs font-medium ${isDark ? 'bg-surface-light/5 text-muted' : 'bg-elevated-light text-muted-light'}`}>
                  <tr>
                    <th className="px-4 py-3 font-medium">Data / Hora</th>
                    <th className="px-4 py-3 font-medium">Insumo</th>
                    <th className="px-4 py-3 font-medium">Operação</th>
                    <th className="px-4 py-3 font-medium">Quantidade</th>
                    <th className="px-4 py-3 font-medium">Motivo</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-border' : 'divide-gray-100'}`}>
                  {sortedMovements.map(m => {
                    const item = stockItems.find(si => si.id === m.stockItemId);
                    return (
                      <tr key={m.id} className={`${isDark ? 'hover:bg-elevated' : 'hover:bg-elevated-light'} transition-colors`}>
                        <td className="px-4 py-3 text-xs text-muted">{new Date(m.timestamp).toLocaleString('pt-BR')}</td>
                        <td className="px-4 py-3 text-xs font-medium">{item?.name || 'Insumo Removido'}</td>
                        <td className="px-4 py-3">
                          {m.type === 'in' && <span className="inline-flex items-center gap-1.5 text-success text-xs font-medium"><ArrowDownRight className="w-3.5 h-3.5" /> Entrada</span>}
                          {m.type === 'out' && <span className="inline-flex items-center gap-1.5 text-accent text-xs font-medium"><ArrowUpRight className="w-3.5 h-3.5" /> Consumo PDV</span>}
                          {m.type === 'loss' && <span className="inline-flex items-center gap-1.5 text-danger text-xs font-medium"><AlertTriangle className="w-3.5 h-3.5" /> Quebra</span>}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm">{m.quantity} <span className="text-xs text-muted">{item?.unit}</span></td>
                        <td className="px-4 py-3 text-xs text-muted">{m.reason}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Losses Tab */}
      {activeTab === 'losses' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stockMovements.filter(m => m.type === 'loss').map(m => {
             const item = stockItems.find(si => si.id === m.stockItemId);
             return (
               <div key={m.id} className={`p-5 rounded-panel border ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-surface-light border-border-light shadow-xl'}`}>
                  <div className="flex justify-between items-start mb-6">
                     <div className="w-12 h-12 rounded-panel bg-danger/10 text-danger flex items-center justify-center"><AlertTriangle className="w-6 h-6" /></div>
                     <span className="text-xs font-bold opacity-30">{new Date(m.timestamp).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <h4 className="text-sm font-semibold  mb-1">{item?.name}</h4>
                  <p className="text-xs font-bold opacity-40  mb-4">{m.reason}</p>
                  <div className="flex justify-between items-end border-t border-current/5 pt-4">
                     <span className="text-xs font-semibold opacity-20">Volume Perdido</span>
                     <span className="text-xl font-semibold text-danger">-{m.quantity} {item?.unit}</span>
                  </div>
               </div>
             );
          })}
        </motion.div>
      )}

      {/* Unified Insumo Modal (Register & Entry) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 30 }} 
              className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-section shadow-2xl ${isDark ? 'bg-[var(--color-surface)] border border-[var(--color-border)]' : 'bg-surface-light'}`}
            >
              <div className="px-5 py-4 border-b flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-panel bg-accent/10 flex items-center justify-center">
                    <Package className="w-4 h-4 text-[var(--color-accent)]" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">{editingItem ? 'Editar Insumo' : 'Novo Insumo'}</h3>
                    <p className="text-xs text-muted">Dados cadastrais e entrada de estoque</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className={`p-2 rounded-control transition-colors ${isDark ? 'hover:bg-elevated' : 'hover:bg-elevated-light'}`}><X className="w-4 h-4 opacity-50" /></button>
              </div>

              <form onSubmit={handleSaveItem} className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Left Column: Cadastro */}
                  <div className="space-y-4">
                    <p className="text-xs font-medium text-[var(--color-accent)] flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5" /> Dados Cadastrais
                    </p>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs text-muted ml-1">Nome do Insumo</label>
                        <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={`w-full h-10 px-3 rounded-panel border outline-none text-sm ${isDark ? 'bg-transparent border-[var(--color-border)] focus:border-[var(--color-accent)]' : 'bg-elevated-light border-border-light focus:border-[var(--color-accent)]'}`} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs text-muted ml-1">Categoria</label>
                          <input required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className={`w-full h-10 px-3 rounded-panel border outline-none text-sm ${isDark ? 'bg-transparent border-[var(--color-border)] focus:border-[var(--color-accent)]' : 'bg-elevated-light border-border-light focus:border-[var(--color-accent)]'}`} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted ml-1">Unidade</label>
                          <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className={`w-full h-10 px-3 rounded-panel border outline-none text-sm appearance-none ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)] text-white' : 'bg-elevated-light border-border-light'}`}>
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="L">L</option>
                            <option value="ml">ml</option>
                            <option value="un">un</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted ml-1">Estoque Mínimo (alerta)</label>
                        <input required type="number" step="0.001" value={formData.minStock} onChange={e => setFormData({...formData, minStock: Number(e.target.value)})} className={`w-full h-10 px-3 rounded-panel border outline-none text-sm ${isDark ? 'bg-transparent border-[var(--color-border)] focus:border-[var(--color-accent)]' : 'bg-elevated-light border-border-light focus:border-[var(--color-accent)]'}`} />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Entrada e Fornecedor */}
                  <div className="space-y-4">
                    <p className="text-xs font-medium text-[var(--color-accent)] flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5" /> Entrada & Fornecedor
                    </p>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs text-muted ml-1">Fornecedor</label>
                        <select value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})} className={`w-full h-10 px-3 rounded-panel border outline-none text-sm appearance-none ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)] text-white' : 'bg-elevated-light border-border-light text-text-light'}`}>
                          <option value="">Nenhum</option>
                          {suppliers.map(s => <option key={s.id} value={s.id}>{s.companyName}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs text-muted ml-1">Custo unitário (R$)</label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-30" />
                            <input required type="number" step="0.01" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})} className={`w-full h-10 pl-8 pr-3 rounded-panel border outline-none text-sm ${isDark ? 'bg-transparent border-[var(--color-border)] focus:border-[var(--color-accent)]' : 'bg-elevated-light border-border-light focus:border-[var(--color-accent)]'}`} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted ml-1">{editingItem ? 'Somar ao estoque' : 'Estoque inicial'}</label>
                          <input required type="number" step="0.001" value={formData.addQuantity} onChange={e => setFormData({...formData, addQuantity: Number(e.target.value)})} className={`w-full h-10 px-3 rounded-panel border outline-none text-sm bg-[var(--color-accent)]/5 border-[var(--color-accent)]/20 text-[var(--color-accent)]`} />
                        </div>
                      </div>

                      {editingItem && (
                        <div className={`px-3 py-2.5 rounded-panel border flex justify-between items-center ${isDark ? 'bg-elevated border-border' : 'bg-elevated-light border-border-light'}`}>
                          <span className="text-xs text-muted flex items-center gap-2"><Info className="w-3.5 h-3.5" /> Saldo após entrada</span>
                          <span className="text-sm font-semibold">
                            {(editingItem.currentStock + Number(formData.addQuantity)).toFixed(3)} {formData.unit}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setIsModalOpen(false)} className={`flex-1 h-10 rounded-panel text-sm font-medium transition-colors ${isDark ? 'bg-elevated hover:bg-surface-light/10' : 'bg-elevated-light hover:bg-border-light'}`}>Cancelar</button>
                  <button type="submit" className="flex-[2] h-10 rounded-panel bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-medium transition-colors">
                    {editingItem ? 'Salvar alterações' : 'Cadastrar insumo'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Loss Modal */}
        {isLossModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLossModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} className={`relative w-full max-w-sm rounded-section overflow-hidden shadow-elevated ${isDark ? 'bg-[var(--color-surface)] border border-[var(--color-border)]' : 'bg-surface-light border border-border-light'}`}>
              <div className="px-5 py-4 border-b flex justify-between items-center">
                <h3 className="text-base font-semibold text-danger">Registrar Quebra / Perda</h3>
                <button onClick={() => setIsLossModalOpen(false)} className={`p-1.5 rounded-control transition-colors ${isDark ? 'hover:bg-elevated' : 'hover:bg-elevated-light'}`}><X className="w-4 h-4 opacity-50" /></button>
              </div>
              <form onSubmit={handleSaveLoss} className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted ml-1">Quantidade perdida</label>
                  <input required type="number" step="0.001" value={lossData.quantity} onChange={e => setLossData({...lossData, quantity: Number(e.target.value)})} className={`w-full h-10 px-3 rounded-panel border outline-none text-sm ${isDark ? 'bg-transparent border-[var(--color-border)] focus:border-danger' : 'bg-elevated-light border-border-light focus:border-danger'}`} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted ml-1">Motivo da baixa</label>
                  <textarea required value={lossData.reason} onChange={e => setLossData({...lossData, reason: e.target.value})} placeholder="Ex: Vencimento, Quebra de garrafa..." rows={3} className={`w-full px-3 py-2.5 rounded-panel border outline-none text-sm resize-none ${isDark ? 'bg-transparent border-[var(--color-border)]' : 'bg-elevated-light border-border-light'}`} />
                </div>
                <button type="submit" className="w-full h-10 rounded-panel bg-danger text-white text-sm font-medium transition-colors hover:opacity-90">
                  Confirmar baixa
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
