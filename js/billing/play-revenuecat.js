// Google Play Billing backend via RevenueCat (`@revenuecat/purchases-capacitor`, Capacitor 8). SKELETON — not loaded on
// the web and not yet tested on a device. Wire it up when the Capacitor app is created (docs/MONETIZATION.md §6):
//   npm i @revenuecat/purchases-capacitor && npx cap sync
//   hub.js: const backend = isNativeApp() ? createRevenueCatBackend({ apiKey: RC_PUBLIC_ANDROID_KEY }) : createWebStubBackend(...)
// Same interface as js/billing/web-stub.js: { id, isStub, init, getProducts, getOwned, purchase, restore }.
// RevenueCat validates the Play purchase server-side, acknowledges it, and tracks ownership per Google account, so the
// app needs no backend of its own. Entitlements in the RevenueCat dashboard: `silver` ← tier_silver;
// `gold` ← tier_gold, tier_gold_upgrade (upgrade only ever offered to Silver owners).
import { PRODUCTS } from '../entitlements.js';

const plugin = () => (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Purchases) || null;
export const isNativeApp = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

export function createRevenueCatBackend({ apiKey } = {}) {
  let P = null; let storeProducts = [];
  const ownedFrom = (info) => {
    const ci = info && (info.customerInfo || info);
    return (ci && ci.allPurchasedProductIdentifiers || []).filter((id) => PRODUCTS[id]);
  };
  return {
    id: 'play-revenuecat', isStub: false,
    async init() {
      P = plugin(); if (!P) throw new Error('RevenueCat plugin not installed');
      await P.configure({ apiKey });
    },
    async getProducts() {
      // NON_SUBSCRIPTION = one-time (non-consumable) Play products. priceString is localized by Google Play.
      const r = await P.getProducts({ productIdentifiers: Object.keys(PRODUCTS), type: 'NON_SUBSCRIPTION' });
      storeProducts = r.products || [];
      return storeProducts.map((p) => ({ id: p.identifier, price: p.priceString, currency: p.currencyCode }));
    },
    async getOwned() { return ownedFrom(await P.getCustomerInfo()); },
    async purchase(pid) {
      const product = storeProducts.find((p) => p.identifier === pid);
      if (!product) return { ok: false, error: 'product-not-loaded', owned: await this.getOwned() };
      try { const r = await P.purchaseStoreProduct({ product }); return { ok: true, owned: ownedFrom(r) }; }
      catch (e) { return { ok: false, cancelled: !!(e && (e.userCancelled || e.code === '1')), error: String(e && e.message || e), owned: await this.getOwned() }; }
    },
    async restore() { return { owned: ownedFrom(await P.restorePurchases()) }; },
  };
}
