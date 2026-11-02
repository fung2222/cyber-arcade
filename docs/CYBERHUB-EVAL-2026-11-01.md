# CYBER ARCADE / CyberHub 全項目評估報告（畀其他 AI 跟進）

> Owner: Roy（fung2222）· Date: 2026-11-01（Asia/Hong_Kong）· Scope: `fung2222/cyber-arcade` + `cyber-kit` + 12 個遊戲 repo。  
> **作者：Kimi AI（Roy 2026-11-01 委託）；Roy 2026-11-02 確認：呢份就係當時嘅全 apps 方向 review，作為方向 baseline。**
> 目的：誠實評估而家成個 CyberHub 生態，列清楚好／壞／未完成／值得保留／要抽出嘅邊界，畀下一個 AI 唔使重新估。

---

## 0. 一句結論

CyberHub 嘅**骨架係啱**：一個 hub + 每隻遊戲獨立 repo + 共用 `cyber-kit` + `games.json` 單一真相 + zh-HK/EN + endless + Play 分層收費。  
但而家**最大問題係 scope 同產能**：12 隻遊戲入面有兩隻重型作（`neon-swarm` 失控飛碟、`neon-stick-duel` 機甲雷台）會拖垮成個休閒 hub。建議 CyberHub 核心收斂做「短、好玩、快捷」；兩隻重型作改為**抽出候補／獨立產品線**，唔好再當佢哋係 hub MVP 必備。

---

## 1. 事實基準（已查）

- Hub：`fung2222/cyber-arcade`，root 已直接係大廳（仍 `noindex,nofollow` + `robots.txt` Disallow）；舊 `lab-kqsverjfjd/` 路徑只 redirect 去 root。Single source of truth = `games.json`。
- 遊戲數：`games.json` 有 12 隻；9 done、3 wip（`corrupt-pet`、`neon-sort`、`neon-swarm`）。全部 `play=not-submitted`。
- 共用層：`fung2222/cyber-kit`；每隻遊戲 vendor 一份 `vendor/cyber-kit/`。2026-11-01 已同步返回主頁 fallback 去 `../cyber-arcade/`，kit 查詢 bump 到 v0.3.19。
- 風格／上架規矩：見 `docs/ARCADE-HANDOFF.md`、`docs/MONETIZATION.md`、`docs/PRODUCT-SPLIT.md`。
- 已知風險：`neon-swarm` 手機 mid-run WebGL context loss（「繪圖暫時中斷」）未真機根治；`neon-stick-duel` 已定性做獨立格鬥產品，但美術圖貼／方向仍然係關鍵瓶頸。

---

## 2. 值得保留（唔好拆散）

1. **`games.json` 單一真相**：遊戲名、狀態、tier、trial、thumb、preview、howto 都集中。下一個 AI 改遊戲狀態要先改呢度。
2. **`cyber-kit` 共用引擎**：Three.js r169、i18n、HUD、input、storage、theme、endless、ads/platform 封裝。好處係每隻遊戲唔使重寫底層；壞處係 kit 一改要同步多個 repo（見 §6）。
3. **休閒核心遊戲**：`cyber-snake`、`data-fuse`、`neon-recall`、`cyber-mini-pack`、`cyber-ninja`、`cyber-board`、`cyber-tower`、`neon-stick-run`。呢啲先係 CyberHub 應該賣嘅「搭車幾分鐘」體驗。
4. **雙語 + endless + noindex 紀律**：符合之後 Play 上架同私隱要求；未公開前唔好亂開 SEO。
5. **測試文化**：hub 有 `node --test tests/`；多隻遊戲有 logic/smoke 測試。要保持「改完要跑」。
6. **PRODUCT-SPLIT 文件**：已經寫明 hub 唔承接重型格鬥圖貼流水線，呢條界線要守住。

---

## 3. 壞處／風險（要認）

