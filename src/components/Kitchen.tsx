import React from 'react';
import { useApp } from '../store/AppContext';
import { ChefHat, Hammer, Timer, Construction, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export const Kitchen: React.FC = () => {
  const { theme } = useApp();
  const isDark = theme === 'dark';

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-12 animate-in fade-in zoom-in duration-700">
      {/* Decorative Elements */}
      <div className="relative">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-12 border-2 border-dashed border-[#E85D75]/20 rounded-full" 
        />
        <motion.div 
          animate={{ rotate: -360 }} 
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-8 border border-dashed border-[#E85D75]/10 rounded-full" 
        />
        
        <div className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center shadow-2xl relative z-10
          ${isDark ? 'bg-[#1C1C1E] border border-[#2C2C2E]' : 'bg-white border border-gray-100'}
        `}>
          <ChefHat className="w-16 h-16 text-[#E85D75]" />
          <motion.div 
            animate={{ 
              y: [0, -4, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-2 -right-2 w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20"
          >
            <Construction className="w-5 h-5" />
          </motion.div>
        </div>
      </div>

      <div className="max-w-md space-y-4">
        <h2 className="text-4xl font-black tracking-tighter uppercase italic">Módulo de Cozinha</h2>
        <p className={`text-sm font-bold uppercase tracking-widest opacity-40 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Em Desenvolvimento Profissional
        </p>
        <div className={`h-1.5 w-32 mx-auto rounded-full overflow-hidden ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="h-full w-1/2 bg-[#E85D75]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl">
        {[
          { icon: Timer, title: "KDS em Tempo Real", desc: "Monitoramento de tempo de preparo." },
          { icon: Hammer, title: "Fila Inteligente", desc: "Priorização automática de pedidos." },
          { icon: Construction, title: "Integração Total", desc: "Conexão direta com o estoque." }
        ].map((item, idx) => (
          <div key={idx} className={`p-6 rounded-3xl border ${isDark ? 'bg-[#1C1C1E] border-[#2C2C2E]' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/5'}`}>
            <item.icon className="w-6 h-6 text-[#E85D75] mb-4 mx-auto" />
            <h4 className="text-[10px] font-black uppercase tracking-widest mb-2">{item.title}</h4>
            <p className="text-[9px] font-bold opacity-30 uppercase leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-20">Lançamento previsto para a próxima atualização</p>
    </div>
  );
};
