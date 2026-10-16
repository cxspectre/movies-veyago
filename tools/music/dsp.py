"""dsp.py — filters, envelopes, reverb impulse synthesis and convolution for the score.

All functions are pure: they take arrays and return new arrays (stereo arrays are shaped [n, 2]).
"""
from __future__ import annotations

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

from config import SR

SILENCE_DB = -90.0


def db_to_gain(db: float) -> float:
    return float(10 ** (db / 20))


def gain_to_db(gain: float) -> float:
    return float(20 * np.log10(max(gain, 1e-12)))


def lowpass(x: np.ndarray, hz: float, order: int = 2) -> np.ndarray:
    sos = butter(order, min(hz, SR * 0.45), btype="low", fs=SR, output="sos")
    return sosfilt(sos, x, axis=0)


def highpass(x: np.ndarray, hz: float, order: int = 2) -> np.ndarray:
    sos = butter(order, hz, btype="high", fs=SR, output="sos")
    return sosfilt(sos, x, axis=0)


def bandpass(x: np.ndarray, lo: float, hi: float, order: int = 2) -> np.ndarray:
    sos = butter(order, (lo, min(hi, SR * 0.45)), btype="band", fs=SR, output="sos")
    return sosfilt(sos, x, axis=0)


def shelf(x: np.ndarray, hz: float, db: float, kind: str) -> np.ndarray:
    """First-order shelf built from a complementary split: kind 'low' or 'high'."""
    lowband = lowpass(x, hz, order=1)
    highband = x - lowband
    g = db_to_gain(db)
    return lowband * g + highband if kind == "low" else lowband + highband * g


def peaking(x: np.ndarray, hz: float, db: float, q: float = 0.9) -> np.ndarray:
    """RBJ peaking EQ biquad."""
    a = 10 ** (db / 40)
    w0 = 2 * np.pi * hz / SR
    alpha = np.sin(w0) / (2 * q)
    b = np.array([1 + alpha * a, -2 * np.cos(w0), 1 - alpha * a])
    den = np.array([1 + alpha / a, -2 * np.cos(w0), 1 - alpha / a])
    sos = np.concatenate([b / den[0], den / den[0]])[None, :]
    return sosfilt(sos, x, axis=0)


def fade_in(length: int, curve: str = "cos") -> np.ndarray:
    if length <= 0:
        return np.ones(0)
    ramp = np.linspace(0.0, 1.0, length, endpoint=False)
    return np.sin(ramp * np.pi / 2) ** 2 if curve == "cos" else ramp


def note_envelope(total: int, attack_s: float, hold_s: float, release_s: float) -> np.ndarray:
    """Attack (raised cosine), hold, exponential release that reaches -90 dB at its end, then exact zero."""
    env = np.zeros(total)
    a = min(total, int(attack_s * SR))
    h = min(total, int((attack_s + hold_s) * SR))
    r = min(total, h + int(release_s * SR))
    env[:a] = fade_in(a)
    env[a:h] = 1.0
    if r > h:
        k = np.linspace(0, 1, r - h, endpoint=False)
        env[h:r] = np.exp(np.log(db_to_gain(SILENCE_DB)) * k) * (1 - k) ** 0.5
    return env


def curve(points: tuple, n: int, default: float = 1.0) -> np.ndarray:
    """Breakpoint automation sampled at SR for n samples (held flat outside its points)."""
    if not points:
        return np.full(n, default)
    ts = np.array([p[0] for p in points]) * SR
    vs = np.array([p[1] for p in points])
    return np.interp(np.arange(n), ts, vs)


def pitch_shift(audio: np.ndarray, ratio: float, length: int) -> np.ndarray:
    """Resample by playback-rate change (linear interpolation, band-limited afterwards by the felt filters)."""
    src_len = len(audio)
    pos = np.arange(length) * ratio
    pos = pos[pos < src_len - 1]
    i = pos.astype(np.int64)
    frac = (pos - i)[:, None]
    out = audio[i] * (1 - frac) + audio[i + 1] * frac
    if len(out) < length:
        out = np.concatenate([out, np.zeros((length - len(out), audio.shape[1]), dtype=out.dtype)])
    return out


def pan_gains(pan: float) -> tuple:
    """Equal-power balance for an already-stereo source; pan in -1..1."""
    angle = (pan + 1) * np.pi / 4
    return float(np.cos(angle) * np.sqrt(2)), float(np.sin(angle) * np.sqrt(2))


def synth_ir(rt60: float, length_s: float, hf_rt60: float, predelay_s: float, early: int, seed: int,
             width: float = 1.0) -> np.ndarray:
    """A stereo reverb impulse: sparse early reflections, then decorrelated noise decaying per octave band.

    Higher bands decay towards `hf_rt60` (air and soft furnishings absorb the top), which is what makes a
    room sound warm rather than metallic.
    """
    rng = np.random.default_rng(seed)
    n = int(length_s * SR)
    t = np.arange(n) / SR
    centres = (125, 250, 500, 1000, 2000, 4000, 8000)
    ir = np.zeros((n, 2))
    for i, fc in enumerate(centres):
        frac = i / (len(centres) - 1)
        band_rt = rt60 * (1 - frac) + hf_rt60 * frac
        noise = rng.standard_normal((n, 2))
        lo, hi = fc / np.sqrt(2), min(fc * np.sqrt(2), SR * 0.45)
        band = bandpass(noise, lo, hi, order=2)
        ir += band * np.exp(-6.91 * t / band_rt)[:, None]
    mid = ir.mean(axis=1)[:, None]
    ir = mid + (ir - mid) * width
    onset = fade_in(int(0.012 * SR))
    ir[: len(onset)] *= onset[:, None]
    pre = int(predelay_s * SR)
    ir = np.concatenate([np.zeros((pre, 2)), ir])[:n]
    for k in range(early):
        delay = int(rng.uniform(0.003, 0.035) * SR) + pre // 2
        side = k % 2
        ir[delay, side] += rng.uniform(0.25, 0.6) * (1 - k / max(1, early)) * (1 if rng.uniform() > 0.3 else -1)
    return ir / np.sqrt((ir ** 2).sum() / 2)


def convolve_stereo(x: np.ndarray, ir: np.ndarray) -> np.ndarray:
    """Left feeds the left IR, right the right IR, plus a little cross-feed so a mono source blooms in stereo."""
    cross = 0.35
    left = fftconvolve(x[:, 0], ir[:, 0]) + cross * fftconvolve(x[:, 1], ir[:, 0])
    right = fftconvolve(x[:, 1], ir[:, 1]) + cross * fftconvolve(x[:, 0], ir[:, 1])
    return np.stack([left, right], axis=1)[: len(x)] / (1 + cross)


def tape(x: np.ndarray, drive_db: float = 3.0) -> np.ndarray:
    """Gentle odd-order saturation, unity gain for small signals (a little warmth on the loud moments)."""
    drive = db_to_gain(drive_db)
    return np.tanh(x * drive) / drive
