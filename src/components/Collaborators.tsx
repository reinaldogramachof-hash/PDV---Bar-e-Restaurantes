import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Search, UserPlus, Shield, Briefcase, Calendar, Edit3, Trash2, CheckCircle2, XCircle, User, Clock, Zap, X, LayoutGrid, List, LogIn, LogOut, FileText, Banknote, CreditCard, MapPin, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAudit } from '../hooks/useAudit';


export const Collaborators: React.FC = () => {
  const { theme, collaborators, deleteCollaborator, addCollaborator, updateCollaborator } = useApp();
  const isDark = theme === 'dark';
  const { log } = useAudit();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => (localStorage.getItem('viewMode_collaborators') as any) || 'list');

  const toggleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('viewMode_collaborators', mode);
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'geral' | 'trabalhista'>('geral');
  const [editingMember, setEditingMember] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    permissions: 'waiter' as any,
    status: 'active' as any,
    observations: '',
    contractType: 'CLT' as any,
    salary: 0,
    commissionRate: 0,
    document: '',
    address: '',
    bankDetails: '',
    password: ''
  });

  const stats = [
    { label: 'Equipe Total', value: collaborators.length, icon: User, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Em Serviço', value: collaborators.filter(c => c.status === 'active').length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Em Pausa', value: collaborators.filter(c => c.status === 'break').length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Top Vendas', value: collaborators.reduce((max, c) => Math.max(max, c.totalSales || 0), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: Zap, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  const handleOpenModal = (member?: any) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        name: member.name,
        email: member.email,
        role: member.role,
        permissions: member.permissions,
        status: member.status,
        observations: member.observations || '',
        contractType: member.contractType || 'CLT',
        salary: member.salary || 0,
        commissionRate: member.commissionRate || 0,
        document: member.document || '',
        address: member.address || '',
        bankDetails: member.bankDetails || '',
        password: member.password || ''
      });
    } else {
      setEditingMember(null);
      setFormData({
        name: '',
        email: '',
        role: '',
        permissions: 'waiter',
        status: 'active',
        observations: '',
        contractType: 'CLT',
        salary: 0,
        commissionRate: 0,
        document: '',
        address: '',
        bankDetails: '',
        password: ''
      });
    }
    setActiveTab('geral');
    setIsModalOpen(true);
  };


  const handleToggleStatus = (member: any) => {
    const isActive = member.status === 'active';
    updateCollaborator({
      ...member,
      status: isActive ? 'inactive' : 'active',
      lastCheckIn: !isActive ? new Date().toISOString() : member.lastCheckIn,
      lastCheckOut: isActive ? new Date().toISOString() : member.lastCheckOut
    });
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember) {
      if (editingMember.permissions !== formData.permissions) {
        log('permission_change', `Permissão de ${formData.name} alterada para ${formData.permissions}`, { 
          collaboratorId: editingMember.id, 
          oldRole: editingMember.permissions, 
          newRole: formData.permissions 
        });
      }
      updateCollaborator({ ...editingMember, ...formData });
    } else {
      addCollaborator({
        id: Date.now().toString(),
        ...formData,
        joinedAt: new Date().toISOString(),
        totalSales: 0
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col min-h-full gap-5 animate-in fade-in duration-700 pb-10">
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold leading-none">Gestão de Equipe</h2>
          <p className="text-xs text-muted">RH e Controle de Operações</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="flex flex-shrink-0 p-1 gap-1 rounded-control bg-black/5 bg-surface-light/5 border border-current/5 mr-2">
            <button onClick={() => toggleViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-surface-light bg-elevated shadow-sm text-[var(--color-accent)]' : 'opacity-40 hover:opacity-100'}`}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => toggleViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-surface-light bg-elevated shadow-sm text-[var(--color-accent)]' : 'opacity-40 hover:opacity-100'}`}><List className="w-4 h-4" /></button>
          </div>
          <div className={`flex items-center px-4 py-2.5 rounded-xl border flex-1 lg:w-80 transition-all focus-within:ring-4 focus-within:ring-[var(--color-accent)]/10 ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)] focus-within:border-[var(--color-accent)]/40' : 'bg-white border-gray-200 focus-within:border-pink-300 shadow-sm'}`}>
            <Search className="w-4 h-4 mr-3 opacity-40" />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Pesquisar por nome ou cargo..." className="bg-transparent border-none outline-none w-full text-sm font-semibold placeholder:opacity-30" />
          </div>
          <button onClick={() => handleOpenModal()} className="px-6 py-2.5 bg-[var(--color-accent)] text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-[var(--color-accent)]/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all">
            <UserPlus className="w-4 h-4" /> Novo Membro
          </button>
        </div>
      </div>

      {/* Staff Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <div key={i} className={`p-6 rounded-panel border ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-100 shadow-sm'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl ${s.bg} ${s.color} flex items-center justify-center`}>
                <s.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest opacity-40 mb-0.5">{s.label}</p>
                <p className="text-2xl font-black tracking-tighter">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {collaborators.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.role.toLowerCase().includes(searchTerm.toLowerCase())).map((member) => (
            <motion.div 
              key={member.id}
              layout
              className={`p-6 rounded-panel border transition-all duration-300 group hover:border-[var(--color-accent)]/30 ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-surface-light border-border-light shadow-xl shadow-gray-200/20'}`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`w-14 h-14 rounded-panel flex items-center justify-center text-2xl relative ${isDark ? 'bg-surface-light/5' : 'bg-elevated-light'}`}>
                  <User className="w-6 h-6 opacity-40" />
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${isDark ? 'border-[var(--color-surface)]' : 'border-white'} ${
                    member.status === 'active' ? 'bg-emerald-500' : member.status === 'break' ? 'bg-amber-500' : 'bg-red-500'
                  }`} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                   <button 
                     onClick={() => handleToggleStatus(member)} 
                     className={`p-2.5 rounded-control transition-all flex items-center gap-2 ${
                       member.status === 'active' 
                         ? 'bg-danger/10 text-danger hover:bg-danger/20' 
                         : 'bg-success/10 text-success hover:bg-success/20'
                     }`}
                     title={member.status === 'active' ? 'Registrar Saída' : 'Registrar Entrada'}
                   >
                     {member.status === 'active' ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                   </button>
                   <button onClick={() => handleOpenModal(member)} className={`p-2.5 rounded-control transition-all ${isDark ? 'bg-surface-light/5 hover:bg-surface-light/10' : 'bg-elevated-light hover:bg-elevated-light'}`}><Edit3 className="w-4 h-4 opacity-40" /></button>
                   <button onClick={() => deleteCollaborator(member.id)} className="p-2.5 rounded-control bg-danger/10 text-danger hover:bg-danger/10 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold truncate leading-tight">{member.name}</h3>
                    <div className="flex items-center gap-2 mt-1 opacity-40">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">{member.role}</span>
                    </div>
                  </div>
                  {member.observations && (
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500" title={member.observations}>
                      <FileText className="w-3 h-3" />
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 pt-2">
                   <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${
                     member.permissions === 'admin' ? 'bg-purple-500/10 text-purple-500' : 
                     member.permissions === 'staff' ? 'bg-blue-500/10 text-blue-500' : 
                     'bg-amber-500/10 text-amber-500'
                   }`}>{member.permissions}</span>
                   <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${
                     member.status === 'active' ? 'bg-success/10 text-success' : 'bg-current/5 text-muted'
                   }`}>{member.status === 'active' ? 'Em Serviço' : member.status === 'break' ? 'Em Pausa' : 'Offline'}</span>
                   {member.contractType && (
                     <span className="px-2 py-0.5 rounded-lg bg-black/5 dark:bg-surface-light/5 text-[10px] font-semibold opacity-60">
                       {member.contractType}
                     </span>
                   )}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-dashed border-current/10 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold opacity-40 mb-1">Vendas Totais</p>
                  <p className="text-lg font-semibold text-[var(--color-accent)]">{(member.totalSales || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold opacity-40 mb-1">Entrada</p>
                  <p className="text-xs font-semibold opacity-60">{new Date(member.joinedAt).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className={`rounded-panel border overflow-hidden ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/10'}`}>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className={`text-xs uppercase font-black tracking-widest border-b ${isDark ? 'bg-white/5 border-white/5 text-white/30' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                  <th className="px-8 py-5">Colaborador</th>
                  <th className="px-8 py-5">Função</th>
                  <th className="px-8 py-5">Permissões</th>
                  <th className="px-8 py-5 text-center">Status</th>
                  <th className="px-8 py-5 text-right">Vendas</th>
                  <th className="px-8 py-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-current/[0.03]">
                {collaborators.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.role.toLowerCase().includes(searchTerm.toLowerCase())).map((member) => (
                  <tr key={member.id} className="group hover:bg-current/[0.01] transition-all">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                          <User className="w-5 h-5 opacity-20" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black uppercase tracking-tight leading-tight">{member.name}</span>
                          <span className="text-[9px] font-bold opacity-30">{member.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">{member.role}</span>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                        member.permissions === 'admin' ? 'bg-purple-500/10 text-purple-500' : 
                        member.permissions === 'staff' ? 'bg-blue-500/10 text-blue-500' : 
                        'bg-amber-500/10 text-amber-500'
                      }`}>{member.permissions}</span>
                    </td>
                    <td className="px-8 py-4 text-center">
                       <div className="flex items-center justify-center gap-1.5">
                         <div className={`w-2 h-2 rounded-full ${
                           member.status === 'active' ? 'bg-emerald-500 animate-pulse' : member.status === 'break' ? 'bg-amber-500' : 'bg-red-500'
                         }`} />
                         <span className="text-[9px] font-black uppercase tracking-widest opacity-40">
                           {member.status === 'active' ? 'Ativo' : member.status === 'break' ? 'Pausa' : 'Offline'}
                         </span>
                       </div>
                    </td>
                    <td className="px-8 py-4 text-right">
                       <span className="text-[11px] font-black text-[var(--color-accent)] tracking-tighter">
                         {(member.totalSales || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                       </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                         <button 
                           onClick={() => handleToggleStatus(member)} 
                           className={`p-2 rounded-lg transition-all ${
                             member.status === 'active' 
                               ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                               : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                           }`}
                           title={member.status === 'active' ? 'Saída' : 'Entrada'}
                         >
                           {member.status === 'active' ? <LogOut className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />}
                         </button>
                         <button onClick={() => handleOpenModal(member)} className={`p-2 rounded-lg transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'}`}><Edit3 className="w-3.5 h-3.5 opacity-40" /></button>
                         <button onClick={() => deleteCollaborator(member.id)} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className={`relative w-full max-w-2xl p-8 rounded-section shadow-2xl ${isDark ? 'bg-[var(--color-surface)] border border-[var(--color-border)]' : 'bg-white border border-gray-100'}`}>
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black tracking-tighter uppercase leading-none">{editingMember ? 'Editar Colaborador' : 'Contratar Novo'}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-30 mt-1">Gestão de Equipe e Contratos</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-current/5 opacity-40"><X className="w-5 h-5" /></button>
              </div>

              {/* Modal Tabs */}
              <div className="flex gap-4 mb-8 border-b border-current/5">
                <button 
                  type="button"
                  onClick={() => setActiveTab('geral')}
                  className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'geral' ? 'text-[var(--color-accent)]' : 'opacity-40 hover:opacity-100'}`}
                >
                  Informações Gerais
                  {activeTab === 'geral' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-accent)]" />}
                </button>
                <button 
                  type="button"
                  onClick={() => setActiveTab('trabalhista')}
                  className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'trabalhista' ? 'text-[var(--color-accent)]' : 'opacity-40 hover:opacity-100'}`}
                >
                  Configurações Trabalhistas
                  {activeTab === 'trabalhista' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-accent)]" />}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {activeTab === 'geral' ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest opacity-40 ml-2">Nome Completo</label>
                      <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={`w-full p-4 rounded-2xl border outline-none font-bold text-sm transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest opacity-40 ml-2">Cargo / Função</label>
                        <input required value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className={`w-full p-4 rounded-2xl border outline-none font-bold text-sm transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest opacity-40 ml-2">E-mail</label>
                        <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={`w-full p-4 rounded-2xl border outline-none font-bold text-sm transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest opacity-40 ml-2">CPF / CNPJ</label>
                        <input value={formData.document} onChange={e => setFormData({ ...formData, document: e.target.value.replace(/[^0-9]/g, '') })} className={`w-full p-4 rounded-2xl border outline-none font-bold text-sm transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest opacity-40 ml-2">Permissões de Acesso</label>
                        <select value={formData.permissions} onChange={e => setFormData({ ...formData, permissions: e.target.value as any })} className={`w-full p-4 rounded-2xl border outline-none font-bold text-sm transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)] text-white' : 'bg-gray-50 border-gray-200'}`}>
                          <option value="waiter">Garçom</option>
                          <option value="staff">Equipe / Cozinha</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest opacity-40 ml-2">Endereço Residencial</label>
                      <input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className={`w-full p-4 rounded-2xl border outline-none font-bold text-sm transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest opacity-40 ml-2">Senha de Autorização</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Senha usada no SecurityGate"
                        className={`w-full p-4 rounded-2xl border outline-none font-bold text-sm transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`}
                      />
                      <p className="text-[9px] opacity-30 ml-2">Deixe em branco para desabilitar autenticação por senha neste colaborador.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest opacity-40 ml-2">Tipo de Contrato</label>
                        <select value={formData.contractType} onChange={e => setFormData({ ...formData, contractType: e.target.value as any })} className={`w-full p-4 rounded-2xl border outline-none font-bold text-sm transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)] text-white' : 'bg-gray-50 border-gray-200'}`}>
                          <option value="CLT">CLT</option>
                          <option value="PJ">PJ / MEI</option>
                          <option value="Diarista">Diarista</option>
                          <option value="Freelancer">Freelancer</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest opacity-40 ml-2">Status Operacional</label>
                        <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as any })} className={`w-full p-4 rounded-2xl border outline-none font-bold text-sm transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)] text-white' : 'bg-gray-50 border-gray-200'}`}>
                          <option value="active">Ativo</option>
                          <option value="break">Em Pausa</option>
                          <option value="inactive">Inativo / Offline</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest opacity-40 ml-2">Salário Base (R$)</label>
                        <input type="number" step="0.01" value={formData.salary} onChange={e => setFormData({ ...formData, salary: parseFloat(e.target.value) })} className={`w-full p-4 rounded-2xl border outline-none font-bold text-sm transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest opacity-40 ml-2">Comissão (%)</label>
                        <input type="number" step="0.1" value={formData.commissionRate} onChange={e => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) })} className={`w-full p-4 rounded-2xl border outline-none font-bold text-sm transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest opacity-40 ml-2">Dados Bancários / PIX</label>
                      <textarea value={formData.bankDetails} onChange={e => setFormData({ ...formData, bankDetails: e.target.value })} placeholder="Banco, Agência, Conta ou Chave PIX" className={`w-full p-4 rounded-2xl border outline-none font-bold text-sm transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] h-20 resize-none ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest opacity-40 ml-2">Observações Adicionais</label>
                      <textarea value={formData.observations} onChange={e => setFormData({ ...formData, observations: e.target.value })} placeholder="Notas internas..." className={`w-full p-4 rounded-2xl border outline-none font-bold text-sm transition-all focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)] h-20 resize-none ${isDark ? 'bg-[var(--color-app-base)] border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`} />
                    </div>
                  </div>
                )}
                
                <div className="pt-4 flex gap-4 sticky bottom-0 bg-inherit pb-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className={`flex-1 h-11 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'}`}>Cancelar</button>
                  <button type="submit" className="flex-1 h-11 bg-[var(--color-accent)] text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-[var(--color-accent)]/20 hover:scale-[1.02] active:scale-95 transition-all">{editingMember ? 'Salvar Alterações' : 'Contratar Membro'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

