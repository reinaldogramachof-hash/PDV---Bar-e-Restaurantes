import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Plus, AlertTriangle, CheckCircle2, Paperclip, Download, X } from 'lucide-react';
import { useApp } from '../store/AppContext';
import type { DiarioEntry } from '../types';
import { createEntryWithAttachments, escalateEntry, getAttachmentUrl, listEntries, resolveEntry, logAction } from '../services/diarioService';

const statusOptions: Array<{ id: 'all' | DiarioEntry['status']; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'aberto', label: 'Abertas' },
  { id: 'escalado', label: 'Escaladas' },
  { id: 'resolvido', label: 'Resolvidas' },
  { id: 'arquivado', label: 'Arquivadas' },
];

const categoryOptions: DiarioEntry['categoria'][] = ['funcionario', 'fornecedor', 'cliente', 'operacional', 'financeiro', 'outro'];

export const Diario: React.FC = () => {
  const { theme, currentEmpresa, currentUser } = useApp();
  const [entries, setEntries] = useState<DiarioEntry[]>([]);
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]['id']>('all');
  const [categoryFilter, setCategoryFilter] = useState<DiarioEntry['categoria'] | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [corpo, setCorpo] = useState('');
  const [categoria, setCategoria] = useState<DiarioEntry['categoria']>('operacional');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveTargetId, setResolveTargetId] = useState<string | null>(null);
  const [resolucao, setResolucao] = useState('');
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({});
  const [lightbox, setLightbox] = useState<{ path: string; url: string } | null>(null);

  const isDark = theme === 'dark';

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await listEntries(currentEmpresa.id, {
        status: statusFilter === 'all' ? undefined : statusFilter,
        categoria: categoryFilter === 'all' ? undefined : categoryFilter,
      });
      setEntries(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEntries();
  }, [currentEmpresa.id, statusFilter, categoryFilter]);

  const canManage = useMemo(() => currentUser.role === 'master' || currentUser.role === 'gerente', [currentUser.role]);
  const attachmentPaths = useMemo(
    () => Array.from(new Set(entries.flatMap(entry => entry.attachments ?? []))),
    [entries],
  );

  useEffect(() => {
    let active = true;

    const hydrateAttachmentUrls = async () => {
      const missingPaths = attachmentPaths.filter(path => !attachmentUrls[path]);
      if (missingPaths.length === 0) return;

      const next: Record<string, string> = {};
      await Promise.all(
        missingPaths.map(async path => {
          try {
            next[path] = await getAttachmentUrl(path);
          } catch {
            // ignora anexos indisponíveis
          }
        }),
      );

      if (!active || Object.keys(next).length === 0) return;
      setAttachmentUrls(prev => ({ ...prev, ...next }));
    };

    void hydrateAttachmentUrls();

    return () => {
      active = false;
    };
  }, [attachmentPaths, attachmentUrls]);

  const isImageAttachment = (path: string) => /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(path);

  const publish = async () => {
    const created = await createEntryWithAttachments({
      empresaId: currentEmpresa.id,
      authorId: currentUser.id,
      categoria,
      titulo,
      corpo,
      attachments: [],
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 2).toISOString(),
      authorCodigo: currentUser.codigoInterno ?? undefined,
      updatedBy: currentUser.id,
    }, attachmentFiles);
    await logAction({
      empresaId: currentEmpresa.id,
      entryId: created.id,
      userId: currentUser.id,
      userCodigo: currentUser.codigoInterno,
      userRole: currentUser.role,
      action: 'create',
      metadata: { categoria, titulo },
    });
    setShowModal(false);
    setTitulo('');
    setCorpo('');
    setAttachmentFiles([]);
    await loadEntries();
  };

  const openAttachment = async (path: string) => {
    try {
      const cached = attachmentUrls[path];
      if (cached) {
        setLightbox({ path, url: cached });
        return;
      }

      const signedUrl = await getAttachmentUrl(path);
      setAttachmentUrls(prev => ({ ...prev, [path]: signedUrl }));
      setLightbox({ path, url: signedUrl });
    } catch {
      // ignora anexo indisponível
    }
  };

  const handleEscalate = async (entryId: string) => {
    await escalateEntry(entryId);
    await logAction({
      empresaId: currentEmpresa.id,
      entryId,
      userId: currentUser.id,
      userCodigo: currentUser.codigoInterno,
      userRole: currentUser.role,
      action: 'escalate',
      metadata: {},
    });
    await loadEntries();
  };

  const handleResolve = async () => {
    if (!resolveTargetId || !resolucao.trim()) return;
    await resolveEntry(resolveTargetId, resolucao.trim());
    await logAction({
      empresaId: currentEmpresa.id,
      entryId: resolveTargetId,
      userId: currentUser.id,
      userCodigo: currentUser.codigoInterno,
      userRole: currentUser.role,
      action: 'resolve',
      metadata: { resolucao },
    });
    setShowResolveModal(false);
    setResolveTargetId(null);
    setResolucao('');
    await loadEntries();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 min-h-full pb-8">
      <aside className={`rounded-panel border p-4 ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-200'}`}>
        <h3 className="text-sm font-semibold mb-3">Filtros</h3>
        <div className="space-y-2">
          {statusOptions.map(option => (
            <button key={option.id} onClick={() => setStatusFilter(option.id)} className={`w-full text-left px-3 py-2 rounded-control text-sm ${statusFilter === option.id ? 'bg-[var(--color-accent)] text-white' : 'bg-black/5 dark:bg-white/5'}`}>
              {option.label}
            </button>
          ))}
        </div>
        <h4 className="text-xs mt-5 mb-2 opacity-70 uppercase">Categorias</h4>
        <div className="space-y-2">
          <button onClick={() => setCategoryFilter('all')} className={`w-full text-left px-3 py-2 rounded-control text-sm ${categoryFilter === 'all' ? 'bg-[var(--color-accent)] text-white' : 'bg-black/5 dark:bg-white/5'}`}>Todas</button>
          {categoryOptions.map(cat => (
            <button key={cat} onClick={() => setCategoryFilter(cat)} className={`w-full text-left px-3 py-2 rounded-control text-sm capitalize ${categoryFilter === cat ? 'bg-[var(--color-accent)] text-white' : 'bg-black/5 dark:bg-white/5'}`}>
              {cat}
            </button>
          ))}
        </div>
      </aside>
      <main className={`rounded-panel border p-4 ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><BookOpen className="w-4 h-4" /> Diário Operacional</h2>
          {canManage && (
            <button onClick={() => setShowModal(true)} className="px-3 py-2 rounded-control bg-[var(--color-accent)] text-white text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" /> Nova Entrada
            </button>
          )}
        </div>
        <div className="space-y-3">
          {loading && <p className="text-sm opacity-70">Carregando...</p>}
          {!loading && entries.length === 0 && <p className="text-sm opacity-70">Sem entradas para os filtros atuais.</p>}
          {entries.map(entry => (
            <div key={entry.id} className="rounded-control border p-3 space-y-2">
              <div className="flex justify-between gap-3">
                <p className="text-xs opacity-70">[{entry.authorCodigo ?? 'USR'}] · {entry.categoria}</p>
                {entry.ocorrencias >= 2 && <span className="text-xs px-2 py-0.5 rounded bg-red-500/15 text-red-500">Reincidencia {entry.ocorrencias}</span>}
              </div>
              <h3 className="font-semibold">{entry.titulo}</h3>
              <p className="text-sm opacity-80">{entry.corpo}</p>
              {entry.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {entry.attachments.map(path => {
                    const imageAttachment = isImageAttachment(path);
                    const signedUrl = attachmentUrls[path];

                    if (imageAttachment) {
                      return (
                        <button
                          key={path}
                          type="button"
                          onClick={() => void openAttachment(path)}
                          className="h-12 w-12 rounded-control overflow-hidden border"
                          title="Abrir anexo"
                        >
                          {signedUrl ? (
                            <img src={signedUrl} alt="Anexo do diário" className="h-12 w-12 object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[10px] opacity-60">...</div>
                          )}
                        </button>
                      );
                    }

                    return (
                      <button
                        key={path}
                        type="button"
                        onClick={() => void openAttachment(path)}
                        className="h-12 px-3 rounded-control border text-xs flex items-center gap-2"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        <span>Baixar anexo</span>
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="flex gap-2">
                {canManage && entry.status === 'aberto' && (
                  <button onClick={() => { void handleEscalate(entry.id); }} className="px-2 py-1 rounded bg-amber-500/20 text-amber-600 text-xs flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Escalar
                  </button>
                )}
                {canManage && entry.status !== 'resolvido' && (
                  <button
                    onClick={() => { setResolveTargetId(entry.id); setShowResolveModal(true); }}
                    className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-600 text-xs flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" /> Resolver
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-xl rounded-panel border p-4 space-y-3 ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-200'}`}>
            <h3 className="font-semibold">Nova Entrada</h3>
            <select
              value={categoria}
              onChange={e => setCategoria(e.target.value as DiarioEntry['categoria'])}
              className={`w-full p-2 rounded-control border ${
                isDark ? 'bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)]' : 'bg-white text-gray-900 border-gray-300'
              }`}
            >
              {categoryOptions.map(cat => (
                <option key={cat} value={cat} className={isDark ? 'bg-[var(--color-surface)] text-[var(--color-text)]' : 'bg-white text-gray-900'}>
                  {cat}
                </option>
              ))}
            </select>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} className="w-full p-2 rounded-control border bg-transparent" placeholder="Titulo" />
            <textarea value={corpo} onChange={e => setCorpo(e.target.value)} className="w-full p-2 rounded-control border bg-transparent min-h-[120px]" placeholder="Corpo" />
            <div>
              <label className="text-xs text-[var(--color-muted)] mb-1 block">Arquivos (max. 5)</label>
              <input
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={e => {
                  const files = Array.from(e.target.files ?? []).slice(0, 5);
                  setAttachmentFiles(files);
                }}
                className="text-sm"
              />
              {attachmentFiles.length > 0 && (
                <p className="text-xs text-[var(--color-muted)] mt-1">{attachmentFiles.length} imagem(s) selecionada(s)</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="px-3 py-2 rounded-control border">Cancelar</button>
              <button onClick={publish} className="px-3 py-2 rounded-control bg-[var(--color-accent)] text-white">Publicar</button>
            </div>
          </div>
        </div>
      )}
      {lightbox && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/40 text-white flex items-center justify-center"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="max-w-2xl w-full">
            {isImageAttachment(lightbox.path) ? (
              <img src={lightbox.url} alt="Anexo ampliado" className="w-full max-h-[80vh] object-contain rounded-control" />
            ) : (
              <div className="rounded-control bg-white p-5 text-center text-sm">
                Pré-visualização não disponível para este arquivo.
              </div>
            )}
            <div className="mt-4 flex justify-center">
              <a
                href={lightbox.url}
                target="_blank"
                rel="noreferrer"
                className="h-10 px-4 rounded-control bg-accent text-white text-sm font-medium inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </div>
          </div>
        </div>
      )}
      {showResolveModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-panel border p-4 space-y-3 ${isDark ? 'bg-[var(--color-surface)] border-[var(--color-border)]' : 'bg-white border-gray-200'}`}>
            <h3 className="font-semibold">Descreva a solucao aplicada</h3>
            <textarea
              value={resolucao}
              onChange={e => setResolucao(e.target.value)}
              className="w-full p-2 rounded-control border bg-transparent min-h-[100px]"
              placeholder="O que foi feito para resolver a situacao..."
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowResolveModal(false); setResolveTargetId(null); setResolucao(''); }} className="px-3 py-2 rounded-control border text-sm">Cancelar</button>
              <button onClick={() => { void handleResolve(); }} disabled={!resolucao.trim()} className="px-3 py-2 rounded-control bg-emerald-600 text-white text-sm disabled:opacity-40">Confirmar Resolucao</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
