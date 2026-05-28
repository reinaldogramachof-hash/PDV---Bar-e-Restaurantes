import { supabase } from '../lib/supabase';

interface SupportTicketRow {
  id: string;
  empresa_id: string;
  empresa_name: string | null;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface SupportMessageRow {
  id: string;
  ticket_id: string;
  author_id: string | null;
  author_name: string;
  body: string;
  is_master: boolean;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  empresaId: string;
  empresaName?: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  messages?: SupportMessage[];
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  authorId?: string;
  authorName: string;
  body: string;
  isMaster: boolean;
  createdAt: string;
}

const toTicket = (row: SupportTicketRow): SupportTicket => ({
  id: row.id,
  empresaId: row.empresa_id,
  empresaName: row.empresa_name ?? undefined,
  title: row.title,
  description: row.description,
  status: row.status,
  priority: row.priority,
  createdBy: row.created_by ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toMessage = (row: SupportMessageRow): SupportMessage => ({
  id: row.id,
  ticketId: row.ticket_id,
  authorId: row.author_id ?? undefined,
  authorName: row.author_name,
  body: row.body,
  isMaster: row.is_master,
  createdAt: row.created_at,
});

export async function createTicket(
  empresaId: string,
  input: { title: string; description: string; priority: SupportTicket['priority']; createdBy: string }
): Promise<SupportTicket> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('support_tickets')
    .insert({
      empresa_id: empresaId,
      title: input.title,
      description: input.description,
      priority: input.priority,
      created_by: input.createdBy,
      status: 'open',
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .single<SupportTicketRow>();

  if (error) throw new Error(`Erro ao criar ticket: ${error.message}`);
  return toTicket(data);
}

export async function listMyTickets(empresaId: string): Promise<SupportTicket[]> {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: false })
    .returns<SupportTicketRow[]>();

  if (error) throw new Error(`Erro ao listar tickets: ${error.message}`);
  return (data ?? []).map(toTicket);
}

export async function addMessage(ticketId: string, authorName: string, body: string, isMaster: boolean): Promise<SupportMessage> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('support_messages')
    .insert({
      ticket_id: ticketId,
      author_name: authorName,
      body,
      is_master: isMaster,
      created_at: now,
    })
    .select('*')
    .single<SupportMessageRow>();

  if (error) throw new Error(`Erro ao adicionar mensagem: ${error.message}`);

  await supabase
    .from('support_tickets')
    .update({ updated_at: now })
    .eq('id', ticketId);

  return toMessage(data);
}

export async function listMessages(ticketId: string): Promise<SupportMessage[]> {
  const { data, error } = await supabase
    .from('support_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })
    .returns<SupportMessageRow[]>();

  if (error) throw new Error(`Erro ao listar mensagens: ${error.message}`);
  return (data ?? []).map(toMessage);
}

export async function listAllTickets(): Promise<SupportTicket[]> {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<SupportTicketRow[]>();

  if (error) throw new Error(`Erro ao listar todos os tickets: ${error.message}`);
  return (data ?? []).map(toTicket);
}

export async function updateTicketStatus(id: string, status: SupportTicket['status']): Promise<SupportTicket> {
  const { data, error } = await supabase
    .from('support_tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single<SupportTicketRow>();

  if (error) throw new Error(`Erro ao atualizar status do ticket: ${error.message}`);
  return toTicket(data);
}
