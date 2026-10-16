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

Change timings and sizes in the data (`timing`, `at`, `amount`); change the look of the drawing by passing other art children. Scissors and the paper plane are not built yet (a plane is a 4-panel net: write it as a spec).

## Proof and cost

`PopUp-demo-wide` / `-tall` (8 s). Stills in `out/review/s1c/` (not committed): `npx tsx tools/stills.ts PopUp-demo-wide 1 10,30,60,100,130,160,200,230`, with `FILM_GL=swangle`.
Measured on the 4-core cloud box (software GL, four pop-ups with about 45 panels): about **2.3 s per frame at 1080p** (6 frames in 18 s after the bundle; the page is mostly CSS 3D, no canvas), 2x stills were similar. Adjacent frames 99/100/101 differ by 134 of 2.07M pixels (no flicker or seams when the fold is at rest).

## Known gaps

- The crumple reads as crumpled paper but is a loose zigzag, not a tidy ball (a chain of random creases). Tune `maxCrease`, grid and seed, or add a shrink; the ball does not shrink in size.
- Panels shadow the page, not each other (no self-shadow); shading is per panel normal.
- The back-leaning roof is visible mostly as a flap above the back wall.
