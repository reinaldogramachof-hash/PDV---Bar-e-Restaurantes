import assert from 'node:assert/strict';
import {
  DEFAULT_EMPRESA_ID,
  buildScopedStorageKey,
  canAccessModule,
  ensureEmpresaId,
  getPlanModules,
  hasForeignEmpresaId,
  getSessionScopedExpenses,
  migrateLegacyCollection,
  normalizeImportedCollection,
  validateImportEmpresaId,
} from './saas';
import { Expense, Product, Table } from '../types';
import { parseLicensePayload } from '../services/licenseService';

const scopedKey = buildScopedStorageKey('products', 'empresa-alpha');
assert.equal(scopedKey, 'gestao-gastro:empresa-alpha:products');

assert.deepEqual(getPlanModules('essencial'), ['pdv', 'mesas', 'caixa', 'produtos', 'relatorios']);
assert.ok(canAccessModule('profissional', 'gerente', 'cozinha'));
assert.ok(!canAccessModule('essencial', 'garcom', 'estoque'));
assert.ok(canAccessModule('gestao', 'master', 'colaboradores'));

const legacyProducts = [
  { id: 'p1', name: 'Produto legado', description: '', price: 10, category: 'Teste' },
] as Product[];
const migratedProducts = migrateLegacyCollection(legacyProducts, 'empresa-alpha');
assert.equal(migratedProducts[0].empresaId, 'empresa-alpha');

const existingProduct = {
  id: 'p2',
  empresaId: 'empresa-beta',
  name: 'Produto existente',
  description: '',
  price: 12,
  category: 'Teste',
} as Product;
assert.equal(ensureEmpresaId(existingProduct, 'empresa-alpha').empresaId, 'empresa-beta');

const legacyTables = [{ number: 1, status: 'livre' }] as Table[];
assert.equal(migrateLegacyCollection(legacyTables, DEFAULT_EMPRESA_ID)[0].empresaId, DEFAULT_EMPRESA_ID);

const mixedImport = [
  { id: 'p3', name: 'Sem empresa', description: '', price: 8, category: 'Teste' },
  { id: 'p4', empresaId: 'empresa-alpha', name: 'Mesma empresa', description: '', price: 9, category: 'Teste' },
  { id: 'p5', empresaId: 'empresa-beta', name: 'Outra empresa', description: '', price: 11, category: 'Teste' },
] as Product[];
const normalizedImport = normalizeImportedCollection(mixedImport, 'empresa-alpha');
assert.equal(normalizedImport.length, 2);
assert.ok(normalizedImport.every(item => item.empresaId === 'empresa-alpha'));
assert.ok(hasForeignEmpresaId(mixedImport, 'empresa-alpha'));
assert.ok(!hasForeignEmpresaId(normalizedImport, 'empresa-alpha'));

const empresaAKey = buildScopedStorageKey('orders', 'empresa-a');
const empresaBKey = buildScopedStorageKey('orders', 'empresa-b');
assert.notEqual(empresaAKey, empresaBKey);

const empresaAProducts = [{ id: 'pa', empresaId: 'empresa-a', name: 'Produto A', description: '', price: 15, category: 'Teste' }] as Product[];
const empresaBImportView = normalizeImportedCollection(empresaAProducts, 'empresa-b');
assert.equal(empresaBImportView.length, 0);

assert.doesNotThrow(() =>
  validateImportEmpresaId(
    {
      empresaId: 'empresa-a',
      products: empresaAProducts,
      settings: { empresaId: 'empresa-a' },
    },
    'empresa-a',
  ),
);

assert.throws(
  () =>
    validateImportEmpresaId(
      {
        empresaId: 'empresa-a',
        products: empresaAProducts,
        settings: { empresaId: 'empresa-a' },
      },
      'empresa-b',
    ),
  /Backup pertence a outra empresa/,
);

const expenses = [
  { id: 'old', empresaId: 'empresa-a', description: 'Antes', amount: 10, category: 'Outros', status: 'pago', timestamp: '2026-05-23T08:59:00.000Z' },
  { id: 'current', empresaId: 'empresa-a', description: 'Sessao', amount: 20, category: 'Outros', status: 'pago', timestamp: '2026-05-23T09:00:00.000Z' },
  { id: 'foreign', empresaId: 'empresa-b', description: 'Outra empresa', amount: 30, category: 'Outros', status: 'pago', timestamp: '2026-05-23T09:30:00.000Z' },
] as Expense[];
const sessionExpenses = getSessionScopedExpenses(expenses, '2026-05-23T09:00:00.000Z', 'empresa-a');
assert.deepEqual(sessionExpenses.map(expense => expense.id), ['current']);

const parsedJsonLicense = parseLicensePayload(
  JSON.stringify({ status: 'trial', expiresAt: '2026-06-02T00:00:00.000Z', plan: 'profissional' }),
  new Date('2026-05-23T00:00:00.000Z'),
);
assert.equal(parsedJsonLicense.status, 'trial');
assert.equal(parsedJsonLicense.daysRemaining, 10);
assert.equal(parsedJsonLicense.plan, 'profissional');

const blockedLicense = parseLicensePayload('BLOQUEADO', new Date('2026-05-23T00:00:00.000Z'));
assert.equal(blockedLicense.status, 'suspended');
assert.equal(blockedLicense.daysRemaining, 0);

// Teste de Isolamento Explícito (Feature 7)
const mixedProducts = [
  { id: 'p_emp1', empresaId: 'empresa1', name: 'Prod 1', description: '', price: 10, category: 'A' },
  { id: 'p_emp2', empresaId: 'empresa2', name: 'Prod 2', description: '', price: 20, category: 'B' }
] as Product[];
const isolatedEmpresa1 = normalizeImportedCollection(mixedProducts, 'empresa1');
const isolatedEmpresa2 = normalizeImportedCollection(mixedProducts, 'empresa2');

assert.equal(isolatedEmpresa1.length, 1);
assert.equal(isolatedEmpresa1[0].id, 'p_emp1');
assert.equal(isolatedEmpresa2.length, 1);
assert.equal(isolatedEmpresa2[0].id, 'p_emp2');

const testExpenses = [
  { id: 'e1', empresaId: 'empresa1', description: 'Despesa 1', amount: 10, category: 'Outros', status: 'pago', timestamp: '2026-05-23T09:00:00.000Z' },
  { id: 'e2', empresaId: 'empresa2', description: 'Despesa 2', amount: 10, category: 'Outros', status: 'pago', timestamp: '2026-05-23T09:00:00.000Z' }
] as Expense[];

const isolatedExpensesEmpresa1 = getSessionScopedExpenses(testExpenses, '2026-05-23T08:00:00.000Z', 'empresa1');
assert.equal(isolatedExpensesEmpresa1.length, 1);
assert.equal(isolatedExpensesEmpresa1[0].id, 'e1');

console.log('saas domain tests passed');
