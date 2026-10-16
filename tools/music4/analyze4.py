"""analyze4.py — proves the rendered v4 score: sync points, zero windows, bar lines, loudness, format, key.

Nobody on the crew can listen, so this measures. Every sync point is checked in the stem that proves it
(|error| <= 20 ms for onsets and entries; a hard stop's last sound must fall within 20 ms before it); every
zero window is checked sample by sample on the 24-bit integers of the mix AND every stem; loudness and
true peak come from ffmpeg's EBU R128 meter. Writes audio/v4/music/analysis/report.json.
Run: .venv/bin/python -I tools/music4/analyze4.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import conf4  # noqa: F401,E402

import numpy as np  # noqa: E402
import soundfile as sf  # noqa: E402

import inst_piano  # noqa: E402
import inst_synth  # noqa: E402
import measure  # noqa: E402
from conf4 import (ANALYSIS_DIR, CHAPTER_DIR, CHAPTER_START, CHAPTERS, EVENTS_DIR, MASTER_DIR, MASTER_SECONDS, SR, STEMS,  # noqa: E402
                   bar_lines)
from score import Note  # noqa: E402

TOLERANCE_S = 0.020
CREST_TOLERANCE_S = 0.5
CALIBRATION_T = 0.3
LOUD_WINDOW_S = 3.0  # short-term loudness window (RMS) for "the film's loudest" and the title swell's level
INT_SCALE = 2 ** 23


def detector_latency() -> dict:
    """The onset detector reports window centres; calibrate it on notes rendered at a known time (as v1)."""
    piano = np.zeros((int(1.2 * SR), 2))
    tone = inst_piano.render_note(61, 0.5, 0.6, 0.0, seed=1)
    a = int(CALIBRATION_T * SR)
    piano[a:a + len(tone)] = tone[: len(piano) - a]
    pulse = np.zeros_like(piano)
    beat = inst_synth.pulse_note(Note(CALIBRATION_T, 0.6, 44, 0.7, "pulse"), seed=1)
    pulse[a:a + len(beat)] = beat[: len(pulse) - a]
    out = {name: round(measure.onset_near(sig, CALIBRATION_T)["measured"] - CALIBRATION_T, 4) for name, sig in (("piano", piano), ("pulse", pulse))}
    return {**out, "mix": out["piano"], "strings": out["piano"], "texture": out["piano"]}


def load() -> dict:
    audio = {}
    for name in ("mix",) + STEMS:
        x, sr = sf.read(MASTER_DIR / f"music4-master-{name}.wav", dtype="float32")
        if sr != SR:
            raise ValueError(f"{name}: {sr} Hz")
        audio[name] = x
    audio["mix_int"] = np.round(audio["mix"].astype(np.float64) * INT_SCALE).astype(np.int32)
    return audio


def master_zeros(events: dict) -> list:
    return [(c["master_start"] + s, c["master_start"] + e, f"{c['chapter']}: {label}") for c in events["chapters"] for s, e, label in c["zeros"]]


def check(point: dict, audio: dict, latency: dict, zeros: list) -> dict:
    x = audio[point["stem"]]
    method, _, arg = point["method"].partition(":")
    t = point["t"]
    if method == "zero":
        rows = {name: measure.silence(np.round(audio[name].astype(np.float64) * INT_SCALE).astype(np.int32) if name != "mix" else audio["mix_int"],
                                      t, float(arg))["nonzero_samples"] for name in ("mix",) + STEMS}
        return {**point, "measured": t, "nonzero_samples": rows, "error_ms": 0.0, "pass": not any(rows.values())}
    if method == "quiet":
        result = measure.quiet(x, t, float(arg))
        return {**point, **result, "error_ms": 0.0, "pass": result["max_rms_dbfs_window"] < result["max_rms_dbfs_before"] - 6}
    if method == "crest":
        result = measure.crest(x, t)
        return {**point, **result, "error_ms": round((result["measured"] - t) * 1000, 1), "pass": abs(result["measured"] - t) <= CREST_TOLERANCE_S}
    if method == "silentafter":
        result = measure.silent_after(x[: int((t + 3.0) * SR)], t)
        return {**point, **result, "error_ms": round((result["measured"] - t) * 1000, 1), "pass": result["measured"] <= t + 0.5}
    if method == "endsby":
        result = measure.last_sound(x, t, ahead=0.9)
        return {**point, **result, "error_ms": round((result["measured"] - t) * 1000, 1), "pass": result["measured"] <= t + 1e-4}
    if method == "onset":
        result = measure.onset_near(x, t, latency[point["stem"]])
    elif method == "entry":
        before = [min(1.0, t - s) for s, e, _ in zeros if abs(e - t) < 1e-6]
        result = measure.entry(x, t, before[0] if before else 1.0)
    elif method == "lastsound":
        ahead = [e - s for s, e, _ in zeros if abs(s - t) < 1e-6]
        result = measure.last_sound(x, t, ahead=min(0.9, ahead[0]) if ahead else 0.9)
    else:
        raise ValueError(f"Unknown method {method}")
    measured = result.get("measured")
    error = None if measured is None else round((measured - t) * 1000, 1)
    ok = error is not None and (abs(error) <= TOLERANCE_S * 1000 if method != "lastsound" else -TOLERANCE_S * 1000 <= error <= 0.5)
    return {**point, **result, "error_ms": error, "pass": bool(ok)}


def to_master(chapter: dict, point: dict) -> dict:
    return {**point, "chapter": chapter["chapter"], "local": point["t"], "t": round(chapter["master_start"] + point["t"], 4)}


def plain(row: dict) -> dict:
    return json.loads(json.dumps(row, default=lambda v: v.item() if hasattr(v, "item") else str(v)))


def loudest_window(mix: np.ndarray) -> dict:
    n = int(LOUD_WINDOW_S * SR)
    hop = SR // 2
    mono = mix.mean(axis=1).astype(np.float64)
    power = np.array([np.mean(mono[i:i + n] ** 2) for i in range(0, len(mono) - n, hop)])
    i = int(np.argmax(power))
    return {"start_s": i * hop / SR, "end_s": i * hop / SR + LOUD_WINDOW_S, "rms_dbfs": round(float(10 * np.log10(power[i] + 1e-20)), 1)}


def title_swell(mix: np.ndarray) -> dict:
    start = CHAPTER_START["paperToGlass"]
    loud = measure.rms_db(mix, start + 60.0, start + 68.0, window=LOUD_WINDOW_S)
    swell = measure.rms_db(mix, start + 70.0, start + 73.0, window=LOUD_WINDOW_S)
    return {"plane_section_max_3s_rms_dbfs": loud, "title_swell_3s_rms_dbfs": swell, "difference_db": round(loud - swell, 1)}


def file_format(path: Path) -> dict:
    info = sf.info(path)
    return {"file": str(path.relative_to(MASTER_DIR.parent)), "samplerate": info.samplerate, "channels": info.channels, "subtype": info.subtype,
            "frames": info.frames, "seconds": round(info.frames / info.samplerate, 6)}


def chapter_files() -> list:
    rows = []
    for cid, number, start, end in CHAPTERS:
        path = CHAPTER_DIR / f"music4-{number:02d}-{cid}.wav"
        x, _ = sf.read(path, dtype="float32")
        rows.append({**file_format(path), "chapter": cid, "expected_frames": int(round((end - start) * SR)),
                     "last_sample_zero": bool(np.all(x[-1] == 0)), **measure.ebur128(path)})
    return rows


def keys(mix: np.ndarray) -> list:
    sections = (("line", 6, 30), ("mayasHouse", 30, 58), ("theNo", 75, 103), ("theNo (before the crumple)", 75, 85), ("filterMachine", 122, 150), ("researchBoard", 170, 230),
                ("nameAndLook", 246, 290), ("engineRoom", 290, 336), ("launch", 365, 415), ("village", 415, 490),
                ("paperToGlass", 490, 558), ("providedFor", 570, 594))
    return [{"section": f"{cid} {a}-{b}", **measure.key_estimate(measure.chroma(mix, a, b)), "tuning_cents": measure.tuning_cents(mix, a, b)}
            for cid, a, b in sections]


def main() -> dict:
    events = json.loads((EVENTS_DIR / "master.json").read_text())
    audio = load()
    zeros = master_zeros(events)
    latency = detector_latency()
    sync = [plain(check(to_master(c, p), audio, latency, zeros)) for c in events["chapters"] for p in c["sync"]]
    zero_rows = [plain(check({"label": label, "t": s, "stem": "mix", "method": f"zero:{e}"}, audio, latency, zeros)) for s, e, label in zeros if e > s]
    stems_sum = sum(audio[s].astype(np.float64) for s in STEMS)
    lines = bar_lines()
    report = {
        "onset_detector_latency_s": latency,
        "formats": [file_format(MASTER_DIR / f"music4-master-{n}.wav") for n in ("mix",) + STEMS],
        "sync": sync, "all_sync_pass": all(r["pass"] for r in sync),
        "zero_windows": zero_rows, "all_zero_pass": all(r["pass"] for r in zero_rows),
        "boundaries_on_bar_lines": {c[0]: c[2] in lines for c in CHAPTERS},
        "last_nonzero_sample_s": round(float(np.nonzero(np.abs(audio["mix_int"]).max(axis=1))[0][-1] + 1) / SR, 4),
        "stems_sum_vs_mix_max_abs": float(np.abs(stems_sum - audio["mix"]).max()),
        "stems_sum_vs_mix_max_lsb": round(float(np.abs(stems_sum - audio["mix"]).max() * INT_SCALE), 2),
        "loudness": {n: measure.ebur128(MASTER_DIR / f"music4-master-{n}.wav") for n in ("mix",) + STEMS},
        "loudest_3s": loudest_window(audio["mix"]), "title_swell": title_swell(audio["mix"]),
        "chapters": chapter_files(), "keys": keys(audio["mix"]), "duration_s": MASTER_SECONDS,
    }
    ANALYSIS_DIR.mkdir(parents=True, exist_ok=True)
    (ANALYSIS_DIR / "report.json").write_text(json.dumps(report, indent=1, default=str))
    failed = [r["label"] for r in sync + zero_rows if not r["pass"]]
    print(json.dumps({"sync_pass": report["all_sync_pass"], "zero_pass": report["all_zero_pass"], "failed": failed,
                      "mix": report["loudness"]["mix"], "last_sound": report["last_nonzero_sample_s"],
                      "sum_lsb": report["stems_sum_vs_mix_max_lsb"], "loudest": report["loudest_3s"], "title": report["title_swell"]}, indent=1))
    return report


if __name__ == "__main__":
    main()
