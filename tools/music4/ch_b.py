"""ch_b.py — chapters 4-6 (the filter machine, the research board, the name and the look), chapter-local seconds."""
from __future__ import annotations

from phr4 import (OST_8, OST_16, STRING_RANGES, LOW_STRINGS, air, bass_hits, every, heartbeat, melody, ostinato, pad, piano_chord,
                  plucks, run, singles, string_chords, tagged)
from score4 import ChapterScore, SyncPoint
from theory import ns

# ---- chapter 4: the filter machine (0-55) -----------------------------------------------------------------
MACHINE = 7.0
TIGHTEN = 23.0
ONE_CARD = 35.0
PLANE = 47.0
MACHINE_A = ((7, "Dbadd9"), (11, "Bbm9"), (15, "Gbmaj9"), (19, "Dbadd9/F"), (23, None))
MACHINE_B = ((23, "Ebm9"), (25, "Absus4"), (27, "Dbadd9"), (29, "Bbm9"), (31, "Gbmaj9"), (33, "Absus4"), (35, None))
AFTER_CARD = ((37, "Gbmaj9/Db"), (40, "Dbadd9"), (43, "Bbm7"), (47, "Gbmaj9"), (50, "Dbadd9/F"), (51, "Absus4"), (55, None))


def filter_machine() -> ChapterScore:
    pops = plucks(((0.0, "Ab4", 0.22), (1.0, "Bb4", 0.22), (2.0, "Db5", 0.24), (3.0, "Eb5", 0.24)))
    ground = pad(0.0, 7.0, ns("Db3 Ab3"), 0.10, 1.5, 1.0) + piano_chord(0.0, "Dbadd9", 0.24, 4.0, 37, ns("Ab3 Eb4"), octave_bass=False)
    ost_a = tagged(ostinato(MACHINE, MACHINE_A, 0.5, OST_8, (0.20, 0.28), 56, 72, seed=401), "machine")
    ost_b = ostinato(TIGHTEN, MACHINE_B, 0.25, OST_16, (0.27, 0.36), 58, 75, seed=402)
    bass = bass_hits((7, 11, 15, 19), MACHINE_A, 0.32, 30, 3.6) + bass_hits((9, 13, 17, 21), MACHINE_A, 0.2, 37, 1.6, octave=False) + \
        bass_hits(every(23, 35, 2.0), MACHINE_B, 0.40, 30, 1.9) + bass_hits(every(24, 35, 2.0), MACHINE_B, 0.26, 37, 0.9, octave=False)
    pulse = heartbeat(every(15, 23), 0.36, tight=False, dub=0.0, tag_first="machine-pulse") + \
        heartbeat(every(23, 35), 0.5, tight=True, dub=0.35)
    card = singles(((ONE_CARD, "Db5", 0.42, 3.0, "one-card"),))
    felt = piano_chord(37.0, "Gbmaj9/Db", 0.26, 2.8, 37, ns("F3 Bb3 Db4"), octave_bass=False, roll=0.12) + \
        piano_chord(40.0, "Dbadd9", 0.26, 2.8, 37, ns("Ab3 Db4 Eb4"), octave_bass=False, roll=0.12) + \
        piano_chord(43.0, "Bbm7", 0.26, 3.6, 37, ns("Db4 F4 Ab4"), octave_bass=False, roll=0.12)
    tune = melody(38.5, "Ab4 F5 Eb5", (0, 1, 2), (1.0, 1.0, 1.4), 0.2)
    plane = tagged(melody(PLANE, "Ab4 Bb4 Db5 Eb5 F5", (0, 0.5, 1.0, 1.5, 2.0), (0.6, 0.6, 0.6, 0.6, 2.4), 0.30), "plane") + \
        piano_chord(PLANE, "Gbmaj9", 0.28, 3.0, 30, ns("Bb3 Db4 F4"), roll=0.1) + pad(PLANE, 50.5, ns("Ab5 Db6 F6"), 0.08, 0.6, 1.6, "shimmer")
    look = piano_chord(50.0, "Dbadd9/F", 0.24, 1.2, 41, ns("Ab3 Db4 Eb4"), octave_bass=False)
    leap = string_chords(((51.0, "Absus4"), (55.0, None)), LOW_STRINGS, 0.36, 2.2, 1.2)
    notes = pops + ground + ost_a + ost_b + bass + pulse + card + felt + tune + plane + look + leap + air(0.0, ONE_CARD, 1.0, 0.0) + \
        air(ONE_CARD, 55.0, 0.2, 1.0)
    expression = {"pulse": ((15, 0.4), (23, 0.7), (35, 0.8)), "strings": ((51, 0.5), (55, 0.6)), "air": ((0, 0.4), (35, 0.6), (55, 0.4))}
    sync = (SyncPoint("4/7.0 the lift ostinato starts", MACHINE, "piano", "onset"),
            SyncPoint("4/23.0 it tightens (sixteenths, the pulse locks)", TIGHTEN, "pulse", "onset"),
            SyncPoint("4/35.0 stops on the one card: a bare note", ONE_CARD, "piano", "onset"),
            SyncPoint("4/47.0 the plane: the hope figure", PLANE, "piano", "onset"))
    chart = tuple((t, s, f) for (t, s), f in zip(MACHINE_A[:-1] + MACHINE_B[:-1], ("I", "vi", "IV", "I", "ii", "V", "I", "vi", "IV", "V"))) + \
        ((ONE_CARD, "Db (single note)", "1"),) + tuple((t, s, f) for (t, s), f in zip(AFTER_CARD[:-1], ("IV/I", "I", "vi", "IV", "I", "V")))
    return ChapterScore("filterMachine", 55.0, notes, expression, zeros=((ONE_CARD, ONE_CARD, "the one card"),), hard_stops=(ONE_CARD,),
                        sync=sync, chart=chart)


