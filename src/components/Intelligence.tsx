import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Lightbulb,
  PackageSearch,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Insight, Order } from '../types';
import { useApp } from '../store/AppContext';
import {
  computeExpenseRatio,
  computeInsights,
  computeRevenueGrowth,
  computeTicketAverage,
  getProductSalesRanking,
  groupOrdersByDay,
  groupOrdersByDayOfWeek,
  groupOrdersByHour,
} from '../services/intelligenceService';

type Tab = 'diagnostico' | 'tendencias' | 'produtos' | 'recomendacoes';
type PeriodFilter = 'hoje' | '7d' | '30d' | '90d';
type ProductView = 'mais-vendidos' | 'em-queda' | 'sem-giro';
type InsightTypeFilter = 'todos' | Insight['type'];

const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const severityOrder: Record<Insight['severity'], number> = {
  critico: 0,
  atencao: 1,
  positivo: 2,
  info: 3,
};

const typeLabels: Record<Insight['type'], string> = {
  alerta: 'Alerta',
  oportunidade: 'Oportunidade',
  tendencia: 'Tendencia',
};

const severityIcon: Record<Insight['severity'], typeof AlertTriangle> = {
  critico: ShieldAlert,
  atencao: AlertTriangle,
  positivo: CheckCircle2,
  info: Lightbulb,
};

const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

const inSelectedPeriod = (dateValue: string, filter: PeriodFilter) => {
  const date = new Date(dateValue);
  const now = new Date();
  if (filter === 'hoje') return date.toDateString() === now.toDateString();
  const days = filter === '7d' ? 7 : filter === '30d' ? 30 : 90;
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return date >= start && date <= now;
};

const getClosedOrders = (orders: Order[]) => orders.filter(order => order.status === 'closed');

const sumOrders = (orders: Order[]) => orders.reduce((total, order) => total + order.total, 0);

const getLastDaysRevenue = (groups: Map<string, Order[]>, days: number) => {
  const now = new Date();
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now.getTime() - (days - 1 - index) * 24 * 60 * 60 * 1000);
    const key = date.toISOString().slice(0, 10);
    const revenue = (groups.get(key) || []).reduce((total, order) => total + order.total, 0);
    return { key, label: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), revenue };
  });
};

const getLastWeeksRevenue = (orders: Order[], weeks: number) => {
  const now = new Date();
  return Array.from({ length: weeks }, (_, index) => {
    const start = new Date(now.getTime() - (weeks - index) * 7 * 24 * 60 * 60 * 1000);
    const end = new Date(now.getTime() - (weeks - 1 - index) * 7 * 24 * 60 * 60 * 1000);
    const revenue = sumOrders(getClosedOrders(orders).filter(o => {
      const d = new Date(o.timestamp);
      return d >= start && d < end;
    }));
    return { key: `week-${index}`, label: `Sem. ${weeks - index}`, revenue };
  });
};

const getWeeklyVariationMap = (orders: Order[]) => {
  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const prevStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const currentMap = new Map<string, number>();
  const prevMap = new Map<string, number>();

  getClosedOrders(orders).forEach(order => {
    const date = new Date(order.timestamp);
    if (date >= weekStart && date < now) {
      order.items.forEach(item => {
        currentMap.set(item.product.name, (currentMap.get(item.product.name) || 0) + item.quantity);
      });
    } else if (date >= prevStart && date < weekStart) {
      order.items.forEach(item => {
        prevMap.set(item.product.name, (prevMap.get(item.product.name) || 0) + item.quantity);
      });
    }
  });
  return { currentMap, prevMap };
};

const getHealthScore = (orders: Order[], expensesTotal: number, deliveryCancelRate: number) => {
  const revenueGrowth = computeRevenueGrowth(orders, 'week');
  const expenseRatio = computeExpenseRatio(orders, expensesTotal);
  const monthlyGrowth = computeRevenueGrowth(orders, 'month');

  const revenueScore = Math.max(0, Math.min(40, 20 + revenueGrowth));
  const expenseScore = Math.max(0, 20 - Math.max(0, expenseRatio - 50) * 0.4);
  const cancelScore = Math.max(0, 20 - deliveryCancelRate * 2);
  const growthScore = Math.max(0, Math.min(20, 10 + monthlyGrowth / 2));

  return Math.round(revenueScore + expenseScore + cancelScore + growthScore);
};

const getScoreTone = (score: number) => {
  if (score >= 75) return 'text-success border-success/30 bg-success/10';
  if (score >= 50) return 'text-warning border-warning/30 bg-warning/10';
  return 'text-danger border-danger/30 bg-danger/10';
};

