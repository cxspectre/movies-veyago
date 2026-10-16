"""arr_teaser.py — the 0:15 teaser score, re-arranged from the motif family.

Built to src/edits.ts TEASER_15 (teaser seconds; `props.music` quoted):
  0:00.0  sticky note   "pencil only, then the first chord at +1.0; piano sparse under the lettering"
  0:05.5  montage       four half-second pages at 0:05.5, 0:06.0, 0:06.5, 0:07.0: "one piano note on the cut"
                        (they climb the hope figure Ab-Bb-Db-Eb)
  0:07.5  lines catch light  "swell" (strings and the pulse rise into the stop)
  0:11.0  black         "hard stop; one full second of nothing"
  0:12.0  title         "soft swell; resolves on the last frame"
DEVIATION (flagged): a chord that starts on the last frame (0:14.967) is never heard, so the Db resolve lands at
0:14.5, during the last half-second of the "2" stroke, and rings to the end with a 0.25 s fade (the file ends
at 0:15.0 like the picture). Move RESOLVE if the director wants it later.
"""
from __future__ import annotations

from phrases import bass_hits, heartbeat, melody, ostinato, pad, piano_chord, string_chords
from score import Arrangement, Note, SyncPoint
from theory import ns

DURATION = 15.0
FIRST_CHORD = 1.0
MONTAGE = (5.5, 6.0, 6.5, 7.0)
LIGHT_START = 7.5
HARD_STOP = 11.0
TITLE_SWELL = 12.0
RESOLVE = 14.5
END_BY = 15.0
RANGES = {"basses": (28, 39), "celli": (36, 50), "violas": (53, 67), "violins": (62, 81)}
HARMONY = ((LIGHT_START, "Dbadd9/F"), (9.0, "Gbmaj9"), (10.0, "Absus4"), (HARD_STOP, None))


def sticky_note() -> tuple:
    first = piano_chord(FIRST_CHORD, "Gbmaj9", 0.62, 3.0, 30, ns("Db3 Bb3 F4 Ab4 Db5"), roll=0.03, tag="first-chord")
    under = melody(3.0, "Ab4 F5 Eb5", (0, 1, 2), (1.2, 1.2, 1.4), 0.22)
    return first + under + pad(FIRST_CHORD, 4.5, ns("Gb3 Db4 F4 Bb4"), 0.10, 0.8, 1.0)


def montage() -> tuple:
    hope = tuple(Note(t, 0.9, k, 0.5, "piano", tag="page") for t, k in zip(MONTAGE, ns("Ab4 Bb4 Db5 Eb5")))
    lows = tuple(Note(t, 0.9, k, 0.34, "piano") for t, k in zip(MONTAGE, ns("Db3 Gb2 Bb2 Ab2")))
    return hope + lows


def light() -> tuple:
    swell = piano_chord(LIGHT_START, "Dbadd9/F", 0.56, 1.5, 29, ns("Ab3 Db4 Eb4 Ab4"), tag="swell")
    rh = ostinato(8.0, ((8.0, "Dbadd9/F"), (9.0, "Gbmaj9"), (10.0, "Absus4"), (HARD_STOP, None)), 0.25,
                  (0, 2, 3, 2, 1, 2, 3, 2), (0.26, 0.36), 58, 77, seed=51)
    bass = bass_hits((9.0, 10.0), HARMONY, 0.46, 30, 0.95)
    strings = string_chords(HARMONY, RANGES, 0.6, 0.6, 0.3, overlap=0.2)
    strings = (Note(LIGHT_START, strings[0].dur, strings[0].key, strings[0].vel, strings[0].part, strings[0].attack,
                    strings[0].release, "strings-enter"),) + strings[1:]
    pulse = heartbeat((8.0, 9.0), 0.6, tight=False, dub=0.0, tag_first="pulse-starts") + heartbeat((10.0,), 0.85, tight=True, dub=0.5)
    shimmer = pad(LIGHT_START, 10.5, ns("Ab5 Db6 F6"), 0.12, 0.5, 0.5, "shimmer")
    return swell + rh + bass + strings + pulse + shimmer


def title() -> tuple:
    swell = (Note(TITLE_SWELL, 2.7, ns("Ab1")[0], 0.55, "basses", 2.3, 0.5, "title-swell"),
             Note(TITLE_SWELL, 2.7, ns("Ab2")[0], 0.5, "celli", 2.3, 0.5)) + pad(TITLE_SWELL, RESOLVE + 0.2, ns("Ab1 Ab2 Eb3"), 0.2, 2.2, 0.4)
    resolve = piano_chord(RESOLVE, "Db", 0.68, 0.6, 37, ns("Ab2 F3 Ab3 Db4 F4 Ab4 Db5"), tag="resolve")
    strings = string_chords(((RESOLVE, "Dbadd9"), (DURATION - 0.05, None)), RANGES, 0.55, 0.15, 0.2)
    return swell + resolve + strings + heartbeat((RESOLVE,), 0.72, tight=True, dub=0.0)


def sync_points() -> tuple:
    rows = [SyncPoint("pencil only (music silent)", 0.0, "mix", f"silence:{FIRST_CHORD}"),
            SyncPoint("first chord (sticky note smoothed)", FIRST_CHORD, "piano", "onset")]
    rows += [SyncPoint(f"montage page {i + 1}", t, "piano", "onset") for i, t in enumerate(MONTAGE)]
    rows += [SyncPoint("swell: lines catch light", LIGHT_START, "mix", "onset"), SyncPoint("strings enter", LIGHT_START, "strings", "entry"),
             SyncPoint("pulse starts", 8.0, "pulse", "entry"),
             SyncPoint("hard stop", HARD_STOP, "mix", "lastsound"), SyncPoint("one second of nothing", HARD_STOP, "mix", f"silence:{TITLE_SWELL}"),
             SyncPoint("soft swell", TITLE_SWELL, "mix", "entry"), SyncPoint("resolve (see deviation note)", RESOLVE, "piano", "onset")]
    return tuple(rows)


def build() -> Arrangement:
    notes = sticky_note() + montage() + light() + title() + \
        (Note(FIRST_CHORD, HARD_STOP - FIRST_CHORD, 0, 0.5, "air", 0.8, 0.0), Note(TITLE_SWELL, END_BY - TITLE_SWELL, 0, 0.5, "air", 1.2, 0.0))
    expression = {"strings": ((7.5, 0.4), (10.8, 1.0), (12.0, 0.35), (14.5, 0.85)),
                  "pulse": ((8.0, 0.7), (10.0, 1.0)), "air": ((1.0, 0.6), (12.0, 0.4))}
    chart = tuple((t, s, "teaser") for t, s in ((1.0, "Gbmaj9"), (5.5, "hope figure Ab-Bb-Db-Eb")) + HARMONY[:-1]
                  + ((HARD_STOP, "silence"), (TITLE_SWELL, "Ab pedal"), (RESOLVE, "Db")))
    return Arrangement("teaser", DURATION, tuple(sorted(notes, key=lambda x: (x.t, x.part, x.key))), expression,
                       silences=((0.0, FIRST_CHORD), (HARD_STOP, TITLE_SWELL)), hard_stops=(HARD_STOP,), end_by=END_BY,
                       end_fade=0.25, sync=sync_points(), chart=chart)
