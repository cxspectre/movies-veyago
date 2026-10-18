# v4 sound: the commands for the owner's Mac

Everything here runs **locally** (it needs the sample libraries, the Python venv and the Kokoro voices). Nothing in this document has been run in the cloud: the cloud work was code and tests only. All commands run from the film root (`movies-veyago/`). Outputs live under `audio/v4/` (not committed).

Order matters: the score and the foley are independent; the cue JSON must exist before the foley stems; the mix needs all of them.

## 0. Once
```sh
npm install                                   # never commit package-lock.json
.venv/bin/python -c "import soundfile, scipy, pyloudnorm, numpy"   # the venv of tools/music/render.sh
brew install ffmpeg
```
v1 prerequisites for the score: `tools/music/render.sh` has been run once (it fetches the samples and writes `audio/music/analysis/bank_pitch.json`).

## 1. Score (reads `src/beats4.ts`, `src/edits4.ts`; the sample libraries)
```sh
tools/music4/render.sh
```
Writes `audio/v4/music/master/music4-master-{mix,piano,strings,pulse,texture}.wav` (600 s), `audio/v4/music/chapters/music4-<nn>-<chapter>.wav`, `audio/v4/music/Hook75/music4-Hook75-mix.wav`, `audio/v4/music/Cut180/music4-Cut180-mix.wav`, analysis and `audio/v4/music/README.md`. The chapter shorts reuse the master music (cut by `edl-segments4.json` in step 5).

## 2. Cue sheets (reads each chapter's `cues.ts`, `VO4`, `src/edits4.ts`)
```sh
npx tsx tools/mix/masterCues4.ts      # -> audio/v4/foley/master4.cues.json
npx tsx tools/mix/edlCues4.ts         # -> audio/v4/foley/edl/<id>.cues.json for Hook75, Cut180 and the 11 shorts
                                      #    and audio/v4/mix/edl-segments4.json
.venv/bin/python tools/mix/clampCues.py audio/v4/foley/master4.cues.json audio/v4/foley/edl/*.cues.json
```
`masterCues4.ts` **fails loudly** (exit 1, every problem listed) on: a sound name that is not an `SfxName`, a cue outside its chapter, and any sound that starts in or runs into a protected silence. The protected silences (BIBLE4 7.2, `PROTECTED_SILENCES` in `src/audio/sheet4.ts`): chapter 2 at 28.0-29.0 (the freeze), chapter 10 at 68.0-70.0 (the hard stop), chapter 11 at 24.0-28.0 (nothing until the pencil click at 28.0). `edlCues4.ts` prints a `warning` for the same problem in a cut-down.

The sheet carries `cues`, `silences` (v1 shape, read by `renderCues.ts` and `mix.py`), `silenceCues` (the same ranges as `{kind:'silence', at, dur}` cues, read by `mix.py`) and `vo`. In the cut-downs, a hit that starts within 0.4 s of a cut that is followed by more picture is dropped (its tail would be chopped), a hit with a `dur` is shortened to the cut, and a continuous cue is clamped and marked `clamped: start|end|both`.

Chapter 10 owner: the hard stop has no foley cue by design (the silence ranges above are the gate). Do not add a chapter cue inside 68.0-70.0; the validator would fail it.

## 3. Foley (reads the cue JSON; writes the stems)
```sh
npx tsx tools/foley4/render4.ts                       # optional: the v4 one-shots + spectrograms -> audio/v4/foley/
mkdir -p audio/v4/foley/stems
npx tsx tools/foley/renderCues.ts --cues audio/v4/foley/master4.cues.json --out audio/v4/foley/stems/foley-master4.wav --room-tone
for id in Hook75 Cut180 Short-line Short-mayasHouse Short-theNo Short-filterMachine Short-researchBoard Short-nameAndLook \
          Short-engineRoom Short-launch Short-village Short-paperToGlass Short-providedFor; do
  npx tsx tools/foley/renderCues.ts --cues audio/v4/foley/edl/$id.cues.json --out audio/v4/foley/stems/foley-$id.wav --room-tone
done
```
Reads `silences` and `lengthSec` from each JSON, so the silences are already digital zero in the stem.

