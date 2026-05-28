import { useCallback, useEffect, useState } from 'react';
import type { Empresa } from '../types';
import {
  createEmpresaForTrial,
  type CreateEmpresaInput,
  listAllEmpresas,
  updateEmpresaLicense,
  updateEmpresaPlano,
  updateEmpresaStatus,
} from '../services/masterService';

export interface UseMasterReturn {
  empresas: Empresa[];
  loading: boolean;
  error: string | null;
  updateLicense: (id: string, status: 'active' | 'trial' | 'suspended') => Promise<void>;
  updatePlano: (id: string, plano: 'essencial' | 'profissional' | 'gestao') => Promise<void>;
  updateStatus: (id: string, payload: { licenseStatus?: 'active' | 'trial' | 'suspended'; active?: boolean }) => Promise<void>;
  createEmpresa: (input: CreateEmpresaInput) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useMaster(): UseMasterReturn {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const next = await listAllEmpresas();
      setEmpresas(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar empresas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateLicense = useCallback(async (id: string, status: 'active' | 'trial' | 'suspended') => {
    setError(null);
    const updated = await updateEmpresaLicense(id, status);
    setEmpresas(prev => prev.map(item => (item.id === id ? updated : item)));
  }, []);

  const updatePlano = useCallback(async (id: string, plano: 'essencial' | 'profissional' | 'gestao') => {
    setError(null);
    const updated = await updateEmpresaPlano(id, plano);
    setEmpresas(prev => prev.map(item => (item.id === id ? updated : item)));
  }, []);

  const updateStatus = useCallback(async (
    id: string,
    payload: { licenseStatus?: 'active' | 'trial' | 'suspended'; active?: boolean },
  ) => {
    setError(null);
    const updated = await updateEmpresaStatus(id, payload);
    setEmpresas(prev => prev.map(item => (item.id === id ? updated : item)));
  }, []);

  const createEmpresa = useCallback(async (input: CreateEmpresaInput) => {
    setError(null);
    const created = await createEmpresaForTrial(input);
    setEmpresas(prev => [created, ...prev]);
  }, []);

  return {
    empresas,
    loading,
    error,
    updateLicense,
    updatePlano,
    updateStatus,
    createEmpresa,
    refresh,
  };
}
