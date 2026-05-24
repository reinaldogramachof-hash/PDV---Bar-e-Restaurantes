import React from 'react';
import { Bike, Clock, MapPin, PackageCheck, RadioTower } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../store/AppContext';

const roadmap = [
  {
    title: 'Entrada de pedidos',
    detail: 'Fila interna para registrar solicitacoes de delivery antes da integracao externa.',
    icon: PackageCheck,
  },
  {
    title: 'Despacho e rota',
    detail: 'Controle operacional de retirada, entrega e retorno do entregador.',
    icon: MapPin,
  },
  {
    title: 'Integracoes',
    detail: 'Area preparada para conectar canais proprios e marketplaces na proxima etapa.',
    icon: RadioTower,
  },
];

const stages = [
  { label: 'Recebido', value: '0' },
  { label: 'Preparo', value: '0' },
  { label: 'Rota', value: '0' },
  { label: 'Concluido', value: '0' },
];

export const Delivery: React.FC = () => {
  const { theme } = useApp();
  const isDark = theme === 'dark';
  const panelClass = isDark ? 'bg-surface border-border' : 'bg-surface-light border-border-light';
  const elevatedClass = isDark ? 'bg-elevated border-border' : 'bg-elevated-light border-border-light';

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <section className={`rounded-panel border p-5 ${panelClass}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-panel bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <Bike className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-semibold">Delivery</h2>
                <span className="rounded-full border border-warning/20 bg-warning/10 px-3 py-1 text-xs font-medium text-warning">
                  Em desenvolvimento
                </span>
              </div>
              <p className="text-sm text-muted mt-1">
                Modulo operacional reservado para pedidos de entrega e despacho interno.
              </p>
            </div>
          </div>

          <div className={`inline-flex items-center gap-2 rounded-control border px-4 py-2 text-xs font-medium ${elevatedClass}`}>
            <Clock className="w-4 h-4 text-accent" />
            Desenvolvimento interno
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stages.map(stage => (
          <div key={stage.label} className={`rounded-panel border p-4 ${panelClass}`}>
            <p className="text-xs text-muted">{stage.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{stage.value}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {roadmap.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`rounded-panel border p-5 ${panelClass}`}
            >
              <div className="w-10 h-10 rounded-panel bg-accent/10 text-accent flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <p className="text-sm text-muted leading-relaxed mt-2">{item.detail}</p>
            </motion.div>
          );
        })}
      </section>

      <section className={`rounded-panel border p-6 ${panelClass}`}>
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h3 className="text-base font-semibold">Escopo inicial</h3>
            <p className="mt-2 max-w-2xl text-sm text-muted leading-relaxed">
              Esta area ainda nao interfere no PDV, no caixa ou na cozinha. Ela fica disponivel para validacao interna do fluxo antes de ativar vendas reais por delivery.
            </p>
          </div>
          <div className={`rounded-panel border px-5 py-4 ${elevatedClass}`}>
            <p className="text-xs text-muted">Status</p>
            <p className="mt-1 text-sm font-semibold text-accent">Preparado para evolucao</p>
          </div>
        </div>
      </section>
    </div>
  );
};
