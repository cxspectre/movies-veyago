"""Prints how much the picture changes every 0.25 s of a video (mean absolute difference of
small grey frames), to find where the motion is and pick trims and hot windows.

    .venv/bin/python motion.py <video>
"""
import subprocess
import sys

import numpy as np

W, H = 60, 130
RATE = int(sys.argv[2]) if len(sys.argv) > 2 else 4


def main():
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", sys.argv[1], "-vf", f"fps={RATE},scale={W}:{H},format=gray",
         "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
    frames = np.frombuffer(raw, dtype=np.uint8).reshape(-1, H, W).astype(np.int16)
    for i in range(1, len(frames)):
        diff = float(np.abs(frames[i] - frames[i - 1]).mean())
        print(f"{i / RATE:6.2f}s {diff:6.2f} {'#' * min(60, int(diff * 4))}")


if __name__ == "__main__":
    main()
