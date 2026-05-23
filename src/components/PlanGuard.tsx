import React from 'react';
import { ModuleId, canAccessModule } from '../domain/saas';
import { useApp } from '../store/AppContext';
import { PlanUpgradeBanner } from './PlanUpgradeBanner';

interface PlanGuardProps {
  moduleId: ModuleId;
  children: React.ReactNode;
}

export const PlanGuard: React.FC<PlanGuardProps> = ({ moduleId, children }) => {
  const { currentEmpresa, currentUser } = useApp();

  const isAuthorized = canAccessModule(currentEmpresa.plano, currentUser.role, moduleId);

  if (!isAuthorized) {
    return <PlanUpgradeBanner moduleId={moduleId} />;
  }

  return <>{children}</>;
};
