# Pop-up paper (`src/popup`)

Lifts a flat drawing into folded paper. A pop-up is a **net** of rectangular panels lying on the page; each panel is hinged to a parent along one edge and its fold angle is a function of time (data). Rendering is CSS 3D (one `matrix3d` per panel, `preserve-3d`), no WebGL, no `mix-blend-mode`, no randomness except Remotion's `random(seed)` (crumple creases).

## Use

```tsx
import {PopUp, MAYAS_HOUSE, HouseArt} from '../../popup';
<PopUp spec={MAYAS_HOUSE} time={localSeconds} view={{tilt: 24}} look={{lamp}}>
  <HouseArt spec={MAYAS_HOUSE} />   {/* any React art in net coordinates; or a function (panel) => art */}
</PopUp>
```

- `time` defaults to `frame / fps`; pass module-local seconds. Position/scale the pop-up with a wrapper div (`spec.size` is its box).
- `view`: `tilt` (24 deg default; 0 = straight down), `yaw`, `perspective` (1500).
- `look`: `lamp` (default `DEFAULT_LAMP`, the v1 desk lamp: shading and shadow follow it), `thickness` (1.6 px edge), `shadow`, `reach` (0.5), `grainOffset`.
- Panels: `{id, rect, parent, hinge: 'top'|'bottom'|'left'|'right', line, angle, clip, tint, hideBefore}`. `hinge` names the edge of THIS panel on the parent; positive angle lifts toward the viewer, negative folds back. `angle` is a number or keys `[{t, a, spring}]` (`foldKeys(start, dur, to)` is the sugar; the last key settles with a small wobble when `spring` is set). Parents must come before children. `clip` is a polygon in percent (gables, nose, hopper). `spec.keep` `{ground, centre}` anchors a crumpled ball.
- The art is rendered once per panel (clipped to the panel), so keep art light (SVG, a few dozen paths). Pencil-canvas art per panel would be too slow.

## Presets (data, one engine)

| Preset | Export | BIBLE4 |
|---|---|---|
| Dollhouse (back and side walls to 86/80 deg, roof flap, front open as yard) | `MAYAS_HOUSE`, `houseSpec(data)`, `HouseArt` | 5.2 |
| Small house with a door label and wallpaper wash | `villageHouse(id, label, wallpaper, start)` | 5.9 |
| Sheet that crumples and unfolds (facet grid, seeded creases, one shared amount curve) | `CRUMPLE_LETTER`, `crumpleSpec(data)`, `LetterArt`, `EngineArt` | 5.3 |
| Tall machine: body box, hopper, five gates, tray | `FILTER_MACHINE`, `machineSpec(data)`, `MachineArt` | 5.4 |
| Rocket on a pad with three fins | `ROCKET`, `rocketSpec(data)`, `RocketArt` | 5.8 |

Change timings and sizes in the data (`timing`, `at`, `amount`); change the look of the drawing by passing other art children. The paper plane is not built yet (scissors, crumpled ball and page drop: see Effects below) (a plane is a 4-panel net: write it as a spec).

## Proof and cost

`PopUp-demo-wide` / `-tall` (8 s). Stills in `out/review/s1c/` (not committed): `npx tsx tools/stills.ts PopUp-demo-wide 1 10,30,60,100,130,160,200,230`, with `FILM_GL=swangle`.
Measured on the 4-core cloud box (software GL, four pop-ups with about 45 panels): about **2.3 s per frame at 1080p** (6 frames in 18 s after the bundle; the page is mostly CSS 3D, no canvas), 2x stills were similar. Adjacent frames 99/100/101 differ by 134 of 2.07M pixels (no flicker or seams when the fold is at rest).

## Known gaps

- The crumple reads as crumpled paper but is a loose zigzag, not a tidy ball (a chain of random creases). Tune `maxCrease`, grid and seed, or add a shrink; the ball does not shrink in size.
- Panels shadow the page, not each other (no self-shadow); shading is per panel normal.
- The back-leaning roof is visible mostly as a flap above the back wall.

## Effects (`src/popup/effects`, chapter 3 "The no", BIBLE4 5.3)

