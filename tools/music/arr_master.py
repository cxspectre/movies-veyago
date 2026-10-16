"""arr_master.py — the 2:40 score, built section by section to MUSIC MAP v1 (CONTRACT.md section 7).

Key D-flat major, 60 BPM, 4/4 (bar lines every 4 s, every integer second a beat). Times are master
seconds. Each section returns notes; `build()` assembles them with the silence windows, the sync points
and the chord chart. The chord chart is printed into audio/music/README.md by the render.
"""
from __future__ import annotations

from phrases import (bass_hits, clear_for, heartbeat, melody, ostinato, pad, piano_chord, string_chords)
from score import Arrangement, Note, SyncPoint
from theory import ns

DURATION = 160.0
DROP = 72.0  # the music drops away: a clean cut (no silence), the held note starts on it
HARD_STOP = 113.0
TITLE_SWELL = 115.0
RESOLVE = 118.0
END_BY = 157.0
CUTS_2_04 = (124.0, 126.0, 127.5, 129.5, 131.0, 133.0, 134.5, 136.5, 138.0)  # the 9 feature cuts
SNAPS = (101.0, 103.0, 105.0, 107.0)
STRING_RANGES = {"basses": (28, 39), "celli": (36, 50), "violas": (53, 67), "violins": (62, 81)}
LOW_STRINGS = {k: STRING_RANGES[k] for k in ("basses", "celli", "violas")}
OST_PATTERN_8 = (0, 3, 1, 3, 2, 3, 1, 3)  # low-high rocking figure, top note as a held pedal
OST_PATTERN_16 = (0, 2, 3, 2, 1, 2, 3, 2)


def cold_open() -> tuple:
    """0:06-0:35 — sparse single notes under VO 1, a breath of near-silence, the first real chord."""
    single = (
        (6.0, "Ab3", 0.30, 3.0, "piano-enters"), (7.0, "F4", 0.26, 3.0, ""), (9.0, "Eb4", 0.24, 2.5, ""),
        (10.0, "Db4", 0.26, 4.0, ""), (10.0, "Db2", 0.20, 4.5, ""), (12.0, "Bb2", 0.19, 4.0, ""),
        (13.0, "Db4", 0.22, 2.0, ""), (14.0, "F4", 0.24, 2.5, ""), (15.5, "Eb4", 0.20, 2.5, ""),
        (16.0, "Gb2", 0.19, 4.0, ""), (17.0, "Bb3", 0.20, 2.0, ""), (18.0, "Db4", 0.21, 3.0, ""),
        (20.0, "Ab4", 0.15, 4.0, "thin"), (24.0, "Eb4", 0.12, 4.0, ""),
    )
    notes = tuple(Note(t, d, ns(k)[0], v, "piano", tag=tag) for t, k, v, d, tag in single)
    first = piano_chord(28.0, "Gbmaj9", 0.64, 4.4, 30, ns("Db3 Bb3 F4 Ab4 Db5"), roll=0.03, tag="first-chord")
    answer = piano_chord(32.0, "Dbadd9/F", 0.40, 3.6, 41, ns("Ab3 Db4 Eb4 F4"), octave_bass=False, roll=0.14)
    pickup = (Note(35.0, 1.2, ns("Ab3")[0], 0.28, "piano"),)
    bloom = pad(28.0, 34.0, ns("Gb3 Db4 F4 Bb4"), 0.10, 1.4, 2.0)
    return notes + first + answer + pickup + bloom


# Harmony changes with the pages (src/beats.ts PAGE_PLAN: pages at 0:38, 0:44, 0:49, 0:53 = 6,5,4,3 s; then
# 2 s pages from 0:56; 3 s pages from 1:06; the form page at 1:12), so the harmonic rhythm speeds up with them.
PAGE_STARTS_A = (38.0, 44.0, 49.0, 53.0)
PAGE_STARTS_B = (56.0, 58.0, 60.0, 62.0, 64.0)
PAGE_STARTS_C = (66.0, 69.0)
ACT2_A = ((36, "Dbadd9"), (44, "Ab/C"), (49, "Bbm7"), (53, "Gbmaj9"), (56, None))
ACT2_B = ((56, "Bbm9"), (58, "Gbmaj9"), (60, "Dbadd9/F"), (62, "Ebm9"), (64, "Absus4"), (66, None))
ACT2_C = ((66, "Dbadd9"), (69, "Gbmaj9"), (72, None))


