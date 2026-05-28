import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useBase } from '../store/AppBaseContext';
import type { DeliveryOrder } from '../types';
import {
  confirmIFoodPickup,
  confirmIFoodOrder,
  dispatchIFoodOrder,
  fetchIFoodOrders,
  fetchMockIFoodOrders,
  mapIFoodToDeliveryOrder,
  rejectIFoodOrder,
} from '../services/integrations/ifoodService';

type IntegrationStatus = 'connected' | 'disconnected' | 'error';

interface IntegrationPlatformRow {
  empresa_id: string;
  platform_id: 'ifood';
  merchant_id: string | null;
  merchant_uuid: string | null;
  client_id: string | null;
  client_secret: string | null;
  enabled: boolean | null;
  status: IntegrationStatus | null;
  last_sync_at: string | null;
}

export interface IFoodIntegrationConfig {
  merchantId: string;
  merchantUuid: string;
  clientId: string;
  clientSecret: string;
  enabled: boolean;
  status: IntegrationStatus;
  lastSyncAt?: string;
}

interface UseIFoodOrdersResult {
  orders: DeliveryOrder[];
  loading: boolean;
  error: string | null;
  config: IFoodIntegrationConfig;
  confirm: (orderId: string) => Promise<void>;
  reject: (orderId: string, reason: string) => Promise<void>;
  dispatch: (orderId: string) => Promise<void>;
  confirmPickup: (orderId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const DEFAULT_MERCHANT_ID = '3860495';
const DEFAULT_MERCHANT_UUID = 'e00e450a-3b69-4db5-892b-d598fbf60fcf';

const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};

const getDefaultStatus = (): IntegrationStatus => (env.VITE_IFOOD_ENV || 'sandbox') === 'production' ? 'connected' : 'disconnected';

const createDefaultConfig = (): IFoodIntegrationConfig => ({
  merchantId: env.VITE_IFOOD_MERCHANT_ID || DEFAULT_MERCHANT_ID,
  merchantUuid: env.VITE_IFOOD_MERCHANT_UUID || DEFAULT_MERCHANT_UUID,
  clientId: env.VITE_IFOOD_CLIENT_ID || '',
  clientSecret: env.VITE_IFOOD_CLIENT_SECRET || '',
  enabled: true,
  status: getDefaultStatus(),
});

const toConfig = (row: IntegrationPlatformRow | null): IFoodIntegrationConfig => {
  const fallback = createDefaultConfig();
  if (!row) return fallback;

  return {
    merchantId: row.merchant_id || fallback.merchantId,
    merchantUuid: row.merchant_uuid || fallback.merchantUuid,
    clientId: row.client_id || fallback.clientId,
    clientSecret: row.client_secret || fallback.clientSecret,
    enabled: row.enabled ?? fallback.enabled,
    status: row.status ?? fallback.status,
    lastSyncAt: row.last_sync_at ?? undefined,
  };
};

async function getOrCreateIFoodConfig(empresaId: string): Promise<IFoodIntegrationConfig> {
  const { data, error } = await supabase
    .from('integration_platforms')
    .select('empresa_id, platform_id, merchant_id, merchant_uuid, client_id, client_secret, enabled, status, last_sync_at')
    .eq('empresa_id', empresaId)
    .eq('platform_id', 'ifood')
    .maybeSingle<IntegrationPlatformRow>();

  if (error) {
    return createDefaultConfig();
  }

  if (data) return toConfig(data);

  const fallback = createDefaultConfig();
  await supabase
    .from('integration_platforms')
    .upsert({
      empresa_id: empresaId,
      platform_id: 'ifood',
      merchant_id: fallback.merchantId,
      merchant_uuid: fallback.merchantUuid,
      client_id: fallback.clientId || null,
      client_secret: fallback.clientSecret || null,
      enabled: fallback.enabled,
      status: fallback.status,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'empresa_id,platform_id' });

  return fallback;
}

export function useIFoodOrders(): UseIFoodOrdersResult {
  const { currentEmpresa } = useBase();
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<IFoodIntegrationConfig>(createDefaultConfig);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const configRow = await getOrCreateIFoodConfig(currentEmpresa.id);
      setConfig(configRow);

      if (!configRow.enabled) {
        setOrders([]);
        return;
      }

      const externalOrders = configRow.status === 'connected'
        ? await fetchIFoodOrders(configRow.clientId, configRow.clientSecret, configRow.merchantId)
        : await fetchMockIFoodOrders();

      const mappedOrders = externalOrders.map(order => mapIFoodToDeliveryOrder(order, currentEmpresa.id));
      setOrders(mappedOrders);

      await supabase
        .from('integration_platforms')
        .update({ last_sync_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('empresa_id', currentEmpresa.id)
        .eq('platform_id', 'ifood');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao sincronizar pedidos do iFood.');
      const fallbackOrders = await fetchMockIFoodOrders();
      setOrders(fallbackOrders.map(order => mapIFoodToDeliveryOrder(order, currentEmpresa.id)));
    } finally {
      setLoading(false);
    }
  }, [currentEmpresa.id]);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => {
      void refresh();
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const updateLocalOrder = useCallback((orderId: string, updater: (order: DeliveryOrder) => DeliveryOrder) => {
    setOrders(prev => prev.map(order => (order.id === orderId ? updater(order) : order)));
  }, []);

  const confirm = useCallback(async (orderId: string) => {
    await confirmIFoodOrder(orderId);
    updateLocalOrder(orderId, order => ({ ...order, status: 'preparo' }));
  }, [updateLocalOrder]);

  const reject = useCallback(async (orderId: string, reason: string) => {
    await rejectIFoodOrder(orderId, reason);
    updateLocalOrder(orderId, order => ({ ...order, status: 'cancelado', cancelReason: reason }));
  }, [updateLocalOrder]);

  const dispatch = useCallback(async (orderId: string) => {
    await dispatchIFoodOrder(orderId);
    updateLocalOrder(orderId, order => ({ ...order, status: 'rota', dispatchedAt: new Date().toISOString() }));
  }, [updateLocalOrder]);

  const confirmPickup = useCallback(async (orderId: string) => {
    await confirmIFoodPickup(orderId);
    updateLocalOrder(orderId, order => ({ ...order, status: 'entregue', deliveredAt: new Date().toISOString() }));
  }, [updateLocalOrder]);

  return useMemo(() => ({
    orders,
    loading,
    error,
    config,
    confirm,
    reject,
    dispatch,
    confirmPickup,
    refresh,
  }), [orders, loading, error, config, confirm, reject, dispatch, confirmPickup, refresh]);
}
