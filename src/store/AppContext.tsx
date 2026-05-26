import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product, Table, Order, Waiter, Expense, CashierSession, PaymentItem, Customer, Collaborator, StockMovement, StockItem, Supplier, AppSettings, Empresa, Usuario, Permission, DeliveryOrder, Entregador, MenuConfig, MenuDigitalConfig, Promotion, Combo, LoyaltyConfig, LoyaltyEntry, Campaign, OnlineOrder, OnlineOrderStatus, KitchenItemStatus } from '../types';
import { mockWaiters, mockCustomers, mockCollaborators, mockStockItems, mockSuppliers } from './mock';
import { buildScopedStorageKey, ensureEmpresaId, getSessionScopedExpenses, migrateLegacyCollection, normalizeImportedCollection, scopedCollections, validateImportEmpresaId } from '../domain/saas';
import { buildOnlineOrderStockAdjustments, getDeliveredOnlineOrdersInWindow, getOnlineSalesTotal } from '../services/onlineOrdersService';
import { useOrders } from '../hooks/useOrders';
import { useTables } from '../hooks/useTables';
import { useDelivery } from '../hooks/useDelivery';
import { useOnlineOrders } from '../hooks/useOnlineOrders';
import { useCashier } from '../hooks/useCashier';
import { useProducts } from '../hooks/useProducts';
import { useBase } from './AppBaseContext';
import type { CreateOrderInput, UpdateOrderInput } from '../services/ordersSupabaseService';
import { listClosedOrdersInWindow } from '../services/ordersSupabaseService';
import type { UpdateTableInput } from '../services/tablesSupabaseService';
import type { CreateDeliveryOrderInput, UpdateDeliveryOrderInput, CreateEntregadorInput } from '../services/deliverySupabaseService';
import type { CreateOnlineOrderInput, UpdateOnlineOrderStatusInput } from '../services/onlineOrdersSupabaseService';
import type { CreateExpenseInput, CloseSessionInput } from '../services/cashierSupabaseService';

interface AppState {
  currentEmpresa: Empresa;
  currentUser: Usuario;
  products: Product[];
  stockItems: StockItem[];
  suppliers: Supplier[];
  tables: Table[];
  waiters: Waiter[];
  orders: Order[];
  draftOrder: Order | null;
  expenses: Expense[];
  cashierSession: CashierSession | null;
  cashierHistory: CashierSession[];
  customers: Customer[];
  collaborators: Collaborator[];
  stockMovements: StockMovement[];
  deliveryOrders: DeliveryOrder[];
  entregadores: Entregador[];
  menuConfig: MenuConfig;
  promotions: Promotion[];
  combos: Combo[];
  loyaltyConfig: LoyaltyConfig;
  loyaltyEntries: LoyaltyEntry[];
  campaigns: Campaign[];
  onlineOrders: OnlineOrder[];
  settings: AppSettings;
  readGuides: string[];
  theme: 'dark' | 'light';
  ordersLoading: boolean;
  ordersError: string | null;
  tablesLoading: boolean;
  tablesError: string | null;
  deliveryLoading: boolean;
  deliveryError: string | null;
  onlineOrdersLoading: boolean;
  onlineOrdersError: string | null;
  cashierLoading: boolean;
  cashierError: string | null;
  productsLoading: boolean;
  productsError: string | null;
}

