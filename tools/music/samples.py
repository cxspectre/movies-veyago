"""samples.py — the sample banks (VSCO 2 Community Edition, CC0) as pitched, trimmed zones.

A zone is one recorded note: its file, its nominal MIDI key, its dynamic layer index (0 = softest),
and, once loaded, its audio resampled to 48 kHz and trimmed so the attack starts at sample 0.
The nominal key comes from the file name; `verify_bank` measures every sample's real pitch so the
naming convention (C3 or C4 as middle C) is checked, not assumed.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

from config import CACHE_DIR, SR, VENDOR_DIR

NOTE_PCS = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
ONSET_THRESHOLD_DB = -45.0  # relative to the sample's peak: where the attack is said to start
PRE_ROLL_S = 0.002  # leave 2 ms before the detected attack


@dataclass(frozen=True)
class Zone:
    path: Path
    key: int  # nominal MIDI note (C4 = 60)
    layer: int  # 0 = softest recorded dynamic


@dataclass(frozen=True)
class BankSpec:
    name: str
    folder: str
    pattern: str  # regex with named groups note|idx, dyn
    dyn_order: tuple  # dynamic tokens, softest first
    octave_offset: int  # added to the parsed octave (+1 when the library names middle C "C3")


def note_to_midi(name: str, octave: int) -> int:
    pc = NOTE_PCS[name[0]] + (1 if "#" in name else 0) - (1 if name.endswith("b") and len(name) > 1 else 0)
    return 12 * (octave + 1) + pc


BANKS = {
    "upright_player": BankSpec(
        "upright_player", "Keys/Upright Piano", r"Player_dyn(?P<dyn>\d)_rr1_(?P<idx>\d{3})\.wav$", ("1", "2", "3"), 0
    ),
    "upright_nr1": BankSpec(
        "upright_nr1", "Keys/Upright Nr1", r"UR1_(?P<note>[A-G]#?)(?P<oct>\d)_(?P<dyn>pp|mf|f)_RR1\.wav$", ("pp", "mf", "f"), 0
    ),
    "violins": BankSpec(
        "violins", "Strings/Violin Section/susVib", r"VlnEns_susVib_(?P<note>[A-G]#?)(?P<oct>\d)_v(?P<dyn>\d)\.wav$", ("1", "2"), 1
    ),
    "violas": BankSpec(
        "violas", "Strings/Viola Section/susvib", r"ViolaEns_susvib_(?P<note>[A-G]#?)(?P<oct>\d)_v(?P<dyn>\d)_1\.wav$", ("1", "2"), 1
    ),
    "celli": BankSpec(
        "celli", "Strings/Cello Section/susvib", r"susvib_(?P<note>[A-G]#?)(?P<oct>\d)_v(?P<dyn>\d)_1\.wav$", ("1", "3"), 1
    ),
    "basses": BankSpec(
        "basses", "Strings/Solo Contrabass/SusNV", r"BKCtbss_SusNV_(?P<note>[A-G]#?)(?P<oct>\d)_v(?P<dyn>\d)_rr1\.wav$", ("1", "3"), 1
    ),
}


def _player_mapping(folder: Path) -> dict:
    """The upright 'Player' set names files by index; MappingChart.txt gives index -> key."""
    chart = (folder / "MappingChart.txt").read_text().splitlines()
    pairs = [line.split("=") for line in chart if re.match(r"^\d{3}=\d+$", line.strip())]
    return {idx.strip(): int(key) for idx, key in pairs}


def list_zones(spec: BankSpec, octave_offset: int | None = None) -> tuple:
    folder = VENDOR_DIR / spec.folder
    if not folder.is_dir():
        raise FileNotFoundError(f"Sample folder missing: {folder}. Run tools/music/fetch_samples.sh first.")
    offset = spec.octave_offset if octave_offset is None else octave_offset
    mapping = _player_mapping(folder) if "idx" in spec.pattern else {}
    zones = []
    for path in sorted(folder.glob("*.wav")):
        match = re.search(spec.pattern, path.name)
        if not match:
            continue
        groups = match.groupdict()
        key = mapping[groups["idx"]] if "idx" in groups else note_to_midi(groups["note"], int(groups["oct"]) + offset)
        zones.append(Zone(path, key, spec.dyn_order.index(groups["dyn"])))
    if not zones:
        raise ValueError(f"No samples matched in {folder}")
    return tuple(sorted(zones, key=lambda z: (z.key, z.layer)))


def _trim_to_attack(audio: np.ndarray) -> np.ndarray:
    mono = np.abs(audio).max(axis=1)
    peak = mono.max()
    if peak <= 0:
        raise ValueError("Silent sample")
    above = np.nonzero(mono > peak * 10 ** (ONSET_THRESHOLD_DB / 20))[0]
    start = max(0, int(above[0]) - int(PRE_ROLL_S * SR))
    return audio[start:]


@lru_cache(maxsize=None)
def load_zone_audio(path: Path) -> np.ndarray:
    """Stereo float32 at 48 kHz, attack at t=0. Cached on disk under tools/music/.cache."""
    cache = CACHE_DIR / (path.parent.name.replace(" ", "_") + "__" + path.stem + ".npy")
    if cache.exists():
        return np.load(cache)
    audio, rate = sf.read(path, dtype="float32", always_2d=True)
    if audio.shape[1] == 1:
        audio = np.repeat(audio, 2, axis=1)
    if rate != SR:
        gcd = np.gcd(SR, rate)
        audio = resample_poly(audio, SR // gcd, rate // gcd, axis=0).astype(np.float32)
    trimmed = _trim_to_attack(audio[:, :2])
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    np.save(cache, trimmed)
    return trimmed


def estimate_f0(audio: np.ndarray, start_s: float, length_s: float, fmin: float = 25.0, fmax: float = 2200.0) -> float:
    """Harmonic-product-spectrum pitch estimate over a steady window of the sample."""
    mono = audio.mean(axis=1)
    seg = mono[int(start_s * SR): int((start_s + length_s) * SR)]
    if len(seg) < SR // 10:
        seg = mono[: int(length_s * SR)]
    n_fft = 1 << 19
    spec = np.abs(np.fft.rfft(seg * np.hanning(len(seg)), n_fft))
    freqs = np.fft.rfftfreq(n_fft, 1 / SR)
    hps = np.log(spec + 1e-12)
    for h in (2, 3, 4):
        dec = spec[::h]
        hps[: len(dec)] += np.log(dec + 1e-12)
    band = (freqs >= fmin) & (freqs <= fmax)
    idx = np.nonzero(band)[0]
    best = idx[np.argmax(hps[idx])]
    return float(freqs[best])


def midi_to_hz(midi: float) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


def hz_to_midi(hz: float) -> float:
    return 69 + 12 * np.log2(hz / 440.0)
