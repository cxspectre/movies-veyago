"""pair.py a.png b.png [c.png ...] : side-by-side preview at 1/3 scale into $RAW/crop.png."""
import sys

from PIL import Image

images = [Image.open(p).convert("RGB") for p in sys.argv[1:]]
w, h = images[0].width // 3, images[0].height // 3
sheet = Image.new("RGB", (w * len(images), h))
for i, im in enumerate(images):
    sheet.paste(im.resize((w, h)), (i * w, 0))
sheet.save("/tmp/pv-film-raw/crop.png")
