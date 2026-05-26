import { useCallback, useEffect, useState } from 'react';
import type { CashierSession, Expense } from '../types';
import { useBase } from '../store/AppBaseContext';
import {
  addExpense as addExpenseInSupabase,
  closeSession,
  CreateExpenseInput,
  CloseSessionInput,
  deleteExpense as deleteExpenseInSupabase,
  getCurrentSession,
  getExpensesByWindow,
  getSessionHistory,
  openSession,
  updateExpense as updateExpenseInSupabase,
} from '../services/cashierSupabaseService';

export interface UseCashierReturn {
  cashierSession: CashierSession | null;
  cashierHistory: CashierSession[];
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  openCashier: (initialBalance?: number) => Promise<void>;
  closeCashier: (input: CloseSessionInput) => Promise<void>;
  addExpense: (data: CreateExpenseInput) => Promise<void>;
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useCashier(): UseCashierReturn {
  const { currentEmpresa } = useBase();
  const [cashierSession, setCashierSession] = useState<CashierSession | null>(null);
  const [cashierHistory, setCashierHistory] = useState<CashierSession[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [current, history] = await Promise.all([
        getCurrentSession(currentEmpresa.id),
        getSessionHistory(currentEmpresa.id, 30),
      ]);

      setCashierSession(current);
      setCashierHistory(history);

      if (current) {
        const windowExpenses = await getExpensesByWindow(currentEmpresa.id, current.openedAt);
        setExpenses(windowExpenses);
      } else {
        setExpenses([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados do caixa.');
    } finally {
      setLoading(false);
    }
  }, [currentEmpresa.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openCashier = useCallback(async (initialBalance = 0) => {
    setError(null);
    const opened = await openSession(currentEmpresa.id, { initialBalance });
    setCashierSession(opened);
    setExpenses([]);
  }, [currentEmpresa.id]);

  const closeCashier = useCallback(async (input: CloseSessionInput) => {
    if (!cashierSession) {
      throw new Error('Nao existe sessao de caixa aberta para fechar.');
    }

    setError(null);
    const closed = await closeSession(currentEmpresa.id, cashierSession.id, input);
    setCashierHistory(prev => [closed, ...prev].slice(0, 30));
    setCashierSession(null);
    setExpenses([]);
  }, [cashierSession, currentEmpresa.id]);

  const addExpense = useCallback(async (data: CreateExpenseInput) => {
    setError(null);

    const created = await addExpenseInSupabase(currentEmpresa.id, {
      ...data,
      cashierSessionId: data.cashierSessionId ?? cashierSession?.id,
    });

    setExpenses(prev => [...prev, created].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    ));
  }, [cashierSession?.id, currentEmpresa.id]);

  const updateExpense = useCallback(async (id: string, data: Partial<Expense>) => {
    setError(null);
    const updated = await updateExpenseInSupabase(currentEmpresa.id, id, data);
    setExpenses(prev => prev.map(expense => (expense.id === id ? updated : expense)));
  }, [currentEmpresa.id]);

  const deleteExpense = useCallback(async (id: string) => {
    setError(null);
    await deleteExpenseInSupabase(currentEmpresa.id, id);
    setExpenses(prev => prev.filter(expense => expense.id !== id));
  }, [currentEmpresa.id]);

  return {
    cashierSession,
    cashierHistory,
    expenses,
    loading,
    error,
    openCashier,
    closeCashier,
    addExpense,
    updateExpense,
    deleteExpense,
    refresh,
  };
}
