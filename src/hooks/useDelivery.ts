import { useCallback, useEffect, useState } from 'react';
import { useApp } from '../store/AppContext';
import type { DeliveryOrder, Entregador } from '../types';
import {
  cancelDeliveryOrder,
  createDeliveryOrder,
  createEntregador as createEntregadorInSupabase,
  CreateDeliveryOrderInput,
  CreateEntregadorInput,
  deleteEntregador as deleteEntregadorInSupabase,
  deliverDeliveryOrder,
  dispatchDeliveryOrder,
  listDeliveryOrders,
  listEntregadores,
  updateDeliveryOrder,
  UpdateDeliveryOrderInput,
  updateEntregador as updateEntregadorInSupabase,
} from '../services/deliverySupabaseService';

export interface UseDeliveryReturn {
  deliveryOrders: DeliveryOrder[];
  entregadores: Entregador[];
  loading: boolean;
  error: string | null;
  createOrder: (data: CreateDeliveryOrderInput) => Promise<void>;
  updateOrder: (id: string, data: UpdateDeliveryOrderInput) => Promise<void>;
  cancelOrder: (id: string, reason: string) => Promise<void>;
  dispatchOrder: (id: string, entregadorId: string) => Promise<void>;
  deliverOrder: (id: string) => Promise<void>;
  createEntregador: (data: CreateEntregadorInput) => Promise<void>;
  updateEntregador: (id: string, data: Partial<Entregador>) => Promise<void>;
  deleteEntregador: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useDelivery(): UseDeliveryReturn {
  const { currentEmpresa } = useApp();
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>([]);
  const [entregadores, setEntregadores] = useState<Entregador[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [orders, riders] = await Promise.all([
        listDeliveryOrders(currentEmpresa.id),
        listEntregadores(currentEmpresa.id),
      ]);
      setDeliveryOrders(orders);
      setEntregadores(riders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar delivery.');
    } finally {
      setLoading(false);
    }
  }, [currentEmpresa.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createOrder = useCallback(async (data: CreateDeliveryOrderInput) => {
    setError(null);
    const created = await createDeliveryOrder(currentEmpresa.id, data);
    setDeliveryOrders(prev => [created, ...prev]);
  }, [currentEmpresa.id]);

  const updateOrder = useCallback(async (id: string, data: UpdateDeliveryOrderInput) => {
    setError(null);
    const updated = await updateDeliveryOrder(currentEmpresa.id, id, data);
    setDeliveryOrders(prev => prev.map(order => (order.id === id ? updated : order)));
  }, [currentEmpresa.id]);

  const cancelOrder = useCallback(async (id: string, reason: string) => {
    setError(null);
    const updated = await cancelDeliveryOrder(currentEmpresa.id, id, reason);
    setDeliveryOrders(prev => prev.map(order => (order.id === id ? updated : order)));
  }, [currentEmpresa.id]);

  const dispatchOrder = useCallback(async (id: string, entregadorId: string) => {
    setError(null);
    const updated = await dispatchDeliveryOrder(currentEmpresa.id, id, entregadorId);
    setDeliveryOrders(prev => prev.map(order => (order.id === id ? updated : order)));
  }, [currentEmpresa.id]);

  const deliverOrder = useCallback(async (id: string) => {
    setError(null);
    const updated = await deliverDeliveryOrder(currentEmpresa.id, id);
    setDeliveryOrders(prev => prev.map(order => (order.id === id ? updated : order)));
  }, [currentEmpresa.id]);

  const createEntregador = useCallback(async (data: CreateEntregadorInput) => {
    setError(null);
    const created = await createEntregadorInSupabase(currentEmpresa.id, data);
    setEntregadores(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')));
  }, [currentEmpresa.id]);

  const updateEntregador = useCallback(async (id: string, data: Partial<Entregador>) => {
    setError(null);
    const updated = await updateEntregadorInSupabase(currentEmpresa.id, id, data);
    setEntregadores(prev => prev.map(item => (item.id === id ? updated : item)));
  }, [currentEmpresa.id]);

  const deleteEntregador = useCallback(async (id: string) => {
    setError(null);
    await deleteEntregadorInSupabase(currentEmpresa.id, id);
    setEntregadores(prev => prev.filter(item => item.id !== id));
  }, [currentEmpresa.id]);

  return {
    deliveryOrders,
    entregadores,
    loading,
    error,
    createOrder,
    updateOrder,
    cancelOrder,
    dispatchOrder,
    deliverOrder,
    createEntregador,
    updateEntregador,
    deleteEntregador,
    refresh,
  };
}
