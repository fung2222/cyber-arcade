// CYBER ARCADE hub — game list with tier badges, trials, store/unlock sheet, restore, hidden DEV panel.
import { i18n, t } from '../vendor/cyber-kit/core/i18n.js';
import { SynthAudio, MUSIC } from '../vendor/cyber-kit/audio/synth.js';
import './strings.js';
import { createEntitlements, RANK } from './entitlements.js';
import { createWebStubBackend } from './billing/web-stub.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Prefer wrap after CJK/Latin punctuation so titles/blurbs don't orphan mid-phrase.
const softBreak = (s) => esc(s).replace(/([：:·／/、，,（）()])/g, '$1<wbr>');
const params = new URLSearchParams(location.search);
const NO_NAV = params.get('nonav') === '1';          // tests: record launches instead of leaving the page
const L = () => (i18n.isZh() ? 'zh' : 'en');
const tierName = (tier) => t('tier.' + tier);
let games = [], ent = null, storeReason = null;
// bottom tabs: profile | cats | browse | favs | settings
const HUB_VERSION = '0.5.3'; // hub shell (About); per-game product versions live in games.json
const FAV_KEY = 'cyber.arcade.favorites';
const NAME_KEY = 'cyber.arcade.displayName';
const MUTE_KEY = 'cyber.arcade.muted';
let activeTab = 'browse';
let activeTag = 'all';
let searchQ = ''; // hub search: card # / version / id / name
function readFavs() {
  try {
    const raw = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
    return Array.isArray(raw) ? raw.map(String) : [];
  } catch { return []; }
}
function writeFavs(ids) {
  try { localStorage.setItem(FAV_KEY, JSON.stringify([...new Set(ids)])); } catch { /* */ }
}
function isFav(id) { return readFavs().includes(id); }
function toggleFav(id) {
  const set = new Set(readFavs());
  if (set.has(id)) set.delete(id); else set.add(id);
  writeFavs([...set]);
  return set.has(id);
}
function readDisplayName() {
  try { return String(localStorage.getItem(NAME_KEY) || '').slice(0, 24); } catch { return ''; }
}
function writeDisplayName(name) {
  try { localStorage.setItem(NAME_KEY, String(name || '').trim().slice(0, 24)); } catch { /* */ }
}
function readMuted() {
  try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; }
}
function writeMuted(m) {
  try { localStorage.setItem(MUTE_KEY, m ? '1' : '0'); } catch { /* */ }
}
function allTags() {
  const s = new Set();
  games.forEach((g) => (g.tags || []).forEach((t) => s.add(t)));
  return [...s];
}
function catalogNo(g) {
  const i = games.findIndex((x) => x.id === g.id);
  return i >= 0 ? String(i + 1).padStart(2, '0') : '';
}

