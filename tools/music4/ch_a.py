"""ch_a.py — chapters 1-3 (the line, Maya's house, the no), chapter-local seconds, to BIBLE4 §7.1 / §7.2."""
from __future__ import annotations

from phr4 import (OST_8, OST_16, STRING_RANGES, LOW_STRINGS, air, bass_hits, every, heartbeat, held, melody, ostinato, pad,
                  piano_chord, singles, string_chords, tagged)
from score4 import ChapterScore, SyncPoint
from theory import ns

# ---- chapter 1: the line (0-30) --------------------------------------------------------------------------
LINE_ENTRY = 6.0
LINE_LIFT_CHORD = 18.0
LINE_DIVE = 26.0
LINE_DIVE_TL = ((26.0, "Dbadd9/F"), (28.0, "Ab/C"), (30.0, None))


def line() -> ChapterScore:
    sparse = singles((
        (LINE_ENTRY, "Ab3", 0.30, 3.0, "piano-enters"), (7.0, "F4", 0.26, 3.0), (9.0, "Eb4", 0.24, 2.5),
        (10.0, "Db4", 0.26, 4.0), (10.0, "Db2", 0.20, 4.5), (12.0, "Bb2", 0.19, 4.0), (13.0, "Db4", 0.22, 2.0),
        (14.0, "F4", 0.24, 2.5), (15.5, "Eb4", 0.20, 2.0), (16.0, "Gb2", 0.19, 2.5), (17.0, "Bb3", 0.20, 1.0),
        (22.0, "Ab4", 0.15, 3.0, "thins"), (24.5, "Eb4", 0.12, 1.4),
    ))
    lift = piano_chord(LINE_LIFT_CHORD, "Gbmaj9", 0.48, 3.6, 30, ns("Db3 Bb3 F4 Ab4 Db5"), roll=0.03, tag="lift-chord")
    bloom = pad(LINE_LIFT_CHORD, 22.0, ns("Gb3 Db4 F4 Bb4"), 0.10, 1.2, 2.0)
    dive = piano_chord(LINE_DIVE, "Dbadd9/F", 0.44, 2.0, 41, ns("Ab3 Db4 Eb4 F4"), octave_bass=True, tag="dive")
    figure = ostinato(26.5, ((26.5, "Dbadd9/F"), (28.0, "Ab/C"), (30.0, None)), 0.5, OST_8, (0.18, 0.30), 58, 74, seed=101)
    bass = bass_hits((28.0,), LINE_DIVE_TL, 0.32, 36, 2.0)
    shimmer = pad(LINE_DIVE, 29.5, ns("Ab5 Db6 Eb6"), 0.08, 1.6, 1.5, "shimmer")
    notes = sparse + lift + bloom + dive + figure + bass + shimmer + air(LINE_ENTRY, 30.0, 3.0, 1.0)
    sync = (SyncPoint("1/0.0-6.0 silence: pencil only", 0.0, "mix", "zero:6.0"),
            SyncPoint("1/6.0 felt piano enters", LINE_ENTRY, "piano", "entry"),
            SyncPoint("1/18.0 chord: the camera lifts", LINE_LIFT_CHORD, "piano", "onset"),
            SyncPoint("1/22-26 the piano thins", 22.0, "piano", "quiet:26.0"),
            SyncPoint("1/26.0 lift: the dive", LINE_DIVE, "piano", "onset"))
    chart = ((LINE_LIFT_CHORD, "Gbmaj9", "IV"), (LINE_DIVE, "Dbadd9/F", "I"), (28.0, "Ab/C", "V"))
    return ChapterScore("line", 30.0, notes, {"air": ((6, 0.3), (18, 0.6), (30, 0.5))},
                        zeros=((0.0, LINE_ENTRY, "pencil only"),), sync=sync, chart=chart)


# ---- chapter 2: Maya's house (0-45) ----------------------------------------------------------------------
MAYA_A = ((0, "Dbadd9"), (4, "Bbm7"), (8, "Gbmaj9"), (12, "Dbadd9/F"), (16, "Ebm9"), (20, "Absus4"), (22, None))
MAYA_LIFT = ((22, "Gbmaj9"), (24, "Bbm9"), (26, "Absus4"), (28, None))
FREEZE = 28.0
TREE = 29.0
MAYA_TREE = ((29, "Dbadd9"), (33, "Gbmaj9/Db"), (37, "Bbm9"), (41, "Absus4"), (45, None))