1. **Scope 太大**：12 隻遊戲對一個人／小團隊係重。每隻都要 vendor kit、cache bump、Play 包裝、store listing、privacy、 closed test。未上架已經有維護負擔。
2. **兩隻重型作扭曲定位**：`neon-swarm`（暴走機甲 → 失控飛碟）同 `neon-stick-duel`（機甲雷台）唔係休閒小品；佢哋會令 CyberHub 變成「乜都做」而失焦。
3. **手機 GPU 生死線未過**：`neon-swarm` 就算已減壓、加咗 `webgl-guard`，真機 mid-run 穩定仍未驗收。休閒 hub 唔應該被一隻高載 3D survivor 綁死。
4. **美術產能不足**：`neon-stick-duel` 需要大量角色圖貼／姿勢表；而家方向未穩。格鬥作冇靚角色，好難賣。
5. **未真正上架**：所有遊戲 `play=not-submitted`；billing 只係 web stub / RevenueCat skeleton；AdMob、UMP、data safety、app-ads.txt、closed test 12 人 × 14 日未開始。
6. **小缺失**：`corrupt-pet` 未有 `privacy.html`、未用完整 cyber-kit HUD；`neon-sort` / `neon-swarm` / `corrupt-pet` 缺 hub preview webm；個別文件會隨 root/lab 合併後需要再校準。

---

## 4. 兩隻抽出候補（照 Roy 方向）

### 4.1 `neon-swarm` 失控飛碟（前暴走機甲）— 抽出候補 #1

**定位問題**：3D 逃亡射擊／survivor 重量級，手機 GPU 風險高，同 CyberHub「短平快」唔夾。  
**已做**：主角改青色圓碟飛碟、畫面清晰度提高、武器／HUD／zone／敵人系統大幅擴充。  
**死穴**：手機 mid-run「繪圖暫時中斷」未根治；桌面 SwiftShader/真 GPU 測試唔等於 Roy 手機。  
**決策閘（hard gate）**：
- 只准再做**一次**有真機驗收嘅穩定性修正（明確裝置／瀏覽器／GPU／DPR／bloom／敵人數／版本 SHA）。
- 若 Roy 手機 2–5 分鐘內仍出現 `fault=lost`／「繪圖暫時中斷」：**抽出 CyberHub 核心，拆重做**。重做方向唔好再追加 Three.js 設定；照 skill 記錄，簡化已試到盡，下一步應係 **2D Canvas rewrite** 或者暫停。

### 4.2 `neon-stick-duel` 機甲雷台 — 有條件保留，但唔入 CyberHub MVP

**定位問題**：已決定抽出做獨立 Google Play 格鬥作（SF/KOF、橫向、雙手、大量圖貼）。佢可以存在，但唔應該拖住 hub。  
**保留理由**：格鬥手感、frame data、hitstop、ladder/endless、Action Test QA 模式有價值。  
**死穴**：人物圖貼／整體圖像未夠靚；如果冇清楚美術方向，做完都係半成品。  
**決策閘（hard gate）**：
- 集中資源完成**一個角色**（建議 swordsman）全套 pose checklist：idle/move/jump/guard/hit/ko/victory + 每招 startup/active/recover。
- 做一次「美術方向 sprint」：同一角色出 2–3 個方向（例如 bitmap mech、2D sprite sheet、procedural toon）各一個 Action Test 對比。
- 若 Roy 睇完仍覺得「唔靚／冇方向」：**抽出並暫停**，唔好再喺 hub 入面消耗。

---

## 5. CyberHub 生態建議（點樣先健康）

