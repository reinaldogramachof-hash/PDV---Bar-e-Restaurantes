import assert from 'node:assert/strict';
import {
  allocateComboItems,
  calcComboOriginalPrice,
  calcComboSaving,
  calcEarnedPoints,
  getActiveCampaigns,
  getActivePromotions,
  getCustomerPoints,
  getProductDiscount,
} from './salesService';
import { Campaign, Combo, LoyaltyConfig, LoyaltyEntry, Product, Promotion } from '../types';

const now = new Date();
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

const product: Product = {
  id: 'p1',
  empresaId: 'demo',
  name: 'Burger',
  description: 'Burger teste',
  price: 40,
  category: 'Lanches',
};

const promotions: Promotion[] = [
  {
    id: 'promo-10',
    empresaId: 'demo',
    name: '10% Burger',
    type: 'percent',
    value: 10,
    productIds: ['p1'],
    categoryIds: [],
    startsAt: yesterday,
    endsAt: tomorrow,
    active: true,
    createdAt: yesterday,
  },
  {
    id: 'promo-future',
    empresaId: 'demo',
    name: 'Futura',
    type: 'fixed',
    value: 8,
    productIds: [],
    categoryIds: [],
    startsAt: nextWeek,
    endsAt: nextWeek,
    active: true,
    createdAt: yesterday,
  },
  {
    id: 'promo-off',
    empresaId: 'demo',
    name: 'Pausada',
    type: 'fixed',
    value: 5,
    productIds: [],
    categoryIds: [],
    startsAt: yesterday,
    endsAt: tomorrow,
    active: false,
    createdAt: yesterday,
  },
];

assert.deepEqual(getActivePromotions(promotions).map(p => p.id), ['promo-10']);

const campaigns: Campaign[] = [
  {
    id: 'campaign-now',
    empresaId: 'demo',
    name: 'Happy Hour',
    promotionId: 'promo-10',
    daysOfWeek: [now.getDay()],
    startsHour: now.getHours(),
    endsHour: now.getHours() + 1,
    active: true,
    createdAt: yesterday,
  },
  {
    id: 'campaign-off',
    empresaId: 'demo',
    name: 'Fora',
    promotionId: 'promo-10',
    daysOfWeek: [(now.getDay() + 1) % 7],
    startsHour: now.getHours(),
    endsHour: now.getHours() + 1,
    active: true,
    createdAt: yesterday,
  },
];

assert.deepEqual(getActiveCampaigns(campaigns, promotions).map(c => c.id), ['campaign-now']);
assert.deepEqual(getProductDiscount(product, promotions, campaigns), { discount: 4, promotionName: '10% Burger' });

const entries: LoyaltyEntry[] = [
  { id: 'l1', empresaId: 'demo', customerId: 'c1', points: 50, description: 'Pedido', createdAt: yesterday },
  { id: 'l2', empresaId: 'demo', customerId: 'c1', points: -20, description: 'Resgate', createdAt: yesterday },
  { id: 'l3', empresaId: 'demo', customerId: 'c2', points: 99, description: 'Pedido', createdAt: yesterday },
];
const loyaltyConfig: LoyaltyConfig = {
  empresaId: 'demo',
  active: true,
  pointsPerReal: 2,
  redeemThreshold: 100,
  redeemValue: 10,
};

assert.equal(getCustomerPoints('c1', entries), 30);
assert.equal(calcEarnedPoints(45.9, loyaltyConfig), 91);
assert.equal(calcEarnedPoints(45.9, { ...loyaltyConfig, active: false }), 0);

const combo: Combo = {
  id: 'combo-1',
  empresaId: 'demo',
  name: 'Combo Burger',
  items: [{ productId: 'p1', qty: 2 }],
  originalPrice: 80,
  comboPrice: 68,
  active: true,
  createdAt: yesterday,
};

assert.equal(calcComboOriginalPrice(combo, [product]), 80);
assert.equal(calcComboSaving(combo, [product]), 15);

const fries: Product = {
  id: 'p2',
  empresaId: 'demo',
  name: 'Fries',
  description: 'Porcao',
  price: 20,
  category: 'Petiscos',
};

assert.deepEqual(
  allocateComboItems(
    {
      id: combo.id,
      name: combo.name,
      comboPrice: 68,
      items: [
        { productId: product.id, qty: 1 },
        { productId: fries.id, qty: 2 },
      ],
    },
    [product, fries]
  ),
  [
    {
      product,
      quantity: 1,
      unitPrice: 34,
      originalPrice: 40,
      discount: 6,
      promotionName: 'Combo: Combo Burger',
      comboId: 'combo-1',
    },
    {
      product: fries,
      quantity: 2,
      unitPrice: 17,
      originalPrice: 20,
      discount: 3,
      promotionName: 'Combo: Combo Burger',
      comboId: 'combo-1',
    },
  ]
);

console.log('salesService tests passed');
