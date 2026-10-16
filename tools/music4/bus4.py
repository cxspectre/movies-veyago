"""bus4.py — the music bus for the 10-minute master: glue compression, loudness to target, true-peak limiting.

As in v1 (tools/music/mixbus.py, whose compressor is reused), every stage computes ONE gain curve and applies
it to every stem (the limiter's curve holds the mix AND each stem under the ceiling), so the delivered stems sum to the delivered mix. What changes for
600 s is memory: true peak and the limiter's peak detector run on 4x-oversampled CHUNKS instead of the whole
programme at once. The final gain curve is returned so the chapter files can wear exactly the master's bus.
"""
from __future__ import annotations

import numpy as np
from scipy.ndimage import minimum_filter1d
from scipy.signal import resample_poly

from conf4 import SR, TARGET_LUFS, TRUE_PEAK_CEILING_DBTP
from dsp import db_to_gain
from mixbus import CONTROL_HOP, LIMIT_LOOKAHEAD_S, LIMIT_RELEASE_S, OVERSAMPLE, _to_audio_rate, compressor_gain, integrated_lufs

CHUNK_S = 20.0
GUARD = 256  # samples of overlap each side so the polyphase filter sees context at chunk joins
LOUDNESS_ROUNDS = 3
LOUDNESS_TOLERANCE_LU = 0.15


def _oversampled_chunks(x: np.ndarray):
    """Yield (start_sample, |4x-oversampled peak per channel-max| for samples start..end) chunk by chunk."""
    step = int(CHUNK_S * SR)
    for start in range(0, len(x), step):
        lo, hi = max(0, start - GUARD), min(len(x), start + step + GUARD)
        up = np.abs(resample_poly(x[lo:hi].astype(np.float64), OVERSAMPLE, 1, axis=0)).max(axis=1)
        a = (start - lo) * OVERSAMPLE
        b = a + (min(start + step, len(x)) - start) * OVERSAMPLE
        yield start, up[a:b]


def true_peak_db(x: np.ndarray) -> float:
    peak = max(float(chunk.max()) for _, chunk in _oversampled_chunks(x))
    return float(20 * np.log10(max(peak, 1e-12)))


def _control_peaks(x: np.ndarray) -> np.ndarray:
    frames = len(x) // CONTROL_HOP + 1
    peaks = np.zeros(frames)
    hop = CONTROL_HOP * OVERSAMPLE
    for start, chunk in _oversampled_chunks(x):
        f0 = start // CONTROL_HOP
        count = -(-len(chunk) // hop)
        padded = np.concatenate([chunk, np.zeros(count * hop - len(chunk))])
        peaks[f0:f0 + count] = np.maximum(peaks[f0:f0 + count], padded.reshape(count, hop).max(axis=1)[: frames - f0])
    return peaks


def limiter_gain(signals: tuple, ceiling_db: float) -> np.ndarray:
    """One gain curve that holds EVERY given signal (the mix and each stem) under the ceiling."""
    peaks = np.max([_control_peaks(x) for x in signals], axis=0)
    need = np.minimum(1.0, db_to_gain(ceiling_db) / np.maximum(peaks, 1e-12))
    look = max(1, int(LIMIT_LOOKAHEAD_S * 1000))
    need = minimum_filter1d(need, size=2 * look + 1, mode="nearest")
    rel = np.exp(-1 / (LIMIT_RELEASE_S * 1000))
    gain = np.empty_like(need)
    g = 1.0
    for i, target in enumerate(need):
        g = target if target < g else rel * g + (1 - rel) * target
        gain[i] = g
    return _to_audio_rate(minimum_filter1d(gain, size=3, mode="nearest"), len(signals[0]))


def _sum(stems: dict) -> np.ndarray:
    return sum(stems.values())


def _limit(stems: dict, gain: np.ndarray) -> np.ndarray:
    ceiling = TRUE_PEAK_CEILING_DBTP - 0.3
    for _ in range(4):
        signals = (_sum(stems) * gain[:, None],) + tuple(x * gain[:, None] for x in stems.values())
        if max(true_peak_db(x) for x in signals) <= TRUE_PEAK_CEILING_DBTP - 0.1:
            break
        gain = gain * limiter_gain(signals, ceiling).astype(np.float32)
        ceiling -= 0.3
    return gain


def master_bus(stems: dict) -> tuple:
    """Return (stems, gain curve, report). The mix is the sum of the returned stems."""
    mix = _sum(stems)
    pre = integrated_lufs(mix)
    gain = compressor_gain(mix).astype(np.float32)
    for _ in range(LOUDNESS_ROUNDS):  # limiting costs loudness: make it up and limit again, a few rounds
        gain = gain * np.float32(db_to_gain(TARGET_LUFS - integrated_lufs(_sum(stems) * gain[:, None])))
        gain = _limit(stems, gain)
        if abs(integrated_lufs(_sum(stems) * gain[:, None]) - TARGET_LUFS) <= LOUDNESS_TOLERANCE_LU:
            break
    out = {name: (x * gain[:, None]).astype(np.float32) for name, x in stems.items()}
    mix = _sum(out)
    return out, gain, {"pre_bus_lufs": round(pre, 2), "lufs": round(integrated_lufs(mix), 2), "true_peak_dbtp": round(true_peak_db(mix), 2)}
