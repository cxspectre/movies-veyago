"""Render every spoken v4 line with its scratch voice and write clips plus per-line analysis.

    .venv/bin/python -W ignore tools/vo4/render_vo4.py [--lines L001,L002] [--name veezum] [--no-align]

Reads audio/v4/vo/lines.json (script_lines.py). Each line is synthesised sentence by sentence
with PAUSE_AFTER_SEC of silence between sentences, faded, normalised to -20 LUFS with a true
peak under -3 dBTP, and written as 48 kHz 24-bit mono to audio/v4/vo/clips/<id>.wav.

Fitting: a line must end before its budget (nextLineStart - startMaster - BUDGET_AIR_SEC).
If it overruns, the pauses shorten first (down to PAUSE_MIN_SCALE), and only then is the read
nudged faster (at most MAX_SPEED_NUDGE above BASE_SPEED). A line that still overruns is written
and flagged fits=false. Placement on the 600 s timeline is done by place_vo4.py.
Writes audio/v4/vo/clips.json. With --lines, only those entries are re-rendered.
"""

import argparse
import json
from dataclasses import dataclass
from pathlib import Path

from vo4_align import align
from vo4_audio import OUT_RATE, TARGET_LUFS, fade, normalise, write_wav24
from vo4_synth import DEFAULT_NAME_VARIANT, NAME_VARIANTS, PAUSE_AFTER_SEC, Rendered, Speaker, load_engine, render_line, split_sentences

FILM_DIR = Path(__file__).resolve().parents[2]
VO_DIR = FILM_DIR / "audio/v4/vo"
LINES_PATH = VO_DIR / "lines.json"
CLIPS_PATH = VO_DIR / "clips.json"
CLIP_DIR = VO_DIR / "clips"
VOICES = {"FOUNDER": "am_michael", "MAKER": "am_fenrir", "MAYA": "af_heart"}
BASE_SPEED = 0.80
MAX_SPEED_NUDGE = 0.08
SPEED_STEP = 0.02
PAUSE_MIN_SCALE = 0.5
PAUSE_STEP = 0.1
BUDGET_AIR_SEC = 0.25
EPS = 1e-6


@dataclass(frozen=True)
class Take:
    rendered: Rendered
    speed: float
    pause_scale: float

    @property
    def duration(self) -> float:
        return len(self.rendered.audio) / OUT_RATE


def _take(speaker: Speaker, sentences: list[str], speed: float, pause_scale: float) -> Take:
    return Take(render_line(speaker, sentences, speed, pause_scale), speed, pause_scale)


def fit_line(speaker: Speaker, sentences: list[str], budget: float) -> Take:
    """Shorten pauses first; only then nudge the speed, never past BASE_SPEED + MAX_SPEED_NUDGE."""
    scale = 1.0
    take = _take(speaker, sentences, BASE_SPEED, scale)
    while take.duration > budget and scale > PAUSE_MIN_SCALE + EPS:
        scale = round(scale - PAUSE_STEP, 2)
        take = _take(speaker, sentences, BASE_SPEED, scale)
    speed = BASE_SPEED
    while take.duration > budget and speed < BASE_SPEED + MAX_SPEED_NUDGE - EPS:
        speed = round(speed + SPEED_STEP, 3)
        take = _take(speaker, sentences, speed, scale)
    return take


def _line_entry(line: dict, take: Take, budget: float, audio, levels: dict, al) -> dict:
    duration = len(audio) / OUT_RATE
    return {
        "id": line["id"],
        "voice": line["voice"],
        "chapter": line["chapter"],
        "text": line["text"],
        "startMaster": line["startMaster"],
        "nextLineStart": line["nextLineStart"],
        "budgetSec": round(budget, 3),
        "file": f"clips/{line['id']}.wav",
        "durationSec": round(duration, 3),
        "fits": duration <= budget + EPS,
        "speed": take.speed,
        "pauseScale": take.pause_scale,
        **levels,
        "sentences": [
            {"text": s.say, "start": round(s.start, 3), "end": round(s.end, 3)} for s in take.rendered.spans
        ],
        "recognised": al.recognised if al else None,
        "wer": al.wer if al else None,
        "wordTimings": [
            {"word": w.word, "start": w.start, "end": w.end, "aligned": w.matched} for w in al.words
        ] if al else [],
    }


def render_one(engine, line: dict, variant: str, align_on: bool) -> dict:
    voice = VOICES[line["voice"]]
    sentences = split_sentences(line["text"])
    budget = line["nextLineStart"] - line["startMaster"] - BUDGET_AIR_SEC
    speaker = Speaker(engine, voice, variant)
    take = fit_line(speaker, sentences, budget)
    audio, levels = normalise(fade(take.rendered.audio, OUT_RATE))
    write_wav24(CLIP_DIR / f"{line['id']}.wav", audio)
    al = align(audio, take.rendered.spans, tuple(sentences)) if align_on else None
    return _line_entry(line, take, budget, audio, levels, al)


def _merge(existing: list[dict], fresh: dict[str, dict], lines: list[dict]) -> list[dict]:
    by_id = {entry["id"]: entry for entry in existing} | fresh
    return [by_id[line["id"]] for line in lines if line["id"] in by_id]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lines", help="comma-separated line ids to re-render (default: all)")
    parser.add_argument("--name", choices=sorted(NAME_VARIANTS), default=DEFAULT_NAME_VARIANT)
    parser.add_argument("--no-align", action="store_true", help="skip the word-timing pass")
    args = parser.parse_args()
    lines = json.loads(LINES_PATH.read_text(encoding="utf-8"))
    only = set(args.lines.split(",")) if args.lines else {line["id"] for line in lines}
    unknown = only - {line["id"] for line in lines}
    if unknown:
        raise SystemExit(f"render_vo4.py: unknown line ids {sorted(unknown)}")
    CLIP_DIR.mkdir(parents=True, exist_ok=True)
    engine = load_engine()
    fresh = {}
    for line in lines:
        if line["id"] in only:
            fresh[line["id"]] = render_one(engine, line, args.name, not args.no_align)
            print(f'{line["id"]} {line["voice"]}: {fresh[line["id"]]["durationSec"]:.2f}s of '
                  f'{fresh[line["id"]]["budgetSec"]:.2f}s speed {fresh[line["id"]]["speed"]} '
                  f'pauses {fresh[line["id"]]["pauseScale"]}', flush=True)
    existing = json.loads(CLIPS_PATH.read_text())["lines"] if CLIPS_PATH.exists() and args.lines else []
    report = {
        "engine": "Kokoro v1.0 (kokoro-onnx)",
        "voices": VOICES,
        "baseSpeed": BASE_SPEED,
        "pauseAfterSec": PAUSE_AFTER_SEC,
        "namePronunciation": args.name,
        "sampleRate": OUT_RATE,
        "bitDepth": 24,
        "channels": 1,
        "targetLufs": TARGET_LUFS,
        "lines": _merge(existing, fresh, lines),
    }
    CLIPS_PATH.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    not_fit = [e["id"] for e in report["lines"] if not e["fits"]]
    print(f"{CLIPS_PATH}: {len(report['lines'])} lines; over budget before placement: {not_fit or 'none'}")


if __name__ == "__main__":
    main()
