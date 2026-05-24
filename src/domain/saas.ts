import { Expense, Permission, Plano, UserRole } from '../types';

const viteEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};

export const APP_NAME = viteEnv.VITE_APP_NAME || 'Gestão Gastro';
export const DEFAULT_EMPRESA_ID = viteEnv.VITE_DEFAULT_EMPRESA_ID || 'demo-empresa';
export const LICENSE_STATUS_URL = viteEnv.VITE_LICENSE_STATUS_URL || '';
export const STORAGE_PREFIX = 'gestao-gastro';

export type ModuleId =
  | 'dashboard'
  | 'pdv'
  | 'mesas'
  | 'delivery'
  | 'cozinha'
  | 'estoque'
  | 'caixa'
  | 'produtos'
  | 'clientes'
  | 'colaboradores'
  | 'fornecedores'
  | 'relatorios'
  | 'configuracoes'
  | 'seguranca'
  | 'suporte'
  | 'manual';

export const planModules: Record<Plano, ModuleId[]> = {
  essencial: ['pdv', 'mesas', 'caixa', 'produtos', 'relatorios'],
  profissional: ['pdv', 'mesas', 'caixa', 'produtos', 'relatorios', 'cozinha', 'estoque', 'clientes', 'fornecedores'],
  gestao: [
    'dashboard',
    'pdv',
    'mesas',
    'delivery',
    'caixa',
    'produtos',
    'relatorios',
    'cozinha',
    'estoque',
    'clientes',
    'fornecedores',
    'colaboradores',
    'configuracoes',
    'seguranca',
    'suporte',
    'manual',
  ],
};

export const rolePermissions: Record<UserRole, Permission[]> = {
  master: [
    'dashboard:read',
    'pdv:write',
    'mesas:write',
    'delivery:write',
    'cozinha:write',
    'estoque:write',
    'caixa:write',
    'produtos:write',
    'clientes:write',
    'colaboradores:write',
    'fornecedores:write',
    'relatorios:read',
    'configuracoes:write',
    'seguranca:read',
    'suporte:read',
    'master:write',
  ],
  gerente: [
    'dashboard:read',
    'pdv:write',
    'mesas:write',
    'delivery:write',
    'cozinha:write',
    'estoque:write',
    'caixa:write',
    'produtos:write',
    'clientes:write',
    'colaboradores:write',
    'fornecedores:write',
    'relatorios:read',
    'configuracoes:write',
    'seguranca:read',
    'suporte:read',
  ],
  caixa: ['pdv:write', 'mesas:write', 'caixa:write', 'relatorios:read', 'suporte:read'],
  garcom: ['pdv:write', 'mesas:write', 'suporte:read'],
  cozinha: ['cozinha:write', 'suporte:read'],
  estoque: ['estoque:write', 'produtos:write', 'fornecedores:write', 'suporte:read'],
  suporte: ['dashboard:read', 'relatorios:read', 'seguranca:read', 'suporte:read'],
};

export const modulePermissions: Record<ModuleId, Permission> = {
  dashboard: 'dashboard:read',
  pdv: 'pdv:write',
  mesas: 'mesas:write',
  delivery: 'delivery:write',
  cozinha: 'cozinha:write',
  estoque: 'estoque:write',
  caixa: 'caixa:write',
  produtos: 'produtos:write',
  clientes: 'clientes:write',
  colaboradores: 'colaboradores:write',
  fornecedores: 'fornecedores:write',
  relatorios: 'relatorios:read',
  configuracoes: 'configuracoes:write',
  seguranca: 'seguranca:read',
  suporte: 'suporte:read',
  manual: 'suporte:read',
};

export const scopedCollections = [
  'products',
  'stockItems',
  'suppliers',
  'tables',
  'waiters',
  'orders',
  'expenses',
  'cashierSession',
  'cashierHistory',
  'customers',
  'collaborators',
  'stockMovements',
  'settings',
  'readGuides',
] as const;

export type ScopedCollection = (typeof scopedCollections)[number];

export const buildScopedStorageKey = (collection: ScopedCollection | string, empresaId: string) =>
  `${STORAGE_PREFIX}:${empresaId}:${collection}`;

export const getPlanModules = (plan: Plano) => planModules[plan];

export const hasRolePermission = (role: UserRole, permission: Permission) =>
  rolePermissions[role]?.includes(permission) ?? false;

export const canAccessModule = (plan: Plano, role: UserRole, moduleId: ModuleId) =>
  getPlanModules(plan).includes(moduleId) && hasRolePermission(role, modulePermissions[moduleId]);

export const ensureEmpresaId = <T extends { empresaId?: string }>(item: T, empresaId: string): T & { empresaId: string } => ({
  ...item,
  empresaId: item.empresaId || empresaId,
});

export const migrateLegacyCollection = <T extends { empresaId?: string }>(items: T[], empresaId: string) =>
  items.map(item => ensureEmpresaId(item, empresaId));

export const normalizeImportedCollection = <T extends { empresaId?: string }>(items: T[], empresaId: string) =>
  migrateLegacyCollection(items, empresaId).filter(item => item.empresaId === empresaId);

export const hasForeignEmpresaId = (value: unknown, empresaId: string): boolean => {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(item => hasForeignEmpresaId(item, empresaId));

  const record = value as { empresaId?: unknown };
  return typeof record.empresaId === 'string' && record.empresaId.length > 0 && record.empresaId !== empresaId;
};

export const validateImportEmpresaId = (value: unknown, empresaId: string) => {
  if (!value || typeof value !== 'object') {
    throw new Error('Backup invalido. Verifique o formato do arquivo.');
  }

  const record = value as { empresaId?: unknown; settings?: { empresaId?: unknown } };
  const importedEmpresaId = typeof record.empresaId === 'string' ? record.empresaId : record.settings?.empresaId;

  if (typeof importedEmpresaId === 'string' && importedEmpresaId !== empresaId) {
    throw new Error('Backup pertence a outra empresa e nao pode ser importado neste ambiente.');
  }

  if (hasForeignEmpresaId(value, empresaId)) {
    throw new Error('Backup contem dados de outra empresa e nao pode ser importado neste ambiente.');
  }
};

export const getSessionScopedExpenses = (expenses: Expense[], openedAt: string, empresaId: string) => {
  const openedAtMs = new Date(openedAt).getTime();

  return expenses.filter(expense => {
    const createdAt = expense.createdAt || expense.timestamp;
    return expense.empresaId === empresaId && new Date(createdAt).getTime() >= openedAtMs;
  });
};