/** Match query against card # (01 / 1 / #01), version, id, and bilingual names. */
function matchesSearch(g, q) {
  const raw = String(q || '').trim().toLowerCase();
  if (!raw) return true;
  const stripped = raw.replace(/^#/, '');
  const no = catalogNo(g);                 // "01"
  const noInt = no ? String(parseInt(no, 10)) : '';
  const ver = String(g.version || '').trim().toLowerCase().replace(/^v/i, '');
  const id = String(g.id || '').toLowerCase();
  const nameZh = String(g.name?.zh || '').toLowerCase();
  const nameEn = String(g.name?.en || '').toLowerCase();
  // Card catalog #: exact ("1", "01", "#01") — memorable badge players type.
  if (no) {
    if (raw === `#${no}` || raw === `#${noInt}` || stripped === no || stripped === noInt) return true;
    if (/^\d+$/.test(stripped) && no === stripped.padStart(2, '0')) return true;
  }
  // Version string on the card badge (v0.3.16 / 0.3.16). Pure single-digit queries
  // stay catalog-# only so "1" → #01, not every 1.x semver.
  if (ver) {
    const qVer = stripped.replace(/^v/, '');
    const versionLike = qVer.includes('.') || raw.startsWith('v') || stripped.startsWith('v');
    if (versionLike && (ver === qVer || ver.startsWith(qVer) || ver.includes(qVer) || (`v${ver}`).includes(raw))) return true;
    if (/^\d+$/.test(qVer) && qVer.length >= 2 && ver.includes(qVer)) return true;
  }
  if (id.includes(stripped) || id.includes(raw)) return true;
  if (nameZh.includes(raw) || nameEn.includes(raw) || nameZh.includes(stripped) || nameEn.includes(stripped)) return true;
  return false;
}

function gamesForView() {
  let list = games;
  if (activeTab === 'favs') list = games.filter((g) => isFav(g.id));
  else if (activeTab === 'cats' && activeTag !== 'all') {
    list = games.filter((g) => (g.tags || []).includes(activeTag));
  }
  if (searchQ.trim()) list = list.filter((g) => matchesSearch(g, searchQ));
  return list;
}

// ---------------------------------------------------------------- audio (SynthAudio — lazy on first user gesture)
// Hub BGM starts only on card dwell (not on hub load). Optional games.json bgm/previewAudio
// plays at playbackRate 1.0; otherwise a kit music preset (drive/chill) at normal sequencer rate.
const reduceMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const hubAudio = new SynthAudio({ music: 'chill', musicTrimDb: -4, sfxTrimDb: -2 });
let audioUnlocked = false, bgmStarted = false;
let cardBgmId = null;          // game id owning current card preview BGM
let cardHtmlAudio = null;      // HTMLAudioElement when using file preview
let cardHtmlFade = null;

function unlockAudio() {
  if (audioUnlocked) { hubAudio.init(); return; }
  audioUnlocked = true;
  hubAudio.init();
  try { hubAudio.setMuted(readMuted()); } catch { /* */ }
  // intentionally no startMusic here — card dwell owns ambient/preview BGM
}

function musicPresetFor(g) {
  const named = String(g?.music || '').toLowerCase();
  if (named === 'drive' || named === 'chill') return named;
  const tags = g?.tags || [];
  if (tags.some((t) => ['action', 'runner', 'shooter', 'survivor', 'fighter', 'arcade'].includes(t))) return 'drive';
  return 'chill';
}

function stopHtmlCardAudio(fadeSec = 0.2) {
  const el = cardHtmlAudio;
  if (!el) return;
  cardHtmlAudio = null;
  if (cardHtmlFade) { try { clearInterval(cardHtmlFade); } catch { /* */ } cardHtmlFade = null; }
  const steps = Math.max(1, Math.round(fadeSec * 20));
  let i = 0;
  const startVol = el.volume;
  cardHtmlFade = setInterval(() => {
    i += 1;
    el.volume = Math.max(0, startVol * (1 - i / steps));
    if (i >= steps) {
      clearInterval(cardHtmlFade); cardHtmlFade = null;
      try { el.pause(); el.removeAttribute('src'); el.load(); } catch { /* */ }
    }
  }, 50);
}

function stopSynthCardBgm(fadeSec = 0.25) {
  if (!bgmStarted) return;
  try { hubAudio.stopMusic(fadeSec); } catch { /* */ }
  bgmStarted = false;
}

function stopCardBgm(fadeSec = 0.25) {
  cardBgmId = null;
  stopHtmlCardAudio(fadeSec);
  stopSynthCardBgm(fadeSec);
}

function startCardBgm(g) {
  if (!g || readMuted() || reduceMotion()) return;
  unlockAudio();
  if (hubAudio.muted || readMuted()) return;
  const id = g.id;
  if (cardBgmId === id && (cardHtmlAudio || bgmStarted)) return;
  // switch cards: stop previous, then play
  stopCardBgm(0.18);
  cardBgmId = id;
  const url = String(g.bgm || g.previewAudio || '').trim();
  if (url) {
    try {
      const el = new Audio(url);
      el.loop = true;
      el.preload = 'auto';
      el.volume = 0;
      try { el.playbackRate = 1; } catch { /* */ }
      cardHtmlAudio = el;
      const p = el.play();
      if (p && p.catch) p.catch(() => { if (cardHtmlAudio === el) { cardHtmlAudio = null; cardBgmId = null; } });
      // fade in ~0.25s at normal rate (never chipmunk / accelerated)
      let i = 0;
      const steps = 8;
      cardHtmlFade = setInterval(() => {
        i += 1;
        if (cardHtmlAudio !== el) { clearInterval(cardHtmlFade); cardHtmlFade = null; return; }
        el.volume = Math.min(0.85, i / steps * 0.85);
        try { el.playbackRate = 1; } catch { /* */ }
        if (i >= steps) { clearInterval(cardHtmlFade); cardHtmlFade = null; }
      }, 40);
    } catch {
      cardBgmId = null;
    }
    return;
  }
  // No file clip yet — reuse kit SynthAudio music at normal rate (drive/chill).
  try {
    const preset = musicPresetFor(g);
    hubAudio.preset = MUSIC[preset] || MUSIC.chill;
    hubAudio.startMusic();
    bgmStarted = true;
  } catch {
    cardBgmId = null;
    bgmStarted = false;
  }
}

function applyMute(muted) {
  writeMuted(!!muted);
  try { hubAudio.setMuted(!!muted); } catch { /* */ }
  if (muted) stopCardBgm(0.15);
  // unmute: wait for next card dwell — do not auto-restart hub music
  syncMuteBtn();
}
function syncMuteBtn() {
  const b = $('btn-mute'); if (!b) return;
  const muted = readMuted();
  b.setAttribute('aria-pressed', muted ? 'true' : 'false');
  b.textContent = muted ? t('settings.muteOn') : t('settings.muteOff');
}
const PRESS_FX_MS = 180;
const LAUNCH_FX_MS = 900; // hub→game portal; Play only (not demo/howto)

function pressFx(el) {
  if (!el || reduceMotion()) return 0;
  el.classList.remove('btn-press');
  void el.offsetWidth;
  el.classList.add('btn-press');
  return PRESS_FX_MS;
}

function ensureLaunchFx() {
  let root = document.getElementById('launch-fx');
  if (root) return root;
  root = document.createElement('div');
  root.id = 'launch-fx';
  root.className = 'launch-fx';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = '<div class="launch-fx-wipe"></div><div class="launch-fx-scan"></div><div class="launch-fx-ring"></div><div class="launch-fx-label">LINK</div>';
  document.body.appendChild(root);
  return root;
}

function runLaunchFx(done) {
  if (reduceMotion()) { try { done(); } catch (e) { console.warn(e); } return; }
  const root = ensureLaunchFx();
  root.classList.remove('is-on');
  void root.offsetWidth;
  root.classList.add('is-on');
  root.setAttribute('aria-hidden', 'false');
  setTimeout(() => {
    try { done(); } catch (e) { console.warn(e); }
  }, LAUNCH_FX_MS);
}

function withConfirmThen(fn, btn) {
  unlockAudio();
  try { hubAudio.confirm(); hubAudio.whoosh(0.04); } catch { /* audio optional */ }
  const delay = pressFx(btn);
  const go = () => { try { fn(); } catch (e) { console.warn(e); } };
  setTimeout(go, delay);
}
['pointerdown', 'keydown', 'touchstart'].forEach((ev) => {
  document.addEventListener(ev, () => unlockAudio(), { once: true, passive: true });
});

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
  // Noticeably longer hub→game portal (Play / trial start only). Demo/howto skip this path.
  runLaunchFx(() => { location.href = url; });
}
function openTrial(g) {
  const max = ent.trialRuns(g.id), n = ent.trialRemaining(g.id), tn = tierName(g.tier);
  const rule = g.trial && g.trial.rule ? g.trial.rule[L()] : '';
  const s = openSheet(`<h2>${esc(t('trialTitle', { tier: tn }))}</h2>
    <p style="text-align:center">${esc(t('trialBody', { name: g.name[L()], tier: tn, max, n }))}</p>
    ${rule ? `<p class="fine" style="text-align:center">${esc(t('trialRule', { rule }))}</p>` : ''}
    <div class="row"><button class="ghost" id="tr-unlock">${esc(t('unlock'))}</button><button id="tr-start">${esc(t('startTrial'))}</button></div>`, { small: true });
  $('modal').dataset.kind = 'trial';
  s.querySelector('#tr-start').onclick = (ev) => {
    const btn = ev.currentTarget;
    withConfirmThen(() => {
      const left = ent.consumeTrial(g.id); closeSheet(); render();
      if (left >= 0) launch(g, { trial: true, trialLeft: left });
    }, btn);
  };
  s.querySelector('#tr-unlock').onclick = () => { unlockAudio(); try { hubAudio.click(); } catch {} openStore(); };
}

