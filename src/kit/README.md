# The shared chapter kit (`src/kit`)

The few pieces every chapter needs, built once: `<Super>`, `<NumberRoll>`, `<ScreenOnPaper>` and the chapter template (`ChapterShell`, `useChapter`). Direction: `docs/v4/BIBLE4.md` §1.6, §3 and the §5 preamble. Import from `src/kit` (the barrel; `../../kit` from a chapter folder).

**One coordinate rule:** kit pieces take **SHEET px** (the bible's numbers, e.g. "baseline y 3880, from x 290"). Inside a `ChapterShell` (or `KitRegion`) they convert to region-local px themselves. Outside one (the demo, a plain composition) the numbers are the parent's px. Times are **module-local seconds** wherever the piece sits: in the region's art, where the frame is already local, or in the screen-space overlay, where it is not. Every piece also takes `time` to override the clock.

## `<Super>`

```tsx
<Super text="Keep the engine. Find a new reason." ink="graphite" start={13} anchor={{sheet: [9000, 3500], align: 'centre'}} hold={4} />
<Super {...superFromBeat(SUPERS.theNo[0], {sheet: [9000, 3500], align: 'centre'})} />      // straight from beats4
<Super text="Dad's insurance" ink="sepia" start={11.5} hold={1.7} fadeOut={0.3} anchor={{screen: 'lower-third'}} />
```

- The pencil writes the text in the ink's hand (the engine's lettering: Caveat 500 at 72/56 of the type size, glyph by glyph, with the fresh-lead tip). It then **resolves in place** to DM Sans 500 over `resolve` (default 1.0 s): the handwriting fades as the type weighs in. Line breaks are the same in hand and type, so nothing jumps.
- `ink`: `graphite | accent | sepia` (voice inks, BIBLE4 §3 rule 3), or `glass` (glassWhite 92%, type only, for screens and the void).
- `write`: default 11 characters a second, clamped to 1.5-3.0 s (the bible's write windows). `0` = type only, fading in over 0.5 s.
- `hold`: how long the resolved type stays (default: forever); `fadeOut` 0.5 s. `superFromBeat` derives `hold` from a beats4 `dur`, so the super is gone exactly at `t + dur`.
- `size` is the DM Sans size. `maxWidth` wraps (default 1000 sheet px, inside the 1080 central column; 0.84 W on screen).
- **Sheet or screen (decided per BIBLE4 §5):**
  - `anchor: {sheet: [x, y], align}`: the super is **written on the paper**. Put it in the chapter's `art`. It scales with the camera, because it is on the paper and the camera may move during it. The bible's 56 sheet px read as 42-50 screen px at the working zooms (0.75-0.9) and 25 px at the engine room's overview (0.45), so keep engine-room supers to the floor keys, as the bible does. For a nested region (the village, z 2.0) the bible gives sizes in screen px: divide by the working zoom (56 screen px = `size={28}`).
  - `anchor: {screen: 'super' | 'lower-third' | 'glass-lower-left' | {x, y, align}}`: the super is **over the frame**. Put it in the chapter's `overlay`. Fixed size, type only by default. The presets come from the bible: `super` is 0.5 W, baseline 0.80 H (0.76 H tall), 64/52 px, graphite 90%. `lower-third` is 0.08 W, 0.84 H (0.80 H tall), 40 px. `glass-lower-left` is 0.06 W, 0.86 H, 44 px. A multi-line screen super grows upwards from its baseline.
- `superCues(props)` gives the writing as a `stroke` cue for the chapter's `cues.ts`.

## `<NumberRoll>`

```tsx
<NumberRoll to="4.3(a)" start={5} duration={1} at={[9000, 4500]} align="centre" size={64} />
<NumberRoll to="6 kinds of people" start={42} duration={0.4} ink="glass" weight={700} size={200} at={[960, 600]} />
```

- Every digit of `to` turns on its own wheel, from the matching digit of `from` (right-aligned; default 0). The rightmost wheel makes two extra turns and the next two make one, like a counter. The wheels start left to right over the first 35% and **all land together** at `start + duration` (ease-out). Non-digits (`.`, `(a)`, `September`, `kinds of people`) stand still. While a wheel turns, its digits fade toward the slot's edges (a drum seen through a window).
- DM Sans with tabular figures, so nothing shifts as the digits change. `ink` defaults to accent (`graphite | sepia | glass` also). `weight` 400/500/700. `at` is the baseline point; `align` is left, centre or right.
- `fadeIn` (default 0.3 s, ending at `start`); `hold` and `fadeOut` to take it away. `numberRollCue(p)` gives the `odometer` window. `odometer` is a v4 `NewSfxName`: the integrator adds it to `cues.ts`.

## `<ScreenOnPaper>`

```tsx
<ScreenOnPaper device="laptop" source={footageClip('onboarding-question')} at={[23400, 3050]} scale={0.52} drawStart={6} />
<ScreenOnPaper device="phone" source={footageClip('onboarding-welcome')} at={[23750, 3050]} drawStart={69.5} drawDuration={1} playFrom={3.5} />
```

- The frame is drawn by the pencil with the engine's hand shapes (`handRect`/`handLine`/`handCircle`): a rough first pass, then the clean line, with the hand wobble and the overshoots. It draws on over `drawDuration` (default 1.5 s), and the screen content fades in when it finishes (`contentStart`, `contentFade` 0.5 s).
- **Phone** (`scale` 1 = 200 px wide, BIBLE4 §5.7): the screen takes the source's exact aspect. The film's clips are 1206 x 2622, so the phone is 200 x 416 and the clip fills it (`cover`), Dynamic Island and all. The frame has side buttons.
- **Laptop** (`scale` 1 = 1080 px wide at the base, as in §5.6; the screen is 900 x 562 at 16:10, change it with `screenAspect`): a lid with bezels and a camera dot, a base slab with a thumb notch. **No logo, no notch, no menu bar** (contract 13.5). Content is `contain`ed on #0B0B0C by default. That is right for phone-shaped clips; pass `fit="cover"` and the clip's aspect as `screenAspect` for the Xcode captures.
- **Sources** come from the manifests, never re-typed: `footageClip(id)` (either manifest; video, hot window, poster), `footageStill(id)` (the poster or a still entry), `stillSource(path, w, h)` (any image under `public/`). `ask-about-mom` throws (contract 12.1).
- **Level of detail:** the clip decodes (`OffthreadVideo`, muted, from `playFrom` = the manifest's `hotStart`) only when `near`. The default is the sheet's LOD being `near`. At mid and far zoom the screen shows the clip's **poster**. The clip's second 0 is `contentStart`. Past the end of the clip the screen is empty, so keep the screen's on-time within the clip.

## The chapter template

Folder layout (see `ChapterModule` in `src/chapters/registry.ts`):

```
src/chapters/<id>/
  index.ts      export {Chapter, Art, Overlay} from './Chapter'; export {cues} from './cues'; export {previews} from './previews';
  Chapter.tsx   Art (sheet space), Overlay (screen space), Chapter = <ChapterShell id art overlay />
  cues.ts       export const cues: ModuleCues = [...]   (the COMPLETE foley list, module-local seconds)
  previews.ts   export const previews: readonly PreviewSpec[] = [...]   (extra stills/compositions; optional)
```

```tsx
// Chapter.tsx
import React from 'react';
import {SUPERS} from '../../beats4';
import {ChapterShell, NumberRoll, Super, superFromBeat, useChapter} from '../../kit';

export const Art: React.FC = () => {
  const {t, between, camera} = useChapter('theNo');          // module-local seconds, 0-1 windows, the camera
  return (
    <>
      {/* region art: kit pieces in SHEET px; plain elements in region-local px; pass camera.zoom to engine canvases */}
      <NumberRoll to="4.3(a)" start={5} duration={1} at={[9000, 4500]} align="centre" />
      <Super {...superFromBeat(SUPERS.theNo[0], {sheet: [9000, 3500], align: 'centre'})} />
    </>
  );
};
export const Overlay: React.FC = () => null;                    // screen supers, lower-thirds
export const Chapter: React.FC = () => <ChapterShell id="theNo" art={<Art />} overlay={<Overlay />} />;
```

```ts
// cues.ts
import type {ModuleCues} from '../../audio/cues';
import {superCues} from '../../kit';
export const cues: ModuleCues = [...superCues({text: '…', ink: 'graphite', start: 13, anchor: {sheet: [9000, 3500]}}), /* … */];
```

- **`ChapterShell`** renders the chapter alone, for its `Chapter-<id>-wide/-tall` preview with module-local frames. It shows the endless sheet at this chapter's camera (`CAMERA` in `sheet4.ts`), the other regions (their PNG once finished), the unbroken `PencilLine` (pass `line={{geometry}}` for chapter 1's detours, or `line={false}`), `art` inside `<SheetRegion>` and `overlay` in screen space. Both layers are in kit scope.
- **`useChapter(id)`** → `{t, between(from, to), during(from, to), camera, isTall}`. It works in the art and the overlay alike. `camera` is `useSheetCamera(id)`: centre, zoom, `lod`, format and `toScreen`.
- **`KitRegion` / `KitOverlay`** are what the shell uses. The integrator's master film puts every chapter's `Art` in a `KitRegion` and its `Overlay` in a `KitOverlay` on one `EndlessSheet`. That is why a chapter exports `Art` and `Overlay` as well as `Chapter` (both optional fields of `ChapterModule`).
- **Level of detail:** the art mounts only while the chapter runs and the zoom is near or mid. Read `camera.lod` to swap moving parts for still ones at mid zoom. When the chapter is final, make `RegionAlpha` (`src/endless/lodImages.tsx`) draw its finished state and regenerate the PNG (`src/endless/README.md`).
- No stub was replaced as a worked example (it would have cost more than the $2 limit). The demo below exercises the same context path.

## Proof

`Kit-demo-wide` / `Kit-demo-tall` (12 s, `src/kit/demo/KitDemo.tsx`): paper under a parked camera (zoom 1, LOD near, through the same `SheetContext` the endless sheet provides).
- Three sheet supers write and resolve, one per ink: graphite at 0.5 s, accent at 2.5 s, sepia at 4.0 s (two lines).
- `4.3(a)` rolls 5.0-6.0 and `21 September 2026` rolls 7.0-8.5.
- A laptop (`onboarding-question`) and a phone (`binder-switcher-family`) draw 0.5-2.5 s and play the real clips.
- A screen-space sepia lower-third appears at 9.0 s.

```
FILM_GL=swangle FILM_BROWSER=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell \
  npx tsx tools/stills.ts Kit-demo-wide 1 45,135,228,330 --sheet=out/review/a1/Kit-demo-wide-sheet.png
```

Stills are in `out/review/a1/` (not committed): both formats at frames 45 (writing, frames drawing), 135 (graphite resolved, accent writing, clips playing), 228 (sepia resolving, `4.3(a)` landed, the date mid-roll) and 330 (everything settled, the lower-third), plus `Kit-demo-wide-f00228@2x.png` at scale 2.

## Measured (cloud, 4 cores, software GL; `renderStill` wall time per still, one browser reused; `tools/stills.ts` now prints it)

| frame | what is live | scale 1 | scale 2 |
|---|---|---|---|
| 45 | 1 super writing (pencil canvas), 2 device frames drawing, no video yet | 2.5-2.7 s | |
| 135 / 228 / 330 | supers, rolls, 2 frames + **2 `OffthreadVideo` clips** | 6.8-10.3 s | 11.9 s (228) |

The pencil pieces cost little next to Remotion's per-still page load (about 1.5-2 s, see `src/endless/README.md`). The difference between frame 45 and the later frames is the two video frame extractions: each still makes a cold seek into each clip. A video render reuses the decoder across consecutive frames and will be much cheaper per frame. That was not measured, because cloud rules forbid video renders. At mid and far zoom the screens show posters and cost what an `<Img>` costs.

## Known limits

- The sheet super's handwriting is the engine's lettering laid out in the super's place. `PencilLine`'s head does not travel to it. Chapter 1's super, where the line itself rises into cursive, is owned by chapter 1's line geometry (`src/endless/README.md`). Every other super is written "by the pencil" in this sense.
- Mid-roll, a long number such as the date reads as fragments of digits on separate wheels, by design: it settles cleanly. If a calmer roll is wanted, reduce `turnsFor` in `NumberRoll.tsx`.
- `NumberRoll` places its baseline from DM Sans metrics (0.94 em below the top of the box). It is accurate to about 1 px at 64 px.
- In `Kit-demo-tall` the phone sits a few px from the laptop's base (demo layout only).