const InsightCard: React.FC<{ insight: Insight; compact?: boolean }> = ({ insight, compact = false }) => {
  const Icon = severityIcon[insight.severity];
  const tone = insight.severity === 'critico'
    ? 'text-danger bg-danger/10 border-danger/20'
    : insight.severity === 'atencao'
      ? 'text-warning bg-warning/10 border-warning/20'
      : insight.severity === 'positivo'
        ? 'text-success bg-success/10 border-success/20'
        : 'text-accent bg-accent/10 border-accent/20';

  return (
    <div className={`rounded-panel border p-4 ${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Icon className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h4 className="text-sm font-semibold leading-snug">{insight.title}</h4>
            {!compact && <p className="text-xs opacity-80 leading-relaxed mt-2">{insight.description}</p>}
          </div>
        </div>
        <span className="rounded-full bg-current/10 px-2 py-0.5 text-[10px] font-medium whitespace-nowrap">
          {typeLabels[insight.type]}
        </span>
      </div>
      {!compact && (
        <div className="flex flex-col gap-2 mt-3 border-t border-current/10 pt-3 md:flex-row md:items-center md:justify-between">
          <p className="text-xs font-medium">→ {insight.action || 'Acompanhar indicador nas proximas leituras.'}</p>
          {insight.metric && <span className="text-xs font-semibold tabular-nums">{insight.metric}</span>}
        </div>
      )}
    </div>
  );
};

export const Intelligence: React.FC = () => {
  const { orders, expenses, stockItems, collaborators, deliveryOrders, theme } = useApp();
  const isDark = theme === 'dark';
  const panelClass = isDark ? 'bg-surface border-border' : 'bg-surface-light border-border-light';
  const mutedPanelClass = isDark ? 'bg-elevated border-border' : 'bg-elevated-light border-border-light';
  const [activeTab, setActiveTab] = useState<Tab>('diagnostico');
  const [period, setPeriod] = useState<PeriodFilter>('30d');
  const [productView, setProductView] = useState<ProductView>('mais-vendidos');
  const [typeFilter, setTypeFilter] = useState<InsightTypeFilter>('todos');

  const scopedOrders = useMemo(
    () => orders.filter(order => inSelectedPeriod(order.timestamp, period)),
    [orders, period],
  );
  const scopedExpenses = useMemo(
    () => expenses.filter(expense => inSelectedPeriod(expense.timestamp, period)),
    [expenses, period],
  );
  const scopedDelivery = useMemo(
    () => deliveryOrders.filter(order => inSelectedPeriod(order.deliveredAt || order.createdAt, period)),
    [deliveryOrders, period],
  );

  const insights = useMemo(
    () => computeInsights(scopedOrders, scopedExpenses, stockItems, scopedDelivery, collaborators),
    [scopedOrders, scopedExpenses, stockItems, scopedDelivery, collaborators],
  );

  const sortedInsights = useMemo(
    () => [...insights].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]),
    [insights],
  );
  const visibleInsights = useMemo(() => sortedInsights.filter(insight => typeFilter === 'todos' || insight.type === typeFilter), [sortedInsights, typeFilter]);
  const criticalAlert = sortedInsights.find(insight => insight.type === 'alerta');
  const opportunity = sortedInsights.find(insight => insight.type === 'oportunidade');
  const trend = sortedInsights.find(insight => insight.type === 'tendencia');

  const deliveredRevenue = scopedDelivery.filter(order => order.status === 'entregue').reduce((total, order) => total + order.total, 0);
  const cancelRate = scopedDelivery.length ? (scopedDelivery.filter(order => order.status === 'cancelado').length / scopedDelivery.length) * 100 : 0;
  const expensesTotal = scopedExpenses.reduce((total, expense) => total + expense.amount, 0);
  const healthScore = getHealthScore(scopedOrders, expensesTotal, cancelRate);

  const dayGroups = useMemo(() => groupOrdersByDay(scopedOrders), [scopedOrders]);

  const timeline = useMemo(() => getLastDaysRevenue(dayGroups, 14), [dayGroups]);
  const maxTimeline = Math.max(...timeline.map(item => item.revenue), 1);
  const dayOfWeekRevenue = [...groupOrdersByDayOfWeek(scopedOrders).entries()]
    .map(([day, dayOrders]) => ({ day, revenue: sumOrders(dayOrders), count: dayOrders.length }))
    .sort((a, b) => a.day - b.day);
  const maxDayRevenue = Math.max(...dayOfWeekRevenue.map(item => item.revenue), 1);
  const hourGroups = groupOrdersByHour(scopedOrders);
  const maxHourOrders = Math.max(...[...hourGroups.values()].map(items => items.length), 1);
  const productRanking = getProductSalesRanking(scopedOrders);
  const totalProductRevenue = productRanking.reduce((total, item) => total + item.revenue, 0);
  
  const stagnantProducts = useMemo(() => productRanking
    .map(item => ({ ...item, daysStopped: Math.floor((Date.now() - new Date(item.lastSoldAt).getTime()) / (24 * 60 * 60 * 1000)) }))
    .filter(item => item.daysStopped >= 7)
    .sort((a, b) => b.daysStopped - a.daysStopped), [productRanking]);

  const fallingProducts = useMemo(() => {
    const { currentMap, prevMap } = getWeeklyVariationMap(scopedOrders);
    return productRanking
      .map(item => {
        const current = currentMap.get(item.name) || 0;
        const previous = prevMap.get(item.name) || 0;
        const variation = previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;
        return { ...item, current, previous, variation };
      })
      .filter(item => item.variation < 0)
      .sort((a, b) => a.variation - b.variation);
  }, [productRanking, scopedOrders]);

  const avgTicketTimeline = useMemo(() => timeline.map(day => {
    const dayOrders = (dayGroups.get(day.key) || []);
    return dayOrders.length ? sumOrders(dayOrders) / dayOrders.length : 0;
  }), [timeline, dayGroups]);

  const weeklyTimeline = useMemo(() => getLastWeeksRevenue(scopedOrders, 4), [scopedOrders]);
  const maxWeeklyTimeline = Math.max(...weeklyTimeline.map(item => item.revenue), 1);

  const heatmapData = useMemo(() => {
    const counts = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
    getClosedOrders(scopedOrders).forEach(order => {
      const date = new Date(order.timestamp);
      counts[date.getDay()][date.getHours()]++;
    });
    return counts;
  }, [scopedOrders]);
  const maxTicket = Math.max(...avgTicketTimeline, 1);
  const points = avgTicketTimeline
    .map((value, index) => `${(index / Math.max(avgTicketTimeline.length - 1, 1)) * 100},${100 - (value / maxTicket) * 90}`)
    .join(' ');

  return (
    <div className="space-y-5 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-accent" />
            Inteligencia Gerencial
          </h2>
          <p className="text-xs text-muted">Conselheiro estrategico calculado localmente a partir da operacao.</p>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className={`flex overflow-x-auto p-1 gap-1 rounded-panel border ${mutedPanelClass}`}>
            {(['diagnostico', 'tendencias', 'produtos', 'recomendacoes'] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap px-3 py-2 rounded-control text-xs font-medium ${activeTab === tab ? 'bg-accent text-white' : 'text-muted hover:text-current'}`}
              >
                {tab === 'diagnostico' ? 'Diagnostico' : tab === 'recomendacoes' ? 'Recomendacoes' : tab[0].toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div className={`flex p-1 gap-1 rounded-panel border ${mutedPanelClass}`}>
            {(['hoje', '7d', '30d', '90d'] as PeriodFilter[]).map(item => (
              <button
                key={item}
                onClick={() => setPeriod(item)}
                className={`px-3 py-2 rounded-control text-xs font-medium ${period === item ? 'bg-accent text-white' : 'text-muted'}`}
              >
                {item === 'hoje' ? 'Hoje' : item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'diagnostico' && (
          <motion.section key="diagnostico" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
              <div className={`rounded-panel border p-6 flex flex-col items-center justify-center text-center ${panelClass}`}>
                <div className={`w-48 h-48 rounded-full border-[10px] flex flex-col items-center justify-center ${getScoreTone(healthScore)}`}>
                  <span className="text-5xl font-semibold tabular-nums">{healthScore}</span>
                  <span className="text-xs font-medium text-muted mt-2">Saude</span>
                </div>
                <p className="text-xs text-muted leading-relaxed mt-5 max-w-xs">
                  Score ponderado por receita, despesas, cancelamentos e crescimento.
                </p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <InsightCard compact insight={criticalAlert || {
                  id: 'empty-alert',
                  type: 'alerta',
                  severity: 'positivo',
                  title: 'Nenhum alerta critico',
                  description: 'Operacao saudavel.',
                }} />
                <InsightCard compact insight={opportunity || {
                  id: 'empty-opportunity',
                  type: 'oportunidade',
                  severity: 'info',
                  title: 'Sem oportunidade urgente',
                  description: 'Continue monitorando padroes.',
                }} />
                <InsightCard compact insight={trend || {
                  id: 'empty-trend',
                  type: 'tendencia',
                  severity: 'info',
                  title: 'Tendencias em formacao',
                  description: 'Mais dados tornam a leitura melhor.',
                }} />
              </div>
            </div>

            <div className={`rounded-panel border p-5 ${panelClass}`}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold">Linha do tempo de receita</h3>
                <span className="text-xs text-muted">Ultimos 14 dias</span>
              </div>
              <div className="h-44 flex items-end gap-2">
                {timeline.map(day => (
                  <div key={day.key} className="flex-1 min-w-0 flex flex-col items-center gap-2">
                    <div className={`w-full rounded-t-control bg-accent/80 min-h-1`} style={{ height: `${Math.max(4, (day.revenue / maxTimeline) * 150)}px` }} title={`${day.label}: ${money(day.revenue)}`} />
                    <span className="text-[10px] text-muted truncate">{day.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {activeTab === 'tendencias' && (
          <motion.section key="tendencias" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className={`rounded-panel border p-5 ${panelClass}`}>
              <h3 className="text-sm font-semibold mb-5">Receita por semana (Ultimas 4s)</h3>
              <div className="h-56 flex items-end gap-2">
                {weeklyTimeline.map(week => (
                  <div key={week.key} className="flex-1 min-w-0">
                    <div className="rounded-t-control bg-success/70" style={{ height: `${Math.max(4, (week.revenue / maxWeeklyTimeline) * 200)}px` }} title={`${week.label}: ${money(week.revenue)}`} />
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-panel border p-5 ${panelClass}`}>
              <h3 className="text-sm font-semibold mb-5">Receita media por dia da semana</h3>
              <div className="space-y-3">
                {dayLabels.map((label, day) => {
                  const data = dayOfWeekRevenue.find(item => item.day === day);
                  const revenue = data?.revenue || 0;
                  return (
                    <div key={label} className="grid grid-cols-[42px_1fr_88px] items-center gap-3">
                      <span className="text-xs text-muted">{label}</span>
                      <div className={`h-3 rounded-full overflow-hidden ${isDark ? 'bg-elevated' : 'bg-elevated-light'}`} title={`${label}: ${money(revenue)}`}>
                        <div className="h-full rounded-full bg-accent" style={{ width: `${(revenue / maxDayRevenue) * 100}%` }} />
                      </div>
                      <span className="text-xs text-right tabular-nums">{money(revenue)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={`rounded-panel border p-5 xl:col-span-2 ${panelClass}`}>
              <h3 className="text-sm font-semibold mb-5">Mapa de calor por hora</h3>
              <div className="grid grid-cols-[48px_repeat(24,minmax(18px,1fr))] gap-1 text-[10px]">
                <div />
                {Array.from({ length: 24 }, (_, hour) => <div key={hour} className="text-center text-muted">{hour}</div>)}
                {dayLabels.map((label, day) => (
                  <React.Fragment key={label}>
                    <div className="text-muted py-1">{label}</div>
                    {Array.from({ length: 24 }, (_, hour) => {
                      const count = heatmapData[day][hour];
                      const intensity = count / maxHourOrders;
                      return <div key={hour} className="aspect-square rounded-sm border border-current/5" style={{ backgroundColor: `rgba(34, 197, 94, ${0.08 + intensity * 0.82})` }} title={`${label} ${hour}h - ${count} pedidos`} />;
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className={`rounded-panel border p-5 xl:col-span-2 ${panelClass}`}>
              <h3 className="text-sm font-semibold mb-5">Ticket medio ao longo do tempo</h3>
              <svg viewBox="0 0 100 110" className="w-full h-48 overflow-visible">
                <polyline points={points} fill="none" stroke="var(--color-accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              </svg>
              <p className="text-xs text-muted">Ticket medio atual: {money(computeTicketAverage(scopedOrders, 'week'))}</p>
            </div>
          </motion.section>
        )}

        {activeTab === 'produtos' && (
          <motion.section key="produtos" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className={`rounded-panel border overflow-hidden ${panelClass}`}>
            <div className="flex flex-col gap-3 px-5 py-4 border-b border-current/10 md:flex-row md:items-center md:justify-between">
              <h3 className="text-sm font-semibold">Leitura de produtos</h3>
              <div className={`flex w-fit p-1 gap-1 rounded-panel border ${mutedPanelClass}`}>
                {([
                  ['mais-vendidos', 'Mais vendidos'],
                  ['em-queda', 'Em queda'],
                  ['sem-giro', 'Sem giro'],
                ] as Array<[ProductView, string]>).map(([id, label]) => (
                  <button key={id} onClick={() => setProductView(id)} className={`px-3 py-1.5 rounded-control text-xs font-medium ${productView === id ? 'bg-accent text-white' : 'text-muted'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className={`text-xs border-b ${isDark ? 'bg-surface-light/5 border-border text-muted' : 'bg-elevated-light border-border-light text-muted-light'}`}>
                  <tr>
                    {productView === 'mais-vendidos' && ['Produto', 'Qtd vendida', 'Receita', '% do total'].map(head => <th key={head} className="px-4 py-3">{head}</th>)}
                    {productView === 'em-queda' && ['Produto', 'Esta semana', 'Semana anterior', 'Variacao'].map(head => <th key={head} className="px-4 py-3">{head}</th>)}
                    {productView === 'sem-giro' && ['Produto', 'Ultima venda', 'Dias parado', 'Acao sugerida'].map(head => <th key={head} className="px-4 py-3">{head}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-current/5">
                  {productView === 'mais-vendidos' && productRanking.map(product => (
                    <tr key={product.name}>
                      <td className="px-4 py-3 text-sm font-medium">{product.name}</td>
                      <td className="px-4 py-3 text-xs">{product.qty}</td>
                      <td className="px-4 py-3 text-xs">{money(product.revenue)}</td>
                      <td className="px-4 py-3 text-xs">{totalProductRevenue ? ((product.revenue / totalProductRevenue) * 100).toFixed(1) : 0}%</td>
                    </tr>
                  ))}
                  {productView === 'em-queda' && fallingProducts.map(product => (
                    <tr key={product.name}>
                      <td className="px-4 py-3 text-sm font-medium">{product.name}</td>
                      <td className="px-4 py-3 text-xs">{product.current}</td>
                      <td className="px-4 py-3 text-xs">{product.previous}</td>
                      <td className="px-4 py-3 text-xs text-danger">{product.variation.toFixed(1)}%</td>
                    </tr>
                  ))}
                  {productView === 'sem-giro' && stagnantProducts.map(product => (
                    <tr key={product.name}>
                      <td className="px-4 py-3 text-sm font-medium">{product.name}</td>
                      <td className="px-4 py-3 text-xs">{new Date(product.lastSoldAt).toLocaleDateString('pt-BR')}</td>
                      <td className="px-4 py-3 text-xs">{product.daysStopped}</td>
                      <td className="px-4 py-3 text-xs text-muted">Revisar preco, destaque ou disponibilidade</td>
                    </tr>
                  ))}
                  {((productView === 'mais-vendidos' && productRanking.length === 0) || (productView === 'em-queda' && fallingProducts.length === 0) || (productView === 'sem-giro' && stagnantProducts.length === 0)) && (
                    <tr>
                      <td colSpan={4} className="py-16 text-center text-xs text-muted">
                        <PackageSearch className="w-8 h-8 mx-auto mb-3 opacity-40" />
                        Sem dados suficientes para esta leitura.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.section>
        )}

        {activeTab === 'recomendacoes' && (
          <motion.section key="recomendacoes" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-4">
            <div className={`flex w-fit p-1 gap-1 rounded-panel border ${mutedPanelClass}`}>
              {([
                ['todos', 'Todos'],
                ['alerta', 'Alertas'],
                ['oportunidade', 'Oportunidades'],
                ['tendencia', 'Tendencias'],
              ] as Array<[InsightTypeFilter, string]>).map(([id, label]) => (
                <button key={id} onClick={() => setTypeFilter(id)} className={`px-3 py-1.5 rounded-control text-xs font-medium ${typeFilter === id ? 'bg-accent text-white' : 'text-muted'}`}>
                  {label}
                </button>
              ))}
            </div>

            {visibleInsights.length === 0 ? (
              <div className={`rounded-panel border p-10 text-center ${panelClass}`}>
                <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
                <h3 className="text-base font-semibold">Nenhum alerta critico. Operacao saudavel.</h3>
                <p className="text-xs text-muted mt-2">O motor nao encontrou recomendacoes relevantes para o filtro atual.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleInsights.map(insight => <InsightCard key={insight.id} insight={insight} />)}
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      <div className={`rounded-panel border p-4 flex items-start gap-3 ${mutedPanelClass}`}>
        <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <p className="text-xs text-muted leading-relaxed">
          Analise local e deterministica. Nao usa API externa, nao persiste insights e recalcula a partir dos dados operacionais filtrados.
        </p>
      </div>
    </div>
  );
};