def mayas_house() -> ChapterScore:
    warm = ostinato(0, MAYA_A, 0.5, OST_8, (0.17, 0.30), 56, 72, seed=201)
    warm = tagged(warm, "maya-builds")
    bass = bass_hits((0, 4, 8, 12, 16, 20), MAYA_A, 0.30, 30, 3.6) + bass_hits((2, 6, 10, 14, 18), MAYA_A, 0.20, 37, 1.6, octave=False)
    tune = melody(4, "Ab4 F5 Eb5 Db5", (0, 2, 3.5, 5), (2.2, 1.7, 1.7, 3.0), 0.31) + \
        melody(16, "Ab4 Bb4 Db5 Eb5", (0, 1, 2, 3), (1.1, 1.1, 1.1, 3.0), 0.33)
    lift = ostinato(22, MAYA_LIFT, 0.25, OST_16, (0.30, 0.44), 58, 76, seed=202)
    lift_bass = bass_hits((22, 24, 26), MAYA_LIFT, 0.46, 30, 1.9, tag="lift-22") + bass_hits((23, 25, 27), MAYA_LIFT, 0.3, 37, 0.9, octave=False)
    storm_strings = string_chords(MAYA_LIFT, STRING_RANGES, 0.6, 0.5, 0.3)
    storm_pulse = heartbeat(every(22, 28), 0.5, tight=False, dub=0.0)
    tree = string_chords(MAYA_TREE, STRING_RANGES, 0.5, 1.6, 1.4)
    tree = tagged(tuple(sorted(tree, key=lambda x: (x.t, x.key))), "strings-enter")
    answer = melody(31, "Ab4 F5 Eb5 Db5", (0, 1.5, 2.5, 3.5), (1.6, 1.2, 1.2, 3.2), 0.24)
    tree_piano = piano_chord(37, "Bbm9", 0.24, 3.5, 30, ns("Db4 F4 Ab4 C5"), roll=0.12) + \
        singles(((41.0, "Ab4", 0.22, 1.5), (42.5, "F5", 0.2, 1.0), (43.5, "Eb5", 0.2, 1.4)))
    notes = warm + bass + tune + lift + lift_bass + storm_strings + storm_pulse + tree + answer + tree_piano + \
        air(0.0, FREEZE, 0.5, 0.0) + air(TREE, 45.0, 1.5, 1.0)
    expression = {"strings": ((16, 0.0), (22, 0.35), (27.9, 1.0), (28, 0.0), (29, 0.3), (33, 0.62), (41, 0.5), (45, 0.35)),
                  "pulse": ((22, 0.35), (27.5, 0.75)), "air": ((0, 0.5), (27, 0.8), (29, 0.4), (45, 0.5))}
    sync = (SyncPoint("2/0.0 the piano builds under Maya", 0.0, "piano", "onset"),
            SyncPoint("2/22.0 lift under the storm", 22.0, "piano", "onset"),
            SyncPoint("2/22-28 storm crest (strings, +-0.5 s of 28)", 27.5, "strings", "crest"),
            SyncPoint("2/28.0 stops dead: the freeze", FREEZE, "mix", "lastsound"),
            SyncPoint("2/28.0-29.0 one-beat rest", FREEZE, "mix", "zero:29.0"),
            SyncPoint("2/29.0 strings under the tree", TREE, "strings", "entry"))
    chart = tuple((t, s, f) for (t, s), f in zip(MAYA_A[:-1], ("I", "vi", "IV", "I", "ii", "V"))) + \
        tuple((t, s, f) for (t, s), f in zip(MAYA_LIFT[:-1], ("IV", "vi", "V"))) + ((FREEZE, "rest (one beat)", ""),) + \
        tuple((t, s, f) for (t, s), f in zip(MAYA_TREE[:-1], ("I", "IV/I", "vi", "V")))
    return ChapterScore("mayasHouse", 45.0, notes, expression, zeros=((FREEZE, TREE, "the freeze"),), hard_stops=(FREEZE,),
                        sync=sync, chart=chart)


# ---- chapter 3: the no (0-40), B-flat minor ---------------------------------------------------------------
CRUMPLE = (10.0, 12.0)
ENGINE_CHORD = 13.0
SCISSORS = (20.5, 22.5)
CALENDAR = 28.5


