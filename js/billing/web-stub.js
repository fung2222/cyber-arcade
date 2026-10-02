// DEV / STUB billing backend for the web prototype. NO REAL PAYMENTS. Stores "owned" products in localStorage to
// simulate the player's Google Play account, so Restore Purchases can be demonstrated after wiping the local cache.
// Replace with js/billing/play-revenuecat.js in the Capacitor app build (see docs/MONETIZATION.md §6).
import { PRODUCTS } from '../entitlements.js';

export const STUB_KEY = 'cyber.arcade.devstub.owned';

export function createWebStubBackend({ confirm = async () => true, storage } = {}) {
  const store = storage || localStorage;
  const owned = () => { try { return JSON.parse(store.getItem(STUB_KEY) || '[]'); } catch { return []; } };
  const save = (list) => store.setItem(STUB_KEY, JSON.stringify([...new Set(list)].sort()));
  return {
    id: 'web-stub', isStub: true,
    async init() {},
    async getProducts() { return Object.values(PRODUCTS).map((p) => ({ id: p.id, price: p.basePrice, currency: 'HKD' })); },
    async getOwned() { return owned(); },
    async purchase(pid) {
      const ok = await confirm(pid);                       // UI shows a clearly-labelled simulated payment sheet
      if (!ok) return { ok: false, cancelled: true, owned: owned() };
      save([...owned(), pid]); return { ok: true, owned: owned() };
    },
    async restore() { return { owned: owned() }; },
    devReset() { store.removeItem(STUB_KEY); },
  };
}
