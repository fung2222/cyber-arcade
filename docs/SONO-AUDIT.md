# SONO games audit (read-only) — 2026-10-02

- **Repo:** fung2222/sono (public, "Sono World") · live https://fung2222.github.io/sono/ (legacy Pages from main:/).
- **Snapshot audited:** HEAD `7282c98` (2026-07-26).
- **Method:** full read of every game folder plus headless play at 412×915 (touch) and 1280×800.
- **Rule:** the audit is for concepts only. No code, constants or configs from sono are reused in CYBER ARCADE.

## 1. Inventory
| # | Shown name | Path | Linked from hub? | Genre / mechanics | Tech | State |
|---|---|---|---|---|---|---|
| 1 | Cyber Ninja vs Cosmic Monster | `games/cyber-ninja-vs-monster/` | yes | vertical boss-wave shooter, energy ultimate | Canvas2D 540×960, no audio, no save | ~70 %, works; no back link, no best score |
| 2 | 猜拳火柴人 RPS BATTLE | `rps-battle/` | yes | RPS vs random AI, stickman | Canvas2D + DOM | **BROKEN**: a missing `.log` element throws a TypeError every round; the hub description ("三局兩勝 / 搞笑語音") is false |
| 3 | Stickman Fighter | `fighter/` | yes | 1v1 brawler, 4 weapons, 3 AI modes, TTS | Canvas2D, 1,895 lines, 39 commits (a stub + revert) | works; most polished legacy game; uses △□○✕ buttons |
| 4 | Stickman Fighter v1 | `stickman-fighter-v1/` | yes | same game, older | Canvas2D | **DUPLICATE** of fighter's first commit (5-line diff); labelled "強化動畫·新角色" (wrong) |
| 5 | 貪食蛇 | `snake/` | yes | classic snake | Canvas2D | starts instantly and dies in ~1 s; no start/pause; death screen says 爆機喇 ("you beat it"); reverse-turn bug. Superseded by cyber-snake |
| 6 | XO過三關 | `tictactoe/` | yes | tic-tac-toe vs minimax | DOM | default difficulty is unbeatable; easy == medium code; hub description (三關挑戰·雙人對戰) false |
| 7 | 2048 | `2048/` | **no (orphan)** | merge puzzle | DOM, no tile animation | works; dead variables |
| 8 | 記憶配對 | `memory/` | **no (orphan)** | memory pairs, combo, timer | DOM + CSS 3D flip | **BROKEN on touch**: `touchend` preventDefault suppresses the click (0 flips on tap); easy/hard identical |
| 9 | AI 指令格鬥 | `ai-fighter/` | **no (orphan)** | "Phase 1" pixel 2P fighter | Canvas2D | **BROKEN**: crashes in `renderSprite` on the first frame; character named "RYU" (Capcom) |
| 10 | 反應挑戰 | modal inside `index.html` (reactTrigger) | toolbox | reaction-time test | DOM | no false-start detection |

## 2. Mess / tech debt
- The games array is inline in a 358 KB `index.html`.
- Dead `toggleGame` code and duplicate CSS.
- Three different tool-trigger mechanisms.
- The `games/improved/` icon set is never used.
- Docs contradict reality:
  - they reference the deleted `games/all.html`, `reports/` and `backups/`
  - "fung2822" typo
  - outdated tool counts
- High-score localStorage keys are inconsistent (no shared prefix or config).
- The Pages workflow was deleted; the site relies on legacy branch publishing.

## 3. Play Store risks
- **"2048"** in a store title: trademark/spam risk. Remake is named 數據熔合 DATA FUSE.
- **△○✕□ buttons** are Sony PlayStation trade dress. Remake uses original icons.
- **"RYU"** is a Capcom character. ai-fighter is retired.
- **Kid appeal** (memory, RPS) could pull the app into the Families policy. Set target audience to 13+.
- **Wheel / fortune tools** are gambling-like. Not ported.
- **Spam policy:** many thin, near-duplicate apps get rejected. Small games are merged into CYBER MINI PACK; the fighter duplicates collapse into NEON STICK DUEL.

## 4. Decisions
| SONO item | CYBER ARCADE outcome |
|---|---|
| 貪食蛇 | → **CYBER SNAKE** (done) |
| 2048 | → **DATA FUSE 數據熔合** (done) |
| 記憶配對 | → **NEON RECALL 霓虹記憶** |
| Cyber Ninja vs Cosmic Monster | → **CYBER NINJA 賽博忍者：星海魔獸** (3D, auto-fire) |
| 猜拳 + 過三關 + 反應挑戰 | → **CYBER MINI PACK** (one game, three modes) |
| Stickman Fighter (+ v1) | → **NEON STICK DUEL 霓虹火柴人** (one-thumb, original icons) |
| AI 指令格鬥 | ❌ retired |
| Wheel / fortune tools | ❌ not ported |
