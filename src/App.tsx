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
import { Support } from './components/Support';

const AppContent = () => {
  const { currentView, setCurrentView } = useNavigation();

  const renderContent = () => {
    switch(currentView) {
      case 'dashboard': return <Dashboard />;
      case 'pdv': return <PDV />;
      case 'mesas': return <Tables />;
      case 'estoque': return <Stock />;
      case 'caixa': return <Cashier />;
      case 'relatorios': return <Reports />;
      case 'manual': return <UserManual />;
      case 'clientes': return <Customers />;
      case 'colaboradores': return <Collaborators />;
      case 'fornecedores': return <Suppliers />;
      case 'suporte': return <Support />;
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
