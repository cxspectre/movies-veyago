"""ch_d.py — chapters 10-11 (paper to glass, provided for), chapter-local seconds.

Chapter 10 is the v1 Act 3-4 arc re-timed (BIBLE4 §5.10): swell at 0, the pulse locks at 7, nine snaps
climbing the hope figure, a peak at 25, hits at 36 and 38, a dry pulse under the number rolls, the ostinato
under the recordings, warm strings for the plane (the film's loudest bars), the hard stop on the unresolved
dominant at 68.0, two seconds of digital silence, the A-flat swell at 70.0 and the plain D-flat triad at 73.0.
Chapter 11 is the v1 end: felt piano alone and the final chord at 20.0, decayed by 24.0.
"""
from __future__ import annotations

from phr4 import (OST_8, OST_16, STRING_RANGES, LOW_STRINGS, air, bass_hits, every, heartbeat, melody, ostinato, pad,
                  piano_chord, string_chords, tagged)
from score4 import ChapterScore, Note, SyncPoint
from theory import ns

LOCK = 7.0
SNAPS = (10.0, 11.5, 13.0, 14.5, 16.0, 17.5, 19.0, 20.5, 22.0)
SNAP_TOPS = ("Ab4", "Bb4", "Db5", "Eb5", "F5", "Ab5", "Bb5", "Db6", "Eb6")
PEAK = 25.0
HITS = (36.0, 38.0)
ROLLS = (42.0, 43.5, 45.0, 46.5)
RECORDINGS = tuple(48.0 + 1.5 * i for i in range(8))
PLANE = 60.0
STOP = 68.0
SWELL = 70.0
RESOLVE = 73.0
ALONE = 75.0
GLASS = ((0, "Dbadd9"), (LOCK, "Dbadd9/F"), (10, "Gbmaj9"), (13, "Dbadd9/F"), (16, "Ebm9"), (19, "Bbm9"), (22, "Absus4"), (PEAK, "Gbmaj9"),
         (29, "Dbadd9/F"), (32, "Ebm9"), (34.5, "Absus4"), (HITS[0], "Gbmaj9"), (HITS[1], "Absus4"), (39, "Dbadd9"), (42, None))
REC_TL = ((48, "Dbadd9"), (51, "Bbm9"), (54, "Gbmaj9"), (57, "Ebm9"), (60, None))
PLANE_TL = ((PLANE, "Gbmaj9"), (62, "Dbadd9/F"), (64, "Ebm9"), (66, "Fm7"), (67, "Absus4"), (STOP, None))


SNAP_BASS = {"Gbmaj9": "Gb2", "Dbadd9/F": "F2", "Ebm9": "Eb2", "Bbm9": "Bb1", "Absus4": "Ab1"}
SNAP_CLEAR_S = 0.3


def _clear_around(notes: tuple, accents: tuple) -> tuple:
    """Figure notes within SNAP_CLEAR_S of a snap are dropped, so each snap speaks on its own."""
    return tuple(x for x in notes if all(abs(x.t - a) >= SNAP_CLEAR_S - 1e-6 for a in accents))


def _snaps() -> tuple:
    voicing = {"Gbmaj9": "Db4 F4", "Dbadd9/F": "F4 Ab4", "Ebm9": "Gb4 Bb4", "Bbm9": "Db4 F4", "Absus4": "Db4 Eb4"}
    out = []
    for t, top in zip(SNAPS, SNAP_TOPS):
        sym = [s for t0, s in GLASS if s and t0 <= t][-1]
        out += [Note(t, 0.9, key, 0.58, "piano") for key in ns(voicing[sym])]
        out.append(Note(t, 1.2, ns(SNAP_BASS[sym])[0], 0.5, "piano"))
        out.append(Note(t, 1.0, ns(top)[0], 0.72, "piano", tag="snap"))
    return tuple(out)


