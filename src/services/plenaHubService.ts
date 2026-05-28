/**
 * plenaHubService.ts
 * Dados operacionais da Plena Informática: pipeline comercial, notificações
 * e histórico de MRR. Usa prefixo `gestao-gastro:master:` sem empresaId de
 * nenhum restaurante cliente.
 *
 * TODO: Substituir persistência localStorage por chamadas de API em produção.
 */
import { Prospect, CommercialActivity, MasterNotificationDraft, MrrEntry, AppNotification, Product, Order } from '../types';
import { addLocalNotification } from './notificationService';
import { STORAGE_PREFIX } from '../domain/saas';

// ─── Storage Keys ────────────────────────────────────────────────────────────

const MASTER_PREFIX = `${STORAGE_PREFIX}:master`;

const KEYS = {
  prospects:    `${MASTER_PREFIX}:prospects`,
  activities:   `${MASTER_PREFIX}:commercial-activity`,
  drafts:       `${MASTER_PREFIX}:notification-drafts`,
  mrrHistory:   `${MASTER_PREFIX}:mrr-history`,
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const now = () => new Date().toISOString();

const readJSON = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJSON = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage write failure should never crash the app.
  }
};

// ─── Prospects ───────────────────────────────────────────────────────────────

export function getProspects(): Prospect[] {
  return readJSON<Prospect[]>(KEYS.prospects, []);
}

export function saveProspect(p: Prospect): void {
  const list = getProspects();
  const idx = list.findIndex(x => x.id === p.id);
  const updated: Prospect = { ...p, updatedAt: now() };
  if (idx !== -1) {
    list[idx] = updated;
  } else {
    list.push(updated);
  }
  writeJSON(KEYS.prospects, list);
}

export function deleteProspect(id: string): void {
  writeJSON(KEYS.prospects, getProspects().filter(p => p.id !== id));
}

export function createProspect(
  data: Omit<Prospect, 'id' | 'createdAt' | 'updatedAt' | 'lastInteractionAt'>
): Prospect {
  const prospect: Prospect = {
    ...data,
    id: `prospect-${uid()}`,
    createdAt: now(),
    updatedAt: now(),
    lastInteractionAt: now(),
  };
  saveProspect(prospect);
  return prospect;
}

export function advanceProspectStage(id: string): void {
  const order: Prospect['stage'][] = [
    'contato', 'demo', 'proposta', 'contrato', 'onboarding', 'ativo',
  ];
  const list = getProspects();
  const idx = list.findIndex(p => p.id === id);
  if (idx === -1) return;
  const currentIndex = order.indexOf(list[idx].stage);
  if (currentIndex === -1 || currentIndex >= order.length - 1) return;
  list[idx] = { ...list[idx], stage: order[currentIndex + 1], updatedAt: now(), lastInteractionAt: now() };
  writeJSON(KEYS.prospects, list);
}

// ─── Commercial Activities ────────────────────────────────────────────────────

export function getActivities(): CommercialActivity[] {
  return readJSON<CommercialActivity[]>(KEYS.activities, []);
}

export function addActivity(
  data: Omit<CommercialActivity, 'id' | 'createdAt'>
): CommercialActivity {
  const activity: CommercialActivity = {
    ...data,
    id: `activity-${uid()}`,
    createdAt: now(),
  };
  const list = getActivities();
  list.push(activity);
  writeJSON(KEYS.activities, list);

  // Update lastInteractionAt on the linked prospect
  if (data.prospectId) {
    const prospects = getProspects();
    const idx = prospects.findIndex(p => p.id === data.prospectId);
    if (idx !== -1) {
      prospects[idx] = { ...prospects[idx], lastInteractionAt: now(), updatedAt: now() };
      writeJSON(KEYS.prospects, prospects);
    }
  }
  return activity;
}

