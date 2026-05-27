import React, { useState } from 'react';
import { useApp } from '../store/AppContext';
import { 
  BookOpen, MonitorPlay, LayoutDashboard, Utensils, 
  LineChart, Settings, Database, Lightbulb, 
  CheckCircle2, Star, Target, TrendingUp, UserCheck,
  ChevronRight, Info, AlertTriangle, ShieldCheck,
  Circle, CheckCircle, Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const UserManual: React.FC = () => {
  const { theme, readGuides, toggleGuideRead } = useApp();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'guides' | 'tips'>('guides');

  const moduleGuides = [
    {
      id: 'guide_pdv',
      title: 'PDV & Balcão',
      icon: MonitorPlay,
      color: 'rose',
      description: 'O coração da sua operação. Agilidade é a palavra-chave.',
      steps: [
        { t: 'Abertura Rápida', d: 'Inicie vendas em segundos clicando diretamente nos itens do cardápio.' },
        { t: 'Gestão de Pagamentos', d: 'Suporta múltiplas formas de pagamento em uma única conta (Split).' },
        { t: 'Impressão de Comanda', d: 'Envie o pedido para a cozinha ou balcão automaticamente após confirmar.' }
      ]
    },
    {
      id: 'guide_dashboard',
      title: 'Dashboard BI',
      icon: LayoutDashboard,
      color: 'blue',
      description: 'Sua bússola estratégica. Decisões baseadas em dados reais.',
      steps: [
        { t: 'Ticket Médio', d: 'Acompanhe quanto cada cliente gasta em média no seu estabelecimento.' },
        { t: 'Vendas por Hora', d: 'Identifique seus horários de pico e otimize sua equipe.' },
        { t: 'Produtos Top 10', d: 'Saiba quais itens mais saem e quais precisam de promoção.' }
      ]
    },
    {
      id: 'guide_cardapio',
      title: 'Cardápio Digital',
      icon: Utensils,
      color: 'amber',
      description: 'Organize sua oferta de forma atraente e lucrativa.',
      steps: [
        { t: 'Categorização', d: 'Separe itens por tipos (Bebidas, Pratos, Entradas) para facilitar a busca.' },
        { t: 'Ficha Técnica', d: 'Vincule ingredientes ao produto para controle automático de estoque.' },
        { t: 'Precificação', d: 'Ajuste preços rapidamente conforme a flutuação dos custos de insumos.' }
      ]
    },
    {
      id: 'guide_financeiro',
      title: 'Gestão Financeira',
      icon: LineChart,
      color: 'emerald',
      description: 'Saúde financeira em dia. Controle cada centavo.',
      steps: [
        { t: 'Fluxo de Caixa', d: 'Registre todas as entradas e saídas (sangrias e suprimentos).' },
        { t: 'Relatórios Mensais', d: 'Compare o desempenho de diferentes meses para prever tendências.' },
        { t: 'Controle de Despesas', d: 'Categorize gastos fixos e variáveis para calcular o lucro líquido real.' }
      ]
    },
    {
      id: 'guide_config',
      title: 'Backup & Segurança',
      icon: Settings,
      color: 'slate',
      description: 'Proteja o patrimônio de dados da sua empresa.',
      steps: [
        { t: 'Dados do Cupom', d: 'Personalize o cabeçalho do recibo com CNPJ, Endereço e Telefone.' },
        { t: 'Backup Semanal', d: 'Exporte o arquivo JSON toda semana e guarde em local seguro (nuvem/HD).' },
        { t: 'Restauração', d: 'Em caso de troca de computador, importe o backup para continuar de onde parou.' }
      ]
    }
  ];

  const proTips = [
    { id: 'tip_1', title: 'Engenharia de Cardápio', icon: Target, content: 'Posicione os produtos com maior margem de lucro em locais de destaque visual no sistema. Use o Dashboard para identificar os "Estrelas" (muita saída, margem alta).' },
    { id: 'tip_2', title: 'Controle de CMV', icon: TrendingUp, content: 'Mantenha o seu Custo de Mercadoria Vendida (CMV) entre 25% e 35%. Use a ficha técnica rigorosamente para que o estoque reflita a realidade.' },
    { id: 'tip_3', title: 'Ticket Médio', icon: Star, content: 'Treine sua equipe para oferecer acompanhamentos ou bebidas premium. Um aumento de 10% no ticket médio pode representar até 30% de aumento no lucro líquido.' },
    { id: 'tip_4', title: 'Fidelização', icon: UserCheck, content: 'Use o cadastro de clientes para registrar preferências e datas especiais. Um cliente que se sente reconhecido volta 3x mais.' }
  ];

  const totalItems = moduleGuides.length + proTips.length;
  const completedItems = readGuides.length;
  const progressPercent = Math.round((completedItems / totalItems) * 100);

  return (
    <div className="space-y-5 animate-in fade-in duration-700 pb-10">
      {/* Header */}
      <div className={`p-5 rounded-panel border flex flex-col md:flex-row items-center justify-between gap-5
        ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-100 shadow-sm'}`}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-panel bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-[var(--color-accent)]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Manual de Alta Performance</h1>
            <p className="text-xs text-muted">Domine as ferramentas do Gestão Gastro e transforme sua gestão</p>
          </div>
        </div>
        <div className="w-full md:w-64 space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">Progresso</span>
            <span className="text-sm font-semibold text-[var(--color-accent)]">{progressPercent}%</span>
          </div>
          <div className={`h-2 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className="h-full bg-[var(--color-accent)] rounded-full"
            />
          </div>
          <p className="text-xs text-muted">{completedItems} de {totalItems} tópicos concluídos</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 rounded-panel bg-current/5 w-fit">
        <button
          onClick={() => setActiveTab('guides')}
          className={`px-4 h-8 rounded-control font-medium text-xs transition-all
            ${activeTab === 'guides' ? 'bg-[var(--color-accent)] text-white' : 'opacity-40 hover:opacity-100'}`}
        >
          Módulos Contratados
        </button>
        <button
          onClick={() => setActiveTab('tips')}
          className={`px-4 h-8 rounded-control font-medium text-xs transition-all
            ${activeTab === 'tips' ? 'bg-[var(--color-accent)] text-white' : 'opacity-40 hover:opacity-100'}`}
        >
          Dicas Profissionais
        </button>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {activeTab === 'guides' ? (
          <motion.div
            key="guides"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {moduleGuides.map((guide) => {
              const isRead = readGuides.includes(guide.id);
              const colorClass =
                guide.color === 'rose' ? 'bg-rose-500' :
                guide.color === 'blue' ? 'bg-blue-500' :
                guide.color === 'amber' ? 'bg-amber-500' :
                guide.color === 'emerald' ? 'bg-emerald-500' : 'bg-slate-500';

              return (
                <div
                  key={guide.id}
                  className={`p-5 rounded-panel border transition-all group
                    ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-100 shadow-sm'}
                    ${isRead ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-9 h-9 rounded-control flex items-center justify-center text-white ${colorClass}`}>
                      <guide.icon className="w-4 h-4" />
                    </div>
                    <button
                      onClick={() => toggleGuideRead(guide.id)}
                      className={`flex items-center gap-1.5 px-3 h-7 rounded-control text-xs font-medium transition-all
                        ${isRead
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : `${isDark ? 'bg-white/5 text-white/40 hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)]' : 'bg-gray-100 text-gray-400 hover:bg-[var(--color-accent)]/10 hover:text-[var(--color-accent)]'}`
                        }`}
                    >
                      {isRead ? <CheckCircle className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                      {isRead ? 'Lido' : 'Marcar como Lido'}
                    </button>
                  </div>

                  <h3 className="text-sm font-semibold mb-1">{guide.title}</h3>
                  <p className="text-xs text-muted mb-4">{guide.description}</p>

                  <div className="space-y-3 pt-4 border-t border-dashed border-current/10">
                    {guide.steps.map((step, sIdx) => (
                      <div key={sIdx} className="flex gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 mt-0.5
                          ${isRead ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'}`}>
                          {sIdx + 1}
                        </div>
                        <div>
                          <p className="text-xs font-semibold">{step.t}</p>
                          <p className="text-xs text-muted leading-relaxed">{step.d}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="tips"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {proTips.map((tip) => {
              const isRead = readGuides.includes(tip.id);
              return (
                <div
                  key={tip.id}
                  className={`p-5 rounded-panel border flex flex-col justify-between transition-all
                    ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-100 shadow-sm'}
                    ${isRead ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-9 h-9 rounded-control bg-[var(--color-accent)]/10 flex items-center justify-center shrink-0">
                      <tip.icon className="w-4 h-4 text-[var(--color-accent)]" />
                    </div>
                    <button
                      onClick={() => toggleGuideRead(tip.id)}
                      className={`p-1.5 rounded-control transition-all
                        ${isRead ? 'text-emerald-500 bg-emerald-500/10' : 'text-muted hover:text-[var(--color-accent)]'}`}
                    >
                      {isRead ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                    </button>
                  </div>
                  <h3 className="text-sm font-semibold mb-2">{tip.title}</h3>
                  <p className="text-xs text-muted leading-relaxed flex-1">"{tip.content}"</p>
                  <div className="pt-4 mt-4 border-t border-dashed border-current/10 flex items-center gap-2 text-emerald-500 text-xs font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" /> Estratégia Recomendada
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA Footer */}
      <div className={`p-5 rounded-panel border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 flex items-center gap-4`}>
        <div className="w-10 h-10 bg-[var(--color-accent)] rounded-panel flex items-center justify-center text-white shrink-0">
          <Lightbulb className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Pronto para o Próximo Nível?</h3>
          <p className="text-xs text-muted mt-0.5">
            O domínio operacional é o primeiro passo para a expansão. Use o suporte da Plena Informática para qualquer dúvida técnica.
          </p>
        </div>
      </div>
    </div>
  );
};
