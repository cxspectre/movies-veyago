# Provided For: the score

Original music for the Provisum 2 launch film (2:40 master, 0:45 vertical, 0:15 teaser). It was composed in code, rendered from CC0 samples plus synthesis, and checked against MUSIC MAP v1 (CONTRACT.md §7) and `src/edits.ts`.

> **Nobody has listened to this.** No one on the crew can audition audio, so everything below is measured, not heard. Timing, silence, loudness, key and tuning are proved by the numbers in this file. Whether it *sounds* intimate, warm and un-cheesy is a judgement call: the sources and the treatment were chosen to get there, but a human has to confirm it. Please have someone listen on headphones and on a phone speaker before it is approved. The places I would listen to first are under "Known risks".

## Files

All files are 48 kHz, stereo, 24-bit PCM WAV. In each version the mix is the exact sum of its four stems: every bus stage (compression, gain, limiting) is applied as one gain curve to all stems, so a rebalance in the final mix starts from the same sound. Max |sum of stems - mix| before 24-bit rounding: master {{SUMERR:master}}, vertical {{SUMERR:vertical}}, teaser {{SUMERR:teaser}}.

| Version | Length | Folder | Files |
|---|---|---|---|
| Master | 160.0 s | `master/` | `music-master-mix.wav` (premixed music master), `-piano`, `-strings`, `-pulse`, `-texture` |
| Vertical cut-down | 45.0 s | `vertical/` | `music-vertical-mix.wav` + the same four stems |
| Teaser | 15.0 s | `teaser/` | `music-teaser-mix.wav` + the same four stems |

- `events/<version>.json` holds the exact note events that were rendered: onset, length, key, velocity, part, the expression curves, the silence windows and the sync points.
- `midi/<version>.mid` has one track per part at 60 BPM in 4/4, so the arrangement opens in any DAW.
- `analysis/` holds the quick-look pictures and the measurement reports (see "Quick look" below).
- No-VO mix: the music here has no VO in it. The mixer builds the no-VO version from these files unchanged.

## Key, motif and harmony

**D-flat major** at 60 BPM in 4/4. Bar lines fall every 4 s from 0:00, so every whole second is a beat. D-flat suits a felt piano: it sits warm and slightly dark, and its relative minor (B-flat minor) is close by for shade. Every harmony is a diatonic chord of D-flat, with added ninths and sevenths for warmth and suspensions for the questions. There are no borrowed chords and no cliché I-V-vi-IV loop.

**The "provided for" motif** has four notes, 5 - 3 - 2 - 1 (A-flat, up a sixth to F, then E-flat, D-flat). It reaches up and then settles home, like someone being looked after. Its *open* form stops on 2 (E-flat). That is the question ("What are we still missing?"): it closes the cold open (0:24), hangs over the form page (1:16-1:19) and leads every swell. Its *closed* form lands on 1. That is the answer: it comes back under the title subline (2:00-2:03) and under "provided for" in VO 8 (2:26-2:30). The **hope figure** 5-6-1-2-3 (A-flat, B-flat, D-flat, E-flat, F) is its rising sibling. The four UI snaps and the hit climb it (1:41 A-flat, 1:43 B-flat, 1:45 D-flat, 1:47 E-flat, 1:48 F), and so do the teaser's four montage notes.

