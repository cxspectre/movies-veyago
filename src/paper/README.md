# Paper engine (`src/paper`)

Graphite and accent coloured pencil on warm off-white A3 paper, under a one-sided daylight lamp, shot top-down.
A page is **data** (`SketchSpec` = `StrokeSpec[]` + `LabelSpec[]` on `SKETCH_SIZE` 1200x850). The engine compiles it
once into timed pencil **marks**, and everything reads those same marks: the graphite renderer, the light renderer
for the transition, the pencil position for hands/cup, and the foley cues. They cannot drift apart.

Import everything from `src/paper` (the barrel `index.ts`).

## Minimal page

```tsx
// src/sketches/family-tabs/index.tsx
import React from 'react';
import {GraphiteSketch, handCircle, handLine, handRect, label, sequence, stroke, strokeCues, type SketchProps, type SketchSpec} from '../../paper';

const items = [
  stroke('frame', handRect(140, 160, 620, 420, 1), {width: 2.4, rough: true}),   // loose rough first, then clean
  label('mom', 'Mom', 180, 140, {size: 36}),
  stroke('row', handLine(190, 260, 520, 258, 2), {width: 1.6, pressure: 0.8}),
  stroke('ring', handCircle(640, 250, 60, 48, 3), {ink: 'accent', width: 2.6, tick: true}),
  label('note', 'Mom isn\'t the\nonly one.', 820, 300, {ink: 'accent', size: 42, rotate: -4}),
];

export const spec: SketchSpec = {id: 'family-tabs', ...sequence(items, 0, 1)};
export const cues = (drawFrames: number) => strokeCues(spec, drawFrames);
export const Sketch: React.FC<SketchProps> = ({drawFrames}) => <GraphiteSketch spec={spec} drawFrames={drawFrames} />;
```

The page is transparent: the desk/scene puts it on paper:

```tsx
<DeskSurface>
  <div style={{transform: `scale(${s}) rotate(-1deg)`}}>
    <PaperSheet curl={0.4}>
      <GraphiteSketch spec={spec} drawFrames={sec(6)} zoom={s} />
      <EraserCrumbs area={{x: 150, y: 700, w: 170, h: 70}} seed={3} />
    </PaperSheet>
  </div>
</DeskSurface>
```

`Engine-demo` (in `src/paper/demo/`) is the reference for all of it. Input props: `{"light": true}` shows the page as
`LightSketch`, `{"stress": true}` swaps in a 160-stroke page for timing.

## Components

| Component | Props (all optional unless noted) |
|---|---|
| `GraphiteSketch` | **`spec`**, **`drawFrames`**, `frame` (default `useCurrentFrame()`), `zoom` (how much a parent scales the page up; keeps grain crisp), `density` (device px per sketch px, default the render scale), `grainOffset` |
| `PaperSheet` | `width`/`height` (default `SKETCH_SIZE`), `lamp`, `curlCorner` (`'br'`), `curl` 0-1 (0.35), `lift` px above desk (6), `falloff` (0.06), `grainOffset`, `children` drawn on the paper under its light |
| `DeskSurface` | `lamp`, `textureScale` (1 = wide desk shot), `pan` {x,y} for camera moves, `falloff` (0.22), `vignette` (0.22), `children` laid on the desk under its light |
| `StickyNote` | **`text`**, **`pressAt`** (frame it touches the paper), `approachFrames` (9), `smoothAt` (pressAt+24), `smoothFrames` (14), `size` (220 ≈ 76 mm on the A3 page), `rotate`, `color`, `ink` ('accent'), `face` ('caveat-700'), `textSize`, `writeAt`/`writeFrames` (write the lettering on instead of it being already there), `zoom`, `frame` |
| `EraserCrumbs` | **`area`** {x,y,w,h}, `seed`, `count` (16), `scale`, `amount` 0-1 (how many are visible), `lamp` |
| `LightSketch` | **`spec`**, **`progress`** 0-1, `order` ('spec' = pencil rhythm, 'sequential' = one stroke after another in spec order), `revealOf(id, progress) => 0..1` (full control), `color`, `accentColor`, `glow`, `coreWidth`, `includeRough`, `tipFlare` |
| `PencilCanvas` | the low-level renderer behind all of the above: **`marks`** (`compileSketch(spec)`), **`progress`**, **`width`**, **`height`**, `density`, `zoom`, `grainOffset` |

