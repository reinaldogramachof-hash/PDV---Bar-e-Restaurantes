import { supabase } from '../lib/supabase';
import type { Empresa, LicenseStatus, Plano } from '../types';

interface EmpresaRow {
  id: string;
  name: string;
  document: string | null;
  plano: string;
  license_status: string;
  created_at: string;
  updated_at: string;
}

const throwSupabaseError = (message: string, error: { message: string } | null) => {
  if (error) throw new Error(`${message}: ${error.message}`);
};

const toEmpresa = (row: EmpresaRow): Empresa => ({
  id: row.id,
  empresaId: row.id,
  name: row.name,
  document: row.document ?? '',
  plano: row.plano as Plano,
  licenseStatus: row.license_status as LicenseStatus,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function listAllEmpresas(): Promise<Empresa[]> {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<EmpresaRow[]>();

  throwSupabaseError('Erro ao listar empresas', error);

  return (data ?? []).map(toEmpresa);
}

export async function getEmpresa(id: string): Promise<Empresa | null> {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', id)
    .maybeSingle<EmpresaRow>();

  throwSupabaseError('Erro ao buscar empresa', error);

  return data ? toEmpresa(data) : null;
}

export async function updateEmpresaLicense(
  id: string,
  licenseStatus: 'active' | 'trial' | 'suspended'
): Promise<Empresa> {
  const { data, error } = await supabase
    .from('empresas')
    .update({ license_status: licenseStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .maybeSingle<EmpresaRow>();

  throwSupabaseError('Erro ao atualizar licenca da empresa', error);

  if (!data) {
    throw new Error('Empresa nao encontrada para atualizacao de licenca.');
  }

  return toEmpresa(data);
}

export async function updateEmpresaPlano(
  id: string,
  plano: 'essencial' | 'profissional' | 'gestao'
): Promise<Empresa> {
  const { data, error } = await supabase
    .from('empresas')
    .update({ plano, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .maybeSingle<EmpresaRow>();

  throwSupabaseError('Erro ao atualizar plano da empresa', error);

  if (!data) {
    throw new Error('Empresa nao encontrada para atualizacao de plano.');
  }

  return toEmpresa(data);
}

export interface CreateEmpresaInput {
  name: string;
  document?: string;
  plano: 'essencial' | 'profissional' | 'gestao';
  packId?: string;
  licenseStatus: 'active' | 'trial' | 'suspended';
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export interface ProfileSummary {
  id: string;
  name: string;
  role: string;
  email: string;
  active: boolean;
}

export async function createEmpresaForTrial(input: CreateEmpresaInput): Promise<Empresa> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado.');

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-empresa`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        name: input.name,
        document: input.document,
        plano: input.plano,
        packId: input.packId,
        licenseStatus: input.licenseStatus,
        adminName: input.adminName,
        adminEmail: input.adminEmail,
        adminPassword: input.adminPassword,
      }),
    }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(body.error ?? `Erro ${res.status}`);
  }

  const row: EmpresaRow = await res.json();
  return toEmpresa(row);
}

export async function listEmpresaProfiles(empresaId: string): Promise<ProfileSummary[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, role, active')
    .eq('empresa_id', empresaId)
    .returns<{ id: string; name: string; role: string; active: boolean }[]>();

  if (error) throw new Error(`Erro ao buscar perfis: ${error.message}`);

  return (data ?? []).map(profile => ({
    id: profile.id,
    name: profile.name,
    role: profile.role,
    active: profile.active,
    email: '',
  }));
}