function openHowto(g) {
  const body = (g.howto && g.howto[L()]) || '';
  if (!body) { toast(t('howto')); return; }
  const items = String(body).split(/\n+/).map((line) => line.trim()).filter(Boolean)
    .map((line) => `<li>${esc(line.replace(/^[•\-\*]\s*/, ''))}</li>`).join('');
  const s = openSheet(`<h2>${esc(t('howtoTitle', { name: g.name[L()] }))}</h2>
    <ul class="howto-list">${items}</ul>
    <div class="row"><button class="ghost" id="howto-close">${esc(t('close'))}</button>
    <button id="howto-play">${esc(ent && ent.hasAccess(g.id) ? t('play') : t('tryIt'))}</button></div>`);
  $('modal').dataset.kind = 'howto';
  s.querySelector('#howto-close').onclick = () => closeSheet();
  s.querySelector('#howto-play').onclick = (ev) => {
    const btn = ev.currentTarget;
    closeSheet();
    withConfirmThen(() => onPlay(g.id), btn);
  };
}

function onPlay(id) {
  const g = games.find((x) => x.id === id); if (!g) return;
  if (ent.hasAccess(id)) return launch(g);
  if (ent.trialRemaining(id) > 0) return openTrial(g);
  openStore(t('exhausted', { name: g.name[L()], max: ent.trialRuns(id), tier: tierName(g.tier) }));
}