**How the harmony carries the film:**
- **0:28 the first real chord is G-flat major 9 (IV), not the home chord.** It is an event (from about -60 to about -15 dBFS, wide from G-flat 1 to D-flat 5) that still asks a question. It answers itself with D-flat/F at 0:32.
- **0:36-1:12 the harmonic rhythm follows the pages** in `beats.ts`. Chords change on page starts at 0:38, 0:44, 0:49 and 0:53 (6, 5, 4, 3 s), then every 2 s on the 2-s pages from 0:56, then every 3 s from 1:06. The harmony speeds up with the drawing. The right hand moves from eighths to sixteenths at 0:56 ("tempo up"). At 1:06 a left-hand eighth figure and the motif in octaves come in.
- **1:20-1:53** the bass climbs F - G-flat - C - B-flat - G-flat - F - E-flat - F - G-flat - A-flat, which builds tension without getting louder for its own sake. The hits fall on IV (1:48) and V sus4 (1:50). **The film cuts to silence on the unresolved dominant (A-flat sus4) at 1:53.0.**
- **1:55 a low A-flat pedal swells** (contrabass, celli, a soft pad). **At 1:58.0 it resolves to plain D-flat major in root position**, with the octave bass D-flat 1 / D-flat 2, a full triad up to D-flat 5, the strings and one deep pulse. It is the only plain triad in the film, so it reads as decisive. The V-I cadence spans the silence.
- **2:04-2:20** the bass follows the nine cut points exactly (2.0 / 1.5 s alternating, a 4+3 eighth-note pattern against the 4/4 pulse). The violins sing the motif in long notes (A-flat, F, E-flat, D-flat, E-flat), and the line peaks on F over G-flat major 9 at 2:20.
- **2:25-2:37** the felt piano is alone. The motif closes (A-flat, F, E-flat, D-flat) over D-flat and G-flat/D-flat, the plagal "amen". The last chord, D-flat add 9, lands at 2:33.0 and is silent by 2:37.0.

Voice leading is built into the generator. `theory.lead()` picks, for each chord, the voicing in a register that moves the fewest semitones from the previous one. It must include the chord's third (or its suspension) and prefers voicings that hold the seventh. Doubled tones and semitone rubs cost extra. For example, at 0:49 B-flat minor 7 is D-flat 4 F4 A-flat 4 B-flat 4, and at 0:53 G-flat major 9 holds exactly the same right hand while the bass falls B-flat to G-flat.

### Chord chart: master
{{CHART:master}}

### Chord chart: vertical
{{CHART:vertical}}

### Chord chart: teaser
{{CHART:teaser}}

## Instrumentation

| Stem | What it is | Source |
|---|---|---|
| piano | Felt piano, close-miked: an upright with soft layers favoured, a per-note velocity low-pass (soft notes darker, 1.0-5.0 kHz), a felt-and-hammer "thock" under each attack (band 70-650 Hz, -17 dB), quick dampers (0.22 s), a small room (RT60 0.5 s), a little hall, gentle tape saturation | VSCO 2 CE "Upright Piano" (Ivy Audio / Simon Dalzell), 3 dynamic layers, a sample every 4 semitones (shifts of 2 semitones at most) |
| strings | Violins, violas, celli (sections) and contrabass, sustains with slow bows. A note's dynamic (velocity times the expression curve) drives both its level and a crossfade from the soft to the loud recording, so swells brighten the way a real section does. Long notes are extended by crossfading fresh sustain windows. Seated L to R, hall RT60 2.7 s | VSCO 2 CE: Violin Section susVib, Viola Section susvib, Cello Section susvib, Solo Contrabass SusNV |
| pulse | The heartbeat. A sine body tuned to A-flat 1 (52 Hz) that falls a little in pitch, a soft second partial so phone speakers hear it, a whisper of felt noise. Before 1:38 it has soft 12 ms attacks on beats 1 and 3 (then ghost notes). From 1:38 it is tight (2 ms) on every beat with a quieter "dub" 0.26 s after: a resting heart at 60 BPM. It is not a kick and has no click | synthesised (`inst_synth.py`) |
| texture | A sympathetic-resonance pad (slowly beating sine partials, held well under the piano, mostly hall) that blooms under the first chord, the drop, the light catch, the title and the end. A high shimmer for the lines catching light (1:31) and the light sweep (2:21). Room air (band-limited noise at about -70 dBFS) so the silences between notes sound like a quiet room, not a void | synthesised |

There are no trailer braams, risers, reverse cymbals, drums or synth leads.

## How it was made

Run `tools/music/render.sh` and it rebuilds everything deterministically: fixed seeds, no clock and no randomness outside seeded generators.

