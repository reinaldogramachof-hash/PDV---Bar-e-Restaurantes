import React, { useEffect } from 'react';
import { Lock } from 'lucide-react';
import { ModuleId, planModules } from '../domain/saas';
import { useApp } from '../store/AppContext';
import { addLocalNotification } from '../services/notificationService';

interface PlanUpgradeBannerProps {
  moduleId: ModuleId;
}

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
  produtos: 'Cardápio',
  clientes: 'Clientes',
  colaboradores: 'Colaboradores',
  fornecedores: 'Fornecedores',
  relatorios: 'Financeiro',
  diario: 'Diario',
  configuracoes: 'Configurações',
  seguranca: 'Segurança',
  suporte: 'Suporte',
  manual: 'Manual',
};

const planOrder = ['essencial', 'profissional', 'gestao'] as const;
const getMinimumPlan = (moduleId: ModuleId) =>
  planOrder.find(plan => planModules[plan].includes(moduleId)) || 'gestao';

export const PlanUpgradeBanner: React.FC<PlanUpgradeBannerProps> = ({ moduleId }) => {
  const { currentEmpresa, theme } = useApp();
  const isDark = theme === 'dark';
  const moduleName = moduleNames[moduleId] || moduleId;
  const minimumPlan = getMinimumPlan(moduleId);

  useEffect(() => {
    addLocalNotification({
      id: `sales-${currentEmpresa.id}-${moduleId}`,
      type: 'sales',
      title: `Modulo ${moduleName} disponivel no plano ${minimumPlan}`,
      body: `Voce tentou acessar ${moduleName}. Disponivel no plano ${minimumPlan}. Fale com a Plena para liberar esse recurso.`,
      action: 'Falar com a Plena',
      actionUrl: 'https://wa.me/5512992191018',
      publishedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      targetPlans: [currentEmpresa.plano],
    }, currentEmpresa.id);
  }, [currentEmpresa.id, currentEmpresa.plano, minimumPlan, moduleId, moduleName]);

  return (
    <div className="h-full w-full flex items-center justify-center p-6">
      <div className={`max-w-md w-full p-5 rounded-panel border flex flex-col items-center text-center gap-6 ${isDark ? 'bg-surface border-border' : 'bg-surface-light border-border-light'}`}>
        <div className={`p-4 rounded-full ${isDark ? 'bg-elevated text-muted' : 'bg-elevated-light text-muted'}`}>
          <Lock className="w-8 h-8" />
        </div>
        
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Módulo não disponível no seu plano</h2>
          <p className="text-xs text-muted">
            Faça upgrade para acessar o módulo de {moduleNames[moduleId] || moduleId}.
          </p>
        </div>

        <div className={`w-full p-4 rounded-lg flex justify-between items-center ${isDark ? 'bg-elevated' : 'bg-elevated-light'}`}>
          <span className="text-xs text-muted">Plano atual</span>
          <span className="text-sm font-semibold capitalize">{currentEmpresa.plano}</span>
        </div>

        <a 
          href="https://wa.me/5512992191018"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full h-10 px-4 text-xs font-medium flex items-center justify-center rounded-control bg-[var(--color-accent)] text-white hover:opacity-90 transition-opacity"
        >
          Falar com a Plena
        </a>
      </div>
    </div>
  );
};

