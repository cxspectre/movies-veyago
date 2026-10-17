# Line characters (`src/characters`)

Maya and her family as **continuous-line figures** drawn by the paper engine (BIBLE4 §4): one path per pose, no filled
faces, a 3-5 stroke face with no pupils, a mitten with a hint of a thumb, a foot standing flat on the ground, one accent
detail each. Since the A2 art pass they are drawn like quick gesture sketches: weight on one leg, an S through the
spine, sloped and uneven shoulders, a tilted head, limbs that swell and narrow between soft joints, and the clothing of
the design sheet drawn into the outline itself. Maya is
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
| `progress` | draw-on 0-1 (default 1): body (rough pass, then clean; ONE pencil movement), the chair or bed, the face and clothing details, the accent |
| `swapFrom`, `swapProgress` | flipbook redraw from `swapFrom` into `pose` over `SWAP.frames` (15): the changed segments of the old pose retract from their end back to the shared anchor over 6 frames, the new ones draw from it over 9; unchanged segments hold; the face returns at the end of the redraw |
| `ink` | default: the design's (sepia for Maya) |
| `scale` | 1 = design-sheet size (sheet px): standing heights Maya 420, Dad 410, Leo 260, Mia 230, Jonas 440, Sam 420; Biscuit 110 tall / 140 long; seated figures come out at ~300 |
| `x`, `y` | the figure's ground point in the parent's px (a bust's origin is its cut line: the sill, the node's centre; Dad's `lie` origin is the mattress top under his hips, and the bed hangs 34 px below it) |
| `boil` | wobble re-seeded every 8 frames, px (default 0.5; `BOIL.storm` = 3 for Maya in the paper storm; 0 to hold) |
| `rough` | the v1 rough pass under the body (default true: the first draw); pass `false` after a swap |
| `frame`, `zoom`, `density`, `grainOffset` | the engine's clock and grain controls, as in `GraphiteSketch` |

The component owns one small `PencilCanvas` sized to the figure (both poses during a swap). Place it inside the same
transform as the paper so the tooth matches.

### Pure API (for pages that embed a figure, the light renderer, foley)

- `figureItems(character, pose, {x, y, scale, ink, boil, boilBucket, rough, idPrefix})` → untimed strokes to put in any
  `sequence(...)`; ids are `<prefix>-body`, `<prefix>-prop` (seated and lying poses only), `<prefix>-face-<n>`,
  `<prefix>-accent`.
- `drawOnSpec(...)` → a `SketchSpec` that draws on over 0-1; `swapSpec(character, from, to, s, o)` → the swap frame's
  spec plus the page `progress` to render it at; `swapPhase(s)` → `{erase, draw}`.
- `placeFigure(...)` → segments, face, accent and prop strokes in sheet px; `boundsOf(placed, margin)`; `changedRange(a, b)`.
- `DESIGNS[id]` → name, ink, height, line width, poses.

## Poses

| Character | Poses |
|---|---|
| Maya | `stand`, `tree`, `sit-A` (on a chair at the table, forearm on it, hand flat on a paper, looking down), `sit-B` (leaning back against the chair from the storm, a hand up; use `boil={3}`), `look-up` (seated, head up), `window` (bust), `doorway` (one hand flat on the frame), `tap` (near profile, the hand raised forward at chest height to tap) |
| Dad | `stand` (stooped, soft knees, slippers), `tree`, `hold-up` (the pill bottle at eye level, kitchen), `lie` (on his back in bed, head on the pillow to the left, knees up, an arm resting on his chest; the bed is drawn with him), `sit` (on a chair, forearm on his thigh) |
| Leo, Mia | `stand`, `tree`, `reach` (one arm up to the fridge) |
| Jonas | `stand`, `tree`, `sit` (on a chair at a table, forearm on it; the watch moves to the visible wrist) |
| Sam | `stand` (phone in hand, looking at it), `tree`, `hold-up` (the key) |
| Biscuit | `stand`, `sit`, `lie` (the kennel), `tree` (head) |

Chapter 7's `silhouette` is `stand` at 90 px (scale ≈ 0.21); chapter 9's `at-home` poses are the per-character ones above.
Seated poses come with their chair (graphite, BIBLE4 §3 rule 2: drawings stay graphite even under Maya); the chapter
still draws the table. The chair is placed from the hips, not the torso, so a swap between two seated poses of one
character (`sit-A` ↔ `sit-B` ↔ `look-up`) holds the chair and the legs and redraws only the upper body.

## How it is built (and how to add a pose)

- `rig.ts`: a tiny 2D skeleton (`Skeleton`: head, neck, shoulders, elbows, wrists, hips, knees, ankles, widths, the
  torso shape, flags) becomes ONE outline route of 18 named segments: up the front of the torso, around each arm and
  its mitten, over the head (the hair function shapes the crown: knot, cap with brim, ponytail, crop, quiff, plain),
  down the other arm, down each leg and around its foot, back to the start. Segments may be empty (a bust, a hidden far
  limb); the names and order never change, so two poses of one character can be diffed segment by segment for the swap.
  - The torso is not a box: each flank runs hip → low → waist → ribs → armpit, and which of those swell depends on
    whether that side is the figure's front (`chest`, `belly`), its back (`blade`, `seat`) or a flank; the weight
    side creases at the waist. A seated back curves in at the small of the back and rounds onto the seat.
  - Shoulders fall from the neck along the trapezius into a round deltoid; with the arm hidden (a bust, a turned
    figure's far side) the contour flows straight down from it.
  - Limbs swell (biceps, forearm, thigh, calf on the side that has it) between narrower soft joints. The outward side
    of a limb comes from the outline's clockwise orientation (left limbs on their left, right limbs on their right),
    which stays correct for horizontal thighs and raised forearms.
  - Clothing is drawn INTO the outline: `sleeve` `'pushed'` (Maya: bunched below the elbow) or `'rolled'` (Jonas: a
    rolled band), `skirt` `kind: 'cardigan'` (Maya's long cardigan hem, standing poses) or `'skirt'` (Mia's dress),
    `collar` (Dad's shirt collar wings), `shoe: 'slipper'` (Dad), `backpack` (a lobe behind the back), `bag` (at the
    hip), `sock` (one sock up).
  - `ik(a, c, l1, l2, bendDir)` places a knee or elbow between two points.
- `designs.ts`: `Proportions` per character (including its `FaceStyle` and `TorsoShape`) and `PoseOpts` per pose
  (`facing` -1..1, `lean`, `headUp`, `headTilt`, `weight` (the leg carrying the weight: its hip rises, the shoulders
  answer, the free foot steps out with a soft knee), `arms` as `[upper, forearm]` degrees per side with positive = away
  from the body, `foreArmScale` for foreshortening, `stance`, `feet`, `feetForward` (seated), `mittens` (`'round'`,
  `'flat'` for a hand laid on a table or a frame, `'phone'`), `mood`, `farArm`/`farLeg`). Builders:
  `'stand' | 'sit' | 'bust' | 'lie'`. A strongly turned seated figure hides its far arm and leg (one clean silhouette
  instead of a tangle of doubled lines); `sit` adds the chair, `lie` is its own skeleton (on the back, knees up) and
  adds the bed and pillow. Small clothing details in the figure's ink ride with the face strokes: Maya's cardigan
  V-neck, Dad's placket, Leo's backpack strap, Sam's bag strap across the chest.
- `faces.ts`: the face in four or five movements (the far brow running into the bridge and down the nose; the near
  brow; a hint of each visible eye; the mouth), shaped by the character's `FaceStyle` (brow height, arch, tilt and
  asymmetry; eye lid curve; nose; mouth width, curve and a lopsided corner) and bent by the pose's `mood`. Maya: soft
  arched brows lifted at the inner ends, a gentle lopsided smile. Dad: long brows drooping at the outer ends, a big
  nose, a small smile (under his glasses). Jonas: low flat brows, a short mouth in the beard (three strokes: the jaw
  line round the chin and two under the mouth). Sam: one brow up, a lopsided smirk. Leo: high brows, smiling eyes, a
  wide grin. Mia: high round brows, a small happy mouth. Also the hair outlines and `capBrim` (Leo's brim is part of
  the cap outline; the accent pencil retraces it, so it never floats).
- `dog.ts`: Biscuit in one loop from a few named points per pose (unchanged by the A2 pass).
- `figure.ts`: wobble (per segment name, so shared segments match across poses), scale, placement, boil, the body path
  (Catmull-Rom through the segments, one stroke), the prop stroke, the swap diff and timing (the prop holds when it is
  the same in both poses, else it erases and redraws with the body), bounds.

**To add a pose:** add the `PoseId` in `types.ts`, then one line in the character's table in `designs.ts`
(`id: [{...PoseOpts}, 'stand' | 'sit' | 'bust' | 'lie']`); for Biscuit add a `DogParams` in `dog.ts`. Render
`Maya-poses-wide` (or a scratch composition) with `npx tsx tools/stills.ts <id> 2 170 --gl=swangle` and look.

## Previews (`src/characters/previews.ts`, registered via `src/previews4.ts`)

`CharacterSheet-wide` (all seven standing on paper, evenly lit, and under them the family's other poses at 0.62: Dad
`sit`, `lie`, `hold-up`, Jonas `sit`, Leo and Mia `reach`, Sam `hold-up`, Biscuit `lie`; they draw on over 3 s),
`Maya-poses-wide` (Maya in eight poses plus the `sit-A → sit-B` swap caught mid-redraw). Gate 1 stills:
`out/review/s1b/`; the A2 art pass: `out/review/a2/` (`before/`, `round1-3/`, `maya-before-after.png`).

## E7 readability pass

Heads and faces are 16% larger on every figure (gesture proportion, same neck/torso), the body line is heavier
(adults 2.7 px, Maya 3.1, Leo/Mia/Biscuit 2.4 at scale 1), face strokes run at the body width and pressure 1.1, and
sepia bodies are pressed at 1.3 (`SEPIA_PRESSURE`) so Maya's stroke is denser at 30% scale. Maya's brows are longer
and arched, her mouth wider with a lopsided smile. Proof: `out/review/e7/` (not committed).

## Known limits (honest)

- Faces are frontal-to-3/4 only; a true profile would need its own nose-on-the-contour treatment. At scale 1 on the
  sheet the faces are ~25 px wide: the brow and mouth differences read in a close-up (chapters 2 and 9), less so on the
  full design sheet; at chapter 7's 90 px they are a few marks.
- Seated poses are side views with the far limbs hidden; a frontal seated pose (`facing` near 0) shows both legs but
  reads flatter (no chapter needs one).
- `sit-B`'s raised hand reads as a flat paddle more than a warding-off gesture; good enough mid-storm under a 3 px boil,
  not for a still close-up.
- Dad's `lie`: the arm resting on his chest makes a small bump in the belly line; it reads as a man lying in bed with
  his knees up, but not yet as relaxed as the standing poses. The bed is drawn with the pose (headboard, mattress,
  pillow); a chapter that draws its own bed should ask for a `prop`-less variant.
- Leo's backpack is a big lobe behind him (the design sheet says a big backpack); its outline is simple.
- Near-profile standing (`tap`) overlaps the two legs' lines a little at the thighs.
- A swap between two poses that share nothing (standing → seated) retracts and redraws the whole figure; that is by
  design but takes the full 0.5 s regardless of how much moved.
