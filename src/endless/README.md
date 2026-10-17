# Endless sheet (`src/endless`)

One sheet of paper (`SHEET`, 40 000 x 8 000 logical px, the paper itself never ends), one unbroken pencil line, one camera that never cuts. Direction: `docs/v4/BIBLE4.md` §1-2. Numbers: `src/sheet4.ts`. Import from `src/endless` (the barrel).

## Use

```tsx
<EndlessSheet overlay={<PencilLine />}>          // master time = useCurrentFrame()/30; startSeconds / chapterId shift it
  {SLOTS4.map((s) => <SheetRegion key={s.id} id={s.id}><MyChapter /></SheetRegion>)}
</EndlessSheet>
```

- **`<EndlessSheet>`** props: `children` (the `<SheetRegion>`s, drawn in sheet space under the camera), `overlay` (screen-space layers: the `PencilLine`, screen supers), `startSeconds` or `chapterId` (master time of frame 0; for a chapter alone use `chapterId`), `showBounds`. It draws the paper (seamless: the albedo tile is anchored to the sheet origin and fades to its mean colour once its tile is under ~160 px), a faint lamp falloff in screen space, the far image, and provides the camera.
- **`<SheetRegion id>`** places a chapter at `REGIONS[id]`. Children are in **region-local px** (origin = region top-left) and see **module-local time** (they sit in a `<Sequence>` at the chapter's slot). Mode by `regionMode()`:
  `culled` (bounds miss the viewport grown by 20% of its size per side, or zero area) · `live` (chapter running, zoom ≥ LOD.far: children mounted; they read `useSheetCamera().lod` to swap static parts for `regionImageFile(id)`) · `image` (chapter finished: its PNG, cropped via `lodManifest.ts`) · `empty` (not started, or far zoom).
- **`useSheetCamera(chapterId?)`** → `{centre, zoom, lod, viewport, format, width, height, masterSeconds, localSeconds, toScreen(p)}`. Pass `zoom` to `GraphiteSketch`/`PencilCanvas` so grain stays crisp.
- **`cameraAt(format, masterSeconds)`** → `{centre, zoom}`, pure (tools, stills, `PencilLine`). `cameraInChapter(format, id, local, master)` for chapter-local use. Centre and zoom share one easing per span; zoom is blended in log space; a `'head'` key follows `headAt(master)` plus its lead (head-to-point spans blend between the two).
- **`<PencilLine geometry? inkAt? />`**: one path through all 11 regions from `LINE_ANCHORS` (straight runs, corners filleted ≤ 40 px, the v1 wobble 0.8 px / 0.03 per px, resampled every 1.5 px, pressure and width factors from the engine's `shapeMark`, pressure dip 0.7 while it writes the chapter-1 super). Revealed by master time, the fresh-lead tip at the head, a dab at 0:00.5. Screen width is `LINE_WIDTH` (3 wide, 2 tall, never under 1.5) at every zoom. Per frame only the visible stretch is resampled to ~1.5 SCREEN px, so cost does not grow with zoom; the paper grain it is deposited on is anchored to the sheet (it travels with the paper). The line is drawn live at every zoom (it is the one thing that is).
  - Ink: `inkAt(master)` returns `'graphite' | 'accent' | 'sepia'`, evaluated at the time each length was drawn; default `voiceInkAt` = the voice speaking (`voiceAt`), graphite when nobody speaks. Voice changes crossfade over 40 screen px. **Sepia is a stub** until S1-B adds it to `src/paper/types.ts`: it is deposited as graphite on its own canvas and recoloured to `INK4.sepia` multiplied onto the paper (`inks.ts`); swap for the engine's own ink then.
  - `geometry`: chapter 1 owns the detours (heart rate, calendar, passport, key). Build a geometry with `buildLine(anchors)` (`masterAnchors()` + extra points) and pass it in.
  - Zero-time moves in the anchors (the 90 px super rise) are given 90/600 s, borrowed from the run before. The last chapter's pick-up from the parked glass point (27600, 3420) to (28800, 3300) is added as an anchor at 9:30 (`GLASS_PARK` in `lineGeometry.ts`).

## The master (`src/MasterFilm4.tsx`, `<MasterRegion>`)

`Master4-*` is one `EndlessSheet` with every chapter's `Art` in a **`<MasterRegion id>`** and every `Overlay` in its slot window (module-local frames). `MasterRegion` is `SheetRegion` for the whole film: live while the chapter runs; once it is finished, its art is **held on its last frame** (frame and kit time frozen, the camera live) until its PNG is real (`FINAL_REGION_IMAGES`); culled outside the viewport + 20% and below zoom 0.15, fading out over 0.30 → 0.15 as the far image fades in. Audit, costs and requested chapter fixes: `docs/v4/MASTER4-AUDIT.md`; stills: `npx tsx tools/masterAudit.ts`.

## Level of detail (BIBLE4 §1.6)

| zoom | live | images |
|---|---|---|
| ≥ 0.6 near | active chapter (children), the line | finished regions: `public/tex/sheet/<chapterId>.png` |
| 0.15-0.6 mid | active chapter (children decide what moves), the line | same; the far image fades out between 0.15 and 0.30 (`farOpacity`) |
| < 0.15 far | the line only | `far-rough.png` (glimpses) until 9:30, then `far-done.png` (1/8 scale, 5000 x 1000) |

A finished region never re-runs the pencil canvas. Region PNGs are 2x and **trimmed to their drawn pixels** (a decoded 7200 x 4400 PNG is 126 MB and failed to decode in headless Chrome); the crop lives in the generated `lodManifest.ts`. Regenerate after any chapter change:

```
FILM_GL=swangle npx tsx tools/renderSheetLod.ts [chapterId | far-rough | far-done ...]
```

It stills `SheetRegionAlpha-<id>` (scale 2) and `SheetFarAlpha-<variant>` (scale 1) from `lodImages.tsx`. `RegionAlpha` draws each chapter's `Art` held on its last frame; `far-done` is composed by the tool from the region PNGs; sizes and the exact command: `docs/v4/LOD.md`. `paperToGlass` has no area and no image.

## Compositions and proofs

`Sheet4-wide` / `Sheet4-tall` (600 s: placeholder marks, the line through all 11 regions, `CAMERA` for the whole film), `Sheet4Bounds-*` (regions outlined), `SheetRegionAlpha-<id>`, `SheetFarAlpha-<variant>`.

```
FILM_GL=swangle FILM_BROWSER=<chrome> npx tsx tools/sheetProof.ts [--scale=2] [--times=18,570] [--only=wide|tall] [--out=out/review/s1a]
```

Default times: every chapter start, 0:18, 0:22, 9:30, 9:41, 9:59. `FILM_BROWSER` points Remotion at an installed Chromium (cloud: `/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`).

## Measured (cloud, 4 cores, software GL; `renderStill`, Sheet4-wide, one browser reused, whole-still wall time including page load)

| level | time | scale 1 | scale 2 |
|---|---|---|---|
| near (t = 10 s, z 1.0, line + live mark) | | 2.15-2.2 s | 3.2 s |
| mid (t = 300 s, z 0.9 with two finished regions as images; 490 s, z 2.0, several images) | | 2.0-2.2 s | 3.3-3.5 s |
| far (t = 22 s, z 0.048, far image + 1 500 line points) | | 1.65-1.75 s | 2.25-2.5 s |
| the same frame with nothing but paper (t = 0, z 1.6) | | 2.1 s | 3.7 s |

The engine and line cost is small next to Remotion's per-still page load (~1.5-2 s here): the line adds roughly 0.1-0.3 s at 1x. Real per-frame cost in a video render is lower than a still (the page stays loaded) and was not measured: cloud rules forbid video renders.

## Known limits

- The pull-back's mid zoom shows the far image and the region images together (both fade/cross at 0.15-0.30); with real chapters check for ghosting.
- Tooth scale is clamped to zoom 0.5-1.5 (so grain stays pencil-sized when the paper is far or near); the paper relief itself scales with zoom.
- Tall `0:18` / `9:30` pull-backs show the whole sheet width at z 0.027: the placeholder marks are tiny there by design (real chapters bring their glimpses).