Pure helpers: `stickyState(frame, timing)` (height, curl, the smoothing finger's `sweep`), `stickyCues(timing)`
('sticky_press', 'sticky_smooth'), `scatterCrumbs(...)`.

## Following the pencil (hands, cup, foley)

```ts
const s = getPencilState(spec, frame, drawFrames);
// {x, y} tip in sketch px, angle (direction of travel, rad), pressure (0 lifted .. ~1.4),
// drawing, lift (0 on paper .. 1 well clear), ink, strokeId, progress, done
const cues = strokeCues(spec, drawFrames);       // 'stroke' cues per movement (merged per stroke / written word),
                                                 // 'tick' hits for strokes with tick: true; seconds from page start
offsetCues(cues, pageStartSeconds);              // place a page inside a module
```

Coordinates are in the sheet's own space: apply the same transform you gave the `PaperSheet` to place a hand.

## StrokeSpec / LabelSpec

`d` is SVG path data (any commands; each `M` is a new pencil movement with a lift in between). `width` is the nominal
line width in sketch px: **1.2-1.6** light lines, **1.8-2.4** confident outlines, **2.6-3** accent circles and ticks.
`from`/`to` are fractions of `drawFrames`; `sequence(items, from, to, gap)` fills them in for you in proportion to how
long each item takes to draw (handwriting runs at about 12 characters a second on a 6 s page).

Engine additions (all optional): `tick` (emit a tick cue at the end), `pressure` (1 normal, 0.5 construction line,
1.3 pressed), `hatchAngle`/`hatchGap` (style 'hatch': `d` is the closed REGION; flicks are generated inside it,
alternating direction), `scribbleSize` (style 'scribble': loops travel along `d`). Labels: `face`
(`'caveat-500'` default, `'caveat-700'`, `'kalam-400|700'`, `'patrick-400'`, `'reenie-400'`), `pressure`; `rotate` is
degrees; `\n` makes a new line. Styles: `'dotted'` lays a dot every ~4.4 widths along `d`; `rough: true` (lines and
dotted) first draws a lighter, looser pass with overshooting ends, then the clean line over it.

## Authoring paths that look hand-drawn

Never hand the engine perfect geometry. Use the toolkit (all deterministic by `seed`):

- `handLine(x1, y1, x2, y2, seed, {bow, overshoot, wobble})` — slight bow, starts a touch early, runs past the end.
- `handRect(x, y, w, h, seed, {radius, overshoot})` — one continuous movement, rounded corners, overshoots where it closes.
  `handRectStrokes(...)` — four lines that cross at the corners (looser).
- `handCircle(cx, cy, rx, ry, seed, {overlap, startAngle})` — never closes exactly; overlaps its start ~12%.
- `handArrow(x1, y1, x2, y2, seed, {head, bend})` → `{shaft, head}` (two strokes, shaft first).
- `handTick(x, y, size, seed)` — a check mark with its knee at (x, y). `handCheck(x, y, size, seed)` → `{box, tick}`.
- `handDottedLine`, `handUnderline`, `handCross`, `handTickMarks` (ruler ticks).
- `handPath(points, seed, {wobble, closed, smooth})` — Catmull-Rom through jittered points, for anything else; add
  `drift(points, seed, step, amount)` first for long runs so they wander a little; `handPolyline` for sharp corners.

Rules of thumb: corners overshoot 3-8 px, long lines bow 0.5-1.5% of their length, a circle around a word is drawn
counter-clockwise from about 10 o'clock, ticks are one quick movement (give them a short window), hatch with a
light `pressure` (0.6-0.8) and `width` 1.2-1.4.

## How it works (and why it is fast)

1. **Compile** (pure, cached per spec object): paths are flattened and resampled every 1.5 px; each movement gets
   pressure (heavier where the lead lands and at turns, a taper at lift-off, a slow tremor), width from pressure, and
   timing (the hand slows at turns and at both ends). Roughs, hatch flicks, scribbles and glyphs are marks too.
2. **Deposit** (canvas, additive): visible marks are laid down as "graphite deposit" into an offscreen canvas
   (graphite in R, accent in G), each movement as 2-3 drifting strands plus a faint halo, the moving tip as a rounded
   fresh lead. Letters are glyph-by-glyph `fillText`, revealed by the pen's zigzag through each glyph.
3. **Develop** (one pixel pass with lookup tables): deposit is thresholded against the paper **tooth** texture, so light
   pressure only catches the peaks and lines break up naturally; heavier deposit fills the valleys and darkens.
4. The result is one transparent canvas over the paper (normal alpha; colours are pre-multiplied against the paper).

Measured on this machine (shared, load ~25-50): a 160-stroke / 12-label page renders a frame in **~0.7 s at 1080p**
and **~1.2-1.4 s at 4K** (Remotion `renderStill` per frame, page load included).

**Never use CSS `mix-blend-mode` around these layers.** In Remotion's Chrome, blended layers break where other
layers overlap them (graphite vanished in rectangles). The engine uses normal-blend overlays (`shade()`, `lampTint()`)
throughout.

## Textures (`public/tex`, made by `tools/makeTextures.ts`)

`npx tsx tools/makeTextures.ts [tooth|paper|desk|fonts]` — deterministic. Two texels per logical px (one per device
pixel at 4K). `paper-tooth.png` (1024², grayscale height, tileable, 512 logical px), `paper-albedo.webp` (2048²,
tileable, 1024 logical px, the same tooth baked in as relief lit from the upper left), `desk-oak.webp` (4096²,
tileable pale white-oiled rift oak, 2048 logical px). The same run writes `src/paper/text/handMetrics.ts` (glyph metrics
of the hand faces, so lettering layout is pure). To keep graphite on the visible tooth, pass the same `grainOffset`
to `PaperSheet` and `GraphiteSketch` (both default to 0).

## Lamp

`DEFAULT_LAMP = {azimuth: 205, elevation: 34, strength: 1, warmth: 0.45}` — light from the upper left, fairly low.
`castShadow(lamp, {height})` gives a layered CSS box-shadow for anything `height` px above the desk (paper ~6, a
lifted sticky ~20-46, a cup ~60); `shadowOffset(lamp, height)` for your own shadows. Change `azimuth` per shot if
needed; the baked paper relief assumes upper-left light (invisible at normal viewing distance).

## Sepia (v4, Maya's ink)

`Ink` is `'graphite' | 'accent' | 'sepia'`. Sepia (`INK4.sepia`, #7A4A2A, BIBLE4 §3) deposits into the blue channel and
develops with graphite's physics (`SEPIA_LOOK`); the rough pass is the same pencil at lower pressure, so it comes out as
the lighter sepia the bible asks for. Graphite and accent take exactly the v1 code path, so v1 pages render unchanged.
`LightSketch` takes `sepiaColor` for sepia strokes in the void. Sepia is Maya's only: `src/characters` uses it.
