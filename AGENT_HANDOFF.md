# CYBER ARCADE — Agent session handoff

> **PRODUCT SPLIT 2026-10-25 — read [`docs/PRODUCT-SPLIT.md`](docs/PRODUCT-SPLIT.md) first.**  
> **FULL EVAL 2026-11-01 — read [`docs/CYBERHUB-EVAL-2026-11-01.md`](docs/CYBERHUB-EVAL-2026-11-01.md) for keep / improve / extract gates. Written by Kimi AI at Roy's request on 2026-11-01; Roy confirmed 2026-11-02 that this is the apps-direction baseline.**
> **機甲雷台** (`neon-stick-duel`) = **standalone Google Play fighter** (SF/KOF-style, heavy sprites, landscape, two-hand) — NOT a one-hand casual time-killer.  
> **This hub** = short, fun, quick cyberpunk mini-games only (free + Silver HK$18 / Gold HK$28, zh-HK/EN, endless).

---

# Current progress (2026-11-02)

## Done
- Root `index.html` is the real hub and stays `noindex`; old `lab-kqsverjfjd/` paths only redirect to root.
- `cyber-kit` is **v0.3.19** and vendored copies were synced across the game repos; `returnToHub` fallback now points at `../cyber-arcade/`.
- **A1 done** — commit `8fd337c`: cleaned stale "secret test portal" wording in `docs/MONETIZATION.md`, `tests/smoke_thumbs.py`, `tools/make_thumbs.py` after the root-hub merge.
- **Hub test/vendor cleanup (2026-11-02)** — hub `vendor/cyber-kit` synced to **v0.3.19**; `tests/smoke_thumbs.py` now tests the root hub only and supports `SMOKE_SHOTS=0`; `tests/smoke_monetization.py` uses the current store/dev selectors; both hub smoke tests pass (thumbs 4 viewports, monetization 40 shots, zero console errors).
- **Game smoke tests (2026-11-02)** — core game Playwright tests now launch the bundled Chromium (`p.chromium.launch(args=ARGS)`) instead of hardcoded `/usr/bin/google-chrome`; commits in cyber-board, cyber-mini-pack, cyber-ninja, cyber-snake, cyber-tower, neon-recall, neon-stick-run.
- **A3 done** — `css/hub.css` body bottom clearance 84px → **96px**; 390px last card now sits 20px above the Games FAB (was 8px). Guard: `tests/hub-layout.test.mjs`.
- **Card action hierarchy (2026-11-02)** — card Start/Play is now `flex: 3`, **52px** tall and 14px; 教學／示範 are fixed **58px** wide and stay on the same row. Guard: `tests/hub-cards.py` at 360/390/412 (play ≥2.5× 教學, no overflow).
- **Unified start/launch transition (2026-11-03)** — `cyber-kit/ui/game-loading.js`: two glowing rings + `Loading...`; imported by every kit game (auto-binds start controls) and used by the hub before navigation. Hub `js/hub.js?v=0.5.9`; player cards/trials/demo all use it.

## A2 done (card data hygiene)
- `games.json`: `corrupt-pet` card updated to live cache query `?v=0.1.4`, `version: 0.1.4`, `updated: 2026-11-02`, stage text bumped to v0.1.4; catalog `updated` also 2026-11-02.
- Added `tests/games.test.mjs` guard: unique ids, bilingual card fields, thumb/preview assets exist, wip cards carry bilingual `stage`.
- Verified: `node --test tests/` = **10/10 pass**.
- Browser check passed at 390px: corrupt-pet card shows `v0.1.4` + `IN PROGRESS` + bilingual stage, two-button row fits, no overlap on the card. (A browser-environment horse emoji appears in page titles; the repo title is plain `CYBER ARCADE`, confirmed by curl.)

## A2 remaining decisions
- Missing previews are intentional for now: `corrupt-pet`, `neon-sort`, `neon-swarm` have thumbs but no `assets/previews/*.webm`; hub keeps the 16:9 thumb slot when preview is absent.
- `corrupt-pet` has **no `?demo=1` handler found**, so `games.json` correctly has no `demo` for it.
- Do not mark wip cards as done; they already render the `製作中 / IN PROGRESS` pill.

