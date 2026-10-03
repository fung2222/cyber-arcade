"""Thumbnail smoke test for the hub prototype + test portal (412x915 touch + 1280x800, zh + en).
usage: python tests/smoke_thumbs.py REPO_ROOT_URL PORTAL_FOLDER [OUT_DIR]   (the portal folder name is passed in, never stored)
"""
import asyncio, json, sys
from playwright.async_api import async_playwright
BASE = sys.argv[1]   # repo root URL, e.g. http://127.0.0.1:18940/cyber-arcade/
LAB = sys.argv[2]    # unlisted folder name (passed in, never written to files)
OUT = sys.argv[3] if len(sys.argv) > 3 else '/tmp/arcade-thumbs'
import os; os.makedirs(OUT, exist_ok=True)
ARGS = ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']
fails = []
def check(c, m): print(('  ok   ' if c else '  FAIL ') + m); (None if c else fails.append(m))
async def page(b, kind, w, h, mob, lang):
    ctx = await b.new_context(viewport={'width': w, 'height': h}, is_mobile=mob, has_touch=mob, device_scale_factor=2 if mob else 1)
    pg = await ctx.new_page(); errs = []; bad = []
    pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.on('response', lambda r: bad.append(f'{r.status} {r.url}') if r.status >= 400 else None)
    url = BASE + LAB + ('/hub/' if kind == 'hub' else '/') + f'?lang={lang}'
    await pg.goto(url); await pg.wait_for_selector('.card .thumb img')
    n = await pg.locator('.card').count(); ni = await pg.locator('.card .thumb img').count()
    check(n == 9 and ni == 9, f'{kind} {w} {lang}: 9 cards with thumbnails ({n}/{ni})')
    check(await pg.locator('.card .thumb img[loading="lazy"]').count() == 9, f'{kind} {w} {lang}: lazy-loaded')
    alts = await pg.locator('.card .thumb img').evaluate_all('els => els.map(e => e.alt)')
    zh_ok = all(any('\u4e00' <= ch <= '\u9fff' for ch in a) for a in alts) if lang == 'zh' else not any('\u4e00' <= ch <= '\u9fff' for a in alts for ch in a)
    check(zh_ok and all(alts), f'{kind} {w} {lang}: {lang} alt text ({alts[7][:40]}…)')
    # scroll through so every lazy image loads, then check they decoded
    for y in range(0, 6000, 400): await pg.evaluate(f'scrollTo(0,{y})'); await pg.wait_for_timeout(120)
    await pg.wait_for_function("[...document.querySelectorAll('.card .thumb img')].every(i => i.complete && i.naturalWidth === 640)", timeout=20000)
    check(True, f'{kind} {w} {lang}: all 9 images decoded 640×360')
    # overlays sit inside the image box and on top of it
    vis = await pg.evaluate("""[...document.querySelectorAll('.card')].map(c => { const f = c.querySelector('.thumb').getBoundingClientRect();
      return [...c.querySelectorAll('.thumb .ov')].map(o => { const r = o.getBoundingClientRect(), z = +getComputedStyle(o).zIndex;
        const inside = r.top >= f.top && r.bottom <= f.bottom && r.left >= f.left && r.right <= f.right && r.width > 0;
        return inside && z >= 2; }).every(Boolean) && c.querySelectorAll('.thumb .ov').length >= (c.classList.contains('t-free') ? 1 : 2) || false; })""")
    if kind == 'hub':
        check(all(vis), f'hub {w} {lang}: tier badge + lock/trial overlays inside the image on every card')
        locked = await pg.locator('.card.locked .thumb .state.lock').count(); trial = await pg.locator('.card.locked .thumb .trial').count()
        check(locked == trial == 5, f'hub {w} {lang}: lock + trial overlay on the 5 Silver/Gold cards ({locked}/{trial})')
    else:
        check(await pg.locator('.card .thumb .tag').count() == 9 and await pg.locator('.card .thumb .pill').count() == 9, f'portal {w} {lang}: tier tag + stage pill on every image')
        play = await pg.locator('.card .links a').first.inner_text()
        check(play.replace('\n', ' ').split().count('PLAY') <= 1, f'portal {w} {lang}: play button label "{play.replace(chr(10), " / ")}"')
    await pg.evaluate('scrollTo(0,0)'); await pg.wait_for_timeout(400)
    await pg.screenshot(path=f'{OUT}/{kind}-{"mobile" if mob else "desktop"}-{lang}.png')
    await pg.screenshot(path=f'{OUT}/{kind}-{"mobile" if mob else "desktop"}-{lang}-full.png', full_page=True)
    if errs or bad: print('   errors:', errs[:5], bad[:5])
    check(not errs and not bad, f'{kind} {w} {lang}: zero console errors / failed requests')
    await ctx.close()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=ARGS)
        for kind in ('portal', 'hub'):
            for (w, h, mob) in ((412, 915, True), (1280, 800, False)):
                for lang in ('zh', 'en'):
                    await page(b, kind, w, h, mob, lang)
        await b.close()
    print('PASS' if not fails else 'FAIL', len(fails), fails); sys.exit(1 if fails else 0)
asyncio.run(main())
