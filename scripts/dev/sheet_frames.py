import glob
import os
import sys

from PIL import Image, ImageDraw

folder, out = sys.argv[1], sys.argv[2]
wanted = [int(x) for x in sys.argv[3].split(",")]
box = tuple(int(v) for v in sys.argv[4].split(","))
scale = float(sys.argv[5])
cols = int(sys.argv[6])

files = sorted(glob.glob(os.path.join(folder, "f_*.jpg")))
times = {int(os.path.basename(p)[2:9]) - 100000: p for p in files}
picked = []
for w in wanted:
    ms = min(times, key=lambda t: abs(t - w))
    picked.append((ms, times[ms]))

tw, th = int((box[2] - box[0]) * scale), int((box[3] - box[1]) * scale)
rows = (len(picked) + cols - 1) // cols
sheet = Image.new("RGB", (cols * tw, rows * th), "white")
d = ImageDraw.Draw(sheet)
for k, (ms, path) in enumerate(picked):
    im = Image.open(path).convert("RGB").crop(box).resize((tw, th), Image.LANCZOS)
    x, y = (k % cols) * tw, (k // cols) * th
    sheet.paste(im, (x, y))
    d.rectangle([x, y, x + 62, y + 14], fill=(255, 255, 0))
    d.text((x + 3, y + 1), f"{ms} ms", fill=(0, 0, 0))
sheet.save(out)
print(out, [ms for ms, _ in picked])