// ---------------------------------------------------------------- list
function renderCatBar() {
  const bar = $('cat-bar'); if (!bar) return;
  const show = activeTab === 'cats';
  bar.classList.toggle('hidden', !show);
  if (!show) return;
  const tags = ['all', ...allTags()];
  bar.innerHTML = tags.map((tag) => {
    const label = tag === 'all' ? t('cat.all') : t('tag.' + tag);
    const on = activeTag === tag ? ' active' : '';
    return `<button type="button" class="cat-chip${on}" data-tag="${esc(tag)}">${esc(label)}</button>`;
  }).join('');
  bar.querySelectorAll('[data-tag]').forEach((b) => {
    b.onclick = () => { activeTag = b.dataset.tag; render(); };
  });
}

function syncTierChrome(tier) {
  const name = tierName(tier);
  const chip = $('tier-chip');
  const tn = $('tier-name');
  if (tn) tn.textContent = name;
  if (chip) chip.dataset.tier = tier;
  // bottom-left 級別 tab uses the same geometric icon language as cats/favs/settings
  const unlock = $('btn-unlock');
  if (unlock) unlock.classList.toggle('hidden', tier === 'gold');
}

function renderProfile() {
  const nameEl = $('profile-name');
  if (nameEl && document.activeElement !== nameEl) {
    nameEl.value = readDisplayName();
    nameEl.placeholder = t('settings.namePlaceholder');
  }
  if (ent) syncTierChrome(ent.getTier());
}

function renderSettings() {
  syncMuteBtn();
  try { i18n.apply($('view-settings') || document); } catch { /* */ }
  const meta = $('about-meta');
  if (meta) {
    const updated = window.__hub?.catalogUpdated || '—';
    meta.textContent = t('about.meta', { hub: 'v' + HUB_VERSION, updated });
  }
}

function setTab(tab) {
  if (!['browse', 'cats', 'favs', 'settings', 'profile'].includes(tab)) tab = 'browse';
  activeTab = tab;
  if (tab !== 'cats') activeTag = 'all';
  document.querySelectorAll('#tabbar .tab').forEach((b) => {
    const on = b.dataset.tab === tab;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', on ? 'true' : 'false');
  });
  const home = $('view-home');
  const settings = $('view-settings');
  const profile = $('view-profile');
  const isSettings = tab === 'settings';
  const isProfile = tab === 'profile';
  if (home) home.classList.toggle('hidden', isSettings || isProfile);
  if (settings) settings.classList.toggle('hidden', !isSettings);
  if (profile) profile.classList.toggle('hidden', !isProfile);
  const header = $('hub-header');
  if (header) header.classList.toggle('hub-compact', tab === 'cats' || tab === 'favs' || tab === 'settings' || tab === 'profile');
  if (isSettings) renderSettings();
  else if (isProfile) renderProfile();
  else render();
}

