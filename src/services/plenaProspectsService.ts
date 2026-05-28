import { supabase } from '../lib/supabase';
import type { ProspectStage } from '../types';

interface PlenaProspectRow {
  id: string;
  business_name: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string | null;
  plan_interest: 'essencial' | 'profissional' | 'gestao';
  stage: ProspectStage;
  notes: string;
  lost_reason: string | null;
  monthly_value: number;
  last_interaction_at: string;
  created_at: string;
  updated_at: string;
}

interface PlenaActivityRow {
  id: string;
  prospect_id: string;
  type: 'note' | 'call' | 'demo' | 'proposal' | 'contract' | 'upgrade' | 'churn';
  description: string;
  created_at: string;
}

export interface PlenaProspect {
  id: string;
  businessName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  planInterest: 'essencial' | 'profissional' | 'gestao';
  stage: ProspectStage;
  notes: string;
  lostReason?: string;
  monthlyValue: number;
  lastInteractionAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlenaActivity {
  id: string;
  prospectId: string;
  type: 'note' | 'call' | 'demo' | 'proposal' | 'contract' | 'upgrade' | 'churn';
  description: string;
  createdAt: string;
}

const toProspect = (row: PlenaProspectRow): PlenaProspect => ({
  id: row.id,
  businessName: row.business_name,
  contactName: row.contact_name,
  contactPhone: row.contact_phone,
  contactEmail: row.contact_email ?? '',
  planInterest: row.plan_interest,
  stage: row.stage,
  notes: row.notes,
  lostReason: row.lost_reason ?? undefined,
  monthlyValue: row.monthly_value,
  lastInteractionAt: row.last_interaction_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toActivity = (row: PlenaActivityRow): PlenaActivity => ({
  id: row.id,
  prospectId: row.prospect_id,
  type: row.type,
  description: row.description,
  createdAt: row.created_at,
});

const toProspectRowUpdate = (input: Partial<PlenaProspect>): Partial<PlenaProspectRow> => ({
  business_name: input.businessName,
  contact_name: input.contactName,
  contact_phone: input.contactPhone,
  contact_email: input.contactEmail,
  plan_interest: input.planInterest,
  stage: input.stage,
  notes: input.notes,
  lost_reason: input.lostReason,
  monthly_value: input.monthlyValue,
  last_interaction_at: input.lastInteractionAt,
  updated_at: new Date().toISOString(),
});

export async function listProspects(): Promise<PlenaProspect[]> {
  const { data, error } = await supabase
    .from('plena_prospects')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<PlenaProspectRow[]>();

  if (error) throw new Error(`Erro ao listar prospects: ${error.message}`);
  return (data ?? []).map(toProspect);
}

export async function createProspect(input: Omit<PlenaProspect, 'id' | 'createdAt' | 'updatedAt'>): Promise<PlenaProspect> {
  const now = new Date().toISOString();
  const payload = {
    business_name: input.businessName,
    contact_name: input.contactName,
    contact_phone: input.contactPhone,
    contact_email: input.contactEmail,
    plan_interest: input.planInterest,
    stage: input.stage,
    notes: input.notes,
    lost_reason: input.lostReason ?? null,
    monthly_value: input.monthlyValue,
    last_interaction_at: input.lastInteractionAt || now,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from('plena_prospects')
    .insert(payload)
    .select('*')
    .single<PlenaProspectRow>();

  if (error) throw new Error(`Erro ao criar prospect: ${error.message}`);
  return toProspect(data);
}

export async function updateProspect(id: string, input: Partial<PlenaProspect>): Promise<PlenaProspect> {
  const { data, error } = await supabase
    .from('plena_prospects')
    .update(toProspectRowUpdate(input))
    .eq('id', id)
    .select('*')
    .single<PlenaProspectRow>();

  if (error) throw new Error(`Erro ao atualizar prospect: ${error.message}`);
  return toProspect(data);
}

export async function deleteProspect(id: string): Promise<void> {
  const { error } = await supabase.from('plena_prospects').delete().eq('id', id);
  if (error) throw new Error(`Erro ao excluir prospect: ${error.message}`);
}

export async function listActivities(prospectId: string): Promise<PlenaActivity[]> {
  const { data, error } = await supabase
    .from('plena_activities')
    .select('*')
    .eq('prospect_id', prospectId)
    .order('created_at', { ascending: false })
    .returns<PlenaActivityRow[]>();

  if (error) throw new Error(`Erro ao listar atividades: ${error.message}`);
  return (data ?? []).map(toActivity);
}

export async function createActivity(input: { prospectId: string; type: PlenaActivity['type']; description: string }): Promise<PlenaActivity> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('plena_activities')
    .insert({
      prospect_id: input.prospectId,
      type: input.type,
      description: input.description,
      created_at: now,
    })
    .select('*')
    .single<PlenaActivityRow>();

  if (error) throw new Error(`Erro ao criar atividade: ${error.message}`);

  await supabase
    .from('plena_prospects')
    .update({ last_interaction_at: now, updated_at: now })
    .eq('id', input.prospectId);

  return toActivity(data);
}
