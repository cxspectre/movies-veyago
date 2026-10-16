"""Lay VO line files onto one full-length stem.

    .venv/bin/python tools/vo/place.py --timing audio/vo/timing.json --out audio/vo/vo_stem_master.wav
    .venv/bin/python tools/vo/place.py --list placements.json --out some_stem.wav [--length 160]

A placements list is JSON: [{"file": "audio/vo/vo1.wav", "startMaster": 7.0}, ...]
(paths relative to Film/ or absolute). Every file is resampled to 48 kHz if needed, summed
to mono, and written as 48 kHz 24-bit stereo (the same signal on both channels), so the
mixer can drop the stem at 0:00 of the master. Placement is sample-accurate
(round(startMaster * 48000)). Overlaps and files running past the end are reported and
fail the run, because both mean the timing is wrong, not the stem.
"""

import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import soundfile as sf

from vo_audio import OUT_RATE, resample, true_peak_dbtp, write_wav24

FILM_DIR = Path(__file__).resolve().parents[2]
MASTER_LENGTH_SEC = 160.0


@dataclass(frozen=True)
class Placement:
    file: Path
    start_master: float


def _resolve(path: str, base: Path) -> Path:
    p = Path(path)
    return p if p.is_absolute() else (base / p)


def placements_from_list(path: Path) -> list[Placement]:
    items = json.loads(path.read_text())
    if not isinstance(items, list):
        raise ValueError("A placements file must be a JSON list of {file, startMaster}")
    out = []
    for i, item in enumerate(items):
        if not isinstance(item, dict) or "file" not in item or "startMaster" not in item:
            raise ValueError(f"Placement {i} needs 'file' and 'startMaster'")
        start = float(item["startMaster"])
        if start < 0:
            raise ValueError(f"Placement {i} starts before 0")
        out.append(Placement(_resolve(str(item["file"]), FILM_DIR), start))
    return out


def placements_from_timing(path: Path) -> list[Placement]:
    timing = json.loads(path.read_text())
    return [Placement(path.parent / line["file"], float(line["windowStartMaster"])) for line in timing["lines"]]


def _load_mono(path: Path) -> np.ndarray:
    if not path.exists():
        raise FileNotFoundError(f"{path} does not exist")
    data, rate = sf.read(str(path), always_2d=True, dtype="float64")
    return resample(data.mean(axis=1), rate, OUT_RATE)


def build_stem(placements: list[Placement], length_sec: float) -> np.ndarray:
    total = int(round(length_sec * OUT_RATE))
    stem = np.zeros(total)
    ends: list[tuple[float, float, Path]] = []
    for p in sorted(placements, key=lambda x: x.start_master):
        audio = _load_mono(p.file)
        a = int(round(p.start_master * OUT_RATE))
        b = a + len(audio)
        if b > total:
            raise ValueError(f"{p.file.name} runs to {b / OUT_RATE:.2f}s, past the {length_sec}s stem")
        if ends and a < int(round(ends[-1][1] * OUT_RATE)):
            raise ValueError(f"{p.file.name} at {p.start_master}s overlaps {ends[-1][2].name} (ends {ends[-1][1]:.2f}s)")
        stem[a:b] += audio
        ends.append((p.start_master, b / OUT_RATE, p.file))
    return stem


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    src = parser.add_mutually_exclusive_group(required=True)
    src.add_argument("--timing", type=Path, help="timing.json from render_vo.py")
    src.add_argument("--list", type=Path, help="JSON list of {file, startMaster}")
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--length", type=float, default=MASTER_LENGTH_SEC)
    args = parser.parse_args()
    try:
        placements = placements_from_timing(args.timing) if args.timing else placements_from_list(args.list)
        stem = build_stem(placements, args.length)
    except (ValueError, FileNotFoundError, KeyError) as error:
        sys.exit(f"place.py: {error}")
    write_wav24(args.out, np.stack([stem, stem], axis=1))
    print(f"{args.out}: {len(placements)} lines, {args.length:.1f}s, true peak {true_peak_dbtp(stem):.2f} dBTP")


if __name__ == "__main__":
    main()
