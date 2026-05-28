import { supabase } from '../lib/supabase';

interface EmpresaModuleRow {
  id: string;
  empresa_id: string;
  module_id: string;
  enabled: boolean;
  label: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmpresaModule {
  id: string;
  empresaId: string;
  moduleId: string;
  enabled: boolean;
  label?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

const toEmpresaModule = (row: EmpresaModuleRow): EmpresaModule => ({
  id: row.id,
  empresaId: row.empresa_id,
  moduleId: row.module_id,
  enabled: row.enabled,
  label: row.label ?? undefined,
  expiresAt: row.expires_at ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function listEmpresaModules(empresaId: string): Promise<EmpresaModule[]> {
  const { data, error } = await supabase
    .from('empresa_modules')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: false })
    .returns<EmpresaModuleRow[]>();

  if (error) throw new Error(`Erro ao listar modulos extras: ${error.message}`);
  return (data ?? []).map(toEmpresaModule);
}

export async function upsertEmpresaModule(
  empresaId: string,
  moduleId: string,
  enabled: boolean,
  options?: { label?: string; expiresAt?: string }
): Promise<EmpresaModule> {
  const now = new Date().toISOString();

  const { data: found, error: findError } = await supabase
    .from('empresa_modules')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('module_id', moduleId)
    .maybeSingle<EmpresaModuleRow>();

  if (findError) throw new Error(`Erro ao buscar modulo extra: ${findError.message}`);

  if (found) {
    const { data, error } = await supabase
      .from('empresa_modules')
      .update({
        enabled,
        label: options?.label ?? null,
        expires_at: options?.expiresAt ?? null,
        updated_at: now,
      })
      .eq('id', found.id)
      .select('*')
      .single<EmpresaModuleRow>();

    if (error) throw new Error(`Erro ao atualizar modulo extra: ${error.message}`);
    return toEmpresaModule(data);
  }

  const { data, error } = await supabase
    .from('empresa_modules')
    .insert({
      empresa_id: empresaId,
      module_id: moduleId,
      enabled,
      label: options?.label ?? null,
      expires_at: options?.expiresAt ?? null,
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .single<EmpresaModuleRow>();

  if (error) throw new Error(`Erro ao criar modulo extra: ${error.message}`);
  return toEmpresaModule(data);
}

export async function removeEmpresaModule(id: string): Promise<void> {
  const { error } = await supabase.from('empresa_modules').delete().eq('id', id);
  if (error) throw new Error(`Erro ao remover modulo extra: ${error.message}`);
}
