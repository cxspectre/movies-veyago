"""score.py — the note-event model every arrangement produces and every renderer consumes.

An Arrangement is plain, immutable data: notes, per-part expression curves, the windows that must be
digital silence, and the sync points the analysis must find in the rendered audio. It serialises to
JSON (audio/music/events/<version>.json) and MIDI (audio/music/midi/<version>.mid) so it can be
inspected or re-voiced in any DAW.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass, field

PARTS = ("piano", "violins", "violas", "celli", "basses", "pulse", "pad", "air", "shimmer")
STEM_OF = {"piano": "piano", "violins": "strings", "violas": "strings", "celli": "strings", "basses": "strings",
           "pulse": "pulse", "pad": "texture", "air": "texture", "shimmer": "texture"}


@dataclass(frozen=True)
class Note:
    t: float  # onset, seconds from the start of the version
    dur: float  # sounding length (pedal included for piano), seconds
    key: int  # MIDI key (C4 = 60); for the pulse, the drum's tuning key
    vel: float  # 0..1 dynamic
    part: str
    attack: float = 0.0  # seconds of fade-in (strings / pads); 0 = the instrument's natural attack
    release: float = 0.0  # seconds of fade-out after dur; 0 = the instrument's default
    tag: str = ""  # free label, e.g. "first-chord", "snap", "hit", "lub", "dub"


@dataclass(frozen=True)
class SyncPoint:
    label: str  # the MUSIC MAP v1 row
    t: float  # where it must land (version seconds)
    stem: str  # which stem (or "mix") proves it
    method: str  # onset | entry | silence | lastsound | peak


@dataclass(frozen=True)
class Arrangement:
    version: str
    duration: float
    notes: tuple
    expression: dict = field(default_factory=dict)  # part -> ((t, gain 0..1), ...) breakpoints
    silences: tuple = ()  # ((start, end), ...) windows that must be exact digital silence
    hard_stops: tuple = ()  # times where every stem cuts dead (no tail)
    end_by: float = 0.0  # every stem is silent from here on
    end_fade: float = 1.4  # seconds of fade that finish exactly at end_by
    sync: tuple = ()
    chart: tuple = ()  # ((t, chord symbol, section), ...) for the README

    def to_json(self) -> dict:
        return {
            "version": self.version, "duration": self.duration,
            "notes": [asdict(x) for x in self.notes],
            "expression": {k: [list(p) for p in v] for k, v in self.expression.items()},
            "silences": [list(s) for s in self.silences], "hard_stops": list(self.hard_stops),
            "end_by": self.end_by, "sync": [asdict(s) for s in self.sync],
            "chart": [list(c) for c in self.chart],
        }


def validate(arr: Arrangement) -> tuple:
    """Return a tuple of problems (empty when the arrangement is consistent)."""
    problems = []
    for note in arr.notes:
        if note.part not in PARTS:
            problems.append(f"unknown part {note.part} at {note.t}")
        if not 0 <= note.vel <= 1:
            problems.append(f"velocity {note.vel} out of range at {note.t}")
        if note.t < 0 or note.t >= arr.duration:
            problems.append(f"note at {note.t} outside 0-{arr.duration}")
        for start, end in arr.silences:
            if start <= note.t < end:
                problems.append(f"{note.part} note at {note.t} inside silence {start}-{end}")
    for stop in arr.hard_stops:
        if not any(abs(s[0] - stop) < 1e-9 for s in arr.silences):
            problems.append(f"hard stop {stop} has no silence window")
    return tuple(problems)
