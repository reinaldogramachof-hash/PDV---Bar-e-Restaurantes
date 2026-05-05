import React from 'react';
import { useApp } from '../store/AppContext';
import { 
  BookOpen, 
  MonitorPlay, 
  Wallet, 
  Package, 
  LineChart, 
  ChevronRight,
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export const UserManual: React.FC = () => {
  const { theme } = useApp();
  const isDark = theme === 'dark';

  const sections = [
    {
      id: 'pdv',
      title: 'PDV & Mesas',
      icon: MonitorPlay,
      color: '#E85D75',
      content: [
        'Clique em uma mesa livre para iniciar uma comanda.',
        'Selecione produtos do cardápio para adicionar ao pedido.',
        'Use o "Venda Rápida" para pedidos de balcão sem mesa fixa.',
        'Para fechar, clique em "Fechar Conta" e selecione as formas de pagamento.'
      ]
    },
    {
      id: 'caixa',
      title: 'Gestão de Caixa',
      icon: Wallet,
      color: '#F39C12',
      content: [
        'Abra o caixa no início do expediente com o valor de fundo.',
        'Todas as vendas finalizadas entram automaticamente no saldo.',
        'Realize sangrias (retiradas) ou suprimentos conforme necessário.',
        'O fechamento detalha o saldo esperado vs. saldo informado.'
      ]
    },
    {
      id: 'estoque',
      title: 'Controle de Estoque',
      icon: Package,
      color: '#3498DB',
      content: [
        'Cadastre produtos com controle de estoque ativo.',
        'O sistema abate automaticamente as quantidades a cada venda.',
        'Receba alertas visuais quando o estoque estiver baixo.',
        'Ajuste o saldo manualmente para correções ou perdas.'
      ]
    },
    {
      id: 'financeiro',
      title: 'Financeiro',
      icon: LineChart,
      color: '#27AE60',
      content: [
        'Visualize o faturamento bruto e líquido em tempo real.',
        'Acompanhe o ticket médio e performance de vendas.',
        'Filtre dados por períodos (dia, semana, mês).',
        'Relatórios baseados apenas em vendas com pagamento confirmado.'
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dashed pb-8 border-current/20">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase">Manual do Usuário</h2>
          <p className={`mt-2 ${isDark ? 'text-[#A1A1A6]' : 'text-gray-500'}`}>
            Guia rápido para operação do Bar Manager Pro V1.0
          </p>
        </div>
        <div className={`flex items-center gap-2 p-4 rounded-2xl border ${isDark ? 'bg-[#1C1C1E] border-[#2C2C2E]' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Suporte Técnico</p>
            <p className="text-sm font-bold">Plena Informática</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div 
              key={section.id}
              className={`group p-6 rounded-3xl border transition-all duration-500 hover:scale-[1.02]
                ${isDark ? 'bg-[#1C1C1E] border-[#2C2C2E] hover:border-[#E85D75]/50' : 'bg-white border-gray-200 shadow-sm hover:shadow-xl hover:shadow-[#E85D75]/5'}`}
            >
              <div className="flex items-center gap-4 mb-6">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:rotate-12"
                  style={{ backgroundColor: section.color }}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold uppercase tracking-tight">{section.title}</h3>
              </div>
              
              <ul className="space-y-3">
                {section.content.map((item, idx) => (
                  <li key={idx} className="flex gap-3 text-sm leading-relaxed opacity-80">
                    <ChevronRight className="w-4 h-4 mt-1 shrink-0 text-[#E85D75]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Footer Alert */}
      <div className={`p-8 rounded-3xl border-2 border-dashed flex flex-col md:flex-row items-center gap-6 text-center md:text-left
        ${isDark ? 'bg-amber-500/5 border-amber-500/20 text-amber-200/80' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
        <AlertTriangle className="w-12 h-12 shrink-0 animate-pulse text-amber-500" />
        <div>
          <h4 className="font-bold text-lg uppercase mb-1">Dica de Segurança</h4>
          <p className="text-sm">
            Nunca compartilhe sua senha de administrador. O fechamento de caixa é uma etapa crítica e deve ser auditada regularmente para garantir a integridade dos dados financeiros.
          </p>
        </div>
      </div>

      <div className="pt-8 text-center border-t border-dashed border-current/10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-bold uppercase tracking-widest opacity-60">Sistema Atualizado e Seguro</span>
        </div>
        <p className="text-[10px] opacity-40 uppercase tracking-widest">© 2026 Bar Manager Pro | Plena Informática</p>
      </div>
    </div>
  );
};
