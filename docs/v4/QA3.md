# QA3: the cut-downs (wave F2)

Every cut-down in `src/edits4.ts` was looked at for the first time: HOOK_75, CUT_180 and the 11 chapter shorts.

## How

- **There is no v4 cut-down composition yet** (only v1's `src/edit/` player is registered, for `src/edits.ts`). So stills
  come from `Master4-tall` / `Master4-wide` at each segment's master time (chapter start + module-local time).
  `tools/cutdownFrames.ts` lists, per EDL: the first frame and +2 s, every join (segment end - 0.5 s, its last frame, the
  next segment's first frame and + 0.5 s) and the end (- 0.5 s, last frame). Contiguous slices of one chapter
  (`a.to === b.from`) are not picture joins and are skipped. `tools/motionDiff.ts` renders them and logs the change across
  each join. Contact sheets: `out/review/f2/Hook75-tall.png`, `Cut180-tall.png`, `Shorts-tall.png`; every still in
  `out/review/f2/Master4-<fmt>/<edl>/`; probes in `out/review/f2/probe*/` (not committed).
- Captions are not drawn on these stills (no v4 player). Caption timing was checked against v1's caption rules
  (`src/edit/captionTiming.ts`, which BIBLE4 §6 carries over): **a caption holds until the next caption of its segment
  or the segment's end, and carries on over following segments that have a `captionTone` and no captions.**
- Captions were compared with `VO4` (`src/beats4.ts`) and `docs/v4/CLAIMS.md`. VO lengths are the `estimatedEnd`
  estimates (2.3 words/s, Maya 2.0), checked for overlaps between consecutive lines in each EDL.
- `npx tsx tools/mix/edlCues4.ts`: valid, **no warnings** on the edited EDLs (run with `--out-dir` outside `audio/`).
- Cost: 196 tall stills (16:9 run started, not reviewed) + 26 probes, 2.74 s per still (tall, scale 0.5, swangle, alone on 4 cores).

## What changed in `src/edits4.ts`

Hook and cut keep their totals (75.0 s, 180.0 s). Shorts changed by at most 1 s, except Short-theNo (-6 s) and Short-line
(-4.5 s), whose trimmed ends were empty paper.

### HOOK_75 (9:16, 75 s): good after the fixes

| master s | was | now | why |
|---|---|---|---|
| 0:00.0-0:07.0 | line 0.0-7.0 | line 4.5-11.5 | frame 0 was **pure black** (line `black` 0-0.5) and +2 s a half-written "Ever"; now opens on the super just written, the line draws on to the calendar detour's hold |
| 0:34.0 | mayasHouse 4.0-11.0 | 4.0-11.5 | Y1 (est. 7.5 s) ran 0.5 s under F3 |
| 1:15.0 | theNo 0.0-10.0 | 0.5-10.0, odometer 4.5 | keeps 75 s; F3 still starts with the picture |
| 6:55.0 | village caption "Nobody looks after just one person." at +8.0 | full F14 at +1.0 | the voice ends at about +7.5: the caption appeared after the voice had stopped and said half of it |

Joins (tall): every join reads as a cut. Village +13.0 to paperToGlass 0.0 (7:08 to 8:10) was the weakest (same houses at a different zoom). G2: the tall village camera now holds [27600, 3380] zoom 2.0 through 13.0, the same as paperToGlass 0.0 (`out/review/g2/a4.png`); the Europe outline and the green form still appear at the cut. The 1.0 s of black before the title
(paperToGlass 68-70) is there. Ending: "Provisum 2" dimming (79.5-80): lands.

### CUT_180 (9:16, 3:00): good after the fixes

| master s | was | now | why |
|---|---|---|---|
| 0:00.0 | line 0.0-7.0 | line 4.5-11.5 | as the hook |
| 3:22-3:32 | researchBoard 30.0-40.0, caption "The gap: ..." | 32.0-42.0, no caption, no tone | the super "The gap: all of it, for everyone, privately." writes 38.0-41.0: the old cut at 40.0 showed it **half-written**; the caption repeated the super (no VO says it); its `captionTone` with no caption carried F6's caption over the board |
| 3:35-3:45 | researchBoard 45.0-55.0 | 45.0-53.0 | pays for the 2 s the rise needs (below) |
| 4:15-4:23 | nameAndLook 20-28 `captionTone: 'glass'` | no tone | carried F8's caption over the glass supers |
| 5:34 | M11 whole line | `cut` drops "Sharing goes straight to the people you invite." | the whole line runs about 2 s under F10 |
| 6:27-6:36 | launch 22.0-31.0, F12 at +4.0 | 23.0-32.0, F12 at +3.0, one sticky press at +4.0 | F12 ran 0.5 s under F14; the super "Day one: a mistake..." had not faded at 31.0; it has by 32.0 |
| 7:45 | village 50.0-60.0, caption "Five countries. Five languages." | 50.0-62.0, no caption, no tone | the super writes 57.0-59.8 and resolves to 60.8: the cut at 60 caught it unresolved; the caption repeated the super; the tone carried F14's caption over the rise |

Joins (tall): all read as cuts. G2: filterMachine now 0.5-7.5 (the hopper is drawn at 0.5; M1 and the fold stay at +0.0) and providedFor starts 14.5 (the pencil is in; F16 at +0.0, 0.5 s after the master) instead of 12.0 (far view, then bare paper at 14.0); researchBoard 45.0-55.5 (+2.5 s, boxes hold to 58) keeps 180.0. Ending: end card
with "Made by Veyago. Private by design.": lands.

### Chapter shorts (9:16)

Whole-chapter slices were split at each VO start (contiguous, so no picture join). Before, each short carried only one
VO line and one caption. Now every spoken line has its VO entry and, unless a super says it, its caption. Slices also
end a caption where a super begins.

| short | verdict | changes (module-local s) |
|---|---|---|
| Short-line (30 -> 25.5 s) | good | starts at 4.5 (0.0 black, then empty paper); F1 captioned in two parts (+2.5, +5.5); split at 20.0 so the caption ends before the title super |
| Short-mayasHouse (45 -> 43.5 s) | good (G2) | Y2 and F2 added with captions; splits 11.5 / 22 / 36. G2: ends at 43.5 (F2 ends about 43.4); 43.5-45 (empty paper) dropped. The house is gone by about 42.5, so 42.5-43.5 is the line leaving, retained for the voice |
| Short-theNo (40 -> 34 s) | good | 1.0-35.0 (0.0 empty, 36-40 carries the calendar off to empty paper); F4 and F5 added with captions |
| Short-filterMachine (47 -> 46 s) | good | starts 1.0 (hopper visible); M2 added (+0.5) with captions; the caption ends at 20.0 |
| Short-researchBoard (48 -> 47 s) | good (G2) | G2: starts 3.0 (the board and its pins; 0-3 is the frame edge), M3 3.0-4.5, M4 runs 4.5-22.0 (0.5 s behind its picture), the end is unchanged (the boxes hold to 58); M4 added under the question supers **without a caption** (four supers on screen); the "gap" caption removed (it repeated the super); M5 now captioned on its own slice |
| Short-nameAndLook (43 -> 42 s) | good | starts 1.0 (the names); F8 added (+1.0); the glass slice's `captionTone` removed (carried F7 over the glass supers) |
| Short-engineRoom (41 -> 40 s) | good (G2) | G2: starts 2.0 (the phone outline whole) and the first slice runs to 7.0 (before the dive); M9 and M11 captioned in full; M12 added; the closing 72-75 (folds to empty paper) replaced by 69-72 (build succeeded, the Simulator) |
| Short-launch (41 -> 40 s) | good (G2) | F11 and F12 added under the supers / sticky notes, without captions (the super and the notes are the copy). G2: starts 3.0 (the statuses) and finds 2 s at the end (Maya's window from 42.0, Y3 and its caption at +3.0) |
| Short-village (38 s) | good | F14 captioned in full; the "Five countries" caption removed (repeats the super) |
| Short-paperToGlass (43 s) | good | unchanged; opens on the lit village, ends on the title |
| Short-providedFor (30 s) | good | unchanged; opens on "Provisum 2" on black, ends on the end card |

## Captions vs. voice and claims

All captions now quote their VO line word for word (VO4 after E6), or a contiguous part of it, timed from the line's
start. Captions that repeated a super with no voice were removed. No new words, numbers or dates. Lines still on screen
that need the owner (CLAIMS.md): "21 September 2026" (A7), "On Behalf" (A10), "Your data lives on your phone and in your
own iCloud" (B21, verified), "No account. Nothing is collected." (B20), and the **"0 servers" number roll in the hook,
the cut and Short-paperToGlass** (B20: owner to decide the replacement).

Knowingly left: a caption under a super that says nearly the same thing while the voice speaks it (M5 under "Six
building blocks...", M11 under "No account. Nothing collected.", F2 under "And every family is bigger than its tree.",
F4 under "Keep the engine. Find a new reason."). The voice and the super overlap in the master too; dropping the caption
would leave the voice uncaptioned. Director's call.

## For the chapter owners (not changed: outside `src/edits4.ts`)

1. **Chapter 1, tall (fixed in G2: tall camera holds [770, 4000] to 7.5, then follows the head):** "Every app starts as a line." leaves the frame on the left from about 6.3 s as the camera follows
   the pencil (hook still 00195: "ts as a line."). Hold the tall camera on the super until 7.5 (`src/sheet4.ts`
   tall camera keys for `line`), or anchor the super inside the central column.
2. **Chapter 5, tall (fixed in G2: tall board camera centred on 16200):** "Six building blocks. Everything else hangs off them." is cut on the left at 53.0 (Cut180 still
   06689). Same fix: keep it inside the central 1080 px.
3. **Chapter 4, tall (fixed in G2: tall key at 35.0 is [12600, 4000] zoom 0.6):** the top gate label "Useful for years, not for a week" is cut by the top edge at 35.0 (hook still
   04500).
4. **A v4 cut-down player is needed** to render these EDLs (as `src/edit/` does for v1): register `Hook75-tall`,
   `Cut180-tall` and `Short-<id>-tall` from `EDLS4` in `src/previews4.ts` (owner of that file). Then re-check the joins
   with captions drawn.
5. **9:16 and 16:9:** every EDL is `format: 'tall'`, so 16:9 cut-downs do not exist yet; they would need their own EDL
   entries. The same frames were started in 16:9 (`out/review/f2/Master4-wide/`, numbers in `Master4-wide.jsonl`) but
   were **not reviewed by eye** within the cap. The judgements above are from the 9:16 stills.
