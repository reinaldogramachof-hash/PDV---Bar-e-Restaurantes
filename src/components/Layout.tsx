import React, { useEffect, useState } from 'react';
import { View } from '../hooks/useNavigation';
import { useApp } from '../store/AppContext';
import {
  BarChart2,
  BrainCircuit,
  Bike,
  BookMarked,
  ChefHat,
  ChevronLeft,
  HeadphonesIcon,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Menu,
  Monitor,
  Moon,
  NotebookPen,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sun,
  TrendingUp,
  Truck,
  UserCog,
  Users,
  UtensilsCrossed,
  Wallet,
  Warehouse,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AnimatePresence, motion } from 'motion/react';
import { APP_NAME, canAccessModule, canAccessViaPackOrAddon, ModuleId, PLENA_EMPRESA_ID } from '../domain/saas';
import { LicenseCheckResult } from '../services/licenseService';
import { fetchFeed } from '../services/notificationService';
import { LicenseBanner } from './LicenseBanner';
import { NotificationPanel } from './NotificationPanel';

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

const moduleMeta: Record<ModuleId, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
  pdv: { icon: ShoppingCart, label: 'PDV (Balcão)' },
  mesas: { icon: LayoutGrid, label: 'Mesas' },
  cozinha: { icon: ChefHat, label: 'Cozinha' },
  delivery: { icon: Bike, label: 'Delivery' },
  'pedidos-online': { icon: Smartphone, label: 'Pedidos Online' },
  'cardapio-digital': { icon: UtensilsCrossed, label: 'Cardápio Digital' },
  clientes: { icon: Users, label: 'Clientes' },
  vendas: { icon: TrendingUp, label: 'Vendas' },
  produtos: { icon: Package, label: 'Produtos' },
  estoque: { icon: Warehouse, label: 'Estoque' },
  fornecedores: { icon: Truck, label: 'Fornecedores' },
  colaboradores: { icon: UserCog, label: 'Colaboradores' },
  caixa: { icon: Wallet, label: 'Caixa' },
  relatorios: { icon: BarChart2, label: 'Financeiro' },
  dashboard: { icon: LayoutDashboard, label: 'Dashboard' },
  intelligence: { icon: BrainCircuit, label: 'Inteligência' },
  diario: { icon: NotebookPen, label: 'Diário' },
  configuracoes: { icon: Settings, label: 'Configurações' },
  seguranca: { icon: ShieldCheck, label: 'Segurança' },
  suporte: { icon: HeadphonesIcon, label: 'Suporte' },
  manual: { icon: BookMarked, label: 'Manual de Uso' },
};

const SIDEBAR_GROUPS = [
  { label: 'Operacional', modules: ['pdv', 'mesas', 'cozinha', 'delivery', 'pedidos-online'] },
  { label: 'Comercial', modules: ['cardapio-digital', 'clientes', 'vendas'] },
  { label: 'Administrativo', modules: ['produtos', 'estoque', 'fornecedores', 'colaboradores', 'caixa', 'relatorios'] },
  { label: 'Gestão', modules: ['dashboard', 'intelligence', 'diario'] },
  { label: 'Sistema', modules: ['configuracoes', 'seguranca', 'suporte', 'manual'] },
] as const;;

