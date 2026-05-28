import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { 
  Settings as SettingsIcon, Store, Printer, Database, Save, 
  Download, Upload, RefreshCw, Check, AlertTriangle, ShieldCheck, 
  Globe, Phone, MapPin, FileText, Layout, Crown, ChefHat
} from 'lucide-react';
import { addonLabels, addonModules, addonPricing, getPlanModules, ModuleId, planDescriptions, planPricing, PLENA_WHATSAPP } from '../domain/saas';
import { useAudit } from '../hooks/useAudit';
import { motion } from 'motion/react';
import { AppSettings } from '../types';

export const Settings: React.FC = () => {
  const { settings, updateSettings, exportData, importData, resetToMocks, theme, currentEmpresa } = useApp();
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<'store' | 'printer' | 'kitchen' | 'data' | 'plan'>('store');
  const [isSaving, setIsSaving] = useState(false);
  const { log } = useAudit();

  const handleSave = () => {
    setIsSaving(true);
    updateSettings(formData);
    setTimeout(() => setIsSaving(false), 800);
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_gestao_gastro_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    log('data_export', 'Backup completo dos dados exportado pelo usuário.', { filename: a.download });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        importData(event.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  const tabs = [
    { id: 'store', label: 'Estabelecimento', icon: Store },
    { id: 'printer', label: 'Impressão', icon: Printer },
    { id: 'kitchen', label: 'Cozinha', icon: ChefHat },
    { id: 'data', label: 'Dados & Backup', icon: Database },
    { id: 'plan', label: 'Plano Atual', icon: Crown },
  ];

  const moduleNames: Record<ModuleId, string> = {
    dashboard: 'Dashboard',
    intelligence: 'Inteligencia',
    pdv: 'PDV',
    mesas: 'Mesas',
    delivery: 'Delivery',
    'pedidos-online': 'Pedidos Online',
    'cardapio-digital': 'Cardapio Digital',
    vendas: 'Vendas',
    cozinha: 'Cozinha',
    estoque: 'Estoque',
    caixa: 'Caixa',
    produtos: 'Cardapio',
    clientes: 'Clientes',
    colaboradores: 'Colaboradores',
    fornecedores: 'Fornecedores',
    relatorios: 'Financeiro',
    diario: 'Diario',
    configuracoes: 'Configuracoes',
    seguranca: 'Seguranca',
    suporte: 'Suporte',
    manual: 'Manual',
  };

  const planLabel = currentEmpresa.plano === 'essencial'
    ? 'Essencial'
    : currentEmpresa.plano === 'profissional'
      ? 'Profissional'
      : 'Gestao';

  const licenseBadge = currentEmpresa.licenseStatus === 'active'
    ? { label: 'Ativa', className: 'bg-[var(--color-success)]/15 text-[var(--color-success)]' }
    : currentEmpresa.licenseStatus === 'trial'
      ? { label: 'Trial', className: 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]' }
      : { label: 'Suspensa', className: 'bg-[var(--color-danger)]/15 text-[var(--color-danger)]' };
  const extraModules = ((currentEmpresa as unknown as { extraModules?: string[] }).extraModules ?? []);
  const availableAddons = addonModules.filter(moduleId =>
    !getPlanModules(currentEmpresa.plano).includes(moduleId) && !extraModules.includes(moduleId)
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-700 pb-8">
      <section className="p-5 rounded-panel border border-[var(--color-border)] bg-[var(--color-elevated)] space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-control bg-accent/10 flex items-center justify-center">
              <Crown className="w-4 h-4 text-accent" />
            </div>
            <h3 className="text-sm font-semibold">Plano {planLabel}</h3>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${licenseBadge.className}`}>{licenseBadge.label}</span>
        </div>
        <p className="text-xs text-muted">{planDescriptions[currentEmpresa.plano]}</p>
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">R$ {planPricing[currentEmpresa.plano]}/mês</p>
          <p className="text-xs text-muted">Renovação: {currentEmpresa.licenseStatus}</p>
        </div>
        <div className="border-t border-[var(--color-border)] pt-4 space-y-2">
          <p className="text-xs text-muted">Módulos incluídos</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {getPlanModules(currentEmpresa.plano).map(moduleId => (
              <div key={moduleId} className="px-2.5 py-1.5 text-[11px] rounded-control border border-[var(--color-border)] flex items-center gap-2">
                <Check className="w-3 h-3 text-success" />
                <span>{moduleNames[moduleId]}</span>
              </div>
            ))}
          </div>
        </div>
        {availableAddons.length > 0 && (
          <div className="border-t border-[var(--color-border)] pt-4 space-y-2">
            <p className="text-xs text-muted">Add-ons disponíveis</p>
            <div className="space-y-2">
              {availableAddons.map(moduleId => (
                <div key={moduleId} className="p-2.5 rounded-control border border-[var(--color-border)] flex items-center justify-between gap-2">
                  <span className="text-xs">{addonLabels[moduleId]} +R$ {addonPricing[moduleId]}/mês</span>
                  <button className="h-7 px-3 rounded-control border border-[var(--color-border)] text-xs font-medium">Adicionar</button>
                </div>
              ))}
            </div>
          </div>
        )}
        {currentEmpresa.plano !== 'gestao' && (
          <div className="border-t border-[var(--color-border)] pt-4 space-y-2">
            <a
              href={`https://wa.me/${PLENA_WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 px-4 rounded-control bg-accent text-white text-xs font-medium items-center justify-center hover:bg-[var(--color-accent-hover)]"
            >
              Fazer upgrade
            </a>
            <p className="text-xs text-muted">Falar com especialista</p>
          </div>
        )}
      </section>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Configurações</h2>
          <p className="text-xs text-muted">Personalização e Gestão do Sistema</p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`px-4 h-10 rounded-control font-medium text-xs transition-all shadow flex items-center gap-2
            ${isSaving
              ? 'bg-emerald-500 text-white shadow-emerald-500/20'
              : 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white'
            }
          `}
        >
          {isSaving ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          {isSaving ? 'Salvo' : 'Salvar Alterações'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Sidebar Tabs */}
        <div className="lg:w-52 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-panel transition-all text-xs font-medium
                ${activeTab === tab.id
                  ? 'bg-[var(--color-accent)] text-white'
                  : `${isDark ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-white text-gray-400 hover:bg-gray-50 border border-gray-100 shadow-sm'}`
                }
              `}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className={`flex-1 rounded-panel border p-5 ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/10'}`}>
          {activeTab === 'store' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 border-b border-dashed border-current/10 pb-4">
                <div className="w-9 h-9 rounded-control bg-amber-500/10 flex items-center justify-center">
                  <Store className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Dados do Estabelecimento</h3>
                  <p className="text-xs text-muted">Informações que saem nos cupons e relatórios</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted ml-1">Nome Fantasia</label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-20" />
                    <input
                      value={formData.establishment.name}
                      onChange={e => setFormData({ ...formData, establishment: { ...formData.establishment, name: e.target.value } })}
                      className={`w-full h-10 pl-9 pr-4 rounded-control border outline-none text-sm focus:ring-2 focus:ring-[var(--color-accent)]/20 ${isDark ? 'bg-transparent border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted ml-1">CNPJ / Documento</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-20" />
                    <input
                      value={formData.establishment.document}
                      onChange={e => setFormData({ ...formData, establishment: { ...formData.establishment, document: e.target.value } })}
                      className={`w-full h-10 pl-9 pr-4 rounded-control border outline-none text-sm focus:ring-2 focus:ring-[var(--color-accent)]/20 ${isDark ? 'bg-transparent border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted ml-1">Telefone de Contato</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-20" />
                    <input
                      value={formData.establishment.phone}
                      onChange={e => setFormData({ ...formData, establishment: { ...formData.establishment, phone: e.target.value } })}
                      className={`w-full h-10 pl-9 pr-4 rounded-control border outline-none text-sm focus:ring-2 focus:ring-[var(--color-accent)]/20 ${isDark ? 'bg-transparent border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted ml-1">Website / Redes Sociais</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-20" />
                    <input
                      value={formData.establishment.website}
                      onChange={e => setFormData({ ...formData, establishment: { ...formData.establishment, website: e.target.value } })}
                      className={`w-full h-10 pl-9 pr-4 rounded-control border outline-none text-sm focus:ring-2 focus:ring-[var(--color-accent)]/20 ${isDark ? 'bg-transparent border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`}
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs text-muted ml-1">Endereço Completo</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-3.5 h-3.5 opacity-20" />
                    <textarea
                      rows={2}
                      value={formData.establishment.address}
                      onChange={e => setFormData({ ...formData, establishment: { ...formData.establishment, address: e.target.value } })}
                      className={`w-full px-3 py-2 pl-9 rounded-control border outline-none text-sm resize-none focus:ring-2 focus:ring-[var(--color-accent)]/20 ${isDark ? 'bg-transparent border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'printer' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 border-b border-dashed border-current/10 pb-4">
                <div className="w-9 h-9 rounded-control bg-blue-500/10 flex items-center justify-center">
                  <Printer className="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Configuração de Impressão</h3>
                  <p className="text-xs text-muted">Impressoras térmicas e cupons de venda</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className={`px-4 py-3 rounded-panel flex items-center justify-between ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-control flex items-center justify-center ${formData.thermalPrinter.enabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-500'}`}>
                      <Printer className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-medium">Habilitar Impressora Térmica</h4>
                      <p className="text-xs text-muted">Ativar conexão com hardware de impressão</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, thermalPrinter: { ...formData.thermalPrinter, enabled: !formData.thermalPrinter.enabled } })}
                    className={`w-12 h-6 rounded-full transition-all relative ${formData.thermalPrinter.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${formData.thermalPrinter.enabled ? 'left-6' : 'left-0.5'}`} />
                  </button>
                </div>

                <div className={`px-4 py-3 rounded-panel flex items-center justify-between ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-control flex items-center justify-center ${formData.thermalPrinter.autoPrint ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-500/10 text-gray-500'}`}>
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-medium">Impressão Automática</h4>
                      <p className="text-xs text-muted">Imprimir cupom ao finalizar venda no PDV</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, thermalPrinter: { ...formData.thermalPrinter, autoPrint: !formData.thermalPrinter.autoPrint } })}
                    className={`w-12 h-6 rounded-full transition-all relative ${formData.thermalPrinter.autoPrint ? 'bg-blue-500' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${formData.thermalPrinter.autoPrint ? 'left-6' : 'left-0.5'}`} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-xs text-muted ml-1">Largura do Papel</label>
                      <select
                        value={formData.thermalPrinter.paperWidth}
                        onChange={e => setFormData({ ...formData, thermalPrinter: { ...formData.thermalPrinter, paperWidth: e.target.value as any } })}
                        className={`w-full h-10 px-3 rounded-control border outline-none text-sm appearance-none ${isDark ? 'bg-transparent border-[var(--color-border)]' : 'bg-gray-50 border-gray-200'}`}
                      >
                        <option value="80mm">80mm (Padrão)</option>
                        <option value="58mm">58mm (Portátil)</option>
                      </select>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'kitchen' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 border-b border-dashed border-current/10 pb-4">
                <div className="w-9 h-9 rounded-control bg-[var(--color-accent)]/10 flex items-center justify-center">
                  <ChefHat className="w-4 h-4 text-[var(--color-accent)]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Configuração da Cozinha</h3>
                  <p className="text-xs text-muted">Defina como o KDS opera no salão e na produção.</p>
                </div>
              </div>

              <div className={`p-5 rounded-panel border space-y-4 ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-semibold">Modo do KDS</h4>
                  <p className="text-xs text-muted">
                    O modo visualização mantém o painel passivo. O modo interativo libera avanço de status por item diretamente na cozinha.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => setFormData({ ...formData, kitchenMode: 'display' })}
                    className={`text-left rounded-panel border p-4 transition-all ${
                      (formData.kitchenMode ?? 'display') === 'display'
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
                        : isDark ? 'border-[var(--color-border)] bg-[var(--color-app-base)]' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <p className="text-sm font-semibold">Modo Visualização</p>
                    <p className="text-xs text-muted mt-1">Painel passivo, sem botões de interação nos cards.</p>
                  </button>

                  <button
                    onClick={() => setFormData({ ...formData, kitchenMode: 'interactive' })}
                    className={`text-left rounded-panel border p-4 transition-all ${
                      formData.kitchenMode === 'interactive'
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
                        : isDark ? 'border-[var(--color-border)] bg-[var(--color-app-base)]' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <p className="text-sm font-semibold">Modo Interativo</p>
                    <p className="text-xs text-muted mt-1">Cozinheiro altera o status dos itens direto no KDS.</p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 border-b border-dashed border-current/10 pb-4">
                <div className="w-9 h-9 rounded-control bg-emerald-500/10 flex items-center justify-center">
                  <Database className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Dados & Segurança</h3>
                  <p className="text-xs text-muted">Backups e restauração de sistema</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-5 rounded-panel border space-y-4 flex flex-col justify-between ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="space-y-1.5">
                    <div className="w-8 h-8 rounded-control bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Download className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-semibold">Exportar Backup</h4>
                    <p className="text-xs text-muted leading-relaxed">Cria um arquivo JSON com todos os dados do sistema para segurança.</p>
                  </div>
                  <button
                    onClick={handleExport}
                    className="w-full h-10 rounded-control bg-blue-500 text-white font-medium text-xs transition-all shadow shadow-blue-500/20"
                  >
                    Baixar Backup (.json)
                  </button>
                </div>

                <div className={`p-5 rounded-panel border space-y-4 flex flex-col justify-between ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="space-y-1.5">
                    <div className="w-8 h-8 rounded-control bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <Upload className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm font-semibold">Importar Dados</h4>
                    <p className="text-xs text-muted leading-relaxed">Restaura o sistema a partir de um arquivo de backup anterior.</p>
                  </div>
                  <label className="w-full h-10 rounded-control bg-amber-500 text-white font-medium text-xs transition-all shadow shadow-amber-500/20 flex items-center justify-center cursor-pointer">
                    Selecionar Arquivo
                    <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                  </label>
                </div>

                <div className="md:col-span-2 p-5 rounded-panel border border-red-500/20 bg-red-500/5 space-y-3">
                  <div className="flex items-center gap-2 text-red-500">
                    <AlertTriangle className="w-4 h-4" />
                    <h4 className="text-sm font-semibold">Zona de Perigo</h4>
                  </div>
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-muted text-center md:text-left">
                      Esta ação irá apagar todos os dados atuais e restaurar os dados de demonstração (Mocks).
                    </p>
                    <button
                      onClick={resetToMocks}
                      className="px-5 h-10 rounded-control bg-red-500 text-white font-medium text-xs transition-all shadow shadow-red-500/20 whitespace-nowrap"
                    >
                      Reiniciar Sistema
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'plan' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 border-b border-dashed border-current/10 pb-4">
                <div className="w-9 h-9 rounded-control bg-[var(--color-accent)]/10 flex items-center justify-center">
                  <Crown className="w-4 h-4 text-[var(--color-accent)]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Plano Atual</h3>
                  <p className="text-xs text-muted">Gerencie sua assinatura e acesso aos módulos</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-5 rounded-panel border space-y-4 flex flex-col justify-between ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold capitalize">Plano {currentEmpresa.plano}</h4>
                    <p className="text-xs text-muted leading-relaxed">
                      Este é o seu plano atual. Você tem acesso a {getPlanModules(currentEmpresa.plano).length} módulos do sistema.
                    </p>
                  </div>
                  {currentEmpresa.plano !== 'gestao' && (
                    <a
                      href="https://wa.me/5512992191018"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full h-10 rounded-control bg-[var(--color-accent)] text-white font-medium text-xs transition-all shadow shadow-[var(--color-accent)]/20 flex items-center justify-center gap-2 hover:opacity-90"
                    >
                      <Crown className="w-4 h-4" />
                      Falar com a Plena
                    </a>
                  )}
                </div>

                <div className={`p-5 rounded-panel border space-y-3 ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                  <h4 className="text-sm font-semibold">Módulos Incluídos</h4>
                  <div className="flex flex-wrap gap-2">
                    {getPlanModules(currentEmpresa.plano).map(mod => (
                      <span key={mod} className={`px-2.5 py-1 text-[10px] font-medium rounded-full capitalize ${isDark ? 'bg-white/10 text-white/70' : 'bg-black/5 text-black/60'}`}>
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`px-4 py-3 rounded-panel border border-dashed flex items-center gap-3 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
        <ShieldCheck className="w-6 h-6 text-emerald-500 opacity-40 shrink-0" />
        <div>
          <p className="text-xs font-medium text-muted">Segurança de Dados</p>
          <p className="text-xs text-muted opacity-70 leading-relaxed">
            Seus dados são armazenados localmente neste navegador. Recomendamos realizar backups semanais para evitar perda de informações.
          </p>
        </div>
      </div>
    </div>
  );
};


