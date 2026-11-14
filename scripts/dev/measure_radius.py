"""Estimate the Follow card's corner radius per frame from the dark mask (reel frames or page captures).

usage: python measure_radius.py FRAMES_GLOB T0 FPS [CROP_X CROP_Y]
Radius from the top-right corner cut area: r = sqrt((S*S - dark) / (1 - pi/4)).
"""
import glob
import math
import sys

import numpy as np
from PIL import Image

pattern, t0, fps = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
cx = int(sys.argv[4]) if len(sys.argv) > 4 else 11
cy = int(sys.argv[5]) if len(sys.argv) > 5 else 3
target = np.array([39, 27, 37])
S = 132

for i, path in enumerate(sorted(glob.glob(pattern))):
    im = np.asarray(Image.open(path).convert("RGB")).astype(int)[cy : cy + 712, cx : cx + 1253]
    mask = np.abs(im - target).max(axis=2) <= 20
    cols = np.where(mask.sum(axis=0) > 60)[0]
    if len(cols) == 0:
        continue
    x0, x1 = cols.min(), cols.max()
    w = x1 - x0 + 1
    if w < 2 * S:
        continue
    mid = mask[:, x0 + int(0.4 * w) : x0 + int(0.6 * w)]
    ys = np.where(mid.sum(axis=1) > 0.5 * mid.shape[1])[0]
    if len(ys) == 0:
        continue
    top = ys.min()
    square = mask[top : top + S, x1 - S + 1 : x1 + 1]  # top-right: the art lives top-left
    dark = int(square.sum())
    cut = max(S * S - dark, 0)
    r = math.sqrt(cut / (1 - math.pi / 4))
    print(f"{t0 + i / fps:6.3f}s  w={w:4d}  top={top:4d}  radius~{r:5.1f}px")
