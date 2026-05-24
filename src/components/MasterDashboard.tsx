import React, { useState, useCallback, useMemo } from 'react';
import {
  AlertTriangle, Bell, Building2, CalendarDays, ChevronDown,
  ChevronRight, Copy, Filter, Info, LineChart, MessageSquare,
  MoreHorizontal, Plus, ReceiptText, ShieldAlert, ShoppingBag,
  Sparkles, Tag, TrendingUp, Trash2, Zap, X, Phone, Mail,
  ArrowRight, ClipboardList,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../store/AppContext';
import {
  getProspects, saveProspect, deleteProspect, createProspect,
  advanceProspectStage, getDrafts, createDraft, saveDraft,
  publishDraft, deleteDraft, duplicateDraft, getMrrHistory,
  calcCurrentMrr, recordCurrentMrr, addActivity,
  getActivitiesForProspect, getUpsellOpportunities,
} from '../services/plenaHubService';
import type {
  Prospect, ProspectStage, MasterNotificationDraft,
  CommercialActivity, AppNotification,
} from '../types';

// ─── Tab Types ────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'companies' | 'notifications' | 'comercial';

// ─── Static mock data (overview tab) ─────────────────────────────────────────

const companies = [
  { name: 'Soberano Grill', plan: 'Gestao', status: 'Ativa', statusTone: 'text-success', lastActivity: 'Hoje, 14:22', action: 'Ver' },
  { name: 'Cantina Brasil', plan: 'Profissional', status: 'Renovar', statusTone: 'text-warning', lastActivity: 'Ontem, 18:10', action: 'Contato' },
  { name: 'Bistro Avenida', plan: 'Essencial', status: 'Suspensa', statusTone: 'text-danger', lastActivity: '3 dias atras', action: 'Ver' },
  { name: 'Villa Massas', plan: 'Profissional', status: 'Ativa', statusTone: 'text-success', lastActivity: 'Hoje, 09:44', action: 'Ver' },
];

const alerts = [
  { company: 'Soberano Grill', detail: 'Vence em 8 dias' },
  { company: 'Cantina Brasil', detail: 'Vence em 14 dias' },
  { company: 'Villa Massas', detail: 'Vence em 26 dias' },
];

// ─── Pipeline stages ──────────────────────────────────────────────────────────

const STAGES: { id: ProspectStage; label: string; color: string }[] = [
  { id: 'contato',    label: 'Contato',    color: 'text-muted' },
  { id: 'demo',       label: 'Demo',       color: 'text-accent' },
  { id: 'proposta',   label: 'Proposta',   color: 'text-warning' },
  { id: 'contrato',   label: 'Contrato',   color: 'text-success' },
  { id: 'onboarding', label: 'Onboarding', color: 'text-success' },
  { id: 'ativo',      label: 'Ativo',      color: 'text-success' },
];

const PLAN_LABELS: Record<string, string> = {
  essencial: 'Essencial', profissional: 'Profissional', gestao: 'Gestão',
};

const ACTIVITY_LABELS: Record<CommercialActivity['type'], string> = {
  note: 'Nota', call: 'Ligação', demo: 'Demo', proposal: 'Proposta',
  contract: 'Contrato', upgrade: 'Upgrade', churn: 'Churn',
};

const NOTIF_ICON: Record<AppNotification['type'], React.ComponentType<{ className?: string }>> = {
  update: Sparkles, security: ShieldAlert, feature: Zap,
  support: MessageSquare, sales: Tag, info: Info,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const relativeTime = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return 'há menos de 1h';
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `há ${diffD}d`;
};

const isExpired = (draft: MasterNotificationDraft) =>
  draft.expiresAt ? new Date(draft.expiresAt) < new Date() : false;

const addDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

// ─── Prospect Modal ───────────────────────────────────────────────────────────

interface ProspectModalProps {
  prospect?: Prospect;
  onClose: () => void;
  onSave: () => void;
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

  const handleSave = () => {
    if (!form.businessName || !form.contactName || !form.contactPhone) return;
    if (isEdit && prospect) {
      saveProspect({ ...prospect, ...form });
    } else {
      createProspect({
        businessName: form.businessName, contactName: form.contactName,
        contactPhone: form.contactPhone, contactEmail: form.contactEmail,
        planInterest: form.planInterest, stage: form.stage,
        notes: form.notes, lostReason: form.lostReason || undefined,
        monthlyValue: form.monthlyValue,
      });
    }
    onSave();
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
                <option value="essencial">Essencial</option>
                <option value="profissional">Profissional</option>
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
            onClick={handleSave}
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

// ─── Activity Modal ───────────────────────────────────────────────────────────

interface ActivityModalProps {
  prospectId: string;
  prospectName: string;
  onClose: () => void;
  onSave: () => void;
  isDark: boolean;
  elevatedClass: string;
  panelClass: string;
}

const ActivityModal: React.FC<ActivityModalProps> = ({ prospectId, prospectName, onClose, onSave, isDark, elevatedClass, panelClass }) => {
  const [type, setType] = useState<CommercialActivity['type']>('note');
  const [description, setDescription] = useState('');

  const activities = useMemo(() => getActivitiesForProspect(prospectId), [prospectId]);

  const handleAdd = () => {
    if (!description.trim()) return;
    addActivity({ prospectId, type, description });
    setDescription('');
    onSave();
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
            onClick={handleAdd}
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

// ─── Tab: Overview ────────────────────────────────────────────────────────────

interface TabOverviewProps { isDark: boolean; panelClass: string; elevatedClass: string }

const TabOverview: React.FC<TabOverviewProps> = ({ isDark, panelClass, elevatedClass }) => {
  const kpis = [
    { label: 'Receita Total', value: 'R$ 248.900', detail: '+12,4% vs mes anterior', icon: ReceiptText, tone: 'text-success', bg: 'bg-success/10' },
    { label: 'Pedidos Hoje', value: '1.284', detail: 'Operacao em alta', icon: ShoppingBag, tone: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Empresas Ativas', value: '37', detail: '4 novas no periodo', icon: Building2, tone: 'text-success', bg: 'bg-success/10' },
    { label: 'Licencas a Vencer', value: '6', detail: 'Proximos 30 dias', icon: AlertTriangle, tone: 'text-warning', bg: 'bg-warning/10' },
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
            className={`p-5 rounded-panel border ${panelClass}`}
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
        </section>
        <section className={`p-5 rounded-section border ${panelClass}`}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold">Alertas de licenca</h3>
            <span className="text-xs font-medium text-warning">6 abertas</span>
          </div>
          <div className="space-y-3">
            {alerts.map(alert => (
              <div key={alert.company} className={`p-4 rounded-panel border ${elevatedClass}`}>
                <p className="text-sm font-semibold text-warning">{alert.company}</p>
                <p className="text-xs text-muted mt-1">{alert.detail}</p>
              </div>
            ))}
          </div>
          <button className="mt-5 h-10 w-full rounded-control bg-accent px-4 text-xs font-medium text-white hover:bg-accent-hover">
            Abrir renovacoes
          </button>
        </section>
      </div>
    </div>
  );
};

// ─── Tab: Companies ───────────────────────────────────────────────────────────

interface TabCompaniesProps { isDark: boolean; panelClass: string; elevatedClass: string }

const TabCompanies: React.FC<TabCompaniesProps> = ({ isDark, panelClass, elevatedClass }) => (
  <section className={`p-5 rounded-section border ${panelClass}`}>
    <div className="flex items-center justify-between mb-5">
      <div>
        <h3 className="text-sm font-semibold">Empresas clientes</h3>
        <p className="text-xs text-muted mt-1">Status operacional, plano contratado e ultima atividade</p>
      </div>
      <button className={`h-10 px-4 rounded-control border text-xs font-medium ${elevatedClass}`}>Exportar</button>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead>
          <tr className={`border-b text-xs font-medium text-muted ${isDark ? 'border-border' : 'border-border-light'}`}>
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3">Plano</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Ultima atividade</th>
            <th className="px-4 py-3 text-right">Acao</th>
          </tr>
        </thead>
        <tbody className={`divide-y ${isDark ? 'divide-border' : 'divide-border-light'}`}>
          {companies.map(company => (
            <tr key={company.name} className={isDark ? 'hover:bg-elevated' : 'hover:bg-elevated-light'}>
              <td className="px-4 py-3 font-medium">{company.name}</td>
              <td className="px-4 py-3 text-muted">{company.plan}</td>
              <td className="px-4 py-3"><span className={`text-xs font-medium ${company.statusTone}`}>{company.status}</span></td>
              <td className="px-4 py-3 text-muted">{company.lastActivity}</td>
              <td className="px-4 py-3 text-right">
                <button className={`inline-flex h-8 items-center gap-2 rounded-control border px-3 text-xs font-medium ${company.action === 'Contato' ? 'bg-accent text-white border-accent' : elevatedClass}`}>
                  {company.action}
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

// ─── Tab: Notifications ───────────────────────────────────────────────────────

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
  { label: 'Segurança', type: 'security' as AppNotification['type'], title: 'Aviso de segurança importante' },
  { label: 'Oferta', type: 'sales' as AppNotification['type'], title: 'Oferta especial para você' },
];

const BLANK_DRAFT = {
  type: 'update' as AppNotification['type'],
  title: '', body: '', action: '',
  targetPlans: ['essencial', 'profissional', 'gestao'] as MasterNotificationDraft['targetPlans'],
  expiryDays: 30,
};

const TabNotificacoes: React.FC<TabNotificacoesProps> = ({ isDark, panelClass, elevatedClass, prefillType, onClearPrefill }) => {
  const [form, setForm] = useState({ ...BLANK_DRAFT, type: prefillType ?? BLANK_DRAFT.type });
  const [drafts, setDrafts] = useState<MasterNotificationDraft[]>(() => getDrafts());

  const reload = () => setDrafts(getDrafts());

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

  const handleSaveDraft = () => {
    if (!form.title || !form.body) return;
    createDraft({
      type: form.type, title: form.title, body: form.body,
      action: form.action || undefined,
      targetPlans: form.targetPlans,
      expiresAt: form.expiryDays > 0 ? addDays(form.expiryDays) : undefined,
    });
    setForm({ ...BLANK_DRAFT });
    reload();
  };

  const handlePublish = () => {
    if (!form.title || !form.body) return;
    const d = createDraft({
      type: form.type, title: form.title, body: form.body,
      action: form.action || undefined,
      targetPlans: form.targetPlans,
      expiresAt: form.expiryDays > 0 ? addDays(form.expiryDays) : undefined,
    });
    publishDraft(d.id);
    setForm({ ...BLANK_DRAFT });
    reload();
  };

  const NotifIcon = NOTIF_ICON[form.type];

  return (
    <div className="space-y-5">
      {/* Composer */}
      <section className={`p-5 rounded-section border ${panelClass}`}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold">Nova Notificação</h3>
            <p className="text-xs text-muted mt-1">A notificação será entregue na próxima vez que os clientes abrirem o sistema</p>
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
              placeholder="Título da notificação"
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
            onClick={handleSaveDraft}
            disabled={!form.title || !form.body}
            className={`h-10 px-4 rounded-control border text-xs font-medium disabled:opacity-40 ${elevatedClass}`}
          >
            Salvar Rascunho
          </button>
          <button
            id="notif-publish"
            onClick={handlePublish}
            disabled={!form.title || !form.body}
            className="h-10 px-4 rounded-control bg-accent text-white text-xs font-medium hover:bg-accent-hover disabled:opacity-40"
          >
            Publicar Agora
          </button>
        </div>
      </section>

      {/* History */}
      {drafts.length > 0 && (
        <section className={`p-5 rounded-section border ${panelClass}`}>
          <h3 className="text-sm font-semibold mb-5">Histórico de notificações</h3>
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
                {[...drafts].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()).map(d => {
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
                      <td className="px-4 py-3 text-xs text-muted">{new Date(d.publishedAt).toLocaleDateString('pt-BR')}</td>
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
                              onClick={() => { publishDraft(d.id); reload(); }}
                              className="h-7 w-7 flex items-center justify-center rounded-control text-muted hover:text-success transition-colors"
                            >
                              <Bell className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            title="Duplicar"
                            onClick={() => { duplicateDraft(d.id); reload(); }}
                            className="h-7 w-7 flex items-center justify-center rounded-control text-muted hover:text-accent transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Excluir"
                            onClick={() => { deleteDraft(d.id); reload(); }}
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

// ─── Tab: Comercial ───────────────────────────────────────────────────────────

type ChurnFilter = '30d' | '90d' | 'todos';

interface TabComercialProps {
  isDark: boolean; panelClass: string; elevatedClass: string;
  onUpsellNotify: () => void;
}

const TabComercial: React.FC<TabComercialProps> = ({ isDark, panelClass, elevatedClass, onUpsellNotify }) => {
  const { products, orders } = useApp();

  const [prospects, setProspects] = useState<Prospect[]>(() => getProspects());
  const [showProspectModal, setShowProspectModal] = useState(false);
  const [editProspect, setEditProspect] = useState<Prospect | undefined>(undefined);
  const [activityFor, setActivityFor] = useState<{ id: string; name: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [churnsOpen, setChurnsOpen] = useState(false);
  const [churnFilter, setChurnFilter] = useState<ChurnFilter>('30d');
  const [mrrHistory, setMrrHistory] = useState(() => getMrrHistory());

  const reload = useCallback(() => {
    setProspects(getProspects());
    setMrrHistory(getMrrHistory());
  }, []);

  const upsellOpps = useMemo(() => getUpsellOpportunities(products, orders), [products, orders]);

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

  const handleAdvance = (id: string) => { advanceProspectStage(id); reload(); };
  const handleDelete = (id: string) => { deleteProspect(id); reload(); setMenuOpen(null); };
  const handleMarkLost = (p: Prospect) => {
    saveProspect({ ...p, stage: 'perdido', updatedAt: new Date().toISOString() });
    reload(); setMenuOpen(null);
  };

  const kpis = [
    { label: 'MRR Atual', value: fmtBRL(currentMrr), icon: TrendingUp, tone: 'text-success', bg: 'bg-success/10' },
    { label: 'Clientes Ativos', value: String(activeProspects.length), icon: Building2, tone: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Pipeline Aberto', value: fmtBRL(pipelineMrr), icon: Filter, tone: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Churn este mês', value: String(churnedThisMonth.length), icon: AlertTriangle, tone: 'text-danger', bg: 'bg-danger/10' },
  ];

  return (
    <div className="space-y-5">
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
                              onClick={() => handleAdvance(p.id)}
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
                                    { label: 'Marcar perdido', action: () => handleMarkLost(p) },
                                    { label: 'Excluir', action: () => handleDelete(p.id) },
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

      {/* Upsell */}
      {upsellOpps.length > 0 && (
        <section className={`rounded-section border ${panelClass}`}>
          <button
            onClick={() => setUpsellOpen(o => !o)}
            className="w-full flex items-center justify-between p-5 text-left"
          >
            <div>
              <h3 className="text-sm font-semibold">Clientes com potencial de upgrade</h3>
              <p className="text-xs text-muted mt-1">{upsellOpps.length} oportunidade{upsellOpps.length > 1 ? 's' : ''} identificada{upsellOpps.length > 1 ? 's' : ''}</p>
            </div>
            {upsellOpen ? <ChevronDown className="w-4 h-4 text-muted" /> : <ChevronRight className="w-4 h-4 text-muted" />}
          </button>
          <AnimatePresence>
            {upsellOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className={`px-5 pb-5 space-y-3 border-t ${isDark ? 'border-border' : 'border-border-light'}`}>
                  <div className="pt-4 space-y-3">
                    {upsellOpps.map(opp => (
                      <div key={opp.empresaId} className={`p-4 rounded-panel border flex items-center justify-between gap-4 ${elevatedClass}`}>
                        <div>
                          <p className="text-sm font-semibold">{opp.businessName}</p>
                          <p className="text-xs text-muted mt-0.5">{opp.reason}</p>
                          <span className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-medium text-accent">
                            {PLAN_LABELS[opp.currentPlan]} <ArrowRight className="w-3 h-3" /> {opp.suggestedPlan}
                          </span>
                        </div>
                        <button
                          onClick={onUpsellNotify}
                          className="shrink-0 h-8 px-3 rounded-control bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors"
                        >
                          Enviar notificação
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

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
            onSave={reload}
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

// ─── Main Component ───────────────────────────────────────────────────────────

export const MasterDashboard: React.FC = () => {
  const { theme } = useApp();
  const isDark = theme === 'dark';
  const panelClass = isDark ? 'bg-surface border-border' : 'bg-surface-light border-border-light';
  const elevatedClass = isDark ? 'bg-elevated border-border' : 'bg-elevated-light border-border-light';

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [notifPrefillType, setNotifPrefillType] = useState<AppNotification['type'] | undefined>(undefined);

  const handleUpsellNotify = useCallback(() => {
    setNotifPrefillType('sales');
    setActiveTab('notifications');
  }, []);

  const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview',      label: 'Visão Geral',  icon: LineChart },
    { id: 'companies',     label: 'Empresas',     icon: Building2 },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'comercial',     label: 'Comercial',    icon: ClipboardList },
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
          <FilterControl icon={CalendarDays} label="Periodo" value="Mes" className={elevatedClass} />
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
            <TabOverview isDark={isDark} panelClass={panelClass} elevatedClass={elevatedClass} />
          )}
          {activeTab === 'companies' && (
            <TabCompanies isDark={isDark} panelClass={panelClass} elevatedClass={elevatedClass} />
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
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

// ─── Filter Control ───────────────────────────────────────────────────────────

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
