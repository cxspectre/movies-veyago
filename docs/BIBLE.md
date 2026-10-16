# "Provided For" — the film bible

Creative direction for every agent on the Provisum 2 film. `CONTRACT.md` is the interface; `docs/SCRIPT.md` is the source; this file is the taste and the numbers. Every time here is a MASTER time unless it says "local"; the module-local numbers that code imports live in `src/beats.ts` (and `src/edits.ts` for the cut-downs). Where this file and `beats.ts` disagree, `beats.ts` wins and I owe you a fix.

The film in one sentence: **a premium keynote product film wearing a handmade pencil-and-paper heart.** Acts 1-2 are honest, warm and slightly imperfect; Acts 3-4 are black, precise and quiet; the end goes home to the paper. The one rule: **nothing appears on glass that was not first drawn on paper.** Section 4 lists, for every sketched element, the finished screen element it becomes.

---

## 1. Emotional arc and rhythm

| Time | Act | What the audience feels | Rhythm |
|---|---|---|---|
| 0:00-0:06 | Cold open | Curiosity in the dark. A pencil they can hear but not see; then the lamp finds a phone drawn on paper. | Slow. One line. No music. |
| 0:06-0:20 | What we had | Quiet pride, not a sales pitch. "It already did a lot." The ticks are a person checking their own work. | Steady: one tick every ~3 s on the VO's nouns. |
| 0:20-0:28 | The breath | A pause with weight. The cup lands; nothing else moves. The hardest question is coming. | One breath. The piano thins to a single held note. |
| 0:28-0:35 | The question | Resolve. The chord lands as the note is smoothed flat; the question is written while we read it. | Still. Slow 4% push-in. |
| 0:35-0:56 | The table, pages 1-4 | Delight in the thinking. Each page is one idea, drawn with care; the margin notes make the audience smile. | Slowing-down-to-speed-up: 6, 5, 4, 3 s. |
| 0:56-1:06 | Pages 5-9 | Momentum. Mom's mail becomes five ideas in ten seconds. | Metronomic: 2 s a page, a sheet landing on every other beat. |
| 1:06-1:12 | Pages 10-11 | Breadth. "Past one country": the circles and the five hellos. | Settles to 3 s a page so the map can breathe. |
| 1:12-1:20 | The biggest idea | A held breath again. The music leaves. A form is drawn, judged, crossed out; a question and two chips are drawn in its place. | Three gestures: draw, cross, redraw. Cross-out lands on "Stop". |
| 1:20-1:31 | The wall | Scale. Twelve ideas become one product as the camera rises; then the camera chooses the centre. | Fast hands, slow camera. |
| 1:31-1:38 | Lines to light | Wonder. The drawing is becoming something else. | Strokes catch light in the order they were drawn. |
| 1:38-1:48 | It becomes real | Precision. The phone turns in black; four snaps on four beats. | Locked to the beat. |
| 1:48-1:53 | The family of devices | The remembered shot: the card on the wrist. | Two hits, then light settling. |
| 1:53-1:55 | Silence | A held breath, for real: nothing. | One full second of nothing, held to 1:55. |
| 1:55-2:04 | Title | Arrival. "Provisum", then the pencil reaches into the void to write "2". | Letter by letter; the "2" completes on the resolve. |
| 2:04-2:20 | The real thing | Proof, fast. Nine finished screens in the order they were drawn. | 2.0 / 1.5 s alternating, on the beat. |
| 2:20-2:25 | The pair | Hero. Phone and Watch, one sweep of light. | Still. |
| 2:25-2:33 | Back to the desk | Warmth. The real phone lies on the drawings; it shows what is drawn underneath it. | Slow push-in; the hand lowers the pencil and holds. |
| 2:33-2:40 | End card | Calm. Off-white, the name, "Free on the App Store", the mark. The pencil clicks: done. | Nothing moves after 2:36. |

The two breaths (0:20 and 1:53) are the structure of the film. Everything accelerates into the first and decelerates out of the second. Do not fill either with anything.

---

## 2. Paper world (Acts 1-2 and 2:25-2:40) in numbers

All pixel values are LOGICAL (wide 1920x1080, tall 1080x1920); sketch-space values (the 1200x850 canvas) are marked "sketch px".

