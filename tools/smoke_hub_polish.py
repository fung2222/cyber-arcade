"""Smoke + screenshots for hub polish.

Requires HUB_URL env (unlisted hub entry). Never hardcode the unlisted path in this file.
  HUB_URL=…/hub/ python tools/smoke_hub_polish.py
"""
import asyncio, os, sys
from pathlib import Path
from playwright.async_api import async_playwright

CHROME = os.environ.get('CHROME', '/usr/bin/google-chrome')
HUB = os.environ.get('HUB_URL')
if not HUB:
    sys.exit('Set HUB_URL to the unlisted hub entry (do not commit that path).')
OUT = Path(os.environ.get('OUT', '/workspace/shots/hub-polish'))
OUT.mkdir(parents=True, exist_ok=True)

async def main():
    errs = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path=CHROME, headless=True,
            args=['--autoplay-policy=no-user-gesture-required'])
        ctx = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await ctx.new_page()
        page.on('pageerror', lambda e: errs.append(f'desktop:{e}'))
        page.on('console', lambda m: errs.append(f'desktop-console:{m.text}') if m.type == 'error' else None)
        sep = '&' if '?' in HUB else '?'
        await page.goto(HUB + sep + 'lang=zh', wait_until='networkidle', timeout=90000)
        await page.wait_for_selector('.card', timeout=30000)
        await page.screenshot(path=str(OUT / 'hub-desktop.png'), full_page=True)
        card = page.locator('.card').first
        await card.hover()
        await page.wait_for_timeout(1500)
        await page.screenshot(path=str(OUT / 'hub-hover-preview.png'))
        await page.keyboard.press('Tab')
        await ctx.close()

        ctx = await browser.new_context(viewport={'width': 412, 'height': 915}, is_mobile=True, has_touch=True)
        page = await ctx.new_page()
        page.on('pageerror', lambda e: errs.append(f'mobile:{e}'))
        await page.goto(HUB + sep + 'lang=en', wait_until='networkidle', timeout=90000)
        await page.wait_for_selector('.card', timeout=30000)
        await page.screenshot(path=str(OUT / 'hub-mobile.png'), full_page=True)
        await ctx.close()

        for gid, name in (('neon-stick-duel', 'duel-home-menu.png'), ('cyber-snake', 'snake-home-menu.png')):
            ctx = await browser.new_context(viewport={'width': 412, 'height': 915})
            page = await ctx.new_page()
            page.on('pageerror', lambda e, g=gid: errs.append(f'{g}:{e}'))
            url = f'https://fung2222.github.io/{gid}/?hub=1&tier=free&ads=1&lang=zh'
            await page.goto(url, wait_until='networkidle', timeout=90000)
            try:
                await page.wait_for_function(
                    """() => { const ld=document.getElementById('loading'); return !ld || ld.classList.contains('done') || ld.classList.contains('hidden'); }""",
                    timeout=60000,
                )
            except Exception:
                pass
            await page.wait_for_timeout(1500)
            btn = page.locator('#btn-arcade-menu')
            visible = await btn.count() and await btn.is_visible()
            print(gid, 'arcade-menu visible:', visible)
            await page.screenshot(path=str(OUT / name), full_page=True)
            await ctx.close()
        await browser.close()
    print('errs', len(errs))
    for e in errs[:20]:
        print(' ERR', e)
    print('shots', sorted(p.name for p in OUT.glob('*.png')))
    return 0

if __name__ == '__main__':
    raise SystemExit(asyncio.run(main()))
