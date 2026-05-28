import { useCallback, useEffect, useState } from 'react';
import { useBase } from '../store/AppBaseContext';
import type { OnlineOrder } from '../types';
import {
  cancelOnlineOrder,
  createOnlineOrder,
  CreateOnlineOrderInput,
  listOnlineOrders,
  markCashierRecorded,
  markStockDeducted,
  updateOnlineOrderStatus,
  UpdateOnlineOrderStatusInput,
} from '../services/onlineOrdersSupabaseService';

export interface UseOnlineOrdersReturn {
  onlineOrders: OnlineOrder[];
  loading: boolean;
  error: string | null;
  createOrder: (data: CreateOnlineOrderInput) => Promise<void>;
  updateStatus: (id: string, data: UpdateOnlineOrderStatusInput) => Promise<void>;
  cancelOrder: (id: string, reason: string) => Promise<void>;
  markStockDeducted: (id: string) => Promise<void>;
  markCashierRecorded: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useOnlineOrders(): UseOnlineOrdersReturn {
  const { currentEmpresa } = useBase();
  const [onlineOrders, setOnlineOrders] = useState<OnlineOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const orders = await listOnlineOrders(currentEmpresa.id);
      setOnlineOrders(orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos online.');
    } finally {
      setLoading(false);
    }
  }, [currentEmpresa.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createOrder = useCallback(async (data: CreateOnlineOrderInput) => {
    setError(null);
    const created = await createOnlineOrder(currentEmpresa.id, data);
    setOnlineOrders(prev => [created, ...prev]);
  }, [currentEmpresa.id]);

  const updateStatus = useCallback(async (id: string, data: UpdateOnlineOrderStatusInput) => {
    setError(null);
    const updated = await updateOnlineOrderStatus(currentEmpresa.id, id, data);
    setOnlineOrders(prev => prev.map(order => (order.id === id ? updated : order)));
  }, [currentEmpresa.id]);

  const cancelOrder = useCallback(async (id: string, reason: string) => {
    setError(null);
    const updated = await cancelOnlineOrder(currentEmpresa.id, id, reason);
    setOnlineOrders(prev => prev.map(order => (order.id === id ? updated : order)));
  }, [currentEmpresa.id]);

  const markStockDeductedAction = useCallback(async (id: string) => {
    setError(null);
    const updated = await markStockDeducted(currentEmpresa.id, id);
    setOnlineOrders(prev => prev.map(order => (order.id === id ? updated : order)));
  }, [currentEmpresa.id]);

  const markCashierRecordedAction = useCallback(async (id: string) => {
    setError(null);
    const updated = await markCashierRecorded(currentEmpresa.id, id);
    setOnlineOrders(prev => prev.map(order => (order.id === id ? updated : order)));
  }, [currentEmpresa.id]);

  return {
    onlineOrders,
    loading,
    error,
    createOrder,
    updateStatus,
    cancelOrder,
    markStockDeducted: markStockDeductedAction,
    markCashierRecorded: markCashierRecordedAction,
    refresh,
  };
}
