# CYBER ARCADE — Handoff

Owner: fung2222 (Roy). Updated 2026-10-02. Series of cyberpunk 3D mini-games rebuilt from the old SONO site, one repo per game, all on `cyber-kit`, aiming at Google Play.

## 1. Goal & style guide
- **Look:** cyberpunk Hong Kong at night — Three.js 3D, neon magenta/cyan/yellow, rain, reflective wet streets, bloom + subtle chromatic aberration/glitch, Orbitron + Traditional Chinese headings. Reference: CYBER SNAKE.
- **Feel:** quick, relaxing commute sessions (1–5 min), instant restart, no punishing timers unless the genre needs them, satisfying juice (particles, shockwaves, haptics, synth SFX).
- **Platform:** mobile-first portrait touch (one thumb wherever possible), still great on desktop with keyboard.
- **UI language:** zh-HK first, English small caps under it.
- **Every game ships with:** start / pause / game-over screens, best score (localStorage), mute, `?demo=1` autoplay, Android back handling, `privacy.html` (zh-HK + EN), `docs/HANDOFF.md`, headless smoke test, zero console errors.

## 2. Tech stack
- Three.js r169 (vendored inside cyber-kit), plain ES modules + import maps, **no build step**, all assets bundled (offline-capable).
- Hosting: GitHub Pages (main:/) per repo.
- Android later: Capacitor 8 + `@capacitor-community/admob` v8 + `@capacitor/app` + `@capacitor/haptics`.
- Tests: node for pure logic, Playwright + headless Chrome (SwiftShader) for smoke tests at 412×915 (touch) and 1280×800.

## 3. Repo structure
```
fung2222/cyber-arcade   this repo: docs, games.json (single source of truth), placeholder root page, hub code (js/ + css/, monetisation prototype served from the unlisted portal), robots.txt
fung2222/cyber-kit      shared kit, tagged versions (v0.1.0)
fung2222/<game>         one repo per game:
  index.html  css/game.css  js/{config,logic,main,audio,...}.js  vendor/cyber-kit/  tests/  docs/HANDOFF.md  privacy.html
```

## 4. cyber-kit usage
Copy a **tagged** kit version into `vendor/cyber-kit/` (never edit it there; fix in the kit repo, tag, re-vendor). Import map: `three`, `three/addons/`, `cyber-kit`, `cyber-kit/`. Kit provides: `createStage`, `NeonCity`, `ThemeController`/`THEMES`, `Particles`/`Shockwaves`/`FxState`, `SynthAudio`, `createInput`, `CyberUI` + `hud.css`, `createStore`, `Platform`, `createAds`, and since **v0.2.0 `i18n`** (`t`, `i18n.add/set/toggle/onChange/bindToggle`, `data-i18n*` DOM attributes, `localStorage cyber.lang`) plus `endlessCurve`/`milestoneOf` helpers. **Use v0.2.1** (auto-applies DOM strings after `i18n.add`; with v0.2.0 call `i18n.apply()` yourself). See cyber-kit `docs/API.md`.

## 5. Game status
| # | Game | Repo | Live | Status | Play Store |
|---|---|---|---|---|---|
| 1 | 賽博蛇 CYBER SNAKE | cyber-snake | https://fung2222.github.io/cyber-snake/ | ✅ v1.1 bilingual + endless (kit source; vendors only kit v0.2.1 `core/i18n.js`) | not submitted |
| 2 | 數據熔合 DATA FUSE | data-fuse | https://fung2222.github.io/data-fuse/ | ✅ v1.1 bilingual + endless (kit v0.2.1) | not submitted |
| 3 | 霓虹記憶 NEON RECALL | neon-recall | https://fung2222.github.io/neon-recall/ | ✅ v1.1 bilingual + endless (kit v0.2.1) | — |
| 4 | 賽博忍者：星海魔獸 CYBER NINJA | cyber-ninja | https://fung2222.github.io/cyber-ninja/ | ✅ v1.1 bilingual + endless (kit v0.2.1) | — |
| 5 | 賽博小遊戲合集 CYBER MINI PACK | cyber-mini-pack | https://fung2222.github.io/cyber-mini-pack/ | ✅ v1.1 bilingual + endless (kit v0.2.1) | — |
| 6 | 霓虹火柴人 NEON STICK DUEL | neon-stick-duel | https://fung2222.github.io/neon-stick-duel/ | ✅ v1.1 bilingual + endless (kit v0.2.1) | — |
| 7 | 賽博棋鬥 CYBER BOARD | cyber-board | https://fung2222.github.io/cyber-board/ | ✅ done (web v1, cyber-kit v0.2.1) | — |
| 8 | 霓虹火柴人酷跑 NEON STICK RUN | neon-stick-run | https://fung2222.github.io/neon-stick-run/ | ✅ web v1.0 (12 stages + endless, cyber-kit v0.2.1, Silver, trial = stages 1–3 + endless 800 m) | — |
| 9 | 霓虹堡壘 NEON BASTION | cyber-tower | https://fung2222.github.io/cyber-tower/ | ✅ web v1.1 (3D tower defense: 8 maps + endless, 5 towers × 3 levels, cyber-kit v0.2.1, Gold, trial = maps 1–2 + endless to wave 10; game-over interstitial stub only when `ads=1`, rewarded continue stub) | — |
| — | AI 指令格鬥 ai-fighter | — | — | ❌ retired (crashing stub, trademark name) | — |