interface AppContextType extends AppState {
  hasPermission: (permission: Permission) => boolean;
  setTheme: (theme: 'dark' | 'light') => void;
  updateProduct: (product: Product) => void;
  addProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  updateStockItem: (item: StockItem) => void;
  addStockItem: (item: StockItem) => void;
  deleteStockItem: (id: string) => void;
  updateSupplier: (supplier: Supplier) => void;
  addSupplier: (supplier: Supplier) => void;
  deleteSupplier: (id: string) => void;
  updateTable: (table: Table) => void;
  updateOrder: (order: Order) => void;
  setDraftOrder: React.Dispatch<React.SetStateAction<Order | null>>;
  clearDraftOrder: () => void;
  deleteOrder: (id: string) => void;
  addOrder: (order: Order) => void;
  closeOrder: (order: Order, payments: PaymentItem[], serviceCharge: number) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  openCashier: (initialBalance?: number) => void;
  closeCashier: (tipsTotal: number, countedCash?: number) => void;
  transferTable: (from: number, to: number) => void;
  mergeTables: (source: number, target: number) => void;
  reserveTable: (numbers: number[], reason: string) => void;
  clearTable: (number: number) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  addCollaborator: (collaborator: Collaborator) => void;
  updateCollaborator: (collaborator: Collaborator) => void;
  deleteCollaborator: (id: string) => void;
  addStockMovement: (movement: StockMovement) => void;
  addDeliveryOrder: (order: DeliveryOrder) => void;
  updateDeliveryOrder: (order: DeliveryOrder) => void;
  cancelDeliveryOrder: (id: string) => void;
  addEntregador: (entregador: Entregador) => void;
  updateEntregador: (entregador: Entregador) => void;
  updateMenuConfig: (config: Partial<MenuConfig>) => void;
  updateProductMenuDigital: (productId: string, data: Partial<MenuDigitalConfig>) => void;
  addPromotion: (promotion: Omit<Promotion, 'id' | 'empresaId' | 'createdAt'>) => void;
  updatePromotion: (id: string, data: Partial<Promotion>) => void;
  deletePromotion: (id: string) => void;
  addCombo: (combo: Omit<Combo, 'id' | 'empresaId' | 'createdAt'>) => void;
  updateCombo: (id: string, data: Partial<Combo>) => void;
  deleteCombo: (id: string) => void;
  updateLoyaltyConfig: (config: Partial<LoyaltyConfig>) => void;
  addLoyaltyEntry: (entry: Omit<LoyaltyEntry, 'id' | 'empresaId' | 'createdAt'>) => void;
  addCampaign: (campaign: Omit<Campaign, 'id' | 'empresaId' | 'createdAt'>) => void;
  updateCampaign: (id: string, data: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
  addOnlineOrder: (order: Omit<OnlineOrder, 'id' | 'empresaId' | 'createdAt' | 'updatedAt'>) => void;
  updateOnlineOrderStatus: (id: string, status: OnlineOrderStatus, extra?: Partial<OnlineOrder>) => void;
  cancelOnlineOrder: (id: string, reason: string) => void;
  updateOrderItemKitchenStatus: (orderId: string, itemIndex: number, status: KitchenItemStatus) => void;
  applyOnlineOrderStockDeduction: (id: string) => void;
  registerOnlineSale: (id: string) => void;
  updateSettings: (settings: AppSettings) => void;
  toggleGuideRead: (guideId: string) => void;
  importData: (json: string) => void;
  exportData: () => string;
  resetToMocks: () => void;
  refreshOrders: () => Promise<void>;
  refreshTables: () => Promise<void>;
  refreshDelivery: () => Promise<void>;
  refreshOnlineOrders: () => Promise<void>;
  refreshCashier: () => Promise<void>;
  refreshProducts: () => Promise<void>;
}

const parseJSON = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    if (Array.isArray(parsed) && parsed.length === 0 && Array.isArray(fallback) && fallback.length > 0) {
      return fallback;
    }
    return parsed;
  } catch {
    return fallback;
  }
};

const parseScopedJSON = <T,>(key: string, empresaId: string, fallback: T, withEmpresa = false): T => {
  const scopedKey = buildScopedStorageKey(key, empresaId);
  const scoped = parseJSON<T | undefined>(scopedKey, undefined);
  if (scoped !== undefined) {
    if (withEmpresa && Array.isArray(scoped)) {
      return migrateLegacyCollection(scoped as Array<Record<string, unknown>>, empresaId).filter(item => item.empresaId === empresaId) as T;
    }
    if (withEmpresa && scoped && typeof scoped === 'object') {
      return ensureEmpresaId(scoped as Record<string, unknown>, empresaId) as T;
    }
    return scoped;
  }

  const legacy = parseJSON(key, fallback);
  if (!withEmpresa) return legacy;

  if (Array.isArray(legacy)) {
    return migrateLegacyCollection(legacy as Array<Record<string, unknown>>, empresaId).filter(item => item.empresaId === empresaId) as T;
  }

  if (legacy && typeof legacy === 'object') {
    return ensureEmpresaId(legacy as Record<string, unknown>, empresaId) as T;
  }

  return legacy;
};