### 2.1 Lamp and shadows
- One daylight lamp, upper-left, at 10 o'clock, 38° elevation. Light direction vector on the desk plane: (+0.64, +0.77) (shadows fall down-right).
- Lamp colour (Acts 1-2): #FFF6E8 at 100%; ambient fill #DCD6CC at 35%. Back-to-desk (2:25-2:33) is WARMER: lamp #FFE2B8, ambient 40%; the whole frame is graded +6% warmth and the vignette drops to 0.12.
- Shadow per object class (offset x, y in px / blur / opacity / colour #3A3020):

| Object | offset | blur | opacity |
|---|---|---|---|
| A3 sheet on the desk | 6, 8 | 14 | 0.18 |
| Sheet on sheet (grid, overlaps) | 4, 5 | 8 | 0.14 |
| Sticky note | 3, 4 | 5 | 0.25 (+ a 2 px darker lip under the lifted corner) |
| Pencil (in hand or lying) | 6, 8 | 6 | 0.35 |
| Eraser | 8, 10 | 8 | 0.30 |
| Ruler | 5, 7 | 6 | 0.30 |
| Coffee cup | 26, 34 | 30 | 0.30 (plus an inner contact shadow r 6, 0.45) |
| iPhone (face down or face up) | 10, 14 | 18 | 0.32 |
| Hands | 18, 24 | 24 | 0.28 |

- Vignette: radial, transparent at 55% radius to #2A2008 at 0.18 in the corners (0.12 in back-to-desk).

### 2.2 Colours
- Paper: `COLORS.paper` #F3EEE3; paper underside / edge: `COLORS.paperShade` #E8E1D0; paper in shadow of another sheet: multiply 0.92.
- Desk: pale oak #C8B394, grain lines at 6% contrast (#B9A27F), 2-3 px wide, 60-140 px apart, slightly wavy, running left-right in wide and top-bottom in tall.
- Sticky note: #FFE98A (face), #F2D86A (lip); its shadow colour #5A4A10.
- Graphite: clean #2A2A2D (`COLORS.graphite`), rough #5A5A60 (`COLORS.graphiteSoft`).
- Accent: `COLORS.accent` #2F5BEA, nothing else. Never tint it; opacity carries variation.
- Hands: tone #E9C9A8, shade #C98F6A, line #2A2A2D at 70%.
- Coffee cup: white ceramic #F7F4EE with a graphite-drawn rim; coffee #3B2416.
- Pencil: classic yellow-ochre #D9A74A body, #2A2A2D tip, pink #E7A6A0 eraser cap. Accent pencil: #2F5BEA body. Fineliner (sticky note only): #2A2A2D body with a #2F5BEA cap.

### 2.3 Paper tooth, fibre, grain
- Tooth: a tiled texture (`public/tex/paper-tooth.png`, 1024², seeded noise, 1-2 px features, L* ±3) multiplied at 18% over every sheet.
- Fibre flecks: 0.4 per 1000 px², 1-3 px, #D8CFBD at 60%, seeded per sheet.
- Film grain over the whole frame: 2.5% luminance, 2 px, re-seeded per frame (deterministic from the frame number).
- Every stroke is masked by the tooth at 15% so graphite breaks slightly, as it does on real paper.
- Sheet edges: 1 px darker rule (#DCD4C2) plus a 0.5 px lighter rule inside it; corners square; one sheet in ten has a corner lifted 3 px (its shadow shows it).

### 2.4 Graphite
- Clean pass: #2A2A2D at 85-100% opacity (opacity follows pressure). Rough pass: #5A5A60 at 35%, offset 2-4 px from the clean path (seeded), with 1.5 px wobble.
- Pressure: width varies ±25% along the stroke (noise frequency 0.02/px); the first 8% of every stroke starts at 70% width (the pencil lands), the last 5% tapers to 60% (it lifts).
- Wobble on the clean pass: 0.8 px amplitude, 0.03/px frequency. Straight ruled lines (the ruler page, the shelf line of the tabs) have 0.2 px wobble.
- Line weights by element class (sketch px on the 1200x850 canvas; the desk scales them):

| Class | width | rough pass |
|---|---|---|
| Device outlines (phones, watch, bottle, passport) | 3.0 | yes |
| UI boxes, cards, chips, fields | 2.2 | no (outline of the big card: yes) |
| Text lines, placeholder scribbles | 1.6 | no |
| Hatch / fill | 1.2 | no |
| Dotted connectors | 1.6, dash 6/8 | no |
| The cross-out on the form | 4.0, pressure 1.3 | no |
| Accent ticks | 3.0 | no |
| Accent circles / arrows | 2.6 | no |

- Rough-then-clean: a stroke with `rough: true` draws its rough ghost over the first 40% of its (from,to) window, the clean line over the last 70% (they overlap 10%). The ghost stays at 35% for the life of the page. Only outlines and big shapes are rough; details are clean only.
- Hold: when a page is done it does not change. No idle animation on paper.

### 2.5 Accent rules
Accent is the film's "yes". Use it only for:
1. ticks (the cold open's five; the speech-bubble page's five),
2. ONE circle per page around the thing the page is about (exception: the Europe page, where the four circled countries are the drawing),
3. arrows,
4. margin notes and sticky-note lettering,
5. the "2" (on the centre sheet's corner, and in light in the title),
6. in the transition, the tint of hairlines that were accent strokes.

Never for fills, UI boxes, labels inside drawings, the cross-out (that is a judgement in pencil; the answer is in accent). Accent is at most ~12% of a page's total stroke length. Accent strokes draw slightly faster than graphite (the pen glides): speed ×1.2.

### 2.6 Hand-lettering faces (all loaded by `src/fonts.ts`)
| Use | Face | Size | Colour | Rotation |
|---|---|---|---|---|
| Margin notes on pages | Caveat 500 | 44 sketch px (36 for a note longer than 26 characters) | accent | −3° to +3°, fixed per page (seeded) |
| Sticky note (0:28) | Kalam 700 | 60 logical px on a 320 px note, 3 lines, leading 1.05 | accent | the note sits at −4°, the text follows |
| Labels inside drawings (Mom, Dad, 9/6/3, Hello…) | Patrick Hand 400 | 30 sketch px (44 for the speech bubbles, 36 for the chat question) | graphite | 0° |
| Form placeholders (page 12 only) | Reenie Beanie 400 | 26 sketch px | graphiteSoft | 0° |
| "112", "A4" (page 10), the corner "2" (centre sheet) | Caveat 700 | 56 / 72 sketch px | accent | −6° |

Lettering is written, not faded: reveal left-to-right with a soft 24 px wipe per word at a pace of 11 characters/s (Caveat) or 8 characters/s (Kalam, the sticky note: 26 characters over 4.0 s minus two short line breaks). A pen `stroke` cue accompanies the wipe.

### 2.7 Pencil, pen and eraser behaviour
- The graphite pencil is held at 55° to the paper, tip leading; it moves at the stroke's own speed and lifts 6 px between strokes (a 2-frame hop). On a hold it rests 12 px off the paper, tip down.
- The accent pencil is a second pencil in the cup; the hand swaps in a 0.4 s off-frame reach (the camera is tight; we cut the swap): the accent strokes of a page are drawn last, after the swap.
- The fineliner appears once: 0:28.5, `pen_cap` as it is uncapped by the second pair of hands to letter the sticky note.
- Eraser: used once on camera, page 1 (family-tabs), fraction 0.22-0.30: the hand erases a too-small first attempt at the "Dad" tab (ghost 120x50 at sketch (300,160)); 8 crumbs (2-4 px, #8A8578) stay near (330,230) for the life of the page and are on the sheet in the wall grid. `erase` cue for the duration. If the paper engine cannot erase, the ghost fades to 10% instead and the crumbs still appear.
- Ticks: a 2-segment check, 26x22 sketch px, drawn short-stroke-then-long in 0.25 s with a `tick` hit at its start.

### 2.8 Camera
Top-down, 2° tilt toward the lamp so shadows read. Moves are few and slow; every move is one easing from one framing to another, never two moves at once. Framings are given as the scale of the "wide desk" (1.0 = the whole desk fills the frame; see 2.10 for the desk's coordinates) and a centre in desk coordinates.

| Time | Move | Easing |
|---|---|---|
| 0:00-0:28 | Static, cold-open framing: the V1 sheet's phone outline at 70% of frame height (wide) / 55% (tall). | — |
| 0:28-0:35 | Push 1.00 → 1.04, centred on the sticky note. | easeInOutSine |
| 0:35 | CUT to the wide desk, scale 0.80, the whole desk in frame. | — |
| 0:38.0-0:38.5 | Push 0.80 → 1.25 onto the work area (the active sheet fills ~68% of frame width, wide; ~92%, tall). | easeOutCubic |
| each page change | Drift ±1.5% scale and ±12 px, over the slide-in. | easeInOutSine |
| 1:12.0-1:13.5 | Push 1.25 → 1.45 onto the form page. | easeInOutCubic |
| 1:20 | CUT to 1.45 on the work area (continuity), then the RISE 1.45 → 0.78 over 1:20-1:25 (the full grid, with 6% margin). | easeInOutQuint |
| 1:25-1:31 | PUSH 0.78 → the transition's opening framing (centre tile's phone outline at 78% of frame height, wide; 62%, tall). The last 1.5 s are nearly still (the quint tail). | easeInOutCubic |
| 2:25-2:33 | Push 1.00 → 1.08 on the face-up phone. | easeInOutSine |
| 2:33-2:40 | Static. | — |

No handheld shake anywhere. The paper world's "life" comes from the strokes and the hands, not the camera.

### 2.9 Easing table (`EASING` in beats.ts)
linear (0,0,1,1) · easeOutCubic (0.33,1,0.68,1) · easeInOutCubic (0.65,0,0.35,1) · easeInOutSine (0.37,0,0.63,1) · easeInOutQuint (0.83,0,0.17,1) · keynote (0.2,0,0,1) for UI snaps, device slides and the flip.

### 2.10 Desk layout and props
Desk coordinates = the wide-desk framing at scale 1.0. Sheets are A3 landscape (the 1200x850 sketch, scaled). Rotations are small and fixed (seeded, never animated except while a sheet slides).

**Wide (1920x1080):**
| Prop | Centre | Size / scale | Rotation |
|---|---|---|---|
| Active sheet (work area) | (1080, 560) | 1000x708 (0.833) | 0° (slides in at +3°, settles to 0°) |
| V1 sheet with the sticky note | (330, 300) | 0.55 | −6° |
| Stack of blank sheets (4) | (1700, 760) | 0.55 | +4°, each +1° |
| Pencil cup (3 pencils: graphite, accent, a spare) | (1780, 180) | r 60 | — |
| Coffee cup | (560, 470) touching the V1 sheet's lower-right corner | r 70 | — |
| Eraser (white, 60x24) | (560, 900) | — | 18° |
| Ruler (300 mm, 520x34) | from (120, 1010) to (640, 1040) | — | −2° |
| Sticky-note pad | (300, 700) | 110x110 | −8° |
| iPhone, face down (un-badged, matte) | (1640, 300) | 78x160 | 12° |
| Finished pages (as they leave the work area) | pushed up-left to (620, 160)… stacking with +40 px offsets | 0.55 | −4° ±2° |

**Tall (1080x1920):**
| Prop | Centre | Size / scale | Rotation |
|---|---|---|---|
| Active sheet | (540, 900) | 900x637 (0.75) | 0° |
| V1 sheet with the note | (200, 260) | 0.45 | −8° |
| Stack of blank sheets | (900, 1520) | 0.45 | +5° |
| Pencil cup | (960, 180) | r 52 | — |
| Coffee cup | (420, 470) | r 62 | — |
| Eraser | (160, 1500) | 54x22 | 20° |
| Ruler | (100, 1800) to (700, 1820) | — | −2° |
| Sticky-note pad | (160, 1300) | 100x100 | −8° |
| iPhone, face down | (880, 1700) | 70x144 | 10° |
| Finished pages | up-left to (240, 560)… +34 px offsets | 0.45 | −4° ±2° |

The wall grid (1:20-1:31) replaces the work-area layout: 15 slots, two gutters of 44 px (wide) / 30 px (tall). Wide: columns at x = 288, 672, 1056, 1440, 1824 and rows at y = 220, 540, 860, tiles 340x241. Tall: columns x = 190, 540, 890, rows y = 300, 630, 960, 1290, 1620, tiles 320x227. Tile order is `WALL_GRID_WIDE` / `WALL_GRID_TALL` in beats.ts; the centre tile is the redrawn binder home; the face-down iPhone takes the last slot (it foreshadows 2:25). Props off the grid: the cup at the top-left corner of the desk, the pencil cup top-right, the ruler and eraser along the bottom edge; nothing overlaps a tile.

### 2.11 The two pairs of hands
Stylised illustration, not photography: a 2.2 px graphite contour at 70%, flat tone #E9C9A8, one shade #C98F6A on the underside and between fingers, a 2 px highlight along the top of the index finger. No nails, no rings, no sleeves; the wrist exits the frame. Three tone levels only. If they do not look elegant at review, the fallback is: pencil and props only, with the hands' shadows (2.1) entering from off-frame.

- **Pair A — the author** (right-handed). Enters from the bottom edge (wide and tall). Draws every page; ticks; rests at 0:20; draws the chips on the centre sheet at 1:25-1:28.3; lowers the pencil at 2:29-2:32.5.
- **Pair B — the assistant.** Enters from the right edge (wide) / the top-right corner (tall). Sets the cup (0:22); presses, smooths and letters the sticky note (0:27-0:32.5); slides every sheet in and out on the desk; lays half the grid; places the phone face down (1:23.5).
- On screen: A 0:01-0:25 (resting 0:20-0:24, out 0:24-0:25); B 0:26-0:33; A and B 0:35-1:20 (B only during slides, ±0.5 s around each page start; A otherwise, leaving frame during the 0.5 s slides so the sheet can be seen landing); A and B 1:20-1:23.5; A alone 1:25-1:29; A 2:28-2:33. Nowhere else. The transition has no hands: the last hand leaves at 1:29.0.

---

## 3. Glass world (Acts 3-4) in numbers

- Background: `COLORS.void` #000000, true black, no vignette, no noise. The cut to black at 1:53.0 must be a frame of pure zeros.
- Edge light: a band of light travelling along the device edge. Width 7% of the device height, Gaussian feather over 60% of that width, core `COLORS.glassWhite` #F5F7FA, halo #9FB4FF at 30% extending 2× the width outside the edge. Travel: one lap of the phone's perimeter in 8.0 s in the transition (clockwise from the top-left corner, 1:38-1:46), then a 2 s drift to the top-right corner; a single left→right sweep across both devices in 1.5 s in the pair (2:21.0-2:22.5). Bloom on everything in the void: threshold 0.6, radius 12 px, intensity 0.35.
- Hairlines (the sketch re-rendered as light): width 1.5 px logical (3 px at 4K), core #FFFFFF at 95%, glow 6 px at 35% (#DDE6FF). Accent strokes: core #9FB4FF, glow #2F5BEA at 45%. A freshly converted stroke glows at 120% for 0.6 s then settles to 100%.
- Device bodies (device-rig): matte #0B0B0C, edge highlight 1 px #3A3A40, screen glass with a 4% Fresnel reflection of the edge light; no logo, no camera bump detail beyond a soft rectangle.
- Type on glass:
  - Title "Provisum": DM Sans 700, 168 px (wide) / 132 px (tall), tracking −0.03 em, #F5F7FA, optically centred (cap-height centred on 0.5 H, left-shifted 40 px so that "Provisum 2" together is centred when the "2" arrives).
  - The "2": the accent pencil stroke, 150 px tall (wide) / 118 px (tall), 14 px line width, drawn as a single path with the paper engine's pressure and wobble but rendered as accent light (core #9FB4FF, glow #2F5BEA 45%), 42 px to the right of the "m", baseline-aligned. It completes at 1:58.0 exactly (title local 5.0). It is the only "paper" element on glass: the pencil's reach into the void, and it was first drawn on the centre sheet's corner (section 4.14).
  - Subline "A binder for your whole family.": DM Sans 400, 44 px (wide) / 38 px (tall), tracking 0, #F5F7FA at 80%, 48 px below the title's baseline, centred.
  - End card (paper, not glass; listed here for type): "Provisum 2" DM Sans 700, 120 px (wide) / 96 px (tall), #2A2A2D, tracking −0.02 em; "Free on the App Store" DM Sans 500, 36 / 32 px, #5A5A60, 24 px below; the Veyago mark (from `public/brand/`) 48 px tall, centred, 72 px above the bottom edge, at 80% opacity. Paper tooth at 10%, vignette 0.10.
  - 9:16 captions: DM Sans 500, 44 px, max 2 lines, centred, baseline 300 px above the bottom edge; on glass #F5F7FA at 92%; on paper #2A2A2D at 90% on a 40%-opacity #F3EEE3 pill (radius 16, padding 10x18).
- How the paper fades (1:31-1:38): paper texture, fibre, shadows and vignette: opacity 1 → 0 over 1:32.5-1:37.5 (easeInOutSine). Paper colour #F3EEE3 → #000000 over 1:33.5-1:38.0 (easeInOutCubic: it stays light, then the lamp dies). Any graphite not yet converted to light dims with the paper (so nothing grey survives into the void). Everything outside the phone outline (the corner "2", the margins) fades 1:37-1:38.
- How sketch lines become light (1:31-1:36): per stroke, at its conversion time, a bright head (a 10 px dot at 160%) re-traces the stroke's own path from start to end in 0.4 s; behind the head the graphite is replaced by the hairline of light. Conversion times are spread evenly over 1:31.0-1:36.0 in stroke order (`from`), so the drawing re-draws itself in light in the order it was drawn. Labels (text) convert as a whole at their stroke rank, as a 0.4 s wipe to glow text.

---

## 4. Sketch-by-sketch direction

Canvas 1200x850 sketch px; origin top-left. "Fractions" are of the page's `drawFrames`. Every page: strokes first, the accent last, the margin note as the final 6-10%. Pages 5-9 draw in 45 frames on the desk, so keep them to ≤ 16 strokes; pages 1-4 may have 20-30. All pages must also read when drawn in 2 s (the cut-downs) and when held for 10 s (the wall). Stroke ids are stable strings (the transition and the cut-downs rely on them). Each sketch exports `Sketch`, `spec: SketchSpec` and `cues(drawFrames)`; a stroke whose id starts with `tick-` emits a `hit tick` cue at its start; `coin-`, `key-`, `bubble-` emit `coin_clink`, `key_clink`, `bubble_pop`; everything else emits `stroke` cues from its own schedule.

The **phone frame convention** for screen-type pages: a portrait outline (440,95)-(760,755), corner radius 48, width 3.0, rough; screen area (452,107)-(748,743).

### 4.1 `v1-home` — Provisum 1 as it shipped (cold open, 0:01-0:19.5)
Elements, in stroke order (fractions are `V1_HOME_FRACTIONS`):
1. `frame-left` the left edge (440,755)→(440,95), drawn bottom to top in the dark, 0.000-0.162.
2. `frame-rest` top, right, bottom edges (one path with the corners), 0.162-0.270.
3. `binder-tab` a rounded rect (470,130)-(600,175) + label "Mom" (Patrick Hand 30, baseline (505,163)), 0.270-0.324.
4. `deadlines-1..3` three lines at y 330/370/410 from x 500 to 690, each with a small circle r 9 at x 480; `deadlines-bell` a bell glyph at (700,330) (20x22), 0.324-0.378.
5. `card` a rect (470,200)-(730,300) r 10, a "+" at (490,218) 16x16, three text lines y 240/262/284 from x 520 to 700, 0.378-0.432.
6. `mail` an envelope (470,460)-(560,520) with the flap V, 0.432-0.459.
7. `packets` a folder (600,460)-(730,520) with a tab (600,452)-(640,460), 0.459-0.486.
8. Ticks (accent, 26x22): `tick-binder` at (415,152) 0.514-0.530; `tick-deadlines` at (415,372) 0.649-0.665; `tick-card` at (415,250) 0.838-0.854; `tick-mail` at (415,492) 0.973-0.986; `tick-packets` at (575,492) 0.986-1.000.
No margin note (the sticky note is this page's note; the cold-open scene places it over (600,425) covering the card and the top deadline, at −4°, 320 px logical). Drawn-first mapping: this is the "before"; its card and deadline lines are the ancestors of the centre sheet's card and deadlines. The sheet, note and all, is tile 1 of the wall.

### 4.2 `family-tabs` — "Mom isn't the only one." (page 1, 0:38-0:44)
- `shelf` ruled line (80,240)→(1120,240), 0.00-0.08 (ruler, 0.2 px wobble).
- `tabs-mom` rounded rect (90,150)-(240,220) r 14, rough; label "Mom" (Patrick Hand 34) baseline (128,197); 0.08-0.22.
- erase moment 0.22-0.30 on a ghost `tabs-dad-ghost` (300,160)-(420,210) at 35% (drawn 0.18-0.22, erased 0.22-0.30, crumbs stay).
- `tabs-dad` (300,150)-(450,220) + "Dad" at (343,197), 0.30-0.40.
- `tabs-me` (510,150)-(660,220) + "Me" at (560,197), 0.40-0.50.
- `tabs-child` (720,150)-(870,220) with a child stick figure: head r 10 at (795,172), body to (795,205), arms (780,190)-(810,190), legs to (786,215)/(804,215); 0.50-0.62.
- `tabs-dog` (930,150)-(1080,220) with a dog: a 60x26 body ellipse at (1005,190), head circle r 9 at (1040,180), four 10 px legs, a tail; 0.62-0.76.
- `tabs-add` a dotted rounded rect (1100,165)-(1150,205) with a "+" (the add-a-binder affordance), 0.76-0.82.
- `arrow` ACCENT: a loose curve from (110,120) rising to (560,70) and down to (1040,118), arrowhead 22 px, 0.84-0.92.
- Margin note (accent, Caveat 500, 44): **"Mom isn't the only one."** baseline (560,420), −2°, 0.92-1.00.
Drawn-first: the tab row → the binder switcher (the top bar of the real binder home: snap 1 at 1:41, and cut 1 at 2:04: the switcher menu open, listing Mom, Dad, Me, a child and a pet binder). The child and the dog are drawn, not named, so no fictional names are invented; the real switcher shows the sample data's names.

### 4.3 `watch-wallet` — "What if the card were on her wrist?" (page 2, 0:44-0:49)
- `watch-case` rounded square (150,250)-(380,520) r 60, rough, 0.00-0.18; `watch-strap-top` (205,180)-(325,250) r 20, `watch-strap-bottom` (205,520)-(325,590) r 20, 0.18-0.26; `watch-crown` a 12x26 rect at (380,320), 0.26-0.28.
- `card-face` the emergency card small on the face: rect (185,300)-(345,470) r 12, "+" at (200,315) 14x14, hatch (1.2 px, 6 lines) across the top strip y 300-330, 0.28-0.46; `card-face-lines` four lines y 350/380/410/440 x 200-320, 0.46-0.52.
- `wallet-base-1` card (700,330)-(1040,540) r 24; `wallet-base-2` (720,300)-(1060,510) r 24; 0.52-0.68.
- `wallet-top` the emergency card again (740,270)-(1080,480) r 24 with "+" and three lines, drawn on top, 0.68-0.80.
- `arrow` ACCENT from (360,390) curving over to (730,390), arrowhead, 0.80-0.88.
- Margin note **"What if the card were on her wrist?"** (36 px, it is long) baseline (120,700), −1.5°, 0.90-1.00.
Drawn-first: `card-face` → the card landing on the Watch (1:48.5) and cut 2 (the Watch face); the Wallet stack → the Wallet pass sliding out (1:50).

### 4.4 `pill-bottle` — medication list on the card, with refill reminders (page 3, 0:49-0:53)
- `cap` (400,270)-(640,330) r 8 with 6 vertical hatch lines, 0.00-0.10; `body` (420,330)-(620,700) r 20, rough, 0.10-0.26.
- `label` rect (445,420)-(595,620) r 6, 0.26-0.34; `label-lines` five lines y 450/480/510/540/570, the first from x 460 to 580 (the name), the rest to 560, 0.34-0.52.
- `bell` at (520,200): body arc (490,220)→ over the top → (550,220), a base line, clapper dot r 4 at (520,232), 0.52-0.66.
- `card` the emergency card beside: (720,560)-(900,680) r 10 with "+" and three lines, 0.66-0.78.
- `circle` ACCENT around the bell, r 60 at (520,205), 0.80-0.86; `arrow` ACCENT from the label's right edge (600,520) to the card (715,600), 0.86-0.92.
- Margin note **"On the card, with a refill reminder."** (36 px) baseline (700,420), +2°, 0.92-1.00.
Drawn-first: `label-lines` → the medication list on the real emergency card; the bell → the refill reminder row (cut 3). Nothing here is adherence tracking: no schedule, no taken/not-taken.

### 4.5 `share-card` — share the emergency card with family (page 4, 0:53-0:56)
- `card` (480,330)-(720,520) r 18 rough with "+" (496,346) and three lines, 0.00-0.26.
- `phone-left` (150,300)-(290,560) r 24; `phone-right` (910,300)-(1050,560); `phone-bottom` (530,590)-(670,840); 0.26-0.66 (three outlines, 0.13 each).
- `link-1..3` dotted lines from the card's edges to each phone's nearest edge, 0.66-0.76.
- `lock` on the card: shackle arc r 22 from (578,420) over to (622,420), body rect (570,420)-(630,470) r 6, keyhole dot r 4 at (600,440), 0.76-0.82.
- `circle` ACCENT r 48 at (600,442), 0.82-0.88.
- Margin note **"Encrypted before it leaves the phone."** (36 px) baseline (120,760), −2°, 0.90-1.00.
Drawn-first: the shared card → the real "shared with family" state of the emergency card; it has no cut of its own in Act 4; VO 7's "none of it on our servers" is where the lock pays off. On the wall it is tile 5.

### 4.6 `scam-letter` — "Is this a scam?" (page 5, 0:56-0:58)
- `envelope` rect (300,250)-(820,580) rough, 0.00-0.22; `flap` (300,250)→(560,440)→(820,250), 0.22-0.34; `stamp` (720,280)-(790,340) with 4 hatch lines, 0.34-0.42; `address-1..3` lines y 460/500/540 from x 380 to 640/600/560, 0.42-0.58.
- `question` ACCENT label "?" (Kalam 700, 120) baseline (865,410), 0.62-0.78; `circle` ACCENT r 85 at (905,370), 0.80-0.88.
- Margin note **"Is this a scam?"** baseline (840,640), −3°, 0.90-1.00.
The script's "red question mark" is the accent (one accent colour in the film; DECISIONS #9).
Drawn-first: the envelope → the scanned letter (cut 4), the circled "?" → the scam note on it (the pattern banner).

### 4.7 `passport` — passports and IDs, reminded early (page 6, 0:58-1:00)
- `passport` (160,180)-(500,640) r 14 rough, 0.00-0.24; `emblem` circle r 40 at (330,330), 0.24-0.32; `lines` y 540/580 x 200-460, 0.32-0.40.
- `ruler` rect (600,380)-(1120,440) ruled (the real ruler: `ruler_tap` at the start), 0.42-0.56; `graduations` 26 marks every 20 px along the top edge (y 380-392, every fifth to 400), 0.56-0.66.
- `tick-9` ACCENT 3.0 at x 700, y 330-375; `tick-6` at x 860; `tick-3` at x 1020; 0.68-0.72 / 0.74-0.78 / 0.80-0.84 (these ticks are drawn as ticks but do not emit `tick` cues; their id prefix is `mark-`, not `tick-`).
- Labels (Patrick Hand 30, graphite) "9", "6", "3" at (694,480), (854,480), (1014,480) and "months" at (1050,480), 0.84-0.90.
- Margin note **"Reminded early. For everyone."** baseline (600,620), −2°, 0.90-1.00.
Drawn-first: the passport → the real passport document; the three marks → its reminder rows at 9, 6 and 3 months (cut 5).

### 4.8 `shared-costs` — "Who paid what?" (page 7, 1:00-1:02)
- `split-1`, `split-2` dotted verticals at x 425 and 775, y 180-700, 0.00-0.10.
- `fig-1..3` stick figures at x 250/600/950: head r 28 at y 250, body to 400, arms at y 310 ±40, legs to y 470 ±30; 0.10-0.62 (0.17 each).
- `coin-1..6` circles r 16: under fig 1 at (230,510),(272,510); under fig 2 at (560,510),(600,540),(640,510); under fig 3 at (950,510); 0.62-0.78 (each coin a `coin_clink`).
- `circle` ACCENT r 64 at (600,520) (the one who paid most), 0.80-0.86.
- Margin note **"Who paid what?"** baseline (780,650), +2°, 0.88-1.00.
Drawn-first: figures and coins → the real shared costs summary (who paid what) and its export (cut 6).

### 4.9 `where-is-it` — "Where is the original?" (page 8, 1:02-1:04)
- `key-ring` circle r 50 at (300,400), 0.00-0.12; `key-shaft` (350,400)→(560,400) width 2.2, 0.12-0.20; `key-teeth` three 10x30 rects at x 520/538/556 hanging from the shaft, 0.20-0.28 (`key_clink`).
- `box` (680,260)-(1000,560) r 10 rough, 0.28-0.48; `box-inner` (700,280)-(980,540), 0.48-0.56; `handle` circle r 14 at (960,410) and `keyhole` dot r 5 + slot 5x14 at (840,410), 0.56-0.62.
- `link` dotted from the key's teeth (565,400) to the keyhole (830,410), 0.62-0.70.
- `circle` ACCENT r 40 at (840,410), 0.80-0.86.
- Margin note **"Where is the original?"** baseline (640,660), −2°, 0.88-1.00.
Drawn-first: the box → the "where it is" of a record (the real location field). No cut of its own; wall tile 10.

### 4.10 `visit-recording` — "Record it. Keep it on the phone." (page 9, 1:04-1:06)
Drawn in simple side elevation.
- `desk` line (150,560)→(1050,560), 0.00-0.14; `legs` (180,560)→(180,700), (1020,560)→(1020,700), 0.14-0.20.
- `chair` seat (240,480)-(380,560), backrest (250,360)→(250,480), 0.20-0.34.
- `clipboard` (720,420)-(900,560) with a clip (790,410)-(830,430), 0.34-0.46.
- `phone` lying on the desk, side view: (540,520)-(640,556) r 6, 0.46-0.54.
- `wave` a single path from (300,260) to (900,260): amplitude rises from ±10 to ±60 around x 500-700 and falls again, ~40 crests, width 2.2, 0.56-0.78.
- `circle` ACCENT r 70 at (590,538) (the phone), 0.82-0.88.
- Margin note **"Record it. Keep it on the phone."** (36 px) baseline (140,700), −1°, 0.90-1.00.
Drawn-first: the wave → the visit's recording; the clipboard → the visit summary (cut 7: the after-visit summary with its private transcript).

### 4.11 `europe-map` — country-aware binders (page 10, 1:06-1:09)
- `coast` one long closed rough path, the western-European outline within (250,150)-(1000,720): the Channel coast across the top-left, the Dutch and Belgian coasts notching at (470-520, 230-330), the German north coast to (820,190), the eastern edge down to (900,650), the Mediterranean coast back along the bottom, the Atlantic coast up the left with the Breton bulge at (280,420); 0.00-0.40.
- `uk` a separate blob (160,120)-(330,330), 0.40-0.48.
- `border-1..3` three interior lines: France/Belgium-Germany (430,400)→(560,250)→(640,330); Netherlands/Belgium (430,300)→(560,300); Germany/France (640,330)→(640,560); 0.48-0.60.
- Circles ACCENT (this page's exception: four): `circle-nl` r 45 at (500,250) 0.62-0.665; `circle-be` r 38 at (470,335) 0.665-0.71; `circle-de` r 90 at (700,360) 0.71-0.755; `circle-fr` r 110 at (420,520) 0.755-0.80.
- Labels ACCENT (Caveat 700, 56): **"112"** baseline (1010,250) 0.82-0.90; **"A4"** baseline (1020,340) 0.90-0.95.
- Margin note **"Past one country."** baseline (980,640), −2°, 0.95-1.00.
Drawn-first: `circle-be` → the Belgian binder's emergency mode with its red "Call 112" button (cut 8); "A4" → the packets printing on A4 (not cut).

### 4.12 `speech-bubbles` — Spanish, German, French and Dutch (page 11, 1:09-1:12)
Five bubbles: rounded rects r 40 with a 30 px tail toward the centre of the page; labels Patrick Hand 44, graphite, centred.
- `bubble-1` (130,190)-(370,310) "Hello" 0.00-0.14; `bubble-2` (525,140)-(755,260) "Hola" 0.14-0.28; `bubble-3` (870,240)-(1090,360) "Hallo" 0.28-0.42; `bubble-4` (290,420)-(550,540) "Bonjour" 0.42-0.58; `bubble-5` (720,480)-(920,600) "Hoi" 0.58-0.72 (each completes with `bubble_pop`).
- `tick-1..5` ACCENT beside each bubble's tail, 0.76-0.90 (0.028 each; `tick` cues).
- Margin note **"Four more languages."** baseline (120,740), −2°, 0.92-1.00.
Drawn-first: the bubbles → the app's languages; no cut of its own (cut 8's Belgian binder shows the region, not a language). Wall tile 13.

### 4.13 `form-to-chat` — "Just ask them." (page 12, 1:12-1:20; drawFrames 225)
Fractions are `FORM_TO_CHAT_FRACTIONS`. Two phone frames side by side.
- Left `form-frame` (120,95)-(440,755) r 48 rough, 0.00-0.08; `form-title` scribble line (150,140)→(330,140) 2.2, 0.08-0.10.
- `field-1..7` rounded rects (150,y)-(410,y+44) r 8 for y = 190, 260, 330, 400, 470, 540, 610, 0.10-0.30; placeholders (Reenie Beanie 26, graphiteSoft) inside each, staggered 0.12-0.32: "Name", "Date of birth", "Doctor", "Pharmacy", "Insurer", "Policy no.", "Allergies".
- `save` rect (150,680)-(410,730) r 12 with a short centred scribble, 0.30-0.33.
- PAUSE 0.33-0.40 (the pencil rests, tip down, 12 px off the paper, at (430,760)).
- `cross` ONE graphite stroke, width 4.0, pressure 1.3: (130,110)→(430,740), 0.40-0.47. Nothing else moves.
- PAUSE 0.47-0.53.
- Right `chat-frame` (760,95)-(1080,755) r 48 rough, 0.53-0.62.
- `question` label (Patrick Hand 36, graphite, two lines): "Who are you" baseline (800,300), "looking after?" baseline (800,348), 0.62-0.72.
- `chips-mom` pill (800,420)-(920,470) r 25 + "Mom" (Patrick Hand 30) at (830,454), 0.78-0.84; `chips-dad` pill (940,420)-(1060,470) + "Dad" at (970,454), 0.84-0.90.
- Margin note ACCENT **"Just ask them."** baseline (520,440) between the frames, −4°, 0.90-0.94.
- `circle` ACCENT ellipse 300x90 centred (930,445) around both chips, 0.94-1.00.
Drawn-first: the chips → snap 4 (1:47) and cut 9 ("Who are you looking after?" with its chips in the real onboarding); the crossed-out form → nothing: it is the thing that is gone.

### 4.14 `binder-home-v2` — the redrawn binder home (the centre tile, traced to light)
This sheet is the sum of the others and it is built ON THE REAL LAYOUT: the footage agent exports `public/footage/binder-home.layout.json` (element frames in screen points on the capture device, plus the screen's point size) and `binder-home.png` (the matching still). Build from it; do not guess.

Mapping from screen points to sketch px: screen area (452,107)-(748,743) inside the phone frame convention; `X = 452 + x · 296 / W_pt`, `Y = 107 + y · 636 / H_pt` (on an iPhone 17 Pro capture W_pt = 402, H_pt = 874; read the JSON's values). Draw one simple shape per real element at its mapped frame:

| Group (stroke id prefix) | Real element in the 1.2 binder home | Draw | Fractions (`BINDER_HOME_V2_FRACTIONS`) |
|---|---|---|---|
| `frame-` | the phone | the phone frame convention, rough | 0.00-0.12 |
| `tabs-` | the top bar: the binder's name with the switcher (the row of binders) | three small tabs 90x38 r 10 across the mapped bar frame, the first with "Mom" (Patrick Hand 24) | 0.12-0.24 |
| `card-` | the Next-up card (the big countdown) | the card's rect r 16, a big "12" scribble (two strokes, 60 px) at its top-left, two text lines, a short pill (the verb) bottom-left | 0.24-0.42 |
| `deadlines-` | the "Later" lines (the next dates) | three lines with a small circle at the left, at the mapped rows | 0.42-0.54 |
| `dock-` | the dock: five round buttons (Emergency first) | five circles r 22 at the mapped centres; the first with a small "+" | 0.54-0.64 |
| `two` (label) | — | ACCENT "2" (Caveat 700, 72) baseline (1110,120), −6°: the first "2" of the film, on paper | 0.66-0.70 |
| (pause) | | the sheet is dropped in the grid in this state | 0.70-0.85 |
| `chips-` | the helper chips under the dock (the conversation's chips on the home) | two pills r 22 at the mapped frames of the first two chips, labelled with the strip's own first two titles shortened (Patrick Hand 26) | 0.85-0.95 |
| `circle` | — | ACCENT ellipse around both chips | 0.95-1.00 |

No margin note on this sheet; it is the clean sheet. Element order on the real screen (top to bottom): title bar, Next-up card, Later lines, dock, helper chips; if the JSON disagrees, the JSON wins. Every stroke id must start with its group prefix (`SNAP_GROUPS` in beats.ts groups them for the transition). The sheet is rendered in the wall with `<Sequence from={-400}>` and `drawFrames 650` (`wall.centreSheet`), so it lands at fraction 0.708 and the chips draw at 1:25.1-1:28.3 under the hand.

Drawn-first mapping is the transition itself: `tabs-` → the top bar (snap 1), `card-` → the Next-up card (snap 2), `deadlines-` + `dock-` → the Later lines and the dock (snap 3), `chips-` → the helper chips (snap 4); the whole screen → the face-up phone at 2:25 showing this exact home.

---

## 5. Transition direction (1:31-1:48, module `transition`, local 0-17)

Numbers in `transition` in beats.ts. The language changes here: from the desk to the keynote.

1. **1:31.0 (0.0) the lines catch light.** Strokes of `binder-home-v2` convert in stroke order, evenly spread over 0.0-5.0, 0.4 s each (section 3). The swell lands on the first conversion. The camera is static (the push-in has already stopped).
2. **1:32.5-1:37.5 (1.5-6.5) the paper fades**; **1:33.5-1:38.0 (2.5-7.0) the paper goes black**; **1:37-1:38 (6.0-7.0) everything outside the phone outline fades** (the corner "2", the sheet edges). At 1:38.0 the frame is black with only the lit drawing.
3. **1:38.0 (7.0) it becomes real.** The pulse locks. Lift-off 7.0-9.0: the outline thickens into the device-rig phone (section 3), the flat drawing becomes the screen plane; perspective FOV 0° → 28° over 7.0-10.0. Rotation Y: 0° (7.0) → −8° (8.5) → +22° (17.0), easeInOutSine, i.e. about 3.5°/s through the middle; rotation X 0° → −5° over the same span. The phone's centre stays at (0.50 W, 0.52 H) wide / (0.50, 0.50) tall, its height 78% of the frame (wide) / 62% (tall).
4. **Edge light path:** starts at the top-left corner at 7.0, runs clockwise (top edge → right edge → bottom → left) one full lap by 15.0, then drifts along the top edge to the top-right corner by 17.0 and rests there for the handoff. `sweep` cue 7.0-15.0.
5. **UI snaps** on the beats, each 0.3 s with the keynote ease: the group's hairlines flare to 160%, then crossfade into the real pixels (cropped from `binder-home.png` by the layout JSON's frames) scaling 1.03 → 1.00; a `snap` hit on each.
   - **1:41.0 (10.0) tabs:** the sketched tab row → the top bar (binder name + switcher).
   - **1:43.0 (12.0) card:** the sketched card → the Next-up card with its countdown.
   - **1:45.0 (14.0) deadlines:** the sketched date lines and the five dock circles → the Later lines and the dock.
   - **1:47.0 (16.0) chips:** the two sketched chips → the helper chips.
   Un-snapped groups stay as hairlines until their beat; after 16.3 the screen is entirely real. The phone's own outline stays a lit edge (it is now the device edge under the band of light).
6. **Handoff at 1:48.0 (17.0):** rotation Y +22°, X −5°, screen complete, edge light resting at the top-right corner, glow at 100%. `familyOfDevices` starts from exactly this state (`transition.handoff`).
7. **1:48.0 the card flips to the Watch** (`familyOfDevices` local 0.0): the hit is the card peeling off the glass (the Next-up card's place is NOT what flips: the emergency card, as a 3:2 card the size of the dock's first button grown to 40% of the phone's width, lifts off the screen from the dock's first circle). It flips once around its long axis (180° over 0.5 s, keynote ease) while the phone slides left to x 0.36 W (wide; stays centred in tall, where the devices stack: phone upper at (0.5, 0.38), Watch at (0.32, 0.74), pass at (0.68, 0.76)) and the Watch lights in at x 0.66 W (edge light first, body second). The card lands on the Watch face at 1:48.5 (`snap` hit): the Watch face shows the real card capture from then on.
8. **1:50.0 the Wallet pass** slides out from behind both devices (from the gap between them, downward-right 120 px, 0.8 s, keynote ease), `wallet_slide`. It is a pass: rounded 3:2, the card's capture on it, no wallet UI.
9. **1:51-1:53 the light settles:** edge light speed → 0, glow 100% → 70%, rotation stops. No drift.
10. **1:53.0 hard stop.** Picture cuts to pure black on the same frame the sound stops. No fade, no tail.

---

## 6. Act 4 direction

### 6.1 Title (1:53-2:04, module `title`)
- 1:53.0-1:55.0: black, silent. One full second of nothing, then the silence holds; the audience must notice the silence before anything comes back.
- 1:55.0-1:56.5: "Provisum" fades in letter by letter (the script's "one word at a time" for a one-word title): 8 letters, 0.12 s stagger, each a 0.6 s fade from 0 with a 6 px rise; `title_in` at 1:55.0. The soft low swell begins with the first letter.
- 1:56.5-1:57.0: hold.
- 1:57.0-1:58.0: the "2" is drawn as a single accent pencil stroke (section 3), its head moving at a constant 0.9 of the stroke's length per second then easing out; it **completes at 1:58.0 exactly** (local 5.0) as the music resolves. A quiet pencil `stroke` cue runs under it: the one pencil sound in the void.
- 1:58.0-2:00.0: hold "Provisum 2".
- 2:00.0: the subline fades in over 1.0 s: "A binder for your whole family."
- 2:04.0: cut.

### 6.2 The real thing (2:04-2:20, module `realThing`)
Nine hard cuts on the beat, in the order of the pages, durations 2.0/1.5 alternating (the music map). `FEATURE_CUTS` has the times. Framing alternates: the 2.0 s cuts are **the phone in the void** (the device rig, rotation Y as listed, slight −4° X, edge light resting at a corner, real footage on the screen), the 1.5 s cuts are **full-bleed** crops of the footage (the UI fills the frame, 1.06x scale, slow 2% drift). Footage runs at speed; nothing is slowed. Requested footage keys (names are requests; `docs/FOOTAGE.md` is the truth):

| # | Master | Dur | Footage | Framing | What we see |
|---|---|---|---|---|---|
| 1 | 2:04.0 | 2.0 | `family-tabs` | void, Y −12° | the binder switcher open: Mom, Dad, Me, a child, a pet; one tap switches |
| 2 | 2:06.0 | 1.5 | `watch-card` | bleed | the Watch face with the emergency card (watch rig) |
| 3 | 2:07.5 | 2.0 | `refill-reminder` | void, Y +10° | the card's medication list, a refill reminder row |
| 4 | 2:09.5 | 1.5 | `scam-note` | bleed | the scanned letter with its scam note/banner |
| 5 | 2:11.0 | 2.0 | `passport-reminder` | void, Y −8° | the passport document and its 9/6/3-month reminders |
| 6 | 2:13.0 | 1.5 | `shared-costs` | bleed | who paid what; the summary |
| 7 | 2:14.5 | 2.0 | `visit-summary` | void, Y +14° | the visit summary with its private transcript |
| 8 | 2:16.5 | 1.5 | `call-112` | bleed | the Belgian binder's emergency mode: the red Call 112 button |
| 9 | 2:18.0 | 2.0 | `onboarding-chips` | void, Y 0° | "Who are you looking after?" with its chips; the phone faces camera so the pair can take over |

VO 7 starts at 2:04.5 and ends about 2:13.5 (estimate); cuts 6-9 run under music alone. Dark appearance (`OB_APPEARANCE=dark`) throughout so the UI sits in black.

### 6.3 The pair (2:20-2:25, module `pair`)
Phone (left, centre 0.36 W, Y −14°) and Watch (right, centre 0.66 W, Y +12°), both facing slightly inward; the Watch is scaled to 55% of the phone's height (a hero, not a scale model). Tall: phone at (0.5, 0.40), Watch at (0.5, 0.78) at 60%. The phone shows the binder home, the Watch the card. 2:20.0 music peak; 2:21.0-2:22.5 one band of light sweeps left → right across both devices' edges (`sweep`); 2:24.0-2:25.0 the glow dims to 40%; 2:25.0 hard cut.

### 6.4 Back to the desk (2:25-2:33, module `backToDesk`)
Cut to the paper in the warmer light (2.1). The camera's framing is the end of the wall's rise (0.78) tightened to 1.00 on the centre tile; the real iPhone lies face UP on the centre tile, rotated +6°, showing the binder home (the footage still `binder-home.png` on the device-rig phone seen top-down, with the lamp's reflection as a soft diagonal 8% highlight on the glass). The drawing under it is the same home. Slow push 1.00 → 1.08. VO 8 at 2:26.0. At 2:28.0 the closing line **"Provided for."** fades in (0.6 s) in Caladea italic 400, 48 px (wide) / 42 px (tall), graphite at 85%, bottom-centre, 120 px above the bottom edge: the one Cambria line of the film, under the VO's "provided for". Pair A's hand enters at 2:28.0 with the pencil, lowers it beside the phone from 2:29.0 and **stops a hair above the paper at 2:32.5**, holds, cut at 2:33.0. The click is not here (6.5).

### 6.5 End card (2:33-2:40, module `endCard`)
Off-white, like the paper (section 3 for type). "Provisum 2" fades in 2:33.0-2:34.0; "Free on the App Store" 2:34.0-2:35.0; the Veyago mark 2:35.0-2:36.0. Nothing moves after 2:36.0. The final chord has decayed by 2:37.0. **2:38.0: the click of the pencil being set down**, the last sound of the film, heard over the card (the gesture the audience saw start at 2:29 finishes here, off-screen: a sound bridge, DECISIONS #14). Hold to 2:40.0; end on the card, no fade.

---

## 7. Voice and sound direction (beyond CONTRACT §7-8)

### 7.1 Where foley carries the scene
- **0:00-0:06** is foley alone: the pencil in the dark is the first thing the audience hears, before any picture. The scratch must be dry, close, slightly too loud; it is the film's signature.
- **0:20-0:28** the breath: no pencil, the cup (0:22) and the room. Keep a faint room tone (the lamp's hum is too much; paper settling is right).
- **0:35-1:12** every page has three sounds: the sheet sliding in (`slide`, panned to the side it enters from: right in wide, top-right in tall), the drawing (`stroke` cues from the sketch's own schedule, pressure following the line weight), the page's one object sound (ruler tap, coin, key, bubble pops) from `cues(drawFrames)`. The accent pencil is a slightly waxier, smoother scratch than graphite; the fineliner (0:28.5 only) is a faint squeak.
- **1:12-1:20** the music leaves so the pencil is exposed: the form's seven fields are seven short scratches; the cross-out is one long, hard stroke with the paper audibly resisting; the chips are two soft ones. Silence between the gestures is part of it.
- **1:20-1:25** fourteen sheets landing in seven pairs is a rhythm, not a mess: `paper_drop` on every half-second, the phone's `phone_down` heavier.
- **1:31-1:38** foley hands over to music: strokes catching light have NO pencil sound; the swell and a very soft high shimmer per conversion (the sound department's choice) are all.
- **1:38-1:53** `snap`, `card_flip`, `snap`, `wallet_slide`: four glass ticks, dry and small; the hits are music's job.
- **1:57-1:58** one pencil stroke in the void (the "2"): the only paper sound on glass; mix it under the resolve.
- **2:25-2:33** the room again: the pencil in hand is heard moving (cloth, a faint wood tap at 2:29 as it passes the ruler), then NOTHING from 2:32.5.
- **2:38.0** the click. Alone. It must be the last sample of the film; nothing after it, no room tone tail beyond 0.4 s.

### 7.2 Protecting the silence at 1:53
- 1:53.0-1:54.0 is digital silence: music, foley, room tone and VO all cut on the same frame (sample-accurate), no reverb tail (print the music with its tail cut, do not rely on a fade). 1:54.0-1:55.0 stays silent; the swell may begin at 1:55.0 at −30 dB and rise.
- Picture is pure black for the same two seconds (no logo, no grain).
- Loudness: the section before the stop (1:48-1:53) sits at the film's loudest (−14 LUFS-S peak region); the title swell enters 12 dB under that so the silence is felt twice: once as absence, once as the quiet return.
- VO 7 is the first voice after the silence (2:04.5); nothing speaks between 1:20.3 and 2:04.5.
- The cut-downs keep a shorter version: 0.5 s in the vertical (into the title segment), 1.0 s in the teaser (its own segment). Never shorter than 0.5 s.

### 7.3 VO
- Read slower than feels natural, warm, first-person plural, no sell. Pronunciation: record both pro-VEE-zum and pro-VY-zum for VO 1 and VO 8 (contract); the director picks. VO 1 is at its time limit (DECISIONS #6): record it at 2.3 words/s or faster, or we drop "already".
- Ticks in the cold open follow the VO's nouns (`coldOpen.ticks`, estimates): the VO engineer reports the real word times and the sound department moves the ticks to the nearest 0.5 s grid point AFTER the noun starts.
- A no-VO mix is delivered for every version: in it, the music map and foley are identical; nothing is re-timed.

### 7.4 Captions (burned into the 9:16 versions only)
Text per segment is in `src/edits.ts` (`props.captions`). Style in section 3. Rules: captions carry the VO where a VO line plays and one short feature line where none does; never more than two lines; never over the sticky note, the title or the end card (those are the copy); paper tone on paper, glass tone on glass. The vertical's captions:
1. "It worked. So we sat down and asked the harder question."
2. "We started with a person."
3. "Her emergency card, on Apple Watch and in Wallet."
4. "And then the biggest one." / "Stop asking people to fill in forms. Just ask them."
5. "Everything we drew. On your iPhone."
6. "No account. No tracking."
The teaser has no captions.

---

## 8. Interfaces (who exports what)
- `src/beats.ts` — every timing; `DESK_PAGES` (page schedule), `FEATURE_CUTS`, `transition.snaps`, `SNAP_GROUPS`, `wall.centreSheet`, the fraction tables for the three special pages, `VO`, `validateBeats()`.
- `src/edits.ts` — `VERTICAL_45`, `TEASER_15`, `TEASER_15_WIDE`, `EDLS`, `validateEdl()`.
- Sketch owners export `Sketch`, `spec`, `cues(drawFrames)`; stroke ids as directed in section 4.
- The footage agent exports `public/footage/binder-home.layout.json` + `binder-home.png` first (the centre sheet and the transition cannot start without them), then the nine cuts' footage and the Watch/Wallet captures.
- The device rig exports the un-badged phone, the Watch and the pass with an `edgeLight` parameter (position along the perimeter 0-1, intensity) and `rotation` in degrees, so scenes can drive them from the keyframes in beats.ts.
