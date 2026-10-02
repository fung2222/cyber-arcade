# CYBER ARCADE — 收費模式 Monetisation model

狀態 Status: **Roy 已拍板 decided 2026-10-02** · 分級更新 tiers updated 2026-10-02 (Roy's free-genre rule) · 原型 prototype: unlisted test portal hub (`js/hub.js`, `js/entitlements.js`; path given privately) · 真正收費只限日後 Google Play App 版 · real billing = Android app build only · **網頁版暫不公開 web not public for now — straight to the app.**

> **EN summary.** One hub app (CYBER ARCADE) bundles every game offline (wrapped with Capacitor for Android later). Three access levels: **Free**, **Silver 銀級 HK$18**, **Gold 金級 HK$28** — one-time Google Play Billing **non-consumable** in-app products `tier_silver`, `tier_gold`, plus `tier_gold_upgrade` (HK$10, Silver owners only). Gold includes everything in Silver. **Each unlock includes all future games added to that tier.** Free players can play the Free games fully and try every Silver/Gold game (**3 runs per day per game**, with an in-game cap in the app build). Free players see interstitial ads only at natural breaks (game over / result screens) and opt-in rewarded ads (continue / undo). **Any paid tier removes forced/interstitial ads**; opt-in rewarded ads may stay. Purchases are restorable (Restore Purchases). Google's fee is 15 %; prices are set per country with Play price templates. The strongest games (e.g. CYBER BOARD) may later also ship as free standalone apps that funnel players to the hub. Recommended billing plugin: **RevenueCat `@revenuecat/purchases-capacitor`**. **Roy's rule: any game whose genre already has lots of free equivalents on Google Play is Free** (so DATA FUSE, a 2048-like, is Free). The web is **not public for now** (root page = neutral placeholder; games stay `noindex` and unlinked); paid gating is app-only.

---

## 1. 模式 The model (recorded as decided)

| | 內容 (zh-HK) | English |
|---|---|---|
| App | 一個大廳 App（cyber-arcade）離線包晒所有遊戲；日後用 Capacitor 包成 Android App | One hub app bundling all games offline; Capacitor Android wrapper later |
| 級別 | 免費 Free · 銀級 Silver HK$18 · 金級 Gold HK$28 | Free · Silver HK$18 · Gold HK$28 |
| 收費方式 | 一次性購買、永久擁有嘅 Google Play Billing **非消耗型 (non-consumable)** 應用程式內產品；**唔係訂閱** | One-time, permanent Google Play Billing non-consumable in-app products; **not a subscription** |
| 產品 ID | `tier_silver`、`tier_gold`、`tier_gold_upgrade`（已有銀級嘅玩家 HK$10 升金級） | `tier_silver`, `tier_gold`, `tier_gold_upgrade` (Silver → Gold for HK$10) |
| 包含關係 | 金級包括銀級全部內容 | Gold includes everything in Silver |
| 日後新遊戲 | **每個級別嘅解鎖，包括日後加入該級別嘅所有新遊戲**（UI 同文件都要清楚寫明） | **Each tier unlock includes all future games added to that tier** (stated in UI + docs) |
| 免費玩家 | 免費遊戲任玩；銀／金級遊戲有試玩（每日 3 局，App 版再加局內上限，見 §4） | Free games fully playable; Silver/Gold games have a trial (3 runs/day + in-game cap in the app build) |
| 廣告 | 免費玩家：插頁廣告只喺完局／自然停頓位；獎勵廣告自選（復活／復原） | Free: interstitials only at game over / natural breaks; rewarded ads opt-in (continue / undo) |
| 付費玩家 | 任何付費級別都**移除強制／插頁廣告**；自選獎勵廣告可以保留 | Any paid tier removes forced/interstitial ads; opt-in rewarded ads may remain |
| 還原 | 一定要有「還原購買 Restore Purchases」掣 | Purchases must be restorable (Restore Purchases button) |
| 手續費 | Google 抽 15 %（每年首 US$1M 收入；要喺 Play Console 加入 15 % 方案／帳戶群組，上架前再核實） | Google fee 15 % (first US$1M/year; enrol in Play Console — verify before launch) |
| 各地定價 | 用 Play 價格範本 (pricing templates) 按國家定價 | Prices vary per country via Play price templates |
| 獨立 App | 最強嘅遊戲（例如 CYBER BOARD）日後可以另出免費獨立 App，引流返大廳 | Strongest games may later ship as free standalone apps funnelling to the hub |

淨收入參考（香港，15 % 手續費後）Net per sale in HK after the 15 % fee: Silver HK$18 → **HK$15.30** · Gold HK$28 → **HK$23.80** · Upgrade HK$10 → **HK$8.50**. (RevenueCat is free under US$2.5k monthly tracked revenue, see §6.)

## 2. 級別比較 Tier table

| | 免費 FREE | 銀級 SILVER | 金級 GOLD |
|---|---|---|---|
| 價錢 Price (HK) | HK$0 | HK$18 一次性 one-time | HK$28 一次性 one-time（銀級升級 HK$10 / upgrade from Silver HK$10） |
| Play product | — | `tier_silver` | `tier_gold` · `tier_gold_upgrade` |
| 免費遊戲 Free games | ✅ | ✅ | ✅ |
| 銀級遊戲 Silver games | 試玩 trial | ✅ | ✅ |
| 金級遊戲 Gold games | 試玩 trial | 試玩 trial | ✅ |
| 日後新遊戲 Future games | 日後新免費遊戲 new Free games | **日後加入銀級嘅所有新遊戲** all future Silver games | **日後加入銀級或金級嘅所有新遊戲** all future Silver + Gold games |
| 插頁廣告 Interstitials | 有，只喺自然停頓位 yes, natural breaks only | ❌ 冇 none | ❌ 冇 none |
| 獎勵廣告 Rewarded (opt-in) | ✅ 自選 | ✅ 自選 | ✅ 自選 |

## 3. 遊戲分級 Tier assignment (`games.json` → `tier`)

**Roy 嘅分級規則（2026-10-02）：如果一隻遊戲嘅類型喺 Google Play 已經有大量免費同類遊戲，就放免費級。** 付費級只放有獨特玩法／份量大嘅遊戲。
**Roy's rule (2026-10-02): any game whose genre already has lots of free equivalents on Google Play goes to FREE.** Paid tiers are for distinctive, content-heavy games.
Edit `tier` in [`games.json`](../games.json) to change it — the hub, store lists and trials follow automatically.

| 級別 Tier | 遊戲 Games | 理由 Why |
|---|---|---|
| 免費 Free | 賽博蛇 CYBER SNAKE · 霓虹記憶 NEON RECALL · 賽博小遊戲合集 CYBER MINI PACK · 數據熔合 DATA FUSE | 貪食蛇、記憶配對、包剪揼／過三關、2048 類喺 Play 上面都有大量免費版 → 免費，做引流同廣告收入 · snake, memory match, RPS/tic-tac-toe and 2048-likes all have many free equivalents → Free funnel + ad revenue |
| 銀級 Silver | 霓虹火柴人 NEON STICK DUEL · 霓虹火柴人跑酷 neon stickman parkour（製作中 in production） | 中型、有自己特色嘅完整遊戲 + 無盡模式 · mid-size distinctive games with endless modes |
| 金級 Gold | 賽博棋門 CYBER BOARD · 賽博忍者：星海魔獸 CYBER NINJA · 霓虹堡壘 NEON BASTION（cyber-tower，塔防 tower defense） | 最大型：棋門係 4 合 1 + AI + 無盡塔；忍者係有巨獸戰嘅完整射擊；堡壘有 8 張地圖、5 種塔 × 3 級、無盡模式 · largest: 4-in-1 board games, a full boss shooter, and an 8-map tower defense with endless mode |

已決定 Decided: DATA FUSE 由銀級改為免費（2048 類）· DATA FUSE moved Silver → Free under the rule above.

## 4. 試玩規則 Trial rules (Silver / Gold games, Free players only)

- **一局 = 由大廳開一次遊戲** · one run = one launch from the hub. 每隻遊戲每日 **3 局**，本地時間午夜重置 · 3 runs per game per day, reset at local midnight (`games.json` → `trial.runsPerDay`).
- 大廳顯示「試玩 · 今日剩 N/3 次」；開始試玩前會彈出試玩說明；用完再撳就會彈出解鎖畫面，並講明原因 · the hub shows "TRIAL · N/3 left today", a trial sheet before each run, and the unlock screen (with a reason banner) once exhausted.
- App 版另加局內上限（遊戲讀 `trial=1`，見 §8）· the app build adds an in-game cap per run (games read `trial=1`, §8):

| 遊戲 Game | 級別 | 每日 Runs/day | 局內上限 In-game cap (app build) |
|---|---|---|---|
| NEON STICK DUEL | Silver | 3 | 只開放塔第 1–3 層 · tower floors 1–3 |
| CYBER NINJA | Gold | 3 | 玩到第 5 波（第一隻巨獸）· up to wave 5 (first boss) |
| CYBER BOARD | Gold | 3 | AI 第 1–2 級 + 無盡塔第 1–3 層 · AI levels 1–2 and tower floors 1–3 |
| NEON BASTION (cyber-tower) | Gold | 3 | 戰役只開放地圖 1–2；無盡模式玩到第 10 波，之後彈解鎖提示返大廳（遊戲已實作 `trial=1`）· campaign maps 1–2; endless up to wave 10, then an unlock prompt back to the hub (already implemented in the game) |

試玩規則維持每日 3 局 + 局內上限（Roy 冇反對，2026-10-02 確認）· Trial rule stays 3 runs/day + in-game caps (Roy did not object; confirmed 2026-10-02).

Trial 計數存喺本地（`cyber.arcade.trial`）；清 App 資料或者改系統日期可以重置 —— 價值低，接受呢個風險，唔值得做伺服器。Trial counts are local only; wiping app data or changing the clock resets them — an accepted, low-value risk.

## 5. 廣告規則 Ad rules

- **免費玩家 Free:** 插頁廣告**只**喺自然停頓位（完局、結果畫面、玩家撳「下一關／再玩」之後），永遠唔會喺開 App、離開、關卡開始或者遊戲中途出現；沿用 cyber-kit `createAds` 嘅冷卻（≥ 3–4 分鐘、每 3 個停頓位一次、開 App 寬限期）· interstitials only at natural breaks, never at launch / exit / level start / mid-action, with cyber-kit `createAds` caps.
- **獎勵廣告 Rewarded:** 所有級別都係**自選**（復活、復原、提示），一定有「唔使喇」，只喺 reward callback 先俾獎勵 · opt-in on every tier, always with a "no thanks".
- **付費玩家 Paid (Silver / Gold):** 冇強制／插頁廣告；亦唔放 banner · no forced/interstitial ads (and no banners).
- 試玩局都係免費玩家，所以會照常有自然停頓位插頁廣告 · trial runs belong to Free players, so normal natural-break interstitials apply.
- 實作 Implementation: `ent.adsEnabled()` → `true` only on Free; `ent.rewardedAdsEnabled()` → always `true`. Games get `ads=0|1` in the launch URL and `cyber.entitlement.tier` in localStorage. **跟進 Follow-up (cyber-kit):** `createAds.showInterstitial()` should no-op when `?ads=0` or `cyber.entitlement.tier !== 'free'` (next kit tag).

## 6. 計費實作 Billing implementation plan

### 6.1 架構 Architecture (already in the prototype)
```
index.html → js/hub.js (UI)          js/strings.js (zh-HK/EN, cyber-kit i18n, localStorage cyber.lang)
              │
              ▼
        js/entitlements.js           tiers · hasAccess · trials · adsEnabled · purchase/restore · shared key
              │  backend interface: { id, isStub, init(), getProducts(), getOwned(), purchase(pid), restore() }
      ┌───────┴────────────────┐
js/billing/web-stub.js     js/billing/play-revenuecat.js
DEV / STUB (localStorage,  Capacitor app build (RevenueCat), untested skeleton
no real payment)
```
Public API (`createEntitlements({games, backend})`): `getTier()`, `hasAccess(gameId)`, `trialRemaining(gameId)`, `consumeTrial(gameId)`, `purchase(productId)`, `restore()`, `adsEnabled()`, `rewardedAdsEnabled()`, `available()`, `price(pid)`, `onChange(fn)`, `launchParams(id, opts)`. Tier is derived **only from owned product ids** (`tierFromProducts`): `tier_gold` or `tier_silver + tier_gold_upgrade` → Gold; `tier_silver` → Silver. Switching to real billing = swap the backend in `js/hub.js` (one line) when `isNativeApp()` is true.

### 6.2 Plugin 比較 Plugin options (checked 2026-10-02)

| | **RevenueCat `@revenuecat/purchases-capacitor`** | `cordova-plugin-purchase` / `capacitor-plugin-cdv-purchase` (Fovea) |
|---|---|---|
| 版本 Version | v13.6.1 (2026-09-24), Capacitor 8, Play Billing Library 8.x | v13.17.2, Capacitor 6/7/8, Play Billing Library 9.0 |
| 收據驗證 Receipt validation | 內置伺服器驗證 + 自動 acknowledge · built-in server-side validation and acknowledgement — no own backend | 要自己伺服器或者付費 iaptic 服務 · needs your own server or Fovea's paid iaptic service |
| 權益 Entitlements | Dashboard 將產品 map 去 `silver` / `gold` entitlements；退款／撤銷自動反映 · refunds/voids reflected automatically | 自己寫 · DIY |
| 還原／跨裝置 Restore | `restorePurchases()` + 同一 Google 帳戶自動同步 · syncs by Google account | `store.restorePurchases()`；冇伺服器就只靠本機查詢 · local query only without a server |
| 收費 Cost | 每月追蹤收入 (MTR) 少過 US$2.5k 免費，之後收 MTR 1 %（計手續費之前）· free under US$2.5k MTR, then 1 % | 插件免費；驗證服務另計 · plugin free, validation extra |
| 其他 Extras | 收入 dashboard、webhooks、日後 iOS 共用 · revenue charts, webhooks, iOS later | 開源、冇第三方 · open source, no third party |

**建議 Recommendation: RevenueCat.** 我哋冇自己伺服器；非消耗型產品一定要喺 3 日內 acknowledge 否則 Google 會自動退款，RevenueCat 幫手處理、驗證收據、處理退款撤銷、跨裝置還原，而以呢個規模幾乎肯定喺免費額度之內。代價係依賴第三方 + Data safety 要申報購買記錄。如果 Roy 唔想用第三方，後備方案係 `capacitor-plugin-cdv-purchase`（只做本機驗證，風險係容易被破解，但遊戲價值低，可以接受）。
We have no backend; non-consumables must be acknowledged within 3 days or Google auto-refunds. RevenueCat handles acknowledgement, validation, refunds/voids and cross-device restore, and at our scale stays inside the free tier. Trade-offs: a third-party dependency and a "purchase history" Data-safety entry. Fallback without third parties: `capacitor-plugin-cdv-purchase` with local-only validation (easier to crack; acceptable for low-value unlocks).
Note: Play Billing Library 7 is blocked for new uploads after 31 Aug 2026 — use a plugin on PBL 8+ (both options are).

### 6.3 App build wiring (to do when Capacitor is added)
1. `npm i @revenuecat/purchases-capacitor && npx cap sync android`.
2. In `js/hub.js`: `backend = isNativeApp() ? createRevenueCatBackend({ apiKey: 'goog_…' }) : createWebStubBackend(...)` (`js/billing/play-revenuecat.js` maps `configure`, `getProducts({type: NON_SUBSCRIPTION})`, `purchaseStoreProduct`, `restorePurchases`, `getCustomerInfo` → `allPurchasedProductIdentifiers`). The public SDK key is not a secret; never ship a secret key.
3. Show **prices from Play** (`priceString`), never hard-coded HK$, in the store sheet (the prototype already prefers backend prices).
4. Bundle the games under `www/games/<id>/` and launch them by relative path in the app (add an `appPath` per game in `games.json`).
5. Test with license testers on the internal track (test cards: approve / decline / slow), then refunds via Play Console → entitlement must drop after `getCustomerInfo()`.

## 7. 還原流程 Restore flow

1. 每次開 App：`init()` 向 backend 拎已擁有產品（RevenueCat `getCustomerInfo()`），失敗就用本地快取 · on every start, query owned products; fall back to the local cache when offline.
2. 商店畫面有「還原購買 Restore Purchases」掣 → `restore()`（RevenueCat `restorePurchases()`）→ 更新級別 → toast「已還原：銀級／金級」或「呢個 Google 帳戶未有購買記錄」 · button → restore → tier refresh → toast.
3. 換機／重裝：同一個 Google Play 帳戶登入，撳還原（或者開 App 自動同步）就返晒 · new device / reinstall: same Google account → restore.
4. 退款／撤銷 Refund / void: RevenueCat 會移除該產品，下次 `init()` 級別自動降返 · the product disappears and the tier drops on next refresh.
5. 原型測試：隱藏 DEV 面板「清本機快取（模擬重裝）」→ 撳還原 → 級別返嚟 · prototype: DEV panel "wipe local cache (simulate reinstall)" → Restore brings the tier back.

## 8. 權益儲存同遊戲介面 Entitlement storage + game contract

| Key / param | 內容 Content | 用途 Use |
|---|---|---|
| `localStorage cyber.entitlement` | `{ v:1, tier, products:[…], source, stub, updated }`, written on every change | 快取 + 俾遊戲讀 · cache + read by games (same origin on github.io and inside the Capacitor WebView) |
| `localStorage cyber.arcade.trial` | `{ day:'YYYY-MM-DD', used:{gameId:n} }` | 每日試玩計數 · daily trial counters |
| `localStorage cyber.arcade.devstub.owned` | web stub 嘅「Google 帳戶」· simulated account (DEV only) | 示範還原 · restore demo |
| Launch URL params | `?hub=1&tier=free|silver|gold&ads=0|1[&trial=1&trialLeft=N]` | 遊戲：`ads=0` → 唔出插頁廣告；`trial=1` → 套用 §4 局內上限 · games skip interstitials / apply trial caps |
| `localStorage cyber.lang` | `zh` / `en` | 大廳同所有遊戲共用語言 · shared language |

遊戲 repo 暫時**唔使改**；日後只需要讀 `ads` / `trial` 參數（或 `cyber.entitlement`）。The game repos are unchanged for now; later they only need to read the `ads`/`trial` params (or `cyber.entitlement`). 呢啲值喺網頁版可以俾人改 —— 只用嚟控制廣告同試玩，唔好用嚟保護有價值嘅嘢。These values are user-editable on the web; they only gate ads and trial caps.

## 9. 網頁版 vs App 版 Web vs app（Roy 2026-10-02：網頁版暫不公開，直接做 App · web not public for now, go straight to the app）

- **公開根目錄** `https://fung2222.github.io/cyber-arcade/` 只係一個中性「開發中 · 即將推出」頁（noindex，冇遊戲列表、冇商店、冇任何遊戲連結）· the public root is a neutral "in development / coming soon" placeholder — no game list, no store, no links.
- **收費大廳原型**搬咗去未公開嘅測試入口（路徑私下俾 Roy，唔寫入任何文件）；頁面用 `<base>` 指返 repo 根目錄嘅 `js/`、`css/`、`games.json` · the monetised hub prototype now lives inside the unlisted test portal (path shared privately, never written in docs); it uses `<base>` to load the hub code from the repo root.
- 每隻遊戲 repo 繼續 `noindex,nofollow` + `robots.txt` Disallow，唔會由 SONO 或任何公開頁面連過去；Pages 保持開啟（Roy 測試要用）· every game stays noindex and unlinked from SONO or any public page; Pages stays on for Roy's testing.
- 網頁版保持免費、唔宣傳；真正收費只喺 Google Play App 版 · the web stays free and unpromoted; paid gating is app-only.
- **限制 Limitation:** repo 係公開嘅，GitHub file tree 睇得到所有資料夾，知道網址就玩得 —— 只係「冇連結 + 唔收錄」，唔係真正隱藏。要真正隱藏需要：(a) 私人 repo + GitHub 付費方案（私人 repo 開 Pages 要 Pro/Team，但網站本身仍然公開；要登入先睇到嘅 Pages 只限 Enterprise Cloud），或者 (b) Cloudflare Pages + Cloudflare Access 登入保護（細團隊有免費額度）。 · The repos are public, so folders are visible in the GitHub file tree and anyone with a URL can play — it is unlinked + unindexed, not truly hidden. True hiding needs (a) private repos on a paid GitHub plan (Pages from private repos needs Pro/Team, but the site itself is still public; access-controlled Pages is Enterprise Cloud only), or (b) Cloudflare Pages behind Cloudflare Access login (free tier for small teams).

## 10. Play Console 設定步驟 Play Console setup

1. 開設付款資料／商家帳戶 (Payments profile / merchant account)，填稅務同銀行 · set up the payments profile.
2. 加入 15 % 服務費方案（帳戶群組）· enrol in the 15 % service-fee tier (account group) — verify the current wording in Play Console.
3. 上傳一個已整合 Billing（包含 `com.android.vending.BILLING` 權限）嘅 AAB 去內部測試軌，先可以建立產品 · upload a billing-enabled AAB to the internal track first.
4. 營利 → 產品 → 一次性產品 (Monetize → Products → One-time products)：建立 `tier_silver`、`tier_gold`、`tier_gold_upgrade`，雙語名稱同描述，設定 purchase option 為「購買 Buy」，再**啟用** · create and activate the 3 products.
5. 價格範本 Pricing templates：Silver、Gold、Upgrade 各一個範本，以 HK$18 / 28 / 10 為基準按國家換算；檢查各地 Silver + Upgrade ≈ Gold · one template per product; check Silver + Upgrade ≈ Gold per country.
6. 授權測試人員 License testing：加 Roy 同測試者 Gmail · add license testers.
7. RevenueCat：建立 project + Android app（package name），上傳 Play service-account JSON（Play Console → API access 授權財務權限），設定 Real-time developer notifications (Pub/Sub)，建立 entitlements `silver`（附 `tier_silver`、`tier_gold`、`tier_gold_upgrade`）同 `gold`（附 `tier_gold`、`tier_gold_upgrade`）· app logic still derives tier from product ids.
8. 封閉測試 ≥ 12 名測試者連續 14 日（新個人開發者帳戶要求），然後先申請正式版 · closed test ≥ 12 testers × 14 days before production (see ARCADE-HANDOFF §8).
9. Store listing「應用程式內購買」標示會自動出現；說明文字寫明三個級別同「日後新遊戲包括在內」嘅定義 · describe tiers and the future-games rule in the listing.

## 11. 政策同用字 Policy + wording notes

- **唔好寫「終身」「永遠」「forever」「lifetime」**。用：「一次性購買 · 唔係訂閱」、「同你嘅 Google Play 帳戶綁定，只要本 App 仍喺 Google Play 上架，都可以喺任何 Android 裝置還原」· no "forever/lifetime"; say "one-time purchase, not a subscription; tied to your Google Play account and restorable while the app is offered on Google Play".
- 「包括日後加入該級別嘅所有新遊戲」—— 呢個係承諾：日後新遊戲可以放入任何級別（包括免費），但已經放入銀／金級嘅遊戲唔可以再另外收費 · new games may go into any tier, but games in a tier must never be sold separately to that tier's owners.
- 唔好講幾多隻新遊戲或者幾時推出 · never promise a number or date of future games.
- 數碼內容一定要用 Google Play Billing（Payments policy）；App 內唔好連去其他付款方式 · digital goods must use Play Billing.
- 價錢顯示用 Play 傳返嚟嘅本地價錢字串；寫明「價錢由 Google Play 顯示，各地可能唔同」 · show Play's localised price strings.
- 廣告：只喺自然停頓位；試玩畫面同解鎖畫面唔可以夾廣告；唔好用「睇廣告先玩到」嚟扮免費 · no ads on trial/unlock screens.
- Data safety：加申報「購買記錄 Purchase history — 應用程式功能」（RevenueCat）+ 原有 AdMob 項目 · declare purchase history.
- 目標年齡 13+，唔揀兒童年齡組 · target audience 13+.
- 私隱政策加一段：購買由 Google Play 處理，我哋（透過 RevenueCat）只收到產品 ID 同匿名用戶 ID · update privacy.html for purchases.

## 12. 原型 Prototype status (2026-10-02)

- 大廳 Hub（喺未公開測試入口 in the unlisted test portal）: entry page with `<base>` → `css/hub.css` + `js/hub.js` + `js/strings.js`（cyber-kit i18n v0.2.1 vendored, `cyber.lang`, zh-HK/EN toggle）· tier badges 免費 FREE / 銀 SILVER / 金 GOLD, lock state, trial label, trial sheet, store sheet (Free/Silver/Gold comparison, prices, "includes all future games", Silver→Gold upgrade HK$10 when Silver owned, Restore Purchases, fine print), toasts.
- DEV 面板 Dev panel (stub only): 連撳「你嘅級別」7 下（或 `?dev=1`）· tap the tier chip 7× (or `?dev=1`): set Silver / Gold, reset trials, wipe local cache (simulate reinstall), reset everything. Test hooks: `?nonav=1` (record launches instead of navigating), `?store=1`, `window.__hub`.
- 測試 Tests: `node --test tests/` (entitlements + stub, 7/7) · `python -u tests/smoke_monetization.py HUB_URL` (HUB_URL = the unlisted hub page) (Playwright, 412×915 touch + 1280×800, zh + en, zero console errors).

## 13. 開放問題 Open questions for Roy

已解答 Answered (Roy, 2026-10-02):
- ~~DATA FUSE 放銀級？~~ → **免費**；新規則：類型有大量免費同類遊戲就放免費 · **Free**; rule: genres with many free equivalents go Free (§3).
- ~~試玩次數~~ → **維持每日 3 局 + 局內上限** · **keep 3 runs/day + in-game caps** (§4).
- ~~網頁版要唔要限制？~~ → **網頁版保持免費、唔宣傳，而家唔公開；直接做 App；收費只喺 App** · **web stays free and unpromoted, not public for now; go straight to the app; paid gating app-only** (§9).

仍然開放 Still open:
4. **各地定價** 要唔要特別調低某啲市場（例如東南亞）？Silver + Upgrade 喺某啲國家四捨五入後可能同 Gold 差少少，接受？ · regional pricing tweaks; rounding drift Silver + Upgrade vs Gold.
5. **Family Library 家庭媒體庫** 要唔要為應用程式內產品開？（上架前再核實 Play 現時支援）· enable Family Library for these products if Play allows?
6. **退款／邊緣情況** 只買咗 upgrade 冇 Silver（理論上唔會發生）而家當銀級處理，OK？ · edge case: upgrade without Silver → treated as Silver.
7. **獨立免費 App（例如 CYBER BOARD）** 點樣引流：內置「更多遊戲」連去大廳 Play 頁？獨立 App 入面購買唔會自動轉去大廳（唔同 package），所以建議獨立 App 只放廣告、唔賣嘢 · standalone apps: ads only, link to the hub listing; purchases don't carry across packages.
8. **RevenueCat** 接受第三方？（定用 cdv-purchase 自己驗證）· OK with RevenueCat as a third party?
9. **日後新級別** 例如「白金級」或者付費擴充包，會唔會同「包括日後新遊戲」承諾有衝突？建議 FAQ 寫明新遊戲可以放入任何級別 · future extra tiers/DLC vs the future-games promise.
