"""Dev tool: turn the owner's product shots into the menu pictures (runs locally, nothing is uploaded).

    .shots/venv/Scripts/python scripts/menu-images/build.py [--probe] [--sheet] [id ...]

Reads scripts/menu-images/originals/<menu item id>.png and writes src/assets/menu/<id>.webp: one transparent picture per item, 640 px on
its longer side and exactly as wide as the product is, so a sandwich is not shrunk to fit a square. Per picture: enhance (Real-ESRGAN
general x4v3 upscales the small shot and removes its compression noise), cut out (rembg isnet finds the product, closed-form matting draws
a soft edge, foreground estimation takes the old background's colour out of that edge), WebP under 60 kB. The original is never touched.
`--probe` writes every stage to .shots/menu-review/probe; `--sheet` writes review sheets to .shots/menu-review.

Per-item fixes live in scripts/menu-images/options.json, keyed by item id:
  "round": true        a whole pizza: cut the largest circle inside it (drops the board and the crop of the frame)
  "hull": 242          white on white (a carton): the product is the convex hull of what is darker than this (0-255)
  "polygon": [[x, y]]  the outline by hand, in shot pixels (after "crop"), when no automatic cut finds it; matting refines it
  "crop": [l, t, r, b] use only this part of the shot, as fractions of its width and height
See ADR 0017.
"""
import hashlib
import json
import sys
import urllib.request
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[2]
ORIGINALS = ROOT / "scripts/menu-images/originals"
OPTIONS_FILE = ROOT / "scripts/menu-images/options.json"
OUT = ROOT / "src/assets/menu"
REVIEW = ROOT / ".shots/menu-review"
CACHE = ROOT / ".shots/menu-cache"
MODEL = ROOT / ".shots/models/realesr-general-x4v3.pth"
MODEL_URL = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesr-general-x4v3.pth"
MODEL_SHA256 = "8dc7edb9ac80ccdc30c3a5dca6616509367f05fbc184ad95b731f05bece96292"

SUBJECT = 616  # px: the product's longer side. The card shows a picture at most 144 px high, the quick view 288 px, on screens up to 3x
MARGIN = 12  # px of transparent margin all round, so the longest side is 640
WORK = 1.3  # matting runs at this multiple of the final size, then shrinks (the shrink is what anti-aliases the edge)
BAND = 4  # px either side of the rough outline that matting may redraw
EDGE = 0.08  # alpha levels: below this is background, above 1 - this is solid; tightens the edge, which kills a light halo
MAX_KB = 60  # per picture; the textured ones (pizza) need most of it, a bottle needs a third
PAD = 0.06  # margin kept around the rough outline before enhancing, as a fraction of the longer side

OPTIONS = json.loads(OPTIONS_FILE.read_text(encoding="utf-8")) if OPTIONS_FILE.exists() else {}


def load_net():
    """Real-ESRGAN general x4v3 (SRVGGNetCompact): small enough for a CPU, trained on compressed web images."""
    import torch
    from torch import nn

    if not MODEL.exists():
        MODEL.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(MODEL_URL, MODEL)
    if hashlib.sha256(MODEL.read_bytes()).hexdigest() != MODEL_SHA256:
        sys.exit(f"{MODEL} does not match the official release; delete it and run again")

    class Net(nn.Module):
        def __init__(self, feat=64, convs=32, scale=4):
            super().__init__()
            layers = [nn.Conv2d(3, feat, 3, 1, 1), nn.PReLU(feat)]
            for _ in range(convs):
                layers += [nn.Conv2d(feat, feat, 3, 1, 1), nn.PReLU(feat)]
            layers.append(nn.Conv2d(feat, 3 * scale * scale, 3, 1, 1))
            self.body, self.up, self.scale = nn.ModuleList(layers), nn.PixelShuffle(scale), scale

        def forward(self, x):
            out = x
            for layer in self.body:
                out = layer(out)
            return self.up(out) + nn.functional.interpolate(x, scale_factor=self.scale, mode="nearest")

    net = Net()
    net.load_state_dict(torch.load(MODEL, map_location="cpu", weights_only=True)["params"], strict=True)
    return net.eval()


