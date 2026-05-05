import { useState } from 'react';

export type View = 
  | 'dashboard' 
  | 'pdv' 
  | 'mesas' 
  | 'estoque' 
  | 'caixa' 
  | 'relatorios' 
  | 'configuracoes' 
  | 'manual' 
  | 'clientes' 
  | 'colaboradores' 
  | 'fornecedores';

export function useNavigation() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  return { currentView, setCurrentView };
}
