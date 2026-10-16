# Device rig (`src/devices`) and glass kit (`src/glass`)

Generic, un-badged three.js devices for the glass world (Acts 3-4), rendered through `@remotion/three` into one black
void. No logo anywhere, no camera detail beyond a soft plateau, no Apple assets. Import from `src/devices` and
`src/glass` (the barrels).

```tsx
import {DeviceStage, Phone3D, Watch3D, WalletPass3D, CardFlip, transitionPhone} from '../../devices';
import {cornerParam} from '../../glass';

const {height} = useVideoConfig();
const t = useCurrentFrame() / fps;                       // module-local seconds
const phone = transitionPhone(t, format, height);       // placement, rotation, edge light, FOV, all from beats.ts
<DeviceStage fov={phone.fov}>
  <Phone3D {...phone} screen={{kind: 'video', src: 'footage/binder-home-dark.mp4', startAt: 1.5, endAt: 7.7}} />
</DeviceStage>
```

## The stage

`<DeviceStage fov bloom overlay>` is one `<ThreeCanvas>` filling the composition, pure `#000000`. Put every device of
a shot in ONE stage (shared perspective, bloom and light). `overlay` is DOM drawn over the canvas.

- **World units are logical px.** x right, y up, origin at the frame centre, the frame plane is z = 0.
- **Dolly zoom:** the camera moves with the FOV so that anything at z = 0 keeps its size. `fov` ~0 is flat (min 0.5°, the
  drawing), 28 is the film's perspective. The transition animates it with `transitionFov(t)` and nothing jumps.
- Bloom (BIBLE 3: threshold 0.6, radius 12 px, intensity 0.35) is a real post pass (`stage/Composer.tsx`): scene into a
  4x MSAA half-float target, bright pass (threshold on display luminance, exactly zero below it), separable Gaussian
  (sigma = radius / 2, finite 3-sigma support, half resolution), additive composite, then the ONLY sRGB encode. It works
  in Remotion's headless Chrome with `--gl=angle` (tested: stills at scale 1 and 2). `bloom={false}` turns it off.
- **Bloom mask:** the scene's alpha says what may bloom. Bodies, rims and halos bloom; **screen UI does not** by default
  (`screenBloom={0}`), because white UI text with bloom reads soft and cheap. Pass `screenBloom={1}` for screens that
  show light (the hairline drawing). This is the one place I read "bloom on everything in the void" narrowly. Halos add
  colour but leave the mask alone, and the flying card clears it under itself, so a halo lying over another device's
  screen, the pass or the card never makes their type glow.

## Rigs

Shared props (`RigProps`, `types.ts`):

| prop | meaning |
|---|---|
| `placement` | `{x, y, z?, height}`: centre in FRAME FRACTIONS (0..1, y down, as the BIBLE writes them), z px toward the camera, body height in logical px |
| `rotation` | `{x, y, z}` degrees. Yaw, then pitch, then roll. **Positive y turns the screen to the viewer's LEFT** (the right edge comes forward), so the pair's phone at -14° and Watch at +12° face inward. Negative x leans the top away |
| `scale` | extra uniform scale |
| `edgeLight` | `{position, intensity, width, sweep}` (below) |
| `glow` | the device's light level (band + halo): 1, the settle goes to 0.7 (`familyGlow`), the pair dims to 0.4 (`pairGlow`) |
| `opacity` | fades body and screen **to black** (the void is black). The light is not faded by it, so a device lights in edge first; fade the light with `edgeLight.intensity` / `glow`. A half-faded body still hides what is behind it |

- `<Phone3D screen island screenLevel screenBloom>`: 150 x 71.9 x 8.75 mm proportions, screen at the captures' exact aspect
  (1206 x 2622) with a 62 pt corner radius, a 1 px `#3A3A40` edge highlight (line width follows the render scale),
  buttons (action, volume, side, a flush camera-control pill), the back plateau. `island` draws the Dynamic Island
  (iOS geometry from `binder-home.layout.json`): turn it ON for the clean stills (`binder-home.png`, `*-still.png`), OFF
  for videos (they already contain it).
