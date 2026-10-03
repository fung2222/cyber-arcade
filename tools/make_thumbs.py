"""Card thumbnails for the hub + test portal: crop a raw in-game screenshot to 16:9 and save an optimised WebP (< 60 KB).

usage: python tools/make_thumbs.py RAW_DIR [gameId ...]
RAW_DIR holds 1280x720 headless-Chrome captures of each live game in ?demo=1 (mid-action, never a title screen).
SHOTS maps gameId -> (raw file name, zoom, centre x, centre y): zoom 1 = full frame, 1.25 = crop 80 % around the centre
(centre given as 0..1 of the frame). Output: assets/thumbs/<gameId>.webp (640x360).
"""
import io, os, sys
from PIL import Image

SHOTS = {
    'cyber-snake':     ('cyber-snake-L1.png',     1.30, 0.50, 0.55),
    'data-fuse':       ('data-fuse-L2.png',       1.25, 0.50, 0.50),
    'neon-recall':     ('neon-recall-3.png',      1.30, 0.50, 0.50),
    'cyber-ninja':     ('cyber-ninja-S3.png',     1.15, 0.50, 0.45),
    'cyber-mini-pack': ('cyber-mini-pack-2.png',  1.25, 0.50, 0.52),
    'neon-stick-duel': ('neon-stick-duel-2.png',  1.20, 0.50, 0.50),
    'cyber-board':     ('cyber-board-3.png',      1.25, 0.50, 0.47),
    'cyber-tower':     ('cyber-tower-ff3.png',    1.30, 0.50, 0.44),
    'neon-stick-run':  ('neon-stick-run-2.png',   1.25, 0.40, 0.62),
}
W, H, MAX_BYTES = 640, 360, 58 * 1024
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def crop169(img, zoom, cx, cy):
    iw, ih = img.size
    w = min(iw, ih * 16 / 9) / zoom; h = w * 9 / 16
    x = min(max(cx * iw - w / 2, 0), iw - w); y = min(max(cy * ih - h / 2, 0), ih - h)
    return img.crop((round(x), round(y), round(x + w), round(y + h)))

def encode(img):
    lo, hi, best = 30, 90, None
    while lo <= hi:   # highest quality that fits the budget
        q = (lo + hi) // 2; buf = io.BytesIO(); img.save(buf, 'WEBP', quality=q, method=6)
        if buf.tell() <= MAX_BYTES: best, lo = (q, buf.getvalue()), q + 1
        else: hi = q - 1
    if best is None: raise SystemExit('cannot fit under budget')
    return best

def main():
    raw = sys.argv[1]; ids = sys.argv[2:] or list(SHOTS)
    os.makedirs(os.path.join(ROOT, 'assets', 'thumbs'), exist_ok=True)
    for gid in ids:
        f, zoom, cx, cy = SHOTS[gid]
        img = crop169(Image.open(os.path.join(raw, f)).convert('RGB'), zoom, cx, cy).resize((W, H), Image.LANCZOS)
        q, data = encode(img)
        out = os.path.join(ROOT, 'assets', 'thumbs', gid + '.webp')
        open(out, 'wb').write(data)
        print(f'{gid:16s} {f:26s} q={q:2d} {len(data) / 1024:5.1f} KB -> assets/thumbs/{gid}.webp')

if __name__ == '__main__':
    main()
