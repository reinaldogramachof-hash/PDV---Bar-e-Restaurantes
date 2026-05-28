import { useState } from 'react';

export type View =
  | 'master'
  | 'dashboard'
  | 'intelligence'
  | 'pdv'
  | 'mesas'
  | 'delivery'
  | 'cardapio-digital'
  | 'vendas'
  | 'estoque'
  | 'caixa'
  | 'relatorios'
  | 'configuracoes'
  | 'diario'
  | 'manual'
  | 'clientes'
  | 'colaboradores'
  | 'fornecedores'
  | 'produtos'
  | 'cozinha'
  | 'seguranca'
  | 'suporte'
  | 'pedidos-online';

export function useNavigation() {
  const getInitialView = (): View => {
    if (typeof window !== 'undefined' && window.location.pathname === '/master') {
      return 'master';
    }
    return 'dashboard';
  };

  const [currentView, setCurrentViewState] = useState<View>(getInitialView);
  const setCurrentView = (view: View) => {
    setCurrentViewState(view);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', view === 'master' ? '/master' : '/');
    }
  };

  return { currentView, setCurrentView };
}