1. **Hub 核心 MVP 只留 8 隻休閒作**：snake / data-fuse / recall / mini-pack / ninja / board / tower / stick-run。`neon-sort` 完成後可入；`corrupt-pet` 當實驗小品，補 privacy 先好上架。
2. **抽出線獨立**：`neon-swarm` 同 `neon-stick-duel` 唔計入 hub 上架必需；hub 最多保留一張「試玩／了解」卡，唔好畀佢哋阻住核心 8 隻嘅 Play 流程。
3. **凍結新遊戲**：直到核心 8 隻完成 Android 包裝 + closed test + 至少一隻正式提交，唔開新坑。
4. **收費先簡單**：Free/Silver/Gold 已夠；未接真 billing 前唔好再加複雜商品。所有 trial → openStore → restore 要真機行一次。
5. **裝置驗收表**：每隻遊戲上架前要有 Roy 手機實測：開 game、玩 3 分鐘、返回主頁、暫停/恢復、黑屏/繪圖中斷、聲音開關、語言切換。
6. **kit 變更規矩**：改 `cyber-kit` 後要同步每隻遊戲 vendor copy；child module 改內容要 bump 兩層 query（kit.js export line + game index import map）；直接 import `platform/hub.js` 嘅遊戲要自己 bump。

---

## 6. 未完成清單（按優先）

P0（阻上架）
- 核心 8 隻 Android 包裝未做（Capacitor 8 + AdMob v8 + App/Haptics）。
- 真 billing 未接（而家 web stub / RevenueCat skeleton）；Restore Purchases 未真機驗。
- Play closed test 未開始（12 testers × 14 consecutive days）。
- Privacy/data safety/app-ads.txt/UMP consent 未齊。
- `corrupt-pet` 缺 `privacy.html`。

P1（阻質量）
- `neon-swarm` 真機 GPU 驗收；過唔到就抽出/拆重做。
- `neon-stick-duel` 美術方向 sprint；過唔到就抽出/暫停。
- `neon-sort` 由 wip 收到 done；`corrupt-pet` 補 kit HUD 或明確標示 experimental。
- 全遊戲 CI smoke：每隻最少 boot + start + pause + return-home + zero console error。

P2（可後做）
- Hub previews 補齊（`neon-sort`、`neon-swarm`、`corrupt-pet`）。
- Store listing screenshots、feature graphic、short/full desc。
- 公開 SEO（移除 noindex）留到真係想 web 公開先做；而家方向係 app 優先。

---

## 7. 下一個 AI 開工前必讀

- 先讀：`cyber-arcade/docs/PRODUCT-SPLIT.md`、`cyber-arcade/docs/ARCADE-HANDOFF.md`、`cyber-arcade/docs/MONETIZATION.md`、本報告。
- 改遊戲狀態/tier：改 `cyber-arcade/games.json`，唔好只改 README。
- 改 kit：記住 vendor copy 規矩；唔好喺遊戲 repo 直接改 `vendor/cyber-kit/` 當修 kit。
- `neon-swarm`：睇 `neon-swarm/docs/MOBILE-WEBGL-DIAGNOSIS.md`、`docs/HANDOFF.md`、`cyber-arcade` skill reference `references/neon-swarm.md`。冇真機數據唔好話「已修」。
- `neon-stick-duel`：睇 `neon-stick-duel/docs/PRODUCT-SPLIT.md`、`AGENT.md`、`docs/SPRITE-PIVOT.md`。唔好將佢屈返做單手休閒。

---

## 8. 建議而家即刻做嘅 3 件事

1. Roy 確認核心 8 隻名單；將 `neon-swarm` / `neon-stick-duel` 喺 roadmap 標記為「抽出線，唔阻 hub」。
2. 開一個「CyberHub MVP 上架」checklist：Capacitor、billing、closed test、privacy/data safety、store assets。
3. 對兩隻抽出候補各開一個 hard-gate issue：swarm = 真機 GPU；duel = 一個角色美術方向。過唔到就抽。

---

## 9. 唔准再做

- 唔好由 SONO 搬 code。
- 唔好開新遊戲坑。
- 唔好將 `neon-stick-duel` 屈做休閒小品。
- 唔好用桌面/SwiftShader 當手機 GPU 證據。
- 未正式公開前，唔好移除 noindex / 開放 robots。
