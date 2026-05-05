import React, { useState, useEffect } from 'react';
import { View } from '../hooks/useNavigation';
import { useApp } from '../store/AppContext';
import {
  LayoutDashboard,
  MonitorPlay,
  Table2,
  Package,
  Wallet,
  LineChart,
  Settings,
  Moon,
  Sun,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  BookOpen,
  Users,
  UserCheck,
  Truck,
  LifeBuoy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  currentView: View;
  setCurrentView: (v: View) => void;
  children: React.ReactNode;
}

const DateTimeDisplay = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).replace('.', '');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="flex items-center gap-3 animate-in fade-in duration-500">
      <div className="flex flex-col leading-none">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">{dateStr}</span>
        <span className="text-2xl font-black tracking-tighter tabular-nums">{timeStr}</span>
      </div>
    </div>
  );
};

export const Layout: React.FC<LayoutProps> = ({ currentView, setCurrentView, children }) => {
  const { theme, setTheme, cashierSession } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isDark = theme === 'dark';

  const navGroups = [
    {
      title: 'Operacional',
      items: [
        { id: 'pdv',           icon: MonitorPlay,     label: 'PDV (Balcão)' },
        { id: 'mesas',         icon: Table2,          label: 'Mesas'        },
        { id: 'caixa',         icon: Wallet,          label: 'Caixa'        },
      ]
    },
    {
      title: 'Gestão',
      items: [
        { id: 'dashboard',     icon: LayoutDashboard, label: 'Dashboard'    },
        { id: 'clientes',      icon: Users,           label: 'Clientes'     },
        { id: 'colaboradores', icon: UserCheck,       label: 'Colaboradores'},
        { id: 'fornecedores',  icon: Truck,           label: 'Fornecedores' },
        { id: 'relatorios',    icon: LineChart,       label: 'Financeiro'   },
        { id: 'estoque',       icon: Package,         label: 'Estoque'      },
      ]
    },
    {
      title: 'Sistema',
      items: [
        { id: 'manual',        icon: BookOpen,        label: 'Manual de Uso' },
        { id: 'configuracoes', icon: Settings,        label: 'Configurações' },
        { id: 'suporte',       icon: LifeBuoy,        label: 'Suporte'      },
      ]
    }
  ];

  return (
    <div className={`flex flex-col h-screen overflow-hidden font-sans ${isDark ? 'bg-[#121214] text-white' : 'bg-[#F8F8FA] text-[#1A1A2E]'}`}>
      <div className="flex flex-1 overflow-hidden w-full mx-auto">
        {/* Sidebar */}
        <aside 
          className={`flex flex-col transition-all duration-300 ease-in-out border-r ${
            isCollapsed ? 'w-20' : 'w-64'
          } ${isDark ? 'bg-[#1C1C1E] border-[#2C2C2E]' : 'bg-white border-gray-200'}`}
        >
          <div className={`flex items-center border-b min-h-[64px] ${isDark ? 'border-[#2C2C2E]' : 'border-gray-200'} ${isCollapsed ? 'justify-center p-0' : 'p-6 justify-between'}`}>
            <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="w-8 h-8 bg-[#E85D75] rounded-lg flex-shrink-0 flex items-center justify-center text-xl shadow-lg shadow-[#E85D75]/20">🍸</div>
              {!isCollapsed && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-bold text-lg tracking-tight whitespace-nowrap"
                >
                  Bar Manager Pro
                </motion.span>
              )}
            </div>
            {!isCollapsed && (
              <button 
                onClick={() => setIsCollapsed(true)}
                className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-white/5 transition-colors`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-8 scrollbar-none">
            {navGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-2">
                {!isCollapsed && (
                  <h3 className={`px-4 text-[10px] font-black uppercase tracking-[0.2em] opacity-30`}>{group.title}</h3>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const active = currentView === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setCurrentView(item.id as View)}
                        title={isCollapsed ? item.label : ''}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all rounded-xl group
                          ${active 
                            ? 'bg-[#E85D75] text-white shadow-md shadow-[#E85D75]/20' 
                            : `${isDark ? 'text-[#A1A1A6] hover:bg-white/5 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`
                          }
                          ${isCollapsed ? 'justify-center' : ''}
                        `}
                      >
                        <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${active ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`} />
                        {!isCollapsed && (
                          <span className="font-bold text-xs uppercase tracking-tight transition-opacity duration-300">{item.label}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          
          <div className="mt-auto p-6 transition-all duration-300">
            {!isCollapsed && (
              <div className="space-y-1 text-center opacity-40 hover:opacity-100 transition-all duration-500">
                <p className={`text-[8px] uppercase tracking-[0.2em] ${isDark ? 'text-[#A1A1A6]' : 'text-gray-400'}`}>Desenvolvido por</p>
                <a 
                  href="https://www.plenainformatica.com.br" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`text-[10px] font-bold block hover:text-[#E85D75] transition-colors ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                >
                  Plena Informática
                </a>
                <div className={`flex items-center justify-center gap-2 text-[8px] font-medium ${isDark ? 'text-[#636366]' : 'text-gray-400'}`}>
                  <span>V1.0</span>
                  <span className="opacity-30">|</span>
                  <span>© 2026</span>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Header */}
          <header className={`h-20 flex items-center justify-between px-8 shrink-0
            ${isDark ? 'bg-[#121214]/80 border-[#2C2C2E]' : 'bg-white/80 border-gray-200'} border-b backdrop-blur-md sticky top-0 z-10`}
          >
            <div className="flex items-center gap-6">
              {isCollapsed && (
                <button 
                  onClick={() => setIsCollapsed(false)}
                  className={`p-2.5 rounded-xl transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'}`}
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
              
              {/* Date and Time Display replaces Module Title */}
              <DateTimeDisplay />
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 pr-4 border-r border-current/5">
                {cashierSession ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Caixa Aberto</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-full border border-red-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Caixa Fechado</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className={`p-2.5 rounded-xl transition-all hover:scale-110 active:scale-95 ${isDark ? 'bg-white/5 text-yellow-400 hover:bg-white/10' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <div className={`flex items-center gap-3 px-4 py-2 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-100'}`}>
                  <div className="w-8 h-8 rounded-lg bg-[#E85D75] flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-[#E85D75]/20">R</div>
                  <div className="hidden md:block leading-none">
                    <p className="text-[10px] font-black uppercase tracking-widest">Reinaldo</p>
                    <p className="text-[8px] font-bold opacity-30 uppercase tracking-[0.2em] mt-0.5">Administrador</p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* View Content */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