## 4. Voices (scratch; reads `VO4` in `src/beats4.ts`; needs the Kokoro engine of `tools/vo4`)
The lines, their ids and their start times come from `VO4`, the timeline the picture and the cut-down cue sheets are built on. (`script_lines.py` read the script's own paragraph times, which drift from the beats by up to 16 s and name the clips L001..: do not use it for v4.) A recorded take replaces `audio/v4/vo/clips/<VO4 id>.wav`, for example `Y1.wav`.
```sh
npx tsx tools/vo4/vo4Lines.ts                         # -> audio/v4/vo/lines.json, from VO4 in src/beats4.ts (ids Y1, F3, M7 ...)
.venv/bin/python -W ignore tools/vo4/render_vo4.py   # -> audio/v4/vo/clips/<id>.wav, clips.json
.venv/bin/python tools/vo4/place_vo4.py              # -> audio/v4/vo/stem_{founder,maker,maya,all}.wav, timing.json
sh tools/vo4/check_audio.sh                          # loudness / format check of every clip and stem
```
Read `conflicts` in `audio/v4/vo/timing.json`. A recorded take replaces `audio/v4/vo/clips/<id>.wav` (48 kHz, 24-bit); re-run `place_vo4.py`. An alternative voice set goes in `audio/v4/vo/alt/` (same layout) and is chosen with `--voice alt`.

## 5. Mix (one version per run; never in parallel)
```sh
for id in master4 Hook75 Cut180 Short-line Short-mayasHouse Short-theNo Short-filterMachine Short-researchBoard Short-nameAndLook \
          Short-engineRoom Short-launch Short-village Short-paperToGlass Short-providedFor; do
  .venv/bin/python tools/mix/mix.py $id            # with VO  -> audio/v4/mix/$id.wav
  .venv/bin/python tools/mix/mix.py $id --no-vo    # no VO   -> audio/v4/mix/$id-novo.wav
done
```
Each run prints one JSON line. Reads: music stem (step 1), foley stem (step 3), the cue JSON (for the silences and, in a cut-down, the VO placements), `audio/v4/vo/stem_all.wav` (master) or the clips (cut-downs), `audio/v4/mix/edl-segments4.json` (shorts slice the master music). Target -16 LUFS, true-peak ceiling -1.5 dBTP (v4 mixes use a 4x-oversampled limiter so the ceiling holds in dBTP; v1 keeps its original limiter). Music ducks 6 dB and foley 2 dB under the voice. Every silence range is forced to **exact zero** on music, foley, VO and the final mix.

## 6. Checks (do all of them before export)
1. `silences_exact_zero` is `[true, true, true]` for `master4`, `[true]` for the hook and for the shorts that carry a silence. Any `false` is a bug: stop.
2. `true_peak_dbtp` ≤ -1.5 and `lufs_final` within ±0.5 of -16 in every JSON line.
3. `seconds` is 600.0 for `master4`, 75.0 for `Hook75`, 180.0 for `Cut180`.
4. Listen to 67.5-70.5 of chapter 10 (master time 9:17.5-9:20.5), the chapter 2 freeze (master 0:58-0:59) and the last 6 s of the film: the click at 9:58.0 is the last sound and has no tail beyond 0.4 s.
5. Compare `…-novo.wav` with the with-VO mix: the music and foley must be identical outside the ducking.
6. `ffmpeg -i audio/v4/mix/master4.wav -af ebur128=peak=true -f null -` should agree with the JSON.
7. v1 is untouched: `master`, `vertical` and `teaser` still mix to the same files as before (`mix.py` changes are additive; v1 silences still come from `silences`).

## 7. Export (after the picture is rendered to `out/<id>-<suffix>.mp4`)
```sh
tools/mix/package4.sh 4k        # or 1080 -> out/final4/<id>_<suffix>_{with-VO,no-VO}.mp4
```
Pairs whose video or audio is missing are skipped and listed.

## Tests (no audio files needed)
```sh
node --import tsx --test tools/mix/test/*.test.ts tools/foley4/test/*.test.ts
python3 -m unittest discover -s tools/mix/test -p 'test_*.py'
```
