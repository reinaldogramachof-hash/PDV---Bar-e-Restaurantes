import React from 'react';
import { useApp } from '../store/AppContext';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Package,
  ShoppingBag,
  Table as TableIcon,
  Trophy,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'motion/react';

export const Dashboard: React.FC = () => {
  const { orders, tables, products, theme } = useApp();
  const isDark = theme === 'dark';

  const closedOrders = orders.filter(o => o.status === 'closed');
  const salesToday = closedOrders.reduce((acc, o) => acc + o.total, 0);
  const totalOrders = closedOrders.length;
  const avgTicket = totalOrders > 0 ? salesToday / totalOrders : 0;
  const occupiedTables = tables.filter(t => t.status !== 'livre').length;

  const categorySales = closedOrders.flatMap(o => o.items).reduce<Record<string, number>>((acc, item) => {
    acc[item.product.category] = (acc[item.product.category] || 0) + item.price * item.quantity;
    return acc;
  }, {});

  const recentOrders = [...orders].reverse().slice(0, 6);

  const productSales = closedOrders.flatMap(o => o.items).reduce((acc, item) => {
    if (!acc[item.product.id]) {
      acc[item.product.id] = { name: item.product.name, qty: 0, category: item.product.category };
    }
    acc[item.product.id].qty += item.quantity;
    return acc;
  }, {} as Record<string, { name: string; qty: number; category: string }>);

  const topProducts = (Object.values(productSales) as Array<{ name: string; qty: number; category: string }>)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const productsWithoutRecipe = products.filter(p => !p.recipe || p.recipe.length === 0).slice(0, 5);

  const kpis = [
    { label: 'Vendas hoje', value: `R$ ${salesToday.toFixed(2)}`, icon: TrendingUp, tone: 'text-success', bg: 'bg-success/10', detail: '+12.5%' },
    { label: 'Ticket médio', value: `R$ ${avgTicket.toFixed(2)}`, icon: ShoppingBag, tone: 'text-blue-500', bg: 'bg-blue-500/10', detail: '+3.2%' },
    { label: 'Pedidos', value: totalOrders.toString(), icon: Clock, tone: 'text-accent', bg: 'bg-accent/10', detail: '+5.4%' },
    { label: 'Mesas ocupadas', value: occupiedTables.toString(), icon: TableIcon, tone: 'text-warning', bg: 'bg-warning/10', detail: `${occupiedTables}/${tables.length}` },
  ];

  const panelClass = isDark ? 'bg-surface border-border' : 'bg-surface-light border-border-light';
  const subtlePanelClass = isDark ? 'bg-elevated border-border' : 'bg-elevated-light border-border-light';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold leading-none">Visão Geral</h2>
          <p className="text-sm text-muted">Resumo operacional e métricas de desempenho</p>
        </div>
        <span className={`px-3 py-2 rounded-control text-xs font-medium border ${subtlePanelClass}`}>
          {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className={`p-5 rounded-panel border ${panelClass}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-panel ${kpi.bg}`}>
                <kpi.icon className={`w-5 h-5 ${kpi.tone}`} />
              </div>
              <span className={`text-xs font-medium ${kpi.label === 'Mesas ocupadas' ? 'text-muted' : 'text-success'}`}>{kpi.detail}</span>
            </div>
            <h3 className="text-xs font-medium text-muted mb-1">{kpi.label}</h3>
            <p className="text-2xl font-semibold">{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <section className={`p-5 rounded-panel border ${panelClass}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-sm">Vendas por categoria</h3>
            <div className="w-8 h-8 rounded-panel bg-accent/10 text-accent flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-5">
            {(Object.entries(categorySales) as Array<[string, number]>)
              .sort((a, b) => b[1] - a[1])
              .map(([category, value]) => {
                const pct = salesToday > 0 ? (value / salesToday) * 100 : 0;
                return (
                  <div key={category}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-muted">{category}</span>
                      <span className="font-semibold">R$ {value.toFixed(2)}</span>
                    </div>
                    <div className={`h-2 w-full rounded-full overflow-hidden ${isDark ? 'bg-elevated' : 'bg-elevated-light'}`}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="h-full bg-accent"
                      />
                    </div>
                  </div>
                );
              })}
            {Object.keys(categorySales).length === 0 && (
              <EmptyState icon={ShoppingBag} title="Sem vendas hoje" description="As categorias aparecem quando pedidos forem fechados." />
            )}
          </div>
        </section>

        <section className={`p-5 rounded-panel border lg:col-span-2 ${panelClass}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-sm">Últimos pedidos</h3>
            <button className={`px-3 py-2 rounded-control text-sm font-medium border transition-colors ${subtlePanelClass}`}>
              Exportar
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className={`text-xs font-medium text-muted border-b ${isDark ? 'border-border' : 'border-border-light'}`}>
                  <th className="px-3 py-3">ID</th>
                  <th className="px-3 py-3">Hora</th>
                  <th className="px-3 py-3">Modo</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-border' : 'divide-border-light'}`}>
                {recentOrders.map(order => (
                  <tr key={order.id} className={isDark ? 'hover:bg-elevated' : 'hover:bg-elevated-light'}>
                    <td className="px-3 py-3 text-muted">#{order.id.slice(-6)}</td>
                    <td className="px-3 py-3 font-medium">
                      {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.mode === 'mesa' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
                        {order.mode}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-2 text-success">
                        <span className="w-1.5 h-1.5 rounded-full bg-success" />
                        <span className="text-xs font-medium">Concluído</span>
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold">R$ {order.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentOrders.length === 0 && (
              <div className="py-12">
                <EmptyState icon={Clock} title="Nenhum pedido recente" description="Pedidos abertos e fechados serão listados aqui." />
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className={`p-5 rounded-panel border ${panelClass}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-sm">Mais pedidos</h3>
            <div className="w-8 h-8 rounded-panel bg-warning/10 text-warning flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div key={product.name} className={`flex items-center justify-between p-3 rounded-panel ${isDark ? 'bg-elevated' : 'bg-elevated-light'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-panel flex items-center justify-center ${isDark ? 'bg-surface' : 'bg-surface-light'}`}>
                    <Package className="w-4 h-4 text-muted" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted">{product.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-accent">{product.qty}</p>
                  <p className="text-xs text-muted">#{index + 1}</p>
                </div>
              </div>
            ))}
            {topProducts.length === 0 && (
              <EmptyState icon={Trophy} title="Sem ranking ainda" description="O ranking aparece após as primeiras vendas." />
            )}
          </div>
        </section>

        <section className={`p-5 rounded-panel border ${panelClass}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-sm">Ficha técnica</h3>
            <div className={`w-8 h-8 rounded-panel flex items-center justify-center ${productsWithoutRecipe.length > 0 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
              {productsWithoutRecipe.length > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            </div>
          </div>
          <div className="space-y-3">
            {productsWithoutRecipe.length > 0 ? (
              productsWithoutRecipe.map(product => (
                <div key={product.id} className={`flex items-center justify-between p-3 rounded-panel border-l-2 border-warning ${isDark ? 'bg-elevated' : 'bg-elevated-light'}`}>
                  <div>
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted">Produto sem insumos vinculados</p>
                  </div>
                  <span className="text-xs font-medium text-warning">Revisar</span>
                </div>
              ))
            ) : (
              <EmptyState icon={CheckCircle2} title="Tudo em dia" description="Os produtos cadastrados possuem ficha técnica vinculada." />
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

type EmptyStateProps = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
};

const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-8 text-center text-muted">
    <Icon className="w-10 h-10 mb-3" />
    <p className="text-sm font-medium text-current">{title}</p>
    <p className="text-xs mt-1 max-w-xs">{description}</p>
  </div>
);