function render() {
  document.title = t('doc.title');
  syncSearchChrome();
  const tier = ent ? ent.getTier() : 'free';
  syncTierChrome(tier);
  if (activeTab === 'settings') { renderSettings(); return; }
  if (activeTab === 'profile') { renderProfile(); return; }
  if (!games.length || !ent) return;
  renderCatBar();
  const list = $('list'); stopActivePreview();
  list.innerHTML = '';
  const visible = gamesForView();
  const empty = $('empty-state');
  if (!visible.length) {
    if (empty) {
      empty.classList.remove('hidden');
      empty.textContent = searchQ.trim()
        ? t('search.empty')
        : (activeTab === 'favs' ? t('fav.empty') : t('cats.empty'));
    }
    setupTouchCenterPreview(list);
    devMeta();
    return;
  }
  if (empty) empty.classList.add('hidden');
  const O = L() === 'zh' ? 'en' : 'zh';
  // Keep original catalog index for ranking polish (featured order from games.json)
  const indexOf = new Map(games.map((g, i) => [g.id, i]));
  visible.forEach((g) => {
    const i = indexOf.get(g.id) ?? 0;
    const access = ent.hasAccess(g.id), paid = g.tier !== 'free';
    const left = ent.trialRemaining(g.id), max = ent.trialRuns(g.id);
    const state = !paid ? '' : access ? `<span class="state open">✓ ${esc(t('unlocked'))}</span>` : `<span class="state lock">🔒 ${esc(t('locked'))}</span>`;
    const trial = paid && !access ? `<div class="trial${left ? '' : ' none'}">${esc(left ? t('trialLeft', { n: left, max }) : t('trialNone'))}</div>` : '';
    const wipPill = g.status === 'wip' ? `<span class="state wip">${esc(t('status.wip'))}</span>` : '';
    const featPill = g.featured ? `<span class="state featured">${esc(t('featured'))}</span>` : '';
    const alt = g.thumbAlt?.[L()] || t('thumbAlt', { name: g.name[L()] });
    const preview = g.preview ? `<video muted loop playsinline preload="none" poster="${esc(g.thumb || '')}" aria-hidden="true"><source src="${esc(g.preview)}" type="video/webm">${g.previewMp4 ? `<source src="${esc(g.previewMp4)}" type="video/mp4">` : ''}</video>` : '';
    const favOn = isFav(g.id);
    const favBtn = `<button type="button" class="fav-btn${favOn ? ' on' : ''}" data-fav="${esc(g.id)}" aria-pressed="${favOn ? 'true' : 'false'}" aria-label="${esc(favOn ? t('fav.remove') : t('fav.add'))}">★</button>`;
    const verRaw = String(g.version || '').trim().replace(/^v/i, '');
    const verLabel = verRaw ? `v${verRaw}` : '';
    const verPill = verLabel
      ? `<span class="badge ver" title="${esc(verLabel)}">${esc(verLabel)}</span>`
      : '';
    // Subtle UPDATED cue only when game.updated is within ~14 days of catalog.updated (no fake urgency).
    const catUpdated = String(window.__hub?.catalogUpdated || '').slice(0, 10);
    const gUpdated = String(g.updated || '').slice(0, 10);
    let freshPill = '';
    if (verPill && catUpdated && gUpdated && /^\d{4}-\d{2}-\d{2}$/.test(catUpdated) && /^\d{4}-\d{2}-\d{2}$/.test(gUpdated)) {
      const catMs = Date.parse(catUpdated + 'T00:00:00Z');
      const gMs = Date.parse(gUpdated + 'T00:00:00Z');
      if (Number.isFinite(catMs) && Number.isFinite(gMs)) {
        const days = Math.abs(catMs - gMs) / 86400000;
        if (days <= 14) freshPill = `<span class="badge ver-fresh">${esc(t('version.updated'))}</span>`;
      }
    }
    const verOv = (verPill || freshPill)
      ? `<div class="ov ov-br" aria-label="${esc(verLabel || t('version.updated'))}">${verPill}${freshPill}</div>`
      : '';
    // Always keep the 16:9 thumb slot; missing thumb falls back to gradient (never omit the figure).
    const thumb = `<figure class="thumb${g.preview ? ' has-preview' : ''}${g.thumb ? '' : ' no-img'}">${g.thumb ? `<img src="${esc(g.thumb)}" alt="${esc(alt)}" loading="lazy" decoding="async" width="640" height="360">` : ''}${preview}
      <div class="ov ov-tl"><span class="badge ${esc(g.tier)}">${esc(t('badge.' + g.tier))}</span>${featPill}${wipPill}</div>
      ${state ? `<div class="ov ov-tr">${state}</div>` : ''}${trial ? `<div class="ov ov-bl">${trial}</div>` : ''}${verOv}${favBtn}</figure>`;
    const btn = access ? `<button class="play-main" data-play="${esc(g.id)}">${esc(t('play'))}</button>`
      : `<button class="try" data-play="${esc(g.id)}">${esc(left ? t('tryIt') : t('trialNone'))}</button><button class="unl" data-unlock="${esc(g.id)}">🔒 ${esc(t('unlock'))}</button>`;
    const howtoBtn = g.howto
      ? `<button type="button" class="howto" data-howto="${esc(g.id)}">${esc(t('howto'))}</button>`
      : '';
    const demoBtn = g.demo
      ? `<button type="button" class="demo" data-demo="${esc(g.demo)}">${esc(t('demo'))}</button>`
      : '';
    // One action row: Start/Play leftmost, then smaller 教學／示範 to its right (wraps on narrow phones).
    const el = document.createElement('article');
    el.className = `card t-${g.tier}${access ? '' : ' locked'}${g.status === 'wip' ? ' wip' : ''}${g.featured ? ' featured' : ''}${g.productSplit ? ' standalone' : ''}${favOn ? ' is-fav' : ''}`; el.dataset.game = g.id;
    el.tabIndex = 0; el.setAttribute('role', 'group'); el.setAttribute('aria-label', g.name[L()]);
    const no = String(i + 1).padStart(2, '0');
    el.dataset.no = no;
    el.innerHTML = `${thumb}<div class="body"><div class="idx" title="#${esc(no)}" aria-label="#${esc(no)}">#${esc(no)}</div>
      <div class="name">${softBreak(g.name[L()])}</div><div class="alt">${softBreak(g.name[O])}</div>
      <div class="genre">${softBreak(g.genre?.[L()])}</div>
      ${g.stage ? `<div class="stage">${esc(t('stage'))}: ${softBreak(g.stage[L()])}</div>` : ''}
      <div class="links links-pri">${btn}${howtoBtn}${demoBtn}</div></div>`;
    list.appendChild(el);
    wirePreview(el, g);
  });
  setupTouchCenterPreview(list);
  list.querySelectorAll('[data-play]').forEach((b) => { b.onclick = () => withConfirmThen(() => onPlay(b.dataset.play), b); });
  list.querySelectorAll('[data-unlock]').forEach((b) => {
    b.onclick = () => {
      unlockAudio();
      try { hubAudio.click(); } catch {}
      pressFx(b);
      openStore();
    };
  });
  list.querySelectorAll('[data-fav]').forEach((b) => {
    b.onclick = (ev) => {
      ev.stopPropagation();
      unlockAudio();
      try { hubAudio.click(); } catch {}
      pressFx(b);
      toggleFav(b.dataset.fav);
      render();
    };
  });
  list.querySelectorAll('[data-howto]').forEach((b) => {
    b.onclick = (ev) => {
      ev.stopPropagation();
      unlockAudio();
      try { hubAudio.click(); } catch {}
      pressFx(b);
      const g = games.find((x) => x.id === b.dataset.howto);
      if (g) openHowto(g);
    };
  });
  // Demo: short press FX only (no long launch portal), then navigate.
  list.querySelectorAll('[data-demo]').forEach((b) => {
    b.onclick = (ev) => {
      ev.stopPropagation();
      unlockAudio();
      try { hubAudio.click(); } catch {}
      const url = b.dataset.demo;
      if (!url) return;
      const delay = pressFx(b);
      setTimeout(() => {
        if (NO_NAV) { toast(t('demo')); return; }
        location.href = url;
      }, delay);
    };
  });
  devMeta();
}

