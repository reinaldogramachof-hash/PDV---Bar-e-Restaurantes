import React from 'react';
import { AppProvider } from './store/AppContext';
import { Layout } from './components/Layout';
import { useNavigation, View } from './hooks/useNavigation';
import { Dashboard } from './components/Dashboard';
import { PDV } from './components/PDV';
import { Stock } from './components/Stock';
import { Cashier } from './components/Cashier';
import { Reports } from './components/Reports';
import { UserManual } from './components/UserManual';
import { Tables } from './components/Tables';
import { Customers } from './components/Customers';
import { Collaborators } from './components/Collaborators';
import { Suppliers } from './components/Suppliers';
import { Products } from './components/Products';
import { Support } from './components/Support';
import { Kitchen } from './components/Kitchen';
import { Settings } from './components/Settings';
import { Security } from './components/Security';
import { LicenseLock } from './components/LicenseLock';
import { LICENSE_STATUS_URL } from './domain/saas';

const AppContent = () => {
  const { currentView, setCurrentView } = useNavigation();
  const [isAuthorized, setIsAuthorized] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const checkLicense = async () => {
      try {
        // LINK DO CONTROLE DE LICENÇA (GITHUB RAW OU GIST)
        const LICENSE_URL = LICENSE_STATUS_URL;
        if (!LICENSE_URL) {
          setIsAuthorized(true);
          return;
        }
        
        const response = await fetch(LICENSE_URL + '?t=' + Date.now());
        const status = await response.text();
        
        if (status.trim().toUpperCase() === 'BLOQUEADO') {
          setIsAuthorized(false);
        } else {
          setIsAuthorized(true);
        }
      } catch (error) {
        // Se houver erro de rede (offline), permitimos o uso temporário ou bloqueamos.
        // Por segurança em testes, vamos permitir se houver erro, mas você pode mudar para false.
        setIsAuthorized(true);
      }
    };

    checkLicense();
  }, []);

  if (isAuthorized === false) {
    return <LicenseLock />;
  }

  if (isAuthorized === null) {
    return (
      <div className="h-screen w-full bg-[#121214] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#E85D75] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const renderContent = () => {
    switch(currentView) {
      case 'dashboard': return <Dashboard />;
      case 'pdv': return <PDV />;
      case 'mesas': return <Tables />;
      case 'cozinha': return <Kitchen />;
      case 'estoque': return <Stock />;
      case 'caixa': return <Cashier />;
      case 'relatorios': return <Reports />;
      case 'manual': return <UserManual />;
      case 'clientes': return <Customers />;
      case 'colaboradores': return <Collaborators />;
      case 'fornecedores': return <Suppliers />;
      case 'produtos': return <Products />;
      case 'suporte': return <Support />;
      case 'configuracoes': return <Settings />;
      case 'seguranca': return <Security />;
      default: return (
        <div className="h-full flex flex-col items-center justify-center gap-4 opacity-50">
          <span className="text-5xl">🚧</span>
          <p className="text-xl font-bold">Em Construção</p>
          <p className="text-sm">Este módulo estará disponível em breve.</p>
        </div>
      );
    }
  }

  return (
    <Layout currentView={currentView} setCurrentView={setCurrentView}>
       {renderContent()}
    </Layout>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
