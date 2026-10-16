"""score4.py — the v4 note-event model: one ChapterScore per chapter, in chapter-local seconds.

Notes are the v1 `score.Note` (immutable). A chapter adds what the 10-minute film needs: its own length, the
windows that must be exact digital zero (rests and silences), hard stops (the music before them cuts dead),
an optional end (everything faded to nothing by then), the expression curves, the sync points the analysis
must find, and the chord chart for the README. Parts are the v1 parts plus a synthesised woodblock.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass, field

from score import Note, SyncPoint  # v1 (tools/music)

PARTS4 = ("piano", "violins", "violas", "celli", "basses", "pulse", "wood", "pad", "air", "shimmer")
STEM_OF4 = {"piano": "piano", "violins": "strings", "violas": "strings", "celli": "strings", "basses": "strings",
            "pulse": "pulse", "wood": "pulse", "pad": "texture", "air": "texture", "shimmer": "texture"}

__all__ = ("Note", "SyncPoint", "ChapterScore", "PARTS4", "STEM_OF4", "validate", "shift")


@dataclass(frozen=True)
class ChapterScore:
    chapter: str
    length: float  # chapter seconds (notes start before this; tails may ring past it)
    notes: tuple
    expression: dict = field(default_factory=dict)  # part -> ((t, gain), ...)
    zeros: tuple = ()  # ((start, end, label), ...) exact digital silence
    hard_stops: tuple = ()  # times where all music before cuts dead (each must open a zero window)
    end_by: float = 0.0  # 0 = no forced end; else every stem is faded to nothing by this time
    end_fade: float = 2.0
    sync: tuple = ()  # SyncPoint rows in chapter-local seconds
    chart: tuple = ()  # ((t, symbol, function), ...)

    def to_json(self) -> dict:
        return {"chapter": self.chapter, "length": self.length, "notes": [asdict(x) for x in self.notes],
                "expression": {k: [list(p) for p in v] for k, v in self.expression.items()},
                "zeros": [list(z) for z in self.zeros], "hard_stops": list(self.hard_stops), "end_by": self.end_by,
                "sync": [asdict(s) for s in self.sync], "chart": [list(c) for c in self.chart]}


def validate(cs: ChapterScore) -> tuple:
    problems = []
    for note in cs.notes:
        if note.part not in PARTS4:
            problems.append(f"{cs.chapter}: unknown part {note.part} at {note.t}")
        if not 0 <= note.vel <= 1:
            problems.append(f"{cs.chapter}: velocity {note.vel} at {note.t}")
        if note.t < 0 or note.t >= cs.length:
            problems.append(f"{cs.chapter}: {note.part} note at {note.t} outside 0-{cs.length}")
        for start, end, label in cs.zeros:
            if start <= note.t < end:
                problems.append(f"{cs.chapter}: {note.part} note at {note.t} inside zero window {label} {start}-{end}")
    for stop in cs.hard_stops:
        if not any(abs(z[0] - stop) < 1e-9 for z in cs.zeros):
            problems.append(f"{cs.chapter}: hard stop {stop} opens no zero window")
    for point in cs.sync:
        if not 0 <= point.t <= cs.length:
            problems.append(f"{cs.chapter}: sync {point.label} at {point.t} outside the chapter")
    return tuple(problems)


def shift(notes: tuple, dt: float) -> tuple:
    """The same notes dt seconds later (new objects)."""
    return tuple(Note(x.t + dt, x.dur, x.key, x.vel, x.part, x.attack, x.release, x.tag) for x in notes)
