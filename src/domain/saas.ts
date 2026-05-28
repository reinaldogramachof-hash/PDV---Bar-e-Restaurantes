import { Expense, Permission, Plano, UserRole } from '../types';

const viteEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};

export const APP_NAME = viteEnv.VITE_APP_NAME || 'Gestão Gastro';
export const DEFAULT_EMPRESA_ID = viteEnv.VITE_DEFAULT_EMPRESA_ID || 'demo-empresa';
export const PLENA_EMPRESA_ID = viteEnv.VITE_PLENA_EMPRESA_ID || 'demo-empresa';
export const LICENSE_STATUS_URL = viteEnv.VITE_LICENSE_STATUS_URL || '';
export const STORAGE_PREFIX = 'gestao-gastro';
export const PLENA_WHATSAPP = '5511999999999';

export type ModuleId =
  | 'dashboard'
  | 'intelligence'
  | 'pdv'
  | 'mesas'
  | 'delivery'
  | 'pedidos-online'
  | 'cardapio-digital'
  | 'vendas'
  | 'cozinha'
  | 'estoque'
  | 'caixa'
  | 'produtos'
  | 'clientes'
  | 'colaboradores'
  | 'fornecedores'
  | 'relatorios'
  | 'configuracoes'
  | 'diario'
  | 'seguranca'
  | 'suporte'
  | 'manual';

export const planModules: Record<Plano, ModuleId[]> = {
  essencial: ['pdv', 'mesas', 'caixa', 'produtos', 'relatorios', 'cozinha', 'cardapio-digital'],
  profissional: ['pdv', 'mesas', 'caixa', 'produtos', 'relatorios', 'cozinha', 'cardapio-digital', 'estoque', 'clientes', 'fornecedores', 'delivery', 'pedidos-online', 'vendas', 'colaboradores'],
  gestao: ['pdv', 'mesas', 'caixa', 'produtos', 'relatorios', 'cozinha', 'cardapio-digital', 'estoque', 'clientes', 'fornecedores', 'delivery', 'pedidos-online', 'vendas', 'colaboradores', 'dashboard', 'intelligence', 'configuracoes', 'diario', 'seguranca', 'suporte', 'manual'],
};

export type PackId = 'delivery' | 'lanchonete' | 'bar' | 'autonomo';

export const packModules: Record<PackId, ModuleId[]> = {
  delivery: ['pdv', 'caixa', 'cardapio-digital', 'pedidos-online', 'delivery', 'dashboard'],
  lanchonete: ['pdv', 'caixa', 'cozinha', 'produtos', 'relatorios'],
  bar: ['mesas', 'pdv', 'caixa', 'clientes', 'vendas'],
  autonomo: ['pdv', 'caixa', 'produtos'],
};

export const packLabels: Record<PackId, string> = {
  delivery: 'Pack Delivery',
  lanchonete: 'Pack Lanchonete',
  bar: 'Pack Bar & Mesas',
  autonomo: 'Pack Autônomo',
};

export const packDescriptions: Record<PackId, string> = {
  delivery: 'PDV, Cardápio Digital, Pedidos Online, Delivery e Dashboard',
  lanchonete: 'PDV, KDS Cozinha, Cardápio e Financeiro',
  bar: 'Mesas, PDV, Clientes e Promoções',
  autonomo: 'PDV solo, Caixa e Cardápio básico',
};

export type AddonModuleId = 'cardapio-digital' | 'delivery' | 'intelligence' | 'dashboard' | 'estoque';

export const addonModules: AddonModuleId[] = ['cardapio-digital', 'delivery', 'intelligence', 'dashboard', 'estoque'];

export const planPricing: Record<Plano, number> = {
  essencial: 89,
  profissional: 189,
  gestao: 329,
};

export const planDescriptions: Record<Plano, string> = {
  essencial: 'Começa a organizar sua operação hoje',
  profissional: 'Controle total da operação',
  gestao: 'Inteligência para escalar',
};

export const packPricing: Record<PackId, number> = {
  delivery: 149,
  lanchonete: 109,
  bar: 119,
  autonomo: 69,
};

export const addonPricing: Record<AddonModuleId, number> = {
  'cardapio-digital': 29,
  delivery: 39,
  intelligence: 49,
  dashboard: 29,
  estoque: 25,
};

export const addonLabels: Record<AddonModuleId, string> = {
  'cardapio-digital': 'Cardápio Digital QR',
  delivery: 'Delivery + Motoboys',
  intelligence: 'Inteligência IA',
  dashboard: 'Dashboard Analytics',
  estoque: 'Estoque Avançado',
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
    'diario:write',
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
    'diario:write',
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
  intelligence: 'dashboard:read',
  pdv: 'pdv:write',
  mesas: 'mesas:write',
  delivery: 'delivery:write',
  'pedidos-online': 'produtos:write',
  'cardapio-digital': 'produtos:write',
  vendas: 'produtos:write',
  cozinha: 'cozinha:write',
  estoque: 'estoque:write',
  caixa: 'caixa:write',
  produtos: 'produtos:write',
  clientes: 'clientes:write',
  colaboradores: 'colaboradores:write',
  fornecedores: 'fornecedores:write',
  relatorios: 'relatorios:read',
  configuracoes: 'configuracoes:write',
  diario: 'diario:write',
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
  'deliveryOrders',
  'entregadores',
  'menuConfig',
  'promotions',
  'combos',
  'loyaltyConfig',
  'loyaltyEntries',
  'campaigns',
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

export const canAccessViaPackOrAddon = (
  enabledExtraModules: string[],
  role: UserRole,
  moduleId: ModuleId
): boolean =>
  enabledExtraModules.includes(moduleId) && hasRolePermission(role, modulePermissions[moduleId]);

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

export const ROLE_CODE_PREFIX: Record<UserRole, string> = {
  master: 'MST',
  gerente: 'GER',
  caixa: 'CXA',
  garcom: 'GAR',
  cozinha: 'COZ',
  estoque: 'EST',
  suporte: 'SUP',
};

export const generateCodigoInterno = (role: UserRole, sequence: number): string =>
  `${ROLE_CODE_PREFIX[role]}-${String(sequence).padStart(3, '0')}`;

