import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product, Table, Order, Waiter, Expense, CashierSession, PaymentItem, Customer, Collaborator, StockMovement, StockItem, Supplier, AppSettings, Empresa, Usuario, Permission, DeliveryOrder, Entregador, MenuConfig, MenuDigitalConfig, Promotion, Combo, LoyaltyConfig, LoyaltyEntry, Campaign, OnlineOrder, OnlineOrderStatus } from '../types';
import { mockProducts, mockTables, mockWaiters, mockCustomers, mockCollaborators, mockStockItems, mockSuppliers, mockSettings } from './mock';
import { DEFAULT_EMPRESA_ID, buildScopedStorageKey, ensureEmpresaId, getSessionScopedExpenses, hasRolePermission, migrateLegacyCollection, normalizeImportedCollection, scopedCollections, validateImportEmpresaId } from '../domain/saas';

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
  closeCashier: (tipsTotal: number) => void;
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
  updateSettings: (settings: AppSettings) => void;
  toggleGuideRead: (guideId: string) => void;
  importData: (json: string) => void;
  exportData: () => string;
  resetToMocks: () => void;
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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Fase 1: sessão demo local. Na Fase 3, substituir por empresa/usuário vindos da autenticação real.
  const currentEmpresa: Empresa = {
    id: DEFAULT_EMPRESA_ID,
    empresaId: DEFAULT_EMPRESA_ID,
    name: 'Gestao Gastro Demo',
    document: '00.000.000/0001-00',
    plano: 'gestao',
    licenseStatus: 'active',
  };

  const currentUser: Usuario = {
    id: 'user-master-demo',
    empresaId: DEFAULT_EMPRESA_ID,
    name: 'Administrador Demo',
    email: 'admin@gestaogastro.local',
    role: 'master',
    active: true,
  };

  const [products, setProducts] = useState<Product[]>(() => parseScopedJSON('products', currentEmpresa.id, mockProducts, true));
  const [stockItems, setStockItems] = useState<StockItem[]>(() => parseScopedJSON('stockItems', currentEmpresa.id, mockStockItems, true));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => parseScopedJSON('suppliers', currentEmpresa.id, mockSuppliers, true));
  const [tables, setTables] = useState<Table[]>(() => {
    const saved = parseScopedJSON<Table[]>('tables', currentEmpresa.id, mockTables, true);
    return saved.length !== mockTables.length ? mockTables : saved;
  });
  const [waiters] = useState<Waiter[]>(() => parseScopedJSON('waiters', currentEmpresa.id, mockWaiters, true));
  const [orders, setOrders] = useState<Order[]>(() => parseScopedJSON('orders', currentEmpresa.id, [], true));
  const [draftOrder, setDraftOrderState] = useState<Order | null>(() => parseScopedJSON('draftOrder', currentEmpresa.id, null, true));
  const [expenses, setExpenses] = useState<Expense[]>(() => parseScopedJSON('expenses', currentEmpresa.id, [], true));
  const [cashierSession, setCashierSession] = useState<CashierSession | null>(() => parseScopedJSON('cashierSession', currentEmpresa.id, null, true));
  const [cashierHistory, setCashierHistory] = useState<CashierSession[]>(() => parseScopedJSON('cashierHistory', currentEmpresa.id, [], true));
  const [customers, setCustomers] = useState<Customer[]>(() => parseScopedJSON('customers', currentEmpresa.id, mockCustomers, true));
  const [collaborators, setCollaborators] = useState<Collaborator[]>(() => parseScopedJSON('collaborators', currentEmpresa.id, mockCollaborators, true));
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => parseScopedJSON('stockMovements', currentEmpresa.id, [], true));
  const [deliveryOrders, setDeliveryOrders] = useState<DeliveryOrder[]>(() => parseScopedJSON('deliveryOrders', currentEmpresa.id, [], true));
  const [entregadores, setEntregadores] = useState<Entregador[]>(() => parseScopedJSON('entregadores', currentEmpresa.id, [], true));
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
  const [onlineOrders, setOnlineOrders] = useState<OnlineOrder[]>(() => parseScopedJSON('online-orders', currentEmpresa.id, [], true));
  const [settings, setSettings] = useState<AppSettings>(() => parseScopedJSON('settings', currentEmpresa.id, mockSettings, true));
  const [readGuides, setReadGuides] = useState<string[]>(() => parseScopedJSON('readGuides', currentEmpresa.id, []));
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const th = parseJSON(buildScopedStorageKey('theme', currentEmpresa.id), parseJSON('theme', 'dark'));
    return th === 'dark' || th === 'light' ? th : 'dark';
  });

  useEffect(() => {
    localStorage.setItem(buildScopedStorageKey('products', currentEmpresa.id), JSON.stringify(products));
    localStorage.setItem(buildScopedStorageKey('stockItems', currentEmpresa.id), JSON.stringify(stockItems));
    localStorage.setItem(buildScopedStorageKey('suppliers', currentEmpresa.id), JSON.stringify(suppliers));
    localStorage.setItem(buildScopedStorageKey('tables', currentEmpresa.id), JSON.stringify(tables));
    localStorage.setItem(buildScopedStorageKey('waiters', currentEmpresa.id), JSON.stringify(waiters));
    localStorage.setItem(buildScopedStorageKey('orders', currentEmpresa.id), JSON.stringify(orders));
    localStorage.setItem(buildScopedStorageKey('draftOrder', currentEmpresa.id), JSON.stringify(draftOrder));
    localStorage.setItem(buildScopedStorageKey('expenses', currentEmpresa.id), JSON.stringify(expenses));
    localStorage.setItem(buildScopedStorageKey('cashierSession', currentEmpresa.id), JSON.stringify(cashierSession));
    localStorage.setItem(buildScopedStorageKey('cashierHistory', currentEmpresa.id), JSON.stringify(cashierHistory));
    localStorage.setItem(buildScopedStorageKey('customers', currentEmpresa.id), JSON.stringify(customers));
    localStorage.setItem(buildScopedStorageKey('collaborators', currentEmpresa.id), JSON.stringify(collaborators));
    localStorage.setItem(buildScopedStorageKey('stockMovements', currentEmpresa.id), JSON.stringify(stockMovements));
    localStorage.setItem(buildScopedStorageKey('deliveryOrders', currentEmpresa.id), JSON.stringify(deliveryOrders));
    localStorage.setItem(buildScopedStorageKey('entregadores', currentEmpresa.id), JSON.stringify(entregadores));
    localStorage.setItem(buildScopedStorageKey('menuConfig', currentEmpresa.id), JSON.stringify(menuConfig));
    localStorage.setItem(buildScopedStorageKey('promotions', currentEmpresa.id), JSON.stringify(promotions));
    localStorage.setItem(buildScopedStorageKey('combos', currentEmpresa.id), JSON.stringify(combos));
    localStorage.setItem(buildScopedStorageKey('loyaltyConfig', currentEmpresa.id), JSON.stringify(loyaltyConfig));
    localStorage.setItem(buildScopedStorageKey('loyaltyEntries', currentEmpresa.id), JSON.stringify(loyaltyEntries));
    localStorage.setItem(buildScopedStorageKey('campaigns', currentEmpresa.id), JSON.stringify(campaigns));
    localStorage.setItem(buildScopedStorageKey('online-orders', currentEmpresa.id), JSON.stringify(onlineOrders));
    localStorage.setItem(buildScopedStorageKey('settings', currentEmpresa.id), JSON.stringify(settings));
    localStorage.setItem(buildScopedStorageKey('readGuides', currentEmpresa.id), JSON.stringify(readGuides));
    localStorage.setItem(buildScopedStorageKey('theme', currentEmpresa.id), theme);
  }, [products, stockItems, suppliers, tables, waiters, orders, draftOrder, expenses, cashierSession, cashierHistory, customers, collaborators, stockMovements, deliveryOrders, entregadores, menuConfig, promotions, combos, loyaltyConfig, loyaltyEntries, campaigns, onlineOrders, settings, readGuides, theme, currentEmpresa.id]);

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

      if (data.products) setProducts(normalizeImportedCollection(data.products, currentEmpresa.id));
      if (data.stockItems) setStockItems(normalizeImportedCollection(data.stockItems, currentEmpresa.id));
      if (data.suppliers) setSuppliers(normalizeImportedCollection(data.suppliers, currentEmpresa.id));
      if (data.tables) setTables(normalizeImportedCollection(data.tables, currentEmpresa.id));
      if (data.orders) setOrders(normalizeImportedCollection(data.orders, currentEmpresa.id));
      if ('draftOrder' in data) setDraftOrderState(data.draftOrder ? ensureEmpresaId(data.draftOrder, currentEmpresa.id) : null);
      if (data.expenses) setExpenses(normalizeImportedCollection(data.expenses, currentEmpresa.id));
      if (data.cashierHistory) setCashierHistory(normalizeImportedCollection(data.cashierHistory, currentEmpresa.id));
      if (data.customers) setCustomers(normalizeImportedCollection(data.customers, currentEmpresa.id));
      if (data.collaborators) setCollaborators(normalizeImportedCollection(data.collaborators, currentEmpresa.id));
      if (data.stockMovements) setStockMovements(normalizeImportedCollection(data.stockMovements, currentEmpresa.id));
      if (data.deliveryOrders) setDeliveryOrders(normalizeImportedCollection(data.deliveryOrders, currentEmpresa.id));
      if (data.entregadores) setEntregadores(normalizeImportedCollection(data.entregadores, currentEmpresa.id));
      if (data.menuConfig) setMenuConfig(ensureEmpresaId(data.menuConfig, currentEmpresa.id));
      if (data.promotions) setPromotions(normalizeImportedCollection(data.promotions, currentEmpresa.id));
      if (data.combos) setCombos(normalizeImportedCollection(data.combos, currentEmpresa.id));
      if (data.loyaltyConfig) setLoyaltyConfig(ensureEmpresaId(data.loyaltyConfig, currentEmpresa.id));
      if (data.loyaltyEntries) setLoyaltyEntries(normalizeImportedCollection(data.loyaltyEntries, currentEmpresa.id));
      if (data.campaigns) setCampaigns(normalizeImportedCollection(data.campaigns, currentEmpresa.id));
      if (data.cashierSession) setCashierSession(ensureEmpresaId(data.cashierSession, currentEmpresa.id));
      if (data.settings) setSettings(ensureEmpresaId(data.settings, currentEmpresa.id));
      if (data.readGuides) setReadGuides(data.readGuides);
      alert('Dados importados com sucesso!');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao importar JSON. Verifique o formato.');
    }
  };

  const hasPermission = (permission: Permission) => hasRolePermission(currentUser.role, permission);

  const updateSettings = (newSettings: AppSettings) => setSettings(ensureEmpresaId(newSettings, currentEmpresa.id));

  const updateMenuConfig = (config: Partial<MenuConfig>) => {
    setMenuConfig(prev => ({ ...prev, ...config, empresaId: currentEmpresa.id }));
  };

  const toggleGuideRead = (guideId: string) => {
    setReadGuides(prev => 
      prev.includes(guideId) ? prev.filter(id => id !== guideId) : [...prev, guideId]
    );
  };

  const updateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? ensureEmpresaId(updatedProduct, currentEmpresa.id) : p));
  };

  const addProduct = (product: Product) => {
    setProducts(prev => [...prev, ensureEmpresaId(product, currentEmpresa.id)]);
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const updateProductMenuDigital = (productId: string, data: Partial<MenuDigitalConfig>) => {
    setProducts(prev => prev.map(product => {
      if (product.id !== productId) return product;
      return ensureEmpresaId({
        ...product,
        menuDigital: {
          visible: product.menuDigital?.visible ?? false,
          ...product.menuDigital,
          ...data,
        },
      }, currentEmpresa.id);
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

  const updateTable = (updatedTable: Table) => {
    setTables(prev => prev.map(t => t.number === updatedTable.number ? ensureEmpresaId(updatedTable, currentEmpresa.id) : t));
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
    setOrders(prev => [...prev, scopedOrder]);
    if (order.mode === 'mesa' && order.tableNumber) {
      setTables(prev => prev.map(t =>
        t.number === order.tableNumber ? { ...t, status: 'ocupada', activeOrderId: scopedOrder.id } : t
      ));
    }
  };

  const updateOrder = (updatedOrder: Order) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? ensureEmpresaId(updatedOrder, currentEmpresa.id) : o));
  };

  const deleteOrder = (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
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

    setOrders(prev => {
      const exists = prev.some(o => o.id === order.id);
      return exists
        ? prev.map(o => o.id === order.id ? closedOrder : o)
        : [...prev, closedOrder];
    });

    if (order.tableNumber) {
      setTables(prev => prev.map(t =>
        t.number === order.tableNumber ? { ...t, status: 'livre', activeOrderId: undefined } : t
      ));
    }

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
    setExpenses(prev => [...prev, ensureEmpresaId(expense, currentEmpresa.id)]);
  };

  const updateExpense = (updatedExpense: Expense) => {
    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? ensureEmpresaId(updatedExpense, currentEmpresa.id) : e));
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const openCashier = (initialBalance = 0) => {
    const newSession: CashierSession = {
      id: Date.now().toString(),
      empresaId: currentEmpresa.id,
      openedAt: new Date().toISOString(),
      initialBalance,
      salesTotal: 0,
      serviceTaxTotal: 0,
      expensesTotal: 0,
      tipsTotal: 0,
      ordersCount: 0,
      status: 'open',
    };
    setCashierSession(newSession);
  };

  const closeCashier = (tipsTotal: number) => {
    if (!cashierSession) return;
    const openedAt = new Date(cashierSession.openedAt).getTime();
    const belongsToCurrentSession = (timestamp: string, empresaId?: string) =>
      (empresaId || currentEmpresa.id) === currentEmpresa.id && new Date(timestamp).getTime() >= openedAt;

    const closedOrders = orders.filter(o => o.status === 'closed' && belongsToCurrentSession(o.timestamp, o.empresaId));
    const salesTotal = closedOrders.reduce((acc, o) => acc + o.subtotal, 0);
    const serviceTaxTotal = closedOrders.reduce((acc, o) => acc + o.serviceCharge, 0);
    const sessionExpenses = getSessionScopedExpenses(expenses, cashierSession.openedAt, currentEmpresa.id);
    const expensesTotal = sessionExpenses.reduce((acc, e) => acc + e.amount, 0);
    const finalBalance = cashierSession.initialBalance + salesTotal + serviceTaxTotal - expensesTotal + tipsTotal;
    const closedSession: CashierSession = {
      ...cashierSession,
      status: 'closed',
      closedAt: new Date().toISOString(),
      tipsTotal,
      salesTotal,
      serviceTaxTotal,
      expensesTotal,
      ordersCount: closedOrders.length,
      finalBalance,
    };
    setCashierHistory(prev => [...prev, closedSession]);
    setCashierSession(null);
    setOrders(prev => prev.filter(o => !(o.status === 'closed' && belongsToCurrentSession(o.timestamp, o.empresaId))));
    setExpenses(prev => prev.filter(e => !belongsToCurrentSession(e.timestamp, e.empresaId)));
  };

  const transferTable = (fromNumber: number, toNumber: number) => {
    const fromTable = tables.find(t => t.number === fromNumber);
    const toTable = tables.find(t => t.number === toNumber);
    
    if (!fromTable?.activeOrderId || toTable?.status !== 'livre') return;

    const orderId = fromTable.activeOrderId;

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, tableNumber: toNumber } : o));
    setTables(prev => prev.map(t => {
      if (t.number === fromNumber) return { ...t, status: 'livre', activeOrderId: undefined };
      if (t.number === toNumber) return { ...t, status: 'ocupada', activeOrderId: orderId };
      return t;
    }));
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

    setOrders(prev => prev
      .filter(o => o.id !== sourceOrder.id)
      .map(o => o.id === targetOrder.id ? updatedTargetOrder : o)
    );

    setTables(prev => prev.map(t => {
      if (t.number === sourceNumber) return { ...t, status: 'livre', activeOrderId: undefined };
      return t;
    }));
  };

  const reserveTable = (numbers: number[], reason: string) => {
    setTables(prev => prev.map(t => 
      numbers.includes(t.number) 
        ? { ...t, status: 'reservada', reservationReason: reason } 
        : t
    ));
  };

  const clearTable = (number: number) => {
    setTables(prev => prev.map(t => 
      t.number === number 
        ? { ...t, status: 'livre', activeOrderId: undefined, reservationReason: undefined } 
        : t
    ));
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
    setDeliveryOrders(prev => [...prev, ensureEmpresaId(order, currentEmpresa.id)]);
  };

  const updateDeliveryOrder = (updatedOrder: DeliveryOrder) => {
    setDeliveryOrders(prev => prev.map(order => order.id === updatedOrder.id ? ensureEmpresaId(updatedOrder, currentEmpresa.id) : order));
  };

  const cancelDeliveryOrder = (id: string) => {
    setDeliveryOrders(prev => prev.map(order => order.id === id ? { ...order, status: 'cancelado' } : order));
  };

  const addEntregador = (entregador: Entregador) => {
    setEntregadores(prev => [...prev, ensureEmpresaId(entregador, currentEmpresa.id)]);
  };

  const updateEntregador = (updatedEntregador: Entregador) => {
    setEntregadores(prev => prev.map(entregador => entregador.id === updatedEntregador.id ? ensureEmpresaId(updatedEntregador, currentEmpresa.id) : entregador));
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
    const now = new Date().toISOString();
    setOnlineOrders(prev => [...prev, {
      ...order,
      id: `online-order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      empresaId: currentEmpresa.id,
      createdAt: now,
      updatedAt: now,
    }]);
  };

  const updateOnlineOrderStatus = (id: string, status: OnlineOrderStatus, extra?: Partial<OnlineOrder>) => {
    const now = new Date().toISOString();
    setOnlineOrders(prev => prev.map(o =>
      o.id === id ? { ...o, ...extra, status, updatedAt: now } : o
    ));
  };

  const cancelOnlineOrder = (id: string, reason: string) => {
    const now = new Date().toISOString();
    setOnlineOrders(prev => prev.map(o =>
      o.id === id ? { ...o, status: 'cancelado', cancelReason: reason, canceledAt: now, updatedAt: now } : o
    ));
  };

  return (
    <AppContext.Provider value={{
      currentEmpresa, currentUser, products, stockItems, suppliers, tables, waiters, orders, draftOrder, expenses, cashierSession, cashierHistory, customers, collaborators, stockMovements, deliveryOrders, entregadores, menuConfig, promotions, combos, loyaltyConfig, loyaltyEntries, campaigns, onlineOrders, settings, readGuides, theme,
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
      addOnlineOrder, updateOnlineOrderStatus, cancelOnlineOrder,
      updateSettings, toggleGuideRead, importData, exportData, resetToMocks
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
