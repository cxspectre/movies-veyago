"""inst_synth.py — the synthesised layers: the heartbeat pulse and the textures (pad, shimmer, room air).

Pulse: a deep, warm, felt-mallet thump, not a kick. A sine body tuned to the key that falls a little
in pitch, a soft second partial so small speakers hear it, a whisper of felt noise; "tight" notes (after
the lock) have a 2 ms attack, untight ones a 12 ms swell, so before 1:38 it is felt more than heard.
Pad/shimmer: slowly beating sine partials (like strings resonating in sympathy). Air: band-limited,
decorrelated noise at a very low level, the sound of a small, quiet room around a close microphone.
"""
from __future__ import annotations

import numpy as np

from config import SR
from dsp import bandpass, db_to_gain, lowpass, note_envelope
from samples import midi_to_hz

PULSE_RANGE_DB = 24.0
PULSE_TRIM_DB = -8.0  # a heartbeat under the music, not on top of it
PULSE_BODY_DECAY_S = (0.16, 0.22)  # tight, soft
PULSE_SWEEP = 0.8  # starts this much above its pitch and falls
PULSE_SWEEP_S = 0.035
PULSE_LENGTH_S = 0.9
PAD_PARTIALS = ((1, 1.0), (2, 0.28), (3, 0.1), (4, 0.04))
PAD_DETUNE_CENTS = 4.0
PAD_TREMOLO_HZ = 0.17
PAD_LEVEL_DB = -24.0
SHIMMER_LEVEL_DB = -20.0
AIR_LEVEL_DB = -54.0
AIR_BAND = (180.0, 6000.0)


def pulse_note(note, seed: int) -> np.ndarray:
    n = int(PULSE_LENGTH_S * SR)
    t = np.arange(n) / SR
    body_hz = midi_to_hz(note.key - 12)
    tight = note.attack <= 0.0
    freq = body_hz * (1 + PULSE_SWEEP * np.exp(-t / PULSE_SWEEP_S))
    phase = 2 * np.pi * np.cumsum(freq) / SR
    decay = PULSE_BODY_DECAY_S[0] if tight else PULSE_BODY_DECAY_S[1]
    attack_s = 0.002 if tight else max(0.012, note.attack)
    attack = 1 - np.exp(-t / (attack_s / 3))
    body = np.sin(phase) * np.exp(-t / decay)
    knock = np.sin(2.01 * phase) * np.exp(-t / 0.06) * (0.32 if tight else 0.14)
    rng = np.random.default_rng(seed)
    felt = lowpass(rng.standard_normal(n), 380.0) * np.exp(-t / 0.009) * (0.5 if tight else 0.18)
    mono = np.tanh(1.4 * (body + knock + felt) * attack) / np.tanh(1.4)
    gain = db_to_gain(-PULSE_RANGE_DB * (1 - note.vel) + PULSE_TRIM_DB)
    return np.stack([mono, mono], axis=1) * gain


def pad_note(note, level_db: float, seed: int) -> np.ndarray:
    release = note.release if note.release > 0 else 1.0
    length = int((note.dur + release) * SR)
    t = np.arange(length) / SR
    rng = np.random.default_rng(seed)
    f0 = midi_to_hz(note.key)
    out = np.zeros((length, 2))
    for k, amp in PAD_PARTIALS:
        if k * f0 > SR * 0.4:
            break
        for ch, sign in ((0, -1), (1, 1)):
            f = k * f0 * 2 ** (sign * PAD_DETUNE_CENTS / 1200)
            out[:, ch] += amp * np.sin(2 * np.pi * f * t + rng.uniform(0, 2 * np.pi))
    tremolo = 1 + 0.12 * np.sin(2 * np.pi * PAD_TREMOLO_HZ * t + rng.uniform(0, 2 * np.pi))
    env = note_envelope(length, note.attack if note.attack > 0 else 0.5, note.dur, release)
    return out * (env * tremolo * note.vel * db_to_gain(level_db))[:, None]


def air_note(note, expr: np.ndarray, seed: int) -> np.ndarray:
    release = note.release if note.release > 0 else 1.0
    length = int((note.dur + release) * SR)
    rng = np.random.default_rng(seed)
    noise = bandpass(rng.standard_normal((length, 2)), *AIR_BAND, order=1)
    noise = lowpass(noise, 2500.0, order=1)  # pink-ish tilt: a warm room, not hiss
    noise /= np.sqrt(np.mean(noise ** 2))
    start = int(round(note.t * SR))
    seg = expr[start:start + length]
    seg = np.concatenate([seg, np.full(length - len(seg), seg[-1] if len(seg) else 0.0)])
    env = note_envelope(length, note.attack if note.attack > 0 else 1.0, note.dur, release)
    return noise * (env * seg * note.vel * db_to_gain(AIR_LEVEL_DB))[:, None]


def render(notes: tuple, n_samples: int, part: str, expression: np.ndarray) -> np.ndarray:
    out = np.zeros((n_samples, 2), dtype=np.float32)
    for i, note in enumerate(notes):
        seed = 3000 + 11 * i
        if part == "pulse":
            sig = pulse_note(note, seed)
        elif part == "air":
            sig = air_note(note, expression, seed)
        else:
            sig = pad_note(note, SHIMMER_LEVEL_DB if part == "shimmer" else PAD_LEVEL_DB, seed)
        start = int(round(note.t * SR))
        if part == "pulse":
            sig = sig * expression[min(start, n_samples - 1)]
        end = min(n_samples, start + len(sig))
        out[start:end] += sig[: end - start]
    return out
