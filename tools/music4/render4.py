"""render4.py — composes, renders, mixes and writes the 10-minute v4 score.

Writes (48 kHz, stereo, 24-bit PCM WAV):
  audio/v4/music/master/music4-master-{mix,piano,strings,pulse,texture}.wav   the 600 s master and its stems
  audio/v4/music/chapters/music4-<nn>-<chapter>.wav                          one premix per chapter
  audio/v4/music/events/master.json, midi/master.mid                         the exact events, one MIDI file
  audio/v4/music/analysis/render.json                                        bus report
Each chapter is rendered on its own (plus a 6 s tail for its reverb) and laid into the master at its slot.
Run: .venv/bin/python -I tools/music4/render4.py
"""
from __future__ import annotations

import json
import time

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import conf4  # noqa: F401,E402  (puts tools/music and tools/music4 on the path)
import numpy as np
import soundfile as sf

import compose4
from bus4 import master_bus, true_peak_db
from conf4 import (ANALYSIS_DIR, CHAPTER_DIR, CHAPTER_FILE_FADE_S, CHAPTER_LENGTH, CHAPTER_START, CHAPTERS, MASTER_DIR, MASTER_SECONDS,
                   SR, STEMS, SUBTYPE)
from mixbus import integrated_lufs
from stems4 import render_chapter


def write(path, audio: np.ndarray) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    peak = float(np.abs(audio).max())
    if peak >= 1.0:
        raise ValueError(f"{path.name} would clip (peak {peak:.3f})")
    sf.write(path, audio, SR, subtype=SUBTYPE)


def master_path(name: str):
    return MASTER_DIR / f"music4-master-{name}.wav"


def chapter_path(number: int, chapter: str):
    return CHAPTER_DIR / f"music4-{number:02d}-{chapter}.wav"


def zero_master(stems: dict, scores: dict) -> dict:
    """Every chapter's zero windows are exact zero in the master too (tails from earlier chapters included)."""
    out = {}
    for name, x in stems.items():
        y = x.copy()
        for cid, cs in scores.items():
            for start, end, _ in cs.zeros:
                y[int(round((CHAPTER_START[cid] + start) * SR)): int(round((CHAPTER_START[cid] + end) * SR))] = 0.0
        out[name] = y
    return out


def render_all(scores: dict) -> tuple:
    n = int(round(MASTER_SECONDS * SR))
    stems = {name: np.zeros((n, 2), dtype=np.float32) for name in STEMS}
    premix = {}
    for cid, _, start, end in CHAPTERS:
        t0 = time.time()
        chapter = render_chapter(scores[cid])
        a = int(round(start * SR))
        for name in STEMS:
            seg = chapter[name][: n - a]
            stems[name][a:a + len(seg)] += seg
        premix[cid] = sum(chapter.values())[: int(round(CHAPTER_LENGTH[cid] * SR))]
        print(f"  rendered {cid:14s} {end - start:5.1f} s in {time.time() - t0:5.1f} s", flush=True)
    return zero_master(stems, scores), premix


def chapter_files(premix: dict, gain: np.ndarray) -> list:
    rows = []
    fade = int(CHAPTER_FILE_FADE_S * SR)
    for cid, number, start, end in CHAPTERS:
        a = int(round(start * SR))
        x = premix[cid] * gain[a:a + len(premix[cid])][:, None]
        x[-fade:] *= (np.cos(np.linspace(0, np.pi / 2, fade)) ** 2)[:, None]
        x[-1] = 0.0
        write(chapter_path(number, cid), x.astype(np.float32))
        rows.append({"chapter": cid, "number": number, "seconds": end - start, "lufs": round(integrated_lufs(x), 2),
                     "true_peak_dbtp": round(true_peak_db(x), 2)})
    return rows


def main() -> dict:
    started = time.time()
    scores = compose4.main()
    stems, premix = render_all(scores)
    stems, gain, report = master_bus(stems)
    mix = sum(stems.values())
    write(master_path("mix"), mix)
    for name in STEMS:
        write(master_path(name), stems[name])
    report["sum_error_max"] = float(np.abs(mix - sum(stems.values())).max())
    report["chapters"] = chapter_files(premix, gain)
    report["render_seconds"] = round(time.time() - started, 1)
    ANALYSIS_DIR.mkdir(parents=True, exist_ok=True)
    (ANALYSIS_DIR / "render.json").write_text(json.dumps(report, indent=1))
    print(json.dumps({k: v for k, v in report.items() if k != "chapters"}))
    return report


if __name__ == "__main__":
    main()
