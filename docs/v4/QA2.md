# QA2: motion QA, flicker and pops (wave F1)

Everything before this was judged from single stills. This pass looks only at what motion shows, without video: runs of
consecutive frames of `Master4-wide` and `Master4-tall`, compared by number and by eye.

## Method

- `tools/motionDiff.ts` renders runs of frames with one bundle and one browser (`FILM_GL=swangle`, scale 0.5), then for each
  neighbouring pair reports the **difference ratio**: the share of pixels whose largest channel changed by more than 12/255
  (above paper grain), with the bounding box of the change. `--compare a.png b.png` also reports the whole-frame shift
  that best explains a change (a non-zero shift with a large ratio is a camera jump).
- Each ratio is read against the camera: `cameraAt()` (src/endless/camera.ts) for both frames gives the camera step in screen
  px and the zoom change. **A large ratio with a still camera, on frames where nothing is drawn to move, is a defect
  candidate**; those were opened and looked at (diff images amplified 6-8x).
- The whole camera path was also sampled every frame in both formats (18,000 x 2) for jumps (a change in per-frame speed
  above 25 screen px) and LOD crossings: **no camera jump anywhere**, including all 10 chapter boundaries.
- Determinism: the same frame rendered twice is identical (0.00%), so a change between neighbours is the film, not the
  renderer.
