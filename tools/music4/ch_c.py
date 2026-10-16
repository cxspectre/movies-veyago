"""ch_c.py — chapters 7-9 (the engine room, the launch, the village), chapter-local seconds."""
from __future__ import annotations

from phr4 import (OST_8, STRING_RANGES, LOW_STRINGS, air, bass_hits, clear_for, every, heartbeat, held, melody, ostinato, pad,
                  piano_chord, plucks, run, singles, string_chords, tagged, wood)
from score4 import ChapterScore, SyncPoint
from theory import ns

# ---- chapter 7: the engine room (0-75), over an A-flat pedal ----------------------------------------------
TRAIN = 30.0
ERASED = (46.5, 48.5)
PADLOCK = 59.0
TESTS = 64.0
SUCCEEDED = 69.0
TOP_FLOOR = ((0, "Dbadd9/Ab"), (4, "Gbmaj9/Ab"), (8, "Dbadd9/Ab"), (12, "Bbm9/Ab"), (16, None))
TRACKS = ((30, "Dbadd9/Ab"), (34, "Ebm9/Ab"), (38, "Gbmaj9/Ab"), (42, "Absus4"), (46, None))


def engine_room() -> ChapterScore:
    pedal = held(0.0, 46.2, (("basses", "Ab1", 0.42), ("celli", "Ab2", 0.38)), 1.5, 0.3) + \
        held(ERASED[1], SUCCEEDED, (("basses", "Ab1", 0.42), ("celli", "Ab2", 0.36)), 0.8, 0.4) + \
        pad(0.0, 46.0, ns("Ab2 Eb3"), 0.09, 2.0, 0.4) + pad(ERASED[1], SUCCEEDED, ns("Ab2 Eb3"), 0.09, 1.0, 0.6)
    top = tagged(ostinato(0.0, TOP_FLOOR, 0.5, OST_8, (0.17, 0.21), 65, 81, seed=701), "top-floor")
    binder = piano_chord(18.0, "Gbmaj9/Ab", 0.3, 3.0, 32, ns("Bb3 Db4 F4"), octave_bass=False, roll=0.1)
    model = plucks(((19.0, "Db5", 0.26), (19.5, "Eb5", 0.24), (20.0, "F5", 0.26), (20.5, "Ab5", 0.24), (21.0, "F5", 0.24),
                    (21.5, "Eb5", 0.22)))
    people = melody(24.0, "Ab4 F5 Eb5 Db5", (0, 1, 2, 3), (1.0, 1.0, 1.0, 2.5), 0.2)
    train = wood(every(TRAIN, 46.0, 0.5), 0.34, tag="train")
    rails = ostinato(TRAIN, TRACKS, 0.5, OST_8, (0.2, 0.25), 56, 72, seed=702)
    rails_bass = bass_hits((30, 34, 38, 42), TRACKS, 0.26, 36, 3.5, octave=False)
    vault = piano_chord(49.0, "Bbm9/Ab", 0.22, 3.6, 32, ns("Db4 F4 C5"), octave_bass=False, roll=0.12) + \
        piano_chord(53.0, "Gbmaj9/Ab", 0.22, 3.6, 32, ns("Bb3 Db4 F4"), octave_bass=False, roll=0.12)
    padlock = piano_chord(PADLOCK, "Gb/Ab", 0.46, 3.5, 32, ns("Gb2 Bb2 Db3"), octave_bass=True, roll=0.0, tag="padlock")
    rising = tagged(run(TESTS, SUCCEEDED, "Ab3 Bb3 Db4 Eb4 F4 Ab4 Bb4 Db5 Eb5 F5", (0.24, 0.46), "piano", legato=1.2), "tests")
    test_strings = string_chords(((TESTS, "Absus4"), (SUCCEEDED, "Dbadd9"), (75.0, None)), STRING_RANGES, 0.55, 1.0, 1.4)
    test_pulse = heartbeat(every(TESTS, SUCCEEDED), 0.5, tight=True, dub=0.0) + heartbeat((SUCCEEDED,), 0.75, tight=True, dub=0.0)
    built = piano_chord(SUCCEEDED, "Dbadd9", 0.56, 4.5, 37, ns("Ab3 Db4 Eb4 F4 Ab4 Db5"), roll=0.0, tag="build-succeeded") + \
        pad(SUCCEEDED, 73.0, ns("Ab5 Db6 F6"), 0.1, 0.4, 2.0, "shimmer")
    notes = pedal + top + binder + model + people + train + rails + rails_bass + vault + padlock + rising + test_strings + test_pulse + \
        built + air(0.0, 46.0, 1.0, 0.0) + air(ERASED[1], 75.0, 1.0, 1.0)
    expression = {"strings": ((0, 0.5), (46, 0.5), (49, 0.45), (64, 0.45), (68.9, 0.9), (70, 0.75), (75, 0.4)),
                  "pulse": ((0, 0.8), (64, 0.5), (69, 0.9)), "air": ((0, 0.5), (75, 0.5))}
    sync = (SyncPoint("7/0.0 the A-flat pedal; the ostinato in the top floor", 0.0, "piano", "onset"),
            SyncPoint("7/30.0 woodblock with the train", TRAIN, "pulse", "entry"),
            SyncPoint("7/46.5-48.5 rest: the erased server", ERASED[0], "mix", f"zero:{ERASED[1]}"),
            SyncPoint("7/59.0 low chord: the padlock", PADLOCK, "piano", "onset"),
            SyncPoint("7/64.0 rising figure under the tests", TESTS, "piano", "onset"),
            SyncPoint("7/69.0 lands on Build succeeded (V pedal resolves to I)", SUCCEEDED, "piano", "onset"))
    chart = tuple((t, s, f) for (t, s), f in zip(TOP_FLOOR[:-1], ("I/5", "IV/5", "I/5", "vi/5"))) + ((18.0, "Gbmaj9/Ab", "IV/5"),) + \
        tuple((t, s, f) for (t, s), f in zip(TRACKS[:-1], ("I/5", "ii/5", "IV/5", "V"))) + ((ERASED[0], "rest (foley alone)", ""),) + \
        ((49.0, "Bbm9/Ab", "vi/5"), (53.0, "Gbmaj9/Ab", "IV/5"), (PADLOCK, "Gb/Ab (low)", "V11"), (TESTS, "Absus4", "V"),
         (SUCCEEDED, "Dbadd9", "I"))
    return ChapterScore("engineRoom", 75.0, notes, expression, zeros=((ERASED[0], ERASED[1], "the erased server"),), sync=sync, chart=chart)


