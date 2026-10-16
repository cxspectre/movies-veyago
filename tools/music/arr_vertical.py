"""arr_vertical.py — the 0:45 vertical cut-down score, re-arranged (not cut) from the master's motif family.

Built to src/edits.ts VERTICAL_45 (segment starts in vertical seconds; `props.music` quoted):
  0:00.0  sticky note        "felt piano enters on the first frame, sparse; the first real chord at +1.0"
  0:05.5  page 1             "ostinato begins, light"            (VO 3 at 0:05.5)
  0:10.0  page 2             "ostinato continues"
  0:13.5  the form           "drops to a single held note under VO 6"  (cross-out on "Stop" at 0:16.0)
  0:20.0  lines catch light  "swell; the pulse starts under it"
  0:25.0  the phone          "pulse locked to a beat; hits on the three snaps" (snaps 0:26, 0:28, 0:30)
  0:31.0  title              "hard stop ... (0.5 s of silence), then the swell and the resolve at +3.0" (0:34.0)
  0:35.0  four feature cuts  "lift: ostinato" (cuts at 0:35, 0:37, 0:38.5, 0:40); "peaks and stops clean on the cut" 0:42
  0:42.0  end card           "one warm chord, decayed by +2.0" (0:44.0; the pencil click at 0:44.5 is foley)
"""
from __future__ import annotations

from phrases import bass_hits, clear_for, heartbeat, melody, ostinato, pad, piano_chord, string_chords
from score import Arrangement, Note, SyncPoint
from theory import ns

DURATION = 45.0
FIRST_CHORD = 1.0
PAGE_1, PAGE_2, FORM, LIGHT_START, PHONE = 5.5, 10.0, 13.5, 20.0, 25.0
SNAPS = (26.0, 28.0, 30.0)
HARD_STOP = 31.0
TITLE_SWELL = 31.5
RESOLVE = 34.0
CUTS = (35.0, 37.0, 38.5, 40.0)
END_CARD = 42.0
END_BY = 44.0
RANGES = {"basses": (28, 39), "celli": (36, 50), "violas": (53, 67), "violins": (62, 81)}
OST_8 = (0, 3, 1, 3, 2, 3, 1, 3)
OST_16 = (0, 2, 3, 2, 1, 2, 3, 2)


def sticky_note() -> tuple:
    enter = (Note(0.0, 1.2, ns("Eb4")[0], 0.16, "piano", tag="piano-enters"),)
    first = piano_chord(FIRST_CHORD, "Gbmaj9", 0.62, 4.0, 30, ns("Db3 Bb3 F4 Ab4 Db5"), roll=0.03, tag="first-chord")
    under = melody(3.0, "Ab4 F5 Eb5", (0, 1, 2), (1.2, 1.2, 1.6), 0.22)
    return enter + first + under + pad(FIRST_CHORD, 5.0, ns("Gb3 Db4 F4 Bb4"), 0.10, 1.0, 1.2)


PAGES = ((PAGE_1, "Dbadd9"), (PAGE_2, "Ab/C"), (12.0, "Bbm7"), (FORM, None))


def two_pages() -> tuple:
    ost = ostinato(PAGE_1, PAGES, 0.5, OST_8, (0.24, 0.32), 56, 72, seed=41)
    bass = bass_hits((PAGE_1, PAGE_2, 12.0), PAGES, 0.36, 30, 1.9, tag="page")
    tune = melody(7.5, "Ab4 F5 Eb5 Db5", (0, 2.5, 3.5, 4.5), (2.4, 1.1, 1.1, 2.0), 0.32)
    return ost + bass + tune


def form_drop() -> tuple:
    held = Note(FORM, 3.5, ns("Ab3")[0], 0.30, "piano", tag="drop")
    return (held, Note(17.0, 2.0, ns("F4")[0], 0.20, "piano"), Note(19.0, 1.2, ns("Eb4")[0], 0.20, "piano")) + \
        pad(FORM, LIGHT_START, ns("Ab2 Eb3"), 0.08, 1.0, 1.0)


HARMONY = ((LIGHT_START, "Dbadd9/F"), (22.0, "Gbmaj9"), (24.0, "Ab/C"), (PHONE, "Bbm9"), (26.0, "Gbmaj9"), (27.0, "Db/F"),
           (28.0, "Ebm9"), (29.0, "Fm7"), (30.0, "Absus4"), (HARD_STOP, None))


