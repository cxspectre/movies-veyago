# Desk kit (`src/desk`) — hands and props

Top-down props for the paper world and the two pairs of stylised hands, built to BIBLE §2.1 (lamp, shadow table),
§2.2 (palette), §2.7 (pencil behaviour), §2.10 (layouts) and §2.11 (hands). Import everything from `src/desk`
(the barrel `index.ts`). All of it is pure and deterministic: no `Math.random`, no `mix-blend-mode`, no SVG filters
beyond small CSS blurs on hand-sized groups. Measured: ~0.95 s per 1080p frame for a sheet drawing itself with
both hands on the desk (the engine's page is most of that), ~1.3 s at 4K.

**HANDS_MODE = `'illustrated'`** (`hands/mode.ts`). The fallback (`'shadows'`: only the hands' cast shadows plus
the pencil and props) is one constant away and renders through the same components; `Hands-shadows-wide` previews
it. Why illustrated: after four review rounds at 4K the drawing hand reads as a calm flat illustration in the film's
own graphite-and-tone language (single continuous 2.2 px contour, heavier on the shaded side, three tones, joint
creases, the pencil layered through the fingers). The director decides at review; flipping the constant changes
nothing else.

## Coordinates

- **Desk coordinates** (props, `DESK_LAYOUT`): the wide-desk framing at scale 1.0, wide 1920x1080 / tall 1080x1920.
  `DeskStage` frames them with a `camera` `{scale, centre}` (BIBLE §2.8 framings are in this unit).
- **Sketch px** (hands, pencil): the 1200x850 sheet. `SKETCH_PX_PER_MM` = 2.857 (A3 = 420 mm). Place hands inside
  the same transform as the `PaperSheet` (`SheetAt` does this) and they are the right size for that sheet.
- Hands and pencils are authored in **mm** and scaled by `pxPerMm` (default `SKETCH_PX_PER_MM`). For a hand on a
  0.55-scale sheet placed in desk coordinates, pass `pxPerMm={SKETCH_PX_PER_MM * 0.55}`.

## Lamp and shadows

`DESK_LAMP` (azimuth 230.3°, elevation 38°) is the bible's lamp: shadows travel along `SHADOW_DIR` (+0.64, +0.77).
Pass it to `PaperSheet` / `DeskSurface` so paper shadows agree with the props. `DESK_LAMP_WARM` for back-to-desk.
`SHADOWS` is the §2.1 table (`sheet`, `sticky`, `pencil`, `eraser`, `ruler`, `cup`, `cupContact`, `phone`, `hands`);
`liftedShadow(entry, {height})` moves, softens and fades it for something `height` px above the desk (that is how
the cup's set-down and the hands' lift converge to the table). `boxShadowOf` / `dropShadowOf` turn an entry into CSS.

## Stage

```tsx
<DeskStage format={format} camera={{scale: 1.25, centre: {x: 1080, y: 560}}} show={{coffeeCup: false}}
           offsets={{eraser: {x: 10, y: 0}}} cupSetDown={k} cupPencils={['accent', 'graphite']}>
  <SheetAt centre={layout.activeSheet.centre} scale={layout.activeSheet.scale} rotation={0}>
    <PaperSheet lamp={DESK_LAMP}><GraphiteSketch spec={spec} drawFrames={n} zoom={…} /></PaperSheet>
    <PencilHand spec={spec} drawFrames={n} />            {/* sketch px, same transform as the sheet */}
  </SheetAt>
</DeskStage>
```

`DeskStage` draws `DeskSurface` and the props at `DESK_LAYOUT[format]`: ruler, eraser, sticky pad and the blank
stack under the children; coffee cup, pencil cup and the face-down phone over them (`over` changes that); `above`
renders on top of everything (a hand reaching across the cup). Every prop
can be hidden (`show`) or nudged (`offsets`). `cupSetDown` 0-1 lowers the cup; `cupPencils` lists what stands in the
pencil cup (leave out the one in the hand). `finishedPagePlacement(layout, n, seed01)` gives the slot a finished
page slides to. `rulerPxPerMm(layout.ruler)` for the passport page's ruler ticks.

## Props (each centred on its own origin; wrap in `<Placed centre rotation scale>`)

| Component | Notes |
|---|---|
| `Pencil` | `kind` `graphite` / `accent` / `fineliner` (capped) / `finelinerUncapped`; `x,y` = the **tip**; `yaw` = direction from the tip to the back end (deg); `tilt` 0 lying, 55 in hand (foreshortens from above); `shadow` `'lying'` (table) / `'held'` (diverges with height from the contact point) / `'none'`; `hover` px above the paper; `clip=[fromMm, toMm]` to draw a piece of it. `PENCIL_GEOMETRY[kind].pinch` is where the fingers hold it (34 mm). |
| `CoffeeCup` | `r`, `handleAngle` (deg from +x; from above a handle is a bar), `setDown` 0-1 with `cupSetDownState(progress)` (pure: height + scale) for the hand that carries it. Cast shadow + contact ring from the table. |
| `PencilCup` | `r`, `pencils` standing in it (tip-down; their ends lean out over the rim). |
| `Eraser`, `StickyPad`, `FaceDownPhone` | `w`, `h`. The phone is un-badged: matte back, slim rim, a raised plateau with two quiet lenses, no logo. |
| `Ruler` | `w`, `h`, `mm` (300): clear acrylic, mm/cm ticks and numbers along the top edge. |
| `BlankSheetStack` | `count`, `scale`, `rotationStep`: engine `PaperSheet`s, +1° each. |

## Hands

Pose library (`POSES`, mm, right hand; `handed="left"` mirrors): `reach` (relaxed, entering), `grip` (tripod pencil
grip), `lower` (grip, pencil steeper, for 2:29-2:32.5), `rest` (pencil down), `steady` (flat, fingers a little
apart, on a sheet corner), `slide` (flat, open, pushing a sheet), `lay` (fingers together on top of a carried sheet,
thumb underneath), `press` (flat, together: pressing the sticky note), `smooth` (index + middle extended: smoothing
it), `cupHold` (holding a mug by its handle). Anchors per pose: `palm`, `indexTip`, `fingertips`, `pad`, `pinch`
(grip), `grip` + `handleEnd` (cupHold). `handAnchorPx(placement, pose, name)` tells you where an anchor landed.

```tsx
<Hand pose="steady" handed="left" x={300} y={690} anchor="indexTip" rotation={16}
      presence={presenceAt(t, {enter: {from: 0.0, to: 0.5}, exit: {from: 2.5, to: 3.0}})}
      enterFrom="bottom" travel={1500} pair="A" lift={0} />
```

- `rotation` 0 = fingers pointing up the screen, clockwise positive. Pair A enters from the bottom (rotation around
  -25…+25), pair B from the right (wide, rotation around -85: level with what it carries, so the arm stays under the
  phone and clear of the pencil cup) or the top-right corner (tall, rotation around -135).
- `presence` 0-1 slides the hand `travel` px toward `enterFrom` (default: along its own forearm, which always leads
  to a frame edge). `presenceAt(t, {enter, exit, easeIn, easeOut})` uses the bible's easings; feed it windows from
  `beats.ts` (e.g. `coldOpen.handAOut`, `coldOpen.handsBIn`). `travel` is in the hand's parent px: under a 0.8 camera
  on a 0.833 sheet, 900 px is not enough to clear the frame; use ~1500 (sheet px) or ~1800 (desk px).
- `held` is drawn between the hand and its finger caps: the pencil's back piece, the cup, nothing for a sheet (a
  carried sheet is drawn by the scene under the `lay` hand).
