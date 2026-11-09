import io, os
from functools import lru_cache
from PIL import Image, ImageDraw, ImageFont

FONT = os.path.join(os.path.dirname(__file__), "Rubik.ttf")
GRAPHITE = (43, 45, 47)
PISTACHIO = (181, 217, 156)
MUTED = (140, 150, 135)


def _font(size, weight):
    f = ImageFont.truetype(FONT, size)
    try:
        f.set_variation_by_axes([weight])
    except Exception:
        pass
    return f


def _fit(draw, lines, max_w, start):
    size = start
    while size > 40:
        f = _font(size, 800)
        if all(draw.textlength(l, font=f) <= max_w for l in lines if l):
            return f, size
        size -= 4
    return _font(40, 800), 40


@lru_cache(maxsize=256)
def render(line1: str, line2: str) -> bytes:
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), GRAPHITE)
    d = ImageDraw.Draw(img)
    lines = [l for l in (line1, line2) if l]
    f, size = _fit(d, lines, W - 200, 104)
    lh = int(size * 1.12)
    total = lh * len(lines)
    y = (H - total) // 2 - 30
    for l in lines:
        w = d.textlength(l, font=f)
        d.text(((W - w) / 2, y), l, font=f, fill=PISTACHIO)
        y += lh
    small = _font(34, 700)
    brand = "polako."
    w = d.textlength(brand, font=small)
    d.text(((W - w) / 2, H - 92), brand, font=small, fill=MUTED)
    buf = io.BytesIO()
    img.save(buf, "PNG", optimize=True)
    return buf.getvalue()
