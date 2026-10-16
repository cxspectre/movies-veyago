"""findcolor.py <png> <r> <g> <b> [minY pt] : prints the centre (x y, in points) of the widest
horizontal band of pixels close to the colour below minY, e.g. to find the red Call button
after a scroll whose length varies with machine load."""
import sys

import numpy as np
from PIL import Image

SCALE = 3
TOLERANCE = 30
MIN_RUN = 150  # pixels in a row that must match


def main():
    path, r, g, b = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])
    min_y = int(float(sys.argv[5]) * SCALE) if len(sys.argv) > 5 else 0
    img = np.asarray(Image.open(path).convert("RGB")).astype(np.int16)
    close = (np.abs(img - np.array([r, g, b])).sum(axis=2) < TOLERANCE)
    rows = [y for y in range(min_y, img.shape[0]) if close[y].sum() > MIN_RUN]
    if not rows:
        print("none")
        sys.exit(1)
    # The first contiguous run of matching rows.
    run = [rows[0]]
    for y in rows[1:]:
        if y != run[-1] + 1:
            break
        run.append(y)
    xs = np.where(close[run[len(run) // 2]])[0]
    print(round(float(xs.mean()) / SCALE, 1), round((run[0] + run[-1]) / 2 / SCALE, 1))


if __name__ == "__main__":
    main()
