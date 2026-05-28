import assert from 'node:assert/strict';
import { AppNotification } from '../types';
import {
  addLocalNotification,
  getCachedFeed,
  getReadIds,
  getUnread,
  markAllRead,
  markAsRead,
} from './notificationService';

class StorageMock {
  private data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) || null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
  clear() { this.data.clear(); }
}

Object.defineProperty(globalThis, 'sessionStorage', { value: new StorageMock(), configurable: true });
Object.defineProperty(globalThis, 'localStorage', { value: new StorageMock(), configurable: true });
Object.defineProperty(globalThis, 'window', { value: { dispatchEvent: () => undefined }, configurable: true });
Object.defineProperty(globalThis, 'CustomEvent', { value: class { constructor(public type: string) {} }, configurable: true });

const now = new Date();
const notification = (id: string, plan?: AppNotification['targetPlans'], expiresAt?: string): AppNotification => ({
  id,
  type: 'info',
  title: `Aviso ${id}`,
  body: 'Corpo',
  publishedAt: now.toISOString(),
  targetPlans: plan,
  expiresAt,
});

sessionStorage.setItem('gestao-gastro:notifications:cache', JSON.stringify({
  data: [
    notification('global'),
    notification('gestao-only', ['gestao']),
    notification('expired', undefined, new Date(now.getTime() - 1000).toISOString()),
  ],
  fetchedAt: Date.now(),
}));

assert.equal(getCachedFeed().length, 3);

let unread = getUnread('empresa-a', 'essencial');
assert.deepEqual(unread.map(item => item.id), ['global']);

markAsRead('global', 'empresa-a');
assert.deepEqual([...getReadIds('empresa-a')], ['global']);
assert.equal(getUnread('empresa-a', 'essencial').length, 0);

addLocalNotification({
  id: 'sales-upgrade',
  type: 'sales',
  title: 'Upgrade',
  body: 'Disponivel no plano gestao.',
  publishedAt: now.toISOString(),
  targetPlans: ['essencial'],
}, 'empresa-a');

unread = getUnread('empresa-a', 'essencial');
assert.deepEqual(unread.map(item => item.id), ['sales-upgrade']);

markAllRead('empresa-a');
assert.equal(getUnread('empresa-a', 'essencial').length, 0);

console.log('notification service tests passed');
