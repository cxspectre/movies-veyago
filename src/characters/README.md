# Line characters (`src/characters`)

Maya and her family as **continuous-line figures** drawn by the paper engine (BIBLE4 §4): one path per pose, no filled
faces, a 3-5 stroke face with no pupils, a mitten loop for hands, one hook per foot, one accent detail each. Maya is
sepia (`Ink` `'sepia'`, `#7A4A2A`, added to the engine by this module's work); the family is graphite. Import from
`src/characters` (the barrel `index.ts`).

## Use

```tsx
import {LineCharacter} from '../characters';

<LineCharacter character="maya" pose="sit-A" x={5400} y={4250} progress={drawProgress} />            // draws on
<LineCharacter character="maya" pose="sit-B" swapFrom="sit-A" swapProgress={t} x={5400} y={4250} rough={false} />  // flipbook swap
<LineCharacter character="dad" pose="tree" scale={0.3} x={5400} y={2650} boil={0} />                  // a tiny bust
```

| Prop | Meaning |
|---|---|
| `character` | `'maya' \| 'dad' \| 'leo' \| 'mia' \| 'jonas' \| 'sam' \| 'biscuit'` |
| `pose` | a `PoseId` the character has (table below); a missing pose throws at build time |
| `progress` | draw-on 0-1 (default 1): body (rough pass, then clean), then the face, then the accent |
| `swapFrom`, `swapProgress` | flipbook redraw from `swapFrom` into `pose` over `SWAP.frames` (15): the changed segments of the old pose retract from their end back to the shared anchor over 6 frames, the new ones draw from it over 9; unchanged segments hold; the face returns at the end of the redraw |
| `ink` | default: the design's (sepia for Maya) |
| `scale` | 1 = design-sheet size (sheet px): standing heights Maya 420, Dad 410, Leo 260, Mia 230, Jonas 440, Sam 420; Biscuit 110 tall / 140 long; seated figures come out at ~300 |
| `x`, `y` | the figure's ground point in the parent's px (a bust's origin is its cut line: the sill, the node's centre) |
| `boil` | wobble re-seeded every 8 frames, px (default 0.5; `BOIL.storm` = 3 for Maya in the paper storm; 0 to hold) |
| `rough` | the v1 rough pass under the body (default true: the first draw); pass `false` after a swap |
| `frame`, `zoom`, `density`, `grainOffset` | the engine's clock and grain controls, as in `GraphiteSketch` |

The component owns one small `PencilCanvas` sized to the figure (both poses during a swap). Place it inside the same
transform as the paper so the tooth matches.

### Pure API (for pages that embed a figure, the light renderer, foley)

- `figureItems(character, pose, {x, y, scale, ink, boil, boilBucket, rough, idPrefix})` → untimed strokes to put in any
  `sequence(...)`; ids are `<prefix>-body`, `<prefix>-face-<n>`, `<prefix>-accent`.
- `drawOnSpec(...)` → a `SketchSpec` that draws on over 0-1; `swapSpec(character, from, to, s, o)` → the swap frame's
  spec plus the page `progress` to render it at; `swapPhase(s)` → `{erase, draw}`.
- `placeFigure(...)` → segments and strokes in sheet px; `boundsOf(placed, margin)`; `changedRange(a, b)`.
- `DESIGNS[id]` → name, ink, height, line width, poses.

## Poses

| Character | Poses |
|---|---|
| Maya | `stand`, `tree`, `sit-A` (at the table, hand on a paper), `sit-B` (leaning back from the storm; use `boil={3}`), `look-up` (seated, head up), `window` (bust), `doorway` (one hand on the frame), `tap` (one hand forward to tap) |
| Dad | `stand`, `tree`, `hold-up` (the pill bottle, kitchen), `lie` (in bed, head to the left), `sit` |
| Leo, Mia | `stand`, `tree`, `reach` (one arm up to the fridge) |
| Jonas | `stand`, `tree`, `sit` (at a table) |
| Sam | `stand` (phone in hand, looking at it), `tree`, `hold-up` (the key) |
| Biscuit | `stand`, `sit`, `lie` (the kennel), `tree` (head) |

Chapter 7's `silhouette` is `stand` at 90 px (scale ≈ 0.21); chapter 9's `at-home` poses are the per-character ones above.

## How it is built (and how to add a pose)

- `rig.ts`: a tiny 2D skeleton (`Skeleton`: head, neck, shoulders, elbows, wrists, hips, knees, ankles, widths, flags)
  becomes ONE outline route of 18 named segments: up the front of the torso, around each arm and its mitten, over the
  head (the hair function shapes the crown: knot, cap, ponytail, plain), down the other arm, down each leg and its foot
  hook, back to the start. Segments may be empty (a bust, a hidden far limb); the names and order never change, so two
  poses of one character can be diffed segment by segment for the swap.
- `designs.ts`: `Proportions` per character and `PoseOpts` per pose (`facing` -1..1, `lean`, `headUp`, `arms` as
  `[upper, forearm]` degrees per side with positive = away from the body, `foreArmScale` for foreshortening, `stance`,
  `feet`, `mood`, `farArm`/`farLeg`). Builders: `'stand' | 'sit' | 'bust' | 'lie'`. A strongly turned seated figure
  hides its far arm and leg (a single clean silhouette instead of a tangle of doubled lines).
- `faces.ts`: brow, eye hint(s), nose, mouth by `mood`; the beard; the hair outlines.
- `dog.ts`: Biscuit in one loop from a few named points per pose.
- `figure.ts`: wobble (per segment name, so shared segments match across poses), scale, placement, boil, the body path
  (Catmull-Rom through the segments), the swap diff and timing, bounds.

**To add a pose:** add the `PoseId` in `types.ts`, then one line in the character's table in `designs.ts`
(`id: [{...PoseOpts}, 'stand' | 'sit' | 'bust' | 'lie']`); for Biscuit add a `DogParams` in `dog.ts`. Render
`Maya-poses-wide` (or a scratch composition) with `npx tsx tools/stills.ts <id> 2 170 --gl=swangle` and look.

## Previews (`src/characters/previews.ts`, registered via `src/previews4.ts`)

`CharacterSheet-wide` (all seven standing on paper, evenly lit; they draw on over 3 s), `Maya-poses-wide` (Maya in
eight poses plus the `sit-A → sit-B` swap caught mid-redraw). Gate 1 stills: `out/review/s1b/`.

## Known limits (honest)

- Faces are frontal-to-3/4 only; a true profile would need its own nose-on-the-contour treatment.
- Seated poses are side views with the far limbs hidden; a frontal seated pose (`facing` near 0) shows both legs but
  reads flatter.
- `lie` is the standing skeleton laid down; it is a placeholder silhouette for Dad in bed until the chapter owner
  needs more.
- A swap between two poses that share nothing (standing → seated) retracts and redraws the whole figure; that is by
  design but takes the full 0.5 s regardless of how much moved.