def _glass_arc() -> tuple:
    swell = piano_chord(0.0, "Dbadd9/F", 0.46, 3.6, 41, ns("Ab3 Db4 Eb4 F4"), roll=0.06, tag="glass-swell") + \
        pad(0.0, 7.0, ns("Db4 Eb4 F4 Ab4"), 0.10, 2.0, 1.5) + pad(0.0, 5.0, ns("Ab5 Db6 F6"), 0.10, 1.5, 2.0, "shimmer")
    ost = _clear_around(ostinato(LOCK, GLASS[1:8], 0.25, OST_16, (0.24, 0.32), 58, 75, seed=1001), SNAPS)
    bass = bass_hits((7.0,), GLASS, 0.40, 30, 2.8)
    pre = heartbeat(every(0.0, LOCK), 0.42, tight=False, dub=0.0)
    locked = heartbeat(every(LOCK, PEAK), 0.7, tight=True, dub=0.45, tag_first="pulse-locks")
    peak = piano_chord(PEAK, "Gbmaj9", 0.82, 3.6, 30, ns("Db3 Bb3 F4 Ab4 Db5 F5"), tag="peak") + \
        heartbeat((PEAK,), 0.95, tight=True, dub=0.5) + heartbeat(every(26.0, HITS[0]), 0.55, tight=True, dub=0.35)
    row = ostinato(29.0, GLASS[8:11] + ((HITS[0], None),), 0.5, OST_8, 0.3, 60, 76, seed=1002) + bass_hits((29.0, 32.0, 34.5), GLASS, 0.36, 30, 2.4)
    hit1 = piano_chord(HITS[0], "Gbmaj9", 0.68, 2.0, 30, ns("Db3 Bb3 F4 Ab4 Db5 F5"), tag="hit-1")
    hit2 = piano_chord(HITS[1], "Absus4", 0.62, 1.0, 32, ns("Eb3 Ab3 Db4 Eb4 Ab4 Db5 Ab5"), tag="hit-2")
    hits = heartbeat(HITS, 0.82, tight=True, dub=0.5) + heartbeat((37.0, 39.0), 0.5, tight=True, dub=0.35)
    settle = piano_chord(39.0, "Dbadd9", 0.34, 3.0, 37, ns("Ab3 Db4 Eb4 F4"), octave_bass=False, roll=0.1) + \
        pad(39.0, 42.0, ns("Db6 F6 Ab6"), 0.08, 0.5, 1.0, "shimmer")
    strings = string_chords(GLASS, STRING_RANGES, 0.64, 0.6, 0.6)
    return swell + ost + bass + _snaps() + pre + locked + peak + row + hit1 + hit2 + hits + settle + strings


def _rolls_recordings_plane() -> tuple:
    dry = heartbeat(every(ROLLS[0], 48.0), 0.55, tight=True, dub=0.0, tag_first="rolls") + \
        pad(ROLLS[0], 48.0, ns("Db2 Ab2"), 0.08, 0.3, 0.4)
    rec = tagged(ostinato(48.0, REC_TL, 0.25, OST_16, (0.27, 0.34), 60, 77, seed=1003), "recordings")
    rec_bass = bass_hits(RECORDINGS, REC_TL, 0.48, 30, 1.3)
    rec_pulse = heartbeat(every(48.0, PLANE), 0.6, tight=True, dub=0.4)
    rec_strings = string_chords(REC_TL, LOW_STRINGS, 0.5, 0.6, 0.6)
    plane = string_chords(PLANE_TL, STRING_RANGES, 0.82, 0.6, 0.3)
    plane = tagged(tuple(sorted(plane, key=lambda x: (x.t, -x.key))), "plane-strings")
    tune = tuple(Note(t, d, ns(k)[0], v, "violins", 0.3, 0.3) for t, d, k, v in (
        (60.0, 2.1, "Ab5", 0.7), (62.0, 2.1, "F5", 0.72), (64.0, 2.1, "Eb5", 0.74), (66.0, 1.1, "Ab5", 0.78), (67.0, 1.2, "Bb5", 0.82)))
    plane_piano = tagged(ostinato(PLANE, PLANE_TL, 0.5, OST_8, (0.44, 0.54), 60, 77, seed=1004), "plane") + \
        bass_hits((60.0, 62.0, 64.0, 66.0, 67.0), PLANE_TL, 0.6, 30, 1.9)
    plane_pulse = heartbeat(every(PLANE, STOP), 0.86, tight=True, dub=0.5)
    return dry + rec + rec_bass + rec_pulse + rec_strings + plane + tune + plane_piano + plane_pulse