def light_and_phone() -> tuple:
    swell = piano_chord(LIGHT_START, "Dbadd9/F", 0.56, 2.5, 29, ns("Ab3 Db4 Eb4 Ab4"), tag="swell")
    glow = ostinato(20.5, ((20.5, "Dbadd9/F"), (22.0, "Gbmaj9"), (24.0, "Ab/C"), (PHONE, None)), 0.5, (0, 2, 1, 3), 0.24, 65, 84, seed=42)
    lock = clear_for(ostinato(PHONE, HARMONY[3:], 0.25, OST_16, 0.29, 58, 75, seed=43), SNAPS)
    snap_keys = {26.0: "Db4 F4 Ab4", 28.0: "Gb4 Bb4 Db5"}
    snaps = tuple(Note(t, 0.9, k, 0.64 if i == 2 else 0.56, "piano", tag="snap" if i == 2 else "")
                  for t, keys in snap_keys.items() for i, k in enumerate(ns(keys)))
    hit = piano_chord(30.0, "Absus4", 0.72, 1.0, 32, ns("Eb3 Ab3 Db4 Eb4 Ab4 Db5 Eb5"), tag="snap-hit")
    bass = bass_hits((22.0, 24.0, PHONE, 27.0, 29.0), HARMONY, 0.4, 30, 0.95)
    strings = string_chords(HARMONY, RANGES, 0.6, 0.8, 0.4, overlap=0.25)
    strings = (Note(LIGHT_START, strings[0].dur, strings[0].key, strings[0].vel, strings[0].part, strings[0].attack,
                    strings[0].release, "strings-enter"),) + strings[1:]
    pulse = heartbeat((LIGHT_START, 22.0, 24.0), 0.45, tight=False, dub=0.0, tag_first="pulse-starts") + \
        heartbeat(tuple(float(t) for t in range(25, 30)), 0.72, tight=True, tag_first="pulse-locks") + \
        heartbeat((30.0,), 0.92, tight=True, dub=0.5)
    shimmer = pad(LIGHT_START, 23.5, ns("Ab5 Db6 F6"), 0.12, 0.6, 2.0, "shimmer")
    return swell + glow + lock + snaps + hit + bass + strings + pulse + shimmer


def title() -> tuple:
    swell = (Note(TITLE_SWELL, 2.7, ns("Ab1")[0], 0.55, "basses", 2.3, 0.5, "title-swell"),
             Note(TITLE_SWELL, 2.7, ns("Ab2")[0], 0.5, "celli", 2.3, 0.5)) + pad(TITLE_SWELL, RESOLVE + 0.2, ns("Ab1 Ab2 Eb3"), 0.2, 2.2, 0.6)
    resolve = piano_chord(RESOLVE, "Db", 0.7, 1.6, 37, ns("Ab2 F3 Ab3 Db4 F4 Ab4 Db5"), tag="resolve")
    strings = string_chords(((RESOLVE, "Dbadd9"), (35.0, None)), RANGES, 0.56, 0.25, 0.8)
    return swell + resolve + strings + heartbeat((RESOLVE,), 0.72, tight=True, dub=0.0) + pad(RESOLVE, 35.5, ns("Db6 F6 Ab6"), 0.08, 0.8, 1.2, "shimmer")


FEATURES = ((35.0, "Dbadd9"), (37.0, "Bbm9"), (38.5, "Gbmaj9"), (40.0, "Ebm9"), (41.0, "Absus4"), (END_CARD, None))


def features() -> tuple:
    rh = clear_for(ostinato(35.0, FEATURES, 0.25, OST_16, (0.26, 0.36), 61, 77, seed=44), CUTS, gap_before=0.0)
    cuts = bass_hits(CUTS, FEATURES, 0.56, 30, 1.3, tag="cut")
    strings = string_chords(FEATURES, {k: RANGES[k] for k in ("basses", "celli", "violas")}, 0.5, 0.4, 0.3)
    violins = melody(35.0, "Ab4 F5 Eb5 F5", (0, 2, 3.5, 5), (2.2, 1.7, 1.7, 1.1), 0.55, part="violins", attack=0.3, release=0.3)
    pulse = heartbeat(tuple(float(t) for t in range(35, 42)), 0.55, tight=True, dub=0.45)
    return rh + cuts + strings + violins + pulse