# ---- chapter 5: the research board (0-65) -----------------------------------------------------------------
BOARD = ((0, "Dbadd9"), (4, "Bbm9"), (8, "Gbmaj9"), (12, "Dbadd9/F"), (16, "Ebm9"), (20, "Gbmaj9"), (24, "Bbm9"), (28, "Absus4"),
         (33, "Dbadd9"), (37, "Gbmaj9"), (41, "Ebm9"), (45, "Absus4"), (46, "Dbadd9"), (49, "Bbm9"), (52, "Gbmaj9"), (55, "Absus4"),
         (58, None))
GLISS = (32.0, 33.0)
BOXES = (46.0, 47.5, 49.0, 50.5, 52.0, 53.5)
TRUCK = 58.0
TRUCK_TL = ((58, "Dbadd9/F"), (60, "Gbmaj9"), (62, "Absus4"), (64, "Dbadd9"), (65, None))


def research_board() -> ChapterScore:
    bed = string_chords(BOARD, STRING_RANGES, 0.46, 1.4, 1.0)
    cards = singles(((4.0, "Ab4", 0.26, 2.5, "card-1"), (8.0, "F5", 0.24, 2.5), (12.0, "Eb5", 0.24, 2.5), (16.0, "Db5", 0.26, 3.0)))
    gliss = run(GLISS[0], GLISS[1], "Ab4 Bb4 Db5 Eb5 F5 Ab5 Bb5 Db6", (0.45, 0.75), "violins", tag="gliss") + \
        run(GLISS[0], GLISS[1], "Ab3 Bb3 Db4 Eb4 F4 Ab4 Bb4 Db5", (0.4, 0.65), "violas") + \
        run(GLISS[0], GLISS[1], "Ab4 Bb4 Db5 Eb5 F5 Ab5 Bb5 Db6", (0.30, 0.42), "piano", legato=1.0, tag="gliss-piano")
    lands = piano_chord(GLISS[1], "Dbadd9", 0.42, 3.0, 37, ns("Ab3 Db4 Eb4 F4 Ab4"), roll=0.04, tag="board-lands")
    gap = piano_chord(37.0, "Gbmaj9", 0.26, 3.0, 30, ns("Bb3 Db4 F4"), roll=0.12) + piano_chord(41.0, "Ebm9", 0.24, 3.0, 30, ns("Gb3 Bb3 Db4 F4"), roll=0.12)
    boxes = plucks(tuple((t, name, 0.30 + 0.02 * i, "boxes" if i == 0 else "")
                         for i, (t, name) in enumerate(zip(BOXES, ("Ab4", "Bb4", "Db5", "Eb5", "F5", "Ab5")))))
    truck = tagged(ostinato(TRUCK, TRUCK_TL, 0.5, OST_8, (0.22, 0.28), 56, 72, seed=501), "truck")
    truck_bass = bass_hits((58, 60, 62, 64), TRUCK_TL, 0.30, 30, 1.9)
    notes = bed + cards + gliss + lands + gap + boxes + truck + truck_bass + air(0.0, 65.0, 1.0, 1.0)
    expression = {"strings": ((0, 0.55), (4, 0.4), (21, 0.4), (28, 0.55), (31.9, 0.85), (33, 0.75), (38, 0.55), (48, 0.4), (55, 0.45),
                              (58, 0.25)), "air": ((0, 0.5), (65, 0.4))}
    sync = (SyncPoint("5/4.0 card 1 pins (the motif across the four cards)", 4.0, "piano", "onset"),
            SyncPoint("5/32.0 glissando: the string pulls tight (piano doubles the strings' run)", GLISS[0], "piano", "onset"),
            SyncPoint("5/33.0 the string is straight: chord", GLISS[1], "piano", "onset"),
            SyncPoint("5/46.0 plucks: the boxes (first of six)", BOXES[0], "piano", "onset"),
            SyncPoint("5/53.5 plucks: the sixth box", BOXES[-1], "piano", "onset"),
            SyncPoint("5/58.0 the truck rolls on the ostinato", TRUCK, "piano", "onset"))
    funcs = ("I", "vi", "IV", "I", "ii", "IV", "vi", "V", "I", "IV", "ii", "V", "I", "vi", "IV", "V")
    chart = tuple((t, s, f) for (t, s), f in zip(BOARD[:-1], funcs))
    return ChapterScore("researchBoard", 65.0, notes, expression, sync=sync, chart=chart)