`games.json` must be updated together with this table whenever a game ships.

## 6. Build order (agreed)
1. ~~cyber-arcade + cyber-kit v0.1.0~~ ✅
2. ~~DATA FUSE~~ ✅
3. ~~NEON RECALL~~ ✅ — 3D holo cards with cyber icons, levels 2×4 → 6×4, stars, no fail; interstitial every 3 levels; rewarded "peek".
4. ~~CYBER NINJA~~ ✅ — drag to move, auto-fire, tap ultimate, enemy waves + bosses; rewarded continue; interstitial at game over.
5. ~~CYBER MINI PACK~~ ✅ — one app, three modes: 包剪揼 (pattern-reading AI personalities, best of 3, streaks), 過三關 (ladder of 3 AI opponents of rising strength), 神經反射 (reaction test with false-start detection).
6. ~~NEON STICK DUEL~~ ✅ — one-thumb: tap attack, swipe dodge/jump, hold to charge; tower mode; original icons.
7. ~~CYBER BOARD~~ ✅ — 4-in-1: chess, xiangqi, flip (黑白棋), sky race (飛行棋); every capture is a skippable 3D battle with a per-piece move; vs AI (5 levels), local 2P, endless tower per game; zh-HK/EN via cyber-kit v0.2.1 i18n.

