import { useCallback, useEffect, useState } from 'react';
import { useBase } from '../store/AppBaseContext';
import type { OnlineOrder, OnlineOrderStatus, Order, OrderItem } from '../types';
import {
  listKitchenOnlineOrders,
  listKitchenOrders,
  updateOnlineOrderStatus,
  updateOrderItems as updateOrderItemsInSupabase,
} from '../services/kitchenSupabaseService';

export interface UseKitchenReturn {
  kitchenOrders: Order[];
  onlineOrders: OnlineOrder[];
  loading: boolean;
  error: string | null;
  updateOrderItems: (orderId: string, items: OrderItem[]) => Promise<void>;
  updateOnlineStatus: (id: string, status: OnlineOrderStatus) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useKitchen(): UseKitchenReturn {
  const { currentEmpresa } = useBase();
  const [kitchenOrders, setKitchenOrders] = useState<Order[]>([]);
  const [onlineOrders, setOnlineOrders] = useState<OnlineOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [orders, online] = await Promise.all([
        listKitchenOrders(currentEmpresa.id),
        listKitchenOnlineOrders(currentEmpresa.id),
      ]);
      setKitchenOrders(orders);
      setOnlineOrders(online);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados da cozinha.');
    } finally {
      setLoading(false);
    }
  }, [currentEmpresa.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateOrderItems = useCallback(async (orderId: string, items: OrderItem[]) => {
    setError(null);
    const updated = await updateOrderItemsInSupabase(currentEmpresa.id, orderId, items);
    setKitchenOrders(prev => prev.map(order => (order.id === orderId ? updated : order)));
  }, [currentEmpresa.id]);

  const updateOnlineStatus = useCallback(async (id: string, status: OnlineOrderStatus) => {
    setError(null);
    const updated = await updateOnlineOrderStatus(currentEmpresa.id, id, status);
    setOnlineOrders(prev => prev.map(order => (order.id === id ? updated : order)));
  }, [currentEmpresa.id]);

  return {
    kitchenOrders,
    onlineOrders,
    loading,
    error,
    updateOrderItems,
    updateOnlineStatus,
    refresh,
  };
}
