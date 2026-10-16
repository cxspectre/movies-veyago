"""stems.py — renders the four stems (piano, strings, pulse, texture) of an arrangement, mixed and treated.

Treatment per stem (the "mix engineer" pass):
  piano    HP 35 Hz, +1.5 dB warmth shelf at 180 Hz, -2.5 dB at 3.2 kHz, 1st-order roll-off from 7 kHz,
           a small close room (RT60 0.5 s) and a little hall; gentle tape saturation.
  strings  HP 40 Hz, -1.5 dB at 2.6 kHz (less rosin), 1st-order roll-off from 9 kHz, the hall (RT60 2.7 s).
  pulse    HP 28 Hz, LP 1.8 kHz, a touch of the small room.
  texture  pad and shimmer mostly in the hall; air dry.
Hard stops are honoured per segment: everything (reverb tails included) belonging to the music before a
stop is cut there with a 4 ms fade that ends exactly on the stop, and nothing of it reappears later.
"""
from __future__ import annotations

from functools import lru_cache

import numpy as np

import inst_piano
import inst_strings
import inst_synth
from config import SR, STEMS
from dsp import convolve_stereo, curve, highpass, lowpass, peaking, shelf, synth_ir, tape
from score import STEM_OF, Arrangement

HARD_STOP_FADE_S = 0.004
ROOM = dict(rt60=0.5, length_s=1.2, hf_rt60=0.22, predelay_s=0.004, early=10, seed=7, width=0.7)
HALL = dict(rt60=2.7, length_s=5.0, hf_rt60=0.9, predelay_s=0.024, early=6, seed=11, width=1.0)
WET = {"piano": (0.22, 0.12), "strings": (0.08, 0.34), "pulse": (0.07, 0.0), "pad": (0.0, 0.5), "shimmer": (0.0, 0.62),
       "air": (0.0, 0.0)}  # (room, hall)


@lru_cache(maxsize=2)
def impulse(kind: str) -> np.ndarray:
    return synth_ir(**(ROOM if kind == "room" else HALL))


def wet_key(part: str) -> str:
    return part if part in WET else STEM_OF[part]


def with_space(dry: np.ndarray, room_send: np.ndarray, hall_send: np.ndarray) -> np.ndarray:
    out = dry
    if np.any(room_send):
        out = out + convolve_stereo(room_send, impulse("room"))
    if np.any(hall_send):
        out = out + convolve_stereo(hall_send, impulse("hall"))
    return out


def eq(stem: str, x: np.ndarray) -> np.ndarray:
    if stem == "piano":
        y = shelf(highpass(x, 35.0), 180.0, 1.5, "low")
        return tape(lowpass(peaking(y, 3200.0, -2.5, 0.8), 7000.0, order=1), 2.0)
    if stem == "strings":
        return lowpass(peaking(highpass(x, 40.0), 2600.0, -1.5, 0.9), 9000.0, order=1)
    if stem == "pulse":
        return lowpass(highpass(x, 28.0), 1800.0, order=2)
    return highpass(x, 30.0)


def render_part(part: str, notes: tuple, n: int, expression: dict) -> np.ndarray:
    if part == "piano":
        return inst_piano.render(notes, n)
    if part in ("violins", "violas", "celli", "basses"):
        return inst_strings.render(notes, n, curve(expression.get("strings", ()), n))
    return inst_synth.render(notes, n, part, curve(expression.get(part, ()), n))


def segments(arr: Arrangement) -> tuple:
    bounds = (0.0,) + tuple(arr.hard_stops) + (arr.duration,)
    return tuple(zip(bounds, bounds[1:]))


def cut_at(x: np.ndarray, t: float) -> np.ndarray:
    """Zero from t on, with a short fade that ends exactly at t (sample index floor(t*SR))."""
    stop = int(round(t * SR))
    fade = int(HARD_STOP_FADE_S * SR)
    out = x.copy()
    out[stop:] = 0.0
    lo = max(0, stop - fade)
    out[lo:stop] *= np.linspace(1.0, 0.0, stop - lo, endpoint=False)[:, None]
    return out


def mask(arr: Arrangement, x: np.ndarray) -> np.ndarray:
    """Exact digital silence in every silence window, and a clean fade to nothing before end_by."""
    out = x.copy()
    for start, end in arr.silences:
        out[int(round(start * SR)): int(round(end * SR))] = 0.0
    end = int(round(arr.end_by * SR))
    fade = int(arr.end_fade * SR)
    ramp = np.cos(np.linspace(0, np.pi / 2, fade)) ** 2
    out[end - fade:end] *= ramp[:, None]
    out[end:] = 0.0
    return out


def render_stems(arr: Arrangement) -> dict:
    n = int(round(arr.duration * SR))
    stems = {}
    for name in STEMS:
        total = np.zeros((n, 2), dtype=np.float32)
        for seg_start, seg_end in segments(arr):
            seg_notes = tuple(x for x in arr.notes if seg_start <= x.t < seg_end and STEM_OF[x.part] == name)
            if not seg_notes:
                continue
            dry = np.zeros((n, 2), dtype=np.float32)
            room = np.zeros((n, 2), dtype=np.float32)
            hall = np.zeros((n, 2), dtype=np.float32)
            for part in sorted({x.part for x in seg_notes}):
                signal = render_part(part, tuple(x for x in seg_notes if x.part == part), n, arr.expression)
                room_wet, hall_wet = WET[wet_key(part)]
                dry += signal
                room += room_wet * signal
                hall += hall_wet * signal
            treated = eq(name, with_space(dry, room, hall)).astype(np.float32)
            total += cut_at(treated, seg_end) if seg_end < arr.duration else treated
        stems[name] = mask(arr, total)
    return stems