# ---- chapter 6: the name and the look (0-55) --------------------------------------------------------------
PROVISUM = 5.0
LOGOTYPE = 11.0
SCREEN = 23.0
SCREEN_TL = ((23, "Dbadd9"), (27, "Bbm9"), (31, "Gbmaj9"), (35, "Dbadd9/F"), (39, "Ebm9"), (43, "Gbmaj9"), (47, "Absus4"), (51, "Ab"),
             (55, None))


def name_and_look() -> ChapterScore:
    names = singles(((0.0, "Ab3", 0.28, 1.6, "names"), (1.5, "F4", 0.24, 1.4), (3.0, "Eb4", 0.24, 1.8)))
    held_chord = piano_chord(PROVISUM, "Absus4", 0.42, 5.8, 32, ns("Eb3 Ab3 Db4 Eb4 Ab4"), roll=0.05, tag="provisum")
    held_strings = string_chords(((PROVISUM, "Absus4"), (LOGOTYPE, "Dbadd9"), (15.0, None)), STRING_RANGES, 0.5, 1.2, 1.4, overlap=0.2)
    resolve = piano_chord(LOGOTYPE, "Dbadd9", 0.46, 4.0, 37, ns("Ab3 Db4 F4 Ab4 Eb5"), roll=0.0, tag="logotype")
    glow = pad(LOGOTYPE, 15.0, ns("Db6 F6 Ab6"), 0.08, 0.6, 2.0, "shimmer")
    calm = melody(12.5, "Ab4 F5 Eb5 Db5", (0, 1, 2, 3), (1.1, 1.1, 1.1, 2.5), 0.24) + \
        piano_chord(15.0, "Gbmaj9", 0.24, 3.6, 30, ns("Bb3 Db4 F4"), roll=0.12) + piano_chord(19.0, "Bbm9", 0.22, 3.6, 30, ns("Db4 F4 Ab4 C5"), roll=0.12)
    screen = ostinato(SCREEN, SCREEN_TL, 0.5, OST_8, (0.17, 0.22), 60, 76, seed=601)
    screen_bass = bass_hits(tuple(t for t, s in SCREEN_TL[:-1]), SCREEN_TL, 0.24, 30, 3.6)
    pulse = heartbeat(every(SCREEN, 55.0), 0.40, tight=False, dub=0.45, tag_first="screen-pulse")
    bed = string_chords(SCREEN_TL, LOW_STRINGS, 0.32, 2.0, 1.2)
    swatches = pad(28.0, 33.0, ns("Ab5 Db6 Eb6"), 0.07, 1.0, 1.5, "shimmer")
    notes = names + held_chord + held_strings + resolve + glow + calm + screen + screen_bass + pulse + bed + swatches + air(0.0, 55.0, 1.0, 1.0)
    expression = {"strings": ((5, 0.5), (10.5, 0.7), (11, 0.65), (15, 0.4), (23, 0.35), (55, 0.4)), "pulse": ((23, 0.5), (55, 0.6)),
                  "air": ((0, 0.4), (55, 0.5))}
    sync = (SyncPoint("6/0.0 felt piano alone for the names", 0.0, "piano", "onset"),
            SyncPoint("6/5.0 held chord: PROVISUM", PROVISUM, "piano", "onset"),
            SyncPoint("6/11.0 resolve: the logotype settles", LOGOTYPE, "piano", "onset"),
            SyncPoint("6/23.0 the soft pulse inside the screen", SCREEN, "pulse", "entry"))
    chart = ((0.0, "Ab-F-Eb (single notes)", "5-3-2"), (PROVISUM, "Absus4 (held)", "V"), (LOGOTYPE, "Dbadd9", "I"), (15.0, "Gbmaj9", "IV"),
             (19.0, "Bbm9", "vi")) + tuple((t, s, f) for (t, s), f in zip(SCREEN_TL[:-1], ("I", "vi", "IV", "I", "ii", "IV", "V", "V")))
    return ChapterScore("nameAndLook", 55.0, notes, expression, sync=sync, chart=chart)


BUILDERS = {"filterMachine": filter_machine, "researchBoard": research_board, "nameAndLook": name_and_look}