def act_two() -> tuple:
    """0:36-1:12 — the ostinato builds; 'tempo up' at 0:56 (eighths -> sixteenths) and again at 1:06."""
    a1 = ostinato(36, ACT2_A, 0.5, OST_PATTERN_8, (0.21, 0.31), 56, 72, seed=11)
    a_bass = bass_hits((36.0,) + PAGE_STARTS_A, ACT2_A, 0.34, 30, 3.6) + \
        bass_hits((40.0, 42.0, 46.0, 47.0, 51.0, 55.0), ACT2_A, 0.22, 37, 1.6, octave=False)
    a_melody = melody(44, "Ab4 F5 Eb5 Db5 Bb4 Ab4", (0, 2, 3.5, 5, 7, 9), (2.2, 1.7, 1.7, 2.2, 2.2, 3.2), 0.36)
    lift1 = Note(56.0, 1.9, ns("Bb1")[0], 0.52, "piano", tag="lift-1")
    b = ostinato(56, ACT2_B, 0.25, OST_PATTERN_16, (0.30, 0.35), 58, 75, seed=13)
    b_bass = bass_hits(PAGE_STARTS_B[1:], ACT2_B, 0.36, 30, 1.8) + bass_hits(tuple(t + 1.5 for t in PAGE_STARTS_B), ACT2_B, 0.24, 37, 0.5, octave=False)
    lift2 = Note(66.0, 2.9, ns("Db2")[0], 0.58, "piano", tag="lift-2")
    c = ostinato(66, ACT2_C, 0.25, OST_PATTERN_16, (0.37, 0.40), 63, 79, seed=14)
    c_left = ostinato(66, ACT2_C, 0.5, (0, 2, 1, 3), 0.31, 41, 56, seed=15)
    c_bass = bass_hits((69.0,), ACT2_C, 0.42, 30, 2.9)
    c_melody = melody(66, "Ab4 F5 Eb5 Db5", (0, 1, 2, 3), (1.1, 1.1, 1.1, 3.0), 0.44)
    c_octaves = tuple(Note(x.t, x.dur, x.key + 12, x.vel * 0.6, "piano") for x in c_melody)
    return a1 + a_bass + a_melody + (lift1,) + b + b_bass + (lift2,) + c + c_left + c_bass + c_melody + c_octaves


def the_drop() -> tuple:
    """1:12-1:20 — the music drops away to a held note under VO 6, then the question again."""
    held = Note(72.0, 6.5, ns("Ab3")[0], 0.30, "piano", tag="drop")
    return (held, Note(76.0, 3.0, ns("F4")[0], 0.20, "piano"), Note(79.0, 1.4, ns("Eb4")[0], 0.20, "piano")) + \
        pad(72.0, 80.0, ns("Ab2 Eb3"), 0.09, 1.0, 1.5)


WALL = ((80, "Dbadd9"), (84, "Bbm9"), (88, "Gbmaj9"), (91, "Dbadd9/F"), (94, "Gbmaj9"), (96, "Ab/C"),
        (98, "Bbm9"), (100, "Gbmaj9"), (102, "Db/F"), (104, "Ebm9"), (106, "Fm7"), (108, "Gbmaj9"),
        (110, "Absus4"), (HARD_STOP, None))


def wall_and_transition() -> tuple:
    """1:20-1:53 — pulse, strings at 1:25, swell at 1:31, the lock at 1:38, snaps, two hits, settle."""
    p_eighths = ostinato(80, WALL[:2] + ((84, None),), 0.5, OST_PATTERN_8, 0.29, 56, 72, seed=21)
    p_sixteenths = clear_for(ostinato(84, WALL[1:3] + ((91, None),), 0.25, OST_PATTERN_16, (0.28, 0.36), 56, 72, seed=22), (91.0,))
    p_bass = bass_hits((80, 84, 88), WALL, 0.36, 30, 3.8) + bass_hits((82, 86, 89.5), WALL, 0.24, 37, 1.8, octave=False)
    swell_chord = piano_chord(91.0, "Dbadd9/F", 0.6, 3.0, 29, ns("Ab3 Db4 Eb4 Ab4"), octave_bass=True, roll=0.0, tag="swell")
    light = ostinato(91.5, ((91.5, "Dbadd9/F"), (94, "Gbmaj9"), (96, "Ab/C"), (98, None)), 0.5, (0, 2, 1, 3), 0.24, 65, 84, seed=23)
    light_bass = bass_hits((94, 96), WALL, 0.32, 30, 1.9)
    lock_ost = clear_for(ostinato(98, WALL[6:11], 0.25, OST_PATTERN_16, 0.29, 58, 75, seed=24), SNAPS)
    lock_bass = bass_hits((98, 100, 102, 104, 106), WALL, 0.42, 30, 1.9, tag="")
    snap_tops = ("Ab4", "Bb4", "Db5", "Eb5")
    snap_chords = {101.0: ("Gbmaj9", "Db4 F4 Ab4"), 103.0: ("Db/F", "F4 Ab4 Bb4"), 105.0: ("Ebm9", "Gb4 Bb4 Db5"),
                   107.0: ("Fm7", "Ab4 C5 Eb5")}
    snaps = tuple(Note(t, 0.9, k, 0.64 if i == 2 else 0.56, "piano", tag="snap" if i == 2 else "")
                  for t, (_, keys) in snap_chords.items() for i, k in enumerate(ns(keys)))
    assert tuple(n_.key for n_ in snaps[2::3]) == ns(" ".join(snap_tops))
    hit1 = piano_chord(108.0, "Gbmaj9", 0.78, 2.0, 30, ns("Db3 Bb3 F4 Ab4 Db5 F5"), roll=0.0, tag="hit-1")
    hit2 = piano_chord(110.0, "Absus4", 0.70, 3.0, 32, ns("Eb3 Ab3 Db4 Eb4 Ab4 Db5 Ab5"), roll=0.0, tag="hit-2")
    return (p_eighths + p_sixteenths + p_bass + swell_chord + light + light_bass + lock_ost + lock_bass + snaps
            + hit1 + hit2)


