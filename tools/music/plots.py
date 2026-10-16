"""plots.py — quick-look pictures of the score for people who cannot listen to it.

<version>_overview.png: log-frequency spectrogram of the mix, the level of each stem over time, and every
sync point as a labelled line (green = measured within tolerance, red = not). For the master, zoom
pictures of the moments that matter most (first chord, hard stop and resolve, the feature cuts).
"""
from __future__ import annotations

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402

from config import ANALYSIS_DIR, SR, STEMS  # noqa: E402

FLOOR_DB = -80.0
BANDS = 220
F_LO, F_HI = 30.0, 12000.0
STEM_COLORS = {"mix": "#333333", "piano": "#8a5a2b", "strings": "#2f5bea", "pulse": "#b0303a", "texture": "#3a8a6a"}
ZOOMS = {"master": (("first-chord", 18, 36), ("stop-and-resolve", 104, 126), ("feature-cuts", 122, 147), ("lifts", 46, 82))}


def level_db(x: np.ndarray, window_s: float = 0.05) -> tuple:
    n = int(window_s * SR)
    mono = x.mean(axis=1)
    frames = len(mono) // n
    rms = np.sqrt((mono[: frames * n].reshape(frames, n) ** 2).mean(axis=1))
    return (np.arange(frames) + 0.5) * window_s, np.maximum(20 * np.log10(rms + 1e-12), FLOOR_DB)


def log_spectrogram(x: np.ndarray, n_fft: int = 4096, hop: int = 2048) -> tuple:
    mono = x.mean(axis=1)
    frames = max(1, (len(mono) - n_fft) // hop)
    win = np.hanning(n_fft)
    edges = np.geomspace(F_LO, F_HI, BANDS + 1)
    freqs = np.fft.rfftfreq(n_fft, 1 / SR)
    band_of = np.digitize(freqs, edges) - 1
    valid = (band_of >= 0) & (band_of < BANDS)
    out = np.zeros((BANDS, frames))
    for i in range(frames):
        spec = np.abs(np.fft.rfft(mono[i * hop: i * hop + n_fft] * win)) ** 2
        out[:, i] = np.bincount(band_of[valid], weights=spec[valid], minlength=BANDS)
    return 10 * np.log10(out + 1e-14), edges, (np.arange(frames) * hop + n_fft / 2) / SR


def _markers(ax, sync: list, t0: float, t1: float, labels: bool) -> None:
    for s in sync:
        if t0 <= s["t"] <= t1:
            ax.axvline(s["t"], color="#1a9a4a" if s["pass"] else "#d0302a", lw=0.6, alpha=0.8)
            if labels:
                ax.text(s["t"], 1.0, f" {s['label']}", rotation=90, fontsize=6, va="top", ha="left",
                        transform=ax.get_xaxis_transform(), color="#222222")


def _figure(version: str, audio: dict, sync: list, t0: float, t1: float, path, width: float) -> None:
    fig, axes = plt.subplots(len(STEMS) + 2, 1, figsize=(width, 11), sharex=True,
                             gridspec_kw={"height_ratios": [3.2] + [1] * (len(STEMS) + 1)})
    a, b = int(t0 * SR), int(t1 * SR)
    spec, edges, times = log_spectrogram(audio["mix"][a:b])
    top = spec.max()
    axes[0].imshow(spec, origin="lower", aspect="auto", cmap="magma", vmin=top - 75, vmax=top,
                   extent=(t0 + times[0], t0 + times[-1], 0, BANDS))
    ticks = [50, 100, 200, 500, 1000, 2000, 5000, 10000]
    axes[0].set_yticks([np.searchsorted(edges, f) for f in ticks], [f"{f // 1000}k" if f >= 1000 else str(f) for f in ticks])
    axes[0].set_ylabel("Hz (mix)")
    axes[0].set_title(f"Provided For - music {version}: spectrogram, stem levels (dBFS, 50 ms RMS), sync points "
                      f"(green = within 20 ms)", fontsize=10)
    _markers(axes[0], sync, t0, t1, labels=True)
    for ax, name in zip(axes[1:], ("mix",) + STEMS):
        tt, lv = level_db(audio[name][a:b])
        ax.fill_between(t0 + tt, FLOOR_DB, lv, color=STEM_COLORS[name], lw=0)
        ax.set_ylim(FLOOR_DB, 0)
        ax.set_ylabel(name, fontsize=8)
        ax.grid(axis="x", color="#dddddd", lw=0.4)
        _markers(ax, sync, t0, t1, labels=False)
    step = 4 if t1 - t0 > 40 else 1
    axes[-1].set_xticks(np.arange(np.ceil(t0 / step) * step, t1 + 0.01, step))
    axes[-1].set_xlabel("seconds (bar lines every 4 s, every second is a beat)")
    axes[-1].set_xlim(t0, t1)
    fig.tight_layout()
    fig.savefig(path, dpi=100)
    plt.close(fig)


def overview(version: str, audio: dict, events: dict, sync: list) -> None:
    duration = events["duration"]
    _figure(version, audio, sync, 0.0, duration, ANALYSIS_DIR / f"{version}_overview.png", max(14.0, duration * 0.14))
    for name, t0, t1 in ZOOMS.get(version, ()):
        _figure(version, audio, sync, t0, t1, ANALYSIS_DIR / f"{version}_zoom_{name}.png", 16.0)
