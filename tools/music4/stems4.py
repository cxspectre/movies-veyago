"""stems4.py — renders one ChapterScore into its four stems (piano, strings, pulse, texture).

The instruments, EQ and spaces are v1's (tools/music: inst_piano, inst_strings, inst_synth, stems.eq / WET /
the room and hall impulses), so the 10-minute score sounds like the 2:40 one. New here: the woodblock
(chapter 7's train), zero windows (rests and silences, exact digital zero with a short fade into them),
and the forced end. Hard stops work as in v1: the music before a stop is cut on the stop (4 ms fade that
ends on it) with its reverb, and nothing of it reappears later.
"""
from __future__ import annotations

import numpy as np

import inst_piano
import inst_strings
import inst_synth
from conf4 import CHAPTER_TAIL_S, SR, STEMS
from dsp import bandpass, curve, db_to_gain
from score4 import STEM_OF4, ChapterScore
from stems import WET, cut_at, eq, with_space  # v1

REST_FADE_S = 0.25  # music running into a rest fades over this long and is zero from the rest's first sample
WOOD_LEVEL_DB = -20.0
WOOD_DECAY_S = 0.035
WOOD_PARTIAL_RATIOS = ((1.0, 1.0), (2.76, 0.45), (5.4, 0.2))  # a hollow block: inharmonic modes
WOOD_BASE_HZ = {79: 1180.0, 76: 980.0}
WOOD_WET = (0.25, 0.08)
WOOD_PAN = (0.9, 1.1)


def wood_note(note, seed: int) -> np.ndarray:
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    f0 = WOOD_BASE_HZ.get(note.key, 1100.0)
    body = sum(a * np.sin(2 * np.pi * f0 * r * t) * np.exp(-t / (WOOD_DECAY_S / r ** 0.5)) for r, a in WOOD_PARTIAL_RATIOS)
    rng = np.random.default_rng(seed)
    click = bandpass(rng.standard_normal(n), 1500.0, 6000.0) * np.exp(-t / 0.002) * 0.3
    mono = (body + click) * db_to_gain(WOOD_LEVEL_DB - 18.0 * (1 - note.vel))
    return np.stack([mono * WOOD_PAN[0], mono * WOOD_PAN[1]], axis=1)


def render_wood(notes: tuple, n: int) -> np.ndarray:
    out = np.zeros((n, 2), dtype=np.float32)
    for i, note in enumerate(notes):
        start = int(round(note.t * SR))
        sig = wood_note(note, 5000 + i)
        end = min(n, start + len(sig))
        out[start:end] += sig[: end - start]
    return out


def render_part(part: str, notes: tuple, n: int, expression: dict) -> np.ndarray:
    if part == "piano":
        return inst_piano.render(notes, n)
    if part in ("violins", "violas", "celli", "basses"):
        return inst_strings.render(notes, n, curve(expression.get("strings", ()), n))
    if part == "wood":
        return render_wood(notes, n)
    return inst_synth.render(notes, n, part, curve(expression.get(part, ()), n))


def wet_of(part: str) -> tuple:
    if part == "wood":
        return WOOD_WET
    return WET[part] if part in WET else WET[STEM_OF4[part]]


def segments(cs: ChapterScore, total: float) -> tuple:
    bounds = (0.0,) + tuple(cs.hard_stops) + (total,)
    return tuple(zip(bounds, bounds[1:]))


def apply_zeros(cs: ChapterScore, x: np.ndarray) -> np.ndarray:
    """Exact zero in every zero window (a short fade runs into it) and after end_by (faded to nothing by then)."""
    out = x.copy()
    fade = int(REST_FADE_S * SR)
    for start, end, _ in cs.zeros:
        a, b = int(round(start * SR)), int(round(end * SR))
        lo = max(0, a - fade)
        if a > 0 and start not in cs.hard_stops:
            out[lo:a] *= (np.cos(np.linspace(0, np.pi / 2, a - lo)) ** 2)[:, None]
        out[a:b] = 0.0
    if cs.end_by > 0:
        end = int(round(cs.end_by * SR))
        span = int(cs.end_fade * SR)
        out[end - span:end] *= (np.cos(np.linspace(0, np.pi / 2, span)) ** 2)[:, None]
        out[end:] = 0.0
    return out


def render_chapter(cs: ChapterScore) -> dict:
    """Stems of length (chapter + tail) seconds; the tail is where the chapter's own reverb rings into the next."""
    total = cs.length + (0.0 if cs.end_by > 0 else CHAPTER_TAIL_S)
    n = int(round(total * SR))
    stems = {}
    for name in STEMS:
        acc = np.zeros((n, 2), dtype=np.float32)
        for seg_start, seg_end in segments(cs, total):
            seg_notes = tuple(x for x in cs.notes if seg_start <= x.t < seg_end and STEM_OF4[x.part] == name)
            if not seg_notes:
                continue
            dry = np.zeros((n, 2), dtype=np.float32)
            room = np.zeros((n, 2), dtype=np.float32)
            hall = np.zeros((n, 2), dtype=np.float32)
            for part in sorted({x.part for x in seg_notes}):
                signal = render_part(part, tuple(x for x in seg_notes if x.part == part), n, cs.expression)
                room_wet, hall_wet = wet_of(part)
                dry += signal
                room += room_wet * signal
                hall += hall_wet * signal
            treated = eq(name, with_space(dry, room, hall)).astype(np.float32)
            acc += cut_at(treated, seg_end) if seg_end < total else treated
        stems[name] = apply_zeros(cs, acc).astype(np.float32)
    return stems
