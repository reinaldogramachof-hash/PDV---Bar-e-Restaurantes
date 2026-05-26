import { supabase } from '../lib/supabase';
import type { CashierSession, Expense, PaymentMethod } from '../types';

interface CashierSessionRow {
  id: string;
  empresa_id: string;
  opened_at: string;
  closed_at: string | null;
  initial_balance: number;
  sales_total: number;
  service_tax_total: number;
  expenses_total: number;
  tips_total: number;
  final_balance: number | null;
  orders_count: number;
  status: 'open' | 'closed';
  counted_cash: number | null;
  cash_breakdown: number | null;
  created_at: string;
  updated_at: string;
}

interface ExpenseRow {
  id: string;
  empresa_id: string;
  description: string;
  amount: number;
  category: Expense['category'];
  status: Expense['status'];
  entry_type: 'saida' | 'entrada' | null;
  payment_method: PaymentMethod | null;
  due_date: string | null;
  timestamp: string;
  cashier_session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OpenSessionInput {
  initialBalance: number;
}

export interface CloseSessionInput {
  salesTotal: number;
  serviceTaxTotal: number;
  expensesTotal: number;
  tipsTotal: number;
  finalBalance: number;
  ordersCount: number;
  countedCash?: number;
  cashBreakdown?: number;
}

export type CreateExpenseInput = Omit<Expense, 'id' | 'empresaId' | 'createdAt' | 'updatedAt'> & {
  cashierSessionId?: string;
};

interface ExpenseInsertRow {
  empresa_id: string;
  description: string;
  amount: number;
  category: Expense['category'];
  status: Expense['status'];
  entry_type: 'saida' | 'entrada';
  payment_method: PaymentMethod | null;
  due_date: string | null;
  timestamp: string;
  cashier_session_id: string | null;
}

interface ExpenseUpdateRow {
  description?: string;
  amount?: number;
  category?: Expense['category'];
  status?: Expense['status'];
  entry_type?: 'saida' | 'entrada';
  payment_method?: PaymentMethod | null;
  due_date?: string | null;
  timestamp?: string;
  cashier_session_id?: string | null;
  updated_at?: string;
}

const throwSupabaseError = (message: string, error: { message: string } | null) => {
  if (error) {
    throw new Error(`${message}: ${error.message}`);
  }
};

const toCashierSession = (row: CashierSessionRow): CashierSession => ({
  id: row.id,
  empresaId: row.empresa_id,
  openedAt: row.opened_at,
  closedAt: row.closed_at ?? undefined,
  initialBalance: row.initial_balance,
  salesTotal: row.sales_total,
  serviceTaxTotal: row.service_tax_total,
  expensesTotal: row.expenses_total,
  tipsTotal: row.tips_total,
  finalBalance: row.final_balance ?? undefined,
  ordersCount: row.orders_count,
  status: row.status,
  countedCash: row.counted_cash ?? undefined,
  cashBreakdown: row.cash_breakdown ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toExpense = (row: ExpenseRow): Expense => ({
  id: row.id,
  empresaId: row.empresa_id,
  description: row.description,
  amount: row.amount,
  category: row.category,
  status: row.status,
  entryType: row.entry_type ?? undefined,
  paymentMethod: row.payment_method ?? undefined,
  dueDate: row.due_date ?? undefined,
  timestamp: row.timestamp,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toExpenseInsertRow = (empresaId: string, data: CreateExpenseInput): ExpenseInsertRow => ({
  empresa_id: empresaId,
  description: data.description,
  amount: data.amount,
  category: data.category,
  status: data.status,
  entry_type: data.entryType ?? 'saida',
  payment_method: data.paymentMethod ?? null,
  due_date: data.dueDate ?? null,
  timestamp: data.timestamp,
  cashier_session_id: data.cashierSessionId ?? null,
});

const toExpenseUpdateRow = (data: Partial<Expense>): ExpenseUpdateRow => {
  const payload: ExpenseUpdateRow = { updated_at: new Date().toISOString() };

  if (data.description !== undefined) payload.description = data.description;
  if (data.amount !== undefined) payload.amount = data.amount;
  if (data.category !== undefined) payload.category = data.category;
  if (data.status !== undefined) payload.status = data.status;
  if (data.entryType !== undefined) payload.entry_type = data.entryType;
  if (data.paymentMethod !== undefined) payload.payment_method = data.paymentMethod;
  if (data.dueDate !== undefined) payload.due_date = data.dueDate;
  if (data.timestamp !== undefined) payload.timestamp = data.timestamp;

  return payload;
};

export async function getCurrentSession(empresaId: string): Promise<CashierSession | null> {
  const { data, error } = await supabase
    .from('cashier_sessions')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('status', 'open')
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle<CashierSessionRow>();

  throwSupabaseError('Erro ao buscar sessao de caixa aberta', error);

  return data ? toCashierSession(data) : null;
}

export async function openSession(empresaId: string, input: OpenSessionInput): Promise<CashierSession> {
  const current = await getCurrentSession(empresaId);
  if (current) {
    throw new Error('Ja existe uma sessao de caixa aberta para esta empresa.');
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('cashier_sessions')
    .insert({
      empresa_id: empresaId,
      opened_at: now,
      initial_balance: input.initialBalance,
      sales_total: 0,
      service_tax_total: 0,
      expenses_total: 0,
      tips_total: 0,
      final_balance: null,
      orders_count: 0,
      status: 'open',
      counted_cash: null,
      cash_breakdown: null,
    })
    .select('*')
    .single<CashierSessionRow>();

  throwSupabaseError('Erro ao abrir sessao de caixa', error);

  if (!data) {
    throw new Error('Erro ao abrir sessao de caixa: resposta vazia do Supabase.');
  }

  return toCashierSession(data);
}

export async function closeSession(empresaId: string, sessionId: string, input: CloseSessionInput): Promise<CashierSession> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('cashier_sessions')
    .update({
      status: 'closed',
      closed_at: now,
      sales_total: input.salesTotal,
      service_tax_total: input.serviceTaxTotal,
      expenses_total: input.expensesTotal,
      tips_total: input.tipsTotal,
      final_balance: input.finalBalance,
      orders_count: input.ordersCount,
      counted_cash: input.countedCash ?? null,
      cash_breakdown: input.cashBreakdown ?? null,
      updated_at: now,
    })
    .eq('id', sessionId)
    .eq('empresa_id', empresaId)
    .select('*')
    .maybeSingle<CashierSessionRow>();

  throwSupabaseError('Erro ao fechar sessao de caixa', error);

  if (!data) {
    throw new Error('Sessao de caixa nao encontrada para a empresa informada.');
  }

  return toCashierSession(data);
}

export async function getSessionHistory(empresaId: string, limit = 30): Promise<CashierSession[]> {
  const { data, error } = await supabase
    .from('cashier_sessions')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('status', 'closed')
    .order('closed_at', { ascending: false })
    .limit(limit)
    .returns<CashierSessionRow[]>();

  throwSupabaseError('Erro ao buscar historico de caixa', error);

  return (data ?? []).map(toCashierSession);
}

export async function addExpense(empresaId: string, input: CreateExpenseInput): Promise<Expense> {
  const payload = toExpenseInsertRow(empresaId, input);

  const { data, error } = await supabase
    .from('expenses')
    .insert(payload)
    .select('*')
    .single<ExpenseRow>();

  throwSupabaseError('Erro ao adicionar despesa', error);

  if (!data) {
    throw new Error('Erro ao adicionar despesa: resposta vazia do Supabase.');
  }

  return toExpense(data);
}

export async function updateExpense(empresaId: string, expenseId: string, data: Partial<Expense>): Promise<Expense> {
  const payload = toExpenseUpdateRow(data);

  const { data: updated, error } = await supabase
    .from('expenses')
    .update(payload)
    .eq('id', expenseId)
    .eq('empresa_id', empresaId)
    .select('*')
    .maybeSingle<ExpenseRow>();

  throwSupabaseError('Erro ao atualizar despesa', error);

  if (!updated) {
    throw new Error('Despesa nao encontrada para a empresa informada.');
  }

  return toExpense(updated);
}

export async function deleteExpense(empresaId: string, expenseId: string): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)
    .eq('empresa_id', empresaId);

  throwSupabaseError('Erro ao excluir despesa', error);
}

export async function getSessionExpenses(empresaId: string, sessionId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('cashier_session_id', sessionId)
    .order('timestamp', { ascending: true })
    .returns<ExpenseRow[]>();

  throwSupabaseError('Erro ao buscar despesas da sessao', error);

  return (data ?? []).map(toExpense);
}

export async function getExpensesByWindow(empresaId: string, openedAt: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('empresa_id', empresaId)
    .gte('timestamp', openedAt)
    .order('timestamp', { ascending: true })
    .returns<ExpenseRow[]>();

  throwSupabaseError('Erro ao buscar despesas por janela', error);

  return (data ?? []).map(toExpense);
}