def transition_strings_pulse_texture() -> tuple:
    low = string_chords(((85, "Bbm9"), (88, "Gbmaj9"), (91, None)), LOW_STRINGS, 0.55, 2.6, 0.8)
    low = (Note(85.0, low[0].dur, low[0].key, low[0].vel, low[0].part, low[0].attack, low[0].release, "strings-enter"),) + low[1:]
    full = string_chords(WALL[3:], STRING_RANGES, 0.62, 0.3, 0.6)
    pre = heartbeat((80, 82, 84, 86, 88, 90), 0.42, tight=False, dub=0.0, tag_first="pulse-starts")
    ghosts = heartbeat((91, 93, 95, 97), 0.30, tight=False, dub=0.0) + heartbeat((92, 94, 96), 0.5, tight=False, dub=0.0)
    locked = heartbeat(tuple(float(t) for t in range(98, 108)), 0.72, tight=True, tag_first="pulse-locks")
    hits = heartbeat((108.0, 110.0), 0.95, tight=True, dub=0.6)
    settle = heartbeat((109.0, 111.0, 112.0), 0.5, tight=True, dub=0.35)
    shimmer = pad(91.0, 95.0, ns("Ab5 Db6 F6"), 0.12, 0.8, 2.5, "shimmer")
    glow = pad(91.0, 98.0, ns("Db4 Eb4 F4 Ab4"), 0.10, 0.9, 1.5)
    return low + full + pre + ghosts + locked + hits + settle + shimmer + glow


TITLE = ((RESOLVE, "Dbadd9"), (122.0, "Gbmaj9/Db"), (124.0, None))


def title() -> tuple:
    """1:55 low swell, 1:58 the resolve (the '2' completes), hold under the subline."""
    swell = (Note(TITLE_SWELL, 3.2, ns("Ab1")[0], 0.55, "basses", 2.8, 0.6, "title-swell"),
             Note(TITLE_SWELL, 3.2, ns("Ab2")[0], 0.50, "celli", 2.8, 0.6),
             Note(TITLE_SWELL, 3.2, ns("Eb3")[0], 0.40, "violas", 2.9, 0.6)) + \
        pad(TITLE_SWELL, RESOLVE + 0.2, ns("Ab1 Ab2 Eb3"), 0.22, 2.7, 0.8)
    resolve = piano_chord(RESOLVE, "Db", 0.72, 6.0, 37, ns("Ab2 F3 Ab3 Db4 F4 Ab4 Db5"), roll=0.0, tag="resolve")
    strings = string_chords(TITLE, {"basses": (28, 39), "celli": (36, 50), "violas": (53, 67), "violins": (62, 77)}, 0.58, 0.25, 1.0)
    thump = heartbeat((RESOLVE,), 0.75, tight=True, dub=0.0)
    after = melody(120.0, "Ab4 F5 Eb5 Db5", (0, 1, 2, 3), (1.2, 1.2, 1.2, 2.0), 0.24)
    shimmer = pad(RESOLVE, 123.5, ns("Db6 F6 Ab6"), 0.09, 1.2, 2.0, "shimmer")
    glow = pad(RESOLVE, 124.0, ns("Db3 Ab3 F4"), 0.12, 0.6, 1.2)
    return swell + resolve + strings + thump + after + shimmer + glow


