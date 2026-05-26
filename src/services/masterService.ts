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
  licenseStatus: 'active' | 'trial' | 'suspended';
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export async function createEmpresaForTrial(input: CreateEmpresaInput): Promise<Empresa> {
  const generatedId = `empresa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('empresas')
    .insert({
      id: generatedId,
      name: input.name,
      document: input.document ?? null,
      plano: input.plano,
      license_status: input.licenseStatus,
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .single<EmpresaRow>();

  throwSupabaseError('Erro ao criar empresa', error);

  if (!data) {
    throw new Error('Erro ao criar empresa: resposta vazia do Supabase.');
  }

  // A criacao de usuario auth exige service_role e deve ser feita server-side.
  void input.adminName;
  void input.adminEmail;
  void input.adminPassword;

  return toEmpresa(data);
}
