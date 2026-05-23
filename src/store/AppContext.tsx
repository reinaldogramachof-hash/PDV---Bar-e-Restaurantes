import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product, Table, Order, Waiter, Expense, CashierSession, PaymentItem, Customer, Collaborator, StockMovement, StockItem, Supplier, AppSettings, Empresa, Usuario, Permission } from '../types';
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
  expenses: Expense[];
  cashierSession: CashierSession | null;
  cashierHistory: CashierSession[];
  customers: Customer[];
  collaborators: Collaborator[];
  stockMovements: StockMovement[];
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
  addOrder: (order: Order) => void;
  closeOrder: (order: Order, payments: PaymentItem[], serviceCharge: number) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  openCashier: () => void;
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
  const [expenses, setExpenses] = useState<Expense[]>(() => parseScopedJSON('expenses', currentEmpresa.id, [], true));
  const [cashierSession, setCashierSession] = useState<CashierSession | null>(() => parseScopedJSON('cashierSession', currentEmpresa.id, null, true));
  const [cashierHistory, setCashierHistory] = useState<CashierSession[]>(() => parseScopedJSON('cashierHistory', currentEmpresa.id, [], true));
  const [customers, setCustomers] = useState<Customer[]>(() => parseScopedJSON('customers', currentEmpresa.id, mockCustomers, true));
  const [collaborators, setCollaborators] = useState<Collaborator[]>(() => parseScopedJSON('collaborators', currentEmpresa.id, mockCollaborators, true));
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => parseScopedJSON('stockMovements', currentEmpresa.id, [], true));
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
    localStorage.setItem(buildScopedStorageKey('expenses', currentEmpresa.id), JSON.stringify(expenses));
    localStorage.setItem(buildScopedStorageKey('cashierSession', currentEmpresa.id), JSON.stringify(cashierSession));
    localStorage.setItem(buildScopedStorageKey('cashierHistory', currentEmpresa.id), JSON.stringify(cashierHistory));
    localStorage.setItem(buildScopedStorageKey('customers', currentEmpresa.id), JSON.stringify(customers));
    localStorage.setItem(buildScopedStorageKey('collaborators', currentEmpresa.id), JSON.stringify(collaborators));
    localStorage.setItem(buildScopedStorageKey('stockMovements', currentEmpresa.id), JSON.stringify(stockMovements));
    localStorage.setItem(buildScopedStorageKey('settings', currentEmpresa.id), JSON.stringify(settings));
    localStorage.setItem(buildScopedStorageKey('readGuides', currentEmpresa.id), JSON.stringify(readGuides));
    localStorage.setItem(buildScopedStorageKey('theme', currentEmpresa.id), theme);
  }, [products, stockItems, suppliers, tables, waiters, orders, expenses, cashierSession, cashierHistory, customers, collaborators, stockMovements, settings, readGuides, theme, currentEmpresa.id]);

  const resetToMocks = () => {
    clearAppStorage(currentEmpresa.id);
    window.location.reload();
  };

  const exportData = () => {
    const data = {
      empresaId: currentEmpresa.id,
      products, stockItems, suppliers, tables, waiters, orders, expenses, 
      cashierSession, cashierHistory, customers, collaborators, stockMovements, settings, readGuides
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
      if (data.expenses) setExpenses(normalizeImportedCollection(data.expenses, currentEmpresa.id));
      if (data.cashierHistory) setCashierHistory(normalizeImportedCollection(data.cashierHistory, currentEmpresa.id));
      if (data.customers) setCustomers(normalizeImportedCollection(data.customers, currentEmpresa.id));
      if (data.collaborators) setCollaborators(normalizeImportedCollection(data.collaborators, currentEmpresa.id));
      if (data.stockMovements) setStockMovements(normalizeImportedCollection(data.stockMovements, currentEmpresa.id));
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

  const closeOrder = (order: Order, payments: PaymentItem[], serviceCharge: number) => {
    const closedOrder: Order = {
      ...order,
      empresaId: order.empresaId || currentEmpresa.id,
      payments,
      serviceCharge,
      status: 'closed',
      total: order.subtotal + serviceCharge,
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
              loyaltyPoints: c.loyaltyPoints + Math.floor(order.subtotal / 10),
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

  const openCashier = () => {
    const newSession: CashierSession = {
      id: Date.now().toString(),
      empresaId: currentEmpresa.id,
      openedAt: new Date().toISOString(),
      initialBalance: 0,
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
    const finalBalance = salesTotal + serviceTaxTotal - expensesTotal + tipsTotal;
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

  return (
    <AppContext.Provider value={{
      currentEmpresa, currentUser, products, stockItems, suppliers, tables, waiters, orders, expenses, cashierSession, cashierHistory, customers, collaborators, stockMovements, settings, readGuides, theme,
      hasPermission, setTheme, updateProduct, addProduct, deleteProduct, 
      updateStockItem, addStockItem, deleteStockItem,
      updateSupplier, addSupplier, deleteSupplier,
      updateTable, addOrder, updateOrder, closeOrder, addExpense, updateExpense, deleteExpense, openCashier, closeCashier,
      transferTable, mergeTables, reserveTable, clearTable,
      addCustomer, updateCustomer, deleteCustomer,
      addCollaborator, updateCollaborator, deleteCollaborator,
      addStockMovement, updateSettings, toggleGuideRead, importData, exportData, resetToMocks
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
