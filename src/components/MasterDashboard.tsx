import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  AlertTriangle, Bell, Building2, CalendarDays, ChevronDown,
  ChevronRight, Copy, Filter, Info, LineChart, MessageSquare,
  MoreHorizontal, Plus, ReceiptText, ShieldAlert, ShoppingBag,
  Sparkles, Tag, TrendingUp, Trash2, Zap, X, Phone, Mail, Search,
  ArrowRight, ClipboardList, Upload, Download, FileText, History, Settings,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../store/AppContext';
import { useMaster } from '../hooks/useMaster';
import {
  getMrrHistory,
  calcCurrentMrr,
  recordCurrentMrr,
} from '../services/plenaHubService';
import {
  addEmpresaHistory,
  deleteEmpresaDocument,
  getDocumentSignedUrl,
  getEmpresaDetail,
  listEmpresaDocuments,
  listEmpresaHistory,
  listEmpresaProfiles,
  updateEmpresaDetail,
  uploadEmpresaDocument,
} from '../services/masterService';
import type {
  CreateEmpresaInput,
  EmpresaDetail,
  EmpresaDocument,
  EmpresaHistoryEntry,
  ProfileSummary,
} from '../services/masterService';
import { usePlenaProspects } from '../hooks/usePlenaProspects';
import { createActivity, listActivities, type PlenaActivity, type PlenaProspect } from '../services/plenaProspectsService';
import { listEmpresaModules, removeEmpresaModule, upsertEmpresaModule, type EmpresaModule } from '../services/empresaModulesService';
import { addonLabels, addonModules, addonPricing, calcMrrEmpresa, calcMrrTotal, packDescriptions, packLabels, packModules, packPricing, planDescriptions, planModules, planPricing, type AddonModuleId, type ModuleId, type PackId } from '../domain/saas';
import { addMessage, listAllTickets, listMessages, updateTicketStatus, type SupportMessage, type SupportTicket } from '../services/supportService';
import { supabase } from '../lib/supabase';
import { createNotification, deleteNotification, duplicateNotification, listNotifications, publishNotification, type MasterNotification } from '../services/masterNotificationsService';
import type { Prospect, ProspectStage, CommercialActivity, AppNotification, Empresa } from '../types';

// ---

type Tab = 'overview' | 'companies' | 'notifications' | 'comercial' | 'suporte';

// ---

// ---

const STAGES: { id: ProspectStage; label: string; color: string }[] = [
  { id: 'contato',    label: 'Contato',    color: 'text-muted' },
  { id: 'demo',       label: 'Demo',       color: 'text-accent' },
  { id: 'proposta',   label: 'Proposta',   color: 'text-warning' },
  { id: 'contrato',   label: 'Contrato',   color: 'text-success' },
  { id: 'onboarding', label: 'Onboarding', color: 'text-success' },
  { id: 'ativo',      label: 'Ativo',      color: 'text-success' },
];


const PLANO_LABELS: Record<string, string> = {
  essencial: 'Essencial',
  profissional: 'Profissional',
  gestao: 'Gestão',
};
const LICENSE_LABELS: Record<string, string> = {
  active: 'Ativo',
  trial: 'Trial',
  suspended: 'Suspenso',
};
const PLAN_LABELS = PLANO_LABELS;

const ACTIVITY_LABELS: Record<CommercialActivity['type'], string> = {
  note: 'Nota', call: 'Ligação', demo: 'Demo', proposal: 'Proposta',
  contract: 'Contrato', upgrade: 'Upgrade', churn: 'Churn',
};

const NOTIF_ICON: Record<AppNotification['type'], React.ComponentType<{ className?: string }>> = {
  update: Sparkles, security: ShieldAlert, feature: Zap,
  support: MessageSquare, sales: Tag, info: Info,
};

// ---

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const MRR_HISTORY_STORAGE_KEY = 'gestao-gastro:plena:mrr-history';

type MrrHistoryPoint = { month: string; mrr: number };

const getMonthKey = () => new Date().toISOString().slice(0, 7);