export function getActivitiesForProspect(prospectId: string): CommercialActivity[] {
  return getActivities()
    .filter(a => a.prospectId === prospectId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// ─── Notification Drafts ─────────────────────────────────────────────────────

export function getDrafts(): MasterNotificationDraft[] {
  return readJSON<MasterNotificationDraft[]>(KEYS.drafts, []);
}

export function saveDraft(d: MasterNotificationDraft): void {
  const list = getDrafts();
  const idx = list.findIndex(x => x.id === d.id);
  if (idx !== -1) {
    list[idx] = d;
  } else {
    list.push(d);
  }
  writeJSON(KEYS.drafts, list);
}

export function createDraft(
  data: Omit<MasterNotificationDraft, 'id' | 'publishedAt' | 'status'>
): MasterNotificationDraft {
  const draft: MasterNotificationDraft = {
    ...data,
    id: `notif-${uid()}`,
    publishedAt: now(),
    status: 'draft',
  };
  saveDraft(draft);
  return draft;
}

export function publishDraft(id: string): void {
  const list = getDrafts();
  const idx = list.findIndex(d => d.id === id);
  if (idx === -1) return;
  list[idx] = { ...list[idx], status: 'published', publishedAt: now() };
  writeJSON(KEYS.drafts, list);

  // Inject into the notification feed so client bell receives it.
  const draft = list[idx];
  const notification: AppNotification = {
    id: draft.id,
    type: draft.type,
    title: draft.title,
    body: draft.body,
    action: draft.action,
    publishedAt: draft.publishedAt,
    expiresAt: draft.expiresAt,
    targetPlans: draft.targetPlans.length > 0 ? draft.targetPlans : undefined,
  };
  // Inject for the current demo empresa (local dev). In production this would
  // be broadcast via API. TODO: replace with API broadcast.
  try {
    const DEMO_EMPRESA = 'demo-empresa';
    addLocalNotification(notification, DEMO_EMPRESA);
  } catch {
    // Notification injection failure must never block the publish action.
  }
}

export function deleteDraft(id: string): void {
  writeJSON(KEYS.drafts, getDrafts().filter(d => d.id !== id));
}

export function duplicateDraft(id: string): MasterNotificationDraft | null {
  const draft = getDrafts().find(d => d.id === id);
  if (!draft) return null;
  const copy: MasterNotificationDraft = {
    ...draft,
    id: `notif-${uid()}`,
    status: 'draft',
    publishedAt: now(),
    title: `${draft.title} (cópia)`,
  };
  saveDraft(copy);
  return copy;
}

// ─── MRR ─────────────────────────────────────────────────────────────────────

export function getMrrHistory(): MrrEntry[] {
  return readJSON<MrrEntry[]>(KEYS.mrrHistory, []);
}

export function calcCurrentMrr(prospects: Prospect[]): number {
  return prospects
    .filter(p => p.stage === 'ativo')
    .reduce((acc, p) => acc + p.monthlyValue, 0);
}

export function recordCurrentMrr(prospects: Prospect[]): void {
  const month = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const value = calcCurrentMrr(prospects);
  const history = getMrrHistory();
  const idx = history.findIndex(e => e.month === month);
  if (idx !== -1) {
    history[idx] = { month, value };
  } else {
    history.push({ month, value });
  }
  // Keep only the last 12 months
  history.sort((a, b) => a.month.localeCompare(b.month));
  writeJSON(KEYS.mrrHistory, history.slice(-12));
}

// ─── Upsell Opportunities ─────────────────────────────────────────────────────

export interface UpsellOpportunity {
  empresaId: string;
  businessName: string;
  currentPlan: string;
  reason: string;
  suggestedPlan: string;
}

const PLAN_MODULE_COUNTS: Record<string, number> = {
  essencial: 5,
  profissional: 11,
  gestao: 18,
};

const PLAN_UPGRADE: Record<string, string> = {
  essencial: 'Profissional',
  profissional: 'Gestão',
  gestao: 'Gestão',
};

/**
 * Scans localStorage for client empresa data to detect upgrade candidates.
 * TODO: Replace localStorage scan with API aggregation call in production.
 */
export function getUpsellOpportunities(
  products: Product[],
  orders: Order[]
): UpsellOpportunity[] {
  const opportunities: UpsellOpportunity[] = [];
  const PREFIX = 'gestao-gastro:';

  // Collect all empresaIds from localStorage
  const empresaIds = new Set<string>();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(PREFIX)) continue;
    const parts = key.slice(PREFIX.length).split(':');
    if (parts[0] && parts[0] !== 'master' && parts[0] !== 'notifications') {
      empresaIds.add(parts[0]);
    }
  }

  for (const empresaId of empresaIds) {
    try {
      const settingsRaw = localStorage.getItem(`${PREFIX}${empresaId}:settings`);
      if (!settingsRaw) continue;
      const settings = JSON.parse(settingsRaw) as { establishment?: { name?: string }; plano?: string };
      const plan = settings.plano ?? 'essencial';
      const businessName = settings.establishment?.name ?? empresaId;
      if (plan === 'gestao') continue;

      // Heuristic: if products count > 80% of the plan's typical module usage
      const myProducts = products.filter(p => p.empresaId === empresaId);
      const myOrders = orders.filter(o => o.empresaId === empresaId);
      const usageScore = (myProducts.length > 10 ? 1 : 0) + (myOrders.length > 50 ? 1 : 0);
      const moduleCount = PLAN_MODULE_COUNTS[plan] ?? 5;
      const usagePercent = Math.min(100, Math.round((usageScore / 2) * 80 + Math.min(20, myProducts.length) + Math.min(10, myOrders.length / 10)));

      if (usagePercent >= 70) {
        opportunities.push({
          empresaId,
          businessName,
          currentPlan: plan,
          reason: `Usa ${usagePercent}% da capacidade do plano ${plan} (${moduleCount} módulos)`,
          suggestedPlan: PLAN_UPGRADE[plan] ?? 'Gestão',
        });
      }
    } catch {
      // Skip malformed empresa data
    }
  }

  return opportunities;
}
