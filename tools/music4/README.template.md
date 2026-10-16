# Provided For (v4, 10:00): the score

Original music for the long film, composed in code and rendered from CC0 samples (VSCO 2 Community Edition: the upright piano and the string sections) plus synthesis (pulse, woodblock, pad, shimmer, room air). It is built chapter by chapter to BIBLE4 §7.1, with the two protected silences of §7.2, the chapter slots of `src/film4.ts` and `MUSIC_MAP4_LOCAL` in `src/beats4.ts`. No licensed material is used.

> **Nobody has listened to this.** No one on the crew can audition audio, so everything below is measured, not heard. Timing, the digital silences, loudness, true peak, key and the stems-sum are proved by the numbers in this file (all of them are written by `tools/music4/readme4.py` from the measurement reports). Whether it sounds warm, unhurried and un-cheesy over ten minutes is a judgement call. Please have someone listen on headphones and on a phone speaker before it is approved; where to listen first is under "Known risks".

## Files

All files are 48 kHz, stereo, 24-bit PCM WAV. The mix is the sum of its four stems: every bus stage (glue compression, loudness gain, true-peak limiting) is ONE gain curve applied to all stems, and the limiter holds the mix and each stem under the ceiling. Measured |sum of the four stem files - mix file|: {{SUM_LSB}} LSB (24-bit rounding of five separate files).

| Folder | What |
|---|---|
| `master/` | `music4-master-mix.wav` (the 600 s premix) and `-piano`, `-strings`, `-pulse`, `-texture` (texture = pad, shimmer, room air; the woodblock is in `pulse`) |
| `chapters/` | `music4-<nn>-<chapter>.wav`: one premix per chapter, exactly the chapter's length, rendered on its own (no bleed from the chapter before), with the master's bus gain over that span and its own tail faded to zero over the last 0.75 s so the file ends on the boundary |
| `hook75/`, `cut180/` | HOOK_75 and CUT_180 (`src/edits4.ts`), re-arranged (see below): mix + the same four stems |
| `events/` | `master.json` (every note per chapter in chapter-local seconds, zero windows, sync points, chord chart), `hook75.json`, `cut180.json` |
| `midi/master.mid` | one track per part, 60 BPM, a marker per chapter and a time-signature change wherever a bar is shortened |
| `analysis/` | `report.json` (master), `hook75_report.json`, `cut180_report.json`, `render.json`, `master_overview.png` |

{{FORMATS}}

The no-VO mix needs nothing from here: the music has no VO in it.

## Tempo, meter and the chapter bar lines

60 BPM, 4/4: every integer second is a beat, everywhere. The bar lines run every 4 s **from each chapter's start**, so every chapter boundary is a clean downbeat and a chapter short can be cut from the stems on a bar line. Ten of the eleven chapter lengths are not multiples of 4 s, so a chapter's last bar is shortened to end on the boundary (a bar of 1, 2 or 3 beats; the MIDI file carries the time-signature changes). In master time this means the bar lines are every 4 s within a chapter, not every 4 s from 0:00 as in v1; nothing else moves, and every sync point in the bible still lands on a beat or the 0.5 s grid.

{{SLOTS}}

## Key, motif and harmony

**D-flat major**, the v1 key, with the v1 motif family:
- **CARE**, 5 - 3 - 2 - 1 (A-flat, up a sixth to F, E-flat, D-flat): the answer. **QUESTION** stops on 2 (E-flat). **HOPE** rises 5 - 6 - 1 - 2 - 3 (A-flat, B-flat, D-flat, E-flat, F).
- Chapter 1 opens with the v1 felt-piano entry (A-flat, F, E-flat, D-flat as single notes from 6.0). Chapter 2 sings CARE over the ostinato and HOPE into the storm. Chapter 3 is the same contour in **B-flat minor** (F, D-flat, C, B-flat). Chapter 4 climbs HOPE as the card becomes a plane. Chapter 5 spreads CARE over the four cards (one note per card), HOPE over the six boxes. Chapter 6 asks the QUESTION for the names and holds the dominant (A-flat sus4) under PROVISUM until it resolves to D-flat as the logotype settles. Chapter 7 sits on an **A-flat pedal (the dominant)** for the whole engine room and resolves to D-flat on "Build succeeded". Chapter 8's three statuses are HOPE's first three notes. Chapter 9's nine front walls play CARE, then HOPE. Chapter 10's nine snaps climb HOPE over two octaves. Chapter 11 ends with QUESTION and the final chord landing on 1.
- Harmony is diatonic to D-flat (added ninths and sevenths, suspensions for the questions; slash chords over the A-flat pedal in chapter 7). Voice leading comes from the v1 generator (`theory.lead`: fewest semitones moved, the third always present, the seventh held).
- **The ending** (BIBLE §7.1, chapters 10-11): the film cuts to digital silence on the unresolved dominant (A-flat sus4) at 10/68.0; the A-flat pedal swells from 10/70.0; at 10/73.0 the only plain root-position D-flat triad of the film lands with the "2"; felt piano alone from 10/75.0; the final chord (D-flat add 9, CARE landing on D-flat) at 11/20.0, faded to nothing by 11/24.0; then nothing until the pencil click (foley) at 11/28.0.

### Chord chart (per chapter)

