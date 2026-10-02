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
fung2222/cyber-arcade   this repo: docs, games.json (single source of truth), minimal root page, robots.txt
fung2222/cyber-kit      shared kit, tagged versions (v0.1.0)
fung2222/<game>         one repo per game:
  index.html  css/game.css  js/{config,logic,main,audio,...}.js  vendor/cyber-kit/  tests/  docs/HANDOFF.md  privacy.html
```

## 4. cyber-kit usage
Copy a **tagged** kit version into `vendor/cyber-kit/` (never edit it there; fix in the kit repo, tag, re-vendor). Import map: `three`, `three/addons/`, `cyber-kit`, `cyber-kit/`. Kit provides: `createStage`, `NeonCity`, `ThemeController`/`THEMES`, `Particles`/`Shockwaves`/`FxState`, `SynthAudio`, `createInput`, `CyberUI` + `hud.css`, `createStore`, `Platform`, `createAds`. See cyber-kit `docs/API.md`.

## 5. Game status
| # | Game | Repo | Live | Status | Play Store |
|---|---|---|---|---|---|
| 1 | 賽博蛇 CYBER SNAKE | cyber-snake | https://fung2222.github.io/cyber-snake/ | ✅ done (kit source) | not submitted |
| 2 | 數據熔合 DATA FUSE | data-fuse | https://fung2222.github.io/data-fuse/ | ✅ done (web v1) | not submitted |
| 3 | 霓虹記憶 NEON RECALL | neon-recall | https://fung2222.github.io/neon-recall/ | ✅ done (web v1) | — |
| 4 | 賽博忍者：星海魔獸 CYBER NINJA | cyber-ninja | https://fung2222.github.io/cyber-ninja/ | ✅ done (web v1) | — |
| 5 | 賽博小遊戲合集 CYBER MINI PACK | cyber-mini-pack | — | planned | — |
| 6 | 霓虹火柴人 NEON STICK DUEL | neon-stick-duel | — | planned | — |
| — | AI 指令格鬥 ai-fighter | — | — | ❌ retired (crashing stub, trademark name) | — |

`games.json` must be updated together with this table whenever a game ships.

## 6. Build order (agreed)
1. ~~cyber-arcade + cyber-kit v0.1.0~~ ✅
2. ~~DATA FUSE~~ ✅
3. ~~NEON RECALL~~ ✅ — 3D holo cards with cyber icons, levels 2×4 → 6×4, stars, no fail; interstitial every 3 levels; rewarded "peek".
4. ~~CYBER NINJA~~ ✅ — drag to move, auto-fire, tap ultimate, enemy waves + bosses; rewarded continue; interstitial at game over.
5. CYBER MINI PACK — one app, three modes: 包剪揼 (pattern-reading AI personalities, best of 3, streaks), 過三關 (ladder of 3 AI opponents of rising strength), 神經反射 (reaction test with false-start detection).
6. NEON STICK DUEL — one-thumb: tap attack, swipe dodge/jump, hold to charge; tower mode; original icons.

## 7. Decisions & rules (binding)
- **Never port sono code.** Do not copy any code, constants or configs from `fung2222/sono`. Rebuild every game from scratch; only the concept is reused. (cyber-snake is the style reference and the source of cyber-kit — that is allowed.)
- **Merge the small games.** RPS 包剪揼 + XO 過三關 + reaction test 神經反射 become ONE game, CYBER MINI PACK, with modes (avoids Play "spam / minimal functionality" duplicates). **ai-fighter is retired**; Stickman Fighter v1 and old snake are superseded.
- **Test portal is unlisted.** A test hub listing every game exists in this repo at an unguessable path; the path is given to the owner privately and is intentionally not written in any doc, README or SONO link. Root `index.html` does not link to it. All pages are `noindex,nofollow` and `robots.txt` disallows everything until launch. (The repo is public, so the folder is visible in the GitHub file tree — it is only unlinked and unindexed.)
- Do not modify `fung2222/sono` or `fung2222/cyber-snake` from arcade work.

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

## 9. Naming & trademark rules
- Original names only: no "2048", "Tetris", "Street Fighter", "RYU", "Pac", "Snake II", etc. in store titles.
- No PlayStation △○✕□ button symbols or other console trade dress; use original icons (e.g. fist, shield, bolt, wing).
- No real brands, celebrities or copyrighted characters. Fonts/sounds must be OFL/MIT or self-made (all SFX are synthesised in code).
- Gambling-like mechanics (wheel/fortune tools from SONO) are not ported.
- Store titles: "<中文名> <ENGLISH NAME>" e.g. "數據熔合 DATA FUSE".

## 10. How to ship a new game (checklist)
1. New public repo `fung2222/<id>`, vendor cyber-kit tag, write game from scratch.
2. `?demo=1`, best score, pause/mute/back, privacy.html, HANDOFF.md, tests/smoke.py.
3. Smoke test passes at 412×915 + 1280×800 with zero console errors; review screenshots.
4. Push once verified, enable Pages, confirm live URL loads with zero errors.
5. Update `games.json` + section 5 table here.