def enhance(net, name: str, image: Image.Image) -> Image.Image:
    """x4, cached: the upscaler is most of the run time and the cut-out is what gets tuned."""
    import torch

    key = hashlib.sha1(image.tobytes() + MODEL_SHA256.encode()).hexdigest()[:10]
    cached = CACHE / f"{name}-{key}.png"
    if cached.exists():
        return Image.open(cached).convert("RGB")
    x = torch.from_numpy(np.asarray(image, dtype=np.float32) / 255.0).permute(2, 0, 1).unsqueeze(0)
    with torch.no_grad():
        y = net(x).clamp_(0, 1)
    big = Image.fromarray((y.squeeze(0).permute(1, 2, 0).numpy() * 255.0 + 0.5).astype(np.uint8))
    CACHE.mkdir(parents=True, exist_ok=True)
    big.save(cached)
    return big


def main_part(mask: np.ndarray, floor=0.03) -> np.ndarray:
    """Keep the biggest piece and any piece at least `floor` of it (a lid, a straw); close the holes."""
    labels, count = ndimage.label(mask)
    if count > 1:
        sizes = ndimage.sum(mask, labels, range(1, count + 1))
        mask = np.isin(labels, [i + 1 for i, size in enumerate(sizes) if size >= sizes.max() * floor])
    return ndimage.binary_fill_holes(mask)


def hull(rgb: np.ndarray, threshold: float) -> np.ndarray:
    """White on white has no edge to find, but it is not featureless: the product is the convex hull of whatever is not white."""
    from skimage.morphology import convex_hull_image

    return convex_hull_image(main_part(ndimage.binary_closing(rgb.min(axis=2) < threshold, iterations=2)))


def polygon(points, size, scale=1.0) -> np.ndarray:
    canvas = Image.new("L", size, 0)
    ImageDraw.Draw(canvas).polygon([(x * scale, y * scale) for x, y in points], fill=255)
    return np.asarray(canvas) > 127


def cut_out(rgb: np.ndarray, mask: np.ndarray):
    """Soft alpha from a rough mask: only the band around the outline is solved, so the inside stays exactly as photographed."""
    from pymatting import estimate_alpha_cf, estimate_foreground_ml

    trimap = np.full(mask.shape, 0.5)
    trimap[ndimage.binary_erosion(mask, iterations=BAND)] = 1.0
    trimap[~ndimage.binary_dilation(mask, iterations=BAND)] = 0.0
    alpha = estimate_alpha_cf(rgb, trimap)
    alpha = np.clip((alpha - EDGE) / (1 - 2 * EDGE), 0, 1)
    keep = ndimage.binary_dilation(main_part(alpha > 0.5), iterations=2)  # drops specks the matting invented
    alpha = np.where(keep, alpha, 0)
    return alpha, estimate_foreground_ml(rgb, alpha)


def round_cut(rgb: np.ndarray, mask: np.ndarray):
    """A pizza is round, but its photo is cropped by the frame and shows the wooden board under it: cut the largest circle that fits
    inside the pizza itself (the board is dark, the crust and toppings are not), with a one pixel soft edge."""
    value = cv2.cvtColor(rgb.astype(np.float32), cv2.COLOR_RGB2HSV)[..., 2]
    pizza = main_part(ndimage.binary_closing(mask & (value > 0.5), iterations=3))
    dist = ndimage.distance_transform_edt(pizza)
    radius = dist.max()
    cy, cx = np.argwhere(dist >= 0.97 * radius).mean(axis=0)
    yy, xx = np.mgrid[: mask.shape[0], : mask.shape[1]]
    return np.clip(0.995 * radius - np.hypot(yy - cy, xx - cx) + 0.5, 0, 1), rgb


def flat_cut(rgb: np.ndarray, mask: np.ndarray):
    """No edge to solve for (white on white): the mask itself, pulled in a hair so no white fringe remains, a pixel soft."""
    return cv2.GaussianBlur(ndimage.binary_erosion(mask, iterations=2).astype(np.float32), (0, 0), 1.0), rgb


def resize(arr: np.ndarray, size) -> np.ndarray:
    shrinking = size[0] * size[1] < arr.shape[1] * arr.shape[0]
    return cv2.resize(arr, size, interpolation=cv2.INTER_AREA if shrinking else cv2.INTER_CUBIC)