- `lift` px lifts the hand: its shadow drifts and softens per `liftedShadow(SHADOWS.hands, {height})`, and the tight
  contact shadow under the fingers and palm (3,4 / blur 8 / 0.20 when resting) fades out.
- Sizes: pair A is 0.85 of the life-size poses, pair B 0.78 (`PAIR_SIZE`): a stylised hand against the A3 sheet, with
  the pencil at full size reading longer in it. Draw every hand at the desk's own px per mm
  (`SKETCH_PX_PER_MM * activeSheet.scale` in desk coordinates, or inside the active sheet's `SheetAt`); a hand placed
  inside a 0.55-scale sheet's transform comes out 0.55 the size, which is wrong for a hand.
- The forearm is a tapered, gently bent ribbon (wrist waist, 1.5x wider by 230 mm, `forearmBend` degrees toward the
  little-finger side, default 6; pass a negative bend to curve it the other way) that runs 1200 mm, past any frame
  edge; its cut end is never shaded, so nothing to see. `forearmMm` shortens it if a scene ever needs that.
- Where a finger lies over its neighbour (the folded fingers of `grip` / `cupHold`), a thinner contour separates them.
- `cupHold` fits a 44 mm mug at its `grip` anchor; for the real cup, `cupGripAnchor(rPx / (pxPerMm * PAIR_SIZE.B))`
  gives the anchor to put in a pose copy (`{...POSES.cupHold, anchors: {...anchors, grip}}`), as `DeskKitDemo` does.

### The drawing hand

```tsx
<PencilHand spec={spec} drawFrames={drawFrames} />                 // follows the engine's pencil, damped
<PencilHand state={getPencilState(spec, frame, drawFrames)} />    // undamped, from a state alone
<PencilHand rig={staticRig({x, y}, hover, {yawBase: 60})} pose="lower" />   // 2:29-2:32.5: hover 60 -> 3 px
```

`followPencil(spec, frame, drawFrames, options)` is the pure rig: exact tip, yaw damped over the previous frames and
swinging ±7° with sideways strokes, the hand lagging up to 2.5 px behind the tip, a 0.45 px / 0.35° tremor
(`noise1`, seeded), 6 px lift between strokes and 12 px on the hold (BIBLE §2.7). `yawBase` 60 (default) puts the
forearm about 30° from vertical; 66 in tall keeps it steeper. `kind` picks the pencil (the accent pencil, the
fineliner for pair B's lettering). The pencil is held at 45° (`GRIP.pencil.tiltDeg`; `lower` 56°) so a good length
shows from above, and is drawn in two pieces that meet under both finger caps (`pencilSeamMm`): the tip piece under
the hand with the held shadow running from the contact point, the back piece over the hand's back with a tight
shadow onto the skin, its eraser end past the heel on the thumb side.

### Sticky note

Use `stickyState(frame, timing).sweep` (engine) for the smoothing finger: place `<Hand pose="smooth" anchor="pad">`
at the note's position + `sweep * size` down the note, with `pose="press"` from `pressAt` until `smoothAt`.

### Cup

`<Hand pose="cupHold" anchor="grip" held={<div style={{position:'absolute', left: cupAt.x, top: cupAt.y}}><CoffeeCup setDown={k} handleAngle={cupHandleAngle(rotation)} /></div>} lift={cupSetDownState(k).height} />`
with `cupAt = handAnchorPx(placement, CUP_HOLD, 'grip')`; hide the stage's own cup (`show={{coffeeCup: false}}`)
until the hand lets go. `Desk-kit-wide` shows the hand-off.

## Previews (`npx tsx tools/stills.ts <id> <scale> <frames> --sheet=out/x.png`)

`Desk-kit-wide` / `-tall` (6 s: the layout, pair A drawing with the left hand steadying, pair B bringing the cup in
and setting it down, the sticky note landing, pair B's smoothing hand), `Hands-demo-wide` / `-tall` (a page drawing
itself over 6 s with the pencil hand following, then resting), `Hands-shadows-wide` (the fallback),
`Hands-poses-wide` (all poses), `Hands-closeup-wide` (grip, rest, steady at the film's scale).

## Fragile / unfinished

- The grip and cupHold poses are authored by eye in mm; moving a joint can let the pencil or the handle show through
  a finger. Re-render `Hands-closeup-wide` at scale 2 after touching `poses.ts`.
- Pencil layering assumes the pinch at 34 mm and the index cap from the PIP; a different `kind` with another pinch
  keeps working but the `UNDER_FINGERS_FROM` split (46 mm) is one constant in `PencilHand.tsx`.
- `cupHold` fits a ~44 mm-radius mug at the hand's own px/mm; at other scales the fingers sit a little off the handle.
- Shade bands use the lamp direction in screen space, so a hand rotated far (pair B at -90°) is lit correctly, but the
  index highlight is always on the index finger even when another finger is nearer the lamp.
- Hands never animate between poses; cut or cross-fade with presence, or interpolate joint arrays yourself.
