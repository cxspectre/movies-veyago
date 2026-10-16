"""Objective voice audition: render sample lines with each candidate and measure them.

    .venv/bin/python tools/vo/audition.py [--speed 0.88] [--voices a,b,c] [--lines vo1,vo6,vo8]

Writes audio/vo/audition/<voice>/<line>.wav (for a human to listen to) and
audio/vo/audition/report.json. Metrics per voice:
  wer          word error rate of faster-whisper on the render (lower = clearer)
  prob         mean recogniser word probability (higher = clearer)
  f0Median     median pitch in Hz (lower reads calmer)
  f0RangeSt    pitch spread, 10th-90th percentile, in semitones (too flat = robotic,
               too wide = announcer / sing-song; about 4-7 st suits a quiet read)
  wpm          speaking rate over speech only (pauses excluded)
  fits         every rendered line fits its contract window
"""

import argparse
import json
from pathlib import Path

import librosa
import numpy as np

from vo_align import align
from vo_audio import OUT_RATE, normalise, write_wav24
from vo_lines import DEFAULT_NAME_VARIANT, LINES, line_by_id
from vo_synth import FILM_DIR, load_engine, render_line

CANDIDATES = (
    "af_heart", "af_bella", "af_nicole", "af_sarah", "af_kore", "af_aoede",
    "bf_emma", "bf_isabella",
    "am_michael", "am_fenrir", "am_puck", "bm_george", "bm_fable",
)
OUT_DIR = FILM_DIR / "audio/vo/audition"
PITCH_RATE = 16_000
F0_MIN, F0_MAX = 60.0, 400.0


def pitch_stats(audio: np.ndarray) -> tuple[float, float]:
    y = librosa.resample(audio.astype(np.float32), orig_sr=OUT_RATE, target_sr=PITCH_RATE)
    f0, voiced, _ = librosa.pyin(y, fmin=F0_MIN, fmax=F0_MAX, sr=PITCH_RATE)
    f0 = f0[voiced & ~np.isnan(f0)]
    if len(f0) == 0:
        return 0.0, 0.0
    lo, hi = np.percentile(f0, [10, 90])
    return float(np.median(f0)), float(12 * np.log2(hi / lo))


def audition_voice(engine, voice: str, speed: float, line_ids: list[str]) -> dict:
    rows = []
    for line in (line_by_id(i) for i in line_ids):
        rendered = render_line(engine, line, voice, speed, DEFAULT_NAME_VARIANT)
        audio, _ = normalise(rendered.audio)
        write_wav24(OUT_DIR / voice.replace(":", "-").replace("+", "_") / f"{line.id}.wav", audio)
        al = align(audio, rendered.spans, tuple(c.shown for c in line.chunks))
        f0, spread = pitch_stats(audio)
        speech = sum(s.end - s.start for s in rendered.spans)
        rows.append({
            "line": line.id, "dur": round(len(audio) / OUT_RATE, 2), "budget": round(line.budget, 2),
            "softBudget": round(line.soft_end_master - line.window_start_master, 2),
            "wer": al.wer, "prob": al.mean_probability, "f0": f0, "spread": spread,
            "wpm": len(al.words) / speech * 60, "heard": al.recognised,
        })
    return {
        "voice": voice, "speed": speed,
        "wer": round(float(np.mean([r["wer"] for r in rows])), 3),
        "prob": round(float(np.mean([r["prob"] for r in rows])), 3),
        "f0Median": round(float(np.median([r["f0"] for r in rows])), 1),
        "f0RangeSt": round(float(np.mean([r["spread"] for r in rows])), 2),
        "wpm": round(float(np.mean([r["wpm"] for r in rows])), 1),
        "fits": all(r["dur"] <= r["budget"] for r in rows),
        "lines": rows,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--speed", type=float, default=0.88)
    parser.add_argument("--voices", default=",".join(CANDIDATES))
    parser.add_argument("--lines", default="vo1,vo6,vo8")
    args = parser.parse_args()
    engine = load_engine()
    results = []
    for voice in args.voices.split(","):
        result = audition_voice(engine, voice, args.speed, args.lines.split(","))
        results.append(result)
        print(json.dumps({k: v for k, v in result.items() if k != "lines"}), flush=True)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    report = OUT_DIR / f"report_{args.speed}.json"
    report.write_text(json.dumps(results, indent=2, default=float))


if __name__ == "__main__":
    main()
