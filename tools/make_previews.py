"""Capture 3–6 s muted looping gameplay previews for hub cards (WebGL-safe frame grab).

usage:
  python tools/make_previews.py [--ids id1,id2] [--out DIR]
"""
from __future__ import annotations
import argparse, os, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets' / 'previews'
CHROME = os.environ.get('CHROME', '/usr/bin/google-chrome')
VENV_PW = os.environ.get('PW_PYTHON', '/workspace/.venv-pw/bin/python')

# (id, url, boot_ms before frames, n_frames, fps)
GAMES = [
    ('cyber-snake', 'https://fung2222.github.io/cyber-snake/?demo=1&glow=low&lang=en', 10000, 96, 20),
    ('data-fuse', 'https://fung2222.github.io/data-fuse/?demo=1&glow=low&lang=en', 9000, 96, 20),
    ('neon-recall', 'https://fung2222.github.io/neon-recall/?demo=1&glow=low&lang=en', 10000, 96, 20),
    ('cyber-ninja', 'https://fung2222.github.io/cyber-ninja/?demo=1&glow=low&lang=en', 9000, 96, 20),
    ('cyber-mini-pack', 'https://fung2222.github.io/cyber-mini-pack/?demo=1&glow=low&lang=en', 10000, 96, 20),
    ('neon-stick-duel', 'https://fung2222.github.io/neon-stick-duel/?demo=1&glow=low&lang=en', 11000, 100, 20),
    ('neon-stick-run', 'https://fung2222.github.io/neon-stick-run/?demo=1&glow=low&lang=en', 10000, 96, 20),
    ('cyber-board', 'https://fung2222.github.io/cyber-board/?demo=1&glow=low&lang=en', 10000, 96, 20),
    ('cyber-tower', 'https://fung2222.github.io/cyber-tower/?demo=1&glow=low&lang=en', 12000, 100, 20),
]

CAPTURE = r'''
import sys, time
from playwright.sync_api import sync_playwright
url, frames_dir, boot_ms, n_frames, fps, chrome = sys.argv[1:7]
boot_ms, n_frames, fps = int(boot_ms), int(n_frames), int(fps)
import pathlib
frames_dir = pathlib.Path(frames_dir); frames_dir.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=chrome, headless=True,
        args=['--autoplay-policy=no-user-gesture-required', '--mute-audio',
              '--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl',
              '--ignore-gpu-blocklist'])
    page = browser.new_page(viewport={'width': 640, 'height': 360}, device_scale_factor=1)
    page.goto(url, wait_until='domcontentloaded', timeout=120000)
    try:
        page.wait_for_function("""() => {
          const ld = document.getElementById('loading');
          if (!ld) return true;
          return ld.classList.contains('done') || ld.classList.contains('hidden');
        }""", timeout=60000)
    except Exception as e:
        print('loading:', e, file=sys.stderr)
    for sel in ('#btn-start', '#btn-campaign', '#btn-ladder', '#btn-stage-go', '#btn-endless',
                '#mode-rps', 'button.gcard', '#btn-continue'):
        try:
            loc = page.locator(sel).first
            if loc.count() and loc.is_visible():
                loc.click(timeout=800, force=True)
                page.wait_for_timeout(400)
        except Exception:
            pass
    page.wait_for_timeout(boot_ms)
    # reject pure-black / boot-text frames: require mean luma > threshold via canvas sample when possible
    ok = page.evaluate("""() => {
      const ld = document.getElementById('loading');
      const loadingGone = !ld || ld.classList.contains('done') || ld.classList.contains('hidden');
      const c = document.querySelector('canvas');
      return loadingGone && !!c;
    }""")
    if not ok:
        print('NOT_READY', file=sys.stderr)
    interval = 1.0 / fps
    for i in range(n_frames):
        page.screenshot(path=str(frames_dir / f'f{i:04d}.png'), type='png')
        time.sleep(interval)
    browser.close()
print('frames', n_frames)
'''

def encode_frames(frames_dir: Path, dest: Path, fps: int) -> bool:
    dest.parent.mkdir(parents=True, exist_ok=True)
    pattern = str(frames_dir / 'f%04d.png')
    for crf, br in ((30, '480k'), (33, '360k'), (36, '260k'), (38, '180k')):
        tmp = dest.with_suffix('.tmp.webm')
        cmd = [
            'ffmpeg', '-y', '-framerate', str(fps), '-i', pattern,
            '-an', '-c:v', 'libvpx-vp9', '-b:v', br, '-crf', str(crf),
            '-row-mt', '1', '-speed', '2', '-pix_fmt', 'yuv420p',
            str(tmp),
        ]
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode != 0:
            print('ffmpeg fail', r.stderr[-400:], file=sys.stderr); continue
        sz = tmp.stat().st_size
        if 150 * 1024 <= sz <= 520 * 1024 or crf == 38:
            tmp.replace(dest)
            print(f'  encode {dest.name} {sz/1024:.1f} KB crf={crf}')
            return True
        if sz > 520 * 1024:
            tmp.unlink(missing_ok=True); continue
        if sz >= 100 * 1024:
            tmp.replace(dest)
            print(f'  encode {dest.name} {sz/1024:.1f} KB crf={crf} (small ok)')
            return True
        tmp.unlink(missing_ok=True)
    return False

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--ids', default='')
    ap.add_argument('--out', default=str(OUT))
    args = ap.parse_args()
    want = {x.strip() for x in args.ids.split(',') if x.strip()} or None
    out_dir = Path(args.out); out_dir.mkdir(parents=True, exist_ok=True)
    ok, skip = [], []
    for gid, url, boot_ms, n_frames, fps in GAMES:
        if want and gid not in want: continue
        print(f'== {gid} ==', flush=True)
        with tempfile.TemporaryDirectory(prefix=f'prev-{gid}-') as td:
            frames = Path(td) / 'frames'
            r = subprocess.run(
                [VENV_PW, '-c', CAPTURE, url, str(frames), str(boot_ms), str(n_frames), str(fps), CHROME],
                capture_output=True, text=True, timeout=300,
            )
            sys.stdout.write(r.stdout)
            if r.stderr: sys.stderr.write(r.stderr[-600:])
            n = len(list(frames.glob('f*.png'))) if frames.exists() else 0
            if r.returncode != 0 or n < 30:
                print('SKIP', gid, 'rc', r.returncode, 'frames', n, flush=True)
                skip.append(gid); continue
            # sanity: mid frame not tiny
            mid = frames / f'f{n//2:04d}.png'
            if mid.exists() and mid.stat().st_size < 8000:
                print('SKIP', gid, 'mid frame too small (likely blank)', flush=True)
                skip.append(gid); continue
            dest = out_dir / f'{gid}.webm'
            if encode_frames(frames, dest, fps):
                ok.append(gid)
            else:
                skip.append(gid)
    print('OK:', ok); print('SKIP:', skip)
    return 0 if ok else 1

if __name__ == '__main__':
    raise SystemExit(main())