# ---- chapter 8: the launch (0-50) -------------------------------------------------------------------------
STATUSES = (3.0, 5.0, 7.0)
LAUNCH = 10.0
STICKY_REST = (22.0, 23.0)
HOUSE = 35.0
LIFTOFF = ((8, "Absus4"), (10, "Dbadd9"), (12, "Gbmaj9"), (14, "Absus4"), (15, "Dbadd9/F"), (19, "Gbmaj9"), (21.6, None))
HOME = ((HOUSE, "Dbadd9"), (40, "Gbmaj9/Db"), (44, "Dbadd9"), (48, "Absus4"), (50, None))


def launch() -> ChapterScore:
    folds = pad(0.0, 3.0, ns("Db3 Ab3"), 0.08, 1.0, 1.0)
    count_in = plucks(((STATUSES[0], "Ab4", 0.32, "status-1"), (STATUSES[1], "Bb4", 0.32, "status-2"), (STATUSES[2], "Db5", 0.34, "status-3")))
    swell = string_chords(LIFTOFF, STRING_RANGES, 0.62, 0.8, 0.5)
    lift = piano_chord(LAUNCH, "Dbadd9", 0.5, 2.0, 37, ns("Ab3 Db4 Eb4 F4 Ab4"), tag="launch") + \
        piano_chord(12.0, "Gbmaj9", 0.48, 2.0, 30, ns("Bb3 Db4 F4 Ab4"), octave_bass=True) + \
        piano_chord(14.0, "Absus4", 0.44, 1.0, 32, ns("Db4 Eb4 Ab4"), octave_bass=True)
    rocket = heartbeat(every(LAUNCH, 15.0), 0.55, tight=True, dub=0.0)
    usa = piano_chord(15.0, "Dbadd9/F", 0.36, 3.6, 41, ns("Ab3 Db4 Eb4 F4"), octave_bass=False, roll=0.1, tag="us-fill") + \
        piano_chord(19.0, "Gbmaj9", 0.24, 2.4, 30, ns("Bb3 Db4 F4"), roll=0.12)
    stumble = singles(((24.0, "Eb5", 0.2, 1.5), (26.0, "Db5", 0.2, 0.9))) + \
        piano_chord(28.0, "Ebm9", 0.22, 3.6, 30, ns("Gb3 Bb3 Db4 F4"), roll=0.12) + \
        piano_chord(32.0, "Absus4", 0.22, 2.6, 32, ns("Db4 Eb4"), octave_bass=False, roll=0.1)
    house = piano_chord(HOUSE, "Dbadd9", 0.32, 3.6, 37, ns("Ab2 Eb3"), octave_bass=False, roll=0.16, tag="house") + \
        melody(36.0, "Ab3 F4 Eb4 Db4", (0, 1, 3, 4), (1.3, 2.2, 1.3, 3.0), 0.28) + \
        piano_chord(40.0, "Gbmaj9/Db", 0.28, 3.6, 37, ns("Bb2 F3 Ab3"), octave_bass=False, roll=0.12) + \
        piano_chord(44.0, "Dbadd9", 0.28, 3.6, 37, ns("Ab3 Db4 F4"), octave_bass=False, roll=0.12) + \
        piano_chord(48.0, "Absus4", 0.24, 2.0, 32, ns("Db4 Eb4"), octave_bass=False, roll=0.1)
    notes = folds + count_in + swell + lift + rocket + usa + stumble + house + air(0.0, 21.6, 1.0, 0.0) + air(STICKY_REST[1], 50.0, 1.0, 1.0)
    expression = {"strings": ((8, 0.2), (10, 0.55), (12.5, 1.0), (14, 0.85), (15, 0.5), (21.6, 0.2)), "pulse": ((10, 0.8), (15, 0.6)),
                  "air": ((0, 0.4), (50, 0.4))}
    sync = tuple(SyncPoint(f"8/{t:.1f} plucked note: status {i + 1}", t, "piano", "onset") for i, t in enumerate(STATUSES)) + (
        SyncPoint("8/10.0 swell: launch", LAUNCH, "piano", "onset"),
        SyncPoint("8/10-15 the swell crests (strings)", 12.5, "strings", "crest"),
        SyncPoint("8/22.0-23.0 dry rest: the sticky notes", STICKY_REST[0], "mix", f"zero:{STICKY_REST[1]}"),
        SyncPoint("8/35.0 felt piano: the house", HOUSE, "piano", "onset"))
    chart = ((STATUSES[0], "Ab-Bb-Db (plucks)", "5-6-1"),) + tuple((t, s, f) for (t, s), f in zip(LIFTOFF[:-1], ("V", "I", "IV", "V", "I", "IV"))) + \
        ((STICKY_REST[0], "rest (dry)", ""), (28.0, "Ebm9", "ii"), (32.0, "Absus4", "V")) + \
        tuple((t, s, f) for (t, s), f in zip(HOME[:-1], ("I", "IV/I", "I", "V")))
    return ChapterScore("launch", 50.0, notes, expression, zeros=((STICKY_REST[0], STICKY_REST[1], "the sticky notes"),), sync=sync, chart=chart)


