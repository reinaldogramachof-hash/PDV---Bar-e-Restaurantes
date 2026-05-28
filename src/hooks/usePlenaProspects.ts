import { useCallback, useEffect, useState } from 'react';
import {
  createProspect,
  deleteProspect,
  listProspects,
  updateProspect,
  type PlenaProspect,
} from '../services/plenaProspectsService';

export function usePlenaProspects() {
  const [prospects, setProspects] = useState<PlenaProspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await listProspects();
      setProspects(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar prospects.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(async (input: Omit<PlenaProspect, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created = await createProspect(input);
    setProspects(prev => [created, ...prev]);
    return created;
  }, []);

  const update = useCallback(async (id: string, input: Partial<PlenaProspect>) => {
    const updated = await updateProspect(id, input);
    setProspects(prev => prev.map(item => (item.id === id ? updated : item)));
    return updated;
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteProspect(id);
    setProspects(prev => prev.filter(item => item.id !== id));
  }, []);

  return { prospects, loading, error, refresh, create, update, remove };
}
