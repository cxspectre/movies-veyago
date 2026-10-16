"""phrases.py — the motif family and the playing patterns every arrangement is built from.

The "provided for" motif is four notes: 5 rising a sixth to 3, then 2, 1 (Ab - F - Eb - Db in D-flat):
a reach upwards and a settling home, like someone being looked after. The open form (stops on 2,
Eb) is the question; the closed form (lands on 1, Db) is the answer. The rising pentatonic 5-6-1-2-3
(Ab Bb Db Eb F) is the hope figure; the UI snaps climb it.

Every helper returns a tuple of Notes (immutable); arrangements concatenate them. Micro-timing and
velocity humanisation are seeded, so renders are identical run to run, and never touch a note that
is tagged as a sync point.
"""
from __future__ import annotations

import numpy as np

from score import Note
from theory import Chord, bass_note, chord, lead, n

CARE = ("Ab", "F", "Eb", "Db")  # 5 ^3 2 1
QUESTION = ("Ab", "F", "Eb")  # stops on 2
HOPE = ("Ab", "Bb", "Db", "Eb", "F")  # 5 6 1 2 3
HUMAN_TIMING_S = 0.006
HUMAN_VEL = 0.035


def humanise(notes: tuple, seed: int, timing: float = HUMAN_TIMING_S, vel: float = HUMAN_VEL) -> tuple:
    rng = np.random.default_rng(seed)
    out = []
    for note in notes:
        if note.tag:
            out.append(note)
            continue
        dt = float(rng.uniform(-timing, timing))
        dv = float(rng.uniform(-vel, vel))
        out.append(Note(max(0.0, note.t + dt), note.dur, note.key, float(np.clip(note.vel + dv, 0.02, 1.0)),
                        note.part, note.attack, note.release, note.tag))
    return tuple(out)


def melody(t0: float, names: str, times: tuple, durs: tuple, vel: float, part: str = "piano",
           tag: str = "", attack: float = 0.0, release: float = 0.0) -> tuple:
    """A line of explicit pitches ("Ab4 F5 Eb5 Db5") at offsets `times` from t0."""
    keys = tuple(n(x) for x in names.split())
    if not len(keys) == len(times) == len(durs):
        raise ValueError(f"melody {names!r}: {len(keys)} notes, {len(times)} times, {len(durs)} durations")
    return tuple(Note(t0 + t, d, k, vel, part, attack, release, tag) for k, t, d in zip(keys, times, durs))


def piano_chord(t: float, symbol: str, vel: float, dur: float, bass_lo: int, rh: tuple, octave_bass: bool = True,
                roll: float = 0.0, tag: str = "") -> tuple:
    """A pedalled piano chord: bass (with octave below if asked) plus explicit right-hand keys, optionally rolled."""
    c = chord(symbol)
    b = bass_note(c, bass_lo, bass_lo + 11)
    lows = (b - 12, b) if octave_bass else (b,)
    keys = lows + tuple(rh)
    notes = []
    for i, key in enumerate(keys):
        onset = t + (roll * i / max(1, len(keys) - 1) if i else 0.0)
        level = vel * (0.92 if i == 0 and octave_bass else 1.0) * (0.9 if 0 < i < len(keys) - 1 else 1.0)
        notes.append(Note(onset, dur, key, level, "piano", tag=tag if i == 0 else ""))
    return tuple(notes)


def ostinato(start: float, timeline: tuple, step: float, pattern: tuple, vel, lo: int, hi: int,
             accent: float = 0.12, gate: float = 1.6, seed: int = 1, voices: int = 4) -> tuple:
    """Right-hand broken-chord figure. timeline = ((t, symbol), ...) with an end marker (t_end, None).

    Each chord is voice-led from the previous one; `pattern` indexes the 4-note cell (0 = lowest).
    `vel` is a level or a (start, end) ramp across the figure. Beats (integer seconds) are accented.
    `gate` is the note length in steps (felt pianists half-pedal the figure).
    """
    notes, prev = [], None
    end = timeline[-1][0]
    v0, v1 = vel if isinstance(vel, tuple) else (vel, vel)
    for (t0, sym), (t1, _) in zip(timeline, timeline[1:]):
        if sym is None:
            continue
        cell = lead(prev, chord(sym), voices, lo, hi)
        prev = cell
        count = int(round((t1 - t0) / step))
        for i in range(count):
            t = t0 + i * step
            ramp = v0 + (v1 - v0) * (t - start) / max(1e-9, end - start)
            on_beat = abs(t - round(t)) < 1e-6
            level = ramp + (accent if on_beat else 0.0) - (0.04 if i % 2 else 0.0)
            notes.append(Note(t, step * gate, cell[pattern[i % len(pattern)] % len(cell)], float(np.clip(level, 0.05, 1)), "piano"))
    return humanise(tuple(notes), seed)


