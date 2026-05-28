import { supabase } from '../lib/supabase';
import type { DiarioAuditLog, DiarioEntry, DiarioResposta, UserRole } from '../types';

type EntryStatus = DiarioEntry['status'];
type EntryCategoria = DiarioEntry['categoria'];
type AuditAction = DiarioAuditLog['action'];

interface DiarioEntryRow {
  id: string;
  empresa_id: string;
  author_id: string;
  author_codigo: string | null;
  categoria: EntryCategoria;
  titulo: string;
  corpo: string;
  resolucao: string | null;
  ocorrencias: number;
  status: EntryStatus;
  escalado_em: string | null;
  attachments: string[] | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

interface DiarioRespostaRow {
  id: string;
  entry_id: string;
  empresa_id: string;
  author_id: string;
  author_codigo: string | null;
  corpo: string;
  created_at: string;
}

interface DiarioAuditRow {
  id: string;
  empresa_id: string;
  entry_id: string | null;
  user_id: string;
  user_codigo: string | null;
  user_role: UserRole;
  action: AuditAction;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface ListFilters {
  status?: EntryStatus;
  categoria?: EntryCategoria;
  authorId?: string;
}

const ATTACHMENTS_BUCKET = 'diario-attachments';

const toEntry = (row: DiarioEntryRow): DiarioEntry => ({
  id: row.id,
  empresaId: row.empresa_id,
  authorId: row.author_id,
  authorCodigo: row.author_codigo ?? undefined,
  categoria: row.categoria,
  titulo: row.titulo,
  corpo: row.corpo,
  resolucao: row.resolucao ?? undefined,
  ocorrencias: row.ocorrencias,
  status: row.status,
  escaladoEm: row.escalado_em ?? undefined,
  attachments: row.attachments ?? [],
  expiresAt: row.expires_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  updatedBy: row.updated_by ?? undefined,
});

const toResposta = (row: DiarioRespostaRow): DiarioResposta => ({
  id: row.id,
  entryId: row.entry_id,
  empresaId: row.empresa_id,
  authorId: row.author_id,
  authorCodigo: row.author_codigo ?? undefined,
  corpo: row.corpo,
  createdAt: row.created_at,
});

const toAudit = (row: DiarioAuditRow): DiarioAuditLog => ({
  id: row.id,
  empresaId: row.empresa_id,
  entryId: row.entry_id ?? undefined,
  userId: row.user_id,
  userCodigo: row.user_codigo ?? undefined,
  userRole: row.user_role,
  action: row.action,
  metadata: row.metadata ?? {},
  createdAt: row.created_at,
});

const ensureBucket = async () => {
  const { data } = await supabase.storage.listBuckets();
  const exists = (data ?? []).some(bucket => bucket.name === ATTACHMENTS_BUCKET);
  if (!exists) {
    await supabase.storage.createBucket(ATTACHMENTS_BUCKET, { public: false });
  }
};

export async function listEntries(empresaId: string, filters?: ListFilters): Promise<DiarioEntry[]> {
  let query = supabase
    .from('diario_entries')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('updated_at', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.categoria) query = query.eq('categoria', filters.categoria);
  if (filters?.authorId) query = query.eq('author_id', filters.authorId);

  const { data, error } = await query.returns<DiarioEntryRow[]>();
  if (error) throw new Error(`Erro ao listar entradas do diario: ${error.message}`);
  return (data ?? []).map(toEntry);
}

export async function getEntry(id: string): Promise<DiarioEntry> {
  const { data, error } = await supabase.from('diario_entries').select('*').eq('id', id).single<DiarioEntryRow>();
  if (error) throw new Error(`Erro ao buscar entrada do diario: ${error.message}`);
  return toEntry(data);
}

export type CreateInput = Omit<DiarioEntry, 'id' | 'createdAt' | 'updatedAt' | 'ocorrencias' | 'status'>;

export async function createEntry(input: CreateInput): Promise<DiarioEntry> {
  const { data: existing, error: existingError } = await supabase
    .from('diario_entries')
    .select('*')
    .eq('empresa_id', input.empresaId)
    .eq('author_id', input.authorId)
    .eq('categoria', input.categoria)
    .neq('status', 'resolvido')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle<DiarioEntryRow>();

  if (existingError) throw new Error(`Erro ao verificar reincidencia do diario: ${existingError.message}`);

  if (existing) {
    const nextOcorrencias = existing.ocorrencias + 1;
    const nextStatus: EntryStatus = nextOcorrencias >= 3 && existing.status === 'aberto' ? 'escalado' : existing.status;
    const now = new Date().toISOString();

    const { data: updated, error: updateError } = await supabase
      .from('diario_entries')
      .update({
        corpo: input.corpo,
        titulo: input.titulo,
        attachments: input.attachments,
        ocorrencias: nextOcorrencias,
        status: nextStatus,
        escalado_em: nextStatus === 'escalado' && !existing.escalado_em ? now : existing.escalado_em,
        updated_at: now,
        updated_by: input.updatedBy ?? null,
      })
      .eq('id', existing.id)
      .select('*')
      .single<DiarioEntryRow>();

    if (updateError) throw new Error(`Erro ao atualizar reincidencia do diario: ${updateError.message}`);
    return toEntry(updated);
  }

  const { data, error } = await supabase
    .from('diario_entries')
    .insert({
      empresa_id: input.empresaId,
      author_id: input.authorId,
      author_codigo: input.authorCodigo ?? null,
      categoria: input.categoria,
      titulo: input.titulo,
      corpo: input.corpo,
      resolucao: input.resolucao ?? null,
      attachments: input.attachments ?? [],
      expires_at: input.expiresAt,
      updated_by: input.updatedBy ?? null,
      ocorrencias: 1,
      status: 'aberto',
    })
    .select('*')
    .single<DiarioEntryRow>();

  if (error) throw new Error(`Erro ao criar entrada do diario: ${error.message}`);
  return toEntry(data);
}

export async function updateEntry(id: string, patch: Partial<DiarioEntry>): Promise<DiarioEntry> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.titulo !== undefined) payload.titulo = patch.titulo;
  if (patch.corpo !== undefined) payload.corpo = patch.corpo;
  if (patch.categoria !== undefined) payload.categoria = patch.categoria;
  if (patch.resolucao !== undefined) payload.resolucao = patch.resolucao;
  if (patch.attachments !== undefined) payload.attachments = patch.attachments;
  if (patch.updatedBy !== undefined) payload.updated_by = patch.updatedBy;

