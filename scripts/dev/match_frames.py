"""Finds, for each key reel frame, the scroll position where our page looks most like it.

usage: python match_frames.py          (after: node scripts/dev/scan.mjs)
Prints the 3 best scroll positions per frame with their mean abs luminance diff (0-255; lower = closer), and
writes blend overlays for the best one to .shots/match/<name>.png (green = reel, magenta = ours) and a side-by-side sheet.
"""
import glob
import os

import numpy as np
from PIL import Image

FRAMES = {"hero": "k_2.5", "about": "k_3.7", "popular": "k_5.6", "follow": "k_7.6", "footer": "k_8.1"}
SIZE = (313, 178)  # quarter resolution is plenty for layout alignment


def small(image):
    return np.asarray(image.convert("L").resize(SIZE, Image.BILINEAR)).astype(float)


ours = sorted(glob.glob(".shots/scan/y*.png"))
if not ours:
    raise SystemExit("no scan shots: run `node scripts/dev/scan.mjs` first")
cache = {path: small(Image.open(path)) for path in ours}
os.makedirs(".shots/match", exist_ok=True)

for name, frame in FRAMES.items():
    ref_full = Image.open(f"reference/frames/{frame}.png").convert("RGB").crop((11, 3, 1264, 715))
    ref = small(ref_full)
    ranked = sorted((float(np.abs(ref - shot).mean()), path) for path, shot in cache.items())
    best = [(round(score, 1), int(os.path.basename(path)[1:6])) for score, path in ranked[:3]]
    print(f"{name:8} {frame:6} best (diff, scrollY): {best}")

    score, path = ranked[0]
    mine = Image.open(path).convert("RGB").resize(ref_full.size, Image.LANCZOS)
    a = np.asarray(ref_full).astype(float)
    b = np.asarray(mine).astype(float)
    blend = np.clip(np.stack([b[..., 0] * 0.5 + a[..., 0] * 0.5, a[..., 1] * 0.5 + b[..., 1] * 0.0 + 60, b[..., 2] * 0.5 + a[..., 2] * 0.5], axis=-1), 0, 255)
    Image.fromarray(blend.astype("uint8")).save(f".shots/match/{name}.png")
    side = Image.new("RGB", (ref_full.width * 2 + 8, ref_full.height), "white")
    side.paste(ref_full, (0, 0))
    side.paste(mine, (ref_full.width + 8, 0))
    side.save(f".shots/match/{name}_side.png")
