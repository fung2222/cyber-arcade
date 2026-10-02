# Headless smoke test for the hub monetisation prototype (tier badges, store, Silver→Gold upgrade, trials, restore).
#   python -u tests/smoke_monetization.py HUB_URL [OUT_DIR]     (HUB_URL = the unlisted hub page, or set env HUB_URL)
# Needs Playwright + Chrome. Exits 1 on any console error / failed assertion.
import asyncio, sys, json, os
from playwright.async_api import async_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else os.environ.get('HUB_URL') or sys.exit('usage: smoke_monetization.py HUB_URL [OUT_DIR]')
OUT = sys.argv[2] if len(sys.argv) > 2 else '/workspace/shots/monetization'
os.makedirs(OUT, exist_ok=True)
VIEWS = {'m': dict(viewport={'width': 412, 'height': 915}, device_scale_factor=2, is_mobile=True, has_touch=True),
         'd': dict(viewport={'width': 1280, 'height': 800})}
errors, fails, shots = [], [], []

def check(cond, msg):
    if not cond: fails.append(msg); print('  FAIL', msg)

async def page(b, view, lang):
    ctx = await b.new_context(**VIEWS[view]); pg = await ctx.new_page()
    tag = f'{view}-{lang}'
    pg.on('pageerror', lambda e: errors.append(f'{tag} pageerror: {e}'))
    pg.on('console', lambda m: errors.append(f'{tag} console.{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
    await pg.goto(f'{BASE}?lang={lang}&nonav=1'); await pg.wait_for_selector('.card[data-game]')
    await pg.wait_for_timeout(400)
    return ctx, pg

async def snap(pg, name, full=False):
    p = f'{OUT}/{name}.png'; await pg.screenshot(path=p, full_page=full); shots.append(p)

async def run(b, view, lang):
    sfx = f'{lang}-{"mobile" if view == "m" else "desktop"}'
    # 1) hub with badges (fresh Free state)
    ctx, pg = await page(b, view, lang)
    n = await pg.evaluate("(() => { const c = {free: 0, silver: 0, gold: 0}; window.__hub.games.forEach((g) => c[g.tier]++); return c; })()")
    check(all([await pg.locator(f'.badge.{k}').count() == v for k, v in n.items()]), f'{sfx} badges {n}')
    check(await pg.locator('.card.locked').count() == n['silver'] + n['gold'], f'{sfx} locked cards')
    await snap(pg, f'01-hub-free-{sfx}', full=True)
    # 2) store, Free state
    await pg.click('#btn-unlock'); await pg.wait_for_selector('.tier.gold')
    check(await pg.locator('[data-buy="tier_silver"]').count() == 1 and await pg.locator('[data-buy="tier_gold"]').count() == 1, f'{sfx} free store buttons')
    check(await pg.locator('li.future').count() == 2, f'{sfx} future-games lines')
    check(await pg.locator('#btn-restore').count() == 1, f'{sfx} restore button')
    await snap(pg, f'02-store-free-{sfx}')
    # 3) buy Silver through the stub payment sheet → store shows the HK$10 upgrade
    await pg.click('[data-buy="tier_silver"]'); await pg.wait_for_selector('#stub-yes')
    await snap(pg, f'03-stub-pay-{sfx}')
    await pg.click('#stub-yes'); await pg.wait_for_selector('[data-buy="tier_gold_upgrade"]')
    check(await pg.evaluate('window.__hub.ent.getTier()') == 'silver', f'{sfx} tier silver')
    check('10' in await pg.locator('[data-buy="tier_gold_upgrade"]').inner_text(), f'{sfx} upgrade price HK$10')
    await pg.wait_for_timeout(2600)  # let the toast fade
    await snap(pg, f'04-store-silver-upgrade-{sfx}')
    p = f'{OUT}/04b-gold-upgrade-card-{sfx}.png'; await pg.locator('.tier.gold').screenshot(path=p); shots.append(p)
    await pg.click('#store-close'); await pg.wait_for_timeout(200)
    check(await pg.locator('.card.locked').count() == n['gold'], f'{sfx} silver: only gold cards locked')
    check(json.loads(await pg.evaluate("localStorage.getItem('cyber.entitlement')"))['tier'] == 'silver', f'{sfx} shared key')
    await snap(pg, f'05-hub-silver-{sfx}', full=True)
    # 3b) wipe local cache (simulated reinstall) → Restore Purchases brings Silver back
    await pg.evaluate("window.__hub.ent.devWipeCache()")
    check(await pg.evaluate('window.__hub.ent.getTier()') == 'free', f'{sfx} wiped → free')
    await pg.click('#btn-unlock'); await pg.click('#btn-restore'); await pg.wait_for_timeout(300)
    check(await pg.evaluate('window.__hub.ent.getTier()') == 'silver', f'{sfx} restored silver')
    await ctx.close()
    # 4) trials: 3 runs of a Gold game, then exhausted → store with reason
    ctx, pg = await page(b, view, lang)
    sel = '.card[data-game="cyber-board"] [data-play]'
    for i in range(3):
        await pg.click(sel); await pg.wait_for_selector('#tr-start')
        if i == 0: await snap(pg, f'06-trial-sheet-{sfx}')
        await pg.click('#tr-start'); await pg.wait_for_timeout(150)
        ll = await pg.evaluate('window.__hub.lastLaunch')
        check(ll and 'trial=1' in ll['url'] and f'trialLeft={2 - i}' in ll['url'] and 'ads=1' in ll['url'], f'{sfx} trial launch {i}: {ll}')
    await pg.wait_for_timeout(2600)  # let the launch toast fade
    await pg.click(sel); await pg.wait_for_selector('.reason')
    check(await pg.evaluate('window.__hub.ent.trialRemaining("cyber-board")') == 0, f'{sfx} exhausted')
    await snap(pg, f'07-trial-exhausted-store-{sfx}')
    await pg.click('#store-close'); await pg.wait_for_timeout(200)
    await snap(pg, f'08-hub-trial-exhausted-{sfx}', full=True)
    # free game launches directly with ads=1, no trial
    await pg.click('.card[data-game="cyber-snake"] [data-play]'); await pg.wait_for_timeout(150)
    ll = await pg.evaluate('window.__hub.lastLaunch')
    check(ll and ll['id'] == 'cyber-snake' and 'trial' not in ll['url'], f'{sfx} free launch')
    await ctx.close()
    # 5) Gold owner (dev panel) — hub fully unlocked, no ads
    ctx, pg = await page(b, view, lang)
    for _ in range(7): await pg.click('#tier-chip')
    await pg.wait_for_selector('#dev:not(.hidden)')
    await pg.click('[data-dev="gold"]'); await pg.wait_for_timeout(300)
    check(await pg.locator('.card.locked').count() == 0, f'{sfx} gold: nothing locked')
    await pg.click('#dev-close')
    await snap(pg, f'09-hub-gold-{sfx}')
    await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        for view in VIEWS:
            for lang in ('zh', 'en'):
                print('run', view, lang); await run(b, view, lang)
        await b.close()
    print('screens:', len(shots)); print('console errors:', json.dumps(errors, ensure_ascii=False))
    print('fails:', fails)
    sys.exit(1 if errors or fails else 0)
asyncio.run(main())
