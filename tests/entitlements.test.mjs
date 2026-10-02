// node --test tests/   — unit tests for js/entitlements.js + the web stub backend (no browser needed)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createEntitlements, tierFromProducts, availableProducts, ENT_KEY } from '../js/entitlements.js';
import { createWebStubBackend } from '../js/billing/web-stub.js';

const games = JSON.parse(readFileSync(new URL('../games.json', import.meta.url))).games;
const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m }; };
let clock = new Date(2026, 9, 2, 23, 50);
const now = () => clock;
async function make({ storage = mem(), confirm = async () => true } = {}) {
  const backend = createWebStubBackend({ confirm, storage });
  const ent = createEntitlements({ games, backend, storage, now });
  await ent.init();
  return { ent, backend, storage };
}

test('games.json: every game has a valid tier; paid games have a trial', () => {
  for (const g of games) {
    assert.ok(['free', 'silver', 'gold'].includes(g.tier), g.id);
    if (g.tier !== 'free') assert.ok(g.trial && g.trial.runsPerDay > 0 && g.trial.rule.zh && g.trial.rule.en, g.id);
  }
});

test('tierFromProducts', () => {
  assert.equal(tierFromProducts([]), 'free');
  assert.equal(tierFromProducts(['tier_silver']), 'silver');
  assert.equal(tierFromProducts(['tier_gold']), 'gold');
  assert.equal(tierFromProducts(['tier_silver', 'tier_gold_upgrade']), 'gold');
  assert.equal(tierFromProducts(['tier_gold_upgrade']), 'silver');   // impossible edge case → generous fallback
});

test('availableProducts', () => {
  assert.deepEqual(availableProducts('free'), ['tier_silver', 'tier_gold']);
  assert.deepEqual(availableProducts('silver'), ['tier_gold_upgrade']);
  assert.deepEqual(availableProducts('gold'), []);
});

test('free tier: access, ads, trials + midnight reset', async () => {
  clock = new Date(2026, 9, 2, 23, 50);
  const { ent, storage } = await make();
  assert.equal(ent.getTier(), 'free');
  assert.equal(ent.adsEnabled(), true);
  assert.equal(ent.rewardedAdsEnabled(), true);
  assert.equal(ent.hasAccess('cyber-snake'), true);
  assert.equal(ent.hasAccess('neon-stick-duel'), false);
  assert.equal(ent.hasAccess('cyber-board'), false);
  assert.equal(ent.trialRemaining('cyber-snake'), Infinity);
  assert.equal(ent.trialRemaining('neon-stick-duel'), 3);
  assert.equal(ent.consumeTrial('neon-stick-duel'), 2);
  assert.equal(ent.consumeTrial('neon-stick-duel'), 1);
  assert.equal(ent.consumeTrial('neon-stick-duel'), 0);
  assert.equal(ent.consumeTrial('neon-stick-duel'), -1);
  assert.equal(ent.trialRemaining('neon-stick-duel'), 0);
  assert.equal(ent.trialRemaining('cyber-ninja'), 3, 'trials are per game');
  assert.match(ent.launchParams('neon-stick-duel', { trial: true, trialLeft: 0 }), /hub=1&tier=free&ads=1&trial=1&trialLeft=0/);
  assert.equal(JSON.parse(storage.getItem(ENT_KEY)).tier, 'free');
  clock = new Date(2026, 9, 3, 0, 1);                       // local midnight passed
  assert.equal(ent.trialRemaining('neon-stick-duel'), 3);
});

test('purchase silver → upgrade → gold; cancel; not-available', async () => {
  let answer = false;
  const { ent, storage } = await make({ confirm: async () => answer });
  assert.equal((await ent.purchase('tier_gold_upgrade')).error, 'not-available');
  const c = await ent.purchase('tier_silver');
  assert.equal(c.ok, false); assert.equal(c.cancelled, true); assert.equal(ent.getTier(), 'free');
  answer = true;
  const s = await ent.purchase('tier_silver');
  assert.equal(s.ok, true); assert.equal(s.tier, 'silver');
  assert.equal(ent.hasAccess('neon-stick-duel'), true);
  assert.equal(ent.hasAccess('cyber-board'), false);
  assert.equal(ent.adsEnabled(), false);
  assert.deepEqual(ent.available(), ['tier_gold_upgrade']);
  assert.equal(ent.price('tier_gold_upgrade'), 'HK$10');
  assert.equal(JSON.parse(storage.getItem(ENT_KEY)).tier, 'silver');
  assert.equal((await ent.purchase('tier_silver')).error, 'not-available');
  const g = await ent.purchase('tier_gold_upgrade');
  assert.equal(g.tier, 'gold');
  assert.equal(ent.hasAccess('cyber-board'), true);
  assert.deepEqual(ent.available(), []);
  assert.match(ent.launchParams('cyber-board'), /^hub=1&tier=gold&ads=0$/);
});

test('restore after cache wipe (simulated reinstall)', async () => {
  const storage = mem();
  const a = await make({ storage });
  await a.ent.purchase('tier_gold');
  a.ent.devWipeCache();
  assert.equal(a.ent.getTier(), 'free');
  assert.equal(storage.getItem(ENT_KEY), null);
  const r = await a.ent.restore();
  assert.equal(r.ok, true); assert.equal(r.tier, 'gold');
  const b = await make({ storage });                         // fresh app start also re-queries the store
  assert.equal(b.ent.getTier(), 'gold');
});

test('onChange fires on tier change', async () => {
  const { ent } = await make();
  const seen = []; ent.onChange((tier) => seen.push(tier));
  await ent.purchase('tier_silver');
  assert.ok(seen.includes('silver'));
});