1. `fetch_samples.sh`: sparse download of five CC0 folders from VSCO 2 CE (pinned commit `4403009`), about 620 MB of WAVs, into `tools/music/.vendor/` (data only, nothing executed).
2. `verify_banks.py` measures the pitch of every sample (harmonic product spectrum) instead of trusting file names. It found that the string folders name middle C "C3" (one octave off) and that the pianos match their names. It stores per-sample residual tuning, which the string sampler then corrects. Result: `analysis/bank_pitch.json`.
3. `evaluate_sources.py` compares the piano candidates (table below) and chose the "Player" upright.
4. `compose.py` builds the three arrangements (`arr_master.py`, `arr_vertical.py`, `arr_teaser.py`, from the motif family in `phrases.py` and the voice leading in `theory.py`) and writes events JSON and MIDI. Inner notes get seeded micro-timing of ±6 ms and velocity variation of ±0.035. Notes that carry a sync point are never moved.
5. `render.py` renders each stem (`inst_piano.py`, `inst_strings.py`, `inst_synth.py`, `stems.py`) with synthesised impulse responses (octave-band decay, warmer at the top), stem EQ and tape warmth. Then the bus (`mixbus.py`): 2:1 soft-knee glue compression on peaks about 7 dB above the programme loudness, gain to -18 LUFS, and a 4x-oversampled look-ahead limiter until the true peak is under -1.5 dBTP.
6. **Hard stops are sample-exact and tail-free:** the music before a stop is rendered and reverberated on its own and cut at the stop with a 4 ms fade that ends exactly on it. Nothing of it, reverb included, reappears after the silence. The master's stop is sample 5,424,000 (113.000 s).
7. `analyze.py` + `measure.py` + `plots.py` measure everything; `readme.py` writes the tables below from those measurements.

**Installed for this:** `matplotlib` and `mido` into the shared `Film/.venv` (numpy, scipy, soundfile and pyloudnorm were already there). There were no brew installs. ffmpeg was already installed and is used for the EBU R128 measurements.

**Licence:** VSCO 2 Community Edition is CC0 1.0 ("use these samples for ANY purpose"; the only request is not to sell the samples themselves). Credit is encouraged and costs nothing, so please add to the film's credits or description: *Samples: VSCO 2 Community Edition by Versilian Studios (Sam Gossner) and Ivy Audio (Simon Dalzell), CC0, vis.versilstudios.net/vsco-community.html.* Everything else is synthesised here. There is no General MIDI bank, no Apple DLS (its redistribution terms are unclear) and no third-party loops.

### Choosing the piano (softest layer, mean of Db3, A3, Db4, F4, Db5)
{{SOURCES}}

