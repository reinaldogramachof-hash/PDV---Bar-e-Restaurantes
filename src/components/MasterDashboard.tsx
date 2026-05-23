import React from 'react';
import { AlertTriangle, Building2, CalendarDays, Filter, LineChart, MoreHorizontal, ReceiptText, ShoppingBag, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../store/AppContext';

const companies = [
  { name: 'Soberano Grill', plan: 'Gestao', status: 'Ativa', statusTone: 'text-success', lastActivity: 'Hoje, 14:22', action: 'Ver' },
  { name: 'Cantina Brasil', plan: 'Profissional', status: 'Renovar', statusTone: 'text-warning', lastActivity: 'Ontem, 18:10', action: 'Contato' },
  { name: 'Bistro Avenida', plan: 'Essencial', status: 'Suspensa', statusTone: 'text-danger', lastActivity: '3 dias atras', action: 'Ver' },
  { name: 'Villa Massas', plan: 'Profissional', status: 'Ativa', statusTone: 'text-success', lastActivity: 'Hoje, 09:44', action: 'Ver' },
];

const alerts = [
  { company: 'Soberano Grill', detail: 'Vence em 8 dias' },
  { company: 'Cantina Brasil', detail: 'Vence em 14 dias' },
  { company: 'Villa Massas', detail: 'Vence em 26 dias' },
];

export const MasterDashboard: React.FC = () => {
  const { theme } = useApp();
  const isDark = theme === 'dark';
  const panelClass = isDark ? 'bg-surface border-border' : 'bg-surface-light border-border-light';
  const elevatedClass = isDark ? 'bg-elevated border-border' : 'bg-elevated-light border-border-light';

  const kpis = [
    { label: 'Receita Total', value: 'R$ 248.900', detail: '+12,4% vs mes anterior', icon: ReceiptText, tone: 'text-success', bg: 'bg-success/10' },
    { label: 'Pedidos Hoje', value: '1.284', detail: 'Operacao em alta', icon: ShoppingBag, tone: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Empresas Ativas', value: '37', detail: '4 novas no periodo', icon: Building2, tone: 'text-success', bg: 'bg-success/10' },
    { label: 'Licencas a Vencer', value: '6', detail: 'Proximos 30 dias', icon: AlertTriangle, tone: 'text-warning', bg: 'bg-warning/10' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold leading-none">Painel Master</h2>
          <p className="text-sm text-muted">Visao cross-empresa para operacao comercial da Plena</p>
        </div>
        <div className="grid grid-cols-2 md:flex md:items-center gap-3">
          <FilterControl icon={CalendarDays} label="Periodo" value="Mes" className={elevatedClass} />
          <FilterControl icon={Building2} label="Empresa" value="Todas" className={elevatedClass} />
          <FilterControl icon={TrendingUp} label="Plano" value="Todos" className={elevatedClass} />
          <button className="h-10 px-4 rounded-control bg-accent text-white text-xs font-medium hover:bg-accent-hover">
            Filtrar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <motion.section
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className={`p-5 rounded-panel border ${panelClass}`}
          >
            <div className="flex items-start justify-between mb-5">
              <div className={`w-10 h-10 rounded-panel flex items-center justify-center ${kpi.bg}`}>
                <kpi.icon className={`w-5 h-5 ${kpi.tone}`} />
              </div>
              <span className={`text-xs font-medium ${kpi.tone}`}>{kpi.detail}</span>
            </div>
            <p className="text-xs font-medium text-muted mb-2">{kpi.label}</p>
            <p className="text-2xl font-semibold">{kpi.value}</p>
          </motion.section>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-5">
        <section className={`p-5 rounded-section border ${panelClass}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold">Crescimento MoM por empresa</h3>
              <p className="text-xs text-muted mt-1">Receita mensal agregada das contas clientes</p>
            </div>
            <div className="w-9 h-9 rounded-panel bg-accent/10 text-accent flex items-center justify-center">
              <LineChart className="w-4 h-4" />
            </div>
          </div>
          <div className={`relative h-72 rounded-panel border overflow-hidden ${elevatedClass}`}>
            <div className="absolute inset-6 grid grid-rows-4">
              {[0, 1, 2, 3].map(row => (
                <div key={row} className="border-t border-border/80" />
              ))}
            </div>
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 680 280" preserveAspectRatio="none">
              <polyline points="30,220 130,198 230,154 330,170 430,114 530,88 650,58" fill="none" stroke="#E07B4A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="30,238 130,224 230,204 330,176 430,158 530,128 650,118" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="650" cy="58" r="7" fill="#E07B4A" />
              <circle cx="650" cy="118" r="6" fill="#22C55E" />
            </svg>
            <div className="absolute bottom-5 left-6 right-6 flex justify-between text-xs text-muted">
              <span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span><span>Jun</span>
            </div>
          </div>
        </section>

        <section className={`p-5 rounded-section border ${panelClass}`}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold">Alertas de licenca</h3>
            <span className="text-xs font-medium text-warning">6 abertas</span>
          </div>
          <div className="space-y-3">
            {alerts.map(alert => (
              <div key={alert.company} className={`p-4 rounded-panel border ${elevatedClass}`}>
                <p className="text-sm font-semibold text-warning">{alert.company}</p>
                <p className="text-xs text-muted mt-1">{alert.detail}</p>
              </div>
            ))}
          </div>
          <button className="mt-5 h-10 w-full rounded-control bg-accent px-4 text-xs font-medium text-white hover:bg-accent-hover">
            Abrir renovacoes
          </button>
        </section>
      </div>

      <section className={`p-5 rounded-section border ${panelClass}`}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold">Empresas clientes</h3>
            <p className="text-xs text-muted mt-1">Status operacional, plano contratado e ultima atividade</p>
          </div>
          <button className={`h-10 px-4 rounded-control border text-xs font-medium ${elevatedClass}`}>
            Exportar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className={`border-b text-xs font-medium text-muted ${isDark ? 'border-border' : 'border-border-light'}`}>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Plano</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Ultima atividade</th>
                <th className="px-4 py-3 text-right">Acao</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-border' : 'divide-border-light'}`}>
              {companies.map(company => (
                <tr key={company.name} className={isDark ? 'hover:bg-elevated' : 'hover:bg-elevated-light'}>
                  <td className="px-4 py-3 font-medium">{company.name}</td>
                  <td className="px-4 py-3 text-muted">{company.plan}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${company.statusTone}`}>{company.status}</span>
                  </td>
                  <td className="px-4 py-3 text-muted">{company.lastActivity}</td>
                  <td className="px-4 py-3 text-right">
                    <button className={`inline-flex h-8 items-center gap-2 rounded-control border px-3 text-xs font-medium ${company.action === 'Contato' ? 'bg-accent text-white border-accent' : elevatedClass}`}>
                      {company.action}
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

type FilterControlProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  className: string;
};

const FilterControl: React.FC<FilterControlProps> = ({ icon: Icon, label, value, className }) => (
  <button className={`h-10 min-w-36 rounded-control border px-3 text-left ${className}`}>
    <span className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-muted" />
      <span className="text-xs font-medium text-muted">{label}: <span className="text-text">{value}</span></span>
    </span>
  </button>
);