REAL = ((124, "Dbadd9"), (128, "Bbm9"), (132, "Gbmaj9"), (136, "Ebm9"), (138, "Absus4"), (140, "Gbmaj9"),
        (142, "Db/F"), (144, None))


def real_thing() -> tuple:
    """2:04-2:25 — sixteenth ostinato, the bass follows the nine cuts (a 4+3 eighth pattern), peak at 2:20."""
    rh = clear_for(ostinato(124, REAL[:6] + ((140, None),), 0.25, OST_PATTERN_16, 0.27, 61, 77, seed=31), CUTS_2_04, gap_before=0.0)
    rh_tail = ostinato(140, REAL[5:], 0.5, OST_PATTERN_8, 0.26, 61, 77, seed=32)
    cuts = bass_hits(CUTS_2_04, REAL, 0.56, 30, 1.4, tag="cut")
    peak = piano_chord(140.0, "Gbmaj9", 0.82, 3.5, 30, ns("Db3 Bb3 F4 Ab4 Db5 F5"), roll=0.0, tag="peak")
    strings = string_chords(REAL, LOW_STRINGS, 0.52, 0.6, 0.9, overlap=0.3)
    violins = tuple(Note(t, d, k, v, "violins", 0.45, 0.8) for t, d, k, v in (
        (124.0, 4.3, ns("Ab4")[0], 0.5), (128.0, 3.1, ns("F5")[0], 0.52), (131.0, 1.2, ns("Eb5")[0], 0.5),
        (132.0, 4.2, ns("Db5")[0], 0.55), (136.0, 4.2, ns("Eb5")[0], 0.6), (140.0, 2.1, ns("F5")[0], 0.72),
        (142.0, 2.0, ns("Eb5")[0], 0.5)))
    pulse = heartbeat(tuple(float(t) for t in range(124, 140)), 0.55, tight=True, dub=0.45) + \
        heartbeat((140.0,), 0.9, tight=True, dub=0.5) + heartbeat((141.0, 142.0, 143.0), 0.38, tight=True, dub=0.3)
    sweep = pad(141.0, 142.2, ns("F6 Ab6 Db7"), 0.16, 0.35, 2.2, "shimmer")
    sweep = tuple(Note(x.t, x.dur, x.key, x.vel, "shimmer", 0.06, 2.2, "sweep" if i == 0 else "") for i, x in enumerate(sweep))
    return rh + rh_tail + cuts + peak + strings + violins + pulse + sweep


def coda() -> tuple:
    """2:25-2:37 — felt piano alone under VO 8, the motif closes, the final chord decays."""
    alone = piano_chord(145.0, "Dbadd9", 0.36, 4.0, 37, ns("Ab2 Eb3"), octave_bass=False, roll=0.16, tag="piano-alone")
    tune = melody(146.0, "Ab3 F4 Eb4 Db4", (0, 1, 3, 4), (1.3, 2.2, 1.3, 3.0), 0.30)
    plagal = piano_chord(149.0, "Gbmaj9/Db", 0.30, 4.0, 37, ns("Bb2 F3 Ab3"), octave_bass=False, roll=0.12)
    final = piano_chord(153.0, "Dbadd9", 0.42, 3.6, 37, ns("Ab2 F3 Eb4 Ab4 Db5"), octave_bass=False, roll=0.0, tag="final-chord")
    return alone + tune + plagal + final + pad(153.0, 155.5, ns("Db3 Ab3 F4"), 0.07, 0.8, 1.2)


def air() -> tuple:
    """Room air, one note per segment (a clean cut or hard stop ends everything before it, air included)."""
    return (Note(6.0, DROP - 6.0, 0, 0.5, "air", 2.0, 0.0), Note(DROP, HARD_STOP - DROP, 0, 0.5, "air", 0.05, 0.0),
            Note(TITLE_SWELL, END_BY - TITLE_SWELL - 0.4, 0, 0.5, "air", 3.0, 1.4))


