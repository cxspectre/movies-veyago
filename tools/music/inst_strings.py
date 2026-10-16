"""inst_strings.py — string sections (VSCO 2 CE sustains) with slow bows, dynamic layer morphing and loops.

A note's dynamic is its velocity times the arrangement's "strings" expression curve, sampled per sample.
That one number drives both the level and a crossfade from the soft to the loud recording, so a swell
brightens the way a real section does. Notes longer than the recording are extended by crossfading
fresh windows of its sustain (vibrato ensembles hide the joins).
"""
from __future__ import annotations

import json
from collections import defaultdict
from functools import lru_cache

import numpy as np

from config import ANALYSIS_DIR, SR
from dsp import db_to_gain, note_envelope, pan_gains, pitch_shift
from samples import BANKS, list_zones, load_zone_audio

SECTION_PAN = {"violins": -0.35, "violas": 0.1, "celli": 0.3, "basses": 0.4}
DEFAULT_ATTACK_S = 0.35
DEFAULT_RELEASE_S = 0.7
LOOP_START_S = 0.9
LOOP_END_MARGIN_S = 1.1
CROSSFADE_S = 0.5
DYNAMIC_RANGE_DB = 30.0
DYNAMIC_CURVE = 1.3
SILENT_BELOW = 0.05  # dynamic 0 means silence, not -30 dB
LOUD_LAYER_FROM = 0.3  # dynamic where the loud recording starts to blend in
LOUD_LAYER_SPAN = 0.45
SECTION_TRIM_DB = {"violins": -1.0, "violas": -2.0, "celli": -1.0, "basses": -2.5}


@lru_cache(maxsize=None)
def zones(section: str) -> dict:
    table = defaultdict(dict)
    for zone in list_zones(BANKS[section]):
        table[zone.key][zone.layer] = zone
    return dict(table)


@lru_cache(maxsize=1)
def tuning_cents() -> dict:
    path = ANALYSIS_DIR / "bank_pitch.json"
    if not path.exists():
        return {}
    report = json.loads(path.read_text())
    return {row["file"]: row["residual_cents"] for bank in report.values() for row in bank["rows"] if "residual_cents" in row}


@lru_cache(maxsize=None)
def normalised(path) -> np.ndarray:
    audio = load_zone_audio(path)
    a, b = int(LOOP_START_S * SR), max(int(LOOP_START_S * SR) + SR, len(audio) - int(LOOP_END_MARGIN_S * SR))
    rms = np.sqrt(np.mean(audio[a:b] ** 2))
    return audio / (rms * 8)  # ~ -18 dB RMS sustain, peaks well below 1


def sustained(audio: np.ndarray, ratio: float, length: int, seed: int) -> np.ndarray:
    shifted = pitch_shift(audio, ratio, int(len(audio) / ratio))
    if length <= len(shifted) - int(LOOP_END_MARGIN_S * SR):
        return shifted[:length]
    a = int(LOOP_START_S * SR)
    b = len(shifted) - int(LOOP_END_MARGIN_S * SR)
    xf = int(CROSSFADE_S * SR)
    rng = np.random.default_rng(seed)
    out = shifted[:b]
    fade = np.sin(np.linspace(0, np.pi / 2, xf))[:, None]
    while len(out) < length:
        offset = a + int(rng.uniform(0, max(1, (b - a) // 3)))
        seg = shifted[offset:b]
        joined = out[-xf:] * fade[::-1] + seg[:xf] * fade
        out = np.concatenate([out[:-xf], joined, seg[xf:]])
    return out[:length]


def render_note(note, expr: np.ndarray, seed: int) -> np.ndarray:
    table = zones(note.part)
    zone_key = min(table, key=lambda k: (abs(k - note.key), k))
    layers = table[zone_key]
    start = int(round(note.t * SR))
    attack = note.attack if note.attack > 0 else DEFAULT_ATTACK_S
    release = note.release if note.release > 0 else DEFAULT_RELEASE_S
    length = int((note.dur + release) * SR)
    seg_expr = expr[start:start + length]
    if len(seg_expr) < length:
        seg_expr = np.concatenate([seg_expr, np.full(length - len(seg_expr), seg_expr[-1] if len(seg_expr) else 0.0)])
    dyn = np.clip(note.vel * seg_expr, 0, 1)
    loud_w = np.clip((dyn - LOUD_LAYER_FROM) / LOUD_LAYER_SPAN, 0, 1)[:, None]
    sig = np.zeros((length, 2))
    for layer, zone in layers.items():
        cents = tuning_cents().get(zone.path.name, 0.0)
        ratio = 2 ** ((note.key - zone_key) / 12) * 2 ** (-cents / 1200)
        body = sustained(normalised(zone.path), ratio, length, seed + layer)
        weight = loud_w if layer == max(layers) else (1 - loud_w) if layer == min(layers) else 0.0
        sig += body * weight
    gain = 10 ** (-DYNAMIC_RANGE_DB * (1 - dyn) ** DYNAMIC_CURVE / 20) * np.clip(dyn / SILENT_BELOW, 0, 1)
    left, right = pan_gains(SECTION_PAN[note.part])
    trim = db_to_gain(SECTION_TRIM_DB[note.part])
    return sig * (note_envelope(length, attack, note.dur, release) * gain * trim)[:, None] * np.array([left, right])


def render(notes: tuple, n_samples: int, expression: np.ndarray) -> np.ndarray:
    out = np.zeros((n_samples, 2), dtype=np.float32)
    for i, note in enumerate(notes):
        start = int(round(note.t * SR))
        sig = render_note(note, expression, seed=2000 + 7 * i)
        end = min(n_samples, start + len(sig))
        out[start:end] += sig[: end - start]
    return out