const viewLabels: Record<View, string> = {
  master: 'Painel Master',
  dashboard: 'Dashboard',
  intelligence: 'Inteligência',
  pdv: 'PDV Balcão',
  mesas: 'Mesas',
  delivery: 'Delivery',
  'pedidos-online': 'Pedidos Online',
  'cardapio-digital': 'Cardápio Digital',
  vendas: 'Vendas',
  cozinha: 'Cozinha',
  estoque: 'Estoque',
  caixa: 'Caixa',
  relatorios: 'Financeiro',
  diario: 'Diário',
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
  const sidebarTitleMain = APP_NAME.replace(/\s*Manager$/i, '').trim();
  const sidebarTitleSuffix = /Manager$/i.test(APP_NAME) ? 'Manager' : '';

  const enabledExtraModules = ((currentEmpresa as unknown as { extraModules?: string[] }).extraModules ?? []);
  const canOpenComandaMobile = currentUser.role === 'garcom' || currentUser.role === 'gerente';
  const visibleNavGroups = SIDEBAR_GROUPS
    .map(group => ({
      ...group,
      items: group.modules
        .filter(moduleId =>
          canAccessModule(currentEmpresa.plano, currentUser.role, moduleId) ||
          canAccessViaPackOrAddon(enabledExtraModules, currentUser.role, moduleId)
        )
        .map(moduleId => ({
          id: moduleId,
          icon: moduleMeta[moduleId].icon,
          label: moduleMeta[moduleId].label,
        })),
    }))
    .filter(group => group.items.length > 0);

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

  useEffect(() => {
    fetchFeed();
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
              <img src="/favicon.png" alt="PGM" className="w-8 h-8 rounded-lg flex-shrink-0 object-cover" />
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="leading-tight"
                >
                  <span className="block font-semibold text-base whitespace-nowrap">{sidebarTitleMain}</span>
                  {sidebarTitleSuffix && (
                    <span className="block text-[11px] font-semibold text-orange-500 tracking-wide">{sidebarTitleSuffix}</span>
                  )}
                </motion.div>
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
            {canOpenComandaMobile && (
              <div className="space-y-1">
                {!isCollapsed && (
                  <div className="px-3 pt-2 pb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                      Mobile
                    </span>
                  </div>
                )}
                <a
                  href="/comanda"
                  target="_blank"
                  rel="noopener noreferrer"
                  title={isCollapsed ? 'Comanda Mobile' : ''}
                  className={`w-full flex items-center gap-3 px-3 py-2 transition-all rounded-control group ${
                    isDark
                      ? 'text-muted hover:bg-elevated hover:text-text'
                      : 'text-muted-light hover:bg-elevated-light hover:text-text-light'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <Smartphone className="w-4.5 h-4.5 flex-shrink-0 opacity-70 group-hover:opacity-100" />
                  {!isCollapsed && <span className="font-medium text-sm">Comanda Mobile</span>}
                </a>
                {!isCollapsed && <hr className="border-[var(--color-border)] mx-3 my-1" />}
              </div>
            )}
            {currentUser.role === 'master' && currentEmpresa.id === PLENA_EMPRESA_ID && (
              <div className="space-y-1 pb-1">
                {!isCollapsed && (
                  <div className="px-3 pt-2 pb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                      Master
                    </span>
                  </div>
                )}
                <button
                  onClick={() => setCurrentView('master')}
                  title={isCollapsed ? 'Painel Master' : ''}
                  className={`w-full flex items-center gap-3 px-3 py-2 transition-all rounded-control group ${
                    currentView === 'master'
                      ? 'bg-accent text-white'
                      : isDark
                        ? 'text-muted hover:bg-elevated hover:text-text'
                        : 'text-muted-light hover:bg-elevated-light hover:text-text-light'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                >
                  <ShieldCheck className="w-4.5 h-4.5 flex-shrink-0 opacity-70 group-hover:opacity-100" />
                  {!isCollapsed && <span className="font-medium text-sm">Painel Master</span>}
                </button>
                {!isCollapsed && <hr className="border-[var(--color-border)] mx-3 my-1" />}
              </div>
            )}
            {visibleNavGroups.map((group, index) => {
              return (
                <div key={group.label} className="space-y-1">
                  {!isCollapsed && (
                    <div className="px-3 pt-4 pb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                        {group.label}
                      </span>
                    </div>
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
                  {!isCollapsed && index < visibleNavGroups.length - 1 && <hr className="border-[var(--color-border)] mx-3 my-1" />}
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

              <NotificationPanel />

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

              <div className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-panel border ${isDark ? 'bg-surface border-border' : 'bg-elevated-light border-border-light'}`}>
                <div className="w-8 h-8 rounded-panel bg-accent flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="leading-none">
                  <p className="text-xs font-semibold truncate max-w-[120px]">{currentUser.name}</p>
                  <p className="text-[10px] font-medium text-muted mt-0.5 capitalize">{currentUser.role}</p>
                </div>
                <button
                  onClick={() => supabase.auth.signOut()}
                  title="Sair"
                  className={`ml-1 p-1.5 rounded-control transition-colors ${isDark ? 'hover:bg-elevated text-muted hover:text-danger' : 'hover:bg-gray-200 text-muted-light hover:text-danger'}`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">{children}</div>
        </main>
      </div>
    </div>
  );
};