def to_picture(rgb: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    """Crop to the product, scale its longer side to SUBJECT, add the margin. Resizing is done premultiplied, or the edge picks up a fringe."""
    ys, xs = np.where(alpha > 0.02)
    rgb, alpha = rgb[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1], alpha[ys.min() : ys.max() + 1, xs.min() : xs.max() + 1]
    scale = SUBJECT / max(alpha.shape)
    size = (max(round(alpha.shape[1] * scale), 1), max(round(alpha.shape[0] * scale), 1))
    pre = resize((rgb * alpha[..., None]).astype(np.float32), size)
    a = resize(alpha.astype(np.float32), size)
    rgb = np.where(a[..., None] > 1e-4, pre / np.maximum(a[..., None], 1e-4), 0)
    blur = cv2.GaussianBlur(rgb, (0, 0), 1.1)
    rgb = np.clip(rgb + 0.45 * (rgb - blur), 0, 1)  # a light unsharp pass: the upscaler leaves edges slightly soft
    out = np.zeros((size[1] + 2 * MARGIN, size[0] + 2 * MARGIN, 4), dtype=np.float32)
    out[MARGIN : MARGIN + size[1], MARGIN : MARGIN + size[0], :3] = rgb
    out[MARGIN : MARGIN + size[1], MARGIN : MARGIN + size[0], 3] = a
    return (np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)


def save_webp(rgba: np.ndarray, path: Path) -> int:
    image = Image.fromarray(rgba, "RGBA")
    for quality in (84, 80, 76, 72, 68, 64):
        image.save(path, "WEBP", quality=quality, alpha_quality=100, method=6)
        if path.stat().st_size <= MAX_KB * 1024:
            break
    return path.stat().st_size


def on(color, rgba: Image.Image) -> Image.Image:
    base = Image.new("RGB", rgba.size, color)
    base.paste(rgba, mask=rgba.getchannel("A"))
    return base


def sheets(names) -> None:
    """Review sheets from the finished pictures: the shot, then the picture on the card, the quick view's glow and a dark backdrop
    (a halo or a leftover of the old background shows on one of them), and an overview that draws them as the cards do (at most 144 px
    high, with the site's own drop shadow: --fx-item)."""
    from PIL import ImageFont

    font = ImageFont.load_default(size=14)
    REVIEW.mkdir(parents=True, exist_ok=True)
    cell, gap, across, down = 220, 10, 2, 3
    backdrops = ((254, 254, 254), (254, 235, 226), (42, 37, 48))
    item_w, item_h = 4 * (cell + gap), cell + 30
    number = 0
    for number, start in enumerate(range(0, len(names), across * down), 1):
        chunk = names[start : start + across * down]
        sheet = Image.new("RGB", (across * item_w + gap, -(-len(chunk) // across) * item_h + gap), (205, 205, 210))
        draw = ImageDraw.Draw(sheet)
        for i, name in enumerate(chunk):
            x0, y0 = gap + (i % across) * item_w, gap + (i // across) * item_h
            final = Image.open(OUT / f"{name}.webp").convert("RGBA")
            shot = Image.open(ORIGINALS / f"{name}.png").convert("RGB")
            draw.text((x0, y0), f"{name}   {(OUT / f'{name}.webp').stat().st_size / 1024:.0f} kB   shot {shot.width}x{shot.height}   picture {final.width}x{final.height}", fill=(0, 0, 0), font=font)
            for j, tile in enumerate([shot, *(on(color, final) for color in backdrops)]):
                tile.thumbnail((cell, cell), Image.LANCZOS)
                sheet.paste(tile, (x0 + j * (cell + gap), y0 + 22))
        sheet.save(REVIEW / f"sheet-{number}.png")

    columns, w, h = 6, 290, 215
    grid = Image.new("RGB", (columns * w, -(-len(names) // columns) * h), (254, 254, 254))
    draw = ImageDraw.Draw(grid)
    for i, name in enumerate(names):
        picture = Image.open(OUT / f"{name}.webp").convert("RGBA")
        picture.thumbnail((270, 144), Image.LANCZOS)
        shadow = Image.new("RGBA", picture.size, (39, 27, 37, 0))
        shadow.putalpha(picture.getchannel("A").point(lambda v: round(v * 0.16)))
        layer = Image.new("RGBA", (picture.width + 80, picture.height + 80), (0, 0, 0, 0))
        layer.paste(shadow, (40, 40 + 14))
        layer = layer.filter(ImageFilter.GaussianBlur(7))
        layer.alpha_composite(picture, (40, 40))
        x, y = (i % columns) * w + (w - layer.width) // 2, (i // columns) * h + 6 + (160 - layer.height) // 2
        grid.paste(layer, (x, y), layer)
        draw.text(((i % columns) * w + 8, (i // columns) * h + h - 22), name, fill=(90, 80, 90), font=font)
    grid.save(REVIEW / "overview.png")
    print(f"{len(names)} pictures: {REVIEW}/overview.png and sheet-1..{number}.png")


def process(session, net, name: str, probe: bool = False) -> dict:
    from rembg import remove

    options = OPTIONS.get(name, {})
    source = Image.open(ORIGINALS / f"{name}.png").convert("RGB")
    if "crop" in options:
        l, t, r, b = options["crop"]
        source = source.crop((round(l * source.width), round(t * source.height), round(r * source.width), round(b * source.height)))
    if "polygon" in options:
        rough = polygon(options["polygon"], source.size)
    elif "hull" in options:
        rough = hull(np.asarray(source) / 255.0, options["hull"] / 255.0)
    else:
        rough = main_part(np.asarray(remove(source, session=session, only_mask=True), dtype=np.float32) / 255.0 > 0.5)
    ys, xs = np.where(rough)
    pad = round(PAD * max(source.size))
    box = (max(xs.min() - pad, 0), max(ys.min() - pad, 0), min(xs.max() + 1 + pad, source.width), min(ys.max() + 1 + pad, source.height))
    crop = source.crop(box)
    rough = rough[box[1] : box[3], box[0] : box[2]]

    big = enhance(net, name, crop)
    long_side = max(xs.max() - xs.min() + 1, ys.max() - ys.min() + 1)
    work_size = tuple(round(v * (WORK * SUBJECT) / (long_side * 4)) for v in big.size)
    work = np.asarray(big.resize(work_size, Image.LANCZOS), dtype=np.float64) / 255.0
    if "polygon" in options:  # drawn again at work size: a hand-made outline should not be a staircase of shot pixels
        mask = polygon([(x - box[0], y - box[1]) for x, y in options["polygon"]], work_size, work_size[0] / crop.width)
    elif "hull" in options:
        mask = hull(work, options["hull"] / 255.0)
    else:
        mask = cv2.resize(rough.astype(np.float32), work_size, interpolation=cv2.INTER_CUBIC) > 0.5
    cut = round_cut if options.get("round") else flat_cut if "hull" in options else cut_out
    alpha, foreground = cut(work, mask)
    final = to_picture(foreground, alpha)
    size = save_webp(final, OUT / f"{name}.webp")

    sharp = cv2.Laplacian(cv2.cvtColor(np.asarray(crop), cv2.COLOR_RGB2GRAY), cv2.CV_64F).var()
    print(f"{name}: shot {source.width}x{source.height} (sharpness {sharp:.0f}), enhanced x4, picture {final.shape[1]}x{final.shape[0]}, {size / 1024:.1f} kB")
    return {"source": source, "crop": crop, "big": big, "alpha": alpha, "final": final} if probe else {}


def main() -> None:
    args = sys.argv[1:]
    names = [a for a in args if not a.startswith("--")] or sorted(p.stem for p in ORIGINALS.glob("*.png"))
    if "--sheet" in args:
        return sheets(names)
    from rembg import new_session

    OUT.mkdir(parents=True, exist_ok=True)
    net, session = load_net(), new_session("isnet-general-use")
    for name in names:
        stages = process(session, net, name, probe="--probe" in args)
        if stages:
            folder = REVIEW / "probe"
            folder.mkdir(parents=True, exist_ok=True)
            Image.fromarray(stages["final"], "RGBA").save(folder / f"{name}-final.png")
            stages["big"].save(folder / f"{name}-esrgan.png")
            stages["crop"].resize(stages["big"].size, Image.LANCZOS).save(folder / f"{name}-lanczos.png")
            Image.fromarray((stages["alpha"] * 255).astype(np.uint8)).save(folder / f"{name}-alpha.png")


if __name__ == "__main__":
    main()
