"""inst_piano.py — the felt piano: the VSCO 2 CE upright, softened into a close-miked felt piano.

What makes it "felt": soft layers are favoured (the hammer barely bites), every note gets its own
velocity-dependent low-pass (soft notes are darker, as with a felt strip between hammer and string),
a short low "thock" of hammer-and-felt noise sits under each attack, and the dampers release quickly.
"""
from __future__ import annotations

from collections import defaultdict
from functools import lru_cache

import numpy as np

from config import SR
from dsp import bandpass, db_to_gain, lowpass, note_envelope, pitch_shift
from samples import BANKS, list_zones, load_zone_audio

BANK = "upright_player"
MAX_KEY = 96  # above C7 the bank's top samples measure out of tune (see analysis/bank_pitch.json)
LAYER_SPREAD = 1.7  # vel * spread -> position across the 3 recorded layers (biased soft)
DYNAMIC_RANGE_DB = 38.0
DYNAMIC_CURVE = 1.4
FELT_BASE_HZ = 1000.0
FELT_RANGE_HZ = 4000.0
FELT_CURVE = 1.4
DAMPER_RELEASE_S = 0.22
THUMP_DB = -17.0
THUMP_DECAY_S = 0.008
THUMP_BAND = (70.0, 650.0)


@lru_cache(maxsize=1)
def zones_by_key() -> dict:
    table = defaultdict(dict)
    for zone in list_zones(BANKS[BANK]):
        if zone.key <= MAX_KEY + 4:
            table[zone.key][zone.layer] = zone
    return dict(table)


@lru_cache(maxsize=None)
def normalised(path) -> np.ndarray:
    audio = load_zone_audio(path)
    return audio / np.abs(audio).max()


def velocity_gain(vel: float) -> float:
    return db_to_gain(-DYNAMIC_RANGE_DB * (1 - vel) ** DYNAMIC_CURVE)


def felt_cutoff(vel: float) -> float:
    return FELT_BASE_HZ + FELT_RANGE_HZ * vel ** FELT_CURVE


def _layer_mix(vel: float, layers: dict) -> tuple:
    pos = float(np.clip(vel * LAYER_SPREAD, 0, max(layers)))
    lo = int(np.floor(pos))
    hi = min(lo + 1, max(layers))
    w = pos - lo
    return ((layers[lo], 1 - w),) + (((layers[hi], w),) if hi != lo and w > 0 else ())


def _thump(length: int, seed: int) -> np.ndarray:
    rng = np.random.default_rng(seed)
    n = min(length, int(THUMP_DECAY_S * 8 * SR))
    burst = rng.standard_normal((n, 2)) * np.exp(-np.arange(n) / (THUMP_DECAY_S * SR))[:, None]
    out = np.zeros((length, 2))
    out[:n] = bandpass(burst, *THUMP_BAND)
    return out / (np.abs(out).max() + 1e-12)


def render_note(key: int, vel: float, dur: float, release: float, seed: int) -> np.ndarray:
    table = zones_by_key()
    zone_key = min(table, key=lambda k: (abs(k - key), k))
    ratio = 2 ** ((key - zone_key) / 12)
    rel = release if release > 0 else DAMPER_RELEASE_S
    length = int((dur + rel) * SR)
    sig = np.zeros((length, 2))
    for zone, weight in _layer_mix(vel, table[zone_key]):
        sig += weight * pitch_shift(normalised(zone.path), ratio, length)
    sig = lowpass(sig, felt_cutoff(vel), order=2)
    sig += db_to_gain(THUMP_DB) * (0.5 + vel) * _thump(length, seed)
    return sig * note_envelope(length, 0.001, dur, rel)[:, None] * velocity_gain(vel)


def render(notes: tuple, n_samples: int) -> np.ndarray:
    out = np.zeros((n_samples, 2), dtype=np.float32)
    for i, note in enumerate(notes):
        start = int(round(note.t * SR))
        if start >= n_samples:
            continue
        sig = render_note(note.key, note.vel, note.dur, note.release, seed=1000 + i)
        end = min(n_samples, start + len(sig))
        out[start:end] += sig[: end - start]
    return out
