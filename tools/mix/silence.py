"""silence.py - the exact-zero silence logic of the mix, free of audio-file libraries so it can be tested anywhere.

A cue sheet names its silences two ways, and both are honoured:
  "silences":     [{"start": 113.0, "end": 115.0}]                    (the v1 shape; seconds on the sheet's timeline)
  a "silence" cue {"kind": "silence", "at": 113.0, "dur": 2.0}        (v4; in "cues" or in "silenceCues")
Every stem is gated with the same mask, and the final mix is gated again after the limiter, so the range is exact zeros.
"""
import numpy as np


def silence_ranges(sheet):
    """[(start, end)] seconds, sorted, from `silences` and from silence cues; duplicates collapse."""
    found = {(float(s["start"]), float(s["end"])) for s in sheet.get("silences", [])}
    for cue in list(sheet.get("cues", [])) + list(sheet.get("silenceCues", [])):
        if cue.get("kind") == "silence":
            found.add((float(cue["at"]), float(cue["at"]) + float(cue["dur"])))
    return sorted(found)


def silence_mask(n, ranges, sr):
    """1.0 everywhere except exactly 0.0 inside the ranges (sample indices rounded as the v1 mix does)."""
    mask = np.ones(n)
    for start, end in ranges:
        mask[int(round(start * sr)):int(round(end * sr))] = 0.0
    return mask


def gate(stem, ranges, sr):
    """A copy of a (samples, channels) stem with the ranges set to exact digital zero."""
    return stem * silence_mask(stem.shape[0], ranges, sr)[:, None]


def exact_zero(x, ranges, sr):
    """One bool per range: is the audio exactly zero there on every channel."""
    return [bool(np.all(x[int(round(a * sr)):int(round(b * sr))] == 0)) for a, b in ranges]
