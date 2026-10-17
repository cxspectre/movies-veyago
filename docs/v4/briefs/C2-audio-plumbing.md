# C2: the v4 sound plumbing, code and tests only (cloud, Sonnet High, CAP $12)

Branch `claude/c2-audio-plumbing`. You own: `src/audio/**`, `tools/mix/**`, `tools/foley4/**` (additive only; the v1 output and v1 mixes must stay bit-identical, so keep every v1 test passing), and `docs/v4/AUDIO.md`. No rendering at all, so no stills: this is code and tests. The score, foley, voices and the mix itself run locally on the owner's Mac later (they need local audio assets and the Python venv); do NOT try to run the mix.

## Read first
`src/audio/cues.ts`, `tools/mix/` (`mix.py`, `masterCues.ts`, `edlSegments.ts`, `clampCues.py`, `package.sh`), `tools/foley4`, `tools/music4`, `tools/vo4`, `src/edits4.ts`, `src/beats4.ts` (`VO4`), each chapter's `cues.ts`, BIBLE4 section 7 (score, the two protected silences, the three voices, new foley).

## Build
1. **`tools/mix/masterCues4.ts`**: the v4 master cue list (600 s): every chapter's `cues` (module-local seconds) offset by `slotOf4(id).start`, plus the voice-over lines from `VO4` as their own list; written as JSON next to where the v1 tool writes. Validate and fail loudly: every sound name exists in `SfxName`; every cue lies inside its chapter's duration; cues are ordered; nothing sounds inside the protected silences (BIBLE4 7.2, including the hard stop at chapter 10 local 68.0-70.0 and the final silence before the pencil click in chapter 11).
2. **A `silence` cue kind** in `src/audio/cues.ts` (`{kind:'silence', at, dur}`), additive, handled in `tools/mix/mix.py` as exact digital zero on every stem (the v1 exact-zero silence logic is the model). Do NOT edit chapter `cues.ts` files (the chapter 10 owner adds the hard-stop cue after your PR lands).
3. **Cut-down cue lists**: `HOOK_75`, `CUT_180` and the chapter shorts from `src/edits4.ts`, following the v1 `edlCues` / `edlSegments` pattern: the cues of each retained segment, re-timed, with clamping at cut points so no cue is cut mid-sound.
4. **Tests** with no audio files needed (the foley4 tests are the model): the validator catches a bad name, an out-of-range cue and a sound inside a protected silence; the silence cue produces exact zeros; cut-down re-timing is correct on a hand-made EDL.
5. **`docs/v4/AUDIO.md`**: the exact local commands, in order, for the owner's Mac (render score, foley, scratch voices, build the cue JSON, mix, export), what each reads and writes, and the checks to run.

`npx tsc --noEmit`, `zsh tools/checkRules.sh` and all tests (`tools/foley4` and any you add) must pass. Report as in C-common (no stills needed).
