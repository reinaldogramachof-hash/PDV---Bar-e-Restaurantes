import assert from 'node:assert/strict';
import { Product } from '../types';
import { getMenuProducts, getMenuUrl } from './menuDigitalService';

Object.defineProperty(globalThis, 'window', {
  value: { location: { origin: 'http://localhost:3000' } },
  configurable: true,
});

const products = [
  {
    id: 'p1',
    empresaId: 'empresa-a',
    name: 'Burger',
    description: 'Blend',
    price: 38,
    category: 'Lanches',
    menuDigital: { visible: true },
  },
  {
    id: 'p2',
    empresaId: 'empresa-a',
    name: 'Suco',
    description: 'Natural',
    price: 12,
    category: 'Bebidas',
    menuDigital: { visible: true },
    active: false,
  },
  {
    id: 'p3',
    empresaId: 'empresa-a',
    name: 'Batata',
    description: 'Rustica',
    price: 24,
    category: 'Lanches',
    menuDigital: { visible: false },
  },
  {
    id: 'p4',
    empresaId: 'empresa-a',
    name: 'Agua',
    description: 'Sem gas',
    price: 5,
    category: '', // sem categoria
    menuDigital: { visible: true },
  },
] as Product[];

const combos = [
  {
    id: 'c1',
    empresaId: 'empresa-a',
    name: 'Combo Burger',
    description: 'Burger + Suco',
    comboPrice: 45,
    active: true,
    menuDigital: { visible: true },
    items: [],
  },
] as any[]; // using any for simplicity since we don't need full combo in tests

assert.equal(getMenuUrl('empresa-a'), 'http://localhost:3000/cardapio/empresa-a');

const grouped = getMenuProducts(products);
assert.deepEqual(Object.keys(grouped).sort(), ['Lanches', 'Outros'].sort());
assert.deepEqual(grouped.Lanches.map(product => product.name), ['Burger']);
assert.deepEqual(grouped.Outros.map(product => product.name), ['Agua']);

const groupedWithCombos = getMenuProducts(products, combos);
assert.ok(groupedWithCombos['Combos'], 'Should group combos in Combos category');
assert.equal(groupedWithCombos['Combos'][0].name, 'Combo Burger');

console.log('menu digital service tests passed');
