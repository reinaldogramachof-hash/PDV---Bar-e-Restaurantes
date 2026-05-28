import { supabase } from '../lib/supabase';
import type { Table } from '../types';

interface TableRow {
  id: string;
  empresa_id: string;
  number: number;
  status: 'livre' | 'ocupada' | 'aguardando' | 'reservada';
  sector: string | null;
  active_order_id: string | null;
  reservation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type UpdateTableInput = Partial<Omit<Table, 'empresaId'>>;

interface TableUpdateRow {
  status?: 'livre' | 'ocupada' | 'aguardando' | 'reservada';
  sector?: string | null;
  active_order_id?: string | null;
  reservation_reason?: string | null;
  updated_at?: string;
}

interface TableInsertRow {
  empresa_id: string;
  number: number;
  status: 'livre' | 'ocupada' | 'aguardando' | 'reservada';
  sector: string | null;
  active_order_id: string | null;
  reservation_reason: string | null;
}

const throwSupabaseError = (message: string, error: { message: string } | null) => {
  if (error) {
    throw new Error(`${message}: ${error.message}`);
  }
};

const toTable = (row: TableRow): Table => ({
  empresaId: row.empresa_id,
  number: row.number,
  status: row.status,
  sector: row.sector ?? undefined,
  activeOrderId: row.active_order_id ?? undefined,
  reservationReason: row.reservation_reason ?? undefined,
});

const toTableUpdateRow = (data: UpdateTableInput): TableUpdateRow => {
  const payload: TableUpdateRow = { updated_at: new Date().toISOString() };

  if (data.status !== undefined) payload.status = data.status;
  if (data.sector !== undefined) payload.sector = data.sector;
  if (data.activeOrderId !== undefined) payload.active_order_id = data.activeOrderId;
  if (data.reservationReason !== undefined) payload.reservation_reason = data.reservationReason;

  return payload;
};

export async function listTables(empresaId: string): Promise<Table[]> {
  const { data, error } = await supabase
    .from('restaurant_tables')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('number', { ascending: true })
    .returns<TableRow[]>();

  throwSupabaseError('Erro ao listar mesas', error);

  return (data ?? []).map(toTable);
}

export async function updateTable(empresaId: string, tableNumber: number, data: UpdateTableInput): Promise<Table> {
  const payload = toTableUpdateRow(data);

  const { data: updated, error } = await supabase
    .from('restaurant_tables')
    .update(payload)
    .eq('empresa_id', empresaId)
    .eq('number', tableNumber)
    .select('*')
    .maybeSingle<TableRow>();

  throwSupabaseError('Erro ao atualizar mesa', error);

  if (!updated) {
    throw new Error('Mesa nao encontrada para a empresa informada.');
  }

  return toTable(updated);
}

export async function setTableOccupied(empresaId: string, tableNumber: number, orderId: string): Promise<Table> {
  return updateTable(empresaId, tableNumber, {
    status: 'ocupada',
    activeOrderId: orderId,
  });
}

export async function clearTable(empresaId: string, tableNumber: number): Promise<Table> {
  return updateTable(empresaId, tableNumber, {
    status: 'livre',
    activeOrderId: null,
    reservationReason: null,
  });
}

export async function reserveTables(empresaId: string, tableNumbers: number[], reason: string): Promise<void> {
  if (tableNumbers.length === 0) {
    return;
  }

  const { error } = await supabase
    .from('restaurant_tables')
    .update({
      status: 'reservada',
      reservation_reason: reason,
      updated_at: new Date().toISOString(),
    })
    .eq('empresa_id', empresaId)
    .in('number', tableNumbers);

  throwSupabaseError('Erro ao reservar mesas', error);
}

export async function transferTable(empresaId: string, fromNumber: number, toNumber: number, orderId: string): Promise<void> {
  await clearTable(empresaId, fromNumber);
  await setTableOccupied(empresaId, toNumber, orderId);
}

export async function initializeTables(empresaId: string, count: number): Promise<Table[]> {
  const current = await listTables(empresaId);
  if (current.length > 0) {
    return current;
  }

  const payload: TableInsertRow[] = Array.from({ length: count }, (_, index) => ({
    empresa_id: empresaId,
    number: index + 1,
    status: 'livre',
    sector: null,
    active_order_id: null,
    reservation_reason: null,
  }));

  const { data, error } = await supabase
    .from('restaurant_tables')
    .insert(payload)
    .select('*')
    .order('number', { ascending: true })
    .returns<TableRow[]>();

  throwSupabaseError('Erro ao inicializar mesas', error);

  return (data ?? []).map(toTable);
}
