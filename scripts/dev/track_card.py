"""Measure the dark Follow card in CDP screencast frames (width/top per frame).

usage: python track_card.py FRAMES_DIR
Frame names are f_<ms since first wheel + 100000>.jpg; the card colour is #271B25.
"""
import glob
import os
import sys

import numpy as np
from PIL import Image

folder = sys.argv[1]
files = sorted(glob.glob(os.path.join(folder, "f_*.jpg")))
target = np.array([39, 27, 37])
prev_w = None
for path in files:
    ms = int(os.path.basename(path)[2:9]) - 100000
    im = np.asarray(Image.open(path).convert("RGB")).astype(int)
    mask = np.abs(im - target).max(axis=2) <= 20
    cols = np.where(mask.sum(axis=0) > 60)[0]
    if len(cols) == 0:
        continue
    x0, x1 = cols.min(), cols.max()
    w = x1 - x0 + 1
    rows = np.where(mask[:, x0 : x1 + 1].sum(axis=1) > 0.55 * w)[0]
    top = rows.min() if len(rows) else -1
    if w != prev_w:
        print(f"{ms:6d} ms  x {x0}..{x1} w={w}  top={top}")
    prev_w = w