# ---- chapter 9: the village (0-75) ------------------------------------------------------------------------
HOUSES = ((0, "Dbadd9"), (4, "Gbmaj9"), (8, "Bbm9"), (12, "Dbadd9/F"), (13, None))
VISITS = ((13, "Dbadd9"), (17, "Gbmaj9"), (21, "Bbm9"), (25, "Ebm9"), (29, "Dbadd9/F"), (33, "Gbmaj9"), (37, "Bbm9"), (41, "Ebm9"),
          (45, "Absus4"), (50, None))
WALLS = (14.0, 18.0, 22.0, 26.0, 30.0, 34.0, 38.0, 42.0, 47.0)
WALL_NOTES = ("Ab5", "F5", "Eb5", "Db5", "Ab4", "Bb4", "Db5", "Eb5", "F5")  # the answer, then the hope
RISE = 50.0
GREEN = 63.0
RISE_TL = ((RISE, "Gbmaj9"), (54, "Dbadd9/F"), (58, "Ebm9"), (61, "Absus4"), (GREEN, "Gbmaj9"), (67, "Dbadd9/F"), (71, "Absus4"), (75, None))


def village() -> ChapterScore:
    pops = tuple(x for (t, s), rh in zip(HOUSES[:-1], ("Ab3 Db4 Eb4 F4", "Bb3 Db4 F4 Ab4", "Db4 F4 Ab4 C5", "Ab3 Db4 Eb4"))
                 for x in piano_chord(t, s, 0.30, 3.6, 30 if s != "Dbadd9/F" else 41, ns(rh), roll=0.12 if t else 0.0))
    pops = tagged(tuple(sorted(pops, key=lambda x: (x.t, x.key))), "houses")
    bed = string_chords(HOUSES[:-1] + VISITS, LOW_STRINGS, 0.36, 1.6, 1.0)
    ost = clear_for(ostinato(13.0, VISITS, 0.5, OST_8, (0.17, 0.23), 56, 72, seed=901), WALLS, gap_before=0.0)
    bass = bass_hits(tuple(float(t) for t, s in VISITS[:-1]), VISITS, 0.26, 30, 3.6)
    walls = plucks(tuple((t, name, 0.34, "front-wall" if i == 0 else "") for i, (t, name) in enumerate(zip(WALLS, WALL_NOTES))))
    rise = string_chords(RISE_TL, STRING_RANGES, 0.62, 1.2, 1.0)
    rise_piano = piano_chord(RISE, "Gbmaj9", 0.46, 3.6, 30, ns("Db3 Bb3 F4 Ab4 Db5"), roll=0.03, tag="rise") + \
        piano_chord(54.0, "Dbadd9/F", 0.36, 3.6, 41, ns("Ab3 Db4 Eb4 F4"), octave_bass=True, roll=0.08) + \
        piano_chord(58.0, "Ebm9", 0.30, 2.8, 30, ns("Gb3 Bb3 Db4 F4"), roll=0.1)
    green = ostinato(GREEN, RISE_TL[4:], 0.5, OST_8, (0.2, 0.3), 56, 74, seed=902)
    green_bass = bass_hits((63.0, 67.0, 71.0), RISE_TL, 0.32, 30, 3.6)
    pulse = heartbeat(every(GREEN, 75.0), 0.42, tight=False, dub=0.0, tag_first="pulse-starts")
    notes = pops + bed + ost + bass + walls + rise + rise_piano + green + green_bass + pulse + air(0.0, 75.0, 1.0, 1.0)
    expression = {"strings": ((0, 0.4), (13, 0.35), (49, 0.4), (51, 0.6), (55.5, 0.9), (61, 0.6), (63, 0.5), (75, 0.8)),
                  "pulse": ((63, 0.45), (75, 0.75)), "air": ((0, 0.4), (75, 0.6))}
    sync = (SyncPoint("9/0.0 home key: the houses pop", 0.0, "piano", "onset"),
            SyncPoint("9/14.0 plucked note: the first front wall", WALLS[0], "piano", "onset"),
            SyncPoint("9/47.0 plucked note: Sam's front wall (ninth)", WALLS[-1], "piano", "onset"),
            SyncPoint("9/50.0 swell: the rise", RISE, "piano", "onset"),
            SyncPoint("9/50-61 the rise crests (strings)", 55.5, "strings", "crest"),
            SyncPoint("9/63.0 the pulse starts under the green", GREEN, "pulse", "entry"))
    chart = tuple((t, s, f) for (t, s), f in zip(HOUSES[:-1], ("I", "IV", "vi", "I"))) + \
        tuple((t, s, f) for (t, s), f in zip(VISITS[1:-1], ("IV", "vi", "ii", "I", "IV", "vi", "ii", "V"))) + \
        tuple((t, s, f) for (t, s), f in zip(RISE_TL[:-1], ("IV", "I", "ii", "V", "IV", "I", "V")))
    return ChapterScore("village", 75.0, notes, expression, sync=sync, chart=chart)


BUILDERS = {"engineRoom": engine_room, "launch": launch, "village": village}
