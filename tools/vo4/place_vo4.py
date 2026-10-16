"""Place the v4 scratch lines on the 600 s timeline and write the voice stems and timing.json.

    .venv/bin/python tools/vo4/place_vo4.py

Reads audio/v4/vo/clips.json (render_vo4.py). Lines keep their document order. Each line starts
at its paragraph's startMaster, unless the line before it is still speaking: then it waits
PLACE_GAP_SEC after that line ends (no two lines ever overlap, within a voice or across voices).
Every wait, tight gap, overrun and fit failure is listed in timing.json "conflicts".

Writes, 48 kHz 24-bit stereo (the same signal on both channels), 600 s long:
  audio/v4/vo/stem_founder.wav, stem_maker.wav, stem_maya.wav, stem_all.wav
and audio/v4/vo/timing.json.
"""

import json
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import soundfile as sf

from vo4_audio import OUT_RATE, true_peak_dbtp, write_wav24
from vo4_synth import PAUSE_AFTER_SEC

FILM_DIR = Path(__file__).resolve().parents[2]
VO_DIR = FILM_DIR / "audio/v4/vo"
CLIPS_PATH = VO_DIR / "clips.json"
TIMING_PATH = VO_DIR / "timing.json"
MASTER_SEC = 600.0
PLACE_GAP_SEC = 0.3
TIGHT_AIR_SEC = 0.5
EPS = 1e-3
STEMS = {"FOUNDER": "stem_founder.wav", "MAKER": "stem_maker.wav", "MAYA": "stem_maya.wav", "all": "stem_all.wav"}


@dataclass(frozen=True)
class Placed:
    entry: dict
    start: float
    end: float

    @property
    def delay(self) -> float:
        return self.start - self.entry["startMaster"]


def chain(entries: list[dict]) -> list[Placed]:
    """Document order; a line waits for the line before it if that one is still speaking."""
    placed: list[Placed] = []
    for entry in entries:
        earliest = entry["startMaster"]
        start = earliest if not placed else max(earliest, placed[-1].end + PLACE_GAP_SEC)
        placed.append(Placed(entry, start, start + entry["durationSec"]))
    return placed


def _conflicts(item: Placed) -> list[dict]:
    e = item.entry
    out = []
    if item.delay > EPS:
        out.append({"id": e["id"], "kind": "waits", "seconds": round(item.delay, 3),
                    "detail": f"starts {item.delay:.2f} s after its paragraph; the line before it runs on"})
    if item.end > e["nextLineStart"] + EPS:
        out.append({"id": e["id"], "kind": "runs into next paragraph",
                    "seconds": round(item.end - e["nextLineStart"], 3),
                    "detail": f"ends {item.end:.2f} s, after the next paragraph at {e['nextLineStart']:.2f} s"})
    elif item.end > e["nextLineStart"] - TIGHT_AIR_SEC:
        out.append({"id": e["id"], "kind": "tight",
                    "seconds": round(e["nextLineStart"] - item.end, 3),
                    "detail": f"ends with {e['nextLineStart'] - item.end:.2f} s before the next paragraph"})
    if not e["fits"]:
        out.append({"id": e["id"], "kind": "over budget", "seconds": None,
                    "detail": "does not fit its window even after shorter pauses and +0.08 speed"})
    if e["speed"] > e.get("baseSpeed", 0.8) + EPS:
        out.append({"id": e["id"], "kind": "speed nudged", "seconds": None,
                    "detail": f"read at speed {e['speed']} (base 0.80); pauses scale {e['pauseScale']}"})
    return out


def _overlaps(placed: list[Placed]) -> list[str]:
    """Any two lines of one voice that overlap (must be none)."""
    problems = []
    for voice in ("FOUNDER", "MAKER", "MAYA"):
        own = sorted((p for p in placed if p.entry["voice"] == voice), key=lambda p: p.start)
        for a, b in zip(own, own[1:]):
            if b.start < a.end - EPS:
                problems.append(f"{voice}: {a.entry['id']} ends {a.end:.3f} after {b.entry['id']} starts {b.start:.3f}")
    return problems