// Preview playback: desktop hover/focus-within; touch/coarse tap keeps one "active" card playing.
// Optional: on coarse pointers, the card nearest viewport center also becomes active (IntersectionObserver).
// Respects prefers-reduced-motion (no video autoplay).
const coarsePointer = () => typeof matchMedia === 'function'
  && (matchMedia('(pointer: coarse)').matches || matchMedia('(hover: none)').matches);
let activePreviewCard = null;
let stickyPreview = false; // set by touch/coarse activate; cleared on mouse leave or re-render
const previewCtl = new WeakMap(); // card → { play, stop, activate }
let previewIO = null;

function stopActivePreview() {
  if (!activePreviewCard) {
    stopCardBgm(0.2);
    return;
  }
  const ctl = previewCtl.get(activePreviewCard);
  activePreviewCard = null;
  stickyPreview = false;
  if (ctl) ctl.stop();
  else stopCardBgm(0.2);
}

function wirePreview(card, game) {
  const fig = card.querySelector('.thumb');
  const hasVideo = !!(fig && fig.classList.contains('has-preview') && fig.querySelector('video'));
  const vid = hasVideo ? fig.querySelector('video') : null;
  let playing = false;
  const playVideo = () => {
    if (!vid || reduceMotion() || playing) return;
    playing = true; fig.classList.add('playing');
    try { vid.playbackRate = 1; } catch { /* older browsers */ }
    const p = vid.play(); if (p && p.catch) p.catch(() => { fig.classList.remove('playing'); playing = false; });
  };
  const stopVideo = () => {
    if (!vid) return;
    if (!playing && !fig.classList.contains('playing')) return;
    playing = false; fig.classList.remove('playing');
    try { vid.pause(); vid.currentTime = 0; } catch { /* */ }
  };
  const play = () => {
    playVideo();
    startCardBgm(game);
    card.classList.add('is-previewing');
  };
  const stop = () => {
    stopVideo();
    if (cardBgmId === game?.id) stopCardBgm(0.22);
    card.classList.remove('is-previewing');
  };
  const activate = () => {
    if (reduceMotion() && !game) return;
    if (activePreviewCard && activePreviewCard !== card) {
      const prev = previewCtl.get(activePreviewCard);
      if (prev) prev.stop();
    }
    activePreviewCard = card;
    stickyPreview = true;
    play();
  };
  previewCtl.set(card, { play, stop, activate });

  // Desktop / fine pointer: hover plays, leave pauses.
  card.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'touch') return;
    play();
  });
  card.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'touch') return;
    if (activePreviewCard === card) { activePreviewCard = null; stickyPreview = false; }
    stop();
  });
  card.addEventListener('focusin', play);
  card.addEventListener('focusout', (e) => {
    if (card.contains(e.relatedTarget)) return;
    if (activePreviewCard === card && stickyPreview) return;
    stop();
  });

  // Phones / coarse pointer: tap/press sets this card as the active preview (video + BGM).
  // Does not steal the Play button — buttons stopPropagation via their own handlers.
  card.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch' && !coarsePointer()) return;
    if (e.target.closest('button, a')) return;
    activate();
  }, { passive: true });
}

