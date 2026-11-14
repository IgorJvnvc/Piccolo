"""Tile screenshots into one contact sheet: python tile.py OUT.png COLS SCALE img1 img2 ..."""
import sys

from PIL import Image

out, cols, scale = sys.argv[1], int(sys.argv[2]), float(sys.argv[3])
paths = sys.argv[4:]
images = []
for p in paths:
    im = Image.open(p).convert("RGB")
    images.append(im.resize((int(im.width * scale), int(im.height * scale)), Image.LANCZOS))
w = max(i.width for i in images)
h = max(i.height for i in images)
rows = (len(images) + cols - 1) // cols
sheet = Image.new("RGB", (cols * w + (cols - 1) * 6, rows * h + (rows - 1) * 6), (120, 120, 120))
for k, im in enumerate(images):
    sheet.paste(im, ((k % cols) * (w + 6), (k // cols) * (h + 6)))
sheet.save(out)
print(out, sheet.size)
