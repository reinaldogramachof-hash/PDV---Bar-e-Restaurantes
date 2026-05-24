import React, { lazy, Suspense } from 'react';
import { AppProvider, useApp } from './store/AppContext';
import { Layout } from './components/Layout';
import { useNavigation } from './hooks/useNavigation';
import { PlanGuard } from './components/PlanGuard';
import { Dashboard } from './components/Dashboard';
import { MasterDashboard } from './components/MasterDashboard';
import { LicenseLock } from './components/LicenseLock';
import { CustomerMenuView } from './components/CustomerMenuView';
import { LICENSE_STATUS_URL } from './domain/saas';
import { checkLicense, LicenseCheckResult } from './services/licenseService';
import { purgeOldLogs } from './services/auditService';

// Lazy loading das views para otimização de performance (bundle principal < 150KB)
const PDV = lazy(() => import('./components/PDV').then(module => ({ default: module.PDV })));
const Stock = lazy(() => import('./components/Stock').then(module => ({ default: module.Stock })));
const Cashier = lazy(() => import('./components/Cashier').then(module => ({ default: module.Cashier })));
const Reports = lazy(() => import('./components/Reports').then(module => ({ default: module.Reports })));
const Intelligence = lazy(() => import('./components/Intelligence').then(module => ({ default: module.Intelligence })));
const UserManual = lazy(() => import('./components/UserManual').then(module => ({ default: module.UserManual })));
const Tables = lazy(() => import('./components/Tables').then(module => ({ default: module.Tables })));
const Delivery = lazy(() => import('./components/Delivery').then(module => ({ default: module.Delivery })));
const MenuDigital = lazy(() => import('./components/MenuDigital').then(module => ({ default: module.MenuDigital })));
const SalesCenter = lazy(() => import('./components/SalesCenter').then(module => ({ default: module.SalesCenter })));
const Customers = lazy(() => import('./components/Customers').then(module => ({ default: module.Customers })));
const Collaborators = lazy(() => import('./components/Collaborators').then(module => ({ default: module.Collaborators })));
const Suppliers = lazy(() => import('./components/Suppliers').then(module => ({ default: module.Suppliers })));
const Products = lazy(() => import('./components/Products').then(module => ({ default: module.Products })));
const Support = lazy(() => import('./components/Support').then(module => ({ default: module.Support })));
const Kitchen = lazy(() => import('./components/Kitchen').then(module => ({ default: module.Kitchen })));
const Settings = lazy(() => import('./components/Settings').then(module => ({ default: module.Settings })));
const Security = lazy(() => import('./components/Security').then(module => ({ default: module.Security })));
const OnlineOrders = lazy(() => import('./components/OnlineOrders').then(module => ({ default: module.OnlineOrders })));

const LoadingSpinner = () => (
  <div className="h-full w-full min-h-[400px] flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
  </div>
);

const RedirectToDashboard = ({ setCurrentView }: { setCurrentView: (view: any) => void }) => {
  React.useEffect(() => {
    setCurrentView('dashboard');
  }, [setCurrentView]);
  return null;
};

const AppContent = () => {
  const { currentView, setCurrentView } = useNavigation();
  const { theme, currentUser, currentEmpresa } = useApp();
  const [license, setLicense] = React.useState<LicenseCheckResult | null>(null);

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  React.useEffect(() => {
    let mounted = true;

    purgeOldLogs(currentEmpresa.id);

    checkLicense(LICENSE_STATUS_URL).then(result => {
      if (mounted) setLicense(result);
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (license?.status === 'suspended') {
    return <LicenseLock license={license} />;
  }

  if (!license) {
    return (
      <div className="h-screen w-full bg-[#121214] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'master':
        return currentUser.role === 'master'
          ? <MasterDashboard />
          : <RedirectToDashboard setCurrentView={setCurrentView} />;
      case 'dashboard': return <PlanGuard moduleId="dashboard"><Dashboard /></PlanGuard>;
      case 'intelligence': return <PlanGuard moduleId="intelligence"><Intelligence /></PlanGuard>;
      case 'pdv': return <PlanGuard moduleId="pdv"><PDV /></PlanGuard>;
      case 'mesas': return <PlanGuard moduleId="mesas"><Tables /></PlanGuard>;
      case 'delivery': return <PlanGuard moduleId="delivery"><Delivery /></PlanGuard>;
      case 'cardapio-digital': return <PlanGuard moduleId="cardapio-digital"><MenuDigital /></PlanGuard>;
      case 'vendas': return <PlanGuard moduleId="vendas"><SalesCenter /></PlanGuard>;
      case 'cozinha': return <PlanGuard moduleId="cozinha"><Kitchen /></PlanGuard>;
      case 'estoque': return <PlanGuard moduleId="estoque"><Stock /></PlanGuard>;
      case 'caixa': return <PlanGuard moduleId="caixa"><Cashier /></PlanGuard>;
      case 'relatorios': return <PlanGuard moduleId="relatorios"><Reports /></PlanGuard>;
      case 'manual': return <UserManual />;
      case 'clientes': return <PlanGuard moduleId="clientes"><Customers /></PlanGuard>;
      case 'colaboradores': return <PlanGuard moduleId="colaboradores"><Collaborators /></PlanGuard>;
      case 'fornecedores': return <PlanGuard moduleId="fornecedores"><Suppliers /></PlanGuard>;
      case 'produtos': return <PlanGuard moduleId="produtos"><Products /></PlanGuard>;
      case 'suporte': return <Support />;
      case 'configuracoes': return <Settings />;
      case 'seguranca': return <PlanGuard moduleId="seguranca"><Security /></PlanGuard>;
      case 'pedidos-online': return <OnlineOrders />;
      default: return (
        <div className="h-full flex flex-col items-center justify-center gap-4 opacity-50">
          <p className="text-xl font-semibold">Em construcao</p>
          <p className="text-sm">Este modulo estara disponivel em breve.</p>
        </div>
      );
    }
  };

  return (
    <Layout currentView={currentView} setCurrentView={setCurrentView} license={license}>
      <Suspense fallback={<LoadingSpinner />}>
        {renderContent()}
      </Suspense>
    </Layout>
  );
};

export default function App() {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/cardapio/')) {
    return <CustomerMenuView />;
  }

  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
