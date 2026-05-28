import React, { useCallback, useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Smartphone } from 'lucide-react';
import type { Order, OrderItem, Product, Table } from '../types';
import { useApp } from '../store/AppContext';
import { buildScopedStorageKey } from '../domain/saas';
import { ComandaConfirmacao } from './ComandaConfirmacao';
import { ComandaLancamento, type ComandaDraftItem } from './ComandaLancamento';
import { ComandaMesaGrid } from './ComandaMesaGrid';

type ComandaStep = 'mesa' | 'lancamento' | 'confirmacao';

interface QueuedComandaItem {
  productId: string;
  quantity: number;
  observation?: string;
}

interface QueuedComanda {
  id: string;
  tableNumber?: number;
  generalObservation?: string;
  items: QueuedComandaItem[];
  createdAt: string;
}

const parseJson = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export const ComandaMobile: React.FC = () => {
  const { currentEmpresa, currentUser, tables, products, addOrder } = useApp();
  const [step, setStep] = useState<ComandaStep>('mesa');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [draftItems, setDraftItems] = useState<ComandaDraftItem[]>([]);
  const [generalObservation, setGeneralObservation] = useState('');
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isMobile, setIsMobile] = useState<boolean>(typeof window !== 'undefined' ? window.innerWidth < 768 : true);
  const [desktopQr, setDesktopQr] = useState('');
  const [cachedTables, setCachedTables] = useState<Table[]>([]);
  const [cachedProducts, setCachedProducts] = useState<Product[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const queueKey = useMemo(() => buildScopedStorageKey('comanda-mobile-queue', currentEmpresa.id), [currentEmpresa.id]);
  const cacheTablesKey = useMemo(() => buildScopedStorageKey('comanda-mobile-cache-tables', currentEmpresa.id), [currentEmpresa.id]);
  const cacheProductsKey = useMemo(() => buildScopedStorageKey('comanda-mobile-cache-products', currentEmpresa.id), [currentEmpresa.id]);
  const comandaUrl = useMemo(() => `${window.location.origin}/comanda`, []);

  useEffect(() => {
    setCachedTables(parseJson<Table[]>(localStorage.getItem(cacheTablesKey), []));
    setCachedProducts(parseJson<Product[]>(localStorage.getItem(cacheProductsKey), []));
  }, [cacheTablesKey, cacheProductsKey]);

  useEffect(() => {
    if (tables.length > 0) {
      localStorage.setItem(cacheTablesKey, JSON.stringify(tables));
    }
  }, [tables, cacheTablesKey]);

  useEffect(() => {
    if (products.length > 0) {
      localStorage.setItem(cacheProductsKey, JSON.stringify(products));
    }
  }, [products, cacheProductsKey]);

  useEffect(() => {
    const updateMobile = () => setIsMobile(window.innerWidth < 768);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    updateMobile();
    window.addEventListener('resize', updateMobile);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('resize', updateMobile);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    void QRCode.toDataURL(comandaUrl, { width: 240, margin: 1 }).then(setDesktopQr).catch(() => setDesktopQr(''));
  }, [comandaUrl]);

  const availableTables = tables.length > 0 ? tables : cachedTables;
  const availableProducts = products.length > 0 ? products : cachedProducts;
  const canAccess = currentUser.role === 'garcom' || currentUser.role === 'gerente';

  const tableLabel = selectedTable ? `Mesa ${selectedTable.number}` : 'Comanda Balcão';

  const resetFlow = useCallback(() => {
    setStep('mesa');
    setSelectedTable(null);
    setDraftItems([]);
    setGeneralObservation('');
    setIsSuccess(false);
  }, []);

  const enqueueOrder = useCallback(() => {
    const queue = parseJson<QueuedComanda[]>(localStorage.getItem(queueKey), []);
    const payload: QueuedComanda = {
      id: `queue-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      tableNumber: selectedTable?.number,
      generalObservation: generalObservation.trim() || undefined,
      items: draftItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        observation: item.observation,
      })),
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(queueKey, JSON.stringify([...queue, payload]));
    setSyncMessage('Sem conexão — pedido salvo na fila local.');
    resetFlow();
  }, [queueKey, selectedTable?.number, generalObservation, draftItems, resetFlow]);

  const createOrderFromDraft = useCallback((items: ComandaDraftItem[], tableNumber?: number, extraObservation?: string): Order => {
    const nowIso = new Date().toISOString();
    const orderItems: OrderItem[] = items.map(item => ({
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      product: item.product,
      quantity: item.quantity,
      price: item.product.price,
      observation: [item.observation?.trim(), extraObservation?.trim()].filter(Boolean).join(' | ') || undefined,
      addedAt: nowIso,
      kitchenStatus: 'aguardando',
    }));

    const subtotal = orderItems.reduce((sum, item) => sum + item.quantity * item.price, 0);

    return {
      id: `comanda-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      empresaId: currentEmpresa.id,
      mode: tableNumber ? 'mesa' : 'balcao',
      origin: 'comanda_mobile',
      tableNumber,
      customerName: tableNumber ? `Mesa ${tableNumber}` : 'Balcão',
      items: orderItems,
      subtotal,
      serviceCharge: 0,
      total: subtotal,
      payments: [],
      status: 'open',
      waiterId: currentUser.id,
      timestamp: nowIso,
    };
  }, [currentEmpresa.id, currentUser.id]);

  const flushOfflineQueue = useCallback(() => {
    if (!isOnline) return;
    const queue = parseJson<QueuedComanda[]>(localStorage.getItem(queueKey), []);
    if (queue.length === 0) return;

    const productById = new Map<string, Product>(availableProducts.map(product => [product.id, product]));
    queue.forEach(entry => {
      const items: ComandaDraftItem[] = [];
      entry.items.forEach(item => {
        const product = productById.get(item.productId);
        if (!product) return;
        items.push({ product, quantity: item.quantity, observation: item.observation });
      });

      if (items.length > 0) {
        addOrder(createOrderFromDraft(items, entry.tableNumber, entry.generalObservation));
      }
    });

    localStorage.removeItem(queueKey);
    setSyncMessage(`${queue.length} pedido(s) offline sincronizado(s).`);
    window.setTimeout(() => setSyncMessage(''), 2500);
  }, [isOnline, queueKey, availableProducts, addOrder, createOrderFromDraft]);

  useEffect(() => {
    flushOfflineQueue();
  }, [flushOfflineQueue]);

  const handleIncrement = (product: Product) => {
    setDraftItems(prev => {
      const idx = prev.findIndex(item => item.product.id === product.id);
      if (idx === -1) {
        return [...prev, { product, quantity: 1 }];
      }
      const next = [...prev];
      next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
      return next;
    });
  };

  const handleDecrement = (productId: string) => {
    setDraftItems(prev => {
      const idx = prev.findIndex(item => item.product.id === productId);
      if (idx === -1) return prev;
      const next = [...prev];
      const current = next[idx];
      if (current.quantity <= 1) {
        next.splice(idx, 1);
        return next;
      }
      next[idx] = { ...current, quantity: current.quantity - 1 };
      return next;
    });
  };

  const handleSetObservation = (productId: string, observation: string) => {
    setDraftItems(prev => prev.map(item => item.product.id === productId ? { ...item, observation } : item));
  };

  const handleConfirmSend = () => {
    if (!isOnline) {
      enqueueOrder();
      return;
    }

    addOrder(createOrderFromDraft(draftItems, selectedTable?.number, generalObservation));
    setIsSuccess(true);
    window.setTimeout(() => {
      resetFlow();
      setSyncMessage('Pedido enviado para a cozinha.');
      window.setTimeout(() => setSyncMessage(''), 2000);
    }, 1100);
  };

  if (!canAccess) {
    return (
      <div className="h-screen w-full bg-app-base text-text flex items-center justify-center p-4">
        <div className="max-w-sm text-center space-y-2">
          <h2 className="text-lg font-semibold">Acesso restrito</h2>
          <p className="text-sm text-muted">A comanda mobile está disponível apenas para gerente e garçom.</p>
        </div>
      </div>
    );
  }

  if (!isMobile) {
    return (
      <div className="min-h-screen bg-app-base text-text p-6 flex items-center justify-center">
        <div className="max-w-md w-full rounded-panel border border-border bg-surface p-6 text-center space-y-4">
          <Smartphone className="w-10 h-10 text-accent mx-auto" />
          <h2 className="text-lg font-semibold">Acesse pelo smartphone</h2>
          <p className="text-sm text-muted">Abra esta URL no celular para usar a Comanda Mobile.</p>
          {desktopQr && <img src={desktopQr} alt="QR Code da Comanda Mobile" className="w-52 h-52 mx-auto rounded-panel" />}
          <p className="text-xs text-muted break-all">{comandaUrl}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-base text-text px-3 py-4">
      <div className="max-w-md mx-auto rounded-panel border border-border bg-surface p-4">
        {syncMessage && (
          <div className="mb-3 rounded-control border border-success/40 bg-success/10 p-2 text-xs text-success">
            {syncMessage}
          </div>
        )}

        {step === 'mesa' && (
          <ComandaMesaGrid
            tables={availableTables}
            onSelectTable={table => {
              setSelectedTable(table);
              setStep('lancamento');
            }}
            onSelectBalcao={() => {
              setSelectedTable(null);
              setStep('lancamento');
            }}
          />
        )}

        {step === 'lancamento' && (
          <ComandaLancamento
            tableLabel={tableLabel}
            products={availableProducts}
            items={draftItems}
            isOnline={isOnline}
            onBack={() => setStep('mesa')}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            onSetObservation={handleSetObservation}
            onProceed={() => setStep('confirmacao')}
            onSaveOffline={enqueueOrder}
          />
        )}

        {step === 'confirmacao' && (
          <ComandaConfirmacao
            tableLabel={tableLabel}
            items={draftItems}
            generalObservation={generalObservation}
            setGeneralObservation={setGeneralObservation}
            isOnline={isOnline}
            success={isSuccess}
            onBack={() => setStep('lancamento')}
            onConfirm={handleConfirmSend}
          />
        )}
      </div>
    </div>
  );
};
