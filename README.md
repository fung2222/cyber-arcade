# CYBER ARCADE 賽博街機

> 一系列賽博朋克 3D 小遊戲 · 適合搭車時玩幾分鐘 · 手機優先，電腦都玩得 · Three.js

## 簡介 Overview
CYBER ARCADE 係將舊 SONO 網站入面嘅小遊戲**由零重新製作**嘅系列。每隻遊戲都係獨立 repo，共用 [cyber-kit](https://github.com/fung2222/cyber-kit) 引擎（霓虹城市、bloom、粒子、合成音效、觸控、AdMob 封裝），目標係逐隻上架 Google Play。

## 遊戲 Games
遊戲清單同狀態以 [`games.json`](games.json) 為準（single source of truth）。

| 遊戲 | 類型 | Repo | 狀態 |
|---|---|---|---|
| 賽博蛇 CYBER SNAKE | 3D 貪食蛇 | [cyber-snake](https://github.com/fung2222/cyber-snake) | ✅ 完成 |
| 數據熔合 DATA FUSE | 3D 數字合併 | [data-fuse](https://github.com/fung2222/data-fuse) | ✅ 完成 |
| 霓虹記憶 NEON RECALL | 3D 記憶配對 | [neon-recall](https://github.com/fung2222/neon-recall) | ✅ 完成 |
| 賽博忍者 CYBER NINJA | 3D 直向射擊 | [cyber-ninja](https://github.com/fung2222/cyber-ninja) | ✅ 完成 |
| 賽博小遊戲合集 CYBER MINI PACK | 包剪揼 · 過三關 · 神經反射 | [cyber-mini-pack](https://github.com/fung2222/cyber-mini-pack) | ✅ 完成 |
| 霓虹火柴人 NEON STICK DUEL | 單手 3D 對決 | [neon-stick-duel](https://github.com/fung2222/neon-stick-duel) | ✅ 完成 |

## 文件 Docs
- [docs/ARCADE-HANDOFF.md](docs/ARCADE-HANDOFF.md) — 風格指引、技術、結構、製作次序、Play/AdMob 計劃、命名規則
- [docs/MONETIZATION.md](docs/MONETIZATION.md) — 收費模式：免費／銀級／金級、試玩、廣告、Google Play Billing 計劃 · monetisation model
- [docs/SONO-AUDIT.md](docs/SONO-AUDIT.md) — 舊 SONO 遊戲審查報告

## 規則 Ground rules
1. **唔會由 sono 搬任何代碼、常數或設定**，只沿用概念，全部重寫。
2. 細遊戲（包剪揼、過三關、反應測試）合併成一隻 CYBER MINI PACK，避免 Play「重複/內容單薄」政策問題。
3. 所有頁面暫時 `noindex`，`robots.txt` 全站 Disallow。