def the_no() -> ChapterScore:
    opening = piano_chord(0.0, "Bbmadd9", 0.30, 3.6, 30, ns("Db4 F4 C5"), roll=0.0, tag="minor")
    contour = singles(((2.0, "F4", 0.25, 1.5), (3.0, "Db5", 0.24, 1.5), (4.5, "C5", 0.22, 1.4), (6.0, "Bb4", 0.24, 2.0)))
    shade = piano_chord(8.0, "Gbmaj7", 0.22, 1.4, 30, ns("Bb3 Db4 F4"), roll=0.1)
    low = held(0.0, 9.0, (("celli", "Bb2", 0.34), ("basses", "Bb1", 0.32)), 2.0, 0.6)
    warm = piano_chord(ENGINE_CHORD, "Dbadd9", 0.46, 3.5, 37, ns("Ab3 Db4 Eb4 F4 Ab4"), roll=0.06, tag="warm-chord")
    warm_strings = string_chords(((ENGINE_CHORD, "Dbadd9"), (17.0, "Gbmaj9"), (19.6, None)), LOW_STRINGS, 0.48, 0.9, 0.5, overlap=0.0)
    after = piano_chord(17.0, "Gbmaj9", 0.3, 2.2, 30, ns("Bb3 Db4 F4 Ab4"), roll=0.1)
    later = piano_chord(23.0, "Ebm9", 0.24, 2.6, 30, ns("Gb3 Bb3 Db4 F4"), roll=0.12) + \
        piano_chord(26.0, "Fm7", 0.22, 2.0, 29, ns("Ab3 C4 Eb4"), octave_bass=False, roll=0.1)
    calendar = singles(((CALENDAR, "Bb1", 0.42, 3.5, "calendar"),)) + held(CALENDAR, 32.0, (("basses", "Bb1", 0.3),), 0.05, 1.0)
    turn = piano_chord(32.0, "Gbmaj9", 0.26, 3.6, 30, ns("Bb3 Db4 F4 Ab4"), roll=0.14) + \
        piano_chord(36.0, "Absus4", 0.24, 1.0, 32, ns("Db4 Eb4"), octave_bass=False) + \
        singles(((37.0, "Ab4", 0.22, 1.2), (38.0, "F5", 0.22, 1.0), (39.0, "Eb5", 0.22, 1.2)))
    turn_strings = string_chords(((32.0, "Gbmaj9"), (36.0, "Absus4"), (40.0, None)), LOW_STRINGS, 0.36, 2.0, 1.0)
    notes = opening + contour + shade + low + warm + warm_strings + after + later + calendar + turn + turn_strings + \
        air(0.0, CRUMPLE[0], 0.8, 0.0) + air(ENGINE_CHORD, SCISSORS[0], 0.5, 0.0) + air(SCISSORS[1], 40.0, 1.0, 1.0)
    expression = {"strings": ((0, 0.45), (13, 0.6), (20, 0.5), (28.5, 0.4), (32, 0.4), (40, 0.5)), "air": ((0, 0.4), (40, 0.4))}
    sync = (SyncPoint("3/0.0 B-flat minor, sparse", 0.0, "piano", "onset"),
            SyncPoint("3/10.0-12.0 crumple: foley alone", CRUMPLE[0], "mix", f"zero:{CRUMPLE[1]}"),
            SyncPoint("3/13.0 warm chord: the engine unfolds", ENGINE_CHORD, "piano", "onset"),
            SyncPoint("3/20.5-22.5 scissors: foley alone", SCISSORS[0], "mix", f"zero:{SCISSORS[1]}"),
            SyncPoint("3/28.5 one low note: the calendar", CALENDAR, "piano", "onset"))
    chart = ((0.0, "Bbmadd9", "i (B-flat minor)"), (8.0, "Gbmaj7", "VI"), (CRUMPLE[0], "rest (foley alone)", ""),
             (ENGINE_CHORD, "Dbadd9", "III (the relative major)"), (17.0, "Gbmaj9", "VI"), (SCISSORS[0], "rest (foley alone)", ""),
             (23.0, "Ebm9", "iv"), (26.0, "Fm7", "v"), (CALENDAR, "Bb (single low note)", "i"), (32.0, "Gbmaj9", "VI = IV of D-flat"),
             (36.0, "Absus4", "V of D-flat"))
    return ChapterScore("theNo", 40.0, notes, expression,
                        zeros=((CRUMPLE[0], CRUMPLE[1], "crumple"), (SCISSORS[0], SCISSORS[1], "scissors")), sync=sync, chart=chart)


BUILDERS = {"line": line, "mayasHouse": mayas_house, "theNo": the_no}
