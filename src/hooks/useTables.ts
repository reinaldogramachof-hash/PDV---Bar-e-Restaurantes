import { useCallback, useEffect, useState } from 'react';
import { useBase } from '../store/AppBaseContext';
import type { Table } from '../types';
import {
  clearTable,
  initializeTables as initializeTablesInSupabase,
  listTables,
  reserveTables,
  setTableOccupied,
  transferTable,
  updateTable as updateTableInSupabase,
  UpdateTableInput,
} from '../services/tablesSupabaseService';

export interface UseTablesReturn {
  tables: Table[];
  loading: boolean;
  error: string | null;
  updateTable: (tableNumber: number, data: UpdateTableInput) => Promise<void>;
  setOccupied: (tableNumber: number, orderId: string) => Promise<void>;
  clear: (tableNumber: number) => Promise<void>;
  reserve: (tableNumbers: number[], reason: string) => Promise<void>;
  transfer: (fromNumber: number, toNumber: number, orderId: string) => Promise<void>;
  initializeTables: (count: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useTables(): UseTablesReturn {
  const { currentEmpresa } = useBase();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const next = await listTables(currentEmpresa.id);
      setTables(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar mesas.');
    } finally {
      setLoading(false);
    }
  }, [currentEmpresa.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const updateTable = useCallback(async (tableNumber: number, data: UpdateTableInput) => {
    setError(null);
    const updated = await updateTableInSupabase(currentEmpresa.id, tableNumber, data);
    setTables(prev => prev.map(table => (table.number === tableNumber ? updated : table)));
  }, [currentEmpresa.id]);

  const setOccupied = useCallback(async (tableNumber: number, orderId: string) => {
    setError(null);
    const updated = await setTableOccupied(currentEmpresa.id, tableNumber, orderId);
    setTables(prev => prev.map(table => (table.number === tableNumber ? updated : table)));
  }, [currentEmpresa.id]);

  const clear = useCallback(async (tableNumber: number) => {
    setError(null);
    const updated = await clearTable(currentEmpresa.id, tableNumber);
    setTables(prev => prev.map(table => (table.number === tableNumber ? updated : table)));
  }, [currentEmpresa.id]);

  const reserve = useCallback(async (tableNumbers: number[], reason: string) => {
    setError(null);
    await reserveTables(currentEmpresa.id, tableNumbers, reason);
    setTables(prev => prev.map(table =>
      tableNumbers.includes(table.number)
        ? { ...table, status: 'reservada', reservationReason: reason }
        : table
    ));
  }, [currentEmpresa.id]);

  const transfer = useCallback(async (fromNumber: number, toNumber: number, orderId: string) => {
    setError(null);
    await transferTable(currentEmpresa.id, fromNumber, toNumber, orderId);

    setTables(prev => prev.map(table => {
      if (table.number === fromNumber) {
        return {
          ...table,
          status: 'livre',
          activeOrderId: undefined,
          reservationReason: undefined,
        };
      }

      if (table.number === toNumber) {
        return {
          ...table,
          status: 'ocupada',
          activeOrderId: orderId,
        };
      }

      return table;
    }));
  }, [currentEmpresa.id]);

  const initializeTables = useCallback(async (count: number) => {
    setError(null);
    const initialized = await initializeTablesInSupabase(currentEmpresa.id, count);
    setTables(initialized);
  }, [currentEmpresa.id]);

  return {
    tables,
    loading,
    error,
    updateTable,
    setOccupied,
    clear,
    reserve,
    transfer,
    initializeTables,
    refresh,
  };
}
