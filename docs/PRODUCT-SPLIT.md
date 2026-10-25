# Product split — 2026-10-25

> Durable handoff for **any AI** opening the CYBER ARCADE hub or a per-game repo.  
> 持久交接：任何打開 hub／系列 repo 嘅 AI 都要睇呢份。  
> Owner: Roy（fung2222）· Timezone: Asia/Hong_Kong.

---

## Decision（必須原文照抄 / must state verbatim）

1. **機甲雷台** (repo fung2222/neon-stick-duel) will be extracted as a **standalone Google Play fighting game** (Street Fighter / King of Fighters–style): heavy sprite art, landscape, two-hand controls — NOT a one-hand casual time-killer.
2. **cyber-arcade hub** (fung2222/cyber-arcade + per-game repos) stays the place for **short, fun, quick cyberpunk mini-games** suitable for Play hub (free + Silver HK$18 / Gold HK$28 model, bilingual zh-HK/EN, endless modes).

### 粵／繁補充
1. **機甲雷台**（`fung2222/neon-stick-duel`）抽出做**獨立 Google Play 格鬥遊戲**（街頭霸王／拳皇類型）：大量圖貼、橫向、雙手——**唔係**單手休閒小品。
2. **本 hub + 各小遊戲 repo** 繼續只做**短、好玩、快捷嘅賽博朋克小遊戲**（免費 + 銀 HK$18／金 HK$28、雙語 zh-HK/EN、無盡模式）。

---

## English — Hub scope

| This hub is | This hub is not |
|---|---|
| Short · fun · quick cyberpunk mini-games | A home for heavy SF/KOF fighter production |
| Free + Silver HK$18 + Gold HK$28 Play model | The shipping shell for 機甲雷台 as a full fighter SKU |
| Bilingual zh-HK / EN · endless modes | One-hand-only dogma forced onto the fighter |

**機甲雷台** lives in [`fung2222/neon-stick-duel`](https://github.com/fung2222/neon-stick-duel) with its own product bible: [`neon-stick-duel/docs/PRODUCT-SPLIT.md`](https://github.com/fung2222/neon-stick-duel/blob/main/docs/PRODUCT-SPLIT.md). Hub may still list a playable web card for discovery, but agents must treat the **fighter as a separate product** (extract → Capacitor → closed test → store).

Series style for **casual** games: [`docs/ARCADE-HANDOFF.md`](ARCADE-HANDOFF.md) · monetisation: [`docs/MONETIZATION.md`](MONETIZATION.md) · session bridge: [`../AGENT_HANDOFF.md`](../AGENT_HANDOFF.md).

---

## 中文（zh-HK）— Hub 定位

| Hub 做 | Hub 唔做 |
|---|---|
| 短、好玩、快捷賽博小遊戲 | 承接重型格鬥圖貼流水線 |
| 免費／銀／金 Play 合集模型 | 當成機甲雷台唯一上架殼 |
| zh-HK 先行 + EN · 無盡模式 | 逼格鬥作變成單手消磨時間 |

格鬥作詳情同製作次序：見 `neon-stick-duel` 嘅 `docs/PRODUCT-SPLIT.md`／`AGENT.md`。

---

## Fighter build order (for agents who open hub then fighter)

Recorded on the fighter side; hub agents should not run this pipeline inside casual repos:

Concept → rules/controls → complete ONE character pose set + frame data → feel polish → second character → modes/UI → extract standalone Capacitor/Play app → closed test → store.

Art: lock canvas/ORIGIN → pose checklist (idle/move/jump/guard/hit/ko/victory + per-move startup/active/recover) → finish swordsman first → clone list → backgrounds minimal.

---

## `games.json`

Root `games.json` remains the hub catalogue. Entry `neon-stick-duel` (display **機甲雷台**) may stay listed for web play, with `productSplit` / stage notes pointing here. **Do not** design new hub-only casual constraints that break the standalone fighter roadmap.

---

Recorded **2026-10-25** (Asia/Hong_Kong).
