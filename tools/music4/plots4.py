"""plots4.py — one quick-look picture of the 600 s master: per-stem level (100 ms RMS) with the chapter bar
lines, the zero windows and the sync points. Writes audio/v4/music/analysis/master_overview.png.
Run: .venv/bin/python -I tools/music4/plots4.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import conf4  # noqa: F401,E402

import matplotlib  # noqa: E402

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
import soundfile as sf  # noqa: E402

from conf4 import ANALYSIS_DIR, CHAPTERS, MASTER_DIR, SR, STEMS  # noqa: E402

WINDOW_S = 0.1
FLOOR_DB = -80.0
COLOURS = {"mix": "#222222", "piano": "#b5651d", "strings": "#3b6ea8", "pulse": "#6a9a3b", "texture": "#9a6ab0"}


def level(x: np.ndarray) -> np.ndarray:
    n = int(WINDOW_S * SR)
    frames = len(x) // n
    power = (x[: frames * n].mean(axis=1) ** 2).reshape(frames, n).mean(axis=1)
    return np.maximum(10 * np.log10(power + 1e-20), FLOOR_DB)


def main() -> None:
    report = json.loads((ANALYSIS_DIR / "report.json").read_text())
    fig, ax = plt.subplots(figsize=(24, 6), dpi=110)
    for name in ("mix",) + STEMS:
        x, _ = sf.read(MASTER_DIR / f"music4-master-{name}.wav", dtype="float32")
        db = level(x)
        ax.plot(np.arange(len(db)) * WINDOW_S, db, lw=0.6 if name != "mix" else 0.9, color=COLOURS[name], label=name)
    for cid, number, start, _ in CHAPTERS:
        ax.axvline(start, color="#999999", lw=0.8)
        ax.text(start + 0.5, -8, f"{number} {cid}", fontsize=8, va="top")
    for row in report["zero_windows"]:
        ax.axvspan(row["t"], float(row["method"].split(":")[1]), color="#d04040", alpha=0.25)
    for row in report["sync"]:
        ax.plot([row["t"]], [-6], marker="v", ms=3, color="#2a8a2a" if row["pass"] else "#d04040")
    ax.set_xlim(0, 600)
    ax.set_ylim(FLOOR_DB, 0)
    ax.set_xticks(np.arange(0, 601, 30))
    ax.set_xlabel("master seconds")
    ax.set_ylabel("100 ms RMS, dBFS")
    ax.legend(loc="lower right", fontsize=8, ncol=5)
    ax.set_title("Provided For v4 score: stem levels, chapter bar lines (grey), zero windows (red), sync points (triangles)")
    fig.tight_layout()
    fig.savefig(ANALYSIS_DIR / "master_overview.png")


if __name__ == "__main__":
    main()