  const { data, error } = await supabase
    .from('diario_entries')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single<DiarioEntryRow>();
  if (error) throw new Error(`Erro ao atualizar entrada do diario: ${error.message}`);
  return toEntry(data);
}

export async function escalateEntry(id: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase.from('diario_entries').update({ status: 'escalado', escalado_em: now, updated_at: now }).eq('id', id);
  if (error) throw new Error(`Erro ao escalar entrada do diario: ${error.message}`);
}

export async function resolveEntry(id: string, resolucao: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase.from('diario_entries').update({ status: 'resolvido', resolucao, updated_at: now }).eq('id', id);
  if (error) throw new Error(`Erro ao resolver entrada do diario: ${error.message}`);
}

export async function archiveEntry(id: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase.from('diario_entries').update({ status: 'arquivado', updated_at: now }).eq('id', id);
  if (error) throw new Error(`Erro ao arquivar entrada do diario: ${error.message}`);
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase.from('diario_entries').delete().eq('id', id);
  if (error) throw new Error(`Erro ao excluir entrada do diario: ${error.message}`);
}

export async function uploadAttachment(entryId: string, file: File): Promise<string> {
  await ensureBucket();
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
  const path = `diario/${entryId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(ATTACHMENTS_BUCKET).upload(path, file, { upsert: false });
  if (error) throw new Error(`Erro ao enviar anexo do diario: ${error.message}`);
  return path;
}

export async function cleanupTempAttachments(): Promise<void> {
  await ensureBucket();

  const { data, error } = await supabase.storage.from(ATTACHMENTS_BUCKET).list('temp');
  if (error || !data?.length) return;

  const tempPaths = data
    .map(item => item.name)
    .filter((name): name is string => Boolean(name))
    .map(name => `temp/${name}`);

  if (!tempPaths.length) return;
  await supabase.storage.from(ATTACHMENTS_BUCKET).remove(tempPaths);
}

export async function createEntryWithAttachments(input: CreateInput, files: File[] = []): Promise<DiarioEntry> {
  let created = await createEntry({ ...input, attachments: [] });

  if (!files.length) return created;

  try {
    await cleanupTempAttachments();
  } catch {
    // limpeza best-effort
  }

  const attachmentPaths: string[] = [];
  for (const file of files) {
    const path = await uploadAttachment(created.id, file);
    attachmentPaths.push(path);
  }

  created = await updateEntry(created.id, {
    attachments: attachmentPaths,
    updatedBy: input.updatedBy,
  });
  return created;
}

export async function getAttachmentUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(ATTACHMENTS_BUCKET).createSignedUrl(path, 60 * 60);
  if (error || !data?.signedUrl) throw new Error(`Erro ao gerar URL de anexo do diario: ${error?.message ?? 'URL vazia'}`);
  return data.signedUrl;
}

export async function listRespostas(entryId: string): Promise<DiarioResposta[]> {
  const { data, error } = await supabase
    .from('diario_respostas')
    .select('*')
    .eq('entry_id', entryId)
    .order('created_at', { ascending: true })
    .returns<DiarioRespostaRow[]>();
  if (error) throw new Error(`Erro ao listar respostas do diario: ${error.message}`);
  return (data ?? []).map(toResposta);
}

export async function createResposta(input: Omit<DiarioResposta, 'id' | 'createdAt'>): Promise<DiarioResposta> {
  const { data, error } = await supabase
    .from('diario_respostas')
    .insert({
      entry_id: input.entryId,
      empresa_id: input.empresaId,
      author_id: input.authorId,
      author_codigo: input.authorCodigo ?? null,
      corpo: input.corpo,
    })
    .select('*')
    .single<DiarioRespostaRow>();
  if (error) throw new Error(`Erro ao criar resposta do diario: ${error.message}`);
  return toResposta(data);
}

export async function logAction(params: Omit<DiarioAuditLog, 'id' | 'createdAt'>): Promise<void> {
  const { error } = await supabase.from('diario_audit_log').insert({
    empresa_id: params.empresaId,
    entry_id: params.entryId ?? null,
    user_id: params.userId,
    user_codigo: params.userCodigo ?? null,
    user_role: params.userRole,
    action: params.action,
    metadata: params.metadata ?? {},
  });
  if (error) throw new Error(`Erro ao registrar audit log do diario: ${error.message}`);
}

export async function listAuditLog(empresaId: string, entryId?: string): Promise<DiarioAuditLog[]> {
  let query = supabase.from('diario_audit_log').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false });
  if (entryId) query = query.eq('entry_id', entryId);
  const { data, error } = await query.returns<DiarioAuditRow[]>();
  if (error) throw new Error(`Erro ao listar audit log do diario: ${error.message}`);
  return (data ?? []).map(toAudit);
}
