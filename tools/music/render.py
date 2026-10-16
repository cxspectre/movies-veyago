"""render.py — composes, renders, mixes and writes every version of the score.

Writes audio/music/<version>/music-<version>-{mix,piano,strings,pulse,texture}.wav (48 kHz, stereo,
24-bit). The mix is the exact sum of the four stems (before 24-bit rounding).
Run: .venv/bin/python -I tools/music/render.py [master|vertical|teaser ...]   (default: all)
"""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import soundfile as sf  # noqa: E402

import compose  # noqa: E402
from config import ANALYSIS_DIR, OUT_DIR, SR, STEMS  # noqa: E402
from mixbus import master_bus  # noqa: E402
from stems import render_stems  # noqa: E402

SUBTYPE = "PCM_24"


def output_path(version: str, name: str) -> Path:
    return OUT_DIR / version / f"music-{version}-{name}.wav"


def write(path: Path, audio: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    peak = float(np.abs(audio).max())
    if peak >= 1.0:
        raise ValueError(f"{path.name} would clip (peak {peak:.3f})")
    sf.write(path, audio, SR, subtype=SUBTYPE)


def render_version(name: str, arrangement) -> dict:
    started = time.time()
    stems, bus = master_bus(render_stems(arrangement))
    mix = sum(stems.values())
    write(output_path(name, "mix"), mix)
    for stem in STEMS:
        write(output_path(name, stem), stems[stem])
    report = {"version": name, "seconds": arrangement.duration, "render_seconds": round(time.time() - started, 1), **bus}
    ANALYSIS_DIR.mkdir(parents=True, exist_ok=True)
    (ANALYSIS_DIR / f"{name}_render.json").write_text(json.dumps(report, indent=1))
    return report


def main(argv: list) -> None:
    arrangements = compose.main()
    wanted = argv or list(arrangements)
    unknown = [w for w in wanted if w not in arrangements]
    if unknown:
        raise SystemExit(f"Unknown version(s): {unknown}; choose from {list(arrangements)}")
    for name in wanted:
        print(json.dumps(render_version(name, arrangements[name])))


if __name__ == "__main__":
    main(sys.argv[1:])