Flat SVG components (no CSS 3D, no canvas, no WebGL, no `mix-blend-mode`), deterministic (seeded hashes). Art children are **SVG** in the effect's own box (0..w, 0..h): paths, `<text>`, the `Ink`/`Box`/`Ring`/`Scribble` helpers. Every effect takes `time` (module-local seconds; default `frame / fps`), `lamp` and `style`; position and scale with a wrapper div.

```tsx
import {CrumpleBall, crumpleRest, UnfoldFromBall, ScissorsCut, PageDrop} from '../../popup';

// 10.0-12.0 the letter crushes into a ball r 180, rolls and settles
<CrumpleBall w={460} h={600} time={t} start={10} duration={2} radius={180} to={[dx, dy]}>{letterSvg}</CrumpleBall>
// 13.0 the same ball (same seed/cols/rows/radius, box centred on the same point) opens into the engine
<UnfoldFromBall w={900} h={520} time={t} start={13} duration={2} radius={180} from={crumpleRest({w: 460, h: 600, radius: 180, to: [dx, dy]})}>{engineSvg}</UnfoldFromBall>
// 20.0 scissors enter, snip 3 times down the path, halves slide; left fades with a 0->12 px blur, right is labelled "keep"
<ScissorsCut w={900} h={520} time={t} start={20} cut={2.5} path={[[450, 0], [450, 520]]} left={{dx: -400, fade: true}} right={{dx: 300, label: 'keep'}}>{cardSvg}</ScissorsCut>
// 28.0 the page drops (lands 28.45), 30.0 the 21 is circled; the NumberRoll goes in `anchor`
<PageDrop time={t} start={28} month="September 2026" days={30} firstWeekday={1} circled={21} circleAt={30} anchor={<NumberRoll ... />} />
```

- **CrumpleBall / UnfoldFromBall**: a jittered 8 x 10 triangle mesh; each vertex has a flat home and a home on a dented ball (octahedral wrap: the middle of the sheet faces the viewer, the corners meet behind), moving on its own staggered schedule with a wrinkle that peaks mid-crush. Facets are painted far-to-near, the art affine-mapped and clipped onto each, shaded from the facet normal against the lamp (backs of the paper are blank, darker paper). The shadow is the silhouette offset along the lamp, plus a contact shadow that tightens under the ball. `rolls` (default three small rolls, then a rocking settle; `[]` = none), `to` (ball centre vs the sheet centre: two letters crushing into one ball share a point), `seed`, `cols`, `rows`, `creaseFade` (unfold: seconds for the last creases to go, default 1.2). Two letters into one ball: two CrumpleBalls with `to` pointing at the same spot; swap to one at the end of the crush.
- **ScissorsCut**: `path` must run from the top edge to the bottom edge (y increasing). Timings default from `start`: enter 0.5 s, cut `cut` s in `snips` snips, slide at cut end + 0.5 for `slideDur` 1 s, fade from slide + 0.5 for 2 s, label at slide end + 0.5. Halves are separate paper pieces with their own shadow (lifted while sliding). `scissorsSize` default 300.
- **PageDrop**: falls 0.45 s with gravity, two small bounces and a rotational wobble; shadow is `castShadow` at the page's height. `pageDropAnchor(w, h)` gives the anchor point (default centred 50 px under the page); the element carries `data-anchor="number-roll"`.

Proof: `Effects-demo-wide` / `-tall` (8 s): `FILM_GL=swangle npx tsx tools/stills.ts Effects-demo-wide 1 36,37,100,160,235 --sheet=out/review/a3/x.png` (stills in `out/review/a3/`, not committed).
Cost on the 4-core cloud box: about **1.3 s per frame at 1080p** (6 frames in 13 s including about 5 s of bundling; three effects on screen, the ball 160 facets), about **3 s for a 2x still**. Adjacent mid-crumple frames 36/37 differ by 1.5% of pixels, all of it the ball moving coherently (same facets, no popping or seams).

Known gaps: the ball is seen straight down (no view tilt); facet order is a per-facet depth sort, so a facet can briefly poke through another mid-crush. The fading half is CSS `filter: blur()` (fine for stills; costlier in long renders).
