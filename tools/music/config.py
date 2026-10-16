"""config.py — shared constants for the score pipeline (tools/music).

Everything here is a named constant so the composition and the render never hard-code paths,
rates or the tempo grid. Times are seconds; at 60 BPM one beat is exactly one second.
"""
from pathlib import Path

FILM_ROOT = Path(__file__).resolve().parents[2]
TOOLS_DIR = FILM_ROOT / "tools" / "music"
VENDOR_DIR = TOOLS_DIR / ".vendor" / "vsco2ce"
OUT_DIR = FILM_ROOT / "audio" / "music"
ANALYSIS_DIR = OUT_DIR / "analysis"
EVENTS_DIR = OUT_DIR / "events"
MIDI_DIR = OUT_DIR / "midi"
CACHE_DIR = TOOLS_DIR / ".cache"

SR = 48_000  # delivery sample rate
BPM = 60
BEAT = 60.0 / BPM  # seconds per beat (1.0)
BAR = 4 * BEAT  # 4/4, bar lines on every 4th second

STEMS = ("piano", "strings", "pulse", "texture")

# Loudness targets for the music bus (the mixer adds VO on top).
TARGET_LUFS = -18.0
TRUE_PEAK_CEILING_DBTP = -1.5  # delivered peak must be below -1 dBTP; we aim lower for safety
SYNC_TOLERANCE_S = 0.020

# Versions: name -> (duration seconds, arrangement module)
VERSIONS = {
    "master": 160.0,
    "vertical": 45.0,
    "teaser": 15.0,
}
