import React, { useEffect, useState } from 'react';
import { View } from '../hooks/useNavigation';
import { useApp } from '../store/AppContext';
import {
  BookOpen,
  Bike,
  ChefHat,
  ChevronLeft,
  Crown,
  Headset,
  LineChart,
  LayoutDashboard,
  Menu,
  Monitor,
  MonitorPlay,
  Moon,
  Package,
  Settings,
  Shield,
  Sun,
  Table2,
  Truck,
  UserCheck,
  Users,
  Utensils,
  Wallet,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { APP_NAME, canAccessModule, ModuleId } from '../domain/saas';
import { LicenseCheckResult } from '../services/licenseService';
import { LicenseBanner } from './LicenseBanner';

interface LayoutProps {
  currentView: View;
  setCurrentView: (v: View) => void;
  license?: LicenseCheckResult;
  children: React.ReactNode;
}

const DateTimeDisplay = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).replace('.', '');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="hidden sm:flex flex-col leading-none text-right">
      <span className="text-xs font-medium text-muted">{dateStr}</span>
      <span className="text-sm font-semibold tabular-nums">{timeStr}</span>
    </div>
  );
};

const navGroups = [
  {
    title: 'Operacional',
    items: [
      { id: 'pdv', icon: MonitorPlay, label: 'PDV (Balcão)' },
      { id: 'mesas', icon: Table2, label: 'Mesas' },
      { id: 'delivery', icon: Bike, label: 'Delivery' },
      { id: 'cozinha', icon: ChefHat, label: 'Cozinha' },
      { id: 'caixa', icon: Wallet, label: 'Caixa' },
    ],
  },
  {
    title: 'Gestão',
    items: [
      { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { id: 'clientes', icon: Users, label: 'Clientes' },
      { id: 'colaboradores', icon: UserCheck, label: 'Colaboradores' },
      { id: 'fornecedores', icon: Truck, label: 'Fornecedores' },
      { id: 'produtos', icon: BookOpen, label: 'Cardápio' },
      { id: 'relatorios', icon: LineChart, label: 'Financeiro' },
      { id: 'estoque', icon: Package, label: 'Estoque' },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { id: 'manual', icon: BookOpen, label: 'Manual de Uso' },
      { id: 'seguranca', icon: Shield, label: 'Segurança' },
      { id: 'configuracoes', icon: Settings, label: 'Configurações' },
      { id: 'suporte', icon: Headset, label: 'Suporte' },
      { id: 'master', icon: Crown, label: 'Painel Master' },
    ],
  },
] as const;

const viewLabels: Record<View, string> = {
  master: 'Painel Master',
  dashboard: 'Dashboard',
  pdv: 'PDV Balcão',
  mesas: 'Mesas',
  delivery: 'Delivery',
  cozinha: 'Cozinha',
  estoque: 'Estoque',
  caixa: 'Caixa',
  relatorios: 'Financeiro',
  configuracoes: 'Configurações',
  manual: 'Manual de Uso',
  clientes: 'Clientes',
  colaboradores: 'Colaboradores',
  fornecedores: 'Fornecedores',
  produtos: 'Cardápio',
  seguranca: 'Segurança',
  suporte: 'Suporte',
};

export const Layout: React.FC<LayoutProps> = ({ currentView, setCurrentView, license, children }) => {
  const { theme, setTheme, cashierSession, currentUser, currentEmpresa } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  const isDark = theme === 'dark';

  const visibleNavGroups = navGroups;

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    const handleAppInstalled = () => {
      setShowInstallBtn(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBtn(false);
    }
  };

  return (
    <div className={`flex flex-col h-screen overflow-hidden font-sans ${isDark ? 'bg-app-base text-text' : 'bg-app-base-light text-text-light'}`}>
      <div className="flex flex-1 overflow-hidden w-full mx-auto">
        <aside
          className={`flex flex-col transition-all duration-300 ease-in-out border-r ${
            isCollapsed ? 'w-20' : 'w-64'
          } ${isDark ? 'bg-surface border-border' : 'bg-surface-light border-border-light'}`}
        >
          <div className={`flex items-center border-b min-h-16 ${isDark ? 'border-border' : 'border-border-light'} ${isCollapsed ? 'justify-center p-0' : 'px-5 justify-between'}`}>
            <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="w-8 h-8 bg-accent rounded-panel flex-shrink-0 flex items-center justify-center text-white">
                <Utensils className="w-4 h-4" />
              </div>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-semibold text-base whitespace-nowrap"
                >
                  {APP_NAME}
                </motion.span>
              )}
            </div>
            {!isCollapsed && (
              <button
                onClick={() => setIsCollapsed(true)}
                className={`p-1.5 rounded-control transition-colors ${isDark ? 'hover:bg-elevated' : 'hover:bg-elevated-light'}`}
                aria-label="Recolher menu"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4 scrollbar-none">
            {visibleNavGroups.map((group) => {
              const filteredItems = group.items.filter(item => {
                if (item.id === 'master') return currentUser.role === 'master';
                return canAccessModule(currentEmpresa.plano, currentUser.role, item.id as ModuleId);
              });

              if (filteredItems.length === 0) return null;

              return (
                <div key={group.title} className="space-y-1">
                  {!isCollapsed && <h3 className="px-3 text-xs font-medium text-muted">{group.title}</h3>}
                  <div className="space-y-1">
                    {filteredItems.map((item) => {
                      const active = currentView === item.id;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setCurrentView(item.id as View)}
                          title={isCollapsed ? item.label : ''}
                          className={`w-full flex items-center gap-3 px-3 py-2 transition-all rounded-control group relative ${
                            active
                              ? 'bg-accent text-white'
                              : isDark
                                ? 'text-muted hover:bg-elevated hover:text-text'
                                : 'text-muted-light hover:bg-elevated-light hover:text-text-light'
                          } ${isCollapsed ? 'justify-center' : ''}`}
                        >
                          <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`} />
                          {!isCollapsed && (
                            <div className="flex-1 flex items-center justify-between overflow-hidden">
                              <span className="font-medium text-sm transition-opacity duration-300 truncate">{item.label}</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="mt-auto p-5 transition-all duration-300">
            {!isCollapsed && (
              <div className="space-y-1 text-center opacity-60 hover:opacity-100 transition-all duration-300">
                <p className="text-[10px] font-medium text-muted">Desenvolvido por</p>
                <a
                  href="https://www.plenainformatica.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-[10px] font-semibold block hover:text-accent transition-colors ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
                >
                  Plena Informática
                </a>
                <div className="flex items-center justify-center gap-2 text-[8px] font-medium text-muted/70">
                  <span>V1.0</span>
                  <span className="opacity-30">|</span>
                  <span>© 2026</span>
                </div>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {license && <LicenseBanner license={license} />}
          <header className={`h-16 flex items-center justify-between px-6 shrink-0 ${isDark ? 'bg-app-base border-border' : 'bg-surface-light border-border-light'} border-b sticky top-0 z-10`}>
            <div className="flex items-center gap-4 min-w-0">
              {isCollapsed && (
                <button
                  onClick={() => setIsCollapsed(false)}
                  className={`p-2.5 rounded-control transition-colors ${isDark ? 'hover:bg-elevated' : 'hover:bg-elevated-light'}`}
                  aria-label="Abrir menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
              <div className="min-w-0">
                <h1 className="text-lg font-semibold truncate">{viewLabels[currentView]}</h1>
                <p className="text-xs text-muted truncate">Gestão operacional</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DateTimeDisplay />
              <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-current/5">
                {cashierSession ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 text-success rounded-full border border-success/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    <span className="text-xs font-medium">Caixa aberto</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-danger/10 text-danger rounded-full border border-danger/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-danger" />
                    <span className="text-xs font-medium">Caixa fechado</span>
                  </div>
                )}
              </div>

              {showInstallBtn && (
                <button
                  onClick={handleInstallClick}
                  className="hidden sm:flex items-center gap-2 px-4 h-9 rounded-control bg-accent text-white text-sm font-medium hover:bg-accent-hover active:scale-95 transition-all animate-bounce-subtle"
                >
                  <Monitor className="w-4 h-4" /> Instalar
                </button>
              )}

              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className={`p-2.5 rounded-control transition-all active:scale-95 ${isDark ? 'bg-elevated text-warning hover:bg-white/10' : 'bg-elevated-light text-gray-600 hover:bg-gray-200'}`}
                aria-label="Alternar tema"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={theme}
                    initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </motion.div>
                </AnimatePresence>
              </button>

              <div className={`hidden md:flex items-center gap-3 px-3 py-2 rounded-panel border ${isDark ? 'bg-surface border-border' : 'bg-elevated-light border-border-light'}`}>
                <div className="w-8 h-8 rounded-panel bg-accent flex items-center justify-center text-white font-semibold text-xs">GG</div>
                <div className="leading-none">
                  <p className="text-xs font-semibold">Admin Demo</p>
                  <p className="text-[10px] font-medium text-muted mt-0.5">Administrador</p>
                </div>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">{children}</div>
        </main>
      </div>
    </div>
  );
};
