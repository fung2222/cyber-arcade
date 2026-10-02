// CYBER ARCADE entitlements — tiers, access, daily trials, ads flag. UI-free and backend-agnostic (unit-tested in tests/).
//
//   const ent = createEntitlements({ games, backend });   // backend: web stub (DEV) now, Play Billing later
//   await ent.init();
//   ent.getTier()             → 'free' | 'silver' | 'gold'
//   ent.hasAccess(gameId)     → true if the player's tier ≥ the game's tier
//   ent.trialRemaining(id)    → Infinity when unlocked, else trial runs left today (0 = exhausted)
//   ent.consumeTrial(id)      → uses one trial run; returns runs left (or -1 if none left)
//   await ent.purchase(pid)   → { ok, tier, cancelled?, error? }   pid: tier_silver | tier_gold | tier_gold_upgrade
//   await ent.restore()       → { ok, tier, products }
//   ent.adsEnabled()          → true only on Free (interstitials at natural breaks); rewarded ads are always opt-in
//
// Shared contract with the games (same origin in the Capacitor WebView and on github.io):
//   localStorage 'cyber.entitlement' = { v:1, tier, products:[…], source, stub, updated }   (written on every change)
//   launch URL params  ?hub=1&tier=<tier>&ads=0|1[&trial=1&trialLeft=N]
// Games may read either to skip interstitials or apply in-game trial caps. Never trust them for anything valuable
// on the open web — the web build is a free demo; real gating happens in the app build with Play Billing.

export const TIERS = ['free', 'silver', 'gold'];
export const RANK = { free: 0, silver: 1, gold: 2 };
export const PRODUCTS = {
  tier_silver: { id: 'tier_silver', grants: 'silver', basePrice: 'HK$18' },
  tier_gold: { id: 'tier_gold', grants: 'gold', basePrice: 'HK$28' },
  tier_gold_upgrade: { id: 'tier_gold_upgrade', grants: 'gold', basePrice: 'HK$10', requires: 'tier_silver' },
};
export const ENT_KEY = 'cyber.entitlement';
export const TRIAL_KEY = 'cyber.arcade.trial';
export const DEFAULT_TRIAL_RUNS = 3;

/** Highest tier implied by a set of owned Play product ids. */
export function tierFromProducts(products = []) {
  const s = new Set(products);
  if (s.has('tier_gold') || (s.has('tier_silver') && s.has('tier_gold_upgrade'))) return 'gold';
  // An upgrade bought without Silver should be impossible (the UI never offers it); grant Silver as a safe, generous fallback.
  if (s.has('tier_silver') || s.has('tier_gold_upgrade')) return 'silver';
  return 'free';
}

/** Products the player can buy right now (Silver owners only see the upgrade; Gold owners see nothing). */
export function availableProducts(tier) {
  if (tier === 'gold') return [];
  if (tier === 'silver') return ['tier_gold_upgrade'];
  return ['tier_silver', 'tier_gold'];
}

const localDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function memoryStorage() { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; }

export function createEntitlements({ games = [], backend, storage, now = () => new Date() } = {}) {
  const store = storage || (typeof localStorage !== 'undefined' ? localStorage : memoryStorage());
  const read = (k) => { try { return JSON.parse(store.getItem(k) || 'null'); } catch { return null; } };
  const write = (k, v) => { try { store.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } };
  const byId = new Map(games.map((g) => [g.id, g]));
  const subs = new Set();
  let products = (read(ENT_KEY) || {}).products || [];
  let catalog = Object.values(PRODUCTS).map((p) => ({ id: p.id, price: p.basePrice }));

  const tier = () => tierFromProducts(products);
  function persist() {
    write(ENT_KEY, { v: 1, tier: tier(), products: [...products], source: backend ? backend.id : 'none', stub: !!(backend && backend.isStub), updated: now().toISOString() });
    subs.forEach((fn) => { try { fn(tier()); } catch (e) { console.warn(e); } });
  }
  function setProducts(list) { products = [...new Set(list.filter((p) => PRODUCTS[p]))].sort(); persist(); }

  function trialState() {
    const day = localDay(now()); const s = read(TRIAL_KEY);
    return s && s.day === day ? s : { day, used: {} };   // counters reset at local midnight
  }
  const gameTier = (id) => (byId.get(id) || {}).tier || 'free';
  const trialRuns = (id) => ((byId.get(id) || {}).trial || {}).runsPerDay ?? DEFAULT_TRIAL_RUNS;

  const api = {
    get backend() { return backend; },
    async init() {
      if (backend) {
        await backend.init();
        try { catalog = await backend.getProducts(); } catch (e) { console.warn('[ent] products', e); }
        try { setProducts(await backend.getOwned()); } catch (e) { console.warn('[ent] owned (using cache)', e); persist(); }
      } else persist();
      return tier();
    },
    getTier: tier,
    ownedProducts: () => [...products],
    gameTier,
    hasAccess: (id) => RANK[tier()] >= RANK[gameTier(id)],
    trialRuns,
    trialRemaining(id) {
      if (api.hasAccess(id)) return Infinity;
      return Math.max(0, trialRuns(id) - (trialState().used[id] || 0));
    },
    consumeTrial(id) {
      if (api.hasAccess(id)) return Infinity;
      const s = trialState(); const left = trialRuns(id) - (s.used[id] || 0);
      if (left <= 0) return -1;
      s.used[id] = (s.used[id] || 0) + 1; write(TRIAL_KEY, s); return left - 1;
    },
    adsEnabled: () => tier() === 'free',          // forced/interstitial ads only on Free
    rewardedAdsEnabled: () => true,               // opt-in rewarded ads (continue / undo / peek) stay on every tier
    available: () => availableProducts(tier()),
    price: (pid) => (catalog.find((p) => p.id === pid) || {}).price || (PRODUCTS[pid] || {}).basePrice,
    async purchase(pid) {
      if (!PRODUCTS[pid]) return { ok: false, tier: tier(), error: 'unknown-product' };
      if (!api.available().includes(pid)) return { ok: false, tier: tier(), error: 'not-available' };
      const r = await backend.purchase(pid);
      if (r && r.owned) setProducts(r.owned);
      return { ok: !!(r && r.ok), cancelled: !!(r && r.cancelled), error: r && r.error, tier: tier() };
    },
    async restore() {
      try { const r = await backend.restore(); setProducts(r.owned || []); return { ok: true, tier: tier(), products: [...products] }; }
      catch (e) { return { ok: false, tier: tier(), products: [...products], error: String(e && e.message || e) }; }
    },
    onChange(fn) { subs.add(fn); return () => subs.delete(fn); },
    /** URL params for launching a game from the hub */
    launchParams(id, { trial = false, trialLeft = 0 } = {}) {
      const p = new URLSearchParams({ hub: '1', tier: tier(), ads: api.adsEnabled() ? '1' : '0' });
      if (trial) { p.set('trial', '1'); p.set('trialLeft', String(trialLeft)); }
      return p.toString();
    },
    // ---- DEV helpers (used by the hidden dev panel and tests; harmless in production) ----
    devResetTrials() { try { store.removeItem(TRIAL_KEY); } catch { /* */ } },
    devWipeCache() { products = []; try { store.removeItem(ENT_KEY); } catch { /* */ } subs.forEach((fn) => fn(tier())); },
  };
  return api;
}
