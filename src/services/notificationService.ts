import { AppNotification, Plano } from '../types';
import { buildScopedStorageKey } from '../domain/saas';

const viteEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};

export const NOTIFICATIONS_URL = viteEnv.VITE_NOTIFICATIONS_URL || viteEnv.NOTIFICATIONS_URL || '';
export const NOTIFICATIONS_CACHE_KEY = 'gestao-gastro:notifications:cache';
export const NOTIFICATIONS_UPDATED_EVENT = 'gestao-gastro:notifications:update';

const CACHE_TTL_MS = 60 * 60 * 1000;

interface CachedNotificationFeed {
  data: AppNotification[];
  fetchedAt: number;
}

const isNotification = (value: unknown): value is AppNotification => {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<AppNotification>;
  return Boolean(item.id && item.type && item.title && item.body && item.publishedAt);
};

const dispatchUpdate = () => {
  if (typeof window === 'undefined' || typeof window.dispatchEvent !== 'function') return;
  try {
    window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT));
  } catch {
    // Notification updates are best effort in non-browser runtimes.
  }
};

const readSessionJSON = <T,>(key: string, fallback: T): T => {
  if (typeof sessionStorage === 'undefined') return fallback;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};

const writeSessionJSON = <T,>(key: string, value: T) => {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Cache failure should never break the app shell.
  }
};

const readLocalJSON = <T,>(key: string, fallback: T): T => {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};

const writeLocalJSON = <T,>(key: string, value: T) => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Read state is useful but not critical.
  }
};

const readKey = (empresaId: string) => buildScopedStorageKey('notifications:read', empresaId);
const localKey = (empresaId: string) => buildScopedStorageKey('notifications:local', empresaId);

const writeCache = (data: AppNotification[]) => {
  writeSessionJSON<CachedNotificationFeed>(NOTIFICATIONS_CACHE_KEY, { data, fetchedAt: Date.now() });
};

const getLocalNotifications = (empresaId: string) =>
  readSessionJSON<AppNotification[]>(localKey(empresaId), []);

const isVisibleForPlan = (notification: AppNotification, plan: Plano) =>
  !notification.targetPlans || notification.targetPlans.length === 0 || notification.targetPlans.includes(plan);

const isNotExpired = (notification: AppNotification) =>
  !notification.expiresAt || new Date(notification.expiresAt).getTime() > Date.now();

export async function fetchFeed(url = NOTIFICATIONS_URL): Promise<AppNotification[]> {
  if (!url) return getCachedFeed();

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error('notifications feed unavailable');
    const payload = await response.json();
    const data = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
    const notifications = data.filter(isNotification);
    writeCache(notifications);
    dispatchUpdate();
    return notifications;
  } catch {
    return getCachedFeed();
  }
}

export function getCachedFeed(): AppNotification[] {
  const cached = readSessionJSON<CachedNotificationFeed | null>(NOTIFICATIONS_CACHE_KEY, null);
  if (!cached || Date.now() - cached.fetchedAt > CACHE_TTL_MS) return [];
  return cached.data.filter(isNotification);
}

export function getReadIds(empresaId: string): Set<string> {
  return new Set(readLocalJSON<string[]>(readKey(empresaId), []));
}

export function getUnread(empresaId: string, plan: Plano = 'gestao'): AppNotification[] {
  const readIds = getReadIds(empresaId);
  const merged = [...getCachedFeed(), ...getLocalNotifications(empresaId)];
  const byId = new Map<string, AppNotification>();
  merged.forEach(notification => byId.set(notification.id, notification));

  return [...byId.values()]
    .filter(notification => !readIds.has(notification.id))
    .filter(notification => isVisibleForPlan(notification, plan))
    .filter(isNotExpired)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export function markAsRead(id: string, empresaId: string) {
  const ids = getReadIds(empresaId);
  ids.add(id);
  writeLocalJSON(readKey(empresaId), [...ids]);
  dispatchUpdate();
}

export function markAllRead(empresaId: string, plan?: Plano) {
  const ids = getReadIds(empresaId);
  const candidates = plan
    ? getUnread(empresaId, plan)
    : [...getCachedFeed(), ...getLocalNotifications(empresaId)].filter(isNotExpired);
  candidates.forEach(notification => ids.add(notification.id));
  writeLocalJSON(readKey(empresaId), [...ids]);
  dispatchUpdate();
}

export function addLocalNotification(notification: AppNotification, empresaId: string) {
  const current = getLocalNotifications(empresaId).filter(item => item.id !== notification.id);
  writeSessionJSON(localKey(empresaId), [...current, notification]);
  dispatchUpdate();
}
