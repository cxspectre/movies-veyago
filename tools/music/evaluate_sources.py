"""evaluate_sources.py — compare piano sound sources with objective measurements.

Candidates: the two CC0 uprights in VSCO 2 CE ("Player" upright and "Upright Nr1") and a home-made
additive/modal felt-piano synth. For the same notes at the softest layer we measure:
  centroid_hz      spectral centroid of the first 0.5 s (lower = darker, more felt-like)
  attack_ms        10% -> 90% of the peak envelope (a felt hammer is slower than a bare one)
  noise_floor_db   quietest 50 ms RMS in the sample relative to its peak (recording hiss)
  t30_s            time for the envelope to fall 30 dB from its peak (sustain)
  env_roughness    std of the detrended log envelope over 0.2-2 s (unison beating: a real-piano tell;
                   a perfectly smooth exponential decay is a synthetic tell)
  stereo_corr      L/R correlation (1.0 = mono; real recordings sit below 1)
  max_shift_st     worst-case pitch shift the bank needs to cover every key (smaller = more natural)
Writes audio/music/analysis/source_evaluation.json and prints a table.
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402

from config import ANALYSIS_DIR, SR  # noqa: E402
from samples import BANKS, list_zones, load_zone_audio, midi_to_hz  # noqa: E402

TEST_KEYS = (49, 57, 61, 65, 73)  # Db3, A3, Db4, F4, Db5 (nearest zone used)
ENV_HOP = 0.005


def envelope_db(mono: np.ndarray) -> np.ndarray:
    hop = int(ENV_HOP * SR)
    frames = len(mono) // hop
    rms = np.sqrt(np.mean(mono[: frames * hop].reshape(frames, hop) ** 2, axis=1) + 1e-20)
    return 20 * np.log10(rms / rms.max())


def measure(audio: np.ndarray) -> dict:
    mono = audio.mean(axis=1)
    head = mono[: SR // 2]
    spec = np.abs(np.fft.rfft(head * np.hanning(len(head))))
    freqs = np.fft.rfftfreq(len(head), 1 / SR)
    centroid = float((spec * freqs).sum() / spec.sum())
    lin = np.abs(mono)
    peak_i = int(np.argmax(lin[: SR]))
    smooth = np.convolve(lin, np.ones(48) / 48, mode="same")
    pk = smooth[: peak_i + 480].max()
    t10 = np.argmax(smooth > 0.1 * pk)
    t90 = np.argmax(smooth > 0.9 * pk)
    env = envelope_db(mono)
    below = np.nonzero(env[np.argmax(env):] < -30)[0]
    t30 = float(below[0] * ENV_HOP) if len(below) else float(len(env) * ENV_HOP)
    seg = env[int(0.2 / ENV_HOP): int(2.0 / ENV_HOP)]
    x = np.arange(len(seg))
    rough = float(np.std(seg - np.polyval(np.polyfit(x, seg, 2), x))) if len(seg) > 10 else 0.0
    win = int(0.05 * SR)
    rms = [np.sqrt(np.mean(mono[i:i + win] ** 2)) for i in range(0, len(mono) - win, win)]
    floor = 20 * np.log10((min(rms) + 1e-12) / (np.abs(mono).max() + 1e-12))
    corr = float(np.corrcoef(audio[: SR, 0], audio[: SR, 1])[0, 1])
    return {"centroid_hz": round(centroid), "attack_ms": round((t90 - t10) / SR * 1000, 1),
            "noise_floor_db": round(float(floor), 1), "t30_s": round(t30, 2),
            "env_roughness": round(rough, 2), "stereo_corr": round(corr, 3)}


def synth_felt_note(key: int, seconds: float = 6.0) -> np.ndarray:
    """A modal felt-piano candidate: inharmonic partials, two-stage decay, felt thump. Deterministic."""
    rng = np.random.default_rng(key)
    t = np.arange(int(seconds * SR)) / SR
    f0 = midi_to_hz(key)
    inharm = 0.0004
    out = np.zeros_like(t)
    for n in range(1, 16):
        fn = n * f0 * np.sqrt(1 + inharm * n * n)
        if fn > SR / 2.2:
            break
        amp = np.exp(-0.45 * n) / n ** 0.3
        decay = np.exp(-t * (0.6 + 0.35 * n)) * 0.7 + np.exp(-t * (0.12 + 0.05 * n)) * 0.3
        out += amp * decay * np.sin(2 * np.pi * fn * t + rng.uniform(0, 2 * np.pi))
    attack = 1 - np.exp(-t / 0.006)
    thump = rng.standard_normal(len(t)) * np.exp(-t / 0.012) * 0.05
    mono = out * attack + np.convolve(thump, np.ones(40) / 40, mode="same")
    return np.stack([mono, mono], axis=1).astype(np.float32)


def max_shift(keys: list) -> float:
    ks = sorted(set(keys))
    gaps = [b - a for a, b in zip(ks, ks[1:])]
    return max(gaps) / 2 if gaps else 0.0


def evaluate_bank(name: str) -> dict:
    zones = [z for z in list_zones(BANKS[name]) if z.layer == 0]
    rows = []
    for key in TEST_KEYS:
        zone = min(zones, key=lambda z: abs(z.key - key))
        rows.append(measure(load_zone_audio(zone.path)))
    summary = {k: round(float(np.mean([r[k] for r in rows])), 3) for k in rows[0]}
    layers = len({z.layer for z in list_zones(BANKS[name])})
    return {**summary, "max_shift_st": max_shift([z.key for z in zones]), "layers": layers}


def main() -> None:
    results = {name: evaluate_bank(name) for name in ("upright_player", "upright_nr1")}
    synth_rows = [measure(synth_felt_note(k)) for k in TEST_KEYS]
    results["modal_synth"] = {**{k: round(float(np.mean([r[k] for r in synth_rows])), 3) for k in synth_rows[0]},
                              "max_shift_st": 0.0, "layers": "continuous"}
    ANALYSIS_DIR.mkdir(parents=True, exist_ok=True)
    (ANALYSIS_DIR / "source_evaluation.json").write_text(json.dumps(results, indent=1))
    cols = list(next(iter(results.values())).keys())
    print("candidate".ljust(16) + "".join(c[:14].rjust(15) for c in cols))
    for name, r in results.items():
        print(name.ljust(16) + "".join(str(r[c]).rjust(15) for c in cols))


if __name__ == "__main__":
    main()
