# Uso (desde web/): python scripts/halftone.py  -> crea public/images/page/*-trama.png
# Genera una trama de medios tonos (halftone) real: puntos negros cuyo tamaño depende de lo oscuro
# de la foto, en una grilla girada 45° como en la serigrafía. Fondo transparente.
import math, sys
from PIL import Image, ImageDraw, ImageOps, ImageFilter, ImageEnhance

def halftone(src, dst, cell=16, angle=45, ss=3):
    im = Image.open(src).convert('L')
    im = ImageEnhance.Contrast(im).enhance(1.25)
    W, H = im.size
    small = im.filter(ImageFilter.GaussianBlur(cell / 3))
    px = small.load()
    out = Image.new('L', (W * ss, H * ss), 0)  # alfa: 255 = punto
    d = ImageDraw.Draw(out)
    a = math.radians(angle); ca, sa = math.cos(a), math.sin(a)
    diag = int(math.hypot(W, H) / cell) + 2
    cx, cy = W / 2, H / 2
    for i in range(-diag, diag):
        for j in range(-diag, diag):
            u, v = i * cell, j * cell
            x = cx + u * ca - v * sa
            y = cy + u * sa + v * ca
            if x < -cell or y < -cell or x > W + cell or y > H + cell:
                continue
            xs, ys = min(max(int(x), 0), W - 1), min(max(int(y), 0), H - 1)
            dark = (1 - px[xs, ys] / 255) ** 2.4  # zonas claras: puntos mínimos
            r = cell * 0.72 * math.sqrt(dark)
            if r < 0.35:
                continue
            d.ellipse([(x - r) * ss, (y - r) * ss, (x + r) * ss, (y + r) * ss], fill=255)
    alpha = out.resize((W, H), Image.LANCZOS)
    res = Image.new('LA', (W, H), 0)
    res.putalpha(alpha)
    res.save(dst, optimize=True)

base = 'public/images/page/'
for name in ['ave-mar', 'nadar-globo']:
    halftone(base + name + '.jpg', base + name + '-trama.png')
    print(name, 'ok')
