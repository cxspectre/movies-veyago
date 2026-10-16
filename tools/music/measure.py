"""measure.py — objective measurements on rendered audio (nobody on the crew can listen, so we measure).

Onsets come from the rise of short-time log energy (2 ms frames, 1 ms hop), entries/last sounds from the
first/last sample above one 24-bit LSB, silence from integer sample values, loudness from ffmpeg's
EBU R128 meter (ebur128 filter, true peak on), key from a chroma profile against Krumhansl-Kessler.
"""
from __future__ import annotations

import re
import subprocess
from pathlib import Path

import numpy as np

from config import SR
from dsp import highpass

LSB = 2.0 ** -23
FRAME_S = 0.002
HOP_S = 0.001
ONSET_SEARCH_S = 0.12
ONSET_HP_HZ = 120.0
DROP_SMOOTH_S = 0.01  # 10 ms level smoothing for the drop crossing
MAJOR_PROFILE = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MINOR_PROFILE = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
PC_NAMES = ("C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B")


def log_energy(mono: np.ndarray, start: int, end: int) -> tuple:
    frame, hop = int(FRAME_S * SR), int(HOP_S * SR)
    seg = mono[max(0, start): end]
    count = max(0, (len(seg) - frame) // hop)
    idx = np.arange(count)[:, None] * hop + np.arange(frame)[None, :]
    energy = (seg[idx] ** 2).mean(axis=1)
    return 10 * np.log10(energy + 1e-20), (max(0, start) + np.arange(count) * hop) / SR


FLUX_N = 1024  # 21 ms analysis window
FLUX_HOP = 48  # 1 ms
FLUX_BAND = (100.0, 8000.0)


def spectral_flux(mono: np.ndarray) -> tuple:
    """Half-wave-rectified frame-to-frame increase of log-compressed magnitude; times are frame centres."""
    count = max(0, (len(mono) - FLUX_N) // FLUX_HOP)
    idx = np.arange(count)[:, None] * FLUX_HOP + np.arange(FLUX_N)[None, :]
    mags = np.log1p(100 * np.abs(np.fft.rfft(mono[idx] * np.hanning(FLUX_N), axis=1)))
    freqs = np.fft.rfftfreq(FLUX_N, 1 / SR)
    band = (freqs >= FLUX_BAND[0]) & (freqs <= FLUX_BAND[1])
    flux = np.concatenate([[0.0], np.maximum(0, np.diff(mags[:, band], axis=0)).sum(axis=1)])
    return flux, (np.arange(count) * FLUX_HOP + FLUX_N / 2) / SR


def onset_near(x: np.ndarray, t: float, latency_s: float = 0.0) -> dict:
    """The strongest new-note event (spectral-flux peak) within +-ONSET_SEARCH_S of t, minus the detector's
    calibrated latency. `salience` is that peak over the median flux of the window (a clear onset is >> 1)."""
    lo = max(0, int((t - ONSET_SEARCH_S) * SR) - FLUX_N)
    hi = min(len(x), int((t + ONSET_SEARCH_S) * SR) + FLUX_N)
    flux, times = spectral_flux(x[lo:hi].mean(axis=1))
    times = times + lo / SR - latency_s
    window = (times >= t - ONSET_SEARCH_S) & (times <= t + ONSET_SEARCH_S)
    if not window.any():
        return {"measured": None, "salience": 0.0}
    i = np.nonzero(window)[0][np.argmax(flux[window])]
    salience = flux[i] / (np.median(flux[window]) + 1e-9)
    return {"measured": round(float(times[i]), 4), "salience": round(float(salience), 1)}


def level_change(x: np.ndarray, t: float) -> dict:
    """For 'the music drops away': RMS of the second before t against the second after (from t + 0.3)."""
    before = rms_db(x, t - 1.0, t, window=0.2)
    after = rms_db(x, t + 0.3, t + 1.3, window=0.2)
    mono = np.abs(x[int((t - 1) * SR): int((t + 1.3) * SR)]).mean(axis=1)
    smooth = np.convolve(mono, np.ones(int(DROP_SMOOTH_S * SR)) / (DROP_SMOOTH_S * SR), mode="same")
    level = 20 * np.log10(smooth + 1e-12)
    mid = (before + after) / 2
    above = np.nonzero(level >= mid)[0]
    cross = above[-1] + 1 if len(above) else None  # the last time it falls through the midpoint for good
    return {"measured": round(t - 1 + cross / SR, 3) if cross is not None else None, "before_dbfs": before, "after_dbfs": after,
            "drop_db": round(before - after, 1)}


def entry(x: np.ndarray, t: float, lookback: float = 1.0) -> dict:
    """First sample above one LSB after `lookback` s of the stem's own silence before t."""
    lo = int(max(0, t - lookback) * SR)
    above = np.nonzero(np.abs(x[lo:]).max(axis=1) > LSB)[0]
    if not len(above):
        return {"measured": None}
    first = (lo + above[0]) / SR
    loud = np.nonzero(np.abs(x[lo:]).max(axis=1) > 10 ** (-50 / 20))[0]
    return {"measured": round(first, 4), "reaches_minus50_dbfs": round((lo + loud[0]) / SR, 3) if len(loud) else None}


def last_sound(x: np.ndarray, t: float, span: float = 3.0, ahead: float = 0.9) -> dict:
    """Last sample above one LSB before the silence that follows t (searched to t + ahead)."""
    lo, hi = int(max(0, t - span) * SR), min(len(x), int((t + ahead) * SR))
    above = np.nonzero(np.abs(x[lo:hi]).max(axis=1) > LSB)[0]
    last = (lo + above[-1] + 1) / SR if len(above) else None
    pre = x[int((t - 0.1) * SR): int((t - 0.01) * SR)]
    level = 20 * np.log10(np.sqrt(np.mean(pre ** 2)) + 1e-12) if len(pre) else None
    return {"measured": round(last, 4) if last else None, "rms_dbfs_100ms_before": round(level, 1) if level else None}


def silence(x_int: np.ndarray, start: float, end: float) -> dict:
    seg = x_int[int(round(start * SR)): int(round(end * SR))]
    nonzero = int(np.count_nonzero(seg))
    peak = int(np.abs(seg).max()) if len(seg) else 0
    return {"measured": round(start, 4), "nonzero_samples": nonzero, "peak_lsb": peak,
            "peak_dbfs": "-inf" if peak == 0 else round(20 * np.log10(peak / 2 ** 23), 1)}


def rms_db(x: np.ndarray, start: float, end: float, window: float = 0.4) -> float:
    seg = x[int(start * SR): int(end * SR)].mean(axis=1)
    n = int(window * SR)
    if len(seg) < n:
        return -120.0
    frames = len(seg) // n
    levels = np.sqrt((seg[: frames * n].reshape(frames, n) ** 2).mean(axis=1))
    return round(float(20 * np.log10(levels.max() + 1e-12)), 1)


def quiet(x: np.ndarray, start: float, end: float) -> dict:
    return {"measured": round(start, 4), "max_rms_dbfs_window": rms_db(x, start, end),
            "max_rms_dbfs_before": rms_db(x, max(0.0, start - 14.0), start)}


def silent_after(x: np.ndarray, t: float, threshold_db: float = -60.0) -> dict:
    mono = np.abs(x).max(axis=1)
    above = np.nonzero(mono > 10 ** (threshold_db / 20))[0]
    last = above[-1] / SR if len(above) else 0.0
    nz = np.nonzero(mono > LSB)[0]
    return {"measured": round(float(last), 3), "threshold_dbfs": threshold_db,
            "last_nonzero": round(float(nz[-1] / SR), 3) if len(nz) else None}


def onset_rate(x: np.ndarray, start: float, end: float, min_gap_s: float = 0.08) -> float:
    """Distinct note events per second: spectral-flux peaks above 2.5x the median and 20% of the max, >= 80 ms apart."""
    flux, _ = spectral_flux(x[int(start * SR): int(end * SR)].mean(axis=1))
    floor = max(2.5 * np.median(flux), 0.2 * flux.max())  # ignore pedal/reverb shimmer between notes
    peaks = [i for i in range(1, len(flux) - 1) if flux[i] > floor and flux[i] >= flux[i - 1] and flux[i] > flux[i + 1]]
    retained = []
    for p in peaks:
        if not retained or p - retained[-1] > min_gap_s * SR / FLUX_HOP:
            retained.append(p)
        elif flux[p] > flux[retained[-1]]:
            retained[-1] = p
    return round(len(retained) / (end - start), 2)


def ebur128(path: Path) -> dict:
    proc = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"],
                          capture_output=True, text=True, check=True)
    tail = proc.stderr[proc.stderr.rfind("Summary:"):]
    grab = lambda label: float(re.search(label + r":\s+(-?[\d.]+|-inf)", tail).group(1))  # noqa: E731
    return {"integrated_lufs": grab("I"), "lra_lu": grab("LRA"), "true_peak_dbtp": grab("Peak")}


def chroma(x: np.ndarray, start: float, end: float) -> np.ndarray:
    seg = x[int(start * SR): int(end * SR)].mean(axis=1)
    n_fft = 1 << 15
    hop = n_fft // 2
    acc = np.zeros(n_fft // 2 + 1)
    for i in range(0, max(1, len(seg) - n_fft), hop):
        acc += np.abs(np.fft.rfft(seg[i:i + n_fft] * np.hanning(min(n_fft, len(seg[i:i + n_fft]))), n_fft)) ** 2
    freqs = np.fft.rfftfreq(n_fft, 1 / SR)
    band = (freqs > 60) & (freqs < 2000)
    pcs = np.round(69 + 12 * np.log2(freqs[band] / 440.0)).astype(int) % 12
    return np.bincount(pcs, weights=acc[band], minlength=12)


def key_estimate(profile: np.ndarray) -> dict:
    scores = []
    for tonic in range(12):
        for mode, ref in (("major", MAJOR_PROFILE), ("minor", MINOR_PROFILE)):
            scores.append((float(np.corrcoef(profile, np.roll(ref, tonic))[0, 1]), f"{PC_NAMES[tonic]} {mode}"))
    scores.sort(reverse=True)
    return {"key": scores[0][1], "r": round(scores[0][0], 3), "runner_up": scores[1][1], "runner_up_r": round(scores[1][0], 3)}


def tuning_cents(x: np.ndarray, start: float, end: float) -> float:
    """Median deviation of strong spectral peaks from equal temperament (A = 440 Hz)."""
    seg = x[int(start * SR): int(end * SR)].mean(axis=1)
    n_fft = 1 << 17
    spec = np.abs(np.fft.rfft(seg[:n_fft] * np.hanning(min(n_fft, len(seg))), n_fft))
    freqs = np.fft.rfftfreq(n_fft, 1 / SR)
    band = np.nonzero((freqs > 80) & (freqs < 1500))[0]
    s = spec[band]
    peaks = [band[i] for i in range(1, len(s) - 1) if s[i] > s[i - 1] and s[i] > s[i + 1] and s[i] > 0.1 * s.max()]
    cents = [((1200 * np.log2(freqs[p] / 440.0)) + 50) % 100 - 50 for p in peaks]
    return round(float(np.median(cents)), 1) if cents else 0.0


def crest(x: np.ndarray, t: float, span: float = 3.0) -> dict:
    """Time of the loudest 200 ms (RMS) of a sustained part within +-span of t: the top of a crescendo."""
    n = int(0.01 * SR)
    seg = x[int((t - span) * SR): int((t + span) * SR)].mean(axis=1)
    frames = len(seg) // n
    power = (seg[: frames * n].reshape(frames, n) ** 2).mean(axis=1)
    smooth = np.convolve(power, np.ones(20) / 20, mode="same")
    i = int(np.argmax(smooth))
    return {"measured": round(t - span + (i + 0.5) * n / SR, 3), "level_dbfs": round(float(10 * np.log10(smooth[i] + 1e-20)), 1)}