function setupTouchCenterPreview(list) {
  if (previewIO) { try { previewIO.disconnect(); } catch { /* */ } previewIO = null; }
  if (!list || reduceMotion() || !coarsePointer() || typeof IntersectionObserver !== 'function') return;
  const cards = [...list.querySelectorAll('.card')].filter((c) => previewCtl.has(c));
  if (!cards.length) return;
  const pickCenter = () => {
    const mid = window.innerHeight / 2;
    const bandTop = window.innerHeight * 0.18;
    const bandBot = window.innerHeight * 0.82;
    let best = null, bestDist = Infinity;
    for (const card of cards) {
      if (!card.isConnected) continue;
      const r = card.getBoundingClientRect();
      const cy = (r.top + r.bottom) / 2;
      if (cy < bandTop || cy > bandBot) continue;
      // Require a meaningful visible slice so off-screen cards stay quiet.
      const visible = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
      if (visible < r.height * 0.45) continue;
      const dist = Math.abs(cy - mid);
      if (dist < bestDist) { bestDist = dist; best = card; }
    }
    if (!best) return;
    const ctl = previewCtl.get(best);
    if (ctl) ctl.activate();
  };
  previewIO = new IntersectionObserver(() => { pickCenter(); }, {
    threshold: [0.4, 0.55, 0.7, 0.85],
  });
  cards.forEach((c) => previewIO.observe(c));
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

// sticky bottom tabs
function syncSearchChrome() {
  const input = $('game-search');
  const clear = $('game-search-clear');
  if (input) {
    if (document.activeElement !== input) input.value = searchQ;
    input.placeholder = t('search.placeholder');
    const lab = document.querySelector('label[for="game-search"]');
    if (lab) lab.textContent = t('search.label');
  }
  if (clear) {
    clear.classList.toggle('hidden', !searchQ.trim());
    clear.setAttribute('aria-label', t('search.clear'));
  }
}

function wireSearch() {
  const input = $('game-search');
  const clear = $('game-search-clear');
  if (!input || input.dataset.wired === '1') return;
  input.dataset.wired = '1';
  let timer = 0;
  const apply = () => {
    searchQ = input.value || '';
    syncSearchChrome();
    if (activeTab === 'settings' || activeTab === 'profile') return;
    render();
    // keep caret: restore focus if we had it
    if (document.activeElement !== input) {
      try { input.focus({ preventScroll: true }); } catch { try { input.focus(); } catch { /* */ } }
      try {
        const n = input.value.length;
        input.setSelectionRange(n, n);
      } catch { /* */ }
    }
  };
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(apply, 120);
  });
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') {
      input.value = '';
      apply();
    }
  });
  if (clear) {
    clear.addEventListener('click', () => {
      input.value = '';
      apply();
      try { input.focus(); } catch { /* */ }
    });
  }
  syncSearchChrome();
}

