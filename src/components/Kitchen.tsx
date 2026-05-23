import React from 'react';
import { useApp } from '../store/AppContext';
import { ChefHat, Construction, Hammer, Timer } from 'lucide-react';

export const Kitchen: React.FC = () => {
  const { theme } = useApp();
  const isDark = theme === 'dark';
  const panelClass = isDark ? 'bg-surface border-border' : 'bg-surface-light border-border-light';
  const subtlePanelClass = isDark ? 'bg-elevated border-border' : 'bg-elevated-light border-border-light';

  const features = [
    { icon: Timer, title: 'KDS em tempo real', desc: 'Monitoramento do tempo de preparo por pedido.' },
    { icon: Hammer, title: 'Fila inteligente', desc: 'Priorização operacional por mesa, horário e status.' },
    { icon: Construction, title: 'Integração total', desc: 'Conexão planejada com estoque e ficha técnica.' },
  ];

  return (
    <div className="h-full flex items-center justify-center p-6 animate-in fade-in duration-500">
      <section className={`w-full max-w-4xl rounded-panel border ${panelClass}`}>
        <div className="p-8 md:p-10 border-b border-current/5">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-14 h-14 rounded-panel bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <ChefHat className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-warning/10 text-warning text-xs font-medium">
                <Construction className="w-3.5 h-3.5" />
                Em desenvolvimento
              </div>
              <h2 className="text-2xl font-semibold">Módulo de cozinha</h2>
              <p className="text-sm text-muted max-w-2xl">
                A base visual já está preparada para uma tela KDS profissional, com foco em preparo, status e baixa fricção entre salão e cozinha.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
          {features.map(item => (
            <div key={item.title} className={`p-5 rounded-panel border ${subtlePanelClass}`}>
              <item.icon className="w-5 h-5 text-accent mb-4" />
              <h3 className="text-sm font-semibold mb-2">{item.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="px-6 pb-6">
          <p className="text-xs text-muted">Lançamento previsto para uma próxima etapa operacional.</p>
        </div>
      </section>
    </div>
  );
};