def sync_points() -> tuple:
    rows = [
        SyncPoint("0:00-0:06 silence", 0.0, "mix", "silence:6.0"), SyncPoint("0:06 felt piano enters", 6.0, "piano", "entry"),
        SyncPoint("0:20-0:28 piano thins to almost nothing", 20.0, "piano", "quiet:28.0"),
        SyncPoint("0:28.0 first real chord", 28.0, "piano", "onset"),
        SyncPoint("0:56 tempo-up lift", 56.0, "piano", "onset"), SyncPoint("1:06 second lift", 66.0, "piano", "onset"),
        SyncPoint("1:12.0 music drops away (level drop)", 72.0, "piano", "drop"),
        SyncPoint("1:20 soft pulse starts", 80.0, "pulse", "entry"), SyncPoint("1:25.0 strings come in", 85.0, "strings", "entry"),
        SyncPoint("1:31.0 swell as the lines catch light", 91.0, "mix", "onset"),
        SyncPoint("1:31 strings crescendo crest (envelope, +-0.5 s)", 91.0, "strings", "crest"),
        SyncPoint("1:38.0 pulse locks to the beat", 98.0, "pulse", "onset"),
    ]
    rows += [SyncPoint(f"1:{int(t) - 60:02d}.0 UI snap", t, "piano", "onset") for t in SNAPS]
    rows += [SyncPoint("1:48.0 hit (card lands on Watch)", 108.0, "mix", "onset"),
             SyncPoint("1:50.0 second hit (Wallet pass)", 110.0, "mix", "onset"),
             SyncPoint("1:53.0 hard stop", HARD_STOP, "mix", "lastsound"),
             SyncPoint("1:53-1:55 silence", HARD_STOP, "mix", "silence:115.0"),
             SyncPoint("1:55.0 soft low swell", TITLE_SWELL, "mix", "entry"),
             SyncPoint("1:58.0 music resolves", RESOLVE, "piano", "onset"),
             SyncPoint("2:04 lift (cut 1)", 124.0, "piano", "onset")]
    rows += [SyncPoint(f"2:{int(t) - 120:02d}.{int(round((t % 1) * 10))} feature cut", t, "piano", "onset") for t in CUTS_2_04[1:]]
    rows += [SyncPoint("2:20.0 peak", 140.0, "mix", "onset"), SyncPoint("2:21.0 light sweep", 141.0, "texture", "onset"),
             SyncPoint("2:25 felt piano alone (strings out)", 145.0, "strings", "silentafter"),
             SyncPoint("2:25 felt piano alone (pulse out)", 145.0, "pulse", "silentafter"),
             SyncPoint("2:25 felt piano re-enters alone", 145.0, "piano", "onset"),
             SyncPoint("2:33 final chord", 153.0, "piano", "onset"),
             SyncPoint("2:37 ends cleanly by", END_BY, "mix", "lastsound"),
             SyncPoint("2:37-2:40 silence (pencil click is foley)", END_BY, "mix", "silence:160.0")]
    return tuple(rows)


def chart() -> tuple:
    sections = [("0:28 first chord", ((28, "Gbmaj9"), (32, "Dbadd9/F"))), ("0:36 act two", ACT2_A[:-1]),
                ("0:56 lift", ACT2_B[:-1]), ("1:06 lift", ACT2_C[:-1]), ("1:12 drop", ((72, "Ab (single note)"),)),
                ("1:20 wall / 1:31 light / 1:38 lock", WALL[:-1]), ("1:53 stop / 1:55 swell", ((113, "silence"), (115, "Ab pedal"))),
                ("1:58 title", TITLE[:-1]), ("2:04 real thing", REAL[:-1]),
                ("2:25 coda", ((145, "Dbadd9"), (149, "Gbmaj9/Db"), (153, "Dbadd9 (final)")))]
    return tuple((t, sym, name) for name, rows in sections for t, sym in rows)


def build() -> Arrangement:
    notes = cold_open() + act_two() + the_drop() + wall_and_transition() + transition_strings_pulse_texture() + \
        title() + real_thing() + coda() + air()
    expression = {
        "strings": ((85, 0.2), (89, 0.5), (91.0, 1.0), (92.0, 0.8), (94, 0.66), (98, 0.78), (108, 1.0), (110, 0.95), (113, 0.8),
                    (115, 0.4), (118, 0.85), (120, 0.75), (124, 0.5), (136, 0.7), (140, 1.0), (142, 0.55), (143.6, 0.12), (144.3, 0.0)),
        "pulse": ((80, 0.55), (91, 0.8), (98, 1.0), (124, 0.8), (140, 1.0), (144, 0.6)),
        "air": ((6, 0.35), (28, 0.6), (72, 0.45), (80, 0.6), (113, 0.8), (115, 0.4), (145, 0.5), (157, 0.3)),
    }
    return Arrangement("master", DURATION, tuple(sorted(notes, key=lambda x: (x.t, x.part, x.key))), expression,
                       silences=((0.0, 6.0), (DROP, DROP), (HARD_STOP, TITLE_SWELL), (END_BY, DURATION)), hard_stops=(DROP, HARD_STOP),
                       end_by=END_BY, sync=sync_points(), chart=chart())
