"""Render the film's VO lines with one Kokoro voice and write timing.json.

    .venv/bin/python tools/vo/render_vo.py --voice af_heart --out audio/vo [--speed 0.82] [--lines vo1]

For each line: chunks are synthesized with explicit pauses (vo_lines.py), resampled to
48 kHz, trimmed with an 8 ms fade, normalised to -20 LUFS with true peak under -3 dBTP,
and written as 24-bit mono WAV. Lines that say "Provisum" are rendered once per
pronunciation (vo1_veezum.wav, vo1_vyzum.wav) and the chosen one is also written as
vo1.wav. If a line overruns its window or the picture end (vo_lines.soft_end_master), its
pauses are shortened first (to MIN_PAUSE_SCALE); only for the hard window is the read then
nudged faster (up to MAX_SPEED_NUDGE). A line that still does not fit is written anyway
and flagged (fits=false, or fitsPicture=false).
With --lines, only those lines are re-rendered; every other line's entry (and file) stays
exactly as it is in the folder's existing timing.json.
"""

import argparse
import json
import math
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path

from vo_align import WHISPER_MODEL, align
from vo_audio import OUT_RATE, TARGET_LUFS, TRUE_PEAK_CEILING_DBTP, fade, normalise, write_wav24
from vo_lines import DEFAULT_NAME_VARIANT, LINES, NAME_VARIANTS, Line
from vo_synth import FILM_DIR, Rendered, load_engine, render_line

DEFAULT_SPEED = 0.80
MIN_PAUSE_SCALE = 0.6
PAUSE_STEP = 0.1
MAX_SPEED_NUDGE = 0.08
SPEED_STEP = 0.02
GRID_SEC = 0.5  # the film's sync grid (CONTRACT section 4)


@dataclass(frozen=True)
class Take:
    rendered: Rendered
    speed: float
    pause_scale: float


def fit_take(engine, line: Line, voice: str, speed: float, variant: str) -> Take:
    """The slowest take that fits: pauses shorten (to MIN_PAUSE_SCALE) to fit the window or the
    picture end, whichever is earlier; the read is only sped up to fit the hard window."""
    pause_scale = 1.0
    soft_budget = min(line.budget, line.soft_end_master - line.window_start_master)
    take = Take(render_line(engine, line, voice, speed, variant), speed, pause_scale)
    while _duration(take) > soft_budget and pause_scale > MIN_PAUSE_SCALE + 1e-6:
        shorter = Take(render_line(engine, line, voice, speed, variant, round(pause_scale - PAUSE_STEP, 2)),
                       speed, round(pause_scale - PAUSE_STEP, 2))
        if _duration(shorter) >= _duration(take):
            break  # every pause is already at the line's min_pause floor
        take, pause_scale = shorter, shorter.pause_scale
    nudged = speed
    while _duration(take) > line.budget and nudged < speed + MAX_SPEED_NUDGE - 1e-6:
        nudged = round(nudged + SPEED_STEP, 3)
        take = Take(render_line(engine, line, voice, nudged, variant, pause_scale), nudged, pause_scale)
    return take


def _duration(take: Take) -> float:
    return len(take.rendered.audio) / OUT_RATE


def finish(take: Take, line: Line, path: Path, variant: str | None) -> dict:
    audio, levels = normalise(fade(take.rendered.audio, OUT_RATE))
    write_wav24(path, audio)
    al = align(audio, take.rendered.spans, tuple(c.shown for c in line.chunks))
    duration = len(audio) / OUT_RATE
    entry = {
        "file": path.name,
        "durationSec": round(duration, 3),
        "endMaster": round(line.window_start_master + duration, 3),
        "fits": duration <= line.budget,
        "fitsPicture": line.window_start_master + duration <= line.soft_end_master,
        "speed": take.speed,
        "pauseScale": take.pause_scale,
        **levels,
        "spokenNameVariant": variant,
        "recognisedAs": al.recognised,
        "wer": al.wer,
        "chunks": [
            {"text": c.shown, "start": round(s.start, 3), "end": round(s.end, 3)}
            for c, s in zip(line.chunks, take.rendered.spans)
        ],
        "breathsSec": [round(b.start - a.end, 3) for a, b in zip(take.rendered.spans, take.rendered.spans[1:])],
        "wordTimings": [
            {"word": w.word, "start": w.start, "end": w.end,
             "startMaster": round(line.window_start_master + w.start, 3), "aligned": w.matched}
            for w in al.words
        ],
    }
    ticks = _ticks(line, take, al.words)
    return {**entry, "ticks": ticks} if ticks else entry