`upright_player` was picked. It is the darkest real recording (765 Hz centroid before any treatment), has the lowest noise floor (-53 dB re peak against -47 dB), needs the smallest pitch shifts (2 semitones against 3.5, so less "chipmunk" timbre), has natural stereo (correlation 0.67; the other upright's 0.04 would collapse in mono), and shows natural unison-beating "roughness" in its decay. The modal synth is smooth (roughness 0.5) and never decays naturally (t30 above 6 s): those are the synthetic tells, so it was rejected.

## Sync points: measured in the rendered files

Tolerance is ±20 ms; a hard stop must cut within 20 ms *before* its time. Two rows describe envelopes rather than instants, and their errors are reported but judged differently: the **drop** rows are clean cuts rendered sample-exact on the target, but the level crossing they report comes later because the new held note has its own attack (pass = at least 6 dB down, crossing by +0.4 s); the **strings crest** row is the top of a bowed crescendo (pass = within ±0.5 s). Onsets come from a spectral-flux detector (21 ms window, 1 ms hop) calibrated on notes rendered at known times (latency removed: {{CALIBRATION}}). Entries and last sounds are the first or last sample above one 24-bit LSB, and silence is counted in integer samples. "Proved in" names the stem the measurement was made on.

### Master (160 s): {{PASS:master}} pass
{{SYNC:master}}

### Vertical (45 s, `src/edits.ts` VERTICAL_45): {{PASS:vertical}} pass
{{SYNC:vertical}}

### Teaser (15 s, `src/edits.ts` TEASER_15): {{PASS:teaser}} pass
{{SYNC:teaser}}

### Silence verification

The silence rows in the tables above are counted in the 24-bit mix files: **0:00-0:06 and 1:53.0-1:55.0 in the master contain zero non-zero samples** (digital silence, not "quiet"), and so do 2:37-2:40, the vertical's 0:31.0-0:31.5 and 0:44-0:45, and the teaser's 0:00-0:01 and 0:11-0:12. The stems are silent in the same windows, so the mixer can lay room tone or foley there only on purpose.

## Loudness (ffmpeg ebur128, true peak on)
{{LOUDNESS}}

The music bus sits at about -18 LUFS integrated with the true peak at -1.7 to -2.0 dBTP, below the -1 dBTP ceiling, which leaves headroom for VO. Stems read lower than the mix because each one is only part of it. The loudness range is wide on purpose: the cold open sits around -40 dBFS RMS and the title resolve around -15.

## Key and tuning check (chroma against Krumhansl-Kessler profiles; spectral peaks against A = 440 Hz)
{{KEYS}}

The renders are in D-flat major everywhere and in tune with A440. The +10 cents in the cold open is the upright's natural stretch tuning on single notes. If the film is mixed with other tuned material, it is at A440.

## "Tempo up" lifts (master)
{{LIFTS}}

The score's note density doubles at 0:56 (eighths to sixteenths) and stays doubled at 1:06, where the left hand and the motif in octaves join and the level rises. After 1:12 it falls to under one note per second. The spectral-flux count is approximate and undercounts soft sixteenths. The score column is exact.

## Quick look (`analysis/`)

- `master_overview.png`, `vertical_overview.png`, `teaser_overview.png`: a log-frequency spectrogram of the mix, the level of each stem, and every sync point as a line (green means it was measured within tolerance).
- `master_zoom_first-chord.png` (0:18-0:36), `master_zoom_lifts.png` (0:46-1:22), `master_zoom_stop-and-resolve.png` (1:44-2:06), `master_zoom_feature-cuts.png` (2:02-2:27).
- `<version>_report.json` (every measurement), `<version>_render.json` (bus figures), `bank_pitch.json`, `source_evaluation.json`.

## The cut-downs

Both are re-arranged from the same motif family to `src/edits.ts`, not cut from the master. The music text of each segment is followed literally: the felt piano on the first frame, the first chord at +1.0 on the sticky note, the ostinato over the pages, the drop to a single held note on the form (a clean cut at 0:13.5), the swell with the pulse under the light catch, the pulse locked with hits on the three snaps (0:26, 0:28, 0:30), a hard stop into the title with 0.5 s of silence, the swell and the resolve at 0:34, the ostinato under the four cuts with the bass on each cut, a clean stop at 0:42, and one warm chord gone by 0:44. The teaser is silent for its first second ("pencil only"), has the chord at 0:01, four rising notes on the montage cuts, the swell into a hard stop at 0:11, one second of nothing, and the swell to the resolve.

**One deliberate deviation (teaser):** the edit says the music "resolves on the last frame". A chord that starts on the last frame (0:14.967) is never heard, so the D-flat lands at **0:14.5**, in the last half-second of the "2" stroke, and rings to the end with a 0.25 s fade. If the director wants it later, change `RESOLVE` in `arr_teaser.py` and re-run.

## Changing it

Edit the arrangement files (times are named constants at the top; chords are symbols like `"Gbmaj9"`), then run `tools/music/render.sh`. A full rebuild takes about 2 minutes on this machine. If the edit moves, change the constants, re-render, and check that the README tables are still all "yes". If `src/edits.ts` changes, `arr_vertical.py` and `arr_teaser.py` must follow it by hand (they quote the segment music text in their headers).

## Known risks (where a human should listen first)

1. **The felt character** comes from filtering and layer choice on a real upright, not from a sampled felt piano. Is it warm and close, or merely muffled? The per-note cutoff (`FELT_*` in `inst_piano.py`) is the knob.
2. **String loops:** notes longer than about 9 s are extended by crossfading sustain windows (0.5 s equal-power). A section's vibrato should hide the seams, but they have only been measured, not heard. The longest are 1:25-1:31 and the title pedal.
3. **The pulse on small speakers:** its body is 52 Hz, and only the second partial (about 104 Hz) and the felt tick reach a phone. Check that it still reads as a beat from 1:38 there, and that it is not too present on big speakers (it was lowered 8 dB after the first pass).
4. **The pads** are simple sine partials. They are held low (about 10-20 dB under the piano in the plots), but they are the most "synthetic" element. If they sound cheap, the texture stem can be muted without changing any sync point.
5. **The teaser resolve** at 0:14.5 (above).
6. **VO masking:** the ostinato under VO 7 (2:04.5-2:13.5) sits mostly between 300 Hz and 1.5 kHz. Ducking is the mixer's job, and the stems allow piano-only ducking.
