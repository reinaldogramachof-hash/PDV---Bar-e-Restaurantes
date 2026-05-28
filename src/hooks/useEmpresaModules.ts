import { useCallback, useEffect, useMemo, useState } from 'react';
import { type ModuleId } from '../domain/saas';
import { listEmpresaModules, type EmpresaModule } from '../services/empresaModulesService';

export function useEmpresaModules(empresaId?: string) {
  const [modules, setModules] = useState<EmpresaModule[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!empresaId) {
      setModules([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const next = await listEmpresaModules(empresaId);
      setModules(next);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const hasExtraModule = useMemo(() => {
    return (moduleId: ModuleId) => {
      const now = new Date();
      return modules.some(item => {
        if (!item.enabled || item.moduleId !== moduleId) return false;
        if (!item.expiresAt) return true;
        return new Date(item.expiresAt) >= now;
      });
    };
  }, [modules]);

  return { modules, loading, refresh, hasExtraModule };
}
