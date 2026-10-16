"""analyze.py — proves the rendered score against its sync points and the delivery specs.

For each version: every sync point measured in the stem that proves it (|error| must be <= 20 ms),
silence windows checked sample by sample, EBU R128 loudness and true peak (ffmpeg), the key and the
tuning of each section, onset rates around the tempo lifts, and the stems-sum-to-mix check.
Writes audio/music/analysis/<version>_report.json and the plots (see plots.py).
Run: .venv/bin/python -I tools/music/analyze.py [versions...]
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402
import soundfile as sf  # noqa: E402

import inst_piano  # noqa: E402
import inst_synth  # noqa: E402
import measure  # noqa: E402
import plots  # noqa: E402
from config import ANALYSIS_DIR, EVENTS_DIR, OUT_DIR, SR, STEMS, SYNC_TOLERANCE_S, VERSIONS  # noqa: E402
from score import Note  # noqa: E402

KEY_SECTIONS = {"master": ((6, 28), (28, 72), (80, 113), (115, 145), (145, 157)),
                "vertical": ((0, 14), (14, 30), (31, 44)), "teaser": ((0, 9), (10, 14.6))}
CALIBRATION_T = 0.3
DROP_MIN_DB = 6.0
CREST_TOLERANCE_S = 0.5
LIFT_WINDOWS = {"master": ((48, 56), (56, 66), (66, 72), (72, 80))}


def detector_latency() -> dict:
    """Calibrate the onset detector on notes rendered at a known time (it reports window centres)."""
    known = CALIBRATION_T
    piano = np.zeros((int(1.2 * SR), 2))
    tone = inst_piano.render_note(61, 0.5, 0.6, 0.0, seed=1)
    piano[int(known * SR): int(known * SR) + len(tone)] = tone[: len(piano) - int(known * SR)]
    pulse = np.zeros_like(piano)
    beat = inst_synth.pulse_note(Note(known, 0.6, 44, 0.7, "pulse"), seed=1)
    pulse[int(known * SR): int(known * SR) + len(beat)] = beat[: len(pulse) - int(known * SR)]
    shimmer = np.zeros_like(piano)
    glow = inst_synth.pad_note(Note(known, 0.5, 89, 0.5, "shimmer", 0.06, 0.4), inst_synth.SHIMMER_LEVEL_DB, seed=1)
    shimmer[int(known * SR): int(known * SR) + len(glow)] = glow[: len(shimmer) - int(known * SR)]
    return {name: round(measure.onset_near(sig, known)["measured"] - known, 4)
            for name, sig in (("piano", piano), ("pulse", pulse), ("texture", shimmer))}


def score_rate(events: dict, start: float, end: float) -> float:
    """Distinct piano onset times per second in the event list (notes within 30 ms count once)."""
    times = sorted(x["t"] for x in events["notes"] if x["part"] == "piano" and start <= x["t"] < end)
    distinct = [t for i, t in enumerate(times) if i == 0 or t - times[i - 1] > 0.03]
    return round(len(distinct) / (end - start), 2)


def load(version: str) -> dict:
    audio = {}
    for name in ("mix",) + STEMS:
        path = OUT_DIR / version / f"music-{version}-{name}.wav"
        audio[name] = sf.read(path, dtype="float64", always_2d=True)[0]
    audio["mix_int"] = sf.read(OUT_DIR / version / f"music-{version}-mix.wav", dtype="int32", always_2d=True)[0] // 256
    return audio


def plain(row: dict) -> dict:
    """numpy scalars -> Python values, so the JSON report has real booleans and numbers."""
    return {k: (v.item() if isinstance(v, np.generic) else v) for k, v in row.items()}


def gap_after(events: dict, t: float, default: float) -> float:
    """Length of the silence window that starts at t (so a last-sound search never reaches the music after it)."""
    spans = [end - start for start, end in events["silences"] if abs(start - t) < 1e-6 and end > start]
    return min(spans + [default]) - 0.01


def gap_before(events: dict, t: float, default: float) -> float:
    spans = [end - start for start, end in events["silences"] if abs(end - t) < 1e-6 and end > start]
    return min(spans + [default]) - 0.01


def check(point: dict, audio: dict, latency: dict, events: dict) -> dict:
    x = audio[point["stem"]]
    method, _, arg = point["method"].partition(":")
    t = point["t"]
    if method == "onset":
        result = measure.onset_near(x, t, latency.get(point["stem"], latency["piano"]))
    elif method == "drop":
        result = measure.level_change(x, t)
        ok = result["drop_db"] >= DROP_MIN_DB and result["measured"] is not None and t - 0.1 <= result["measured"] <= t + 0.4
        return {**point, **result, "error_ms": round((result["measured"] - t) * 1000, 1) if result["measured"] else None, "pass": ok}
    elif method == "entry":
        result = measure.entry(x, t, gap_before(events, t, 1.0))
    elif method == "lastsound":
        result = measure.last_sound(x, t, ahead=gap_after(events, t, 0.9))
    elif method == "silence":
        return {**point, **measure.silence(audio["mix_int"], t, float(arg)), "error_ms": 0.0,
                "pass": measure.silence(audio["mix_int"], t, float(arg))["nonzero_samples"] == 0}
    elif method == "quiet":
        result = measure.quiet(x, t, float(arg))
        return {**point, **result, "error_ms": 0.0, "pass": result["max_rms_dbfs_window"] < result["max_rms_dbfs_before"] - 6}
    elif method == "crest":
        result = measure.crest(x, t)
        return {**point, **result, "error_ms": round((result["measured"] - t) * 1000, 1), "pass": abs(result["measured"] - t) <= CREST_TOLERANCE_S}
    elif method == "silentafter":
        result = measure.silent_after(x, t)
        return {**point, **result, "error_ms": round((result["measured"] - t) * 1000, 1), "pass": result["measured"] <= t + 0.5}
    else:
        raise ValueError(f"Unknown method {method}")
    measured = result.get("measured")
    error = None if measured is None else round((measured - t) * 1000, 1)
    ok = error is not None and (abs(error) <= SYNC_TOLERANCE_S * 1000 if method != "lastsound" else -SYNC_TOLERANCE_S * 1000 <= error <= 0.5)
    return {**point, **result, "error_ms": error, "pass": bool(ok)}


def analyse(version: str) -> dict:
    events = json.loads((EVENTS_DIR / f"{version}.json").read_text())
    audio = load(version)
    latency = detector_latency()
    sync = [plain(check(p, audio, latency, events)) for p in events["sync"]]
    stems_sum = sum(audio[s] for s in STEMS)
    sum_err = float(np.abs(stems_sum - audio["mix"]).max())
    keys = []
    for start, end in KEY_SECTIONS.get(version, ()):
        profile = measure.chroma(audio["mix"], start, end)
        keys.append({"section": f"{start}-{end}", **measure.key_estimate(profile),
                     "tuning_cents": measure.tuning_cents(audio["mix"], start, end)})
    lifts = [{"window": f"{a}-{b}", "measured_onsets_per_s": measure.onset_rate(audio["piano"], a, b),
              "score_onsets_per_s": score_rate(events, a, b)} for a, b in LIFT_WINDOWS.get(version, ())]
    loudness = {name: measure.ebur128(OUT_DIR / version / f"music-{version}-{name}.wav") for name in ("mix",) + STEMS}
    report = {"version": version, "onset_detector_latency_s": latency, "duration_s": VERSIONS[version], "sync": sync, "all_sync_pass": all(s["pass"] for s in sync),
              "stems_sum_vs_mix_max_abs": sum_err, "loudness": loudness, "keys": keys, "lift_onset_rates": lifts}
    (ANALYSIS_DIR / f"{version}_report.json").write_text(json.dumps(report, indent=1, default=str))
    plots.overview(version, audio, events, sync)
    return report


def main(argv: list) -> None:
    for version in argv or list(VERSIONS):
        r = analyse(version)
        failed = [s for s in r["sync"] if not s["pass"]]
        print(f"{version}: sync {len(r['sync']) - len(failed)}/{len(r['sync'])} pass; "
              f"mix {r['loudness']['mix']['integrated_lufs']} LUFS, TP {r['loudness']['mix']['true_peak_dbtp']} dBTP; "
              f"stems-sum error {r['stems_sum_vs_mix_max_abs']:.2e}")
        for s in failed:
            print("   FAIL", s["label"], s["t"], {k: v for k, v in s.items() if k not in ("label", "t", "stem", "method")})
        for k in r["keys"]:
            print("   key", k)
        for lift in r["lift_onset_rates"]:
            print("   lift", lift)


if __name__ == "__main__":
    main(sys.argv[1:])
