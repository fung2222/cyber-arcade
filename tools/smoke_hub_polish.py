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
        # Tagline / hero at desktop width
        await page.locator('header').screenshot(path=str(OUT / 'hub-tagline-desktop.png'))

        card = page.locator('.card:has(.thumb.has-preview)').first
        await card.hover()
        await page.wait_for_timeout(1500)
        rate = await page.evaluate(
            """() => {
              const fig = document.querySelector('.thumb.has-preview.playing');
              const v = fig && fig.querySelector('video');
              return v ? { rate: v.playbackRate, paused: v.paused, readyState: v.readyState } : null;
            }"""
        )
        print('desktop hover preview:', rate)
        if not rate or rate.get('paused') is not False or abs(float(rate.get('rate', 0)) - 0.35) > 0.05:
            errs.append(f'desktop-halfspeed:{rate}')
        await page.screenshot(path=str(OUT / 'hub-hover-preview.png'))
        await page.screenshot(path=str(OUT / 'hub-preview-halfspeed.png'))
        await page.keyboard.press('Tab')
        await ctx.close()

        ctx = await browser.new_context(viewport={'width': 412, 'height': 915}, is_mobile=True, has_touch=True)
        page = await ctx.new_page()
        page.on('pageerror', lambda e: errs.append(f'mobile:{e}'))
        await page.goto(HUB + sep + 'lang=en', wait_until='networkidle', timeout=90000)
        await page.wait_for_selector('.card', timeout=30000)
        await page.screenshot(path=str(OUT / 'hub-mobile.png'), full_page=True)
        # Tagline / hero at mobile width (zh switch for wrap check)
        await page.goto(HUB + sep + 'lang=zh', wait_until='networkidle', timeout=90000)
        await page.wait_for_selector('.card', timeout=30000)
        await page.locator('header').screenshot(path=str(OUT / 'hub-tagline-mobile.png'))
        await page.locator('.topbar').screenshot(path=str(OUT / 'hub-topbar-mobile.png'))
        await page.screenshot(path=str(OUT / 'hub-ads-blurb-mobile.png'), clip={'x': 0, 'y': 0, 'width': 412, 'height': 280})

        # Top bar: tier + unlock + lang on one row
        top = await page.evaluate("""() => {
          const bar = document.querySelector('.topbar');
          const tier = document.querySelector('#tier-chip');
          const unl = document.querySelector('#btn-unlock');
          const lang = document.querySelector('#btn-lang');
          if (!bar || !tier || !lang) return { ok: false };
          const br = bar.getBoundingClientRect();
          const tr = tier.getBoundingClientRect();
          const lr = lang.getBoundingClientRect();
          const ur = unl ? unl.getBoundingClientRect() : null;
          const sameRow = Math.abs(tr.top - lr.top) < 12 && (!ur || Math.abs(ur.top - lr.top) < 12);
          return { ok: true, sameRow, barTop: br.top, tierT: tr.top, langT: lr.top, unlockT: ur && ur.top };
        }""")
        print('mobile topbar:', top)
        if not top.get('ok') or not top.get('sameRow'):
            errs.append(f'topbar-row:{top}')

        # Ads blurb: no orphan — last line should not be a single short CJK word alone if multi-line
        ads = await page.evaluate("""() => {
          const el = document.querySelector('.ads-line');
          if (!el) return null;
          const nws = [...el.querySelectorAll('.nw')];
          const range = document.createRange();
          // Count visual lines via phrase tops
          const tops = nws.map(n => Math.round(n.getBoundingClientRect().top));
          const lines = new Set(tops).size;
          const byLine = {};
          nws.forEach(n => {
            const t = Math.round(n.getBoundingClientRect().top);
            (byLine[t] = byLine[t] || []).push(n.textContent);
          });
          const lastKey = Math.max(...tops);
          const lastPhrases = byLine[lastKey] || [];
          const lastText = lastPhrases.join('');
          return { lines, lastText, phrases: nws.map(n => n.textContent), html: el.innerHTML };
        }""")
        print('mobile ads:', ads)
        if not ads or '廣告' not in ''.join(ads.get('phrases') or []):
            # zh page should have 廣告 in adsOn
            errs.append(f'ads-missing:{ads}')
        elif ads.get('lines', 1) > 1 and ads.get('lastText') in ('廣告', '有廣告'):
            errs.append(f'ads-orphan:{ads}')

        # Touch: tap a preview card → muted loop plays and stays active (no hover on phones).
        card = page.locator('.card:has(.thumb.has-preview)').first
        await card.scroll_into_view_if_needed()
        box = await card.bounding_box()
        assert box, 'mobile preview card has no box'
        # Tap the thumbnail area (not PLAY) so we stay on the hub.
        await page.touchscreen.tap(box['x'] + box['width'] * 0.5, box['y'] + 40)
        await page.wait_for_function(
            """() => {
              const fig = document.querySelector('.thumb.has-preview.playing');
              if (!fig) return false;
              const v = fig.querySelector('video');
              return !!(v && !v.paused && v.readyState >= 2);
            }""",
            timeout=15000,
        )
        playing = await page.evaluate(
            """() => {
              const figs = [...document.querySelectorAll('.thumb.has-preview.playing')];
              const v = figs[0] && figs[0].querySelector('video');
              return {
                count: figs.length,
                paused: v ? v.paused : null,
                currentTime: v ? v.currentTime : null,
                playbackRate: v ? v.playbackRate : null,
                coarse: matchMedia('(pointer: coarse)').matches || matchMedia('(hover: none)').matches,
              };
            }"""
        )
        print('mobile tap preview:', playing)
        if playing.get('count') != 1 or playing.get('paused') is not False:
            errs.append(f'mobile-tap-preview:{playing}')
        if playing.get('playbackRate') is None or abs(float(playing.get('playbackRate', 0)) - 0.35) > 0.05:
            errs.append(f'mobile-halfspeed:{playing}')
        await page.wait_for_timeout(800)
        await page.screenshot(path=str(OUT / 'hub-mobile-tap-preview.png'))

        # Switch: tap a second preview card → only that one plays.
        cards = page.locator('.card:has(.thumb.has-preview)')
        if await cards.count() >= 2:
            c2 = cards.nth(1)
            await c2.scroll_into_view_if_needed()
            b2 = await c2.bounding_box()
            await page.touchscreen.tap(b2['x'] + b2['width'] * 0.5, b2['y'] + 40)
            await page.wait_for_timeout(600)
            switched = await page.evaluate(
                """() => {
                  const figs = [...document.querySelectorAll('.thumb.has-preview.playing')];
                  return figs.length;
                }"""
            )
            print('mobile switch active count:', switched)
            if switched != 1:
                errs.append(f'mobile-switch-preview:count={switched}')
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
    return 1 if errs else 0

if __name__ == '__main__':
    raise SystemExit(asyncio.run(main()))
