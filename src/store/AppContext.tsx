import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product, Table, Order, Waiter, Expense, CashierSession, PaymentItem, Customer, Collaborator } from '../types';
import { mockProducts, mockTables, mockWaiters, mockCustomers, mockCollaborators } from './mock';

interface AppState {
  products: Product[];
  tables: Table[];
  waiters: Waiter[];
  orders: Order[];
  expenses: Expense[];
  cashierSession: CashierSession | null;
  cashierHistory: CashierSession[];
  customers: Customer[];
  collaborators: Collaborator[];
  theme: 'dark' | 'light';
}

interface AppContextType extends AppState {
  setTheme: (theme: 'dark' | 'light') => void;
  updateProduct: (product: Product) => void;
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
}

const parseJSON = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => parseJSON('products', mockProducts));
  const [tables, setTables] = useState<Table[]>(() => {
    const saved = parseJSON<Table[]>('tables', mockTables);
    // If table count changed in mock, prioritize mock to update floor plan
    return saved.length !== mockTables.length ? mockTables : saved;
  });
  const [waiters] = useState<Waiter[]>(() => parseJSON('waiters', mockWaiters));
  const [orders, setOrders] = useState<Order[]>(() => parseJSON('orders', []));
  const [expenses, setExpenses] = useState<Expense[]>(() => parseJSON('expenses', []));
  const [cashierSession, setCashierSession] = useState<CashierSession | null>(() => parseJSON('cashierSession', null));
  const [cashierHistory, setCashierHistory] = useState<CashierSession[]>(() => parseJSON('cashierHistory', []));
  const [customers, setCustomers] = useState<Customer[]>(() => parseJSON('customers', mockCustomers));
  const [collaborators, setCollaborators] = useState<Collaborator[]>(() => parseJSON('collaborators', mockCollaborators));
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const th = localStorage.getItem('theme');
    return th === 'dark' || th === 'light' ? th : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
    localStorage.setItem('tables', JSON.stringify(tables));
    localStorage.setItem('waiters', JSON.stringify(waiters));
    localStorage.setItem('orders', JSON.stringify(orders));
    localStorage.setItem('expenses', JSON.stringify(expenses));
    localStorage.setItem('cashierSession', JSON.stringify(cashierSession));
    localStorage.setItem('cashierHistory', JSON.stringify(cashierHistory));
    localStorage.setItem('customers', JSON.stringify(customers));
    localStorage.setItem('collaborators', JSON.stringify(collaborators));
    localStorage.setItem('theme', theme);
  }, [products, tables, waiters, orders, expenses, cashierSession, cashierHistory, customers, collaborators, theme]);

  const updateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const updateTable = (updatedTable: Table) => {
    setTables(prev => prev.map(t => t.number === updatedTable.number ? updatedTable : t));
  };

  const addOrder = (order: Order) => {
    setOrders(prev => [...prev, order]);
    if (order.mode === 'mesa' && order.tableNumber) {
      setTables(prev => prev.map(t =>
        t.number === order.tableNumber ? { ...t, status: 'ocupada', activeOrderId: order.id } : t
      ));
    }
  };

  const updateOrder = (updatedOrder: Order) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  // Accepts the full order object to avoid stale closure issues
  const closeOrder = (order: Order, payments: PaymentItem[], serviceCharge: number) => {
    const closedOrder: Order = {
      ...order,
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

    setProducts(prev => {
      const next = [...prev];
      order.items.forEach(item => {
        if (item.product.controlsStock) {
          const idx = next.findIndex(p => p.id === item.product.id);
          if (idx !== -1) {
            next[idx] = { ...next[idx], stock: Math.max(0, next[idx].stock - item.quantity) };
          }
        }
      });
      return next;
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
    setExpenses(prev => [...prev, expense]);
  };

  const updateExpense = (updatedExpense: Expense) => {
    setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const openCashier = () => {
    const newSession: CashierSession = {
      id: Date.now().toString(),
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
    const closedOrders = orders.filter(o => o.status === 'closed');
    const salesTotal = closedOrders.reduce((acc, o) => acc + o.subtotal, 0);
    const serviceTaxTotal = closedOrders.reduce((acc, o) => acc + o.serviceCharge, 0);
    const expensesTotal = expenses.reduce((acc, e) => acc + e.amount, 0);
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
    setOrders([]);
    setExpenses([]);
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

    // Combine items
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
      .filter(o => o.id !== sourceOrder.id) // Remove source order
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
    setCustomers(prev => [...prev, customer]);
  };

  const updateCustomer = (updatedCustomer: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
  };

  const addCollaborator = (collaborator: Collaborator) => {
    setCollaborators(prev => [...prev, collaborator]);
  };

  const updateCollaborator = (updatedCollaborator: Collaborator) => {
    setCollaborators(prev => prev.map(c => c.id === updatedCollaborator.id ? updatedCollaborator : c));
  };

  const deleteCollaborator = (id: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== id));
  };

  return (
    <AppContext.Provider value={{
      products, tables, waiters, orders, expenses, cashierSession, cashierHistory, customers, collaborators, theme,
      setTheme, updateProduct, updateTable, addOrder, updateOrder, closeOrder, addExpense, openCashier, closeCashier,
      transferTable, mergeTables, reserveTable, clearTable,
      addCustomer, updateCustomer, deleteCustomer,
      addCollaborator, updateCollaborator, deleteCollaborator
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