def _title() -> tuple:
    swell = (Note(SWELL, 3.2, ns("Ab1")[0], 0.5, "basses", 2.8, 0.6, "title-swell"), Note(SWELL, 3.2, ns("Ab2")[0], 0.46, "celli", 2.8, 0.6),
             Note(SWELL, 3.2, ns("Eb3")[0], 0.36, "violas", 2.9, 0.6)) + pad(SWELL, RESOLVE + 0.2, ns("Ab1 Ab2 Eb3"), 0.2, 2.7, 0.8)
    resolve = piano_chord(RESOLVE, "Db", 0.66, 5.0, 37, ns("Ab2 F3 Ab3 Db4 F4 Ab4 Db5"), tag="resolve")
    strings = string_chords(((RESOLVE, "Db"), (ALONE, None)), {"basses": (28, 39), "celli": (36, 50), "violas": (53, 67), "violins": (62, 77)},
                            0.52, 0.25, 1.2, overlap=0.0)
    thump = heartbeat((RESOLVE,), 0.7, tight=True, dub=0.0)
    shimmer = pad(RESOLVE, 76.0, ns("Db6 F6 Ab6"), 0.08, 1.0, 2.0, "shimmer")
    alone = melody(ALONE + 0.5, "Ab3 F4 Eb4 Db4", (0, 1, 2, 3), (1.2, 1.2, 1.2, 2.2), 0.26) + \
        piano_chord(78.0, "Gbmaj9/Db", 0.24, 2.0, 37, ns("Bb2 F3"), octave_bass=False, roll=0.12)
    return swell + resolve + strings + thump + shimmer + alone


def paper_to_glass() -> ChapterScore:
    notes = _glass_arc() + _rolls_recordings_plane() + _title() + air(0.0, STOP, 1.0, 0.0) + air(SWELL, 80.0, 2.5, 1.0)
    expression = {"strings": ((0, 0.35), (5, 0.8), (7, 0.7), (22, 0.85), (PEAK, 1.0), (27, 0.75), (36, 0.9), (38.5, 0.9), (41.5, 0.15),
                              (42, 0.0), (48, 0.35), (59.5, 0.6), (60, 0.9), (67.9, 1.0), (68, 0.0), (SWELL, 0.3), (RESOLVE, 0.8),
                              (ALONE, 0.5)),
                  "pulse": ((0, 0.5), (LOCK, 1.0), (42, 0.75), (48, 0.9), (60, 1.0)), "air": ((0, 0.6), (STOP, 0.8), (SWELL, 0.3), (80, 0.4))}
    sync = (SyncPoint("10/0.0 swell: the lines catch light", 0.0, "piano", "onset"),
            SyncPoint("10/7.0 the pulse locks", LOCK, "pulse", "onset")) + \
        tuple(SyncPoint(f"10/{t:.1f} snap {i + 1} of 9", t, "piano", "onset") for i, t in enumerate(SNAPS)) + (
        SyncPoint("10/25.0 peak: five phones", PEAK, "piano", "onset"),
        SyncPoint("10/36.0 hit: the card flips", HITS[0], "piano", "onset"),
        SyncPoint("10/38.0 hit: the Wallet pass", HITS[1], "piano", "onset"),
        SyncPoint("10/42.0 dry pulse: number rolls", ROLLS[0], "pulse", "onset"),
        SyncPoint("10/48.0 ostinato under the recordings", 48.0, "piano", "onset"),
        SyncPoint("10/60.0 warm strings: the plane", PLANE, "piano", "onset"),
        SyncPoint("10/68.0 HARD STOP", STOP, "mix", "lastsound"),
        SyncPoint("10/68.0-70.0 digital silence", STOP, "mix", f"zero:{SWELL}"),
        SyncPoint("10/70.0 soft swell: Provisum", SWELL, "mix", "entry"),
        SyncPoint("10/73.0 \"2\" completes: resolve", RESOLVE, "piano", "onset"),
        SyncPoint("10/75.0 felt piano alone: strings below -60 dBFS by 77.0", ALONE + 2.0, "strings", "silentafter"),
    )
    chart = tuple((t, s, f) for (t, s), f in zip(GLASS[:-1], ("I", "I", "IV", "I", "ii", "vi", "V", "IV", "I", "ii", "V", "IV", "V", "I"))) + \
        ((ROLLS[0], "Db pedal (dry pulse)", "I"),) + tuple((t, s, f) for (t, s), f in zip(REC_TL[:-1], ("I", "vi", "IV", "ii"))) + \
        tuple((t, s, f) for (t, s), f in zip(PLANE_TL[:-1], ("IV", "I", "ii", "iii", "V"))) + \
        ((STOP, "silence (hard stop on V)", ""), (SWELL, "Ab pedal", "V"), (RESOLVE, "Db (root position)", "I"), (78.0, "Gbmaj9/Db", "IV/I"))
    return ChapterScore("paperToGlass", 80.0, notes, expression, zeros=((STOP, SWELL, "the hard stop"),), hard_stops=(STOP,), sync=sync,
                        chart=chart)