def _ticks(line: Line, take: Take, words) -> list[dict]:
    """VO 1: when each ticked item starts, from the first aligned word of its chunk."""
    out = []
    for chunk, span in zip(line.chunks, take.rendered.spans):
        if not chunk.tick:
            continue
        first = next(w for w in words if span.start - 0.05 <= w.start <= span.end)
        start_master = round(line.window_start_master + first.start, 3)
        out.append({"item": chunk.tick, "start": first.start, "startMaster": start_master,
                    "gridMaster": _grid_at_or_after(start_master)})
    return out


def _grid_at_or_after(t: float) -> float:
    """The first point of the film's sync grid at or after t (the pencil ticks land there)."""
    return round(math.ceil(round(t / GRID_SEC, 6)) * GRID_SEC, 3)


def _unchanged_entries(out_dir: Path, only: set[str] | None) -> dict[str, dict]:
    """The existing timing.json entries for every line that is not re-rendered."""
    if only is None:
        return {}
    unknown = only - {line.id for line in LINES}
    if unknown:
        raise ValueError(f"Unknown VO lines: {sorted(unknown)}")
    previous = json.loads((out_dir / "timing.json").read_text())
    unchanged = {entry["id"]: entry for entry in previous["lines"] if entry["id"] not in only}
    missing = [line.id for line in LINES if line.id not in only and line.id not in unchanged]
    if missing:
        raise ValueError(f"{out_dir / 'timing.json'} has no entry for {missing}; render them too")
    return unchanged


def render_all(voice: str, out_dir: Path, speed: float, chosen: str, only: set[str] | None = None) -> dict:
    unchanged = _unchanged_entries(out_dir, only)
    engine = load_engine()
    lines = []
    for line in LINES:
        if line.id in unchanged:
            lines.append(unchanged[line.id])
            continue
        base = {"id": line.id, "text": line.text, "windowStartMaster": line.window_start_master,
                "nextWindowStartMaster": line.next_window_start_master,
                "pictureEndMaster": line.soft_end_master}
        if not line.has_name:
            take = fit_take(engine, line, voice, speed, DEFAULT_NAME_VARIANT)
            lines.append({**base, **finish(take, line, out_dir / f"{line.id}.wav", None)})
            continue
        variants = {}
        for variant in NAME_VARIANTS:
            take = fit_take(engine, line, voice, speed, variant)
            variants[variant] = finish(take, line, out_dir / f"{line.id}_{variant}.wav", variant)
        # The plain file is a byte copy of the chosen take, so its timings are exactly the variant's.
        main_path = out_dir / f"{line.id}.wav"
        shutil.copyfile(out_dir / variants[chosen]["file"], main_path)
        lines.append({**base, **variants[chosen], "file": main_path.name, "variants": variants})
        print(f"{line.id}: done", flush=True)
    return {
        "voice": voice, "engine": "Kokoro v1.0 (kokoro-onnx)", "baseSpeed": speed,
        "sampleRate": OUT_RATE, "bitDepth": 24, "channels": 1,
        "targetLufs": TARGET_LUFS, "truePeakCeilingDbtp": TRUE_PEAK_CEILING_DBTP,
        "wordTimingSource": f"faster-whisper {WHISPER_MODEL} word timestamps per chunk; chunk starts are exact",
        "lines": lines,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--voice", required=True, help='Kokoro voice, or a blend "af_heart:0.7+af_bella:0.3"')
    parser.add_argument("--out", type=Path, required=True, help="output folder (relative to Film/)")
    parser.add_argument("--speed", type=float, default=DEFAULT_SPEED)
    parser.add_argument("--name", choices=sorted(NAME_VARIANTS), default=DEFAULT_NAME_VARIANT,
                        help="pronunciation written to vo1.wav / vo8.wav")
    parser.add_argument("--lines", help="comma-separated line ids to re-render (default: all)")
    args = parser.parse_args()
    out_dir = args.out if args.out.is_absolute() else FILM_DIR / args.out
    only = set(args.lines.split(",")) if args.lines else None
    try:
        timing = render_all(args.voice, out_dir, args.speed, args.name, only)
    except (ValueError, FileNotFoundError, KeyError) as error:
        sys.exit(f"render_vo.py: {error}")
    (out_dir / "timing.json").write_text(json.dumps(timing, indent=2) + "\n")
    for line in timing["lines"]:
        flag = "" if line["fits"] else "  DOES NOT FIT"
        print(f'{line["id"]}: {line["durationSec"]:.2f}s of {line["nextWindowStartMaster"] - line["windowStartMaster"]:.2f}s{flag}')


if __name__ == "__main__":
    main()