{{CHARTS}}

## How it was made (one command)

`tools/music4/render.sh` regenerates everything: compose (`compose4.py`: the chapter builders `ch_a.py`-`ch_d.py`, helpers `phr4.py`, model `score4.py`), render (`render4.py` + `stems4.py` + `bus4.py`), measure (`analyze4.py`), picture (`plots4.py`), the cut-downs (`edits4_music.py`) and this README (`readme4.py` + `README.template.md`). It is deterministic: humanisation and noise are seeded, nothing reads the clock. The instruments, EQ, rooms, measurement code and samples are v1's (`tools/music`, imported unchanged). `conf4.check_slots()` stops the render if `src/film4.ts` and the score's chapter table ever disagree. Render time on this Mac: {{RENDER_S}} s for the master.

Each chapter is rendered on its own with a 6 s tail and laid into the master at its slot, so its reverb rings naturally into the next chapter; every chapter's zero windows are then forced to exact zero in the master too. Hard stops cut the music before them (and its reverb) with a 4 ms fade that ends on the stop; rests fade over 0.25 s into exact zero.

## Sync points: bible against measurement ({{SYNC_PASS}} pass)

Measured in the stem that proves each point: onsets by spectral flux (the detector calibrated on notes rendered at a known time; pass if within 20 ms), entries and last sounds by the first/last sample above one 24-bit LSB, crests by the loudest 200 ms of a crescendo (pass within 0.5 s), zero windows sample by sample in the mix and all four stems.

{{SYNC_TABLE}}

## Silences (exact digital zero)

{{ZEROS}}

Last non-zero sample of the master mix: {{LAST_SOUND}} s (the final chord is gone by 9:54.0; the pencil click at 9:58.0 is foley).

## Loudness and peaks

Master mix: **{{MIX_LUFS}} LUFS integrated, {{MIX_TP}} dBTP true peak** (EBU R128, ffmpeg). The loudest 3 s of the film: {{LOUDEST}}, inside 10/60-68 as §7.2 asks. The title swell (10/70-73) sits {{SWELL}} under that section (the bible asks for at least 12 dB).

{{LOUDNESS}}

## Key check (chroma against Krumhansl-Kessler profiles)

{{KEYS}}

B-flat minor and D-flat major share their notes, so the estimator reads chapter 3 as a whole as D-flat (its middle is the warm D-flat chord); the opening ten seconds, before the crumple, read as B-flat minor.

## The hook and the cut (re-arranged, not sliced)

`edits4_music.py` reads the segments of HOOK_75 and CUT_180 from `src/edits4.ts` and re-arranges each from its chapter's material: every note is shortened to end inside its segment (the cut never chops a note; tails ring over the junction); whatever was sustaining at a cut point is re-struck on the segment's first frame; a segment that would begin with no piano attack gets a soft hinge chord of the harmony sounding there; rests, silences and hard stops come along (a hard stop on a segment's first frame cuts the previous segment dead); contiguous segments of one chapter play straight through; both are bussed to -18 LUFS on their own.

{{EDITS}}

## Deviations and decisions to confirm

1. **Bar lines restart at every chapter** (see above). If the bible's "bar lines every 4 s" must mean from 0:00, the chapter boundaries cannot be bar lines (of the twelve boundary times only 0:00 and 10:00 are multiples of 4 s); the brief asks for clean bar lines at the boundaries, so the score restarts the bar at each chapter.
2. **The freeze in CUT_180.** Segment 3 (`mayasHouse` 22-28) ends exactly on the freeze, so in the cut the lift stops dead on the cut (a hard stop) and chapter 3 starts on the next frame: the one-beat rest is not in the EDL. To have the rest, extend that segment to 28-29 in `src/edits4.ts` and rerun.
3. **The hook's silence before the title** is the master's: two seconds (68-70) of digital zero, longer than the 1.0 s minimum.
4. **Rests that foley carries alone** (3/10-12 crumple, 3/20.5-22.5 scissors, 7/46.5-48.5 the erased server, 8/22-23 the sticky notes) are exact digital zero too, so the foley is alone.
5. **The glissando** (5/32-33) is a fast eight-note run in violins and violas, doubled by the piano: the sampled strings cannot bend.
6. Sync points after `estimate` VO times (the silhouettes, gate labels) are not musical hits, by design; when the real VO times arrive nothing in the score has to move.

## Known risks (listen here first)

- **Ten minutes of one piano**: the felt piano carries most chapters. Listen for fatigue in chapters 5-7 (2:50-6:05), where the bed is quietest.
- **Chapter 10** (8:10-9:30) is the loudest stretch and the busiest; the hits at 10/36 and 10/38 and the plane at 10/60 may need balancing against the VO.
- **The pad and room air** under the long chapters are very quiet (-60 to -65 dBFS); on a phone speaker they vanish, on headphones they may read as hiss.
- **Hinge chords and re-strikes** in the cut-downs are generated by rule; a junction may sound abrupt. The junction times are in the tables above.
- **Woodblock** (chapter 7, the train) is synthesised, not sampled; it may sound toy-like. It is quiet and dry on purpose.
- Tuning measures within a few cents; the sparsest sections (chapter 1, chapter 11) read up to about 10 cents off because there are few notes to measure.
