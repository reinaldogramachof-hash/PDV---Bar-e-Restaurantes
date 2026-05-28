import { useCallback, useEffect, useState } from 'react';
import { useBase } from '../store/AppBaseContext';
import type { Order, OrderItem } from '../types';
import {
  closeOrder as closeOrderInSupabase,
  CloseOrderInput,
  createOrder as createOrderInSupabase,
  CreateOrderInput,
  deleteOrder as deleteOrderInSupabase,
  listOpenOrders,
  updateOrder as updateOrderInSupabase,
  updateOrderItems as updateOrderItemsInSupabase,
  UpdateOrderInput,
} from '../services/ordersSupabaseService';

export interface UseOrdersReturn {
  openOrders: Order[];
  loading: boolean;
  error: string | null;
  createOrder: (data: CreateOrderInput) => Promise<Order>;
  updateOrder: (id: string, data: UpdateOrderInput) => Promise<void>;
  closeOrder: (id: string, data: CloseOrderInput) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  updateOrderItems: (id: string, items: OrderItem[]) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useOrders(): UseOrdersReturn {
  const { currentEmpresa } = useBase();
  const [openOrders, setOpenOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const orders = await listOpenOrders(currentEmpresa.id);
      setOpenOrders(orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos abertos.');
    } finally {
      setLoading(false);
    }
  }, [currentEmpresa.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createOrder = useCallback(async (data: CreateOrderInput): Promise<Order> => {
    setError(null);
    const created = await createOrderInSupabase(currentEmpresa.id, data);
    setOpenOrders(prev => [...prev, created].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    ));
    return created;
  }, [currentEmpresa.id]);

  const updateOrder = useCallback(async (id: string, data: UpdateOrderInput) => {
    setError(null);
    const updated = await updateOrderInSupabase(currentEmpresa.id, id, data);
    setOpenOrders(prev => prev.map(order => (order.id === id ? updated : order)));
  }, [currentEmpresa.id]);

  const closeOrder = useCallback(async (id: string, data: CloseOrderInput) => {
    setError(null);
    await closeOrderInSupabase(currentEmpresa.id, id, data);
    setOpenOrders(prev => prev.filter(order => order.id !== id));
  }, [currentEmpresa.id]);

  const deleteOrder = useCallback(async (id: string) => {
    setError(null);
    await deleteOrderInSupabase(currentEmpresa.id, id);
    setOpenOrders(prev => prev.filter(order => order.id !== id));
  }, [currentEmpresa.id]);

  const updateOrderItems = useCallback(async (id: string, items: OrderItem[]) => {
    setError(null);
    const updated = await updateOrderItemsInSupabase(currentEmpresa.id, id, items);
    setOpenOrders(prev => prev.map(order => (order.id === id ? updated : order)));
  }, [currentEmpresa.id]);

  return {
    openOrders,
    loading,
    error,
    createOrder,
    updateOrder,
    closeOrder,
    deleteOrder,
    updateOrderItems,
    refresh,
  };
}
