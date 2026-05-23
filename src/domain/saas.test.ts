import assert from 'node:assert/strict';
import {
  DEFAULT_EMPRESA_ID,
  buildScopedStorageKey,
  canAccessModule,
  ensureEmpresaId,
  getPlanModules,
  hasForeignEmpresaId,
  migrateLegacyCollection,
  normalizeImportedCollection,
} from './saas';
import { Product, Table } from '../types';

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

console.log('saas domain tests passed');
