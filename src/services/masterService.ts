import { supabase } from '../lib/supabase';
import type { Empresa, LicenseStatus, Plano } from '../types';

interface EmpresaRow {
  id: string;
  name: string;
  document: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  legal_name: string | null;
  website: string | null;
  notes: string | null;
  contract_start: string | null;
  contract_end: string | null;
  contract_value: number | null;
  contract_type: string | null;
  contract_status: string | null;
  plano: string;
  license_status: string;
  created_at: string;
  updated_at: string;
}

interface EmpresaDocumentRow {
  id: string;
  empresa_id: string;
  name: string;
  description: string | null;
  file_path: string;
  file_size: number | null;
  mime_type: string;
  created_at: string;
}

interface EmpresaHistoryRow {
  id: string;
  empresa_id: string;
  action: string;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
  performed_by_name: string | null;
  created_at: string;
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

export interface EmpresaDetail extends Empresa {
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  legalName?: string;
  website?: string;
  notes?: string;
  contractStart?: string;
  contractEnd?: string;
  contractValue?: number;
  contractType?: 'mensal' | 'anual' | 'personalizado';
  contractStatus?: 'ativo' | 'encerrado' | 'suspenso' | 'negociacao';
}

export interface EmpresaDocument {
  id: string;
  empresaId: string;
  name: string;
  description?: string;
  filePath: string;
  fileSize?: number;
  mimeType: string;
  createdAt: string;
}

export interface EmpresaHistoryEntry {
  id: string;
  empresaId: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  performedByName?: string;
  createdAt: string;
}

const toDetail = (row: EmpresaRow): EmpresaDetail => ({
  ...toEmpresa(row),
  phone: row.phone ?? undefined,
  email: row.email ?? undefined,
  address: row.address ?? undefined,
  city: row.city ?? undefined,
  state: row.state ?? undefined,
  legalName: row.legal_name ?? undefined,
  website: row.website ?? undefined,
  notes: row.notes ?? undefined,
  contractStart: row.contract_start ?? undefined,
  contractEnd: row.contract_end ?? undefined,
  contractValue: row.contract_value ?? undefined,
  contractType: (row.contract_type as EmpresaDetail['contractType']) ?? undefined,
  contractStatus: (row.contract_status as EmpresaDetail['contractStatus']) ?? undefined,
});

const toDocument = (row: EmpresaDocumentRow): EmpresaDocument => ({
  id: row.id,
  empresaId: row.empresa_id,
  name: row.name,
  description: row.description ?? undefined,
  filePath: row.file_path,
  fileSize: row.file_size ?? undefined,
  mimeType: row.mime_type,
  createdAt: row.created_at,
});

const toHistory = (row: EmpresaHistoryRow): EmpresaHistoryEntry => ({
  id: row.id,
  empresaId: row.empresa_id,
  action: row.action,
  field: row.field ?? undefined,
  oldValue: row.old_value ?? undefined,
  newValue: row.new_value ?? undefined,
  performedByName: row.performed_by_name ?? undefined,
  createdAt: row.created_at,
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

export async function getEmpresaDetail(id: string): Promise<EmpresaDetail | null> {
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', id)
    .maybeSingle<EmpresaRow>();
  throwSupabaseError('Erro ao buscar detalhes da empresa', error);
  return data ? toDetail(data) : null;
}

export async function updateEmpresaDetail(
  id: string,
  data: Partial<Omit<EmpresaDetail, 'id' | 'empresaId' | 'createdAt' | 'updatedAt'>>
): Promise<EmpresaDetail> {
  const payload = {
    name: data.name,
    document: data.document,
    phone: data.phone,
    email: data.email,
    address: data.address,
    city: data.city,
    state: data.state,
    legal_name: data.legalName,
    website: data.website,
    notes: data.notes,
    contract_start: data.contractStart,
    contract_end: data.contractEnd,
    contract_value: data.contractValue,
    contract_type: data.contractType,
    contract_status: data.contractStatus,
    plano: data.plano,
    license_status: data.licenseStatus,
    updated_at: new Date().toISOString(),
  };

  const cleaned = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  );

  const { data: updated, error } = await supabase
    .from('empresas')
    .update(cleaned)
    .eq('id', id)
    .select('*')
    .single<EmpresaRow>();
  throwSupabaseError('Erro ao atualizar dados da empresa', error);
  return toDetail(updated);
}

export async function listEmpresaDocuments(empresaId: string): Promise<EmpresaDocument[]> {
  const { data, error } = await supabase
    .from('empresa_documents')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: false })
    .returns<EmpresaDocumentRow[]>();
  throwSupabaseError('Erro ao listar documentos', error);
  return (data ?? []).map(toDocument);
}

export async function uploadEmpresaDocument(
  empresaId: string,
  file: File,
  name: string,
  description?: string
): Promise<EmpresaDocument> {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  throwSupabaseError('Erro ao listar buckets', listError);
  const exists = buckets?.some(bucket => bucket.name === 'empresa-docs');
  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket('empresa-docs', { public: false });
    throwSupabaseError('Erro ao criar bucket empresa-docs', createError);
  }

  const ext = file.name.split('.').pop() ?? 'pdf';
  const filePath = `${empresaId}/${Date.now()}-${name.replace(/\s+/g, '-')}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('empresa-docs')
    .upload(filePath, file, { contentType: file.type, upsert: false });
  if (uploadError) throw new Error(`Erro no upload: ${uploadError.message}`);

  const { data, error } = await supabase
    .from('empresa_documents')
    .insert({
      empresa_id: empresaId,
      name,
      description: description ?? null,
      file_path: filePath,
      file_size: file.size,
      mime_type: file.type,
    })
    .select('*')
    .single<EmpresaDocumentRow>();
  throwSupabaseError('Erro ao salvar metadados do documento', error);
  return toDocument(data);
}

export async function deleteEmpresaDocument(doc: EmpresaDocument): Promise<void> {
  const { error: storageError } = await supabase.storage.from('empresa-docs').remove([doc.filePath]);
  throwSupabaseError('Erro ao remover arquivo do bucket', storageError);

  const { error } = await supabase.from('empresa_documents').delete().eq('id', doc.id);
  throwSupabaseError('Erro ao remover documento', error);
}

export async function getDocumentSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from('empresa-docs').createSignedUrl(filePath, 60 * 60);
  throwSupabaseError('Erro ao gerar URL assinada', error);
  if (!data?.signedUrl) throw new Error('URL assinada não disponível');
  return data.signedUrl;
}

export async function listEmpresaHistory(empresaId: string): Promise<EmpresaHistoryEntry[]> {
  const { data, error } = await supabase
    .from('empresa_history')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: false })
    .returns<EmpresaHistoryRow[]>();
  throwSupabaseError('Erro ao listar histórico', error);
  return (data ?? []).map(toHistory);
}

export async function addEmpresaHistory(
  empresaId: string,
  action: string,
  options?: { field?: string; oldValue?: string; newValue?: string; performedByName?: string }
): Promise<void> {
  const { error } = await supabase.from('empresa_history').insert({
    empresa_id: empresaId,
    action,
    field: options?.field ?? null,
    old_value: options?.oldValue ?? null,
    new_value: options?.newValue ?? null,
    performed_by_name: options?.performedByName ?? null,
  });
  throwSupabaseError('Erro ao registrar histórico', error);
}
