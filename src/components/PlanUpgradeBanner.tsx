import React from 'react';
import { Lock } from 'lucide-react';
import { ModuleId } from '../domain/saas';
import { useApp } from '../store/AppContext';

interface PlanUpgradeBannerProps {
  moduleId: ModuleId;
}

const moduleNames: Record<ModuleId, string> = {
  dashboard: 'Dashboard',
  pdv: 'PDV',
  mesas: 'Mesas',
  cozinha: 'Cozinha',
  estoque: 'Estoque',
  caixa: 'Caixa',
  produtos: 'Cardápio',
  clientes: 'Clientes',
  colaboradores: 'Colaboradores',
  fornecedores: 'Fornecedores',
  relatorios: 'Financeiro',
  configuracoes: 'Configurações',
  seguranca: 'Segurança',
  suporte: 'Suporte',
  manual: 'Manual',
};

export const PlanUpgradeBanner: React.FC<PlanUpgradeBannerProps> = ({ moduleId }) => {
  const { currentEmpresa, theme } = useApp();
  const isDark = theme === 'dark';

  return (
    <div className="h-full w-full flex items-center justify-center p-6">
      <div className={`max-w-md w-full p-5 rounded-panel border flex flex-col items-center text-center gap-6 ${isDark ? 'bg-[#18181b] border-white/10' : 'bg-white border-black/10'}`}>
        <div className={`p-4 rounded-full ${isDark ? 'bg-white/5 text-white/50' : 'bg-black/5 text-black/50'}`}>
          <Lock className="w-8 h-8" />
        </div>
        
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Módulo não disponível no seu plano</h2>
          <p className="text-xs text-muted">
            Faça upgrade para acessar o módulo de {moduleNames[moduleId] || moduleId}.
          </p>
        </div>

        <div className={`w-full p-4 rounded-lg flex justify-between items-center ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
          <span className="text-xs text-muted">Plano atual</span>
          <span className="text-sm font-semibold capitalize">{currentEmpresa.plano}</span>
        </div>

        <a 
          href="https://wa.me/5512992191018"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-10 px-4 text-xs font-medium flex items-center justify-center rounded-button bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity"
        >
          Falar com a Plena
        </a>
      </div>
    </div>
  );
};
