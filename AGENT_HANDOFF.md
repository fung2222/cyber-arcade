# CYBER ARCADE — Agent session handoff (2026-10-17 → 2026-10-19)

> Short bridge for the **next AI**. Deep series bible: [`docs/ARCADE-HANDOFF.md`](docs/ARCADE-HANDOFF.md) · monetisation: [`docs/MONETIZATION.md`](docs/MONETIZATION.md).  
> **Do not put the unlisted lab/portal path in any public commit.** Say: *use Roy’s unlisted lab URL from memory/owner*.

**Contact style (Roy):** 解釋用繁體中文（廣東話都睇得明）；code、路徑、指令、commit message 用英文。遊戲 UI：**zh-HK 先行**，英文細字喺下面。Timezone **Asia/Hong_Kong**.

**This repo HEAD at handoff write:** see git after push · prior hub WIP commit `501e4e6`.

---

## Session outcomes

### Paused
- **neon-stick-duel** (fighter) — paused after sprite **FULL RESTART** `c1c82ab` (2026-10-17). Do not resume phys/anime tracks unless Roy asks. Live still Pages-enabled; treat as paused R&D.

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
| Free | cyber-snake, data-fuse, neon-recall, cyber-mini-pack |
| Silver | neon-stick-duel, neon-stick-run, **neon-sort (wip)** |
| Gold | cyber-ninja, cyber-board, cyber-tower, **neon-swarm (wip)** |

Trial: 3 runs/day + per-game caps. Source: root `games.json`.

## Suggested next for the next agent
1. Roy playtest swarm + sort; fix feedback.
2. Keep fighter paused.
3. Sync hub stage/thumbAlt if still lagging swarm v0.3.3 wilderness copy.
4. Finish trial → hub `openStore` wiring on both new games.
5. No public lab path; no sono ports; no trademarked EVA naming.

## Quick clone map
```
fung2222/cyber-arcade   ← this repo (hub + games.json + docs)
fung2222/cyber-kit      ← shared kit (tag v0.3.16)
fung2222/neon-swarm     ← Gold survivor WIP (display name 暴走機甲 / RAMPAGE MECH)
fung2222/neon-sort      ← Silver sort puzzle WIP
fung2222/neon-stick-duel← fighter PAUSED
```
