"""edits4_music.py — the 75 s hook (HOOK_75) and the 180 s cut (CUT_180), re-arranged from the chapter scores.

The segments are read from src/edits4.ts (seg('<chapter>', from, to, ...)), so a re-cut there re-arranges the
music here. Each segment re-uses its chapter's material (same motif family, same key), but the edit is
ARRANGED, not sliced (BIBLE4 §6):
  - every note is shortened to end inside its segment, so the cut never chops a note; tails ring across it;
  - at a junction, whatever was sustaining at the cut point is re-struck on the segment's first frame, and a
    segment that would start with no piano attack gets a soft "hinge" chord of the harmony sounding there,
    so every segment begins on its own downbeat;
  - the chapter's rests, silences and hard stops come along (a hard stop on a segment's first frame cuts the
    previous segment dead, as in the master); contiguous segments of one chapter play straight through;
  - the edit ends on the material's own ending (the cut on the final chord's decay; the hook fades by its end).
Writes audio/v4/music/<edit>/music4-<edit>-{mix,piano,strings,pulse,texture}.wav and analysis/<edit>_report.json.
Run: .venv/bin/python -I tools/music4/edits4_music.py
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import conf4  # noqa: F401,E402

import numpy as np  # noqa: E402
import soundfile as sf  # noqa: E402

import compose4  # noqa: E402
import measure  # noqa: E402
from analyze4 import INT_SCALE, TOLERANCE_S, detector_latency  # noqa: E402
from bus4 import master_bus  # noqa: E402
from conf4 import ANALYSIS_DIR, EDITS4_TS, EVENTS_DIR, OUT_DIR, SR, STEMS, SUBTYPE  # noqa: E402
from phrases import piano_chord  # noqa: E402
from score4 import ChapterScore, Note, SyncPoint, validate  # noqa: E402
from stems4 import render_chapter  # noqa: E402
from theory import chord, lead  # noqa: E402

EDITS = {"hook75": "HOOK_75", "cut180": "CUT_180"}
RESTRIKE_MIN_S = 0.5  # a note with less than this left at the cut point is not re-struck
RESTRIKE_VEL = 0.85
HINGE_VEL = 0.26
HINGE_WINDOW_S = 0.5
EDIT_END_FADE_S = 3.0
EPS = 1e-6


def read_segments(const: str) -> tuple:
    text = EDITS4_TS.read_text()
    start = text.index(f"export const {const}")
    body = text[start:text.index("];", start)]
    return tuple((c, float(a), float(b)) for c, a, b in re.findall(r"seg\('(\w+)', ([\d.]+), ([\d.]+)", body))


def active_symbol(cs: ChapterScore, t: float) -> str | None:
    for when, symbol, _ in reversed(cs.chart):
        if when <= t + EPS:
            try:
                chord(symbol)
                return symbol
            except ValueError:
                continue
    return None


def moved(x: Note, t: float, dur: float, vel: float) -> Note:
    return Note(t, dur, x.key, vel, x.part, x.attack, x.release, x.tag)


def in_zero(cs: ChapterScore, t: float) -> bool:
    return any(s - EPS <= t < e for s, e, _ in cs.zeros)


def segment_notes(cs: ChapterScore, a: float, b: float, offset: float, junction: bool) -> tuple:
    dt = offset - a
    inside = tuple(moved(x, x.t + dt, min(x.dur, b - x.t), x.vel) for x in cs.notes if a - EPS <= x.t < b)
    if not junction or in_zero(cs, a):
        return inside
    restruck = tuple(moved(x, offset, min(x.t + x.dur, b) - a, x.vel * RESTRIKE_VEL)
                     for x in cs.notes if x.t < a - EPS and x.t + x.dur - a >= RESTRIKE_MIN_S and x.part != "air")
    restruck = tuple(Note(x.t, x.dur, x.key, x.vel, x.part, max(x.attack, 0.3) if x.part != "piano" else 0.0, x.release, "") for x in restruck)
    has_attack = any(x.part == "piano" and a - EPS <= x.t < a + HINGE_WINDOW_S for x in cs.notes) or any(x.part == "piano" for x in restruck)
    symbol = active_symbol(cs, a)
    hinge = () if has_attack or symbol is None else \
        piano_chord(offset, symbol, HINGE_VEL, min(3.0, b - a - 0.2), 30, lead(None, chord(symbol), 3, 56, 68), roll=0.08, tag="hinge")
    return inside + restruck + hinge


def segment_curve(points: tuple, a: float, b: float, dt: float) -> tuple:
    if not points:
        return ((a + dt, 1.0), (b + dt - 1e-3, 1.0))
    ts, vs = np.array([p[0] for p in points]), np.array([p[1] for p in points])
    inner = tuple((t + dt, v) for t, v in points if a < t < b)
    return ((a + dt, float(np.interp(a, ts, vs))),) + inner + ((b + dt - 1e-3, float(np.interp(b, ts, vs))),)


def arrange(edit: str, segments: tuple, scores: dict) -> tuple:
    notes, zeros, stops, sync, rows = [], [], [], [], []
    curves = {}
    parts = sorted({k for cs in scores.values() for k in cs.expression})
    offset, prev, end_by = 0.0, None, 0.0
    for cid, a, b in segments:
        cs = scores[cid]
        dt = offset - a
        contiguous = prev == (cid, a)
        notes += segment_notes(cs, a, b, offset, junction=not contiguous)
        for s, e, label in cs.zeros:
            if s < b - EPS and e > a + EPS or (abs(s - b) < EPS and s in cs.hard_stops):
                zeros.append((max(s, a) + dt, min(e, b) + dt, f"{cid}: {label}"))
        stops += [h + dt for h in cs.hard_stops if a - EPS <= h <= b + EPS and not (contiguous and abs(h - a) < EPS)]
        if cs.end_by and a <= cs.end_by <= b:
            end_by = cs.end_by + dt
        sync += [SyncPoint(f"{edit} seg {len(rows) + 1} ({cid} {p.label})", round(p.t + dt, 4), p.stem, p.method)
                 for p in cs.sync if a - EPS <= p.t < b and p.method.split(":")[0] in ("onset", "zero")
                 and (p.method == "onset" or float(p.method.split(":")[1]) <= b + EPS)]
        for part in parts:
            curves[part] = curves.get(part, ()) + segment_curve(cs.expression.get(part, ()), a, b, dt)
        rows.append({"segment": len(rows) + 1, "chapter": cid, "from": a, "to": b, "out_start": offset, "out_end": offset + b - a})
        offset += b - a
        prev = (cid, b)
    stops = sorted({round(s, 6) for s in stops if 0 < s < offset})
    zeros = sorted(set((round(s, 6), round(e, 6), lab) for s, e, lab in zeros))
    zeros += [(s, s, "hard stop on the cut") for s in stops if not any(abs(z[0] - s) < EPS for z in zeros)]
    cs = ChapterScore(edit, offset, tuple(sorted(notes, key=lambda x: (x.t, x.part, x.key))), curves, tuple(sorted(zeros)), tuple(stops),
                      end_by or offset, EDIT_END_FADE_S if not end_by else 2.0, tuple(sync), ())
    problems = validate(cs)
    if problems:
        raise ValueError(f"{edit}: " + "\n  ".join(problems[:20]))
    return cs, rows


def write_edit(edit: str, stems: dict) -> None:
    folder = OUT_DIR / edit
    folder.mkdir(parents=True, exist_ok=True)
    for name, x in (("mix", sum(stems.values())),) + tuple(stems.items()):
        if float(np.abs(x).max()) >= 1.0:
            raise ValueError(f"{edit} {name} would clip")
        sf.write(folder / f"music4-{edit}-{name}.wav", x, SR, subtype=SUBTYPE)


def analyse(edit: str, cs: ChapterScore, rows: list, latency: dict) -> dict:
    folder = OUT_DIR / edit
    audio = {n: sf.read(folder / f"music4-{edit}-{n}.wav", dtype="float32")[0] for n in ("mix",) + STEMS}
    mix_int = np.round(audio["mix"].astype(np.float64) * INT_SCALE).astype(np.int32)
    zero_rows = [{"label": lab, "start": s, "end": e, **measure.silence(mix_int, s, e)} for s, e, lab in cs.zeros if e > s]
    sync = []
    for p in cs.sync:
        if p.method == "onset":
            r = measure.onset_near(audio[p.stem], p.t, latency[p.stem])
            err = None if r["measured"] is None else round((r["measured"] - p.t) * 1000, 1)
            sync.append({"label": p.label, "t": p.t, "stem": p.stem, **r, "error_ms": err, "pass": err is not None and abs(err) <= TOLERANCE_S * 1000})
    nz = np.nonzero(np.abs(mix_int).max(axis=1))[0]
    report = {"edit": edit, "seconds": cs.length, "segments": rows, "hard_stops": list(cs.hard_stops), "zero_windows": zero_rows,
              "all_zero_pass": all(r["nonzero_samples"] == 0 for r in zero_rows), "sync": sync, "all_sync_pass": all(r["pass"] for r in sync),
              "last_nonzero_sample_s": round(float(nz[-1] + 1) / SR, 4) if len(nz) else None,
              "stems_sum_vs_mix_max_lsb": round(float(np.abs(sum(audio[s].astype(np.float64) for s in STEMS) - audio["mix"]).max() * INT_SCALE), 2),
              "loudness": measure.ebur128(folder / f"music4-{edit}-mix.wav"),
              "stem_true_peaks": {s: measure.ebur128(folder / f"music4-{edit}-{s}.wav")["true_peak_dbtp"] for s in STEMS},
              "hinges_at": sorted({round(x.t, 3) for x in cs.notes if x.tag == "hinge"})}
    (ANALYSIS_DIR / f"{edit}_report.json").write_text(json.dumps(report, indent=1, default=str))
    return report


def main() -> None:
    scores = compose4.build_all()
    latency = detector_latency()
    for edit, const in EDITS.items():
        cs, rows = arrange(edit, read_segments(const), scores)
        (EVENTS_DIR / f"{edit}.json").write_text(json.dumps({**cs.to_json(), "segments": rows}))
        stems, _, bus = master_bus(render_chapter(cs))
        write_edit(edit, stems)
        r = analyse(edit, cs, rows, latency)
        print(json.dumps({"edit": edit, **bus, "zero_pass": r["all_zero_pass"], "sync_pass": r["all_sync_pass"],
                          "failed": [s["label"] for s in r["sync"] if not s["pass"]], "loudness": r["loudness"], "stem_tp": r["stem_true_peaks"],
                          "last": r["last_nonzero_sample_s"], "hinges": r["hinges_at"]}, indent=1))


if __name__ == "__main__":
    main()
