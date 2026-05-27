import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Supplier } from '../types';
import { Search, Plus, Truck, Phone, Mail, Edit3, Trash2, Box, User, LayoutGrid, List, MapPin, CreditCard, FileText, Star, X, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { buildScopedStorageKey } from '../domain/saas';

export const Suppliers: React.FC = () => {
  const { currentEmpresa, theme, suppliers, addSupplier, updateSupplier, deleteSupplier } = useApp();
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    const saved = localStorage.getItem(buildScopedStorageKey('viewMode_suppliers', currentEmpresa.id));
    return saved === 'grid' || saved === 'list' ? saved : 'list';
  });

  const toggleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem(buildScopedStorageKey('viewMode_suppliers', currentEmpresa.id), mode);
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'geral' | 'logistica'>('geral');
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [formData, setFormData] = useState<Partial<Supplier>>({
    companyName: '',
    category: 'Geral',
    contactName: '',
    phone: '',
    email: '',
    document: '',
    address: '',
    paymentTerms: '',
    observations: ''
  });

  const handleOpenModal = (supplier?: Supplier) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData(supplier);
    } else {
      setEditingSupplier(null);
      setFormData({ companyName: '', category: 'Geral', contactName: '', phone: '', email: '', document: '', address: '', paymentTerms: '', observations: '' });
    }
    setActiveTab('geral');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.companyName) return;

    const supplier: Supplier = {
      id: editingSupplier?.id || Date.now().toString(),
      empresaId: editingSupplier?.empresaId || currentEmpresa.id,
      companyName: formData.companyName,
      category: formData.category || 'Geral',
      contactName: formData.contactName || '',
      phone: formData.phone || '',
      email: formData.email || '',
      document: formData.document || '',
      address: formData.address || '',
      paymentTerms: formData.paymentTerms || '',
      observations: formData.observations || '',
      rating: formData.rating || 5,
      deliveryPerformance: formData.deliveryPerformance || 100,
      lastDelivery: formData.lastDelivery || new Date().toISOString().split('T')[0]
    };

    if (editingSupplier) updateSupplier(supplier);
    else addSupplier(supplier);
    
    setIsModalOpen(false);
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contactName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-full gap-5 animate-in fade-in duration-700 pb-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-4">
        <div className="space-y-0.5">
          <h2 className="text-xl font-semibold leading-none">Parceiros & Supply</h2>
          <p className="text-xs text-muted">Inteligência Logística e Suprimentos</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="flex p-1 gap-1 rounded-panel bg-black/5 bg-surface-light/5 border border-border w-fit">
            <button onClick={() => toggleViewMode('grid')} className={`p-1.5 rounded-control transition-all ${viewMode === 'grid' ? 'bg-surface-light bg-elevated shadow text-[var(--color-accent)]' : 'opacity-30 hover:opacity-100'}`}><LayoutGrid className="w-3.5 h-3.5" /></button>
            <button onClick={() => toggleViewMode('list')} className={`p-1.5 rounded-control transition-all ${viewMode === 'list' ? 'bg-surface-light bg-elevated shadow text-[var(--color-accent)]' : 'opacity-30 hover:opacity-100'}`}><List className="w-3.5 h-3.5" /></button>
          </div>
          <div className={`flex items-center px-3 h-10 rounded-panel border flex-1 lg:w-80 transition-all focus-within:ring-2 focus-within:ring-[var(--color-accent)]/20 ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-surface-light border-border-light shadow-sm'}`}>
            <Search className="w-3.5 h-3.5 mr-2.5 opacity-30 shrink-0" />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar fornecedor..." className="bg-transparent border-none outline-none w-full text-xs placeholder:opacity-40" />
          </div>
          <button onClick={() => handleOpenModal()} className="px-4 h-11 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded-panel text-xs font-medium flex items-center justify-center gap-2 transition-all">
            <Plus className="w-3.5 h-3.5" /> Novo Fornecedor
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSuppliers.map(supplier => (
            <motion.div
              key={supplier.id}
              layout
              className={`p-6 rounded-panel border transition-all duration-300 group hover:border-[var(--color-accent)]/30 ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-surface-light border-border-light shadow-xl shadow-gray-200/20'}`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-panel flex items-center justify-center relative ${isDark ? 'bg-surface-light/5' : 'bg-elevated-light'}`}>
                  <Truck className="w-6 h-6 opacity-40" />
                  <div className="absolute -top-1 -right-1 flex gap-0.5">
                     {[...Array(Math.min(3, supplier.rating || 0))].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-500 text-warning drop-shadow-md" />)}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                   <button onClick={() => handleOpenModal(supplier)} className={`p-2.5 rounded-control transition-all ${isDark ? 'bg-surface-light/5 hover:bg-surface-light/10' : 'bg-elevated-light hover:bg-elevated-light'}`}><Edit3 className="w-4 h-4 opacity-40" /></button>
                   <button onClick={() => deleteSupplier(supplier.id)} className="p-2.5 rounded-control bg-danger/10 text-danger hover:bg-danger/10 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold truncate leading-tight">{supplier.companyName}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                     <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${isDark ? 'bg-surface-light/5' : 'bg-elevated-light'}`}>{supplier.category}</span>
                     {supplier.deliveryPerformance >= 95 && <span className="flex items-center gap-1 text-xs font-semibold text-success bg-success/10 px-2 py-0.5 rounded-lg"><Check className="w-3 h-3" /> Premium</span>}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-3 opacity-40">
                     <User className="w-3.5 h-3.5" />
                     <span className="text-xs font-bold">{supplier.contactName || 'S/ contato'}</span>
                  </div>
                  <div className="flex items-center gap-3 opacity-40">
                     <Phone className="w-3.5 h-3.5" />
                     <span className="text-xs font-bold">{supplier.phone || 'S/ telefone'}</span>
                  </div>
                  <div className="flex items-center gap-3 opacity-40">
                     <MapPin className="w-3.5 h-3.5" />
                     <span className="text-xs font-bold truncate max-w-[150px]">{supplier.address || 'Não informado'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-dashed border-current/10 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold opacity-40 mb-1">Performance</p>
                  <p className={`text-xl font-semibold ${supplier.deliveryPerformance >= 90 ? 'text-success' : 'text-warning'}`}>{supplier.deliveryPerformance}%</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold opacity-40 mb-1">Última Entrega</p>
                  <p className="text-xs font-semibold opacity-60">{new Date(supplier.lastDelivery).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className={`rounded-section border overflow-hidden ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-surface-light border-border-light shadow-2xl shadow-gray-200/10'}`}>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className={`text-xs uppercase font-semibold tracking-wider border-b ${isDark ? 'bg-surface-light/5 border-border text-muted' : 'bg-elevated-light border-border-light text-muted-light'}`}>
                  <th className="px-4 py-3">Parceiro Logístico</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Contatos & Docs</th>
                  <th className="px-4 py-3">Condição Pgto</th>
                  <th className="px-4 py-3 text-right">Métrica</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-current/[0.03]">
                {filteredSuppliers.map(supplier => (
                  <tr key={supplier.id} className="group hover:bg-current/[0.01] transition-all">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-[1rem] flex items-center justify-center relative ${isDark ? 'bg-surface-light/5' : 'bg-elevated-light'}`}>
                          <Truck className="w-6 h-6 opacity-20" />
                          <div className="absolute -top-1 -right-1 flex gap-0.5">
                             {[...Array(Math.min(3, supplier.rating || 0))].map((_, i) => <Star key={i} className="w-2 h-2 fill-amber-500 text-warning" />)}
                          </div>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-xs font-semibold uppercase tracking-tight leading-tight">{supplier.companyName}</span>
                           <span className="text-[10px] font-bold opacity-40 mt-0.5">{supplier.document || 'Sem CNPJ'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                       <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg ${isDark ? 'bg-surface-light/5 text-muted-light' : 'bg-elevated-light text-muted-light'}`}>{supplier.category}</span>
                    </td>
                    <td className="px-4 py-3">
                       <div className="flex flex-col">
                          <span className="text-xs font-bold opacity-60">{supplier.phone || 'S/ telefone'}</span>
                          <span className="text-[10px] font-bold opacity-40 italic">{supplier.contactName || 'S/ contato'}</span>
                       </div>
                    </td>
                    <td className="px-4 py-3">
                       <div className="flex items-center gap-2">
                          <CreditCard className="w-3 h-3 opacity-20" />
                          <span className="text-xs font-semibold opacity-50 ">{supplier.paymentTerms || 'Boleto'}</span>
                       </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                       <div className="flex flex-col items-end gap-1.5">
                          <span className={`text-xs font-semibold ${supplier.deliveryPerformance >= 90 ? 'text-success' : 'text-warning'}`}>{supplier.deliveryPerformance}%</span>
                          <div className="w-16 h-1 bg-current/10 rounded-full overflow-hidden">
                            <div className={`h-full ${supplier.deliveryPerformance >= 90 ? 'bg-success' : 'bg-warning'}`} style={{ width: `${supplier.deliveryPerformance}%` }} />
                          </div>
                       </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                         <button onClick={() => handleOpenModal(supplier)} className={`p-2.5 rounded-control transition-all ${isDark ? 'bg-surface-light/5 hover:bg-surface-light/10' : 'bg-elevated-light hover:bg-elevated-light'}`}><Edit3 className="w-4 h-4 opacity-40" /></button>
                         <button onClick={() => deleteSupplier(supplier.id)} className="p-2.5 rounded-control bg-danger/10 text-danger hover:bg-danger/10 transition-all"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal / Panel */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 30 }} 
              className={`relative w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col rounded-section shadow-2xl ${isDark ? 'bg-[var(--color-surface)] border border-[var(--color-border)]' : 'bg-surface-light border border-border-light'}`}
            >
              {/* Modal Header */}
              <div className={`px-5 py-4 flex justify-between items-center border-b ${isDark ? 'border-[var(--color-border)]' : 'border-border-light'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-control bg-[var(--color-accent)]/10 flex items-center justify-center">
                    <Truck className="w-4 h-4 text-[var(--color-accent)]" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">{editingSupplier ? 'Ficha do Parceiro' : 'Novo Fornecedor'}</h3>
                    <p className="text-xs text-muted">Gestão de Supply Chain</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-control hover:bg-black/5 hover:bg-surface-light/5 transition-all opacity-40 hover:opacity-100"><X className="w-4 h-4" /></button>
              </div>

              {/* Tabs */}
              <div className="px-5 flex gap-4 border-b border-current/5">
                {[
                  { id: 'geral', label: 'Dados Gerais', icon: User },
                  { id: 'logistica', label: 'Logística & Comercial', icon: Box }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`pb-3 px-1 flex items-center gap-2 text-xs font-medium transition-all relative ${activeTab === tab.id ? 'text-[var(--color-accent)]' : 'opacity-40 hover:opacity-80'}`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {activeTab === tab.id && <motion.div layoutId="tab-underline-supplier" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-accent)] rounded-t-full" />}
                  </button>
                ))}
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                  {activeTab === 'geral' ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs text-muted ml-1">Razão Social / Nome Fantasia</label>
                          <input required value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} className={`w-full h-11 px-3 rounded-control border outline-none text-sm transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)]' : 'bg-elevated-light border-border-light'}`} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-muted ml-1">CNPJ / CPF</label>
                          <input value={formData.document} onChange={e => setFormData({ ...formData, document: e.target.value.replace(/[^0-9]/g, '') })} className={`w-full h-11 px-3 rounded-control border outline-none text-sm transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)]' : 'bg-elevated-light border-border-light'}`} />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs text-muted ml-1">Representante / Contato</label>
                          <input value={formData.contactName} onChange={e => setFormData({ ...formData, contactName: e.target.value })} className={`w-full h-11 px-3 rounded-control border outline-none text-sm transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)]' : 'bg-elevated-light border-border-light'}`} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-muted ml-1">Categoria</label>
                          <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className={`w-full h-11 px-3 rounded-control border outline-none text-sm appearance-none transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)] text-white' : 'bg-elevated-light border-border-light text-text-light'}`}>
                            <option>Bebidas</option>
                            <option>Perecíveis</option>
                            <option>Proteínas</option>
                            <option>Limpeza</option>
                            <option>Manutenção</option>
                            <option>Geral</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs text-muted ml-1">WhatsApp / Telefone</label>
                          <input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/[^0-9\s\+\-\(\)]/g, '') })} className={`w-full h-11 px-3 rounded-control border outline-none text-sm transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)]' : 'bg-elevated-light border-border-light'}`} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-muted ml-1">E-mail Comercial</label>
                          <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={`w-full h-11 px-3 rounded-control border outline-none text-sm transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)]' : 'bg-elevated-light border-border-light'}`} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted ml-1">Endereço de Retirada / Depósito</label>
                        <textarea value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} rows={2} className={`w-full px-3 py-2 rounded-control border outline-none text-sm transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)]' : 'bg-elevated-light border-border-light'}`} />
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs text-muted ml-1">Condição de Pagamento</label>
                          <input value={formData.paymentTerms} onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })} placeholder="Ex: 15 dias, À vista, Boleto 30" className={`w-full h-11 px-3 rounded-control border outline-none text-sm transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)]' : 'bg-elevated-light border-border-light'}`} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-muted ml-1">Classificação Interna (Rating)</label>
                          <div className={`flex gap-2 h-11 px-3 rounded-control border items-center ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)]' : 'bg-elevated-light border-border-light'}`}>
                             {[1, 2, 3, 4, 5].map(r => (
                               <button type="button" key={r} onClick={() => setFormData({ ...formData, rating: r })} className={`transition-all ${formData.rating && formData.rating >= r ? 'text-warning' : 'text-gray-300 opacity-30 hover:opacity-100'}`}>
                                 <Star className={`w-5 h-5 ${formData.rating && formData.rating >= r ? 'fill-current' : ''}`} />
                               </button>
                             ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs text-muted ml-1">Observações & Notas Logísticas</label>
                        <textarea value={formData.observations} onChange={e => setFormData({ ...formData, observations: e.target.value })} rows={3} className={`w-full px-3 py-2 rounded-control border outline-none text-sm transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)]' : 'bg-elevated-light border-border-light'}`} />
                      </div>
                    </div>
                  )}
                </form>
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-4 border-t border-current/5 bg-black/5 bg-surface-light/5 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className={`flex-1 h-11 rounded-panel text-xs font-medium transition-all ${isDark ? 'bg-surface-light/5 hover:bg-surface-light/10' : 'bg-elevated-light hover:bg-border-light'}`}>Descartar</button>
                <button onClick={handleSave} className="flex-[2] h-11 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded-panel text-xs font-medium transition-all">Salvar Parceiro</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