FINAL = 20.0
DECAYED = 24.0
PROVIDED = ((0, "Dbadd9"), (4, "Gbmaj9/Db"), (8, "Bbm7"), (12, "Gbmaj9"), (16, "Absus4"), (FINAL, "Dbadd9"))


def provided_for() -> ChapterScore:
    chords = piano_chord(0.0, "Dbadd9", 0.32, 3.6, 37, ns("Ab2 Eb3 Ab3"), octave_bass=False, roll=0.16, tag="pull-back") + \
        piano_chord(4.0, "Gbmaj9/Db", 0.28, 3.6, 37, ns("Bb2 F3 Ab3"), octave_bass=False, roll=0.14) + \
        piano_chord(8.0, "Bbm7", 0.28, 3.6, 34, ns("Db3 F3 Ab3"), octave_bass=False, roll=0.14) + \
        piano_chord(12.0, "Gbmaj9", 0.27, 3.6, 30, ns("Bb2 Db3 F3"), octave_bass=False, roll=0.14) + \
        piano_chord(16.0, "Absus4", 0.26, 3.6, 32, ns("Eb3 Ab3 Db4"), octave_bass=False, roll=0.12)
    tune = melody(1.0, "Ab4 F5 Eb5", (0, 1.5, 3.0), (1.4, 1.4, 2.4), 0.24) + melody(9.0, "Db5 Bb4 Ab4", (0, 1.5, 3.0), (1.4, 1.4, 2.4), 0.22) + \
        melody(16.5, "Ab4 F5 Eb5", (0, 1.0, 2.0), (1.0, 1.0, 1.4), 0.24)
    final = piano_chord(FINAL, "Dbadd9", 0.42, 2.8, 37, ns("Ab2 F3 Eb4 Ab4 Db5"), octave_bass=False, roll=0.0, tag="final-chord") + \
        pad(FINAL, 22.0, ns("Db3 Ab3 F4"), 0.07, 0.8, 1.2)
    notes = chords + tune + final + air(0.0, 21.0, 1.0, 1.5)
    sync = (SyncPoint("11/0.0 felt piano alone under the pull-back", 0.0, "piano", "onset"),
            SyncPoint("11/20.0 the final chord (I, the motif lands on 1)", FINAL, "piano", "onset"),
            SyncPoint("11/24.0 decayed (last sample above 1 LSB at or before 24.0)", DECAYED, "mix", "endsby"),
            SyncPoint("11/24.0-30.0 nothing until the pencil click (foley)", DECAYED, "mix", "zero:30.0"))
    chart = tuple((t, s, f) for (t, s), f in zip(PROVIDED, ("I", "IV/I", "vi", "IV", "V", "I (final)")))
    return ChapterScore("providedFor", 30.0, notes, {"air": ((0, 0.4), (21, 0.3))}, zeros=((DECAYED, 30.0, "the pencil click"),),
                        end_by=DECAYED, end_fade=2.0, sync=sync, chart=chart)


BUILDERS = {"paperToGlass": paper_to_glass, "providedFor": provided_for}
