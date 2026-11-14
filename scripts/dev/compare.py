"""Compare a screenshot against a reel frame: blend overlay + mean abs diff.

usage: python compare.py REF_FRAME.png OURS.png OUT.png [--mode blend|side]
The reel frame is cropped to the page area (x 11..1263, y 3..714 -> 1253 x 712).
"""
import sys

import numpy as np
from PIL import Image

ref_path, ours_path, out_path = sys.argv[1:4]
mode = sys.argv[sys.argv.index("--mode") + 1] if "--mode" in sys.argv else "blend"

ref = Image.open(ref_path).convert("RGB").crop((11, 3, 1264, 715))
ours = Image.open(ours_path).convert("RGB")
if ours.size != ref.size:
    ours = ours.resize(ref.size, Image.LANCZOS)

a = np.asarray(ref).astype(float)
b = np.asarray(ours).astype(float)
print("mean abs diff (0-255):", round(float(np.abs(a - b).mean()), 2))

if mode == "side":
    sheet = Image.new("RGB", (ref.width * 2 + 8, ref.height), "white")
    sheet.paste(ref, (0, 0))
    sheet.paste(ours, (ref.width + 8, 0))
    sheet = sheet.resize((sheet.width // 2, sheet.height // 2), Image.LANCZOS)
    sheet.save(out_path)
else:
    # reference in magenta-ish channel split: ours in green, ref in red/blue => aligned = grey, offset = colored fringes
    ga = np.asarray(ref.convert("L")).astype(float)
    gb = np.asarray(ours.convert("L")).astype(float)
    rgb = np.stack([ga, gb, ga], axis=2)
    Image.fromarray(rgb.astype("uint8")).save(out_path)
print("wrote", out_path)