const clearAppStorage = (empresaId: string) => {
  const prefix = `gestao-gastro:${empresaId}:`;
  const legacyKeys = [
    ...scopedCollections,
    'theme', 'viewMode_products',
    'viewMode_customers', 'viewMode_collaborators', 'viewMode_suppliers'
  ];
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(prefix) || legacyKeys.includes(key)) {
      localStorage.removeItem(key);
    }
  });
};

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: React.ReactNode
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const {
    currentEmpresa,
    currentUser,
    theme,
    setTheme,
    hasPermission,
    settings,
    updateSettings,
    readGuides,
    toggleGuideRead,
  } = useBase();
  const ordersHook = useOrders();
  const tablesHook = useTables();
  const deliveryHook = useDelivery();
  const onlineHook = useOnlineOrders();
  const cashierHook = useCashier();
  const productsHook = useProducts();
  const orders = ordersHook.openOrders;
  const tables = tablesHook.tables;
  const products = productsHook.products;
  const deliveryOrders = deliveryHook.deliveryOrders;
  const entregadores = deliveryHook.entregadores;
  const onlineOrders = onlineHook.onlineOrders;
  const cashierSession = cashierHook.cashierSession;
  const cashierHistory = cashierHook.cashierHistory;
  const expenses = cashierHook.expenses;

  const [stockItems, setStockItems] = useState<StockItem[]>(() => parseScopedJSON('stockItems', currentEmpresa.id, mockStockItems, true));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => parseScopedJSON('suppliers', currentEmpresa.id, mockSuppliers, true));
  const [waiters] = useState<Waiter[]>(() => parseScopedJSON('waiters', currentEmpresa.id, mockWaiters, true));
  const [draftOrder, setDraftOrderState] = useState<Order | null>(() => parseScopedJSON('draftOrder', currentEmpresa.id, null, true));
  const [customers, setCustomers] = useState<Customer[]>(() => parseScopedJSON('customers', currentEmpresa.id, mockCustomers, true));
  const [collaborators, setCollaborators] = useState<Collaborator[]>(() => parseScopedJSON('collaborators', currentEmpresa.id, mockCollaborators, true));
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => parseScopedJSON('stockMovements', currentEmpresa.id, [], true));
  const defaultMenuConfig: MenuConfig = {
    empresaId: currentEmpresa.id,
    accentColor: '#E07B4A',
    showPrices: true,
    allowCallWaiter: true,
  };
  const defaultLoyaltyConfig: LoyaltyConfig = {
    empresaId: currentEmpresa.id,
    active: false,
    pointsPerReal: 1,
    redeemThreshold: 100,
    redeemValue: 10,
  };
  const [menuConfig, setMenuConfig] = useState<MenuConfig>(() => parseScopedJSON('menuConfig', currentEmpresa.id, defaultMenuConfig, true));
  const [promotions, setPromotions] = useState<Promotion[]>(() => parseScopedJSON('promotions', currentEmpresa.id, [], true));
  const [combos, setCombos] = useState<Combo[]>(() => parseScopedJSON('combos', currentEmpresa.id, [], true));
  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig>(() => parseScopedJSON('loyaltyConfig', currentEmpresa.id, defaultLoyaltyConfig, true));
  const [loyaltyEntries, setLoyaltyEntries] = useState<LoyaltyEntry[]>(() => parseScopedJSON('loyaltyEntries', currentEmpresa.id, [], true));
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => parseScopedJSON('campaigns', currentEmpresa.id, [], true));

  useEffect(() => {
    localStorage.setItem(buildScopedStorageKey('stockItems', currentEmpresa.id), JSON.stringify(stockItems));
    localStorage.setItem(buildScopedStorageKey('suppliers', currentEmpresa.id), JSON.stringify(suppliers));
    localStorage.setItem(buildScopedStorageKey('waiters', currentEmpresa.id), JSON.stringify(waiters));
    localStorage.setItem(buildScopedStorageKey('draftOrder', currentEmpresa.id), JSON.stringify(draftOrder));
    localStorage.setItem(buildScopedStorageKey('customers', currentEmpresa.id), JSON.stringify(customers));
    localStorage.setItem(buildScopedStorageKey('collaborators', currentEmpresa.id), JSON.stringify(collaborators));
    localStorage.setItem(buildScopedStorageKey('stockMovements', currentEmpresa.id), JSON.stringify(stockMovements));
    localStorage.setItem(buildScopedStorageKey('menuConfig', currentEmpresa.id), JSON.stringify(menuConfig));
    localStorage.setItem(buildScopedStorageKey('promotions', currentEmpresa.id), JSON.stringify(promotions));
    localStorage.setItem(buildScopedStorageKey('combos', currentEmpresa.id), JSON.stringify(combos));
    localStorage.setItem(buildScopedStorageKey('loyaltyConfig', currentEmpresa.id), JSON.stringify(loyaltyConfig));
    localStorage.setItem(buildScopedStorageKey('loyaltyEntries', currentEmpresa.id), JSON.stringify(loyaltyEntries));
    localStorage.setItem(buildScopedStorageKey('campaigns', currentEmpresa.id), JSON.stringify(campaigns));
  }, [stockItems, suppliers, waiters, draftOrder, customers, collaborators, stockMovements, menuConfig, promotions, combos, loyaltyConfig, loyaltyEntries, campaigns, currentEmpresa.id]);

  const resetToMocks = () => {
    clearAppStorage(currentEmpresa.id);
    window.location.reload();
  };

  const exportData = () => {
    const data = {
      empresaId: currentEmpresa.id,
      products, stockItems, suppliers, tables, waiters, orders, draftOrder, expenses, 
      cashierSession, cashierHistory, customers, collaborators, stockMovements, deliveryOrders, entregadores, menuConfig, promotions, combos, loyaltyConfig, loyaltyEntries, campaigns, settings, readGuides
    };
    return JSON.stringify(data, null, 2);
  };

  const importData = (json: string) => {
    try {
      const data = JSON.parse(json);
      validateImportEmpresaId(data, currentEmpresa.id);

      if (data.stockItems) setStockItems(normalizeImportedCollection(data.stockItems, currentEmpresa.id));
      if (data.suppliers) setSuppliers(normalizeImportedCollection(data.suppliers, currentEmpresa.id));
      if ('draftOrder' in data) setDraftOrderState(data.draftOrder ? ensureEmpresaId(data.draftOrder, currentEmpresa.id) : null);
      if (data.customers) setCustomers(normalizeImportedCollection(data.customers, currentEmpresa.id));
      if (data.collaborators) setCollaborators(normalizeImportedCollection(data.collaborators, currentEmpresa.id));
      if (data.stockMovements) setStockMovements(normalizeImportedCollection(data.stockMovements, currentEmpresa.id));
      if (data.menuConfig) setMenuConfig(ensureEmpresaId(data.menuConfig, currentEmpresa.id));
      if (data.promotions) setPromotions(normalizeImportedCollection(data.promotions, currentEmpresa.id));
      if (data.combos) setCombos(normalizeImportedCollection(data.combos, currentEmpresa.id));
      if (data.loyaltyConfig) setLoyaltyConfig(ensureEmpresaId(data.loyaltyConfig, currentEmpresa.id));
      if (data.loyaltyEntries) setLoyaltyEntries(normalizeImportedCollection(data.loyaltyEntries, currentEmpresa.id));
      if (data.campaigns) setCampaigns(normalizeImportedCollection(data.campaigns, currentEmpresa.id));
      if (data.settings) updateSettings(ensureEmpresaId(data.settings, currentEmpresa.id));
      alert('Dados importados com sucesso!');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao importar JSON. Verifique o formato.');
    }
  };

  const updateMenuConfig = (config: Partial<MenuConfig>) => {
    setMenuConfig(prev => ({ ...prev, ...config, empresaId: currentEmpresa.id }));
  };

  const updateProduct = (updatedProduct: Product) => {
    runOperationalTask(() => productsHook.updateProduct(updatedProduct.id, updatedProduct));
  };

  const addProduct = (product: Product) => {
    runOperationalTask(() => productsHook.createProduct(product));
  };

  const deleteProduct = (id: string) => {
    runOperationalTask(() => productsHook.deleteProduct(id));
  };

  const updateProductMenuDigital = (productId: string, data: Partial<MenuDigitalConfig>) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    runOperationalTask(() => productsHook.updateProduct(productId, {
      menuDigital: {
        visible: product.menuDigital?.visible ?? false,
        ...product.menuDigital,
        ...data,
      },
    }));
  };

  const updateStockItem = (updatedItem: StockItem) => {
    setStockItems(prev => prev.map(i => i.id === updatedItem.id ? ensureEmpresaId(updatedItem, currentEmpresa.id) : i));
  };

  const addStockItem = (item: StockItem) => {
    setStockItems(prev => [...prev, ensureEmpresaId(item, currentEmpresa.id)]);
  };

  const deleteStockItem = (id: string) => {
    setStockItems(prev => prev.filter(i => i.id !== id));
  };

  const updateSupplier = (updatedSupplier: Supplier) => {
    setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? ensureEmpresaId(updatedSupplier, currentEmpresa.id) : s));
  };

  const addSupplier = (supplier: Supplier) => {
    setSuppliers(prev => [...prev, ensureEmpresaId(supplier, currentEmpresa.id)]);
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  const runOperationalTask = (task: () => Promise<void>) => {
    void task();
  };

  const toCreateOrderInput = (order: Order): CreateOrderInput => {
    const { id: _id, empresaId: _empresaId, createdAt: _createdAt, updatedAt: _updatedAt, ...input } = order;
    void _id;
    void _empresaId;
    void _createdAt;
    void _updatedAt;
    return input;
  };

  const toUpdateOrderInput = (order: Order): UpdateOrderInput => {
    const { id: _id, empresaId: _empresaId, createdAt: _createdAt, updatedAt: _updatedAt, ...input } = order;
    void _id;
    void _empresaId;
    void _createdAt;
    void _updatedAt;
    return input;
  };

  const updateTable = (updatedTable: Table) => {
    const tableInput: UpdateTableInput = ensureEmpresaId(updatedTable, currentEmpresa.id);
    runOperationalTask(() => tablesHook.updateTable(updatedTable.number, tableInput));
  };

  const setDraftOrder: React.Dispatch<React.SetStateAction<Order | null>> = value => {
    setDraftOrderState(prev => {
      const next = typeof value === 'function'
        ? (value as (previous: Order | null) => Order | null)(prev)
        : value;
      return next ? ensureEmpresaId(next, currentEmpresa.id) : null;
    });
  };

  const clearDraftOrder = () => {
    setDraftOrderState(null);
  };

  const addOrder = (order: Order) => {
    const scopedOrder = ensureEmpresaId(order, currentEmpresa.id);
    runOperationalTask(async () => {
      const created = await ordersHook.createOrder(toCreateOrderInput(scopedOrder));
      if (created.mode === 'mesa' && created.tableNumber) {
        await tablesHook.setOccupied(created.tableNumber, created.id);
      }
    });
  };

  const updateOrder = (updatedOrder: Order) => {
    const scopedOrder = ensureEmpresaId(updatedOrder, currentEmpresa.id);
    runOperationalTask(() => ordersHook.updateOrder(scopedOrder.id, toUpdateOrderInput(scopedOrder)));
  };

  const deleteOrder = (id: string) => {
    runOperationalTask(() => ordersHook.deleteOrder(id));
  };

  const closeOrder = (order: Order, payments: PaymentItem[], serviceCharge: number) => {
    const closedOrder: Order = {
      ...order,
      empresaId: order.empresaId || currentEmpresa.id,
      payments,
      serviceCharge,
      status: 'closed',
      total: Math.max(0, order.subtotal + serviceCharge - (order.loyaltyDiscount || 0)),
    };

    runOperationalTask(async () => {
      await ordersHook.closeOrder(order.id, {
        payments,
        serviceCharge,
        total: closedOrder.total,
        loyaltyDiscount: closedOrder.loyaltyDiscount,
        loyaltyPointsEarned: closedOrder.loyaltyPointsEarned,
        loyaltyPointsRedeemed: closedOrder.loyaltyPointsRedeemed,
      });
      if (order.tableNumber) {
        await tablesHook.clear(order.tableNumber);
      }
    });

    setStockItems(prevStock => {
      const nextStock = [...prevStock];
      const newMovements: StockMovement[] = [];
      
      order.items.forEach(item => {
        const recipe = item.product.recipe;
        if (recipe && recipe.length > 0) {
          recipe.forEach(recipeItem => {
            const idx = nextStock.findIndex(si => si.id === recipeItem.stockItemId);
            if (idx !== -1) {
              const quantityToAbate = recipeItem.quantity * item.quantity;
              nextStock[idx] = { 
                ...nextStock[idx], 
                currentStock: Math.max(0, nextStock[idx].currentStock - quantityToAbate) 
              };
              
              newMovements.push({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                empresaId: currentEmpresa.id,
                stockItemId: recipeItem.stockItemId,
                type: 'out',
                quantity: quantityToAbate,
                unitCost: nextStock[idx].costPrice,
                reason: `Venda - ${item.product.name} (Ficha Técnica)`,
                timestamp: new Date().toISOString()
              });
            }
          });
        }
      });
      
      if (newMovements.length > 0) {
        setStockMovements(prevMovements => [...prevMovements, ...newMovements]);
      }
      
      return nextStock;
    });

    if (order.customerId) {
      setCustomers(prev => prev.map(c => 
        c.id === order.customerId 
          ? { 
              ...c, 
              totalSpent: c.totalSpent + order.subtotal, 
              loyaltyPoints: c.loyaltyPoints + (order.loyaltyPointsEarned ?? Math.floor(order.subtotal / 10)) - (order.loyaltyPointsRedeemed || 0),
              lastVisit: new Date().toISOString()
            } 
          : c
      ));
    }
  };

  const addExpense = (expense: Expense) => {
    const { id: _id, empresaId: _emp, ...input } = expense;
    void _id;
    void _emp;
    runOperationalTask(() => cashierHook.addExpense(input as CreateExpenseInput));
  };

  const updateExpense = (updatedExpense: Expense) => {
    runOperationalTask(() => cashierHook.updateExpense(updatedExpense.id, updatedExpense));
  };

  const deleteExpense = (id: string) => {
    runOperationalTask(() => cashierHook.deleteExpense(id));
  };

  const openCashier = (initialBalance = 0) => {
    runOperationalTask(() => cashierHook.openCashier(initialBalance));
  };

  // CAI-001/002/003: closeCashier expandido para incluir delivery, suprimentos e contagem física
  const closeCashier = (tipsTotal: number, countedCash?: number) => {
    if (!cashierHook.cashierSession) return;
    const session = cashierHook.cashierSession;

    runOperationalTask(async () => {
      // Buscar pedidos de mesa/balcao fechados na janela da sessao via Supabase
      const closedOrders = await listClosedOrdersInWindow(currentEmpresa.id, session.openedAt);

      // CAI-002: Pedidos online entregues na janela da sessao
      const deliveredOnlineOrders = getDeliveredOnlineOrdersInWindow(onlineOrders, session.openedAt);
      const onlineSalesTotal = getOnlineSalesTotal(deliveredOnlineOrders);

      // CAI-002: Pedidos de delivery entregues na janela da sessao
      const openedAtMs = new Date(session.openedAt).getTime();
      const deliveredDeliveryOrders = deliveryOrders.filter(
        d => d.status === 'entregue' && d.empresaId === currentEmpresa.id && new Date(d.createdAt).getTime() >= openedAtMs
      );
      const deliverySalesTotal = deliveredDeliveryOrders.reduce((acc, d) => acc + d.total, 0);

      const salesTotal = closedOrders.reduce((acc, o) => acc + o.subtotal, 0) + onlineSalesTotal + deliverySalesTotal;
      const serviceTaxTotal = closedOrders.reduce((acc, o) => acc + o.serviceCharge, 0);

      // CAI-003: suprimentos (entryType='entrada') somam ao saldo; saidas subtraem
      const sessionExpenses = getSessionScopedExpenses(expenses, session.openedAt, currentEmpresa.id);
      const expensesTotal = sessionExpenses.reduce((acc, e) => {
        return e.entryType === 'entrada' ? acc - e.amount : acc + e.amount;
      }, 0);

      const finalBalance = session.initialBalance + salesTotal + serviceTaxTotal - expensesTotal + tipsTotal;
      const cashBreakdown = countedCash !== undefined ? countedCash - finalBalance : undefined;

      const input: CloseSessionInput = {
        salesTotal,
        serviceTaxTotal,
        expensesTotal,
        tipsTotal,
        ordersCount: closedOrders.length + deliveredOnlineOrders.length + deliveredDeliveryOrders.length,
        finalBalance,
        countedCash,
        cashBreakdown,
      };

      await cashierHook.closeCashier(input);
    });
  };

  const transferTable = (fromNumber: number, toNumber: number) => {
    const fromTable = tables.find(t => t.number === fromNumber);
    const toTable = tables.find(t => t.number === toNumber);
    
    if (!fromTable?.activeOrderId || toTable?.status !== 'livre') return;

    const orderId = fromTable.activeOrderId;

    runOperationalTask(async () => {
      await ordersHook.updateOrder(orderId, { tableNumber: toNumber });
      await tablesHook.transfer(fromNumber, toNumber, orderId);
    });
  };

  const mergeTables = (sourceNumber: number, targetNumber: number) => {
    const sourceTable = tables.find(t => t.number === sourceNumber);
    const targetTable = tables.find(t => t.number === targetNumber);

    if (!sourceTable?.activeOrderId || !targetTable?.activeOrderId) return;

    const sourceOrder = orders.find(o => o.id === sourceTable.activeOrderId);
    const targetOrder = orders.find(o => o.id === targetTable.activeOrderId);

    if (!sourceOrder || !targetOrder) return;

    const combinedItems = [...targetOrder.items];
    sourceOrder.items.forEach(sItem => {
      const existingIdx = combinedItems.findIndex(tItem => tItem.product.id === sItem.product.id);
      if (existingIdx !== -1) {
        combinedItems[existingIdx] = { 
          ...combinedItems[existingIdx], 
          quantity: combinedItems[existingIdx].quantity + sItem.quantity 
        };
      } else {
        combinedItems.push({ ...sItem, id: Date.now().toString() + Math.random() });
      }
    });

    const subtotal = combinedItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const updatedTargetOrder = { 
      ...targetOrder, 
      items: combinedItems, 
      subtotal, 
      total: subtotal 
    };

    runOperationalTask(async () => {
      await ordersHook.updateOrder(targetOrder.id, toUpdateOrderInput(updatedTargetOrder));
      await ordersHook.deleteOrder(sourceOrder.id);
      await tablesHook.clear(sourceNumber);
    });
  };

  const reserveTable = (numbers: number[], reason: string) => {
    runOperationalTask(() => tablesHook.reserve(numbers, reason));
  };

  const clearTable = (number: number) => {
    runOperationalTask(() => tablesHook.clear(number));
  };

  const addCustomer = (customer: Customer) => {
    setCustomers(prev => [...prev, ensureEmpresaId(customer, currentEmpresa.id)]);
  };

  const updateCustomer = (updatedCustomer: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? ensureEmpresaId(updatedCustomer, currentEmpresa.id) : c));
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
  };

  const addCollaborator = (collaborator: Collaborator) => {
    setCollaborators(prev => [...prev, ensureEmpresaId(collaborator, currentEmpresa.id)]);
  };

  const updateCollaborator = (updatedCollaborator: Collaborator) => {
    setCollaborators(prev => prev.map(c => c.id === updatedCollaborator.id ? ensureEmpresaId(updatedCollaborator, currentEmpresa.id) : c));
  };

  const deleteCollaborator = (id: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== id));
  };

  const addStockMovement = (movement: StockMovement) => {
    setStockMovements(prev => [...prev, ensureEmpresaId(movement, currentEmpresa.id)]);
  };

  const addDeliveryOrder = (order: DeliveryOrder) => {
    const { id: _id, empresaId: _emp, createdAt: _ca, ...input } = order;
    void _id;
    void _emp;
    void _ca;
    runOperationalTask(() => deliveryHook.createOrder(input as CreateDeliveryOrderInput));
  };

  const updateDeliveryOrder = (updatedOrder: DeliveryOrder) => {
    const { id, empresaId: _emp, createdAt: _ca, ...input } = updatedOrder;
    void _emp;
    void _ca;
    runOperationalTask(() => deliveryHook.updateOrder(id, input as UpdateDeliveryOrderInput));
  };

  const cancelDeliveryOrder = (id: string) => {
    runOperationalTask(() => deliveryHook.cancelOrder(id, ''));
  };

  const addEntregador = (entregador: Entregador) => {
    const { id: _id, empresaId: _emp, createdAt: _ca, ...input } = entregador;
    void _id;
    void _emp;
    void _ca;
    runOperationalTask(() => deliveryHook.createEntregador(input as CreateEntregadorInput));
  };

  const updateEntregador = (updatedEntregador: Entregador) => {
    runOperationalTask(() => deliveryHook.updateEntregador(updatedEntregador.id, updatedEntregador));
  };

  const addPromotion = (promotion: Omit<Promotion, 'id' | 'empresaId' | 'createdAt'>) => {
    setPromotions(prev => [...prev, {
      ...promotion,
      id: `promotion-${Date.now()}`,
      empresaId: currentEmpresa.id,
      createdAt: new Date().toISOString(),
    }]);
  };

  const updatePromotion = (id: string, data: Partial<Promotion>) => {
    setPromotions(prev => prev.map(promotion => promotion.id === id ? ensureEmpresaId({ ...promotion, ...data }, currentEmpresa.id) : promotion));
  };

  const deletePromotion = (id: string) => {
    setPromotions(prev => prev.filter(promotion => promotion.id !== id));
    setCampaigns(prev => prev.filter(campaign => campaign.promotionId !== id));
  };

  const addCombo = (combo: Omit<Combo, 'id' | 'empresaId' | 'createdAt'>) => {
    setCombos(prev => [...prev, {
      ...combo,
      id: `combo-${Date.now()}`,
      empresaId: currentEmpresa.id,
      createdAt: new Date().toISOString(),
    }]);
  };

  const updateCombo = (id: string, data: Partial<Combo>) => {
    setCombos(prev => prev.map(combo => combo.id === id ? ensureEmpresaId({ ...combo, ...data }, currentEmpresa.id) : combo));
  };

  const deleteCombo = (id: string) => {
    setCombos(prev => prev.filter(combo => combo.id !== id));
  };

  const updateLoyaltyConfig = (config: Partial<LoyaltyConfig>) => {
    setLoyaltyConfig(prev => ({ ...prev, ...config, empresaId: currentEmpresa.id }));
  };

  const addLoyaltyEntry = (entry: Omit<LoyaltyEntry, 'id' | 'empresaId' | 'createdAt'>) => {
    setLoyaltyEntries(prev => [...prev, {
      ...entry,
      id: `loyalty-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      empresaId: currentEmpresa.id,
      createdAt: new Date().toISOString(),
    }]);
  };

  const addCampaign = (campaign: Omit<Campaign, 'id' | 'empresaId' | 'createdAt'>) => {
    setCampaigns(prev => [...prev, {
      ...campaign,
      id: `campaign-${Date.now()}`,
      empresaId: currentEmpresa.id,
      createdAt: new Date().toISOString(),
    }]);
  };

  const updateCampaign = (id: string, data: Partial<Campaign>) => {
    setCampaigns(prev => prev.map(campaign => campaign.id === id ? ensureEmpresaId({ ...campaign, ...data }, currentEmpresa.id) : campaign));
  };

  const deleteCampaign = (id: string) => {
    setCampaigns(prev => prev.filter(campaign => campaign.id !== id));
  };

  const addOnlineOrder = (order: Omit<OnlineOrder, 'id' | 'empresaId' | 'createdAt' | 'updatedAt'>) => {
    runOperationalTask(() => onlineHook.createOrder(order as CreateOnlineOrderInput));
  };

  const updateOnlineOrderStatus = (id: string, status: OnlineOrderStatus, extra?: Partial<OnlineOrder>) => {
    runOperationalTask(() => onlineHook.updateStatus(id, { status, ...extra } as UpdateOnlineOrderStatusInput));
  };

  const cancelOnlineOrder = (id: string, reason: string) => {
    runOperationalTask(() => onlineHook.cancelOrder(id, reason));
  };

  const updateOrderItemKitchenStatus = (orderId: string, itemIndex: number, status: KitchenItemStatus) => {
    const order = orders.find(item => item.id === orderId);

    if (order) {
      const updatedItems = order.items.map((item, index) =>
        index === itemIndex
          ? { ...item, kitchenStatus: status, addedAt: item.addedAt ?? order.timestamp }
          : item
      );
      runOperationalTask(() => ordersHook.updateOrderItems(orderId, updatedItems));
    }

    const deliveryOrder = deliveryOrders.find(o => o.id === orderId);
    if (deliveryOrder) {
      const updatedItems = deliveryOrder.items.map((item, index) =>
        index === itemIndex ? { ...item, kitchenStatus: status, addedAt: item.addedAt ?? deliveryOrder.createdAt } : item
      );
      runOperationalTask(() => deliveryHook.updateOrder(orderId, { items: updatedItems } as UpdateDeliveryOrderInput));
    }

    const onlineOrder = onlineOrders.find(o => o.id === orderId);
    if (onlineOrder) {
      const updatedItems = onlineOrder.items.map((item, index) =>
        index === itemIndex ? { ...item, kitchenStatus: status, addedAt: item.addedAt ?? onlineOrder.createdAt } : item
      );
      runOperationalTask(() => onlineHook.updateStatus(orderId, {
        status: onlineOrder.status,
        items: updatedItems,
      } as UpdateOnlineOrderStatusInput));
    }
  };

  const applyOnlineOrderStockDeduction = (id: string) => {
    const order = onlineOrders.find(item => item.id === id);
    if (!order || order.stockDeductedAt) return;

    const timestamp = new Date().toISOString();
    let movements: StockMovement[] = [];

    setStockItems(prev => {
      const result = buildOnlineOrderStockAdjustments(order, prev, currentEmpresa.id, timestamp);
      movements = result.movements;
      return result.updatedStockItems;
    });

    if (movements.length > 0) {
      setStockMovements(prev => [...prev, ...movements]);
    }

    runOperationalTask(() => onlineHook.markStockDeducted(id));
  };

  const registerOnlineSale = (id: string) => {
    const order = onlineOrders.find(item => item.id === id);
    if (!order || order.cashierRecordedAt) return;

    runOperationalTask(() => onlineHook.markCashierRecorded(id));
  };

  return (
    <AppContext.Provider value={{
      currentEmpresa, currentUser, products, stockItems, suppliers, tables, waiters, orders, draftOrder, expenses, cashierSession, cashierHistory, customers, collaborators, stockMovements, deliveryOrders, entregadores, menuConfig, promotions, combos, loyaltyConfig, loyaltyEntries, campaigns, onlineOrders, settings, readGuides, theme,
      ordersLoading: ordersHook.loading,
      ordersError: ordersHook.error,
      tablesLoading: tablesHook.loading,
      tablesError: tablesHook.error,
      deliveryLoading: deliveryHook.loading,
      deliveryError: deliveryHook.error,
      onlineOrdersLoading: onlineHook.loading,
      onlineOrdersError: onlineHook.error,
      cashierLoading: cashierHook.loading,
      cashierError: cashierHook.error,
      productsLoading: productsHook.loading,
      productsError: productsHook.error,
      hasPermission, setTheme, updateProduct, addProduct, deleteProduct, 
      updateStockItem, addStockItem, deleteStockItem,
      updateSupplier, addSupplier, deleteSupplier,
      updateTable, addOrder, updateOrder, setDraftOrder, clearDraftOrder, deleteOrder, closeOrder, addExpense, updateExpense, deleteExpense, openCashier, closeCashier,
      transferTable, mergeTables, reserveTable, clearTable,
      addCustomer, updateCustomer, deleteCustomer,
      addCollaborator, updateCollaborator, deleteCollaborator,
      addStockMovement,
      addDeliveryOrder, updateDeliveryOrder, cancelDeliveryOrder, addEntregador, updateEntregador,
      updateMenuConfig, updateProductMenuDigital,
      addPromotion, updatePromotion, deletePromotion,
      addCombo, updateCombo, deleteCombo,
      updateLoyaltyConfig, addLoyaltyEntry,
      addCampaign, updateCampaign, deleteCampaign,
      addOnlineOrder, updateOnlineOrderStatus, cancelOnlineOrder, updateOrderItemKitchenStatus, applyOnlineOrderStockDeduction, registerOnlineSale,
      updateSettings, toggleGuideRead, importData, exportData, resetToMocks,
      refreshOrders: ordersHook.refresh,
      refreshTables: tablesHook.refresh,
      refreshDelivery: deliveryHook.refresh,
      refreshOnlineOrders: onlineHook.refresh,
      refreshCashier: cashierHook.refresh,
      refreshProducts: productsHook.refresh,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

export { useBase } from './AppBaseContext';