def end_card() -> tuple:
    final = piano_chord(END_CARD, "Dbadd9", 0.44, 1.6, 37, ns("Ab2 F3 Eb4 Ab4 Db5"), octave_bass=False, tag="final-chord")
    return final + pad(END_CARD, 43.4, ns("Db3 Ab3 F4"), 0.07, 0.4, 0.5)


def air_bed() -> tuple:
    """Room air, one note per hard-stop segment (a hard stop cuts everything before it, air included)."""
    spans = ((0.0, FORM, 1.0), (FORM, HARD_STOP, 0.05), (TITLE_SWELL, END_CARD, 1.5), (END_CARD, END_BY - 0.4, 0.05))
    return tuple(Note(a, b - a, 0, 0.5, "air", attack, 0.0) for a, b, attack in spans)


def sync_points() -> tuple:
    rows = [SyncPoint("piano enters on the first frame", 0.0, "piano", "entry"),
            SyncPoint("first chord (sticky note smoothed)", FIRST_CHORD, "piano", "onset"),
            SyncPoint("page 1: ostinato begins", PAGE_1, "piano", "onset"), SyncPoint("page 2", PAGE_2, "piano", "onset"),
            SyncPoint("the form: music drops", FORM, "piano", "drop"),
            SyncPoint("swell: lines catch light", LIGHT_START, "mix", "onset"), SyncPoint("strings enter", LIGHT_START, "strings", "entry"),
            SyncPoint("pulse starts", LIGHT_START, "pulse", "entry"), SyncPoint("pulse locks (the phone)", PHONE, "pulse", "onset")]
    rows += [SyncPoint(f"snap {i + 1}", t, "piano", "onset") for i, t in enumerate(SNAPS)]
    rows += [SyncPoint("hard stop (cut into the title)", HARD_STOP, "mix", "lastsound"),
             SyncPoint("0.5 s silence", HARD_STOP, "mix", f"silence:{TITLE_SWELL}"),
             SyncPoint("low swell", TITLE_SWELL, "mix", "entry"), SyncPoint("resolve ('2' completes)", RESOLVE, "piano", "onset")]
    rows += [SyncPoint(f"feature cut {i + 1}", t, "piano", "onset") for i, t in enumerate(CUTS)]
    rows += [SyncPoint("end card chord (ostinato stopped clean)", END_CARD, "piano", "onset"),
             SyncPoint("decayed by +2.0", END_BY, "mix", "lastsound"), SyncPoint("silence to the end", END_BY, "mix", f"silence:{DURATION}")]
    return tuple(rows)


def build() -> Arrangement:
    notes = sticky_note() + two_pages() + form_drop() + light_and_phone() + title() + features() + end_card() + \
        air_bed()
    expression = {"strings": ((20.0, 0.35), (21.5, 1.0), (23.0, 0.7), (30.0, 1.0), (31.0, 0.9), (31.5, 0.35), (34.0, 0.85),
                              (35.0, 0.55), (41.0, 0.85), (42.0, 0.8)),
                  "pulse": ((20.0, 0.6), (25.0, 1.0), (35.0, 0.8), (41.0, 1.0)),
                  "air": ((0.0, 0.3), (1.0, 0.6), (13.5, 0.45), (20.0, 0.7), (31.5, 0.4), (42.0, 0.5))}
    chart = tuple((t, s, "vertical") for t, s in ((0.0, "Eb (single note)"), (1.0, "Gbmaj9")) + PAGES[:-1] + ((FORM, "Ab (single note)"),)
                  + HARMONY[:-1] + ((HARD_STOP, "silence"), (TITLE_SWELL, "Ab pedal"), (RESOLVE, "Db")) + FEATURES[:-1]
                  + ((END_CARD, "Dbadd9 (final)"),))
    return Arrangement("vertical", DURATION, tuple(sorted(notes, key=lambda x: (x.t, x.part, x.key))), expression,
                       silences=((FORM, FORM), (HARD_STOP, TITLE_SWELL), (END_CARD, END_CARD), (END_BY, DURATION)),
                       hard_stops=(FORM, HARD_STOP, END_CARD),
                       end_by=END_BY, end_fade=1.0, sync=sync_points(), chart=chart)