- `<Watch3D screen patchClock>`: 46 x 39 x 9.7 mm case, crown, side button, strap stubs (tapered 8%, rounded free ends,
  curled back, a lengthwise #101012 -> #0B0B0C gradient; case, crown, button and straps all carry the 1 px #3A3A40 line
  and take the band). Use `watch-card-still.png` (an image) for a settled Watch card: the video scrolls. `patchClock` (default on) covers
  the capture's real clock with a patch of the frame's own black and "9:41" in DM Sans 500, 33 px on the 416 x 496 frame
  (digits 23 px tall, right edge x 382, baseline 62, matching the originals).
- `<WalletPass3D art sheen>`: `public/footage/wallet-pass.png` on a 1.2 mm card with the pass's own 14 pt corners, a deep red
  back and rim with a light 1 px edge (#F5F7FA at 55% over the red).
- `<CardFlip t from to card front back>`: the emergency card (BIBLE 5.7). `t` = seconds since the hit. It starts as the
  dock's red Emergency circle (52 pt, read from the layout file), grows into a 3:2 card 40% of the phone's width while it
  lifts toward the camera (full size by frame 4), turns 180° about its long axis over the whole 0.5 s (eased in-out about
  edge-on at frame 7.5, so the red front reads square for frames 1-6 and the back for 9-15), travels to the Watch from
  0.1 s (held over the phone first) and past edge-on reshapes into the Watch screen it lands on (`FLIGHT_PHASES`). It is
  drawn last without a depth test, so no bezel clips it. Front: the red pass art (`wallet-pass.png`, contain-fit on the
  red), back the Watch card still (clock patched): at landing the back IS the Watch screen, so set the Watch's `screen`
  to `{kind: 'image', src: FLIP_CARD.back}` at `familyOfDevices.cardLands` and the card hides itself. Light the Watch
  with `familyWatchIn(t)` (edge light 0-0.27 s, body and screen 0.27-0.5 s). Build `from`/`to` with
  `cardFromPhone(phonePose, stage)` and `cardToWatch(watchPose, stage)`, the size with `flightCardSize(phoneHeightPx)`.

### Screen sources (`ScreenSource`)

| kind | |
|---|---|
| `{kind: 'image', src}` | a path under `public/` |
| `{kind: 'video', src, startAt, playbackRate, holdAt, endAt}` | `startAt` = clip second shown at the rig's frame 0 (the manifest's `hotStart`); `holdAt` freezes; `endAt` clamps (use `durationSec` minus a frame) |
| `{kind: 'draw', width, height, draw(ctx, frame)}` | a 2D canvas drawn synchronously every frame (see `demos/ScreenDrawDemo.tsx`: the binder home's frames as hairlines with `strokeHairline`) |

Video while RENDERING: each frame is fetched from Remotion's own frame server (`NoReactInternals.getOffthreadVideoSource`,
the same source `<OffthreadVideo>` and `@remotion/three`'s deprecated texture hook use), uploaded, and the GL frame is
re-rendered before the hook releases its `delayRender`, so a frame can never show the previous frame's pixels. In the
Studio a detached `<video>` is seeked instead (approximate, preview only).

## The edge light

`edgeLight.position` is 0..1 along the perimeter, **clockwise as seen from the front, from the midpoint of the top-left
corner** (`src/glass/edgeLightPath.ts`; `cornerParam(PHONE.outline, 'topRight')` etc. give the corners). The band is
`width` (default 0.07 = 7% of the device height) long along the edge: a flat core over its central 40%, a Gaussian
feather over the rest, exactly zero beyond 2.5 widths, core `#F5F7FA`. It lights the rounded front edge (brightest on the
1 px highlight line), the side wall, and any button it passes. The halo is `#9FB4FF` at 30%, a soft lobe about twice as
long, reaching 2 widths outside the outline and exactly zero at its rim. The screen glass shows a Schlick Fresnel
reflection of it (4% face-on) near the edge it is on, plus a dim procedural studio (soft strips) so speculars glide as
the device turns. `sweep: {x, intensity}` is a second band crossing the device left to right (`x` 0..1 across its width);
`pairSweepX` + `sweepFor` run one sweep across several devices.

## Driven by beats.ts (`drive.ts`)

Never re-type a time. All take MODULE-LOCAL seconds:

- `transitionPhone(t, format, frameHeight)` → `{placement, rotation, edgeLight, fov}`: rotation Y 0 → -8 → +22 and X 0 → -5
  (`transition.rotationY/X`, easeInOutSine), FOV 0 → 28 over `transition.perspective`, the lap from the top-left corner
  over `transition.edgeLight.lap` (constant speed, a 0.4 s ramp up), then the drift to the top-right corner by 17.0.
  Its state at 17.0 is `transition.handoff`.
- `familyPhoneX(t, format)`, `familyGlow(t)` (`familyOfDevices.phoneSlide`, `.settle`).
- `pairSweepX(t, fromX, toX)`, `pairSweepIntensity(t)`, `pairGlow(t)` (`pair.sweep`, `pair.dim`).
- `ease(name, t)`, `windowProgress(window, t, easing)`, `interpolateKeyframes(keys, t, easing)` live in `src/glass/motion.ts`.

## Placing things on a device (`placement.ts`)

`localToWorld(pose, stage, [x, y, z])` (device units: the body is 1 unit tall, y up), `projectToFrame(world, stage)` →
frame px, `screenPointToLocal(xPt, yPt)` for a point in the capture's 402 x 874 pt, and `quadTransform(w, h, quad)`: a
CSS `matrix3d` homography that pins a 2D layer onto the projected screen quad (exact for a flat screen in perspective).

## The glass kit (`src/glass`)

`VoidBackground`; `EDGE_LIGHT`, `BLOOM`, `BODY`, `HAIRLINE` (BIBLE 3 numbers); the perimeter maths (`pointAt`,
`paramOfPoint`, `cornerParam`, `loopDelta`, `bandProfile`, `samplePerimeter`, `perimeterPath` for SVG); hairline styles
(`hairlineStyle`, `freshLevel` 1.2 for 0.6 s then a 0.3 s settle, `hairlineGlowFilter` for CSS, `hairlineSvgStroke`,
`strokeHairline` for canvas, normal blending only); DM Sans on glass (`GLASS_TYPE`, `glassTextStyle(role, format)`,
`glassCanvasFont`, `TITLE_LAYOUT` with the title's shift, the "2" size and gaps, caption placement).

## Previews (`previews.ts`)

`Devices-demo-wide` / `-tall` (20 s: the transition's lift-off and lap with the real home, 10 s; the family of devices with
the flip, the Watch lighting in and the pass sliding out, 5 s; the pair with its sweep, 5 s), `Devices-lookdev-wide` and
`Devices-lookdev-watch-wide` (one pose per frame: front, handoff, sides, back, top, sweep), `Devices-phone-still-wide`,
`Devices-phone-video-wide`, `Devices-screen-draw-wide`, `Devices-colour-check-wide` (face-on, no light: compare the
screen with `binder-home.png`).

## Measured

- Colour: the face-on screen against `binder-home.png` resampled to the same rect (4K still): flat regions differ by
  0.24-0.26 / 255 on average; overall mean +0.8 / 255 (the 4% studio reflection on the glass plus resampling); edges
  differ only by filtering. sRGB in, linear maths, one sRGB encode out, no tone mapping, no dithering.
- Void: every pixel outside the lit devices and their halos is exactly (0, 0, 0) (checked on lit 4K frames: rows,
  columns, corners and everything outside the device-plus-halo box).
- Speed (shared Mac, load ~18): about 1.1 s per 4K still, under 1 s at 1080p, PNG encode included.
