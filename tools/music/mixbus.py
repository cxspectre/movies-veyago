"""mixbus.py — the music bus: glue compression, loudness to target, true-peak-safe limiting.

Every stage computes ONE gain curve from the full mix and applies it to every stem, so the delivered
stems still sum to the delivered master (a mixer can rebalance them and land back on the same mix).
Detectors run at a 1 kHz control rate and are interpolated to audio rate.
"""
from __future__ import annotations

import numpy as np
import pyloudnorm
from scipy.ndimage import minimum_filter1d
from scipy.signal import resample_poly

from config import SR, TARGET_LUFS, TRUE_PEAK_CEILING_DBTP
from dsp import db_to_gain

CONTROL_HOP = SR // 1000
COMP_RATIO = 2.0
COMP_KNEE_DB = 6.0
COMP_ABOVE_LOUDNESS_DB = 7.0  # threshold sits this far above the programme's integrated loudness
COMP_ATTACK_S = 0.03
COMP_RELEASE_S = 0.35
COMP_RMS_S = 0.05
LIMIT_LOOKAHEAD_S = 0.005
LIMIT_RELEASE_S = 0.08
OVERSAMPLE = 4


def integrated_lufs(mix: np.ndarray) -> float:
    return float(pyloudnorm.Meter(SR).integrated_loudness(mix.astype(np.float64)))


def true_peak_db(x: np.ndarray) -> float:
    up = resample_poly(x.astype(np.float64), OVERSAMPLE, 1, axis=0)
    return float(20 * np.log10(max(np.abs(up).max(), 1e-12)))


def _control_rms_db(mix: np.ndarray) -> np.ndarray:
    mono = (mix.astype(np.float64) ** 2).mean(axis=1)
    frames = len(mono) // CONTROL_HOP
    power = mono[: frames * CONTROL_HOP].reshape(frames, CONTROL_HOP).mean(axis=1)
    win = max(1, int(COMP_RMS_S * 1000))
    smooth = np.convolve(power, np.ones(win) / win, mode="same")
    return 10 * np.log10(smooth + 1e-20)


def _to_audio_rate(control: np.ndarray, n: int) -> np.ndarray:
    centres = (np.arange(len(control)) + 0.5) * CONTROL_HOP
    return np.interp(np.arange(n), centres, control)


def compressor_gain(mix: np.ndarray) -> np.ndarray:
    level = _control_rms_db(mix)
    threshold = integrated_lufs(mix) + COMP_ABOVE_LOUDNESS_DB
    over = level - threshold
    knee = np.clip((over + COMP_KNEE_DB / 2) / COMP_KNEE_DB, 0, 1)
    reduction = -(1 - 1 / COMP_RATIO) * np.where(over > COMP_KNEE_DB / 2, over, knee ** 2 * COMP_KNEE_DB / 2)
    a = np.exp(-1 / (COMP_ATTACK_S * 1000))
    r = np.exp(-1 / (COMP_RELEASE_S * 1000))
    smoothed = np.empty_like(reduction)
    g = 0.0
    for i, target in enumerate(reduction):
        coef = a if target < g else r
        g = coef * g + (1 - coef) * target
        smoothed[i] = g
    return 10 ** (_to_audio_rate(smoothed, len(mix)) / 20)


def limiter_gain(mix: np.ndarray, ceiling_db: float) -> np.ndarray:
    up = np.abs(resample_poly(mix.astype(np.float64), OVERSAMPLE, 1, axis=0)).max(axis=1)
    hop = CONTROL_HOP * OVERSAMPLE
    frames = len(up) // hop + 1
    padded = np.concatenate([up, np.zeros(frames * hop - len(up))])
    peaks = padded.reshape(frames, hop).max(axis=1)
    need = np.minimum(1.0, db_to_gain(ceiling_db) / np.maximum(peaks, 1e-12))
    look = max(1, int(LIMIT_LOOKAHEAD_S * 1000))
    need = minimum_filter1d(need, size=2 * look + 1, mode="nearest")
    rel = np.exp(-1 / (LIMIT_RELEASE_S * 1000))
    gain = np.empty_like(need)
    g = 1.0
    for i, target in enumerate(need):
        g = target if target < g else rel * g + (1 - rel) * target
        gain[i] = g
    gain = minimum_filter1d(gain, size=3, mode="nearest")
    return _to_audio_rate(gain, len(mix))


def apply(stems: dict, gain) -> dict:
    g = gain[:, None] if isinstance(gain, np.ndarray) else gain
    return {name: (x * g).astype(np.float32) for name, x in stems.items()}


def master_bus(stems: dict) -> tuple:
    """Return (stems, report). The master is the sum of the returned stems."""
    mix = sum(stems.values())
    pre_lufs = integrated_lufs(mix)
    stems = apply(stems, compressor_gain(mix))
    mix = sum(stems.values())
    stems = apply(stems, db_to_gain(TARGET_LUFS - integrated_lufs(mix)))
    ceiling = TRUE_PEAK_CEILING_DBTP - 0.3
    for _ in range(4):
        mix = sum(stems.values())
        if true_peak_db(mix) <= TRUE_PEAK_CEILING_DBTP:
            break
        stems = apply(stems, limiter_gain(mix, ceiling))
        ceiling -= 0.3
    mix = sum(stems.values())
    return stems, {"pre_bus_lufs": round(pre_lufs, 2), "lufs": round(integrated_lufs(mix), 2),
                   "true_peak_dbtp": round(true_peak_db(mix), 2)}