## Next
1. Games one by one: **data-fuse → neon-recall → cyber-mini-pack → cyber-snake → cyber-ninja → cyber-tower → cyber-board → neon-stick-run → neon-sort → corrupt-pet**.
2. Keep **neon-swarm** and **neon-stick-duel** last; both are extract-gate products per `docs/CYBERHUB-EVAL-2026-11-01.md`.

---

# Prior session notes (2026-10-17 → 2026-10-19)

## Session outcomes

### Paused
- **neon-stick-duel / 機甲雷台** — **standalone fighter product** (see `docs/PRODUCT-SPLIT.md`). Not hub-casual. Prototype: bitmap mech swordsman, Action Test, arena BG, landscape. Deep work in that repo; do not force one-hand casual scope here.

### Polished (existing)
| Area | What | Key SHAs / notes |
|---|---|---|
| **cyber-kit** | menu-home → ViewInput | **v0.3.16** `0272c8a` (ViewInput zoom/orbit); v0.3.8–0.3.15 home icons / howto / layout |
| **neon-stick-run** | menu-home pass | through `f0ab718` (kit ~0.3.15) |
| **cyber-tower** | close radial after place + ViewInput | `3abba82`, `a5e2cb5` |
| **cyber-board** | i18n / settings volume + ViewInput | `fde512a`, `9cc91c1` |
| **Camera zoom/rotate** | games **2, 3, 5, 8, 9** via kit ViewInput 0.3.16 | **2** data-fuse `c1de6dc` · **3** neon-recall `952427c` · **5** cyber-mini-pack `7ec2da9` · **8** cyber-board `9cc91c1` · **9** cyber-tower `a5e2cb5` |

### New games
| Game | Tier | HEAD | Live |
|---|---|---|---|
| **neon-swarm** 暴走機甲 RAMPAGE MECH | **Gold** · wip | **`832096d`** v0.5.0 rebrand / three frames / human manhunt | https://fung2222.github.io/neon-swarm/ |
| **neon-sort** 霓虹歸位 | **Silver** · wip | **`77536f0`** v0.2 · 12 boards + endless | https://fung2222.github.io/neon-sort/ |

Per-game detail: `neon-swarm/docs/HANDOFF.md` (full) · `neon-sort/docs/HANDOFF.md` (brief).

### Hub
- WIP cards + thumbs for swarm + sort (`00ec8d2`, `803e3e9`, `501e4e6`).
- Lab/portal stays **unlisted** — path only from Roy / agent memory, never in README or this file’s git history as a concrete folder.

---

## Bilingual kit menu-home rules (summary)
Every game `#screen-start.menu-home`:
- Zones: top / brand (mid-high) / CTA (Start lower) / meta.
- Icons on home only (kit **≥ 0.3.15**): **house** → Arcade Menu · **book** → howto (玩法｜操控｜私隱) · **gear** → settings (lang / mute / volume / glow).
- All strings via kit `i18n` zh-HK + en; `cyber.lang`.
- In-play camera: kit **ViewInput** (`input/view.js`, v0.3.16). Swipe/stick games: `oneFingerOrbit: false`.

## Hub `games.json` tiers
| Tier | ids |
|---|---|
| Free | cyber-snake, data-fuse, **corrupt-pet (wip)**, neon-recall, cyber-mini-pack |
| Silver | neon-stick-run, **neon-sort (wip)**, neon-stick-duel (standalone fighter line) |
| Gold | cyber-ninja, cyber-board, cyber-tower, **neon-swarm (wip)** |

Trial: 3 runs/day + per-game caps. Source: root `games.json`.

## Suggested next for the next agent
1. Roy playtest swarm + sort; fix feedback.
2. Fighter = separate product (`neon-stick-duel` PRODUCT-SPLIT); hub stays casual only.
3. Sync hub stage/thumbAlt if still lagging swarm v0.3.3 wilderness copy.
4. Finish trial → hub `openStore` wiring on both new games.
5. No public lab path; no sono ports; no trademarked EVA naming.

## Quick clone map
```
fung2222/cyber-arcade   ← this repo (hub + games.json + docs)
fung2222/cyber-kit      ← shared kit (tag v0.3.16)
fung2222/neon-swarm     ← Gold survivor WIP (display name 暴走機甲 / RAMPAGE MECH)
fung2222/neon-sort      ← Silver sort puzzle WIP
fung2222/neon-stick-duel← 機甲雷台 STANDALONE fighter (PRODUCT-SPLIT 2026-10-25)
```