- Per-frame randomness: no `Math.random`, and no `random()` seeded by frame or time, in `src/chapters`, `src/kit`,
  `src/popup`, `src/endless`, `src/characters` or `src/paper` (the only frame-seeded `random()` is v1's `FilmGrain`, unused in v4).

Cost: 238 wide + 176 tall stills for the survey, about 30 more for probes and the after pairs. Render time **3.15 s per
still** (wide, scale 0.5, swangle, alone on 4 cores); 7.7-10.5 s per still when two renders ran at once. Stills in
`out/review/f1/` (not committed): `before/<comp>/<moment>/fNNNNN.png`, `before/<comp>.jsonl` (every pair), `after/`, `probe/`.

## Fast camera moves (zoom > 2x within 3 s)

From the camera sample (wide; tall is the same within 0.1 s): 0:16.7 and **0:19.8 (9.6x)**, 0:24.6 and **0:27.6 (9.0x)**,
2:44.2, 2:47.2, 4:13.7, 4:43.7, 4:46.8, 6:39.8, **6:42.9 (3.4x)**, 7:05.3, 7:44.4, **7:47.5 (2.5x)**, 7:56.0, 9:28.0,
**9:31.1 (6.3x)**, 9:37.5, **9:40.6 (4.3x)**, **9:43.6 (3.4x)**. The four LOD crossings (0.30 and 0.15) inside them were
rendered frame by frame (rows c1-pullback-lod, c1-pushin-lod) and cross-fade smoothly; the zoom 0.300 at 2:48.0 touches
the threshold for one frame without crossing it (no visual effect: `farOpacity(0.30) = 0`).

## Checked moments

Ratio columns: the neighbouring pair with the largest change in that run (wide / tall; `n/r` = not rendered in tall), and
the largest change across spaced frames (N+3, N+6, N+30...) in wide. Labels: `cutN` = chapter boundary N, `cK-...` =
chapter K. Frames are master frames at 30 fps.

| moment | master | frames | adjacent max (wide / tall) | spaced max (wide) | verdict |
|---|---|---|---|---|---|
| cut1-mayasHouse | 0:29.93 | 898, 899, 900, 901 | 898->899: 0.78% / 0.39% | - | ok: line and camera continuous (camera step 2.2 px, no jump) |
| cut2-theNo | 1:14.93 | 2248, 2249, 2250, 2251 | 2250->2251: 0.25% / 0.22% | - | ok: motion where motion is drawn, nothing else changes |
| cut3-filterMachine | 1:54.93 | 3448, 3449, 3450, 3451 | 3450->3451: 0.73% / 0.73% | - | ok: motion where motion is drawn, nothing else changes |
| cut4-researchBoard | 2:49.93 | 5098, 5099, 5100, 5101 | 5100->5101: 0.02% / 0.02% | - | ok: motion where motion is drawn, nothing else changes |
| cut5-nameAndLook | 3:49.93 | 6898, 6899, 6900, 6901 | 6900->6901: 1.56% / 0.83% | - | ok: motion where motion is drawn, nothing else changes |
| cut6-engineRoom | 4:49.93 | 8698, 8699, 8700, 8701 | 8698->8699: 0.03% / 0.00% | - | ok: motion where motion is drawn, nothing else changes |
| cut7-launch | 6:04.93 | 10948, 10949, 10950, 10951 | 10948->10949: 0.12% / 0.00% | - | ok: planned camera move (18 px/frame), no jump |
| cut8-village | 6:54.93 | 12448, 12449, 12450, 12451 | 12449->12450: 11.06% / 6.80% | - | **DEFECT, fixed in code (PNG re-render owed):** Dad's house drawn twice (launch.png + village live): shadow 148->111 grey, Maya twice. After: 0.05% / 0.05% |
| cut9-paperToGlass | 8:09.93 | 14698, 14699, 14700, 14701 | 14699->14700: 5.66% / 5.22% | - | ok: camera settling 0.3 px; hatching and the pencil line re-rasterise (sub-pixel crawl, not re-seeded randomness: same frame renders identically) |
| cut10-providedFor | 9:29.93 | 17098, 17099, 17100, 17101 | 17098->17099: 0.00% / 0.00% | - | ok: motion where motion is drawn, nothing else changes |
| c3-roll-4.3a | 1:20.00 | 2400, 2401, 2403, 2406, 2415, 2430 | 2400->2401: 0.01% / n/r | 0.18% | ok: motion where motion is drawn, nothing else changes |
| c3-roll-date | 1:45.50 | 3165, 3166, 3168, 3171, 3180, 3195 | 3165->3166: 0.08% / 0.08% | 0.74% | ok: motion where motion is drawn, nothing else changes |
| c3-crumple | 1:25.50 | 2565, 2566, 2568, 2571, 2595, 2596 | 2595->2596: 0.72% / 0.56% | 13.67% | ok: crumple |
| c3-scissors | 1:35.50 | 2865, 2866, 2868, 2871, 2895, 2896 | 2865->2866: 0.83% / n/r | 2.00% | ok: motion where motion is drawn, nothing else changes |
| c3-pagedrop | 1:43.40 | 3102, 3103, 3105, 3108 | 3102->3103: 4.99% / n/r | 6.01% | ok: the page falls (best whole-frame shift 0,3 px = the drop) |
| c3-super | 1:28.00 | 2640, 2641, 2655, 2656, 2700, 2701 | 2640->2641: 0.03% / n/r | 7.86% | ok: write-on and resolve, no glyph pop |
| c4-popup | 1:55.50 | 3465, 3466, 3468, 3495, 3496, 3525, 3526 | 3525->3526: 5.65% / 7.76% | 27.47% | ok: the machine folds up |
| c8-rocketfold | 6:06.00 | 10980, 10981, 10983, 11010, 11011 | 11010->11011: 0.10% / n/r | 0.14% | ok: motion where motion is drawn, nothing else changes |
| c8-launch | 6:15.00 | 11250, 11251, 11253, 11310, 11311, 11370, 11371 | 11370->11371: 2.79% / 1.90% | 4.45% | ok: lift-off and map |
| c9-houses | 6:56.00 | 12480, 12481, 12525, 12526, 12570, 12571, 12615, 12616 | 12525->12526: 9.04% / 5.61% | 56.25% | ok: pull-back while houses pop (each fades in over 0.25 s before it folds) |
| c10-fold | 8:18.00 | 14940, 14941, 14970, 14971, 14985, 14986, 14999, 15000 | 14999->15000: 15.72% / 30.80% | 14.25% | ok: the fold and the first snap (flare frame 15000 is the designed snap) |
| c10-snap1 | 8:19.97 | 14999, 15000, 15001, 15009, 15010 | 14999->15000: 15.72% / 30.80% | 7.40% | ok: designed one-frame snap with edge flare, then the clip plays (flare frame is the max) |
| c10-snap2 | 8:21.47 | 15044, 15045, 15046, 15054, 15055 | 15044->15045: 14.32% / n/r | 1.96% | ok: designed one-frame snap with edge flare, then the clip plays (flare frame is the max) |
| c10-snap3 | 8:22.97 | 15089, 15090, 15091, 15099, 15100 | 15089->15090: 10.12% / n/r | 6.77% | ok: designed one-frame snap with edge flare, then the clip plays (flare frame is the max) |
| c10-snap4 | 8:24.47 | 15134, 15135, 15136, 15144, 15145 | 15134->15135: 15.02% / n/r | 7.91% | ok: designed one-frame snap with edge flare, then the clip plays (flare frame is the max) |
| c10-snap5 | 8:25.97 | 15179, 15180, 15181, 15189, 15190 | 15179->15180: 8.62% / n/r | 1.35% | ok: designed one-frame snap with edge flare, then the clip plays (flare frame is the max) |
| c10-snap6 | 8:27.47 | 15224, 15225, 15226, 15234, 15235 | 15224->15225: 12.68% / n/r | 11.67% | ok: designed one-frame snap with edge flare, then the clip plays (flare frame is the max) |
| c10-snap7 | 8:28.97 | 15269, 15270, 15271, 15279, 15280 | 15269->15270: 10.59% / n/r | 5.97% | ok: designed one-frame snap with edge flare, then the clip plays (flare frame is the max) |
| c10-snap8 | 8:30.47 | 15314, 15315, 15316, 15324, 15325 | 15314->15315: 15.07% / n/r | 1.21% | ok: designed one-frame snap with edge flare, then the clip plays (flare frame is the max) |
| c10-snap9 | 8:31.97 | 15359, 15360, 15361, 15369, 15370 | 15359->15360: 11.58% / 22.74% | 1.12% | ok: designed one-frame snap with edge flare, then the clip plays (flare frame is the max) |
| c10-roll1 | 8:51.97 | 15959, 15960, 15961, 15963, 15966, 15972, 15973 | 15959->15960: 7.43% / 6.46% | 0.72% | ok: the last frame of a smooth 0.5 s devices fade (mean luma 25.6, 21.8, 11.5, 4.2, 2.3, 1.5) |
| c10-roll2 | 8:53.47 | 16004, 16005, 16006, 16008, 16011, 16017, 16018 | 16004->16005: 0.70% / 0.70% | 0.70% | ok: number roll, steady 0.3-0.7% per frame |
| c10-roll3 | 8:54.97 | 16049, 16050, 16051, 16053, 16056, 16062, 16063 | 16050->16051: 0.63% / 0.63% | 0.74% | ok: number roll, steady 0.3-0.7% per frame |
| c10-roll4 | 8:56.47 | 16094, 16095, 16096, 16098, 16101, 16107, 16108 | 16095->16096: 0.68% / 0.68% | 0.73% | ok: number roll, steady 0.3-0.7% per frame |
| c10-hardstop | 9:17.93 | 16738, 16739, 16740, 16741 | 16739->16740: 6.18% / 9.37% | - | ok: picture to pure black in one frame (frame 16740 max pixel 0) |
| c10-title | 9:23.00 | 16890, 16891, 16893, 16896 | 16890->16891: 0.00% / 0.00% | 0.00% | ok: motion where motion is drawn, nothing else changes |
| c11-dim | 9:30.50 | 17115, 17116, 17118, 17121, 17145, 17146 | 17145->17146: 2.25% / 1.51% | 100.00% | ok: title on near-black; the 6x pull-back from 9:31 changes most pixels by design |
| c11-pass | 9:34.00 | 17220, 17221, 17223, 17226, 17340, 17341, 17460, 17461 | 17340->17341: 2.91% / 1.75% | 5.86% | ok: ending pass, smooth (no frame above 3% between neighbours) |
| c11-dive | 9:42.00 | 17460, 17461, 17463, 17490, 17491, 17520, 17521, 17550, 17551 | 17490->17491: 2.12% / 0.85% | 2.43% | ok: dive to the pencil, smooth; lands still at 585.0 (0.00%) |
| c1-pullback-lod | 0:19.90 | 597, 598, 599, 600, 601, 602, 603 | 600->601: 2.36% / 1.16% | - | ok: region -> LOD image cross-fade over frames 598-603 (zoom 0.29->0.146), 0.6-2.4% per frame, no spike |
| c1-pushin-lod | 0:27.87 | 836, 837, 838, 839, 842, 845 | 838->839: 2.36% / 1.09% | 2.42% | ok: LOD 0.15 crossing at frame 836, 2.0-2.4% per frame, no spike |
| c1-super | 0:01.50 | 45, 46, 75, 76, 135, 136 | 45->46: 0.07% / 0.04% | 0.52% | ok: write-on 1.5-4.5, resolve at 4.5: 0.04% (no glyph pop) |
| c9-super | 7:52.00 | 14160, 14161, 14190, 14191, 14250, 14251 | 14160->14161: 0.27% / 0.18% | 1.21% | ok: write-on, no glyph pop |

Not rendered as runs (cost): the ScreenOnPaper poster-to-video swap in chapters 6 and 7 (the snaps of chapter 10 are the
same component path and were clean), the resolve-to-DM-Sans of the supers in chapters 5, 7 and 8 (the three that were
checked, chapters 1, 3 and 9, show no glyph pop), chapter 3's scissors (wide only, clean).

## Defects

### D1. Dad's house is drawn twice from 6:55 (chapter 8 to 9): FIXED IN CODE, image re-render owed

- **What motion shows.** At 6:55.0 (frame 12449 to 12450) 11.06% of the wide picture (6.80% tall) changes in one frame
  with the camera still: the shadow under Dad's house jumps from grey 148 to warm 111 and Maya in the window is redrawn
  a few px off. It then stays doubled for the whole of chapter 9 and after (Dad's house in every later pull-back).
- **Why.** The launch chapter draws Dad's house (`VillageHouse` + `DadWindow`) live. At 6:55 launch is finished, so
  `MasterRegion` shows its frozen image `public/tex/sheet/launch.png`, which contains that house; the village chapter
  then draws the same house live on top. Two lamp shadows stack (darker and warmer), Maya is drawn twice.
- **Fix (committed).** `RegionAlpha` (src/endless/lodImages.tsx) now marks its sheet context `regionImage: true`
  (new optional field in src/endless/sheetContext.ts); launch's `HouseScene` (src/chapters/launch/Chapter.tsx) skips the
  house and the window when that flag is set, keeping the ground line. The live film is unchanged until the image is
  re-rendered; chapter 9's live house and `village.png` carry the house from 6:55 on.
- **Proof.** With `launch.png` and `far-done.png` re-rendered locally: frame 12449 to 12450 **0.05% wide, 0.05% tall**
  (was 11.06% / 6.80%); the remaining 0.05% is Maya's figure in the window (drawn at another zoom). Before/after:
  `out/review/f1/before/Master4-<fmt>/cut8-village/`, `out/review/f1/after/Master4-<fmt>/cut8-village/`.
- **Owed (outside F1's folders).** Re-run and commit the images, then check `src/endless/lodManifest.ts` (it did not change
  locally):
  `FILM_GL=swangle FILM_BROWSER=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell npx tsx tools/renderSheetLod.ts launch far-done`
  (changes `public/tex/sheet/launch.png` and `public/tex/sheet/far-done.png`).

### Looked at, not defects

- 8:09.93-8:10.0 (chapter 9 to 10): 4-6% per frame. The camera is still settling by 0.3 px; the fine hatching and the
  pencil line re-rasterise. Same frame renders identically, so it is sub-pixel crawl from the camera, not jitter from
  randomness. At 1x this is a fraction of a pixel; acceptable.
- 8:51.97-8:52.0: the dimmed devices "disappear" as the first number roll starts. Measured as the end of a smooth 0.5 s
  fade (`devicesOut` 41.5-42.0), mean luma 25.6, 21.8, 11.5, 4.2, 2.3, 1.5. No pop.
- The nine snaps (8:20.0-8:32.0): the screen appears whole in one frame with the edge flare. Designed (`snapSeconds` 0.3).
- 8:10 + 68.0: picture to pure black in one frame, frame 16740 has max pixel value 0. Correct.

## Still weak (not proven defects, for the owners)

- The houses' fine hatching crawls whenever the camera moves by a fraction of a pixel (visible as 4-6% "change" on near-
  still frames, chapters 9 and 10). If it shimmers on the Mac render at 4K, the hatch stroke width in
  `src/chapters/launch/houseArt.tsx` could be raised slightly; not changed here (no proof at 1x, and it is a look change).
- The 6.3x pull-back at 9:31 and the 9.6x pull-back at 0:19.8 are the fastest moves in the film (13-15% zoom per frame at
  their peak). They are smooth by number; whether they feel too fast needs a real playback on the Mac.