const readMasterMrrHistory = (): MrrHistoryPoint[] => {
  try {
    const raw = localStorage.getItem(MRR_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MrrHistoryPoint[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(entry => typeof entry?.month === 'string' && typeof entry?.mrr === 'number')
      .sort((a, b) => a.month.localeCompare(b.month));
  } catch {
    return [];
  }
};

const relativeTime = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return 'há menos de 1h';
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `há ${diffD}d`;
};

const isExpired = (draft: MasterNotification) =>
  draft.expiresAt ? new Date(draft.expiresAt) < new Date() : false;

const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

// ---

interface ProspectModalProps {
  prospect?: PlenaProspect;
  onClose: () => void;
  onSave: (input: Omit<PlenaProspect, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => Promise<void>;
  isDark: boolean;
  elevatedClass: string;
  panelClass: string;
}

const BLANK_PROSPECT = {
  businessName: '', contactName: '', contactPhone: '', contactEmail: '',
  planInterest: 'essencial' as Prospect['planInterest'],
  stage: 'contato' as ProspectStage, notes: '', lostReason: '', monthlyValue: 0,
};

const ProspectModal: React.FC<ProspectModalProps> = ({ prospect, onClose, onSave, isDark, elevatedClass, panelClass }) => {
  const [form, setForm] = useState({ ...BLANK_PROSPECT, ...prospect });
  const isEdit = Boolean(prospect);

  const handleSave = async () => {
    if (!form.businessName || !form.contactName || !form.contactPhone) return;
    await onSave({
      businessName: form.businessName,
      contactName: form.contactName,
      contactPhone: form.contactPhone,
      contactEmail: form.contactEmail || '',
      planInterest: form.planInterest,
      stage: form.stage,
      notes: form.notes,
      lostReason: form.lostReason || undefined,
      monthlyValue: form.monthlyValue,
      lastInteractionAt: prospect?.lastInteractionAt || new Date().toISOString(),
    }, prospect?.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-lg rounded-section border shadow-elevated ${panelClass}`}
      >
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-border' : 'border-border-light'}`}>
          <h3 className="text-sm font-semibold">{isEdit ? 'Editar Prospect' : 'Novo Prospect'}</h3>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {([
            ['businessName', 'Nome do estabelecimento *'],
            ['contactName', 'Nome do contato *'],
            ['contactPhone', 'Telefone *'],
            ['contactEmail', 'E-mail (opcional)'],
          ] as [keyof typeof form, string][]).map(([field, label]) => (
            <div key={field}>
              <label className="block text-xs text-muted mb-1">{label}</label>
              <input
                id={`prospect-${String(field)}`}
                value={form[field] as string}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                className={`w-full h-10 px-3 rounded-control border text-sm ${elevatedClass}`}
              />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1">Plano de interesse</label>
              <select
                id="prospect-planInterest"
                value={form.planInterest}
                onChange={e => setForm(f => ({ ...f, planInterest: e.target.value as Prospect['planInterest'] }))}
                className={`w-full h-10 px-3 rounded-control border text-sm ${elevatedClass}`}
              >
                <option value="essencial">{PLANO_LABELS.essencial}</option>
                <option value="profissional">{PLANO_LABELS.profissional}</option>
                <option value="gestao">Gestão</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Valor mensal estimado</label>
              <input
                id="prospect-monthlyValue"
                type="number"
                min="0"
                value={form.monthlyValue}
                onChange={e => setForm(f => ({ ...f, monthlyValue: Number(e.target.value) }))}
                className={`w-full h-10 px-3 rounded-control border text-sm ${elevatedClass}`}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Estágio atual</label>
            <select
              id="prospect-stage"
              value={form.stage}
              onChange={e => setForm(f => ({ ...f, stage: e.target.value as ProspectStage }))}
              className={`w-full h-10 px-3 rounded-control border text-sm ${elevatedClass}`}
            >
              {[...STAGES, { id: 'perdido' as ProspectStage, label: 'Perdido', color: '' }].map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          {form.stage === 'perdido' && (
            <div>
              <label className="block text-xs text-muted mb-1">Motivo de perda</label>
              <textarea
                id="prospect-lostReason"
                value={form.lostReason}
                onChange={e => setForm(f => ({ ...f, lostReason: e.target.value }))}
                rows={2}
                className={`w-full px-3 py-2 rounded-control border text-sm resize-none ${elevatedClass}`}
              />
            </div>
          )}
          <div>
            <label className="block text-xs text-muted mb-1">Notas</label>
            <textarea
              id="prospect-notes"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
              className={`w-full px-3 py-2 rounded-control border text-sm resize-none ${elevatedClass}`}
            />
          </div>
        </div>
        <div className={`flex justify-end gap-3 px-5 py-4 border-t ${isDark ? 'border-border' : 'border-border-light'}`}>
          <button onClick={onClose} className={`h-10 px-4 rounded-control border text-xs font-medium ${elevatedClass}`}>Cancelar</button>
          <button
            id="prospect-save"
            onClick={() => void handleSave()}
            disabled={!form.businessName || !form.contactName || !form.contactPhone}
            className="h-10 px-4 rounded-control bg-accent text-white text-xs font-medium hover:bg-accent-hover disabled:opacity-40"
          >
            {isEdit ? 'Salvar' : 'Criar Prospect'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ---

interface ActivityModalProps {
  prospectId: string;
  prospectName: string;
  onClose: () => void;
  onSave: () => Promise<void>;
  isDark: boolean;
  elevatedClass: string;
  panelClass: string;
}

const ActivityModal: React.FC<ActivityModalProps> = ({ prospectId, prospectName, onClose, onSave, isDark, elevatedClass, panelClass }) => {
  const [type, setType] = useState<CommercialActivity['type']>('note');
  const [description, setDescription] = useState('');
  const [activities, setActivities] = useState<PlenaActivity[]>([]);

  useEffect(() => {
    const run = async () => {
      const next = await listActivities(prospectId);
      setActivities(next);
    };
    void run();
  }, [prospectId]);

  const handleAdd = async () => {
    if (!description.trim()) return;
    await createActivity({ prospectId, type, description });
    setDescription('');
    await onSave();
    const next = await listActivities(prospectId);
    setActivities(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-md rounded-section border shadow-elevated ${panelClass}`}
      >
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-border' : 'border-border-light'}`}>
          <div>
            <h3 className="text-sm font-semibold">Adicionar atividade</h3>
            <p className="text-xs text-muted mt-0.5">{prospectName}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-muted mb-1">Tipo</label>
            <select
              id="activity-type"
              value={type}
              onChange={e => setType(e.target.value as CommercialActivity['type'])}
              className={`w-full h-10 px-3 rounded-control border text-sm ${elevatedClass}`}
            >
              {(Object.keys(ACTIVITY_LABELS) as CommercialActivity['type'][]).map(t => (
                <option key={t} value={t}>{ACTIVITY_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Descrição</label>
            <textarea
              id="activity-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 rounded-control border text-sm resize-none ${elevatedClass}`}
              placeholder="O que aconteceu nesta interação?"
            />
          </div>
          <button
            id="activity-add"
            onClick={() => void handleAdd()}
            disabled={!description.trim()}
            className="h-10 w-full rounded-control bg-accent text-white text-xs font-medium hover:bg-accent-hover disabled:opacity-40"
          >
            Registrar atividade
          </button>
        </div>
        {activities.length > 0 && (
          <div className={`px-5 pb-5 border-t ${isDark ? 'border-border' : 'border-border-light'}`}>
            <p className="text-xs font-medium text-muted mt-4 mb-3">Histórico</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {activities.map(a => (
                <div key={a.id} className={`p-3 rounded-panel border ${elevatedClass}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-accent">{ACTIVITY_LABELS[a.type]}</span>
                    <span className="text-xs text-muted">{relativeTime(a.createdAt)}</span>
                  </div>
                  <p className="text-xs text-muted mt-1">{a.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

interface CreateEmpresaModalProps {
  onClose: () => void;
  onCreated: () => void;
  onSubmit: (input: CreateEmpresaInput) => Promise<void>;
  isDark: boolean;
  elevatedClass: string;
  panelClass: string;
}

const CreateEmpresaModal: React.FC<CreateEmpresaModalProps> = ({ onClose, onCreated, onSubmit, isDark, elevatedClass, panelClass }) => {
  const [form, setForm] = useState<CreateEmpresaInput>({
    name: '',
    document: '',
    plano: 'essencial',
    licenseStatus: 'trial',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [contractType, setContractType] = useState<'plano' | 'pack'>('plano');
  const friendlyMessage = (msg: string) => {
    if (msg.includes('already registered') || msg.includes('already been registered')) {
      return 'E-mail já cadastrado no sistema.';
    }
    if (msg.includes('Failed to fetch') || msg.includes('404') || msg.includes('FunctionsHttpError')) {
      return 'Serviço de criação indisponível. Contate o suporte técnico da Plena.';
    }
    return msg;
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await onSubmit({
        ...form,
        plano: contractType === 'pack' ? 'essencial' : form.plano,
      });
      setSuccess('Empresa criada com sucesso.');
      onCreated();
      onClose();
    } catch (err) {
      setError(friendlyMessage(err instanceof Error ? err.message : 'Erro ao criar empresa.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`w-full max-w-lg rounded-section border shadow-elevated ${panelClass}`}
      >
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-border' : 'border-border-light'}`}>
          <h3 className="text-sm font-semibold">Nova empresa</h3>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs text-muted mb-1">Nome da empresa *</label>
            <input
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full h-10 px-3 rounded-control border text-sm ${elevatedClass}`}
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">CNPJ / Documento</label>
            <input
              value={form.document}
              onChange={e => setForm(prev => ({ ...prev, document: e.target.value }))}
              className={`w-full h-10 px-3 rounded-control border text-sm ${elevatedClass}`}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs text-muted">Tipo de contratação</label>
            <div className="flex gap-2">
              <button
                onClick={() => setContractType('plano')}
                className={`h-8 px-3 rounded-control text-xs font-medium ${contractType === 'plano' ? 'bg-accent text-white' : `border ${elevatedClass}`}`}
              >
                Plano fixo
              </button>
              <button
                onClick={() => setContractType('pack')}
                className={`h-8 px-3 rounded-control text-xs font-medium ${contractType === 'pack' ? 'bg-accent text-white' : `border ${elevatedClass}`}`}
              >
                Pack por segmento
              </button>
            </div>
          </div>
          {contractType === 'plano' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['essencial', 'profissional', 'gestao'] as const).map(plano => (
                <button
                  key={plano}
                  onClick={() => setForm(prev => ({ ...prev, plano, packId: undefined }))}
                  className={`p-3 rounded-panel border text-left ${form.plano === plano ? 'border-accent bg-accent/10' : elevatedClass}`}
                >
                  <p className="text-xs font-semibold capitalize">{plano}</p>
                  <p className="text-xs text-muted mt-1">R$ {planPricing[plano]}/mês</p>
                  <p className="text-[10px] text-muted mt-1">{planDescriptions[plano]}</p>
                  <p className="text-[10px] text-muted mt-1">{planModules[plano].slice(0, 4).join(', ')}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(Object.keys(packModules) as PackId[]).map(packId => (
                <button
                  key={packId}
                  onClick={() => setForm(prev => ({ ...prev, packId }))}
                  className={`p-3 rounded-panel border text-left ${form.packId === packId ? 'border-accent bg-accent/10' : elevatedClass}`}
                >
                  <p className="text-xs font-semibold">{packLabels[packId]}</p>
                  <p className="text-xs text-muted mt-1">R$ {packPricing[packId]}/mês</p>
                  <p className="text-[10px] text-muted mt-1">{packDescriptions[packId]}</p>
                </button>
              ))}
            </div>
          )}
          <div>
            <label className="block text-xs text-muted mb-1">Status inicial</label>
            <select
              value={form.licenseStatus}
              onChange={e => setForm(prev => ({ ...prev, licenseStatus: e.target.value as CreateEmpresaInput['licenseStatus'] }))}
              className={`w-full h-10 px-3 rounded-control border text-sm ${elevatedClass}`}
            >
              <option value="trial">{LICENSE_LABELS.trial}</option>
              <option value="active">{LICENSE_LABELS.active}</option>
              <option value="suspended">{LICENSE_LABELS.suspended}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Nome admin</label>
            <input
              value={form.adminName}
              onChange={e => setForm(prev => ({ ...prev, adminName: e.target.value }))}
              className={`w-full h-10 px-3 rounded-control border text-sm ${elevatedClass}`}
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Email admin</label>
            <input
              value={form.adminEmail}
              onChange={e => setForm(prev => ({ ...prev, adminEmail: e.target.value }))}
              className={`w-full h-10 px-3 rounded-control border text-sm ${elevatedClass}`}
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Senha admin</label>
            <input
              type="password"
              value={form.adminPassword}
              onChange={e => setForm(prev => ({ ...prev, adminPassword: e.target.value }))}
              className={`w-full h-10 px-3 rounded-control border text-sm ${elevatedClass}`}
            />
          </div>
          {error && (
            <div className="text-xs text-danger">{error}</div>
          )}
          {success && (
            <div className="text-xs text-success">{success}</div>
          )}
        </div>
        <div className={`flex justify-end gap-3 px-5 py-4 border-t ${isDark ? 'border-border' : 'border-border-light'}`}>
          <button onClick={onClose} className={`h-10 px-4 rounded-control border text-xs font-medium ${elevatedClass}`}>Cancelar</button>
          <button
            onClick={() => void handleCreate()}
            disabled={loading || !form.name.trim()}
            className="h-10 px-4 rounded-control bg-accent text-white text-xs font-medium hover:bg-accent-hover disabled:opacity-40"
          >
            {loading ? 'Criando...' : 'Criar empresa'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

interface EmpresaDetailModalProps {
  empresa: Empresa;
  onClose: () => void;
  onUpdatePlano: (id: string, plano: Empresa['plano']) => Promise<void>;
  onUpdateLicense: (id: string, status: Empresa['licenseStatus']) => Promise<void>;
  onModulesChanged: () => Promise<void>;
  isDark: boolean;
  elevatedClass: string;
  panelClass: string;
}

type DetailTab = 'dados' | 'contrato' | 'documentos' | 'historico';

const EmpresaDetailModal: React.FC<EmpresaDetailModalProps> = ({
  empresa,
  onClose,
  onUpdatePlano,
  onUpdateLicense,
  onModulesChanged,
  isDark,
  elevatedClass,
  panelClass,
}) => {
  const { currentUser } = useApp();
  const profileRoleOptions = ['master', 'gerente', 'caixa', 'garcom', 'cozinha', 'estoque', 'suporte'] as const;
  const [detailTab, setDetailTab] = useState<DetailTab>('dados');
  const [detail, setDetail] = useState<EmpresaDetail | null>(null);
  const [profiles, setProfiles] = useState<ProfileSummary[]>([]);
  const [modules, setModules] = useState<EmpresaModule[]>([]);
  const [documents, setDocuments] = useState<EmpresaDocument[]>([]);
  const [history, setHistory] = useState<EmpresaHistoryEntry[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [loadingModules, setLoadingModules] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [moduleId, setModuleId] = useState<ModuleId>('delivery');
  const [moduleLabel, setModuleLabel] = useState('');
  const [moduleExpiresAt, setModuleExpiresAt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docName, setDocName] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState<string | null>(null);

  const refreshModules = useCallback(async () => {
    const next = await listEmpresaModules(empresa.id);
    setModules(next);
    await onModulesChanged();
  }, [empresa.id, onModulesChanged]);

  const refreshDocuments = useCallback(async () => {
    const next = await listEmpresaDocuments(empresa.id);
    setDocuments(next);
  }, [empresa.id]);

  const refreshHistory = useCallback(async () => {
    const next = await listEmpresaHistory(empresa.id);
    setHistory(next);
  }, [empresa.id]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoadingDetail(true);
      try {
        const next = await getEmpresaDetail(empresa.id);
        if (!cancelled) setDetail(next);
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [empresa.id]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoadingProfiles(true);
      try {
        const next = await listEmpresaProfiles(empresa.id);
        if (!cancelled) setProfiles(next);
      } finally {
        if (!cancelled) setLoadingProfiles(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [empresa.id]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoadingModules(true);
      try {
        const next = await listEmpresaModules(empresa.id);
        if (!cancelled) setModules(next);
      } finally {
        if (!cancelled) setLoadingModules(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [empresa.id]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoadingDocuments(true);
      try {
        await refreshDocuments();
      } finally {
        if (!cancelled) setLoadingDocuments(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [refreshDocuments]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoadingHistory(true);
      try {
        await refreshHistory();
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [refreshHistory]);

  const baseModules = planModules[detail?.plano ?? empresa.plano];
  const availableExtraModules = planModules.gestao.filter(item => !baseModules.includes(item));
  const enabledAddonModules = modules.filter(item => item.enabled).map(item => item.moduleId);

  const copyId = async () => {
    await navigator.clipboard.writeText(empresa.id);
  };

  const toggleAddon = async (itemModuleId: string, enabled: boolean) => {
    await supabase.from('empresa_modules').upsert({
      empresa_id: empresa.id,
      module_id: itemModuleId,
      enabled,
      label: addonLabels[itemModuleId as AddonModuleId],
      updated_at: new Date().toISOString(),
    }, { onConflict: 'empresa_id,module_id' });
    await refreshModules();
  };

  const handleUpdateProfileRole = async (profileId: string, newRole: string) => {
    await supabase
      .from('profiles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('id', profileId);
    setProfiles(prev => prev.map(profile => (profile.id === profileId ? { ...profile, role: newRole } : profile)));
  };

  const handleToggleProfileActive = async (profileId: string, currentActive: boolean) => {
    await supabase
      .from('profiles')
      .update({ active: !currentActive, updated_at: new Date().toISOString() })
      .eq('id', profileId);
    setProfiles(prev => prev.map(profile => (profile.id === profileId ? { ...profile, active: !currentActive } : profile)));
  };

  const handleSaveDados = async () => {
    if (!detail) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const updated = await updateEmpresaDetail(empresa.id, {
        name: detail.name,
        legalName: detail.legalName,
        document: detail.document,
        phone: detail.phone,
        email: detail.email,
        website: detail.website,
        address: detail.address,
        city: detail.city,
        state: detail.state,
        notes: detail.notes,
      });
      setDetail(updated);
      await addEmpresaHistory(empresa.id, 'Dados atualizados', { performedByName: currentUser?.name });
      await refreshHistory();
      setSaveSuccess(true);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContrato = async () => {
    if (!detail) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const updated = await updateEmpresaDetail(empresa.id, {
        contractType: detail.contractType,
        contractStatus: detail.contractStatus,
        contractStart: detail.contractStart,
        contractEnd: detail.contractEnd,
        contractValue: detail.contractValue,
      });
      setDetail(updated);
      await addEmpresaHistory(empresa.id, 'Contrato atualizado', { performedByName: currentUser?.name });
      await refreshHistory();
      setSaveSuccess(true);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile || !docName.trim()) return;
    setUploadingDoc(true);
    try {
      await uploadEmpresaDocument(empresa.id, selectedFile, docName.trim(), docDescription.trim() || undefined);
      await addEmpresaHistory(empresa.id, 'Documento enviado', { newValue: docName.trim(), performedByName: currentUser?.name });
      await refreshDocuments();
      await refreshHistory();
      setSelectedFile(null);
      setDocName('');
      setDocDescription('');
    } finally {
      setUploadingDoc(false);
    }
  };

  const contractRemainingMonths = (() => {
    if (!detail?.contractEnd) return 0;
    return Math.max(0, Math.round((new Date(detail.contractEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)));
  })();

  const historyIcon = (action: string) => {
    const v = action.toLowerCase();
    if (v.includes('contrato')) return ReceiptText;
    if (v.includes('documento')) return FileText;
    if (v.includes('plano') || v.includes('licen')) return Settings;
    return ClipboardList;
  };

  const renderHistory = () => {
    if (loadingHistory) return <div className={`h-10 rounded-panel border animate-pulse ${elevatedClass}`} />;
    if (history.length === 0) return <p className="text-xs text-muted">Nenhuma alteração registrada ainda</p>;
    return history.map(entry => {
      const Icon = historyIcon(entry.action);
      return (
        <div key={entry.id} className={`p-3 rounded-panel border ${elevatedClass}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-muted" />
              <p className="text-xs font-semibold">{entry.action}</p>
            </div>
            <span className="text-xs text-muted">{relativeTime(entry.createdAt)}</span>
          </div>
          {entry.field && <p className="text-xs text-muted mt-1">{entry.field}: {entry.oldValue || '-'} -&gt; {entry.newValue || '-'}</p>}
          <p className="text-xs text-muted mt-1">por {entry.performedByName || 'Sistema'}</p>
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`w-full max-w-3xl rounded-section border shadow-elevated ${panelClass}`}>
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-border' : 'border-border-light'}`}>
          <h3 className="text-sm font-semibold">Detalhes da empresa - {empresa.name}</h3>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className={`px-5 pt-4 border-b ${isDark ? 'border-border' : 'border-border-light'}`}>
          <div className="flex items-center gap-2 pb-3">
            {([['dados','Dados'],['contrato','Contrato'],['documentos','Documentos'],['historico','Histórico']] as [DetailTab, string][]).map(([id, label]) => (
              <button key={id} onClick={() => setDetailTab(id)} className={`h-8 px-3 rounded-control text-xs font-medium border ${detailTab === id ? 'bg-accent text-white border-accent' : elevatedClass}`}>{label}</button>
            ))}
          </div>
        </div>
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {loadingDetail && <div className={`h-12 rounded-panel border animate-pulse ${elevatedClass}`} />}
          {!loadingDetail && detailTab === 'dados' && detail && (
            <section className={`p-4 rounded-panel border ${elevatedClass} space-y-5`}>
              <div className="space-y-3">
                <h5 className="text-xs font-semibold text-muted">Identificação</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted mb-1">Nome fantasia</label>
                    <input value={detail.name} onChange={e => setDetail(prev => prev ? { ...prev, name: e.target.value } : prev)} className={`w-full h-10 px-3 rounded-control border text-sm ${elevatedClass}`} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Razão social</label>
                    <input value={detail.legalName ?? ''} onChange={e => setDetail(prev => prev ? { ...prev, legalName: e.target.value } : prev)} className={`w-full h-10 px-3 rounded-control border text-sm ${elevatedClass}`} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">CNPJ / Documento</label>
                    <input value={detail.document ?? ''} onChange={e => setDetail(prev => prev ? { ...prev, document: e.target.value } : prev)} className={`w-full h-10 px-3 rounded-control border text-sm ${elevatedClass}`} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">ID da empresa</label>
                    <div className={`flex items-center gap-2 h-10 px-3 rounded-control border text-sm ${elevatedClass}`}>
                      <span className="truncate flex-1 text-muted text-xs">{detail.id}</span>
                      <button onClick={() => void navigator.clipboard.writeText(detail.id)} title="Copiar">
                        <Copy className="w-3.5 h-3.5 text-muted hover:text-accent" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <h5 className="text-xs font-semibold text-muted">Contato</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-muted mb-1">Telefone</label>
                    <input value={detail.phone ?? ''} onChange={e => setDetail(prev => prev ? { ...prev, phone: e.target.value } : prev)} className={`w-full h-10 px-3 rounded-control border text-sm ${elevatedClass}`} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">E-mail</label>
                    <input type="email" value={detail.email ?? ''} onChange={e => setDetail(prev => prev ? { ...prev, email: e.target.value } : prev)} className={`w-full h-10 px-3 rounded-control border text-sm ${elevatedClass}`} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Website</label>
                    <input value={detail.website ?? ''} onChange={e => setDetail(prev => prev ? { ...prev, website: e.target.value } : prev)} className={`w-full h-10 px-3 rounded-control border text-sm ${elevatedClass}`} />
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <h5 className="text-xs font-semibold text-muted">Localização</h5>
                <div>
                  <label className="block text-xs text-muted mb-1">Endereço</label>
                  <input value={detail.address ?? ''} onChange={e => setDetail(prev => prev ? { ...prev, address: e.target.value } : prev)} className={`w-full h-10 px-3 rounded-control border text-sm ${elevatedClass}`} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted mb-1">Cidade</label>
                    <input value={detail.city ?? ''} onChange={e => setDetail(prev => prev ? { ...prev, city: e.target.value } : prev)} className={`w-full h-10 px-3 rounded-control border text-sm ${elevatedClass}`} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Estado</label>
                    <select value={detail.state ?? ''} onChange={e => setDetail(prev => prev ? { ...prev, state: e.target.value } : prev)} className={`w-full h-10 px-3 rounded-control border text-sm ${elevatedClass}`}>
                      <option value="">Selecione</option>
                      {['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'].map(uf => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <h5 className="text-xs font-semibold text-muted">Plano & Licença</h5>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted mb-1">Plano</label>
                    <select value={empresa.plano} onChange={async e => { await onUpdatePlano(empresa.id, e.target.value as Empresa['plano']); }} className={`w-full h-10 px-3 rounded-control border text-sm ${elevatedClass}`}>
                      {Object.entries(PLANO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Status da licença</label>
                    <select value={empresa.licenseStatus} onChange={async e => { await onUpdateLicense(empresa.id, e.target.value as Empresa['licenseStatus']); }} className={`w-full h-10 px-3 rounded-control border text-sm ${elevatedClass}`}>
                      {Object.entries(LICENSE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <h5 className="text-xs font-semibold text-muted">Notas internas</h5>
                <textarea
                  value={detail.notes ?? ''}
                  onChange={e => setDetail(prev => prev ? { ...prev, notes: e.target.value } : prev)}
                  rows={3}
                  placeholder="Observações internas sobre este cliente..."
                  className={`w-full px-3 py-2 rounded-control border text-sm resize-none ${elevatedClass}`}
                />
              </div>

              <div className="space-y-3 border-t pt-4">
                <h5 className="text-xs font-semibold text-muted">Add-ons padrão</h5>
                {addonModules.map(addon => {
                  const enabled = enabledAddonModules.includes(addon);
                  return (
                    <div key={addon} className={`p-2 rounded-control border flex items-center justify-between ${elevatedClass}`}>
                      <span className="text-xs">{addonLabels[addon]} (+R$ {addonPricing[addon]}/mês)</span>
                      <button onClick={() => void toggleAddon(addon, !enabled)} className={`h-7 px-3 rounded-control text-xs ${enabled ? 'bg-accent text-white' : `border ${elevatedClass}`}`}>{enabled ? 'Ativo' : 'Ativar'}</button>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-semibold text-muted">Módulos personalizados</h5>
                  <button onClick={() => setShowModuleForm(prev => !prev)} className="h-8 px-3 rounded-control bg-accent/10 text-accent text-xs">+ Habilitar módulo</button>
                </div>
                {showModuleForm && (
                  <div className={`p-3 rounded-panel border space-y-2 ${elevatedClass}`}>
                    <select value={moduleId} onChange={e => setModuleId(e.target.value as ModuleId)} className={`h-9 w-full rounded-control border px-2 text-xs ${elevatedClass}`}>
                      {availableExtraModules.map(item => <option key={item} value={item}>{item}</option>)}
                    </select>
                    <input value={moduleLabel} onChange={e => setModuleLabel(e.target.value)} placeholder="Label opcional" className={`h-9 w-full rounded-control border px-2 text-xs ${elevatedClass}`} />
                    <input type="date" value={moduleExpiresAt} onChange={e => setModuleExpiresAt(e.target.value)} className={`h-9 w-full rounded-control border px-2 text-xs ${elevatedClass}`} />
                    <button
                      onClick={async () => {
                        await upsertEmpresaModule(empresa.id, moduleId, true, {
                          label: moduleLabel || undefined,
                          expiresAt: moduleExpiresAt ? `${moduleExpiresAt}T23:59:59.000Z` : undefined,
                        });
                        setModuleLabel('');
                        setModuleExpiresAt('');
                        await refreshModules();
                      }}
                      className="h-9 w-full rounded-control bg-accent text-white text-xs"
                    >
                      Habilitar
                    </button>
                  </div>
                )}
                {loadingModules ? <div className={`h-10 rounded-panel border animate-pulse ${elevatedClass}`} /> : modules.map(item => (
                  <div key={item.id} className={`p-3 rounded-panel border flex items-center justify-between ${elevatedClass}`}>
                    <div>
                      <p className="text-xs font-semibold">{item.moduleId}</p>
                      <p className="text-xs text-muted">{item.label || 'Sem label'}</p>
                    </div>
                    <button onClick={async () => { await removeEmpresaModule(item.id); await refreshModules(); }} className={`h-7 w-7 rounded-control border flex items-center justify-center ${elevatedClass}`}><X className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t pt-4">
                <h5 className="text-xs font-semibold text-muted">Usuários desta empresa</h5>
                {loadingProfiles ? (
                  <div className={`h-10 rounded-panel border animate-pulse ${elevatedClass}`} />
                ) : profiles.length === 0 ? (
                  <p className="text-xs text-muted">Nenhum usuário cadastrado</p>
                ) : (
                  <div className="space-y-2">
                    {profiles.map(profile => (
                      <div key={profile.id} className={`p-3 rounded-control border flex items-center justify-between gap-3 ${elevatedClass}`}>
                        <div className="text-xs">
                          <span className="font-medium">{profile.name}</span>
                          <span className="text-muted ml-1">({profile.role})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={profile.role}
                            onChange={event => void handleUpdateProfileRole(profile.id, event.target.value)}
                            className={`h-8 px-2 rounded-control border text-xs ${elevatedClass}`}
                          >
                            {profileRoleOptions.map(roleOption => (
                              <option key={roleOption} value={roleOption}>
                                {roleOption}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => void handleToggleProfileActive(profile.id, profile.active)}
                            className={`h-8 px-3 rounded-control border text-xs font-medium ${
                              profile.active ? 'text-success border-success/30' : 'text-muted'
                            }`}
                          >
                            {profile.active ? 'ativo' : 'inativo'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button onClick={() => void handleSaveDados()} disabled={saving} className="h-10 px-5 rounded-control bg-accent text-white text-xs font-medium hover:bg-accent-hover disabled:opacity-40">
                  {saving ? 'Salvando...' : 'Salvar dados'}
                </button>
                {saveSuccess && <span className="ml-3 self-center text-xs text-success">Salvo com sucesso.</span>}
              </div>
            </section>
          )}
          {!loadingDetail && detailTab === 'contrato' && detail && (
            <section className={`p-4 rounded-panel border ${elevatedClass} space-y-4`}>
              {(detail.contractStart || detail.contractValue) && (
                <div className={`p-4 rounded-panel border ${elevatedClass} space-y-1`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {detail.contractType === 'anual' ? 'Contrato Anual' : detail.contractType === 'mensal' ? 'Contrato Mensal' : 'Contrato Personalizado'}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      detail.contractStatus === 'ativo' ? 'bg-success/10 text-success' :
                      detail.contractStatus === 'encerrado' ? 'bg-danger/10 text-danger' :
                      'bg-warning/10 text-warning'
                    }`}>
                      {detail.contractStatus === 'ativo' ? 'Ativo' : detail.contractStatus === 'encerrado' ? 'Encerrado' : detail.contractStatus === 'negociacao' ? 'Em negociação' : 'Suspenso'}
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    {detail.contractValue ? fmtBRL(detail.contractValue) + '/mês' : '—'}
                    {detail.contractStart ? ' · Início: ' + new Intl.DateTimeFormat('pt-BR').format(new Date(detail.contractStart)) : ''}
                    {detail.contractEnd ? ' · Fim: ' + new Intl.DateTimeFormat('pt-BR').format(new Date(detail.contractEnd)) : ''}
                  </p>
                  {contractRemainingMonths > 0 && (
                    <p className="text-xs text-muted">Tempo restante: {contractRemainingMonths} meses</p>
                  )}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-muted mb-1">Tipo de contrato</label>
                  <select value={detail.contractType ?? 'mensal'} onChange={e => setDetail(prev => prev ? { ...prev, contractType: e.target.value as EmpresaDetail['contractType'] } : prev)} className={`w-full h-10 px-3 rounded-control border text-sm ${elevatedClass}`}>
                    <option value="mensal">Mensal</option>
                    <option value="anual">Anual</option>
                    <option value="personalizado">Personalizado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Status do contrato</label>
                  <select value={detail.contractStatus ?? 'ativo'} onChange={e => setDetail(prev => prev ? { ...prev, contractStatus: e.target.value as EmpresaDetail['contractStatus'] } : prev)} className={`w-full h-10 px-3 rounded-control border text-sm ${elevatedClass}`}>
                    <option value="ativo">Ativo</option>
                    <option value="negociacao">Em negociação</option>
                    <option value="suspenso">Suspenso</option>
                    <option value="encerrado">Encerrado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Data de início</label>
                  <input type="date" value={detail.contractStart ?? ''} onChange={e => setDetail(prev => prev ? { ...prev, contractStart: e.target.value } : prev)} className={`w-full h-10 px-3 rounded-control border text-sm ${elevatedClass}`} />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Data de término</label>
                  <input type="date" value={detail.contractEnd ?? ''} onChange={e => setDetail(prev => prev ? { ...prev, contractEnd: e.target.value } : prev)} className={`w-full h-10 px-3 rounded-control border text-sm ${elevatedClass}`} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs text-muted mb-1">Valor contratado (R$/mês)</label>
                  <input type="number" min="0" value={detail.contractValue ?? ''} onChange={e => setDetail(prev => prev ? { ...prev, contractValue: e.target.value ? Number(e.target.value) : undefined } : prev)} className={`w-full h-10 px-3 rounded-control border text-sm ${elevatedClass}`} />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={() => void handleSaveContrato()} disabled={saving} className="h-10 px-5 rounded-control bg-accent text-white text-xs font-medium hover:bg-accent-hover disabled:opacity-40">
                  {saving ? 'Salvando...' : 'Salvar contrato'}
                </button>
              </div>
            </section>
          )}
          {!loadingDetail && detailTab === 'documentos' && <section className={`p-4 rounded-panel border ${elevatedClass} space-y-4`}><label className={`p-6 rounded-panel border border-dashed text-center cursor-pointer block ${elevatedClass}`}><Upload className="w-6 h-6 mx-auto text-muted mb-2" /><p className="text-xs">Arraste um PDF ou clique para selecionar</p><p className="text-[10px] text-muted mt-1">Máximo 10MB · Apenas PDF</p><input type="file" accept=".pdf" className="hidden" onChange={e => { const file = e.target.files?.[0] ?? null; setSelectedFile(file); if (file) setDocName(file.name.replace(/\.pdf$/i, '')); }} /></label>{selectedFile && <div className="space-y-2"><p className="text-xs text-muted">{selectedFile.name} · {(selectedFile.size / 1024).toFixed(0)} KB</p><input value={docName} onChange={e => setDocName(e.target.value)} placeholder="Nome do documento" className={`h-9 w-full rounded-control border px-3 text-xs ${elevatedClass}`} /><input value={docDescription} onChange={e => setDocDescription(e.target.value)} placeholder="Descrição" className={`h-9 w-full rounded-control border px-3 text-xs ${elevatedClass}`} /><button onClick={() => void handleUploadDocument()} disabled={uploadingDoc} className="h-9 px-4 rounded-control bg-accent text-white text-xs">{uploadingDoc ? 'Enviando...' : 'Fazer upload'}</button></div>}{loadingDocuments ? <div className={`h-10 rounded-panel border animate-pulse ${elevatedClass}`} /> : documents.map(doc => <div key={doc.id} className={`p-3 rounded-panel border text-xs flex items-center justify-between ${elevatedClass}`}><div><p className="font-medium">{doc.name}</p><p className="text-muted">{doc.description || '-'} · {((doc.fileSize ?? 0) / 1024).toFixed(0)} KB</p></div><div className="flex gap-2"><button onClick={async () => { const url = await getDocumentSignedUrl(doc.filePath); window.open(url, '_blank'); }} className={`h-8 px-2 rounded-control border ${elevatedClass}`}><Download className="w-3.5 h-3.5" /></button><button onClick={async () => { if (confirmDeleteDoc !== doc.id) { setConfirmDeleteDoc(doc.id); setTimeout(() => setConfirmDeleteDoc(null), 3000); return; } await deleteEmpresaDocument(doc); await refreshDocuments(); setConfirmDeleteDoc(null); }} className={`h-8 px-2 rounded-control border ${elevatedClass}`}>{confirmDeleteDoc === doc.id ? 'Confirmar?' : <Trash2 className="w-3.5 h-3.5" />}</button></div></div>)}</section>}
          {!loadingDetail && detailTab === 'historico' && <section className={`p-4 rounded-panel border ${elevatedClass} space-y-2`}>{renderHistory()}</section>}
        </div>
      </motion.div>
    </div>
  );
};
// ---

interface TabOverviewProps {
  isDark: boolean;
  panelClass: string;
  elevatedClass: string;
  empresas: Empresa[];
  onNavigate: (tab: Tab, filter?: string) => void;
  onReactivateEmpresa: (id: string) => Promise<void>;
}

const TabOverview: React.FC<TabOverviewProps> = ({
  isDark,
  panelClass,
  elevatedClass,
  empresas,
  onNavigate,
  onReactivateEmpresa,
}) => {
  const [mrrHistory, setMrrHistory] = useState<MrrHistoryPoint[]>(() => readMasterMrrHistory());
  const [reactivationLoadingId, setReactivationLoadingId] = useState<string | null>(null);

  const totalEmpresas = empresas.length;

  const empresasAtivasList = useMemo(
    () => empresas.filter(empresa => empresa.active !== false && empresa.licenseStatus === 'active'),
    [empresas],
  );
  const empresasAtivas = empresasAtivasList.length;

  const empresasTrial = useMemo(
    () => empresas.filter(empresa => empresa.licenseStatus === 'trial').length,
    [empresas],
  );

  const empresasSuspensas = useMemo(
    () => empresas.filter(empresa => empresa.licenseStatus === 'suspended' || empresa.active === false).length,
    [empresas],
  );

  const mrrTotal = useMemo(() => calcMrrTotal(empresas), [empresas]);
  const mrrMedio = useMemo(() => (empresasAtivas > 0 ? mrrTotal / empresasAtivas : 0), [mrrTotal, empresasAtivas]);
  const licencasVencer = empresasTrial;

  const trialEmpresas = useMemo(
    () => empresas.filter(empresa => empresa.licenseStatus === 'trial').slice(0, 5),
    [empresas],
  );

  useEffect(() => {
    const month = getMonthKey();
    const history = readMasterMrrHistory();
    const existingIndex = history.findIndex(item => item.month === month);
    const nextEntry = { month, mrr: mrrTotal };
    const nextHistory = existingIndex >= 0
      ? history.map((item, index) => (index === existingIndex ? nextEntry : item))
      : [...history, nextEntry];

    localStorage.setItem(MRR_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
    setMrrHistory(nextHistory);
  }, [mrrTotal]);

  const last6History = useMemo(() => {
    const history = [...mrrHistory].sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
    const maxValue = Math.max(...history.map(item => item.mrr), 1);
    return history.map(item => ({
      ...item,
      heightPct: Math.max(8, Math.round((item.mrr / maxValue) * 100)),
      label: new Date(`${item.month}-01`).toLocaleDateString('pt-BR', { month: 'short' }),
    }));
  }, [mrrHistory]);

  const mrrTrend = useMemo(() => {
    if (last6History.length < 2) return null;
    const previous = last6History[last6History.length - 2].mrr;
    const current = last6History[last6History.length - 1].mrr;
    if (previous <= 0) return null;
    return Number((((current - previous) / previous) * 100).toFixed(1));
  }, [last6History]);

  const planoRows = useMemo(() => {
    const planos: Empresa['plano'][] = ['essencial', 'profissional', 'gestao'];
    return planos.map(plano => {
      const empresasDoPlano = empresasAtivasList.filter(empresa => empresa.plano === plano);
      const mrrParcial = empresasDoPlano.reduce((sum, empresa) => sum + calcMrrEmpresa(empresa), 0);
      return { plano, empresasDoPlano, mrrParcial };
    });
  }, [empresasAtivasList]);

  const inadimplentes = useMemo(
    () => empresas.filter(empresa => empresa.active === false || empresa.licenseStatus === 'suspended'),
    [empresas],
  );

  const exportFinancialCSV = () => {
    const header = ['Nome', 'CNPJ', 'Plano', 'Pack', 'Add-ons', 'MRR mensal', 'Status'];
    const rows = empresasAtivasList.map(empresa => {
      const addons = (empresa.addons ?? []).map(addon => addonLabels[addon as AddonModuleId] ?? addon).join(' | ') || '-';
      const pack = empresa.packId ? (packLabels[empresa.packId as PackId] ?? empresa.packId) : '-';
      return [
        empresa.name,
        empresa.document || '-',
        PLANO_LABELS[empresa.plano] ?? empresa.plano,
        pack,
        addons,
        String(calcMrrEmpresa(empresa)),
        empresa.licenseStatus,
      ];
    });

    const csv = [header, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `financeiro-plena-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleReactivateEmpresa = async (empresaId: string) => {
    setReactivationLoadingId(empresaId);
    try {
      await onReactivateEmpresa(empresaId);
    } finally {
      setReactivationLoadingId(null);
    }
  };

  const kpis = [
    { label: 'MRR Ativo', value: fmtBRL(mrrTotal), detail: `${totalEmpresas} empresas`, icon: ReceiptText, tone: 'text-success', bg: 'bg-success/10', onClick: () => onNavigate('companies', 'active') },
    { label: 'Empresas Ativas', value: String(empresasAtivas), detail: `${totalEmpresas} no total`, icon: Building2, tone: 'text-success', bg: 'bg-success/10', onClick: () => onNavigate('companies', 'active') },
    { label: 'Em Trial', value: String(empresasTrial), detail: `${licencasVencer} requerem atenção`, icon: CalendarDays, tone: 'text-warning', bg: 'bg-warning/10', onClick: () => onNavigate('companies', 'trial') },
    { label: 'Suspensas', value: String(empresasSuspensas), detail: 'Licenças bloqueadas', icon: AlertTriangle, tone: 'text-danger', bg: 'bg-danger/10', onClick: () => onNavigate('companies', 'suspended') },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <motion.section
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            onClick={kpi.onClick}
            className={`p-5 rounded-panel border cursor-pointer hover:border-accent/50 transition-colors ${panelClass}`}
          >
            <div className="flex items-start justify-between mb-5">
              <div className={`w-10 h-10 rounded-panel flex items-center justify-center ${kpi.bg}`}>
                <kpi.icon className={`w-5 h-5 ${kpi.tone}`} />
              </div>
              <span className={`text-xs font-medium ${kpi.tone}`}>{kpi.detail}</span>
            </div>
            <p className="text-xs font-medium text-muted mb-2">{kpi.label}</p>
            <p className="text-xl font-semibold">{kpi.value}</p>
          </motion.section>
        ))}
      </div>
      <section className={`p-5 rounded-section border space-y-5 ${panelClass}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Financeiro Plena</h3>
            <p className="text-xs text-muted mt-1">MRR real por plano, pack e add-ons ativos.</p>
          </div>
          <button
            onClick={exportFinancialCSV}
            className={`h-9 px-4 rounded-control border text-xs font-medium ${elevatedClass}`}
          >
            Exportar CSV
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className={`p-4 rounded-panel border ${elevatedClass}`}>
            <p className="text-xs text-muted">MRR Total</p>
            <p className="text-xl font-semibold text-success mt-1">{fmtBRL(mrrTotal)}</p>
          </div>
          <div className={`p-4 rounded-panel border ${elevatedClass}`}>
            <p className="text-xs text-muted">MRR Médio por Empresa</p>
            <p className="text-xl font-semibold mt-1">{fmtBRL(mrrMedio)}</p>
          </div>
          <div className={`p-4 rounded-panel border ${elevatedClass}`}>
            <p className="text-xs text-muted">Crescimento estimado</p>
            <p className="text-xl font-semibold mt-1">
              {mrrTrend === null ? '—' : `${mrrTrend >= 0 ? '+' : ''}${mrrTrend}%`}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className={`border-b text-xs text-muted ${isDark ? 'border-border' : 'border-border-light'}`}>
                <th className="py-2 text-left">Plano</th>
                <th className="py-2 text-left">Qtd empresas</th>
                <th className="py-2 text-right">MRR parcial</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-border' : 'divide-border-light'}`}>
              {planoRows.map(row => (
                <tr key={row.plano}>
                  <td className="py-2">{`${PLANO_LABELS[row.plano]} R$${planPricing[row.plano]}`}</td>
                  <td className="py-2">{row.empresasDoPlano.length}</td>
                  <td className="py-2 text-right font-medium">{fmtBRL(row.mrrParcial)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Alertas de inadimplência</h4>
          {inadimplentes.length === 0 ? (
            <p className="text-xs text-muted">Nenhuma empresa suspensa no momento.</p>
          ) : (
            <div className="space-y-2">
              {inadimplentes.map(empresa => (
                <div key={empresa.id} className={`p-3 rounded-panel border flex items-center justify-between gap-3 ${elevatedClass}`}>
                  <div className="text-xs">
                    <span className="font-medium">{empresa.name}</span>
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-danger/10 text-danger border border-danger/30">Suspenso</span>
                  </div>
                  <button
                    onClick={() => void handleReactivateEmpresa(empresa.id)}
                    disabled={reactivationLoadingId === empresa.id}
                    className="h-8 px-3 rounded-control bg-accent text-white text-xs font-medium disabled:opacity-40"
                  >
                    {reactivationLoadingId === empresa.id ? 'Reativando...' : 'Reativar'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">Histórico MRR (últimos 6 meses)</h4>
          {last6History.length === 0 ? (
            <div className={`h-28 rounded-panel border border-dashed flex items-center justify-center text-xs text-muted ${elevatedClass}`}>
              Nenhum registro de MRR disponível.
            </div>
          ) : (
            <div className="flex items-end gap-3 h-36">
              {last6History.map(point => (
                <div key={point.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[10px] text-muted">{fmtBRL(point.mrr)}</div>
                  <div className="w-full rounded-t-control bg-accent/80" style={{ height: `${point.heightPct}%` }} />
                  <div className="text-[10px] text-muted uppercase">{point.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-5">
        <section className={`p-5 rounded-section border ${panelClass}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold">Crescimento MoM por empresa</h3>
              <p className="text-xs text-muted mt-1">Receita mensal agregada das contas clientes</p>
            </div>
            <div className="w-9 h-9 rounded-panel bg-accent/10 text-accent flex items-center justify-center">
              <LineChart className="w-4 h-4" />
            </div>
          </div>
          <div className={`relative h-72 rounded-panel border overflow-hidden ${elevatedClass}`}>
            <div className="absolute inset-6 grid grid-rows-4">
              {[0, 1, 2, 3].map(row => (
                <div key={row} className="border-t border-border/80" />
              ))}
            </div>
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 680 280" preserveAspectRatio="none">
              <polyline points="30,220 130,198 230,154 330,170 430,114 530,88 650,58" fill="none" stroke="var(--color-accent)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="30,238 130,224 230,204 330,176 430,158 530,128 650,118" fill="none" stroke="var(--color-success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="650" cy="58" r="7" fill="var(--color-accent)" />
              <circle cx="650" cy="118" r="6" fill="var(--color-success)" />
            </svg>
            <div className="absolute bottom-5 left-6 right-6 flex justify-between text-xs text-muted">
              <span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span><span>Jun</span>
            </div>
          </div>
          <p className="text-[10px] text-muted mt-2">* Dados ilustrativos</p>
        </section>
        <section className={`p-5 rounded-section border ${panelClass}`}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold">Alertas de licença</h3>
            <span className="text-xs font-medium text-warning">{trialEmpresas.length} abertas</span>
          </div>
          {trialEmpresas.length > 0 ? (
            <div className="space-y-3">
              {trialEmpresas.map(empresa => (
                <div key={empresa.id} className={`p-4 rounded-panel border ${elevatedClass}`}>
                  <p className="text-sm font-semibold text-warning">{empresa.name}</p>
                  <p className="text-xs text-muted mt-1">Trial</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted">Nenhuma licença requer atenção</p>
          )}
          <button
            onClick={() => onNavigate('companies', 'trial')}
            className="mt-5 h-10 w-full rounded-control bg-accent px-4 text-xs font-medium text-white hover:bg-accent-hover"
          >
            Abrir renovações
          </button>
        </section>
      </div>
    </div>
  );
};

// ---

interface TabCompaniesProps {
  isDark: boolean;
  panelClass: string;
  elevatedClass: string;
  initialFilter?: 'all' | 'active' | 'trial' | 'suspended';
}

const TabCompanies: React.FC<TabCompaniesProps> = ({ isDark, panelClass, elevatedClass, initialFilter }) => {
  const { refreshExtraModules } = useApp();
  const { empresas, loading, error, updateLicense, updatePlano, createEmpresa, refresh } = useMaster();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'trial' | 'suspended'>(initialFilter ?? 'all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailEmpresa, setDetailEmpresa] = useState<Empresa | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadingPlanoById, setLoadingPlanoById] = useState<Record<string, boolean>>({});
  const [loadingLicenseById, setLoadingLicenseById] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialFilter) setFilterStatus(initialFilter);
  }, [initialFilter]);

  const filteredEmpresas = useMemo(() => empresas.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.document ?? '').includes(search);
    const matchStatus = filterStatus === 'all' || e.licenseStatus === filterStatus;
    return matchSearch && matchStatus;
  }), [empresas, filterStatus, search]);

  const filteredMrrTotal = useMemo(
    () => filteredEmpresas.reduce((acc, empresa) => (
      empresa.licenseStatus === 'active' && empresa.active !== false ? acc + calcMrrEmpresa(empresa) : acc
    ), 0),
    [filteredEmpresas],
  );

  const exportEmpresas = () => {
    const payload = JSON.stringify(empresas, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `empresas-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleUpdatePlano = async (id: string, plano: Empresa['plano']) => {
    setLoadingPlanoById(prev => ({ ...prev, [id]: true }));
    try {
      await updatePlano(id, plano);
      setActionError(null);
      setSuccessMessage('Plano atualizado com sucesso.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao atualizar plano.');
    } finally {
      setLoadingPlanoById(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleUpdateLicense = async (id: string, licenseStatus: Empresa['licenseStatus']) => {
    setLoadingLicenseById(prev => ({ ...prev, [id]: true }));
    try {
      await updateLicense(id, licenseStatus);
      setActionError(null);
      setSuccessMessage('Status da licença atualizado com sucesso.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao atualizar status da licença.');
    } finally {
      setLoadingLicenseById(prev => ({ ...prev, [id]: false }));
    }
  };

  const getLicenseTone = (status: Empresa['licenseStatus']) => {
    if (status === 'active') return 'text-success';
    if (status === 'trial') return 'text-warning';
    return 'text-danger';
  };

  return (
    <section className={`p-5 rounded-section border ${panelClass}`}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold">Empresas clientes</h3>
          <p className="text-xs text-muted mt-1">Gestão real de empresas, plano e licença</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="h-10 px-4 rounded-control bg-accent text-white text-xs font-medium hover:bg-accent-hover inline-flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova empresa
          </button>
          <button onClick={exportEmpresas} className={`h-10 px-4 rounded-control border text-xs font-medium ${elevatedClass}`}>Exportar</button>
        </div>
      </div>
      {successMessage && (
        <div className="mb-4 text-xs text-success">{successMessage}</div>
      )}
      {actionError && (
        <div className="mb-4 text-xs text-danger">{actionError}</div>
      )}
      {error && (
        <div className="mb-4 inline-flex items-center gap-2 text-xs text-danger">
          <AlertTriangle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar empresa..."
            className={`w-full h-9 pl-9 pr-3 rounded-control border text-xs ${elevatedClass}`}
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'active', 'trial', 'suspended'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`h-9 px-3 rounded-control text-xs font-medium border transition-colors ${
                filterStatus === s ? 'bg-accent text-white border-accent' : elevatedClass
              }`}
            >
              {s === 'all' ? 'Todos' : LICENSE_LABELS[s]}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map(idx => (
            <div key={idx} className={`h-12 rounded-panel border animate-pulse ${elevatedClass}`} />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className={`border-b text-xs font-medium text-muted ${isDark ? 'border-border' : 'border-border-light'}`}>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Plano</th>
                <th className="px-4 py-3">Status Licença</th>
                <th className="px-4 py-3">Criada em</th>
                <th className="px-4 py-3">MRR</th>
                <th className="px-4 py-3 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-border' : 'divide-border-light'}`}>
              {filteredEmpresas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-xs text-muted">
                    Nenhuma empresa encontrada
                  </td>
                </tr>
              ) : filteredEmpresas.map(empresa => (
                <tr key={empresa.id} className={isDark ? 'hover:bg-elevated' : 'hover:bg-elevated-light'}>
                  <td className="px-4 py-3 font-medium">{empresa.name}</td>
                  <td className="px-4 py-3">
                    <select
                      value={empresa.plano}
                      disabled={Boolean(loadingPlanoById[empresa.id])}
                      onChange={e => void handleUpdatePlano(empresa.id, e.target.value as Empresa['plano'])}
                      className={`h-8 rounded-control border px-2 text-xs ${elevatedClass}`}
                    >
                      <option value="essencial">{PLANO_LABELS.essencial}</option>
                      <option value="profissional">{PLANO_LABELS.profissional}</option>
                      <option value="gestao">{PLANO_LABELS.gestao}</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={empresa.licenseStatus}
                      disabled={Boolean(loadingLicenseById[empresa.id])}
                      onChange={e => void handleUpdateLicense(empresa.id, e.target.value as Empresa['licenseStatus'])}
                      className={`h-8 rounded-control border px-2 text-xs ${elevatedClass} ${getLicenseTone(empresa.licenseStatus)}`}
                    >
                      <option value="active">{LICENSE_LABELS.active}</option>
                      <option value="trial">{LICENSE_LABELS.trial}</option>
                      <option value="suspended">{LICENSE_LABELS.suspended}</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {empresa.createdAt
                      ? new Intl.DateTimeFormat('pt-BR').format(new Date(empresa.createdAt))
                      : '-'}
                  </td>
                  <td className="px-4 py-3 font-medium tabular-nums">
                    {empresa.licenseStatus === 'active'
                      ? fmtBRL(calcMrrEmpresa(empresa))
                      : <span className="text-muted text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDetailEmpresa(empresa)}
                      className={`inline-flex h-8 items-center gap-2 rounded-control border px-3 text-xs font-medium ${elevatedClass}`}
                    >
                      Ver
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={`border-t text-xs font-semibold ${isDark ? 'border-border' : 'border-border-light'}`}>
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3" colSpan={2} />
                <td className="px-4 py-3" />
                <td className="px-4 py-3 tabular-nums text-success">
                  {fmtBRL(filteredMrrTotal)}
                </td>
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      <AnimatePresence>
        {showCreateModal && (
          <CreateEmpresaModal
            onClose={() => setShowCreateModal(false)}
            onCreated={() => {
              setSuccessMessage('Empresa criada com sucesso.');
              void refresh();
            }}
            onSubmit={createEmpresa}
            isDark={isDark}
            elevatedClass={elevatedClass}
            panelClass={panelClass}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {detailEmpresa && (
          <EmpresaDetailModal
            empresa={detailEmpresa}
            onClose={() => setDetailEmpresa(null)}
            onUpdatePlano={async (id, plano) => {
              await handleUpdatePlano(id, plano);
              setDetailEmpresa(prev => prev ? { ...prev, plano } : null);
            }}
            onUpdateLicense={async (id, status) => {
              await handleUpdateLicense(id, status);
              setDetailEmpresa(prev => prev ? { ...prev, licenseStatus: status } : null);
            }}
            onModulesChanged={refreshExtraModules}
            isDark={isDark}
            elevatedClass={elevatedClass}
            panelClass={panelClass}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

// ---

interface TabNotificacoesProps {
  isDark: boolean; panelClass: string; elevatedClass: string;
  prefillType?: AppNotification['type'];
  onClearPrefill?: () => void;
}

const EXPIRY_OPTIONS = [
  { label: '7 dias', days: 7 },
  { label: '30 dias', days: 30 },
  { label: '90 dias', days: 90 },
  { label: 'Nunca', days: 0 },
];

const TEMPLATES = [
  { label: 'Nova versão', type: 'update' as AppNotification['type'], title: 'Nova versão disponível' },
  { label: 'Segurança', type: 'security' as AppNotification['type'], title: 'Aviso de Segurança importante' },
  { label: 'Oferta', type: 'sales' as AppNotification['type'], title: 'Oferta especial para você' },
];

const BLANK_DRAFT = {
  type: 'update' as AppNotification['type'],
  title: '', body: '', action: '',
  targetPlans: ['essencial', 'profissional', 'gestao'] as MasterNotification['targetPlans'],
  expiryDays: 30,
};

const TabNotificacoes: React.FC<TabNotificacoesProps> = ({ isDark, panelClass, elevatedClass, prefillType, onClearPrefill }) => {
  const [form, setForm] = useState({ ...BLANK_DRAFT, type: prefillType ?? BLANK_DRAFT.type });
  const [notifications, setNotifications] = useState<MasterNotification[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(true);

  const reloadNotifs = useCallback(async () => {
    const next = await listNotifications();
    setNotifications(next);
  }, []);

  useEffect(() => {
    setLoadingNotifs(true);
    void reloadNotifs().finally(() => setLoadingNotifs(false));
  }, [reloadNotifs]);

  const togglePlan = (plan: 'essencial' | 'profissional' | 'gestao') => {
    setForm(f => ({
      ...f,
      targetPlans: f.targetPlans.includes(plan)
        ? f.targetPlans.filter(p => p !== plan)
        : [...f.targetPlans, plan],
    }));
  };

  const applyTemplate = (tpl: typeof TEMPLATES[number]) => {
    setForm(f => ({ ...f, type: tpl.type, title: tpl.title }));
    onClearPrefill?.();
  };

  const handleSaveDraft = async () => {
    if (!form.title || !form.body) return;
    await createNotification({
      type: form.type, title: form.title, body: form.body,
      action: form.action || undefined,
      targetPlans: form.targetPlans,
      status: 'draft',
      expiresAt: form.expiryDays > 0 ? addDays(form.expiryDays) : undefined,
      publishedAt: undefined,
    });
    setForm({ ...BLANK_DRAFT });
    await reloadNotifs();
  };

  const handlePublish = async () => {
    if (!form.title || !form.body) return;
    await createNotification({
      type: form.type, title: form.title, body: form.body,
      action: form.action || undefined,
      targetPlans: form.targetPlans,
      status: 'published',
      expiresAt: form.expiryDays > 0 ? addDays(form.expiryDays) : undefined,
      publishedAt: new Date().toISOString(),
    });
    setForm({ ...BLANK_DRAFT });
    await reloadNotifs();
  };

  const NotifIcon = NOTIF_ICON[form.type];

  return (
    <div className="space-y-5">
      {/* Composer */}
      <section className={`p-5 rounded-section border ${panelClass}`}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold">Nova Notificação</h3>
            <p className="text-xs text-muted mt-1">A Notificação será entregue na próxima vez que os clientes abrirem o sistema</p>
          </div>
          <div className="flex gap-2">
            {TEMPLATES.map(tpl => (
              <button
                key={tpl.type}
                onClick={() => applyTemplate(tpl)}
                className={`h-8 px-3 rounded-control border text-xs font-medium hover:border-accent hover:text-accent transition-colors ${elevatedClass}`}
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-muted mb-1">Tipo</label>
            <div className="relative">
              <select
                id="notif-type"
                value={form.type}
                onChange={e => { setForm(f => ({ ...f, type: e.target.value as AppNotification['type'] })); onClearPrefill?.(); }}
                className={`w-full h-10 pl-9 pr-3 rounded-control border text-sm appearance-none ${elevatedClass}`}
              >
                <option value="update">Atualização</option>
                <option value="security">Segurança</option>
                <option value="feature">Funcionalidade</option>
                <option value="support">Suporte</option>
                <option value="sales">Oferta</option>
                <option value="info">Informação</option>
              </select>
              <NotifIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-accent pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Expira em</label>
            <select
              id="notif-expiry"
              value={form.expiryDays}
              onChange={e => setForm(f => ({ ...f, expiryDays: Number(e.target.value) }))}
              className={`w-full h-10 px-3 rounded-control border text-sm ${elevatedClass}`}
            >
              {EXPIRY_OPTIONS.map(o => (
                <option key={o.days} value={o.days}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-xs text-muted mb-2">Planos de destino</label>
          <div className="flex gap-3">
            {(['essencial', 'profissional', 'gestao'] as const).map(plan => (
              <label key={plan} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.targetPlans.includes(plan)}
                  onChange={() => togglePlan(plan)}
                  className="accent-accent w-3.5 h-3.5"
                />
                <span className="text-xs capitalize">{PLAN_LABELS[plan]}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs text-muted mb-1">Título *</label>
            <input
              id="notif-title"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className={`w-full h-10 px-3 rounded-control border text-sm ${elevatedClass}`}
              placeholder="Título da Notificação"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Mensagem *</label>
            <textarea
              id="notif-body"
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              rows={3}
              className={`w-full px-3 py-2 rounded-control border text-sm resize-none ${elevatedClass}`}
              placeholder="Corpo da mensagem"
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">CTA (opcional)</label>
            <input
              id="notif-cta"
              value={form.action}
              onChange={e => setForm(f => ({ ...f, action: e.target.value }))}
              className={`w-full h-10 px-3 rounded-control border text-sm ${elevatedClass}`}
              placeholder="Ex: Ver novidades"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            id="notif-save-draft"
            onClick={() => void handleSaveDraft()}
            disabled={!form.title || !form.body}
            className={`h-10 px-4 rounded-control border text-xs font-medium disabled:opacity-40 ${elevatedClass}`}
          >
            Salvar Rascunho
          </button>
          <button
            id="notif-publish"
            onClick={() => void handlePublish()}
            disabled={!form.title || !form.body}
            className="h-10 px-4 rounded-control bg-accent text-white text-xs font-medium hover:bg-accent-hover disabled:opacity-40"
          >
            Publicar Agora
          </button>
        </div>
      </section>

      {/* History */}
      {loadingNotifs ? (
        <section className={`p-5 rounded-section border ${panelClass}`}>
          <p className="text-xs text-muted">Carregando histórico...</p>
        </section>
      ) : notifications.length > 0 && (
        <section className={`p-5 rounded-section border ${panelClass}`}>
          <h3 className="text-sm font-semibold mb-5">Histórico de Notificações</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className={`border-b text-xs font-medium text-muted ${isDark ? 'border-border' : 'border-border-light'}`}>
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Planos</th>
                  <th className="px-4 py-3">Publicada em</th>
                  <th className="px-4 py-3">Expira em</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-border' : 'divide-border-light'}`}>
                {[...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(d => {
                  const expired = isExpired(d);
                  const Icon = NOTIF_ICON[d.type];
                  return (
                    <tr key={d.id} className={isDark ? 'hover:bg-elevated' : 'hover:bg-elevated-light'}>
                      <td className="px-4 py-3 font-medium max-w-[180px] truncate">{d.title}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                          <Icon className="w-3 h-3 text-accent" />{d.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">{d.targetPlans.map(p => PLAN_LABELS[p]).join(', ') || 'Todos'}</td>
                      <td className="px-4 py-3 text-xs text-muted">{d.publishedAt ? new Date(d.publishedAt).toLocaleDateString('pt-BR') : '—'}</td>
                      <td className="px-4 py-3 text-xs text-muted">{d.expiresAt ? new Date(d.expiresAt).toLocaleDateString('pt-BR') : '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${d.status === 'draft' ? 'text-muted' : expired ? 'text-danger' : 'text-success'}`}>
                          {d.status === 'draft' ? 'Rascunho' : expired ? 'Expirada' : 'Ativa'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          {d.status === 'draft' && (
                            <button
                              title="Publicar"
                              onClick={async () => { await publishNotification(d.id); await reloadNotifs(); }}
                              className="h-7 w-7 flex items-center justify-center rounded-control text-muted hover:text-success transition-colors"
                            >
                              <Bell className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            title="Duplicar"
                            onClick={async () => { await duplicateNotification(d.id); await reloadNotifs(); }}
                            className="h-7 w-7 flex items-center justify-center rounded-control text-muted hover:text-accent transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Excluir"
                            onClick={async () => { await deleteNotification(d.id); await reloadNotifs(); }}
                            className="h-7 w-7 flex items-center justify-center rounded-control text-muted hover:text-danger transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

// ---

type ChurnFilter = '30d' | '90d' | 'todos';

interface TabComercialProps {
  isDark: boolean; panelClass: string; elevatedClass: string;
  onUpsellNotify: () => void;
}

const TabComercial: React.FC<TabComercialProps> = ({ isDark, panelClass, elevatedClass, onUpsellNotify }) => {
  const { prospects, loading, error, refresh, create, update, remove } = usePlenaProspects();
  const [showProspectModal, setShowProspectModal] = useState(false);
  const [editProspect, setEditProspect] = useState<PlenaProspect | undefined>(undefined);
  const [activityFor, setActivityFor] = useState<{ id: string; name: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [churnsOpen, setChurnsOpen] = useState(false);
  const [churnFilter, setChurnFilter] = useState<ChurnFilter>('30d');
  const [mrrHistory, setMrrHistory] = useState(() => getMrrHistory());

  const reload = useCallback(async () => {
    await refresh();
    setMrrHistory(getMrrHistory());
  }, [refresh]);

  const upsellCandidates = prospects.filter(
    p => p.stage === 'ativo' && p.planInterest === 'essencial'
  );

  // KPIs
  const activeProspects = prospects.filter(p => p.stage === 'ativo');
  const currentMrr = calcCurrentMrr(prospects);
  const pipelineStages: ProspectStage[] = ['contato', 'demo', 'proposta', 'contrato', 'onboarding'];
  const pipelineMrr = prospects
    .filter(p => pipelineStages.includes(p.stage))
    .reduce((acc, p) => acc + p.monthlyValue, 0);

  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);
  const churnedThisMonth = prospects.filter(
    p => p.stage === 'perdido' && new Date(p.updatedAt) >= thisMonthStart
  );

  // Churn filter
  const churnedFiltered = (() => {
    const cutoff = new Date();
    if (churnFilter === '30d') cutoff.setDate(cutoff.getDate() - 30);
    else if (churnFilter === '90d') cutoff.setDate(cutoff.getDate() - 90);
    return prospects.filter(
      p => p.stage === 'perdido' && (churnFilter === 'todos' || new Date(p.updatedAt) >= cutoff)
    );
  })();
  const churnMrrLost = churnedFiltered.reduce((acc, p) => acc + p.monthlyValue, 0);

  // MRR chart
  const last6 = (() => {
    const history = [...mrrHistory].sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
    const maxVal = Math.max(...history.map(e => e.value), 1);
    return history.map(e => ({
      ...e,
      height: Math.max(8, Math.round((e.value / maxVal) * 100)),
      label: new Date(e.month + '-01').toLocaleDateString('pt-BR', { month: 'short' }),
    }));
  })();

  const mrrTrend = (() => {
    if (last6.length < 2) return null;
    const prev = last6[last6.length - 2].value;
    const curr = last6[last6.length - 1].value;
    if (prev === 0) return null;
    return Math.round(((curr - prev) / prev) * 100);
  })();

  const handleAdvance = async (id: string) => {
    const order: ProspectStage[] = ['contato', 'demo', 'proposta', 'contrato', 'onboarding', 'ativo'];
    const current = prospects.find(item => item.id === id);
    if (!current) return;
    const index = order.indexOf(current.stage);
    if (index < 0 || index >= order.length - 1) return;
    await update(id, { stage: order[index + 1], lastInteractionAt: new Date().toISOString() });
    await reload();
  };
  const handleDelete = async (id: string) => {
    await remove(id);
    await reload();
    setMenuOpen(null);
  };
  const handleMarkLost = async (p: PlenaProspect) => {
    await update(p.id, { stage: 'perdido', updatedAt: new Date().toISOString() });
    await reload();
    setMenuOpen(null);
  };

  const kpis = [
    { label: 'MRR Atual', value: fmtBRL(currentMrr), icon: TrendingUp, tone: 'text-success', bg: 'bg-success/10' },
    { label: 'Clientes Ativos', value: String(activeProspects.length), icon: Building2, tone: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Pipeline Aberto', value: fmtBRL(pipelineMrr), icon: Filter, tone: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Churn este mês', value: String(churnedThisMonth.length), icon: AlertTriangle, tone: 'text-danger', bg: 'bg-danger/10' },
  ];

  return (
    <div className="space-y-5">
      {loading && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map(item => (
            <div key={item} className={`h-24 rounded-panel border animate-pulse ${panelClass}`} />
          ))}
        </div>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}
      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.section
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`p-5 rounded-panel border ${panelClass}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-9 h-9 rounded-panel flex items-center justify-center ${kpi.bg}`}>
                <kpi.icon className={`w-4 h-4 ${kpi.tone}`} />
              </div>
            </div>
            <p className="text-xs font-medium text-muted mb-1">{kpi.label}</p>
            <p className="text-xl font-semibold">{kpi.value}</p>
          </motion.section>
        ))}
      </div>

      {/* Kanban */}
      <section className={`p-5 rounded-section border ${panelClass}`}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold">Pipeline de Prospects</h3>
            <p className="text-xs text-muted mt-1">{prospects.filter(p => p.stage !== 'perdido').length} prospects ativos no funil</p>
          </div>
          <button
            id="new-prospect-btn"
            onClick={() => { setEditProspect(undefined); setShowProspectModal(true); }}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-control bg-accent text-white text-xs font-medium hover:bg-accent-hover"
          >
            <Plus className="w-3.5 h-3.5" /> Novo Prospect
          </button>
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-4 min-w-max">
            {STAGES.map(stage => {
              const cols = prospects.filter(p => p.stage === stage.id);
              const colMrr = cols.reduce((acc, p) => acc + p.monthlyValue, 0);
              return (
                <div key={stage.id} className="w-64 shrink-0">
                  <div className={`flex items-center justify-between mb-3 px-1`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${stage.color}`}>{stage.label}</span>
                      <span className={`text-xs rounded-full px-1.5 py-0.5 font-medium ${isDark ? 'bg-elevated text-muted' : 'bg-elevated-light text-muted'}`}>{cols.length}</span>
                    </div>
                    {colMrr > 0 && <span className="text-xs text-muted">{fmtBRL(colMrr)}</span>}
                  </div>
                  <div className="space-y-3">
                    {cols.map(p => (
                      <div key={p.id} className={`p-4 rounded-panel border ${elevatedClass}`}>
                        <p className="text-sm font-semibold leading-tight mb-1">{p.businessName}</p>
                        <p className="text-xs text-muted flex items-center gap-1"><Phone className="w-3 h-3" />{p.contactName}</p>
                        {p.contactEmail && <p className="text-xs text-muted flex items-center gap-1 mt-0.5"><Mail className="w-3 h-3" />{p.contactEmail}</p>}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-medium text-accent">{PLAN_LABELS[p.planInterest]}</span>
                          <span className="text-xs text-muted">{fmtBRL(p.monthlyValue)}/m</span>
                        </div>
                        <p className="text-xs text-muted mt-1">Interação {relativeTime(p.lastInteractionAt)}</p>
                        <div className="flex items-center gap-2 mt-3">
                          {stage.id !== 'ativo' && (
                            <button
                              onClick={() => void handleAdvance(p.id)}
                              className="flex items-center gap-1 h-7 px-2 rounded-control bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors"
                            >
                              Avançar <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                          <div className="relative ml-auto">
                            <button
                              onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)}
                              className={`h-7 w-7 flex items-center justify-center rounded-control border ${elevatedClass} hover:border-accent transition-colors`}
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                            <AnimatePresence>
                              {menuOpen === p.id && (
                                <motion.div
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -4 }}
                                  className={`absolute right-0 top-8 z-10 w-44 rounded-panel border shadow-elevated ${isDark ? 'bg-elevated border-border' : 'bg-surface-light border-border-light'}`}
                                >
                                  {[
                                    { label: 'Editar', action: () => { setEditProspect(p); setShowProspectModal(true); setMenuOpen(null); } },
                                    { label: 'Adicionar nota', action: () => { setActivityFor({ id: p.id, name: p.businessName }); setMenuOpen(null); } },
                                    { label: 'Marcar perdido', action: () => void handleMarkLost(p) },
                                    { label: 'Excluir', action: () => void handleDelete(p.id) },
                                  ].map(item => (
                                    <button
                                      key={item.label}
                                      onClick={item.action}
                                      className={`w-full px-4 py-2.5 text-left text-xs font-medium hover:bg-accent/10 transition-colors ${item.label === 'Excluir' ? 'text-danger' : ''}`}
                                    >
                                      {item.label}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    ))}
                    {cols.length === 0 && (
                      <div className={`h-20 rounded-panel border border-dashed flex items-center justify-center text-xs text-muted ${isDark ? 'border-border' : 'border-border-light'}`}>
                        Vazio
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className={`rounded-section border ${panelClass}`}>
        <div className="p-5">
          <h3 className="text-sm font-semibold">Clientes Essencial com potencial de upgrade ({upsellCandidates.length})</h3>
          <div className="mt-3 space-y-2">
            {upsellCandidates.length === 0 ? (
              <p className="text-xs text-muted">Nenhuma oportunidade identificada</p>
            ) : (
              upsellCandidates.map(candidate => (
                <div key={candidate.id} className={`p-3 rounded-panel border flex items-center justify-between ${elevatedClass}`}>
                  <p className="text-xs font-medium">{candidate.businessName}</p>
                  <button onClick={onUpsellNotify} className="h-7 px-3 rounded-control bg-accent/10 text-accent text-xs font-medium">Notificar upgrade</button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* MRR History */}
      <section className={`p-5 rounded-section border ${panelClass}`}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold">MRR Histórico</h3>
            <p className="text-xs text-muted mt-1">Últimos 6 meses</p>
          </div>
          <div className="flex items-center gap-3">
            {mrrTrend !== null && (
              <span className={`text-xs font-medium px-2 py-1 rounded-control ${mrrTrend >= 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                {mrrTrend >= 0 ? '+' : ''}{mrrTrend}% vs mês anterior
              </span>
            )}
            <button
              id="record-mrr-btn"
              onClick={() => { recordCurrentMrr(prospects); setMrrHistory(getMrrHistory()); }}
              className={`h-9 px-4 rounded-control border text-xs font-medium hover:border-accent transition-colors ${elevatedClass}`}
            >
              Registrar MRR atual
            </button>
          </div>
        </div>
        {last6.length > 0 ? (
          <div className="flex items-end justify-around gap-3 h-40">
            {last6.map(entry => (
              <div key={entry.month} className="flex flex-col items-center gap-2 flex-1">
                <span className="text-xs text-muted font-medium">{fmtBRL(entry.value)}</span>
                <div
                  className="w-full rounded-t-control bg-accent/80 hover:bg-accent transition-colors"
                  style={{ height: `${entry.height}%` }}
                  title={`${entry.month}: ${fmtBRL(entry.value)}`}
                />
                <span className="text-xs text-muted">{entry.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className={`h-40 rounded-panel border border-dashed flex items-center justify-center text-xs text-muted ${isDark ? 'border-border' : 'border-border-light'}`}>
            Nenhum registro ainda. Clique em "Registrar MRR atual" para começar.
          </div>
        )}
      </section>

      {/* Churns */}
      <section className={`rounded-section border ${panelClass}`}>
        <button
          onClick={() => setChurnsOpen(o => !o)}
          className="w-full flex items-center justify-between p-5 text-left"
        >
          <div>
            <h3 className="text-sm font-semibold">Churns</h3>
            <p className="text-xs text-muted mt-1">{prospects.filter(p => p.stage === 'perdido').length} prospects perdidos no total</p>
          </div>
          {churnsOpen ? <ChevronDown className="w-4 h-4 text-muted" /> : <ChevronRight className="w-4 h-4 text-muted" />}
        </button>
        <AnimatePresence>
          {churnsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className={`border-t ${isDark ? 'border-border' : 'border-border-light'}`}>
                <div className="px-5 pt-4 pb-3 flex items-center justify-between">
                  <div className="flex gap-2">
                    {(['30d', '90d', 'todos'] as ChurnFilter[]).map(f => (
                      <button
                        key={f}
                        onClick={() => setChurnFilter(f)}
                        className={`h-7 px-3 rounded-control text-xs font-medium transition-colors ${churnFilter === f ? 'bg-accent text-white' : `border ${elevatedClass}`}`}
                      >
                        {f === '30d' ? 'Últimos 30d' : f === '90d' ? 'Últimos 90d' : 'Todos'}
                      </button>
                    ))}
                  </div>
                  {churnMrrLost > 0 && (
                    <span className="text-xs font-medium text-danger">MRR perdido: {fmtBRL(churnMrrLost)}</span>
                  )}
                </div>
                {churnedFiltered.length > 0 ? (
                  <div className="px-5 pb-5 overflow-x-auto">
                    <table className="w-full min-w-[700px] text-left text-sm">
                      <thead>
                        <tr className={`border-b text-xs font-medium text-muted ${isDark ? 'border-border' : 'border-border-light'}`}>
                          <th className="px-4 py-3">Estabelecimento</th>
                          <th className="px-4 py-3">Plano era</th>
                          <th className="px-4 py-3">Valor</th>
                          <th className="px-4 py-3">Motivo</th>
                          <th className="px-4 py-3">Data</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-border' : 'divide-border-light'}`}>
                        {churnedFiltered.map(p => (
                          <tr key={p.id}>
                            <td className="px-4 py-3 font-medium">{p.businessName}</td>
                            <td className="px-4 py-3 text-muted">{PLAN_LABELS[p.planInterest]}</td>
                            <td className="px-4 py-3 text-danger font-medium">{fmtBRL(p.monthlyValue)}</td>
                            <td className="px-4 py-3 text-muted max-w-[200px] truncate">{p.lostReason || '—'}</td>
                            <td className="px-4 py-3 text-muted">{new Date(p.updatedAt).toLocaleDateString('pt-BR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="px-5 pb-5 text-xs text-muted">Nenhum churn no período selecionado.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Modals */}
      <AnimatePresence>
        {showProspectModal && (
          <ProspectModal
            prospect={editProspect}
            onClose={() => setShowProspectModal(false)}
            onSave={async (input, id) => {
              if (id) await update(id, input);
              else await create(input);
              await reload();
            }}
            isDark={isDark}
            elevatedClass={elevatedClass}
            panelClass={panelClass}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {activityFor && (
          <ActivityModal
            prospectId={activityFor.id}
            prospectName={activityFor.name}
            onClose={() => setActivityFor(null)}
            onSave={reload}
            isDark={isDark}
            elevatedClass={elevatedClass}
            panelClass={panelClass}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

interface TabSuporteProps {
  panelClass: string;
  elevatedClass: string;
  onTicketResolved: () => void;
}

const TabSuporte: React.FC<TabSuporteProps> = ({ panelClass, elevatedClass, onTicketResolved }) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [filter, setFilter] = useState<'todos' | SupportTicket['status']>('todos');
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState('');

  const refresh = useCallback(async () => {
    const next = await listAllTickets();
    setTickets(next);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const visible = filter === 'todos' ? tickets : tickets.filter(item => item.status === filter);
  const openCount = tickets.filter(item => item.status === 'open').length;
  const inProgressCount = tickets.filter(item => item.status === 'in_progress').length;
  const urgentCount = tickets.filter(item => item.priority === 'urgent').length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[['Abertos', openCount], ['Em andamento', inProgressCount], ['Resolvidos', tickets.filter(item => item.status === 'resolved').length], ['Urgentes', urgentCount]].map(([label, value]) => (
          <div key={String(label)} className={`p-4 rounded-panel border ${panelClass}`}>
            <p className="text-xs text-muted">{label}</p>
            <p className="text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <section className={`p-5 rounded-section border ${panelClass} space-y-4`}>
        <div className="flex items-center gap-2">
          {(['todos', 'open', 'in_progress', 'resolved'] as const).map(item => (
            <button key={item} onClick={() => setFilter(item)} className={`h-8 px-3 rounded-control text-xs ${filter === item ? 'bg-accent text-white' : `border ${elevatedClass}`}`}>{item}</button>
          ))}
        </div>
        <div className="space-y-2">
          {visible.map(ticket => (
            <button key={ticket.id} onClick={async () => { setSelected(ticket); setMessages(await listMessages(ticket.id)); }} className={`w-full p-3 rounded-panel border flex items-center justify-between text-left ${elevatedClass}`}>
              <span className="text-xs">{ticket.empresaName || ticket.empresaId} - {ticket.title}</span>
              <span className="text-xs text-muted">{ticket.priority} / {ticket.status}</span>
            </button>
          ))}
        </div>
      </section>
      {selected && (
        <section className={`p-5 rounded-section border ${panelClass} space-y-3`}>
          <h3 className="text-sm font-semibold">Responder: {selected.title}</h3>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {messages.map(item => (
              <div key={item.id} className={`p-3 rounded-panel border ${elevatedClass}`}>
                <p className="text-xs font-semibold">{item.authorName}</p>
                <p className="text-xs text-muted">{item.body}</p>
              </div>
            ))}
          </div>
          <textarea value={reply} onChange={e => setReply(e.target.value)} rows={3} className={`w-full rounded-control border px-3 py-2 text-xs ${elevatedClass}`} />
          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (!reply.trim()) return;
                await addMessage(selected.id, 'Time Master', reply, true);
                await updateTicketStatus(selected.id, 'in_progress');
                setReply('');
                setMessages(await listMessages(selected.id));
                await refresh();
              }}
              className="h-9 px-4 rounded-control bg-accent text-white text-xs"
            >
              Responder
            </button>
            <button
              onClick={async () => {
                await updateTicketStatus(selected.id, 'resolved');
                onTicketResolved();
                await refresh();
              }}
              className={`h-9 px-4 rounded-control border text-xs ${elevatedClass}`}
            >
              Resolver
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

// ---

export const MasterDashboard: React.FC = () => {
  const { theme } = useApp();
  const master = useMaster();
  const isDark = theme === 'dark';
  const panelClass = isDark ? 'bg-surface border-border' : 'bg-surface-light border-border-light';
  const elevatedClass = isDark ? 'bg-elevated border-border' : 'bg-elevated-light border-border-light';

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [notifPrefillType, setNotifPrefillType] = useState<AppNotification['type'] | undefined>(undefined);
  const [pendingFilter, setPendingFilter] = useState<'all' | 'active' | 'trial' | 'suspended'>('all');
  const [openTicketsCount, setOpenTicketsCount] = useState(0);

  const handleUpsellNotify = useCallback(() => {
    setNotifPrefillType('sales');
    setActiveTab('notifications');
  }, []);

  const handleOverviewNavigate = useCallback((tab: Tab, filter?: string) => {
    setActiveTab(tab);
    if (filter) setPendingFilter(filter as 'active' | 'trial' | 'suspended' | 'all');
  }, []);

  const handleTicketResolved = useCallback(() => {
    setOpenTicketsCount(prev => Math.max(0, prev - 1));
  }, []);

  const handleReactivateEmpresa = useCallback(async (empresaId: string) => {
    await master.updateStatus(empresaId, { licenseStatus: 'active', active: true });
  }, [master.updateStatus]);

  useEffect(() => {
    const run = async () => {
      try {
        const tickets = await listAllTickets();
        setOpenTicketsCount(tickets.filter(t => t.status === 'open').length);
      } catch {
        // silencioso
      }
    };
    void run();
  }, []);

  const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview',      label: 'Visão Geral',  icon: LineChart },
    { id: 'companies',     label: 'Empresas',     icon: Building2 },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'comercial',     label: 'Comercial',    icon: ClipboardList },
    { id: 'suporte',       label: 'Suporte',      icon: MessageSquare },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold leading-none">Painel Master</h2>
          <p className="text-sm text-muted">Visão cross-empresa para operação comercial da Plena</p>
        </div>
        <div className="grid grid-cols-2 md:flex md:items-center gap-3">
          <FilterControl icon={CalendarDays} label="Período" value="Mês" className={elevatedClass} />
          <FilterControl icon={Building2} label="Empresa" value="Todas" className={elevatedClass} />
          <FilterControl icon={TrendingUp} label="Plano" value="Todos" className={elevatedClass} />
          <button className="h-10 px-4 rounded-control bg-accent text-white text-xs font-medium hover:bg-accent-hover">
            Filtrar
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className={`flex items-center gap-1 p-1 rounded-panel border w-full md:w-auto md:inline-flex ${isDark ? 'bg-elevated border-border' : 'bg-elevated-light border-border-light'}`}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 h-8 px-4 rounded-control text-xs font-medium transition-all ${
                isActive
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-muted hover:text-text'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.id === 'suporte' && openTicketsCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-danger text-white text-[9px] font-bold leading-none">
                  {openTicketsCount > 9 ? '9+' : openTicketsCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'overview' && (
            <TabOverview
              isDark={isDark}
              panelClass={panelClass}
              elevatedClass={elevatedClass}
              empresas={master.empresas}
              onNavigate={handleOverviewNavigate}
              onReactivateEmpresa={handleReactivateEmpresa}
            />
          )}
          {activeTab === 'companies' && (
            <TabCompanies isDark={isDark} panelClass={panelClass} elevatedClass={elevatedClass} initialFilter={pendingFilter} />
          )}
          {activeTab === 'notifications' && (
            <TabNotificacoes
              isDark={isDark}
              panelClass={panelClass}
              elevatedClass={elevatedClass}
              prefillType={notifPrefillType}
              onClearPrefill={() => setNotifPrefillType(undefined)}
            />
          )}
          {activeTab === 'comercial' && (
            <TabComercial
              isDark={isDark}
              panelClass={panelClass}
              elevatedClass={elevatedClass}
              onUpsellNotify={handleUpsellNotify}
            />
          )}
          
          {activeTab === 'suporte' && (
            <TabSuporte panelClass={panelClass} elevatedClass={elevatedClass} onTicketResolved={handleTicketResolved} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ---

type FilterControlProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  className: string;
};

const FilterControl: React.FC<FilterControlProps> = ({ icon: Icon, label, value, className }) => (
  <button className={`h-10 min-w-36 rounded-control border px-3 text-left ${className}`}>
    <span className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-muted" />
      <span className="text-xs font-medium text-muted">{label}: <span className="text-text">{value}</span></span>
    </span>
  </button>
);









