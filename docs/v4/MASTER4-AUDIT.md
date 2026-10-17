# Master4: the one-sheet master and the hand-off audit (C1)

`Master4-wide` / `-tall` (`src/MasterFilm4.tsx`) are now one `EndlessSheet`, one `PencilLine` (chapter 1's geometry, detours included, for the whole film), one camera (`CAMERA` in `src/sheet4.ts`) for 600 s. Each chapter's `Art` is in its region through `<MasterRegion>` (`src/endless/MasterRegion.tsx`). Each chapter's `Overlay` mounts only inside its slot window, with module-local frames. The old back-to-back master is `Master4-series-wide` / `-tall`. `Master4Bounds-*` outlines the regions.

## How regions mount (level of detail)

| state of the chapter | region touches the viewport + 20% | zoom ≥ 0.15 | draws |
|---|---|---|---|
| not started | any | any | nothing |
| running | yes | yes | its `Art`, live |
| finished | yes | yes | its `Art` **held on its last frame** (frame and kit time both frozen; the camera stays live) |
| any | no, or zoom < 0.15 | | nothing (the far image carries it) |

The region PNGs in `public/tex/sheet/` are still the placeholder marks, so a finished region is its own art, held, not the PNG. Otherwise the camera would pass over placeholders (at 2:45 back over Maya's house, during the village over the launch map, and during the 9:30 pull-back). Once a chapter's `RegionAlpha` draws its finished state and `tools/renderSheetLod.ts` is re-run, add its id to `FINAL_REGION_IMAGES` in `MasterRegion.tsx`: the image then replaces the held art (contract 12.6).

## The audit

`npx tsx tools/masterAudit.ts` writes stills at end − 0.5 s, the last frame, the next first frame and next start + 0.5 s, for both formats, to `out/review/c1/boundary-NN-<from>-<to>-<format>.png` (not committed). Numerically (`cameraAt`, `headAt` at the frames either side of each boundary): `validateSheet4()` is clean, the camera moves ≤ 7.7 px/frame across every boundary (it eases to rest into each one), and the line's head moves ≤ 40 px. **No camera jump and no break in the line at any boundary.**

| # | boundary | verdict | fix |
|---|---|---|---|
| 1 | line → mayasHouse (0:30) | OK. The line finishes the house outline. The house's panels come up from 30.0 on the chapter's own beat. | none |
| 2 | mayasHouse → theNo (1:15) | OK. The line sits at the left edge in wide. In tall it is just off-frame (the head at x 7800, the view starts at 8000), so the boundary reads as empty paper for a moment. | none needed. Optional: theNo's first wide/tall key nearer the head |
| 3 | theNo → filterMachine (1:55) | OK, but weak: the camera arrives at (12600, 2900), above the line (y 4000 is off-frame), so the last 0.5 s of chapter 3 is blank paper until the tray appears at 1:55.0. | none applied (camera keys are the bible's). Suggest for the director: theNo's last key 40.0 at (12600, 3300) so the line stays in frame |
| 4 | filterMachine → researchBoard (2:50) | OK. The head is at the left edge; blank paper for about 0.5 s, then the board frame starts. | none |
| 5 | researchBoard → nameAndLook (3:55) | **Pop.** The names sheet (a blank page with a shadow) appears whole on 3:55.0. | **request, chapter 6** (below) |
| 6 | nameAndLook → engineRoom (4:50) | OK (z 0.45, the line at the left, the phone outline starts after 0.5 s). | none |
| 7 | engineRoom → launch (6:05) | **Pop.** The launch pad and the rocket appear whole on 6:05.0. The fast pan into them is smooth: no flicker between frames 10949 and 10950 apart from the pad. | **request, chapter 8** (below) |
| 8 | launch → village (6:55) | **Pop.** Dad's lit window (the binder home screen in the back wall) vanishes on 6:55.0. Village's Dad house is drawn over launch's (held) house, and the village house has no lit window. | **request, chapter 9** (below) |
| 9 | village → paperToGlass (8:10) | OK. The village is held under chapter 10's veil; the light conversion starts on the beat. | none |
| 10 | paperToGlass → providedFor (9:30) | Was a **pop** (the lit "Provisum 2" title cut to a grey glow). **Fixed at film level:** `OVERLAY_TAILS` in `MasterFilm4.tsx` keeps chapter 10's overlay mounted 1.0 s past 9:30, on top of chapter 11's, fading out (smoothstep). The title now dims over 9:30-9:31 as BIBLE4 §5.11 says. | applied (film level). Chapter 11 may take it over (below) |

### Fixes requested from chapter owners (not made: chapter folders are read-only for C1)

1. **Chapter 6, `src/chapters/nameAndLook`**: the names sheet must not be on the paper at local 0.0. Bring it in with the line, which reaches "the names sheet" at 4.5 (`LINE_ANCHORS.nameAndLook`). For example, multiply the page's opacity by `smooth(win(t, 0.0, 0.5))`, or draw its outline with `strokeDasharray` over 0.0-4.5 like the other hand-drawn frames. Check `Chapter-nameAndLook-*` frame 0 against `Master4-*` frame 7050.
2. **Chapter 8, `src/chapters/launch`**: `<Pad>` (the pad and the standing rocket) is fully drawn at local 0.0, but the line only reaches "the pad" (26200, 4400) at 3.0. Draw the pad's strokes on over 0.0-3.0 (`pathLength={1}` with `strokeDasharray={`${win({from: 0, to: 3}, t)} 1`}`, as `HouseScene` already does), and fade the rocket body in over 2.5-3.0.
3. **Chapter 9, `src/chapters/village`**: at local 0.0 the Dad house must still show launch's lit window. Copy the window block of `HouseScene` (`src/chapters/launch/Chapter.tsx`: `WINDOW` 27580, 3135, 40 x 30, `binder-home-dad-light.png`, the accent glow) into the village's Dad house, lit at 1.0. Dim it on a village beat (or keep it, if the house stays lit in chapter 9). Simpler alternative: draw the village houses only after launch's held art. That would mean the master draws chapter 8 above chapter 9, which hides village changes to that house, so I do not recommend it.
4. **Chapter 11, `src/chapters/providedFor`** (optional): if the owner wants the 9:30 dim in the chapter itself (so `Chapter-providedFor-*` shows it too), draw chapter 10's `TitleLayer` at t = 80 with opacity `1 - smooth(win(t, 0, 1.0))` in the Overlay. Then remove `paperToGlass` from `OVERLAY_TAILS`, or the title shows twice.

## Cost (cloud, 4 cores, swangle, one browser reused, `renderStill` wall time per still at 1080p, scale 1)

| master time | what | wide | tall |
|---|---|---|---|
| 2:50 (170) | hand-off filterMachine → researchBoard, several regions near | 1.5 s | 1.4 s |
| 5:00 (300) | engine room, laptop on paper | 2.6 s | 1.7 s |
| 7:20 (440) | a village visit at z 5, launch map held under it | 6.4 s | 4.4 s |
| 8:50 (530) | the glass (WebGL phone, Watch, pass) | 16.6 s | 13.8 s |
| 9:35 (575) | the pull-back at mid zoom, held launch + village + line | 5.8 s | 1.7 s |
| 9:41 (581) | the far view (z 0.045): line + far image | 1.5 s | 1.3 s |
| 9:50 (590) | the pencil and "Provided for." | 1.5 s | 1.5 s |
| boundary stills (80) | mean | 2.8 s | |
| 8:10, 9:30 | the slowest audit stills (glass + held village under the veil) | 8.8-10.3 s | 7.9-8.8 s |

Every sample is under the 20 s line, so no extra culling was needed beyond `MasterRegion`'s viewport and zoom culling. The glass (chapter 10's WebGL plus a cold video seek per still) is the expensive part, as it is in the chapter alone. A still pays ~1.5 s of page load that a video render does not, and a video render reuses its decoders; video renders were not measured (cloud rule).

Held regions re-run their pencil canvases every frame while in view. That is the cost the LOD images will remove. It was measured inside the numbers above (440 s and 575 s are the held-art cases).

## The 9:30 pull-back without LOD images

From 9:30 to about 9:36 (zoom 2.0 → 0.15) the camera passes over the real held art: the village, the launch map and rocket trail, and the line. The pull-back reads correctly while it is near. Below zoom 0.15 (from about 9:36 to 9:42, and the 12.0-15.0 dive back in) every region unmounts and the far image takes over. `far-done.png` is still the placeholder marks, so the whole-sheet view at 9:41 shows **only the unbroken line, with small grey placeholder ticks** where the chapters are. No chapter drawings appear, Between z 0.30 and 0.15 the region art fades out while the far image fades in (`farOpacity`; film-level fix in `MasterRegion`: it used to drop out in one frame at 0.15, in both pull-backs). The view needs `tools/renderSheetLod.ts` run on finished `RegionAlpha`/`FarAlpha` (the later wave) before it shows "every region finished".

## Checks

`npx tsc --noEmit` passes. `zsh tools/checkRules.sh` fails only on a line already on `main` that this branch does not touch: `docs/v4/briefs/C2-audio-plumbing.md:11` contains the banned identity word (in "each k… segment"). Fix for the owner of the briefs: change "the cues of each kept segment" to "the cues of each segment that stays".
