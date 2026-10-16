"""conf4.py — constants for the v4 (10:00) score pipeline (tools/music4).

The v4 tools reuse the v1 instruments, DSP and measurements from tools/music unchanged (imported, never
edited); this module puts both folders on the import path and names everything v4-specific: output paths,
the chapter slots (mirrors src/film4.ts, checked against it by `check_slots`), the master silences.
Times are seconds; at 60 BPM one beat is exactly one second.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
FILM_ROOT = HERE.parents[1]
V1_TOOLS = FILM_ROOT / "tools" / "music"
for p in (str(V1_TOOLS), str(HERE)):
    if p not in sys.path:
        sys.path.insert(0, p)

OUT_DIR = FILM_ROOT / "audio" / "v4" / "music"
MASTER_DIR = OUT_DIR / "master"
CHAPTER_DIR = OUT_DIR / "chapters"
EVENTS_DIR = OUT_DIR / "events"
MIDI_DIR = OUT_DIR / "midi"
ANALYSIS_DIR = OUT_DIR / "analysis"
FILM4_TS = FILM_ROOT / "src" / "film4.ts"
EDITS4_TS = FILM_ROOT / "src" / "edits4.ts"

SR = 48_000
BPM = 60
BAR_BEATS = 4
MASTER_SECONDS = 600.0
CHAPTER_TAIL_S = 6.0  # a chapter is rendered this far past its end so its reverb rings naturally into the next
CHAPTER_FILE_FADE_S = 0.75  # the per-chapter premix: its own tail is faded to zero exactly on the boundary
STEMS = ("piano", "strings", "pulse", "texture")
TARGET_LUFS = -18.0
TRUE_PEAK_CEILING_DBTP = -1.5
SUBTYPE = "PCM_24"

# (id, number, start, end) in master seconds: must equal SLOTS4 in src/film4.ts.
CHAPTERS = (
    ("line", 1, 0.0, 30.0), ("mayasHouse", 2, 30.0, 75.0), ("theNo", 3, 75.0, 115.0),
    ("filterMachine", 4, 115.0, 170.0), ("researchBoard", 5, 170.0, 235.0), ("nameAndLook", 6, 235.0, 290.0),
    ("engineRoom", 7, 290.0, 365.0), ("launch", 8, 365.0, 415.0), ("village", 9, 415.0, 490.0),
    ("paperToGlass", 10, 490.0, 570.0), ("providedFor", 11, 570.0, 600.0),
)
CHAPTER_START = {c[0]: c[2] for c in CHAPTERS}
CHAPTER_LENGTH = {c[0]: c[3] - c[2] for c in CHAPTERS}


def check_slots() -> None:
    """Fail loudly if src/film4.ts and this table disagree (a moved boundary moves the whole score)."""
    text = FILM4_TS.read_text()
    found = re.findall(r"id: '(\w+)', number: (\d+), title: .*?, start: at\((\d+), (\d+)\), end: at\((\d+), (\d+)\)", text)
    table = tuple((i, int(nr), int(a) * 60 + int(b), int(c) * 60 + int(d)) for i, nr, a, b, c, d in found)
    expected = tuple((i, nr, int(s), int(e)) for i, nr, s, e in CHAPTERS)
    if table != expected:
        raise SystemExit(f"src/film4.ts slots differ from tools/music4/conf4.py CHAPTERS:\n  film4: {table}\n  conf4: {expected}")


def bar_lines() -> tuple:
    """Master bar lines: every 4 s from each chapter start; a chapter's last bar is shortened to end on the boundary."""
    lines = []
    for _, _, start, end in CHAPTERS:
        t = start
        while t < end - 1e-9:
            lines.append(t)
            t += BAR_BEATS
    return tuple(lines) + (MASTER_SECONDS,)
