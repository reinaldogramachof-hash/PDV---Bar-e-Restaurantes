import { LicenseStatus, Plano } from '../types';

const CACHE_KEY = 'gestao-gastro:license-status';
const CACHE_TTL_MS = 60 * 60 * 1000;
const FALLBACK_LICENSE_PATH = '/license.status';

export interface LicenseCheckResult {
  status: LicenseStatus;
  expiresAt?: string;
  daysRemaining: number;
  plan: Plano;
}

interface CachedLicense {
  checkedAt: number;
  result: LicenseCheckResult;
}

const isLicenseStatus = (value: unknown): value is LicenseStatus =>
  value === 'active' || value === 'suspended' || value === 'trial';

const isPlan = (value: unknown): value is Plano =>
  value === 'essencial' || value === 'profissional' || value === 'gestao';

const calculateDaysRemaining = (expiresAt: string | undefined, now: Date) => {
  if (!expiresAt) return 0;
  const diffMs = new Date(expiresAt).getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
};

export const parseLicensePayload = (payload: string, now = new Date()): LicenseCheckResult => {
  const trimmed = payload.trim();
  const normalized = trimmed.toUpperCase();

  if (normalized === 'BLOQUEADO') {
    return { status: 'suspended', daysRemaining: 0, plan: 'gestao' };
  }

  if (normalized === 'LIBERADO') {
    return { status: 'active', daysRemaining: 999, plan: 'gestao' };
  }

  try {
    const parsed = JSON.parse(trimmed) as { status?: unknown; expiresAt?: unknown; validUntil?: unknown; plan?: unknown; plano?: unknown };
    const status = isLicenseStatus(parsed.status) ? parsed.status : 'active';
    const expiresAt = typeof parsed.expiresAt === 'string' ? parsed.expiresAt : typeof parsed.validUntil === 'string' ? parsed.validUntil : undefined;
    const planSource = parsed.plan ?? parsed.plano;
    const plan = isPlan(planSource) ? planSource : 'gestao';

    return {
      status,
      expiresAt,
      daysRemaining: status === 'suspended' ? 0 : calculateDaysRemaining(expiresAt, now),
      plan,
    };
  } catch {
    return { status: 'active', daysRemaining: 999, plan: 'gestao' };
  }
};

const readCache = (): LicenseCheckResult | null => {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached) as CachedLicense;
    if (Date.now() - parsed.checkedAt > CACHE_TTL_MS) return null;
    return parsed.result;
  } catch {
    return null;
  }
};

const writeCache = (result: LicenseCheckResult) => {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ checkedAt: Date.now(), result }));
  } catch {
    // Cache is best effort; license verification still returns the fetched result.
  }
};

const fetchLicenseText = async (url: string) => {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error('Falha ao verificar licenca.');
  return response.text();
};

export const checkLicense = async (url = ''): Promise<LicenseCheckResult> => {
  const cached = readCache();
  if (cached) return cached;

  const sources = [url, FALLBACK_LICENSE_PATH].filter(Boolean);

  for (const source of sources) {
    try {
      const payload = await fetchLicenseText(source);
      const result = parseLicensePayload(payload);
      writeCache(result);
      return result;
    } catch {
      // Try the next source before falling back to a permissive local status.
    }
  }

  const fallback = parseLicensePayload('LIBERADO');
  writeCache(fallback);
  return fallback;
};