wireSearch();

$('tabbar')?.querySelectorAll('[data-tab]').forEach((b) => {
  b.addEventListener('click', () => {
    unlockAudio();
    try { hubAudio.click(); } catch {}
    setTab(b.dataset.tab);
  });
});
$('btn-mute')?.addEventListener('click', () => {
  unlockAudio();
  applyMute(!readMuted());
});
$('btn-save-profile')?.addEventListener('click', () => {
  const v = ($('profile-name')?.value || '').trim().slice(0, 24);
  writeDisplayName(v);
  if ($('profile-name')) $('profile-name').value = v;
  toast(t('settings.nameSaved'));
});
$('btn-restore-settings')?.addEventListener('click', () => { restore(); });
$('btn-lang-settings')?.addEventListener('click', () => {
  try { i18n.toggle(); } catch { /* */ }
});
// hydrate mute before first gesture where possible (setMuted applies once audio inits)
try { if (readMuted()) hubAudio.muted = true; } catch { /* */ }
syncMuteBtn();


// a game's trial "unlock" button leaves {game, t} here and goes history.back() → open the unlock sheet (same origin, no hub path in game URLs)
const RETURN_KEY = 'cyber.arcade.openStore';
function checkReturnNote() {
  let note = null; try { note = JSON.parse(localStorage.getItem(RETURN_KEY) || 'null'); localStorage.removeItem(RETURN_KEY); } catch { /* */ }
  if (!note || !ent || Date.now() - (note.t || 0) > 10 * 60 * 1000) return;
  const g = games.find((x) => x.id === note.game);
  openStore(g ? t('trialOver', { name: g.name[L()], tier: tierName(g.tier) }) : undefined);
}
window.addEventListener('pageshow', (e) => { if (e.persisted) checkReturnNote(); });

// ---------------------------------------------------------------- boot
// language toggle lives in Settings only (no homepage top-right 中/英)
i18n.onChange(() => {
  if (activeTab === 'settings') renderSettings();
  else if (activeTab === 'profile') renderProfile();
  else render();
  if (storeOpen()) renderStore();
  syncMuteBtn();
});
window.__hub = { get ent() { return ent; }, get games() { return games; }, hubVersion: HUB_VERSION, catalogUpdated: null, openStore, onPlay, lastLaunch: null, setTab, get tab() { return activeTab; }, get favs() { return readFavs(); } };
(async () => {
  try {
    const data = await (await fetch('./games.json', { cache: 'no-store' })).json();
    window.__hub.catalogUpdated = data.updated || null;
    games = data.games.filter((g) => g.status === 'done' || g.status === 'wip');
    const backend = createWebStubBackend({ confirm: stubConfirm });   // app build: createRevenueCatBackend (js/billing/play-revenuecat.js)
    ent = createEntitlements({ games, backend });
    ent.onChange(() => render());
    await ent.init();
    render();
    if (params.get('dev') === '1') showDev();
    if (params.get('store') === '1') openStore(); else checkReturnNote();
  } catch (e) {
    console.warn(e); $('list').innerHTML = `<div class="err">${esc(t('fail'))} · ${esc(e.message)}</div>`;
  }
})();