**All 9 web builds are done (2026-10-03)** — the 7 above plus 霓虹堡壘 NEON BASTION (cyber-tower, Gold) and 霓虹火柴人酷跑 NEON STICK RUN (neon-stick-run, Silver). What's left (not started, needs Roy's go-ahead):
- Roy's review of every game (play links in the table above; demo = `?demo=1`).
- Android packaging per game (Capacitor 8 + `@capacitor-community/admob` v8; steps in each repo's `docs/HANDOFF.md`), real AdMob unit ids, store listings/screenshots.
- When a game goes public: remove `noindex` from its `index.html` / `privacy.html`. The arcade test page stays unlisted.
- cyber-snake: v1.1 (2026-10-02, with Roy's go-ahead) got i18n + endless + noindex + privacy.html with minimal-risk changes; a full re-skin on cyber-kit only if Roy asks.

## 7. Decisions & rules (binding)
- **Never port sono code.** Do not copy any code, constants or configs from `fung2222/sono`. Rebuild every game from scratch; only the concept is reused. (cyber-snake is the style reference and the source of cyber-kit — that is allowed.)
- **Merge the small games.** RPS 包剪揼 + XO 過三關 + reaction test 神經反射 become ONE game, CYBER MINI PACK, with modes (avoids Play "spam / minimal functionality" duplicates). **ai-fighter is retired**; Stickman Fighter v1 and old snake are superseded.
- **Test portal is unlisted.** A test hub listing every game exists in this repo at an unguessable path; the path is given to the owner privately and is intentionally not written in any doc, README or SONO link. Root `index.html` does not link to it. All pages are `noindex,nofollow` and `robots.txt` disallows everything until launch. (The repo is public, so the folder is visible in the GitHub file tree — it is only unlinked and unindexed.)
- Do not modify `fung2222/sono`. `fung2222/cyber-snake` may only get minimal-risk changes when Roy asks (v1.1 bilingual + endless was approved 2026-10-02).
- **Every game must be bilingual zh-HK / en.** Use cyber-kit ≥ v0.2.1 `i18n`: every UI string (HUD, banners, level/opponent names, how-to-play, dialogs, toasts) goes through a string table `{key: [zh-HK, en]}`; an in-game toggle (start screen + pause, `.lang-btn`); persisted in `localStorage cyber.lang` (shared by all games); default from `navigator.language` (zh* → zh-HK, else en); `?lang=en|zh` forces. privacy.html and the store-facing README sections (Language + English) must be bilingual too. Smoke tests must screenshot both languages.
- **Every game must have an endless mode.** No final "beat the game" state: after the authored content, levels/waves/floors continue procedurally with a **capped** difficulty curve (stays playable forever), milestone rewards + theme shifts, and a saved best endless record. Document natural ad-break points (never mid-action, never at a milestone banner) in each `docs/HANDOFF.md`. Smoke tests must prove play continues beyond the old end.

## 7b. Bilingual + endless round (2026-10-02) — per-game endless design
| Game | Endless design | Best record | Ad breaks |
|---|---|---|---|
| CYBER SNAKE | levels 7+ = procedural seeded layouts; speed cap 0.062 s/tick, target cap 10, obstacle cap 10; milestone bonus every 10 levels | hi-score + best level | game-over screen only (web has no ads) |
| DATA FUSE | procedural zones at every doubling forever (beyond 131072 → 262144 = zone 13…); 4-spawn chance +1 %/zone after 2048, cap 20 %; undo bonus per zone | best core + best zone | game over (Retry/Menu) |
| NEON RECALL | levels never end; preview ≥ 0.7 s, glitch-swap chance +1 %/level cap 60 %, 6×5 overclock grid every 3rd level from 12; milestone every 10 levels (+pts, +2 peeks, first clear only) | best level | clear-screen buttons (≈ every 3 levels) |
| CYBER NINJA | waves forever; 6 boss species then Mk.N variants; boss HP cap 1100, enemy HP ×3.5 cap, boss fire-rate ×1.6 cap; milestone every 10 waves (+pts, full shields, theme) | best wave | game over (Retry/Menu) |
| CYBER MINI PACK | RPS endless rivals (index 3+), XO OVERCLOCK CORE Lv.n (blunder 22 % → 4 % floor), reaction gauntlet (450 → 300 ms cap) | rival / stage / round per mode | result screen buttons (next/modes), capped |
| NEON STICK DUEL | floors 8+ procedural remixed rivals; HP 150+6/floor cap 330, think ≥ 0.17 s, rates ≤ 0.92; milestone every 10 floors (+5000, theme) | best floor | result screen buttons (next/retry/menu), capped |
| NEON STICK RUN | endless rooftops generated from patterns sized to the current speed; speed 10 → cap 21 m/s, density 0.18 → cap 0.88; milestone every 500 m (+25 chips, district theme shift); 12 authored stages stay separate | best distance + best score | result screen after a death (retry/menu/stages), never after a stage clear or at a milestone; capped |

Verification (2026-10-02, headless Chrome 412×915 touch + 1280×800, zero console errors, en + zh screenshots, endless beyond the old end): cyber-kit i18n unit 8/8 · snake smoke ALL PASSED · data-fuse logic + smoke ALL PASSED · neon-recall logic 6/6 + smoke ALL PASSED · cyber-ninja waves + smoke ALL PASSED · mini-pack rules 12/12 + smoke ALL PASSED · stick-duel duel 22/22 + smoke ALL PASSED. Test hub is bilingual (inline i18n with the same `cyber.lang` contract; shows ZH/EN + ENDLESS tags from `games.json` `i18n`/`endless` flags).

## 8. Play Store + AdMob plan (policy summary)
- **Assets:** everything bundled offline in the APK/AAB (no CDN).
- **Ads:** AdMob only via `@capacitor-community/admob` v8 (Capacitor 8). **Never AdSense** inside an app.
- **Interstitials only at natural breaks** (after game over / level clear when the player taps Next/Retry). **Never at launch, on exit, or at level start.** Capped: cooldown ≥ 3–4 min, every 3rd break, grace period after launch (cyber-kit `createAds` enforces this).
- **Rewarded = opt-in only:** continue / undo / peek. Always offer a "no thanks"; reward only on the reward callback.
- **Target audience 13+** (memory/RPS look kid-appealing — do NOT select under-13 age groups, avoid Families policy obligations). `maxAdContentRating` ParentalGuidance.
- **Privacy policy** both in-app (link on start screen) and on the store listing (`https://fung2222.github.io/<game>/privacy.html`).
- **Data safety form:** no data collected by the app itself; AdMob collects device/advertising ID, approximate location, app interactions, diagnostics — declare as "collected, shared, for advertising/analytics/fraud prevention", encrypted in transit, not optional in ad builds.
- **Consent:** Google UMP (`requestConsentInfo` + `showConsentForm`) before loading ads; privacy-options entry point when required.
- **Testing track:** new personal developer accounts need a **closed test with ≥12 testers for 14 consecutive days** before production. Roy recruits testers from his MBTI site.
- **AdMob linking** after the app is public on Play; publish **app-ads.txt** on the developer website domain listed in Play Console.
- Use Google test ad unit ids in all non-release builds.

## 8b. Monetisation (decided 2026-10-02) → full plan in [MONETIZATION.md](MONETIZATION.md)
- **One hub app** bundles all games offline (Capacitor later). Tiers: **Free · Silver 銀級 HK$18 · Gold 金級 HK$28**, one-time Google Play **non-consumable** products `tier_silver`, `tier_gold`, `tier_gold_upgrade` (Silver → Gold HK$10). Gold ⊇ Silver. **Each unlock includes all future games added to that tier** (no "forever/lifetime" wording). Restore Purchases required. Google fee 15 %; per-country prices via Play price templates.
- **Free players:** Free games unlimited; Silver/Gold games **3 trial runs per game per day** (+ in-game cap in the app build); interstitials only at natural breaks, rewarded ads opt-in. **Paid tiers: no forced/interstitial ads**, rewarded stays opt-in.
- **Tier rule (Roy):** a game whose genre already has lots of free equivalents on Play is **Free**. **Tier assignment** (`games.json` → `tier`, edit there): Free = cyber-snake, neon-recall, cyber-mini-pack, data-fuse · Silver = neon-stick-duel + neon-stick-run · Gold = cyber-board, cyber-ninja, cyber-tower (NEON BASTION). Trial: 3 runs/day + in-game caps.
- **Billing:** recommended RevenueCat `@revenuecat/purchases-capacitor` (server validation + acknowledgement, no backend). Code: `js/entitlements.js` (tiers, trials, ads flag) with a backend interface — `js/billing/web-stub.js` (DEV stub, localStorage, no real payment) now, `js/billing/play-revenuecat.js` skeleton for the app build.
- **Game contract:** hub launches games with `?hub=1&tier=…&ads=0|1[&trial=1&trialLeft=N]` and writes `localStorage cyber.entitlement`. Follow-ups: cyber-kit `createAds` skips interstitials when `ads=0`/paid; games apply trial caps when `trial=1`.
- **Web not public for now (Roy 2026-10-02) — go straight to the app.** The public root `index.html` is a neutral "in development / coming soon" placeholder (no list, no store, no game links). The monetised hub prototype (tier badges, lock/trial state, store sheet with upgrade + restore, hidden DEV panel: tap the tier chip 7×) lives inside the unlisted test portal and loads the hub code from the repo root via `<base>`. Pages stays on (the portal needs it). This is unlinked + noindex, not truly hidden: true hiding needs private repos on a paid GitHub plan (access-controlled Pages = Enterprise Cloud) or Cloudflare Pages + Access login. Tests: `node --test tests/`, `tests/smoke_monetization.py HUB_URL`.

## 9. Naming & trademark rules
- Original names only: no "2048", "Tetris", "Street Fighter", "RYU", "Pac", "Snake II", etc. in store titles.
- No PlayStation △○✕□ button symbols or other console trade dress; use original icons (e.g. fist, shield, bolt, wing).
- No real brands, celebrities or copyrighted characters. Fonts/sounds must be OFL/MIT or self-made (all SFX are synthesised in code).
- Gambling-like mechanics (wheel/fortune tools from SONO) are not ported.
- Store titles: "<中文名> <ENGLISH NAME>" e.g. "數據熔合 DATA FUSE".

## 10. How to ship a new game (checklist)
1. New public repo `fung2222/<id>`, vendor cyber-kit tag, write game from scratch.
2. `?demo=1`, best score, pause/mute/back, privacy.html, HANDOFF.md, tests/smoke.py, **bilingual zh-HK/en with in-game toggle**, **endless mode with best endless record**.
3. Smoke test passes at 412×915 + 1280×800 with zero console errors (both languages, endless beyond the authored end); review screenshots.
4. Push once verified, enable Pages, confirm live URL loads with zero errors.
5. Update `games.json` + section 5 table here, including the card thumbnail: capture a mid-action `?demo=1` frame of the live build at 1280×720 in headless Chrome (never a title screen), add its crop to `tools/make_thumbs.py` and run it → `assets/thumbs/<id>.webp` (16:9, 640×360, < 60 KB), then set `thumb` + `thumbAlt {zh, en}` in `games.json`. Check with `tests/smoke_thumbs.py`.
