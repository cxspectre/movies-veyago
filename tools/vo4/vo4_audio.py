"""Audio finishing for VO files: resample, trim, fade, loudness, true peak, 24-bit write."""

from math import gcd
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy.signal import resample_poly

OUT_RATE = 48_000
TARGET_LUFS = -20.0
TRUE_PEAK_CEILING_DBTP = -3.0
FADE_SEC = 0.008
TRUE_PEAK_OVERSAMPLE = 4
TRIM_THRESHOLD_DB = -50.0  # relative to the file's loudest 10 ms frame
TRIM_FRAME_SEC = 0.01
TRIM_AIR_SEC = 0.03  # leave a little air before the first and after the last sound
ONSET_DB = -35.0  # a word starts when its frame comes within this of the loudest frame
LIMITER_ATTACK_SEC = 0.005
LIMITER_RELEASE_SEC = 0.08


def resample(audio: np.ndarray, rate_in: int, rate_out: int = OUT_RATE) -> np.ndarray:
    if rate_in == rate_out:
        return audio.astype(np.float64)
    g = gcd(rate_in, rate_out)
    return resample_poly(audio.astype(np.float64), rate_out // g, rate_in // g)


def silence(seconds: float, rate: int) -> np.ndarray:
    return np.zeros(max(0, int(round(seconds * rate))), dtype=np.float64)


def frame_db(audio: np.ndarray, rate: int) -> np.ndarray:
    frame = max(1, int(rate * TRIM_FRAME_SEC))
    usable = len(audio) // frame * frame
    if usable == 0:
        return np.array([-120.0])
    rms = np.sqrt((audio[:usable].reshape(-1, frame) ** 2).mean(axis=1))
    return 20 * np.log10(np.maximum(rms, 1e-9))


def onset_sec(audio: np.ndarray, rate: int, within_db: float = ONSET_DB) -> float:
    """Seconds to the first 10 ms frame within `within_db` of the loudest frame: where speech starts."""
    db = frame_db(audio, rate)
    return int(np.argmax(db > db.max() + within_db)) * TRIM_FRAME_SEC


def trim_bounds(audio: np.ndarray, rate: int) -> tuple[int, int]:
    """Sample range that holds the speech, with a little air left at each end."""
    db = frame_db(audio, rate)
    loud = np.nonzero(db > db.max() + TRIM_THRESHOLD_DB)[0]
    if len(loud) == 0:
        return 0, len(audio)
    frame = int(rate * TRIM_FRAME_SEC)
    air = int(rate * TRIM_AIR_SEC)
    start = max(0, loud[0] * frame - air)
    end = min(len(audio), (loud[-1] + 1) * frame + air)
    return start, end


def fade(audio: np.ndarray, rate: int, seconds: float = FADE_SEC) -> np.ndarray:
    n = min(len(audio) // 2, int(rate * seconds))
    if n == 0:
        return audio.copy()
    ramp = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, n))
    gain = np.ones(len(audio))
    gain[:n] = ramp
    gain[-n:] = ramp[::-1]
    return audio * gain


def true_peak_dbtp(audio: np.ndarray) -> float:
    over = resample_poly(audio, TRUE_PEAK_OVERSAMPLE, 1)
    peak = float(np.max(np.abs(over))) if len(over) else 0.0
    return 20 * np.log10(max(peak, 1e-9))


def integrated_lufs(audio: np.ndarray, rate: int = OUT_RATE) -> float:
    meter = pyln.Meter(rate)
    return float(meter.integrated_loudness(audio))


def normalise(audio: np.ndarray, rate: int = OUT_RATE) -> tuple[np.ndarray, dict]:
    """Gain to TARGET_LUFS; if that breaks the true-peak ceiling, a soft limiter takes the peaks."""
    gained = pyln.normalize.loudness(audio, integrated_lufs(audio, rate), TARGET_LUFS)
    peak = true_peak_dbtp(gained)
    if peak > TRUE_PEAK_CEILING_DBTP:
        gained = _soft_limit(gained, TRUE_PEAK_CEILING_DBTP - 0.3)
    report = {
        "lufs": round(integrated_lufs(gained, rate), 2),
        "truePeakDbtp": round(true_peak_dbtp(gained), 2),
    }
    if report["truePeakDbtp"] > TRUE_PEAK_CEILING_DBTP:
        raise RuntimeError(f"True peak {report['truePeakDbtp']} dBTP is over the ceiling")
    return gained, report


def _soft_limit(audio: np.ndarray, ceiling_db: float) -> np.ndarray:
    """A smooth gain-reduction envelope (5 ms attack, 80 ms release) that holds peaks under the ceiling."""
    ceiling = 10 ** (ceiling_db / 20)
    over = resample_poly(np.abs(audio), TRUE_PEAK_OVERSAMPLE, 1)
    env = np.maximum.reduceat(over, np.arange(0, len(over), TRUE_PEAK_OVERSAMPLE))[: len(audio)]
    want = np.minimum(1.0, ceiling / np.maximum(env, 1e-9))
    attack = int(OUT_RATE * LIMITER_ATTACK_SEC)
    # Look ahead by the attack time so the gain is already down when the peak arrives.
    padded = np.concatenate([want, np.ones(attack)])
    windows = np.lib.stride_tricks.sliding_window_view(padded, attack + 1)
    lookahead_min = windows.min(axis=1)[: len(audio)]
    coeff = np.exp(-1.0 / (OUT_RATE * LIMITER_RELEASE_SEC))
    gain = np.empty(len(audio))
    level = 1.0
    for i, target in enumerate(lookahead_min):
        level = target if target < level else target + (level - target) * coeff
        gain[i] = level
    return audio * gain


def write_wav24(path: Path, audio: np.ndarray, rate: int = OUT_RATE) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(path), np.clip(audio, -1.0, 1.0), rate, subtype="PCM_24")