def _mono_stem(placed: list[Placed], clip_dir: Path) -> np.ndarray:
    total = int(round(MASTER_SEC * OUT_RATE))
    stem = np.zeros(total, dtype=np.float32)
    for item in placed:
        audio, rate = sf.read(str(clip_dir / item.entry["file"].split("/")[-1]), dtype="float32", always_2d=False)
        if rate != OUT_RATE:
            raise ValueError(f"{item.entry['file']} is {rate} Hz, expected {OUT_RATE}")
        a = int(round(item.start * OUT_RATE))
        b = a + len(audio)
        if b > total:
            raise ValueError(f"{item.entry['id']} runs to {b / OUT_RATE:.2f} s, past the {MASTER_SEC:.0f} s stem")
        stem[a:b] += audio
    return stem


def _write_stems(placed: list[Placed]) -> dict[str, dict]:
    result = {}
    for key, name in STEMS.items():
        chosen = [p for p in placed if key == "all" or p.entry["voice"] == key]
        mono = _mono_stem(chosen, VO_DIR / "clips")
        write_wav24(VO_DIR / name, np.stack([mono, mono], axis=1))
        result[name] = {"lines": len(chosen), "truePeakDbtp": round(true_peak_dbtp(mono.astype(np.float64)), 2),
                        "lengthSec": MASTER_SEC}
    return result


def _line_timing(item: Placed) -> dict:
    e = item.entry
    return {
        "id": e["id"],
        "voice": e["voice"],
        "chapter": e["chapter"],
        "text": e["text"],
        "file": f"clips/{e['id']}.wav",
        "startMaster": e["startMaster"],
        "start": round(item.start, 3),
        "end": round(item.end, 3),
        "nextLineStart": e["nextLineStart"],
        "budgetSec": e["budgetSec"],
        "durationSec": e["durationSec"],
        "fits": e["fits"],
        "speed": e["speed"],
        "pauseScale": e["pauseScale"],
        "lufs": e["lufs"],
        "truePeakDbtp": e["truePeakDbtp"],
        "wer": e["wer"],
        "sentenceStarts": [round(item.start + s["start"], 3) for s in e["sentences"]],
        "wordTimings": [
            {**w, "startMaster": round(item.start + w["start"], 3), "endMaster": round(item.start + w["end"], 3)}
            for w in e["wordTimings"]
        ],
    }


def _measured(entry: dict) -> dict:
    """The clip's real length on disk, so a replaced (human) take is placed by what it is,
    not by the duration recorded when it was rendered."""
    duration = sf.info(str(VO_DIR / entry["file"])).duration
    return {**entry, "durationSec": round(duration, 3), "fits": duration <= entry["budgetSec"] + EPS}


def main() -> None:
    report = json.loads(CLIPS_PATH.read_text(encoding="utf-8"))
    entries = [{**_measured(e), "baseSpeed": 0.8} for e in report["lines"]]
    placed = chain(entries)
    if placed and placed[-1].end > MASTER_SEC:
        raise SystemExit(f"place_vo4.py: the last line ends at {placed[-1].end:.2f} s, past {MASTER_SEC:.0f} s")
    overlaps = _overlaps(placed)
    if overlaps:
        raise SystemExit("place_vo4.py: overlaps within a voice: " + "; ".join(overlaps))
    conflicts = [c for item in placed for c in _conflicts(item)]
    stems = _write_stems(placed)
    timing = {
        "timeline": {"lengthSec": MASTER_SEC, "sampleRate": OUT_RATE, "channels": 2, "bitDepth": 24},
        "voices": report["voices"],
        "engine": report["engine"],
        "namePronunciation": report["namePronunciation"],
        "placeGapSec": PLACE_GAP_SEC,
        "pauseAfterSec": PAUSE_AFTER_SEC,
        "stems": stems,
        "withinVoiceOverlaps": overlaps,
        "conflicts": conflicts,
        "lines": [_line_timing(item) for item in placed],
    }
    TIMING_PATH.write_text(json.dumps(timing, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{TIMING_PATH}: {len(placed)} lines, {len(conflicts)} conflicts")
    for c in conflicts:
        print(f"  {c['id']} {c['kind']}: {c['detail']}")
    print(json.dumps(stems, indent=1))


if __name__ == "__main__":
    main()