def clear_for(notes: tuple, accents: tuple, gap_before: float = 0.25) -> tuple:
    """Remove figure notes that land on an accent (and the one just before it), so the accent speaks alone."""
    def hidden(t: float) -> bool:
        return any(abs(t - a) < 0.03 or (gap_before and abs(t - (a - gap_before)) < 0.03) for a in accents)
    return tuple(x for x in notes if not hidden(x.t))


def bass_hits(points: tuple, timeline: tuple, vel: float, lo: int, dur: float, octave: bool = True, tag: str = "") -> tuple:
    """Left-hand bass notes (root of whichever chord is sounding) on the given onset times."""
    notes = []
    for t in points:
        sym = active_symbol(timeline, t)
        c = chord(sym)
        b = bass_note(c, lo, lo + 11)
        keys = (b - 12, b) if octave else (b,)
        notes.extend(Note(t, dur, k, vel * (0.85 if k < b else 1.0), "piano", tag=tag if k == b else "") for k in keys)
    return tuple(notes)


def active_symbol(timeline: tuple, t: float) -> str:
    current = None
    for t0, sym in timeline:
        if t0 <= t + 1e-9 and sym is not None:
            current = sym
    if current is None:
        raise ValueError(f"No chord at {t}")
    return current


def string_chords(timeline: tuple, ranges: dict, vel: float, attack: float, release: float, overlap: float = 0.35) -> tuple:
    """Sustained string chords, one voice per section, voice-led chord to chord.

    ranges: part -> (lo, hi). The basses/celli take the chord's bass; violas/violins the upper tones.
    """
    notes, prev = [], None
    upper_parts = [p for p in ("violas", "violins") if p in ranges]
    for (t0, sym), (t1, _) in zip(timeline, timeline[1:]):
        if sym is None:
            continue
        c: Chord = chord(sym)
        for part in ("basses", "celli"):
            if part in ranges:
                lo, hi = ranges[part]
                notes.append(Note(t0, t1 - t0 + overlap, bass_note(c, lo, hi), vel, part, attack, release))
        if upper_parts:
            lo = min(ranges[p][0] for p in upper_parts)
            hi = max(ranges[p][1] for p in upper_parts)
            cell = lead(prev, c, 2 * len(upper_parts), lo, hi)
            prev = cell
            for i, key in enumerate(cell):
                part = upper_parts[min(i // 2, len(upper_parts) - 1)]
                notes.append(Note(t0, t1 - t0 + overlap, key, vel, part, attack, release))
    return tuple(notes)


def heartbeat(times: tuple, vel: float, tight: bool, key: int = 44, dub_gap: float = 0.26, dub: float = 0.55,
              tag_first: str = "") -> tuple:
    """Soft low pulse: a 'lub' on each time and, if dub > 0, a quieter 'dub' just after (a resting heart)."""
    notes = []
    for i, t in enumerate(times):
        tag = tag_first if i == 0 else "lub"
        notes.append(Note(t, 0.6, key, vel, "pulse", 0.0 if tight else 0.012, 0.0, tag))
        if dub > 0:
            notes.append(Note(t + dub_gap, 0.5, key + 5, vel * dub, "pulse", 0.0 if tight else 0.012, 0.0, "dub"))
    return tuple(notes)


def pad(t0: float, t1: float, keys: tuple, vel: float, attack: float, release: float, part: str = "pad") -> tuple:
    return tuple(Note(t0, t1 - t0, k, vel, part, attack, release) for k in keys)
