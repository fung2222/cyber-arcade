// CYBER ARCADE hub — game list with tier badges, trials, store/unlock sheet, restore, hidden DEV panel.
import { i18n, t } from '../vendor/cyber-kit/core/i18n.js';
import './strings.js';
import { createEntitlements, RANK } from './entitlements.js';
import { createWebStubBackend } from './billing/web-stub.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const params = new URLSearchParams(location.search);
const NO_NAV = params.get('nonav') === '1';          // tests: record launches instead of leaving the page
const L = () => (i18n.isZh() ? 'zh' : 'en');
const tierName = (tier) => t('tier.' + tier);
let games = [], ent = null, storeReason = null;

// ---------------------------------------------------------------- modal helpers
function openSheet(html, { small = false, layer = 'modal' } = {}) {
  let m = $(layer);
  if (!m) { m = document.createElement('div'); m.id = layer; m.className = 'modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.style.zIndex = 25; m.innerHTML = '<div class="sheet"></div>'; document.body.appendChild(m); }
  const sheet = m.querySelector('.sheet'); sheet.className = 'sheet' + (small ? ' small' : ''); sheet.innerHTML = html;
  m.classList.remove('hidden'); document.body.classList.add('modal-open');
  m.onclick = (e) => { if (e.target === m) closeSheet(layer); };
  return sheet;
}
function closeSheet(layer = 'modal') {
  const m = $(layer); if (m) m.classList.add('hidden');
  if (layer === 'modal') storeReason = null;
  if (![...document.querySelectorAll('.modal')].some((x) => !x.classList.contains('hidden'))) document.body.classList.remove('modal-open');
}
let toastT = 0;
function toast(msg, ms = 2400) { const el = $('toast'); el.textContent = msg; el.classList.remove('hidden'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.add('hidden'), ms); }
const storeOpen = () => !$('modal').classList.contains('hidden') && $('modal').dataset.kind === 'store';

// stub payment sheet — clearly labelled simulation (second modal layer above the store)
function stubConfirm(pid) {
  return new Promise((resolve) => {
    const s = openSheet(`<h2>${esc(t('stubTitle'))}</h2><span class="stub-tag">${esc(t('stubTag'))}</span>
      <p style="text-align:center;margin-top:16px"><b>${esc(t('prod.' + pid))}</b> · <b class="price">${esc(ent.price(pid))}</b></p>
      <p class="fine" style="text-align:center">${esc(t('stubBody'))}</p>
      <div class="row"><button class="ghost" id="stub-no">${esc(t('cancel'))}</button><button id="stub-yes">${esc(t('stubConfirm'))}</button></div>`, { small: true, layer: 'modal2' });
    s.querySelector('#stub-yes').onclick = () => { closeSheet('modal2'); resolve(true); };
    s.querySelector('#stub-no').onclick = () => { closeSheet('modal2'); resolve(false); };
  });
}

// ---------------------------------------------------------------- store / unlock sheet
function gamesOf(tier) { return games.filter((g) => g.tier === tier).map((g) => g.name[L()]).join(' · ') || '—'; }
function tierCol(tier) {
  const cur = ent.getTier(), owned = RANK[cur] >= RANK[tier], isCur = cur === tier;
  const feats = {
    free: ['feat.freeGames', 'feat.trial', 'feat.adsNatural', 'feat.rewarded'],
    silver: ['feat.silverGames', 'feat.noForced', 'feat.rewarded', '*feat.silverFuture'],
    gold: ['feat.goldAll', 'feat.goldGames', 'feat.noForced', '*feat.goldFuture'],
  }[tier];
  const li = feats.map((k) => k[0] === '*' ? `<li class="future">${esc(t(k.slice(1)))}</li>` : `<li>${esc(t(k))}</li>`).join('');
  let price = '', btn = '', note = '';
  if (tier === 'silver') price = ent.price('tier_silver');
  if (tier === 'gold') price = ent.price('tier_gold');
  if (tier === 'free') btn = `<button disabled>${esc(isCur ? t('current') : t('included'))}</button>`;
  else if (owned) btn = `<button disabled>${esc(isCur ? t('owned') : t('included'))}</button>`;
  else if (tier === 'gold' && cur === 'silver') {
    const up = ent.price('tier_gold_upgrade');
    note = `<p class="upnote">${esc(t('upgradeNote', { price: up }))}</p>`;
    btn = `<button data-buy="tier_gold_upgrade">${esc(t('upgrade', { price: up }))}</button>`;
    price = `<s style="opacity:.5;font-size:14px">${esc(price)}</s> ${esc(up)}`;
  } else btn = `<button data-buy="tier_${tier}">${esc(t('buy', { price }))}</button>`;
  const priceHtml = tier === 'free' ? 'HK$0' : (price.startsWith('<s') ? price : esc(price));
  return `<section class="tier ${tier}${isCur ? ' cur' : ''}" data-tier="${tier}">
    <div class="tier-h"><b>${esc(tierName(tier))}</b><span class="price">${priceHtml}</span></div>
    <div class="games">${esc(t('includes'))}: ${esc(tier === 'gold' ? gamesOf('silver') + ' · ' + gamesOf('gold') : gamesOf(tier))}</div>
    <ul>${li}</ul>${note}${btn}</section>`;
}
function renderStore() {
  const s = openSheet(`<h2>${esc(t('storeTitle'))}</h2><div class="s-sub">${esc(t('storeSub'))}</div>
    ${ent.backend.isStub ? `<span class="stub-tag">${esc(t('stubTag'))}</span>` : ''}
    ${storeReason ? `<div class="reason">${esc(storeReason)}</div>` : ''}
    <div class="tiers">${['free', 'silver', 'gold'].map(tierCol).join('')}</div>
    <div class="restore"><button id="btn-restore">${esc(t('restore'))}</button></div>
    <p class="fine">${esc(t('fine'))}</p>
    <div class="row"><button class="ghost" id="store-close">${esc(t('close'))}</button></div>`);
  $('modal').dataset.kind = 'store';
  s.querySelectorAll('[data-buy]').forEach((b) => { b.onclick = () => buy(b.dataset.buy); });
  s.querySelector('#btn-restore').onclick = restore;
  s.querySelector('#store-close').onclick = () => closeSheet();
}
function openStore(reason = null) { storeReason = reason; renderStore(); }
async function buy(pid) {
  const r = await ent.purchase(pid);
  if (r.ok) toast(t('bought', { tier: tierName(r.tier) }));
  else if (r.cancelled) toast(t('buyCancelled'));
  else toast(t('buyFail', { err: r.error || '?' }));
  if (r.ok) storeReason = null;
  if (storeOpen()) renderStore();
}
async function restore() {
  const r = await ent.restore();
  toast(!r.ok ? t('restoreFail') : r.tier === 'free' ? t('restoreNone') : t('restored', { tier: tierName(r.tier) }));
  if (storeOpen()) renderStore();
}

// ---------------------------------------------------------------- trial flow + launch
function launch(g, opts = {}) {
  const url = g.url + (g.url.includes('?') ? '&' : '?') + ent.launchParams(g.id, opts);
  window.__hub.lastLaunch = { id: g.id, url, ...opts };
  if (NO_NAV) { toast(t('launching', { name: g.name[L()] })); return; }
  location.href = url;
}
function openTrial(g) {
  const max = ent.trialRuns(g.id), n = ent.trialRemaining(g.id), tn = tierName(g.tier);
  const rule = g.trial && g.trial.rule ? g.trial.rule[L()] : '';
  const s = openSheet(`<h2>${esc(t('trialTitle', { tier: tn }))}</h2>
    <p style="text-align:center">${esc(t('trialBody', { name: g.name[L()], tier: tn, max, n }))}</p>
    ${rule ? `<p class="fine" style="text-align:center">${esc(t('trialRule', { rule }))}</p>` : ''}
    <div class="row"><button class="ghost" id="tr-unlock">${esc(t('unlock'))}</button><button id="tr-start">${esc(t('startTrial'))}</button></div>`, { small: true });
  $('modal').dataset.kind = 'trial';
  s.querySelector('#tr-start').onclick = () => { const left = ent.consumeTrial(g.id); closeSheet(); render(); if (left >= 0) launch(g, { trial: true, trialLeft: left }); };
  s.querySelector('#tr-unlock').onclick = () => openStore();
}
function onPlay(id) {
  const g = games.find((x) => x.id === id); if (!g) return;
  if (ent.hasAccess(id)) return launch(g);
  if (ent.trialRemaining(id) > 0) return openTrial(g);
  openStore(t('exhausted', { name: g.name[L()], max: ent.trialRuns(id), tier: tierName(g.tier) }));
}

// ---------------------------------------------------------------- list
function render() {
  document.title = t('doc.title');
  const tier = ent ? ent.getTier() : 'free';
  $('tier-name').textContent = tierName(tier); $('tier-chip').dataset.tier = tier;
  $('btn-unlock').classList.toggle('hidden', tier === 'gold');
  $('ads-line').textContent = ent && ent.adsEnabled() ? t('adsOn') : t('adsOff');
  if (!games.length || !ent) return;
  const list = $('list'); list.innerHTML = '';
  const O = L() === 'zh' ? 'en' : 'zh';
  games.forEach((g, i) => {
    const access = ent.hasAccess(g.id), paid = g.tier !== 'free';
    const left = ent.trialRemaining(g.id), max = ent.trialRuns(g.id);
    const state = !paid ? '' : access ? `<span class="state open">✓ ${esc(t('unlocked'))}</span>` : `<span class="state lock">🔒 ${esc(t('locked'))}</span>`;
    const trial = paid && !access ? `<div class="trial${left ? '' : ' none'}">${esc(left ? t('trialLeft', { n: left, max }) : t('trialNone'))}</div>` : '';
    const btn = access ? `<button data-play="${esc(g.id)}">${esc(t('play'))}</button>`
      : `<button class="try" data-play="${esc(g.id)}">${esc(left ? t('tryIt') : t('trialNone'))}</button><button class="unl" data-unlock="${esc(g.id)}">🔒 ${esc(t('unlock'))}</button>`;
    const el = document.createElement('article');
    el.className = `card t-${g.tier}${access ? '' : ' locked'}`; el.dataset.game = g.id;
    el.innerHTML = `<div class="idx">${String(i + 1).padStart(2, '0')}</div>
      <div class="name">${esc(g.name[L()])}</div><div class="alt">${esc(g.name[O])}</div>
      <div class="genre">${esc(g.genre?.[L()])}</div>
      <div class="badges"><span class="badge ${esc(g.tier)}">${esc(t('badge.' + g.tier))}</span>${state}</div>
      ${trial}<div class="links">${btn}</div>`;
    list.appendChild(el);
  });
  list.querySelectorAll('[data-play]').forEach((b) => { b.onclick = () => onPlay(b.dataset.play); });
  list.querySelectorAll('[data-unlock]').forEach((b) => { b.onclick = () => openStore(); });
  devMeta();
}

// ---------------------------------------------------------------- hidden DEV panel (stub only)
let chipTaps = 0, chipT = 0;
function devMeta() { const m = $('dev-meta'); if (m && ent) m.textContent = `${t('devBackend', { id: ent.backend.id })} · tier=${ent.getTier()} · owned=[${ent.ownedProducts().join(',')}]`; }
function showDev() { if (!ent.backend.isStub) return; $('dev').classList.remove('hidden'); devMeta(); }
$('tier-chip').addEventListener('click', () => {
  clearTimeout(chipT); chipT = setTimeout(() => { chipTaps = 0; }, 1500);
  if (++chipTaps >= 7) { chipTaps = 0; showDev(); return; }
  if (chipTaps === 1) setTimeout(() => { if (chipTaps === 1) openStore(); }, 350);
});
$('dev-close').onclick = () => $('dev').classList.add('hidden');
$('dev').addEventListener('click', async (e) => {
  const a = e.target.dataset && e.target.dataset.dev; if (!a) return;
  const stub = ent.backend;
  if (a === 'reset') { stub.devReset(); ent.devWipeCache(); ent.devResetTrials(); }
  if (a === 'trials') ent.devResetTrials();
  if (a === 'wipe') ent.devWipeCache();
  if (a === 'silver' || a === 'gold') { stub.devReset(); localStorage.setItem('cyber.arcade.devstub.owned', JSON.stringify([a === 'silver' ? 'tier_silver' : 'tier_gold'])); await ent.restore(); }
  render(); if (storeOpen()) renderStore();
});
$('btn-unlock').onclick = () => openStore();
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if ($('modal2') && !$('modal2').classList.contains('hidden')) return; closeSheet(); } });

// ---------------------------------------------------------------- boot
i18n.bindToggle($('btn-lang'));
i18n.onChange(() => { render(); if (storeOpen()) renderStore(); });
window.__hub = { get ent() { return ent; }, get games() { return games; }, openStore, onPlay, lastLaunch: null };
(async () => {
  try {
    const data = await (await fetch('./games.json', { cache: 'no-store' })).json();
    games = data.games.filter((g) => g.status === 'done' || g.status === 'wip');
    const backend = createWebStubBackend({ confirm: stubConfirm });   // app build: createRevenueCatBackend (js/billing/play-revenuecat.js)
    ent = createEntitlements({ games, backend });
    ent.onChange(() => render());
    await ent.init();
    render();
    if (params.get('dev') === '1') showDev();
    if (params.get('store') === '1') openStore();
  } catch (e) {
    console.warn(e); $('list').innerHTML = `<div class="err">${esc(t('fail'))} · ${esc(e.message)}</div>`;
  }
})();
