"""390/360 hub card action guard.

The primary Start/Play button must dominate the row; 教學／示範 stay compact.
Usage:
  python tests/hub-cards.py [hub_url]
"""
from __future__ import annotations
import sys
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:18940/cyber-arcade/'
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
VIEWPORTS = [(360, 800, '360'), (390, 844, '390'), (412, 915, '412')]

fails = []
def check(ok, msg):
    print(('ok   ' if ok else 'FAIL ') + msg)
    if not ok:
        fails.append(msg)

with sync_playwright() as p:
    b = p.chromium.launch(args=ARGS)
    for w, h, name in VIEWPORTS:
        c = b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = c.new_page()
        errors = []
        pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        pg.goto(URL + '?lang=zh', wait_until='domcontentloaded')
        pg.wait_for_selector('.card', timeout=60000)
        pg.wait_for_timeout(500)
        data = pg.evaluate("""() => {
          const card = document.querySelector('.card');
          const row = card.querySelector('.links-pri');
          const q = (sel) => {
            const e = row.querySelector(sel); const r = e.getBoundingClientRect();
            return {w:r.width, h:r.height, x:r.x, right:r.right, fs:getComputedStyle(e).fontSize};
          };
          return {card:card.getBoundingClientRect().toJSON(), row:row.getBoundingClientRect().toJSON(),
                  play:q('.play-main'), howto:q('.howto'), demo:q('.demo'), docW:document.documentElement.scrollWidth};
        }""")
        print(name, data)
        check(data['docW'] <= w, f'{name}: no horizontal page overflow')
        check(data['play']['w'] >= data['howto']['w'] * 2.5, f'{name}: Start is at least 2.5× wider than 教學')
        check(data['play']['h'] >= 50, f'{name}: Start is at least 50px tall')
        check(data['play']['fs'] == '14px', f'{name}: Start uses 14px label')
        check(abs(data['play']['right'] - data['howto']['x']) < 12, f'{name}: Start and 教學 are on one row')
        check(data['howto']['w'] <= 64 and data['demo']['w'] <= 64, f'{name}: 教學／示範 stay compact')
        check(data['play']['right'] <= data['row']['right'] + 1, f'{name}: Start stays inside the action row')
        check(len(errors) == 0, f'{name}: zero console errors')
        c.close()
    b.close()

print(f'\n{len(fails)} FAILED' if fails else '\nALL PASSED')
raise SystemExit(1 if fails else 0)
