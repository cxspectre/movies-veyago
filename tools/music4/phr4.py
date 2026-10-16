"""phr4.py — v4 playing helpers on top of the v1 motif family (tools/music/phrases.py).

The motif family is v1's: CARE 5-3-2-1 (Ab F Eb Db, the answer), QUESTION 5-3-2 (stops on Eb), HOPE
5-6-1-2-3 (Ab Bb Db Eb F, rising). In B-flat minor (chapter 3) the same contour is MINOR_CARE F Db C Bb.
Every helper returns a new tuple of Notes.
"""
from __future__ import annotations

from phrases import (CARE, HOPE, QUESTION, bass_hits, clear_for, heartbeat, humanise, melody, ostinato, pad,  # noqa: F401
                     piano_chord, string_chords)
from score import Note
from theory import ns

MINOR_CARE = ("F", "Db", "C", "Bb")
STRING_RANGES = {"basses": (28, 39), "celli": (36, 50), "violas": (53, 67), "violins": (62, 81)}
LOW_STRINGS = {k: STRING_RANGES[k] for k in ("basses", "celli", "violas")}
HIGH_STRINGS = {k: STRING_RANGES[k] for k in ("celli", "violas", "violins")}
OST_8 = (0, 3, 1, 3, 2, 3, 1, 3)  # v1 low-high rocking figure
OST_16 = (0, 2, 3, 2, 1, 2, 3, 2)
PLUCK_S = 0.16  # a plucked piano note: short, damped quickly
PLUCK_RELEASE_S = 0.12
WOOD_S = 0.08


def k(name: str) -> int:
    return ns(name)[0]


def singles(rows: tuple, part: str = "piano") -> tuple:
    """rows: (t, note name, vel, dur[, tag]) -> Notes."""
    return tuple(Note(r[0], r[3], k(r[1]), r[2], part, tag=r[4] if len(r) > 4 else "") for r in rows)


def plucks(rows: tuple) -> tuple:
    """Plucked figure (felt piano, damped): rows (t, note name, vel[, tag])."""
    return tuple(Note(r[0], PLUCK_S, k(r[1]), r[2], "piano", 0.0, PLUCK_RELEASE_S, r[3] if len(r) > 3 else "") for r in rows)


def run(t0: float, t1: float, names: str, vel: tuple, part: str = "violins", legato: float = 1.6, tag: str = "") -> tuple:
    """An even run of pitches from t0 to t1 (the sampled strings cannot bend, so a glissando is a fast scale)."""
    keys = ns(names)
    step = (t1 - t0) / len(keys)
    v0, v1 = vel
    out = []
    for i, key in enumerate(keys):
        level = v0 + (v1 - v0) * i / max(1, len(keys) - 1)
        out.append(Note(t0 + i * step, step * legato, key, level, part, 0.02, 0.3, tag if i == 0 else ""))
    return tuple(out)


def wood(times: tuple, vel: float, accent: float = 0.15, tag: str = "") -> tuple:
    """Woodblock clicks (synthesised; see sound4.wood_note). Beats are accented."""
    return tuple(Note(t, WOOD_S, 79 if abs(t - round(t)) < 1e-6 else 76, min(1.0, vel + (accent if abs(t - round(t)) < 1e-6 else 0.0)),
                      "wood", tag=tag if i == 0 else "") for i, t in enumerate(times))


def every(t0: float, t1: float, step: float = 1.0) -> tuple:
    count = int(round((t1 - t0) / step))
    return tuple(round(t0 + i * step, 6) for i in range(count))


def tagged(notes: tuple, tag: str) -> tuple:
    """The same notes with the first one carrying `tag` (the analysis looks for it)."""
    if not notes:
        return notes
    x = notes[0]
    return (Note(x.t, x.dur, x.key, x.vel, x.part, x.attack, x.release, tag),) + notes[1:]


def strings(timeline: tuple, vel: float, attack: float, release: float, ranges: dict = None, overlap: float = 0.35) -> tuple:
    return string_chords(timeline, ranges or STRING_RANGES, vel, attack, release, overlap)


def held(t0: float, t1: float, rows: tuple, attack: float, release: float) -> tuple:
    """Sustained string notes: rows (part, note name, vel)."""
    return tuple(Note(t0, t1 - t0, k(name), vel, part, attack, release) for part, name, vel in rows)


def air(t0: float, t1: float, attack: float = 1.5, release: float = 0.8) -> tuple:
    return (Note(t0, t1 - t0, 0, 0.5, "air", attack, release),)


def thin(notes: tuple, factor: float) -> tuple:
    return tuple(Note(x.t, x.dur, x.key, x.vel * factor, x.part, x.attack, x.release, x.tag) for x in notes)
