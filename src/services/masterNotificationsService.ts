import { supabase } from '../lib/supabase';
import type { AppNotification } from '../types';

export interface MasterNotification {
  id: string;
  type: AppNotification['type'];
  title: string;
  body: string;
  action?: string;
  targetPlans: ('essencial' | 'profissional' | 'gestao')[];
  status: 'draft' | 'published';
  expiresAt?: string;
  publishedAt?: string;
  createdAt: string;
}

type Row = {
  id: string;
  type: string;
  title: string;
  body: string;
  action: string | null;
  target_plans: string[];
  status: string;
  expires_at: string | null;
  published_at: string | null;
  created_at: string;
};

const toNotif = (row: Row): MasterNotification => ({
  id: row.id,
  type: row.type as AppNotification['type'],
  title: row.title,
  body: row.body,
  action: row.action ?? undefined,
  targetPlans: row.target_plans as MasterNotification['targetPlans'],
  status: row.status as 'draft' | 'published',
  expiresAt: row.expires_at ?? undefined,
  publishedAt: row.published_at ?? undefined,
  createdAt: row.created_at,
});

export async function listNotifications(): Promise<MasterNotification[]> {
  const { data, error } = await supabase
    .from('master_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<Row[]>();

  if (error) throw new Error(error.message);
  return (data ?? []).map(toNotif);
}

export async function createNotification(input: Omit<MasterNotification, 'id' | 'createdAt'>): Promise<MasterNotification> {
  const { data, error } = await supabase
    .from('master_notifications')
    .insert({
      type: input.type,
      title: input.title,
      body: input.body,
      action: input.action ?? null,
      target_plans: input.targetPlans,
      status: input.status,
      expires_at: input.expiresAt ?? null,
      published_at: input.publishedAt ?? null,
    })
    .select('*')
    .single<Row>();

  if (error) throw new Error(error.message);
  return toNotif(data);
}

export async function publishNotification(id: string): Promise<void> {
  const { error } = await supabase
    .from('master_notifications')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function deleteNotification(id: string): Promise<void> {
  const { error } = await supabase
    .from('master_notifications')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function duplicateNotification(id: string): Promise<MasterNotification> {
  const { data: original, error } = await supabase
    .from('master_notifications')
    .select('*')
    .eq('id', id)
    .single<Row>();

  if (error) throw new Error(error.message);

  return createNotification({
    ...toNotif(original),
    status: 'draft',
    publishedAt: undefined,
  });
}
