# "Provided For", the long film (v4): the bible

Creative direction for every session on the 10-minute film. `CONTRACT.md` (section 13) is the interface; `docs/SCRIPT-10MIN-v4.md` is the source; this file is the taste and the numbers. Times here are MASTER times (m:ss) unless a line says "local"; the module-local numbers that code imports live in `src/sheet4.ts` (the sheet, the line, the camera), `src/beats4.ts` (every timing) and `src/edits4.ts` (the cut-downs). Where this file and those files disagree, the code wins and the director owes a fix. The v1 bible (`docs/BIBLE.md`) still rules everything it covers: paper, graphite, lamp, shadows, hand-lettering faces, the glass world, the device rig. This file adds what v4 needs and only overrides where it says so.

The film in one sentence: **one pencil line, ten minutes long, that never breaks, on one sheet of paper that never cuts, telling how an app was made for the person who holds a family together.** Three voices, three inks. The camera moves; the paper folds; the line goes on.

---

## 1. The sheet

### 1.1 Coordinate system
- **Sheet px** = logical px at camera zoom 1.0 (the wide canvas 1920x1080 shows 1920x1080 sheet px at zoom 1.0; the tall canvas 1080x1920 shows 1080x1920). The paper is infinite; the drawing occupies the rectangle **(0,0)-(40000,8000)**, i.e. 40 A3 sheets wide at the v1 desk scale (an A3 landscape sheet = 1000 sheet px). Origin top-left, y down. Code: `SHEET` in `src/sheet4.ts`.
- **The baseline** of the pencil line is y = 4000. The line enters every chapter on the baseline and leaves it on the baseline (the hand-off points, 1.3); inside a chapter it may climb, dip, write and draw.
- **Scale of drawn things:** a device outline uses the v1 line weights, read as sheet px at zoom 1.0 (device outlines 3.0, UI boxes 2.2, text lines 1.6, hatch 1.2, accent ticks 3.0, circles 2.6). Drawings scale with the sheet (they are graphite on paper), never thinner than 1 screen px. **The pencil line itself is the exception:** it renders at a constant **3 screen px** (2 in tall), never thinner than 1.5, whatever the zoom. The pencil does not change; the paper gets far away.
- **The central column.** Each chapter's essential art lives inside a column **1080 sheet px wide** centred on the region's x (at the chapter's working zoom the column fills the tall frame exactly). Flourishes may go wider; nothing a viewer must read may.
- **Nested scale (chapters 8-9).** The village is not drawn beside the map; it is drawn INSIDE the map, in the United States, at 0.25 of the sheet scale, and the camera zooms to 4-5x to visit it. Sam's flat sits at Lisbon on the same world map. The "paper sea" between them is the drawn Atlantic. Sizes in chapter 9 are given in sheet px (already at the nested scale) and text sizes in SCREEN px at the chapter's working zoom.

### 1.2 Regions (centre, size, working zoom)
| # | Chapter id | Centre | Size (w x h) | Working zoom (wide) | What sits there |
|---|---|---|---|---|---|
| 1 | `line` | (1800, 4000) | 3600 x 2200 | 1.0-1.2 | the line, its four quick sketches, the super it writes |
| 2 | `mayasHouse` | (5400, 3800) | 2400 x 2600 | 0.9 | the house (footprint 4860-5940 x, ground y 4450, eaves y 3850, apex (5400, 3450)); the family tree above it (y 2650-3350); Sam's plane at (6400, 2900) |
| 3 | `theNo` | (9000, 3900) | 2400 x 2200 | 0.9 | two letters at (8640, 4000) and (9360, 4000); the engine block 900 x 520 at (9000, 4000); the calendar 520 x 600 at (9000, 3200) |
| 4 | `filterMachine` | (12600, 3600) | 2400 x 3000 | 0.8 | the machine: hopper 1000 wide y 2500-2800, body 700 wide y 2800-4500, gates at y 3000/3300/3600/3900/4200, plaques at x 13050 (420 x 90), tray 500 x 120 at (12600, 4700), the stopped pile at (12100, 4600) |
| 5 | `researchBoard` | (16200, 3900) | 2600 x 2200 | 0.8 | the board 1600 x 1200 at (16200, 3900); four cards 440 x 300 at (15760, 3500), (16640, 3500), (15760, 4250), (16640, 4250); the 2x2 chart 420 x 400 at (16200, 3900); six boxes 200 x 140 in a row at y 4300, x 15450-16950 step 300; the hand truck at (17100, 3900) |
| 6 | `nameAndLook` | (19800, 4000) | 2400 x 2000 | 0.8 (2.2 inside the screen) | the names sheet 520 x 640 at (19500, 3700) at -3°; PROVISUM at (20000, 3900); the laptop 1080 x 700 at (19800, 4150), its screen 900 x 560 at (19800, 4050) |
| 7 | `engineRoom` | (23400, 3850) | 2400 x 3600 | 0.45 (0.9 per floor) | the phone cutaway 900 x 2700 at (23400, 3850): floors "Code" y 2500-3350, "The data" y 3350-4450, "The vault" y 4450-5200; below the cutaway: the cloud (23500, 5500), the server box (22950, 5500), two phones (23050, 5800), (23750, 5800) |
| 8 | `launch` | (27200, 3600) | 3200 x 2800 | 0.8 → 0.55 → 4.0 | the pad 400 x 140 at (26200, 4400), the rocket 160 x 520 on it; the world map 2600 x 1400 at (28000, 3300); the United States around (27600, 3250); Europe around (28550, 3080), Lisbon at (28380, 3180) |
| 9 | `village` | (27600, 3380) | 1400 x 800 (nested, scale 0.25) | 2.0 (visits at 5.0) | Dad's house (Maya's home) 270 wide at (27600, 3262); Leo (27310, 3270) 200; Mia (27890, 3270) 200; Maya (27460, 3480) 220; Jonas (27760, 3480) 220; Biscuit's kennel 110 at (27610, 3620); Sam's flat 160 x 200 at (28380, 3180); the village green at (27600, 3420) |
| 10 | `paperToGlass` | (27600, 3380) | screen space | 2.0 (parked) | the void; nothing new on the sheet |
| 11 | `providedFor` | (37800, 4000) | 2400 x 1600 | 0.045 → 1.0 | the pencil lying at (37700, 4080) at 12°, tip at (37420, 4005); the end-card copy on the clear paper centred (38300, 3850) |

The last chapter sits at x 37800 so that the pull-back at 9:30 shows the line travelling the whole 40 sheets before it ends at the pencil.

### 1.3 The unbroken pencil line (one SVG path, sheet coordinates)
The line is one path from (200, 4000) to the pencil tip at (37420, 4005). `src/sheet4.ts` holds `LINE_ANCHORS`: per chapter, the points the head passes and the LOCAL time it reaches each; `PencilLine` draws a Catmull-Rom spline through them with the v1 wobble (0.8 px, 0.03/px) and reveals it by time. Between chapters the line always runs along the baseline. The hand-off points (sheet px, and the local time the head crosses the chapter boundary):

| Chapter | Enters at | Leaves at | Leaves at (local) |
|---|---|---|---|
| 1 | (200, 4000) start | (4700, 4000) → corner down to (4700, 4450) | 27.0 (corner), 30.0 at (4860, 4450) |
| 2 | (4860, 4450) the house's ground line | (7800, 4000) | 45.0 |
| 3 | (7800, 4000) | (10800, 4000) | 40.0 |
| 4 | (10800, 4000) | (15000, 4000) | 55.0 |
| 5 | (15000, 4000) | (18600, 4000) | 65.0 |
| 6 | (18600, 4000) | (21800, 4000) | 55.0 |
| 7 | (21800, 4000) | (25400, 4000) | 75.0 |
| 8 | (25400, 4000) | the rocket's arc: the line IS the trail; it lands in the US at (27600, 3300) | 15.0 (landing) |
| 9 | (27600, 3300), nested scale | (28800, 3300) the map's edge (drawn in chapter 11) | — |
| 10 | — (the line is light; see 1.4) | — | — |
| 11 | (28800, 3300) | (37420, 4005) the pencil tip | 11.0 |

Chapter 1's detours (local time the head reaches each, in `LINE_ANCHORS.line`): the handwritten super 1.5-4.5 between x 290 and 1250 (the line rises 90 px into cursive and returns); the heart rate at x 1400-1700 (three spikes, amplitude 120) 7.0-8.5; a 4x3 calendar grid 300 x 220 at x 1800-2100 drawn as one zigzag 9.0-11.0; a passport 260 x 340 at x 2200-2500 (one loop with an emblem circle) 11.5-13.5; a key (ring r 40, shaft 200, three teeth) at x 2600-2900 14.0-16.0; each holds 0.5 s before the line moves on. Between detours the head runs at ~180 px/s.

Chapter 8: from (25400, 4000) the line runs to the pad (26200, 4400) by 3.0, waits (the rocket is drawn by the line too: it climbs the rocket's silhouette 1.0-3.0), then at 10.0 it leaves as the rocket's trail: a parabola from (26200, 4300) through the apex (27000, 2600) to (27600, 3300) by 15.0.

Chapter 9: the line continues at the nested scale: from the landing point along the village street (y 3320) past each house, to the green (27600, 3420) by 63.0; its width stays 3 screen px (so at zoom 4 it is 0.75 sheet px, the right weight for the small houses).

Chapter 11: the stretch (28800, 3300) → (37420, 4005) is drawn during the pull-back (local 2.0-11.0): at zoom 0.045 the head is a dot crossing the sheet, which is the point.

### 1.4 The line in the glass (chapter 10)
When the village turns to light, the line turns with it (its strokes convert in order like every other stroke). From 8:17 the line is a hairline of light that runs out of the village's lit outline into the phone outline (the bottom edge of the phone is where the line "is"); it is not drawn further. At 9:30 the paper returns with the line back in graphite exactly where it was.

### 1.5 The glimpses (0:18 and 9:30)
At zoom < 0.15 every region shows a **glimpse**: its hero shape (the house, two letters, the machine, the board, the laptop, the phone cutaway, the rocket, the village-as-a-country, the pencil) as the rough pass only (`graphiteSoft` at 35%, 1.5 px wobble). At 0:18 the glimpses are what the audience sees far across the sheet; they are pre-drawn (they exist before the line reaches them, which is honest: a rough sketch comes before the clean one). At 9:30 the glimpses are replaced by the real finished regions. Glimpses fade out between zoom 0.15 and 0.30 as the camera dives.

### 1.6 Level of detail (what renders at which zoom)
| Zoom | Live engine | Pre-rendered | Culling |
|---|---|---|---|
| ≥ 0.6 ("near") | the chapter being drawn: its strokes, pop-ups, characters, screens; the pencil line | finished regions as `public/tex/sheet/<chapterId>.png` (2x, transparent, regenerated by `tools/renderPages.ts` when a chapter changes) | regions whose bounds miss the viewport grown by 20% are not mounted |
| 0.15-0.6 ("mid") | the pencil line; the one pop-up or character in motion | every region as its PNG | same |
| < 0.15 ("far") | the pencil line's head only | one image of the whole sheet, `public/tex/sheet/far.png` (1/8 scale, with the glimpses baked in for 0:18 and the finished regions for 9:30: two files, `far-rough.png` and `far-done.png`) | nothing else mounts |

No region re-runs the pencil canvas while it is static (contract 12.6). Screens on paper (`ScreenOnPaper`) only decode video when their region is near; mid and far show the clip's poster.

### 1.7 Two formats
Every chapter has a wide and a tall camera path over the same sheet. **Tall = wide, with the same centres and zooms, unless section 2 lists a difference.** At the same zoom the tall frame shows a 1080-wide strip (the central column) and more paper above and below; that is the design, not a compromise. Differences are the far views (the tall frame needs zoom 0.027 to show the sheet's full width), chapter 10's device placements (section 3) and the screen-space type positions (section 4).

---

## 2. Camera

One virtual camera: centre (sheet px), zoom (screen px per sheet px). Keyframes are on the 0.5 s grid, module-local; each key names the easing INTO it from the previous key (v1 names: `linear`, `easeOutCubic`, `easeInOutCubic`, `easeInOutSine`, `easeInOutQuint`, `keynote`). Between two keys both centre and zoom interpolate with that one easing (never two moves at once with different curves). A key may say `follow: head` with a lead offset (the camera centres on the line's head plus the lead); the head's position comes from `LINE_ANCHORS`. No handheld shake. **Continuity is enforced:** a chapter's first key (local 0.0) equals the previous chapter's last key; `validateSheet4()` checks it. The lists below are `CAMERA` in `src/sheet4.ts`.

### 2.1 Wide
| Chapter | Keys (t → centre, zoom, easing into) |
|---|---|
| 1 | 0.0 (200, 4000) z 1.6 · 1.0 follow head +(300, 0) z 1.2 easeInOutSine · 7.0 follow head +(300, 0) z 1.0 easeInOutSine · 18.0 (3200, 4000) z 1.0 linear · 22.0 (20000, 4000) z 0.048 easeInOutQuint · 26.0 (20000, 4000) z 0.048 linear · 30.0 (5400, 3950) z 0.9 easeInOutCubic |
| 2 | 0.0 (5400, 3950) z 0.9 · 28.0 same · 31.0 (5400, 3600) z 0.55 easeInOutCubic · 40.0 same · 45.0 (8600, 4000) z 0.9 easeInOutSine |
| 3 | 0.0 (8600, 4000) z 0.9 · 9.0 (9000, 3950) z 0.9 easeInOutSine · 27.5 same · 30.0 (9000, 3600) z 0.75 easeInOutSine · 36.0 same · 40.0 (12600, 2900) z 0.8 easeInOutCubic |
| 4 | 0.0 (12600, 2900) z 0.8 · 7.0 same · 35.0 (12600, 4400) z 0.7 linear (the slow pan down with the cards) · 37.0 (12600, 4700) z 1.1 easeInOutCubic · 47.0 same · 50.0 (5400, 3950) z 0.8 easeInOutQuint (the card flies home) · 51.0 same · 53.0 (10800, 3975) z 0.3 easeInOutCubic · 55.0 (16200, 3900) z 0.8 easeInOutCubic |
| 5 | 0.0 (16200, 3900) z 0.8 · 45.0 same · 47.0 (16200, 4100) z 0.8 easeInOutSine · 61.0 same · 65.0 (19500, 3900) z 0.8 easeInOutSine |
| 6 | 0.0 (19500, 3900) z 0.8 · 5.0 same · 7.0 (19900, 3950) z 0.8 easeInOutSine · 13.0 same · 16.0 (19800, 4100) z 0.8 easeInOutSine · 20.0 same · 23.0 (19800, 4050) z 2.2 easeInOutCubic (the dive into the screen) · 50.0 same · 53.0 (19800, 4100) z 0.8 easeInOutCubic · 55.0 (23400, 3850) z 0.45 easeInOutSine |
| 7 | 0.0 (23400, 3850) z 0.45 · 5.0 same · 7.0 (23400, 3000) z 0.9 easeInOutCubic (top floor) · 16.0 same · 18.0 (23400, 3900) z 0.9 easeInOutCubic (middle floor) · 42.0 same · 44.0 (23400, 5150) z 0.75 easeInOutCubic (the vault and below) · 62.0 same · 64.0 (23400, 3000) z 0.9 easeInOutCubic (back up) · 72.0 same · 74.0 (23400, 3850) z 0.45 easeInOutCubic · 75.0 (26200, 4300) z 0.8 easeInOutSine |
| 8 | 0.0 (26200, 4300) z 0.8 · 10.0 same · 12.5 (26800, 3000) z 0.6 easeInOutSine · 15.0 (27600, 3300) z 0.55 easeInOutSine · 35.0 same · 41.0 (27600, 3250) z 4.0 easeInOutQuint (into the US, to one house) · 50.0 same |
| 9 | 0.0 (27600, 3250) z 4.0 · 6.0 (27600, 3380) z 2.0 easeInOutSine · 8.0 same · 10.0 (27900, 3350) z 1.6 easeInOutSine (Sam's flat in frame) · 13.0 same · then the nine visits: at 13.0, 17.0, 21.0, 25.0, 29.0, 33.0, 37.0, 41.0 a 1.0 s `keynote` move to the house (z 5.0), hold 3.0 s; 45.0-47.0 the 2.0 s move to Sam (z 5.0), hold to 50.0 · 55.0 (28000, 3250) z 0.9 easeInOutQuint (the rise: Europe) · 63.0 same · 65.0 (27600, 3400) z 4.0 easeInOutCubic (the green) · 71.0 same · 75.0 (27600, 3380) z 2.0 easeInOutSine |
| 10 | 0.0 (27600, 3380) z 2.0 · 80.0 same (parked; the void is screen space) |
| 11 | 0.0 (27600, 3380) z 2.0 · 11.0 (20000, 4000) z 0.045 easeInOutQuint · 12.0 same · 15.0 (37800, 4000) z 1.0 easeInOutCubic · 20.0 same · 21.0 (38300, 3900) z 1.0 easeInOutSine · 30.0 same |

Visit centres (chapter 9, z 5.0): Leo (27310, 3250) · Dad (27600, 3230) · Dad kitchen (27640, 3230) · Maya (27460, 3460) · Jonas (27760, 3460) · Maya again (27460, 3460) · Dad (27560, 3230) · Biscuit (27610, 3610) · Sam (28380, 3160).

### 2.2 Tall (differences only)
- Chapter 1: 22.0 and 26.0 z **0.027** (the full width); 30.0 z 0.9 (same).
- Chapter 2: 31.0-40.0 z **0.5** centred (5400, 3500) (the tree needs height, which tall has: this is slightly closer than wide).
- Chapter 4: no change (the machine is tall; the tall frame sees more of it: at z 0.8 the view is 1350 x 2400 sheet px).
- Chapter 5: no change (the board's 1600 width crops to 1350; the cards and chart are in the column).
- Chapter 6: 23.0-50.0 inside the screen z **1.9** (the screen is landscape 900 x 560; z 1.9 shows 568 x 1010: the screen's full height with a dark band above and below, which is where the supers go).
- Chapter 7: per-floor keys at z **0.75** (the floors are wide; tall keeps 1440 sheet px across, enough for the cutaway plus its tabs).
- Chapter 8: 15.0-35.0 z **0.55** centred (27600, 3300) (same); 41.0 z 4.0 (same).
- Chapter 9: the rise at 55.0 z **0.7** centred (28100, 3200) (Europe and the village both in frame vertically).
- Chapter 11: 11.0-12.0 z **0.027**; 21.0-30.0 (38300, 3950) z 1.0 (the pencil sits lower in the tall frame).

### 2.3 Speed limits
Pans above 2500 sheet px/s at zoom ≥ 0.8 streak; the only such move is 4/53.0-55.0 and it is done as a zoom-out-zoom-in arc so the eye reads it as a leap, not a smear. Dives (zoom change > 4x) take ≥ 3.0 s with `easeInOutQuint` or `easeInOutCubic`; pull-backs to the far view take 4.0 s (0:18) and 11.0 s (9:30).

---

## 3. Ink and voice colours

| Voice | Ink | Hex (paper) | Rough pass | In the void (chapter 10) |
|---|---|---|---|---|
| FOUNDER | graphite | `COLORS.graphite` #2A2A2D | #5A5A60 at 35% | hairline white (v1 §3) |
| MAKER | accent | `COLORS.accent` #2F5BEA | none (accent strokes have no rough pass, v1) | core #9FB4FF, glow #2F5BEA 45% (v1) |
| MAYA | sepia | **#7A4A2A** (`INK4.sepia` in beats4.ts) | #A8795A at 35% | core #F2CFA8, glow #7A4A2A 45% |

Rules (they resolve every overlap):
1. **The travelling line takes the ink of the voice speaking.** The new length drawn while FOUNDER speaks is graphite, while MAKER speaks accent, while MAYA speaks sepia; with no voice, graphite. The change is a 40 px gradient at the head, never a jump. Seen whole at 9:30, the line shows the story's voices as colour segments. (The four chapter-1 sketches, the house outline, the rocket trail: all drawn by the line, so they take whatever ink the line has then.)
2. **Drawings stay graphite.** Everything the line is not (the machine, the board, the cutaway, the houses, labels) is graphite with the v1 rough pass, whoever speaks.
3. **Supers take the ink of the voice speaking when the super starts**; none → graphite. Supers inside a screen or in the void are glass type (DM Sans, `COLORS.glassWhite`) and take no voice ink. The one sepia super of the film is "Every family has someone who holds it together." (chapter 2).
4. **The accent keeps its v1 jobs** regardless of voice: ticks, one circle per drawing around the thing it is about, arrows, margin notes and sticky-note lettering, stamps (chapter 4; the script's "red" stamp is the accent, as the v1 "?" was), the red string (chapter 5; the script's "red" string is the accent), "Rejected" circles, the US wash (18%), the circled 21, the "2". When MAKER speaks and a circle is drawn, both are accent and there is no muddle: they agree.
5. **Sepia is Maya's and only Maya's:** her figure (always, even silent), her words (the lower-third labels in chapter 2, her supers), and the line while she speaks. Never ticks, never circles, never another character. Her family members are graphite figures with one accent detail each (section 4).
6. The accent budget stays ~12% of any region's stroke length (v1 §2.5); the string and the stamps count.

Pre-multiply every ink over the paper (`src/paper/README.md`); never `mix-blend-mode`.

---

## 4. Characters (the design sheet)

Continuous-line figures: ONE path per pose, 2.2 sheet px (adults), no filled faces (the face is 3-5 strokes: the brow line, the nose, the mouth, a hint of an eye; no pupils), no hands beyond a mitten loop, feet as a single hook. Graphite with the v1 rough pass under the first draw only; afterwards clean. One accent detail each (a separate short stroke, drawn last). Maya is sepia.

| Character | Height standing / seated | Silhouette | Accent detail | Where |
|---|---|---|---|---|
| **Maya** (sepia) | 420 / 300 | hair in a loose knot, a cardigan, sleeves pushed up | a hair clip: a 14 px tick at the left temple | ch 2, 4 (far), 8, 9, 10 |
| **Dad** | 410 / 290 | a slight stoop, a shirt with a collar, slippers | reading glasses: two circles r 14 joined | ch 2 (tree), 7 (tiny), 9 |
| **Leo** (about 10) | 260 | a cap, a big backpack | the cap's brim (one 50 px stroke) | ch 2 (tree), 9 |
| **Mia** (about 7) | 230 | a ponytail, a dress, one sock up and one down | a hair bobble: circle r 8 | ch 2 (tree), 9 |
| **Jonas** (Maya's partner) | 440 / 310 | tall, a beard in three strokes, rolled sleeves | a watch strap: a 10 x 18 rect on the left wrist | ch 2 (tree), 9 |
| **Sam** | 420 / 300 | a scarf, a shoulder bag, a phone in hand | the scarf: one 60 px stroke | ch 2 (plane label only), 9, 10 (the far phone is his) |
| **Biscuit** (the dog) | 140 long, 110 tall | a scruffy terrier: body in one loop, ears up, a tail stroke | the collar: a 50 x 8 arc | ch 2 (tree), 7 (tiny), 9 |

**Pose list** (each pose is a full path with the same number of segments so swaps can redraw segment by segment; the figure's scale is given where it is not 1.0):

| Chapter | Character | Pose id | Window (local) | Notes |
|---|---|---|---|---|
| 2 | Maya | `sit-A` | 4.0-6.5 draws, holds to 22.0 | seated at the table, hands on a paper |
| 2 | Maya | `sit-B` | 22.0-28.0 | leaning back as the papers storm; her line wobbles (boil 0.6 → 3 px) |
| 2 | Maya | `sit-A` | 28.0 (freeze) to 45.0 | the storm freezes; she holds |
| 2 | Dad, Leo, Mia, Jonas, Biscuit | `tree` | 28.5-34.0 | tiny (scale 0.3) in the tree nodes, bust only |
| 4 | Maya | `look-up` | 50.0-50.5 | in the house at zoom 0.8: she lifts her head toward the arriving card |
| 7 | the six | `silhouette` | 23.0-28.0 | 90 px, drawn one per second under the Binder as they are named |
| 8 | Maya | `window` (scale 0.25) | 44.0-45.5 | bust in the window of the small house |
| 9 | Maya | `doorway` (scale 0.25) | +1.5 of each visit, 0.5 s draw | standing in each house's doorway, one hand on the frame |
| 9 | each house's person | `at-home` (scale 0.25) | +1.0 of its visit | Leo and Mia at the fridge; Dad in bed (watch) and in the kitchen (pills); Jonas at a table; Biscuit in the kennel; Sam on a balcony with the key |
| 10 | Maya (light) | `tap` | 60.0-61.0 draws in light, holds to 68.0 | beside the phone, one hand raised to tap |

**Pose swaps (flipbook, 2-4 poses):** never a crossfade. The old pose erases from its end back to the shared anchor (the hip point) over 6 frames while the new pose draws from the anchor over 9 frames: 0.5 s per swap, `stroke` cue (a short one). Between swaps a figure "boils": every 8 frames its wobble re-seeds at 0.5 px amplitude (3 re-draws per second, like a flipbook held still). Only characters boil; paper and drawings never do (v1 rule). Speaking: no mouth animation; Maya's speech is her ink on the line, not her lips.

---

## 5. Chapter beat sheets

Local seconds, 0.5 s grid (VO ends are estimates at 2.3 words/s + 0.4 s per sentence break, as in v1; the voice engineer's real times replace them in `beats4.ts`). Component names are the script's build plan. Footage ids are `public/footage/manifest.json` ids or "capture: `<id>`" (S0-B's `docs/v4/CAPTURES.md` is the list of record; the ids here are the requests). Cues name v1 `SfxName`s and the new ones (`fold`, `scissors`, `crumple`, `stamp`, `string`, `odometer`, `train`, `plane`, `rocket`, `marble_run`, plus `pin` and `padlock`, which the director adds; `src/audio/cues.ts` gets them additively from the integrator). Supers: text / ink / window. "Written by the line" = the line's head leaves its path, writes the words in Caveat 500 (graphite 72 sheet px, or the voice ink) at 11 chars/s, and the handwriting resolves to DM Sans 500 (56 sheet px) over 1.0 s in place (the handwriting fades as the type weighs in); the line then returns to its path. Screen-space supers are DM Sans 500, 64 px wide / 52 px tall, graphite 90%, centred at 0.5 W, 0.80 H (0.76 H tall).

### 5.1 `line` 0:00-0:30 (local 0-30)
Components: EndlessSheet, PencilLine, (NumberRoll: none). Camera 2.1.
| Local | Event |
|---|---|
| 0.0-0.5 | black. 0.5: the paper is there under the lamp (the v1 lamp, full; no warm-up), a pencil tip touches it at (200, 4000): `pencil_down` |
| 1.0 | the line starts; `stroke` continuous to 30.0 (pressure 1.0, dips to 0.7 during the handwriting) |
| 1.5-4.5 | SUPER written by the line: **"Every app starts as a line."** graphite; resolves to DM Sans 4.5-5.5; holds; fades 7.0-7.5. Position: above the line, baseline y 3880, from x 290 |
| 7.0 | VO FOUNDER F1 (ends ~16.5) |
| 7.0-16.5 | the four detours (1.3): heart rate 7.0-8.5 (hold to 9.0), calendar 9.0-11.0 (hold to 11.5), passport 11.5-13.5 (hold to 14.0), key 14.0-16.0 (hold to 16.5) |
| 18.0-22.0 | the pull-back to the whole sheet (`easeInOutQuint`); the glimpses fade in 19.0-21.0 |
| 20.0-26.0 | SUPER screen-space **"Provisum 2. How it was made, and why."** graphite; in 20.0-20.5, out 25.5-26.0 |
| 22.0-26.0 | hold on the far view; the head keeps moving (it reads as still) |
| 26.0-30.0 | the dive to the house; 27.0 the corner (the line turns down at (4700, 4000)); 27.0-30.0 the house outline begins: ground (4700→4860, 4450), left wall up to (4860, 3850), roof to the apex (5400, 3450) and down to (5940, 3850), right wall to (5940, 4450) |
Music: silence 0-6 (pencil only), felt piano at 6.0 (the v1 motif, D-flat major), the chord at 18.0 as the camera lifts, thins 22-26, a lift at 26.0 for the dive.

### 5.2 `mayasHouse` 0:30-1:15 (local 0-45)
Components: PopUp (house, cutouts, tree nodes, plane), LineCharacter (Maya; the family as tree busts), PencilLine.
| Local | Event |
|---|---|
| 0.0-1.5 | PopUp: the outline lifts into a dollhouse: back wall and two side walls fold up (rotateY ±90 → ±80°), the roof folds, the front wall lies open on the paper as the yard; `fold` 0.0 |
| 1.5-3.5 | the table (600 x 40 at y 4250) and five cutouts pop up, 0.4 s each: a letter 120 x 80, a school form 100 x 130, a passport 90 x 120, an insurance card 120 x 76, the box **"Sam's papers"** 160 x 110 (Patrick Hand 26); `fold` each |
| 4.0-6.5 | Maya draws in (sepia, `sit-A`); 4.0 VO MAYA Y1 (ends ~11.0) |
| 11.5 | VO MAYA Y2 (ends ~23.9; Y1 ends ~11.5 at Maya's slower 2.0 words/s) |
| 11.0-20.0 | papers lift and fly: the insurance card 11.0 (lower-third label **"Dad's insurance"** 11.5-13.5), the passports 13.5 (**"The kids' passports"** 14.0-16.0), the car registration out of the box 16.5 (**"Sam's car registration"** 17.0-19.0), the letter and the form 18.0-20.0 unlabelled. Labels: DM Sans 500 40 screen px, sepia, left-aligned at 0.08 W, baseline 0.84 H (tall: 0.80 H), fade 0.3 s. `slide` (paper in air: a soft flutter) each |
| 22.0-28.0 | the storm: six papers orbit around (5400, 3900), radius 260 → 200, 0.25 → 0.75 rev/s, overlapping; Maya `sit-B`, her boil rises to 3 px |
| 22.0-25.0 | SUPER written by the line **"Every family has someone who holds it together."** SEPIA (Maya is still speaking at 22.0); DM Sans by 26.0; out 28.0-28.5; sheet-space above the house, baseline y 3300, centred x 5400 |
| 28.0 | the storm freezes on one frame; the camera pulls back (to 31.0) |
| 28.5-34.0 | the papers fly to tree nodes (keynote, 0.5 s stagger) and the tree draws: circles r 70 with Patrick Hand 30 labels: **Dad** (5400, 2650); **Maya** (5160, 3000), **Jonas** (5640, 3000); **Leo** (4980, 3350), **Mia** (5280, 3350), **Biscuit** (5700, 3350; a kennel glyph instead of a circle); connecting lines; the busts draw inside the circles (`tree`) |
| 34.0-37.0 | SUPER written by the line **"And every family is bigger than its tree."** graphite, baseline y 2350; out 40.0-40.5 |
| 34.0-36.5 | a dotted branch (1.6 px, dash 6/8) from Maya's node to (6400, 2900); 36.0 a paper plane 80 px folds at its end (`plane`), label **"Sam, Lisbon"** Patrick Hand 30 |
| 36.0 | VO FOUNDER F2 (ends ~43.4) |
| 40.0-45.0 | the line leaves from (6100, 4450), climbs to y 4000 by x 7000, runs to (7800, 4000); the camera follows into chapter 3 |
Music: piano continues, warm; a lift under the storm (22-28) that stops dead at 28.0 (the freeze is a musical rest of one beat); strings enter softly under the tree (29.0).

### 5.3 `theNo` 1:15-1:55 (local 0-40)
Components: PencilLine, PopUp (the crumple, the engine, the scissors, the calendar), NumberRoll.
| Local | Event |
|---|---|
| 0.0-3.0 | two letters draw (460 x 600 sheets at (8640, 4000) -3° and (9360, 4000) +2°; a header line, six scribbled text lines each; 1.5 s each) |
| 0.0 | VO FOUNDER F3 (ends ~6.9) |
| 2.0-4.0 | **"Rejected"** Patrick Hand 48 graphite writes on each letter (2.0, 3.0); accent circles r 150 draw around each word 3.5-4.5 (`stroke` pen) |
| 5.0-6.0 | NumberRoll **"4.3(a)"** accent 64 sheet px at (9000, 4500), `odometer`; 6.0-7.0 **"Design - Spam"** Patrick Hand 36 graphite beside it (claims: S0-B) |
| 10.0-12.0 | both letters crumple into one ball r 180 at (9000, 4000) (`crumple` 10.0-12.0; 2.5D: the sheets fold on 6 creases each, then collapse) |
| 13.0-18.0 | the ball unfolds (`fold` 13.0) into the engine cutaway: block 900 x 520 r 40 rough at (9000, 4000); four gears r 90 at (8700, 3920), (8900, 4120), (9100, 3920), (9300, 4120) with labels **storage, sync, reminders, export** (Patrick Hand 30) 14.0-18.0; gears turn 6°/s from 18.0 |
| 13.0-16.0 | SUPER written by the line **"Keep the engine. Find a new reason."** graphite, baseline y 3500, centred 9000; out 20.0-20.5 |
| 15.0 | VO FOUNDER F4 (ends ~21.1) |
| 20.0-23.0 | paper scissors (PopUp 300 px) enter from the top and cut down x 9000 from y 3600 to 4400: snips (`scissors`) at 20.5, 21.5, 22.5 |
| 23.0-27.0 | the engine (right half) slides right 300 px (keynote 1.0 s), label **"keep"** Caveat 56 accent at 24.0; the left panel (three scribbled lines: the old name, idea, purpose; scribbles, never legible) slides left 400 px and fades 25.0-27.0 with a 0 → 12 px blur |
| 28.0-30.0 | a calendar page drops in from above (`paper_drop` 28.5): 520 x 600 at (9000, 3200), a 7 x 5 grid; 30.0 the **21** is circled (accent r 40) |
| 30.5-31.5 | NumberRoll **"21 September 2026"** accent 56 under the calendar at y 3650, `odometer` |
| 31.0 | VO FOUNDER F5 (ends ~34.5) |
| 36.0-40.0 | the engine, as a 540 x 310 paper block (scale 0.6), rides 40 px above the line's head from (9450, 4000) to (10800, 4000); `slide` 36.0-40.0; the camera pans to the machine |
Music: the relative minor (B-flat minor) under the letters, sparse; a dry rest for the crumple (foley alone 10-12); the engine unfolds on a warm chord at 13.0; the calendar lands on a single low note at 28.5.

### 5.4 `filterMachine` 1:55-2:50 (local 0-55)
Components: FilterMachine, PopUp, PencilLine, NumberRoll (none). Cards: 24, 160 x 100, titles as scribbles (never legible), one released every 1.0 s from 7.0 to 29.5 (the last at 29.5), falling at 500 px/s with a 0.2 s bounce at each gate; of 24, 7 stop at gate 1, 6 at gate 2, 5 at gate 3, 3 at gate 4, 2 at gate 5, one passes (the last). A stopped card gets an accent stamp (60 x 60 rounded square with a cross, `stamp`) and slides down a chute to the pile at (12100, 4600). `marble_run` runs continuously 7.0-35.0 at low level; the sound department thins the stamps to one per second.
| Local | Event |
|---|---|
| 0.0-4.0 | PopUp: hopper 0.0, body 1.0, the five gates 2.0, the tray 3.0 (`fold` each) |
| 0.0 | VO MAKER M1 (ends ~6.5); the line is accent while it draws the machine's outline (rule 3.1) |
| 7.0 | VO MAKER M2 (ends ~19.0); the cards begin |
| 7.5, 9.5, 12.5, 14.5, 17.0 | gate labels write (Patrick Hand 32 graphite on the plaques, 1.5 s each), on the VO's five sentences: **Useful for years, not for a week** / **Not something the iPhone already does** / **Private: no account, no tracking** / **Buildable in six to eight weeks** / **Free to start, paid to unlock** |
| 7.0-35.0 | the camera pans down with the cards (2.1) |
| 35.0 | the one card lands in the tray (`paper_drop`); 35.5-38.5 it unfolds (`fold`) into a 520 x 340 sheet at (12600, 4800); 36.5-39.5 Caveat 500 graphite 44, two lines: **"A binder for the one who holds the family's papers."** |
| 35.5 | VO FOUNDER F6 (ends ~43.3) |
| 47.0 | the card folds into a plane (`plane`) and flies to Maya's house (keynote 3.0 s) as the camera pulls back and follows it (47.0-50.0) |
| 50.0-50.5 | Maya `look-up` in the house |
| 51.0-55.0 | the leap to the board (2.1); the line, meanwhile, has left the machine's tray at (13100, 4000) at 44.0 and reaches (15000, 4000) at 55.0 |
Music: a rhythmic ostinato (the v1 "lift" figure in D-flat, 60 BPM with an eighth-note feel) starts at 7.0 and tightens as the cards fall; it stops at 35.0 on the one card landing (a bare piano note), then the felt piano returns under F6.

### 5.5 `researchBoard` 2:50-3:55 (local 0-65)
Components: StringBoard, ScreenOnPaper (4 cards), PopUp (the boxes, the truck), PencilLine.
| Local | Event |
|---|---|
| 0.0-2.5 | the board's frame draws (1600 x 1200 rough); the cork is a tone (hatch texture at 12%, pre-rendered), not strokes |
| 0.0 | VO MAKER M3 (ends ~1.7) |
| 2.5-4.0 | six pins (`pin` each) |
| 4.0 | VO MAKER M4 (ends ~20.9) |
| 4.0, 8.0, 12.0, 16.0 | a card pins (slides in `paper_drop`, `pin` at +0.3): source label Patrick Hand 28 at +0.5 (**The store / The suggestions / The reviews / The rules**), the screen inside the drawn frame (380 x 240) fades in at +1.0. Footage: card 1 capture `store-search` (DRAWN per contract 13.5: a list of result rows with the exact names from the owner's screenshot, unless a clean recording comes); card 2 capture `terminal-suggestions` (drawn as a list in DM Sans 24 on a dark panel; the strings need claims rows); card 3 capture `reviews-blurred` (DRAWN: the exact words, names as grey bars); card 4 capture `official-forms` (a state form, a Medicare page, an FTC page as scrolling crops, 1.0 s each, agency names never heroed) |
| 5.0, 9.0, 13.0, 17.0 | SUPERS written by the line, ACCENT (MAKER speaks), under each card (baseline card y + 200), 1.5 s write, hold 2.0, out 0.5: **"Does it already exist?"** / **"What do people really type?"** / **"What do the others get wrong?"** / **"Who publishes the real rules?"** |
| 30.0-33.0 | the red string (accent 2.0 px) runs from the four pins to the centre with a sag that pulls straight 32.0-33.0 (`string` 30.0-33.0) |
| 33.0-38.0 | the 2x2 draws where the strings cross: axes 33.0-34.5; labels Patrick Hand 26 **"Organises the family"** (X, below) and **"Handles the hard stuff"** (Y, rotated -90°) 34.5-36.0; seven blank pins along the edges (3 along the bottom, 4 up the left; `pin` each) 36.0-38.0; 38.0-39.5 accent circle r 70 around the empty top-right at (16300, 3790) |
| 38.0-41.0 | SUPER written by the line **"The gap: all of it, for everyone, privately."** graphite, baseline y 4650 under the board; out 44.0-44.5 |
| 45.0-55.0 | the cards peel off (`fold` x 4, 45.0-47.0) and six boxes fold up in the row at y 4300 (`fold` + Patrick Hand 28 label each): **Documents** 46.0, **Dates** 47.5, **Bills** 49.0, **People** 50.5, **Emergency card** 52.0, **Packets** 53.5 |
| 48.0-51.0 | SUPER written by the line **"Six building blocks. Everything else hangs off them."** ACCENT (M5 starts at 48.0), baseline y 4650; out 55.0-55.5 |
| 48.0 | VO MAKER M5 (ends ~55.4) |
| 58.0-60.5 | the boxes jump onto the hand truck at (17100, 3900) (`paper_drop` every 0.5 s) |
| 61.0-65.0 | the truck rolls along the line to (18600, 4000) (`slide`, wheels squeak twice); the camera follows |
Music: strings under the board; the string pulling tight (32-33) is doubled by a rising glissando; the boxes land on a plucked figure; the truck rolls on the ostinato.

### 5.6 `nameAndLook` 3:55-4:50 (local 0-55)
Components: PencilLine, PopUp (the logotype lift, the laptop), ScreenOnPaper (the laptop), NumberRoll (none). Inside the screen: the imagined design file (contract 13.4): a dark canvas (#0B0B0C) with real app screens laid out, no tool chrome, no cursor, no logo.
| Local | Event |
|---|---|
| 0.0-4.5 | the names sheet: seven scribbled names each crossed out with one stroke (0.5 s each, 0.0-3.5), then the last line **"On Behalf"** Patrick Hand 36 (legible, not crossed) 3.5-4.5 |
| 0.0 | VO FOUNDER F7 (ends ~6.9) |
| 5.0-7.5 | **PROVISUM** writes itself (Caveat 700 graphite 140 sheet px, centred (20000, 3900), 2.5 s); 7.5-8.5 **Latin. "Provided for."** Caveat 500 44 under it |
| 7.0 | VO FOUNDER F8 (ends ~13.5) |
| 9.0-11.0 | the letters lift 20 px (PopUp shadow grows), gain weight (3 → 9 px) and settle as the logotype: DM Sans 700 128 px crossfades in place 10.0-11.0 (the v1 title face: the logotype is DM Sans 700) |
| 13.0-16.0 | the laptop draws (base 1080 x 90, lid 1000 x 640 at a 12° tilt, rough; generic, no logo); 16.0-18.0 the design file fades in on the screen: 24 real app screens at 4% scale in a 6 x 4 grid, "a city at night" (capture: `screens-grid`, 24 distinct screens, dark appearance, both the sample binder and the story's family) |
| 17.0 | VO MAKER M6 (ends ~22.6) |
| 20.0-23.0 | the dive into the screen (2.1); from 23.0 the screen is the frame; supers inside are glass type: DM Sans 500 44 px glassWhite 92%, lower-left at 0.06 W, 0.86 H |
| 23.0-28.0 | the colour tokens, light and dark: two columns of six swatches (the real token hexes from `Provisum/DesignSystem/VYColor.swift`; claims: S0-B) draw as rounded rects with hairline labels; SUPER **"One accent. Nothing shouts."** 23.5-27.5 |
| 28.0-33.0 | the nine wallpapers slide past as 220 x 470 phone-shaped swatches, light appearance, right to left at 400 px/s (28.0-30.5), then fan out like paint swatches (keynote 30.5-32.0); SUPER **"Every person gets their own colour."** 29.0-33.0. Drawn from the wallpaper stops (claims: CLAIMS-additions) or capture `wallpapers-sweep` |
| 33.0-38.0 | a form screen (the v1 `form-to-chat` left frame re-rendered as white hairlines on the dark canvas) 33.0-35.0; an accent pencil stroke crosses it out 35.0-35.5 (`stroke`, pressure 1.3); the real `onboarding-question` clip (hot 2.4-4.4) slides in from the right 36.0-37.0 (keynote); SUPER **"Ask one question at a time."** 36.0-39.5 |
| 38.0-43.0 | `emergency-card-full` (hot 1.6-3.6) 38.0-40.0; at 40.0 it snaps (`snap`) to capture `emergency-largest-text` (the emergency view at the largest accessibility size), holds to 43.0; SUPER **"Readable on the worst night of your life."** 40.5-43.5 |
| 43.0-48.0 | version history, imagined: 30 hairline wireframes of the home screen (240 x 520, each a different state) flick at 10/s 43.0-46.0 and settle (`snap` 46.0) on the real `binder-home-dark` poster; SUPER **"Dozens of versions. One home screen."** 44.0-48.0 (claim "dozens": S0-B) |
| 44.0 | VO MAKER M7 (ends ~53.1) |
| 50.0-53.0 | the pull back out of the laptop; 53.0-55.0 the laptop folds flat (`fold` 53.0: the lid closes rotateX 78 → 0° in 1.0 s; the drawing flattens to its outline 54.0-55.0); the line continues from (20350, 4000) to (21800, 4000) |
Music: the felt piano alone for the names; a held chord for PROVISUM (5.0) that resolves as the logotype settles (11.0); inside the screen the pulse from v1's wall section, soft, with a tick per swatch.

### 5.7 `engineRoom` 4:50-6:05 (local 0-75)
Components: Cutaway, ScreenOnPaper (the laptop, twice; a phone), PopUp (tabs, the Binder, the safe), NumberRoll (the tests), PencilLine, LineCharacter (silhouettes).
| Local | Event |
|---|---|
| 0.0-3.0 | the line draws the big phone outline (900 x 2700 r 120, rough); 3.0-6.0 it is sliced open: the front face peels back (PopUp, hinge on the left edge, rotateY 0 → -85°, `fold` 3.5); floor lines at y 3350 and 4450 draw 4.5-5.5; floor labels Patrick Hand 30 in the left margin (x 22900): **Code** (y 2600), **The data** (y 3450), **The vault** (y 4550) 5.0-6.0 |
| 0.0 | VO MAKER M8 (ends ~5.2) |
| 6.0-8.0 | top floor: a laptop 560 x 380 at (23400, 3050) draws; 8.0 capture `xcode-navigator` fades in (the owner records; menu bar and logo outside the crop; account names and team blurred) |
| 9.5-18.5 | each navigator group pops out as a paper tab (PopUp 180 x 44, Patrick Hand 26) and pins to the cutaway's right margin at x 23950, y 2750 + 70 n (`fold` + `pin`): 9.5, 11.0, 12.5, 14.0, 15.5, 17.0, 18.5. Names as the script lists them (Binder, Documents, Deadlines, Packets, EmergencyCard, Family, Visits); the recording decides the real spelling (claims: CLAIMS-additions) |
| 10.0-13.0 | SUPER written by the line **"Every feature has its own room."** graphite, at (23400, 2650) above the laptop; out 18.0-18.5 |
| 16.0-18.0 | the camera moves to the middle floor |
| 18.0 | VO MAKER M9 (ends ~28.4) |
| 18.0 | the paper **Binder** (PopUp 260 x 200, label Patrick Hand 30) pops at (23400, 3650) (`fold`); 19.0-22.0 accent strings (`string`) to the six boxes (150 x 100, drawn again as in chapter 5): **Documents** (23060, 3480), **Dates** (23400, 3480), **Bills** (23740, 3480), **People** (23060, 3830), **Emergency card** (23400, 3830), **Packets** (23740, 3830) |
| 22.0-25.0 | SUPER written by the line **"One person. Everything that belongs to them."** ACCENT, at (23400, 4120); out 28.0-28.5 |
| 23.0-28.0 | six silhouettes (90 px) draw in a row at y 4000, one per second on the VO's nouns (estimates): Dad 23.0, Mia 24.0, Maya 25.0, Jonas 26.0, Sam 27.0, Biscuit 28.0 |
| 28.5 | VO MAKER M10 (ends ~41.5; M9 ends ~28.4) |
| 28.0-30.0 | three tracks fan in from the left at y 4280 / 4330 / 4380 and merge at x 23300 into one track at y 4330 running to x 23800; the carriages (120 x 70) draw: a passport, a bill (an envelope), an appointment (a clock) |
| 30.0-36.0 | the train runs (`train` 30.0-36.0); the carriages merge onto the one track at 32.0, 33.0, 34.0 (`snap` each); 35.0-36.0 a bell at the track's end |
| 36.0-39.0 | SUPER written by the line **"All the dates. One list. The right reminder."** ACCENT, at (23400, 4120); out 42.0-42.5 |
| 36.5-38.5 | accent ticks with **9 · 6 · 3** (Patrick Hand 26) over the passport carriage; 38.5 one tick with **"the day before"** over the bill |
| 42.0-44.0 | the camera moves to the vault and below |
| 44.0 | VO MAKER M11 (ends ~55.2) |
| 44.0-45.5 | the server box (240 x 200 at (22950, 5500)) draws, label **"Veyago server"** Patrick Hand 28; 46.5-48.5 the pencil ERASES it completely (`erase`; 8 crumbs stay) under "There is no Veyago server" |
| 49.0-54.5 | a pipe from the vault floor down to a cloud (300 x 180 at (23500, 5500), **"Your own iCloud"**) 49.0-51.0; two phones 120 x 240 at (23050, 5800) **"Your brother"** and (23750, 5800) **"Sam"** 51.5-53.5; dotted strings cloud → phones 53.5-54.5 (`string`) |
| 50.0-53.0 | SUPER written by the line **"No server. No account. Data Not Collected."** ACCENT, at (23400, 6050); out 56.0-56.5 (claim: the privacy label, S0-B) |
| 56.0 | VO MAKER M12 (ends ~61.2) |
| 56.0-59.0 | a small safe (PopUp 260 x 220 at (23400, 4750)) draws 56.0-57.5; the emergency card (180 x 120 with a "+") slides in 57.5-58.5 (`slide`); the door closes and a padlock snaps 59.0 (`padlock`) |
| 62.0-64.0 | the camera returns to the top floor |
| 64.0 | VO FOUNDER F9 (ends ~70.1) |
| 64.0-69.0 | capture `xcode-tests` in the laptop: a column of green ticks scrolls; NumberRoll accent 64 px at (23400, 3400) counts the passing tests (`odometer` 64.0-69.0; the final number is a claim: S0-B / the owner) |
| 69.0 | "Build succeeded" in the recording; 69.5-72.0 a drawn phone (200 x 430 at (23750, 3050)) boots the Simulator: `onboarding-welcome` (hot 3.5-5.5) or capture `simulator-boot` |
| 72.0-75.0 | the cutaway closes like a book (`fold` 72.0: the face folds back in 1.5 s), flattens to its outline 73.5-75.0; the line leaves from (23850, 4000) to (25400, 4000); the camera pulls out and moves on |
Music: an A-flat pedal (the dominant) under the whole room, with the ostinato in the top floor, a plucked figure for the strings of the data model, the train's rhythm doubled by a woodblock, a hollow rest for the erased server (foley alone 46.5-48.5), a low chord for the padlock, a rising figure under the tests that lands on "Build succeeded" (69.0).

### 5.8 `launch` 6:05-6:55 (local 0-50)
Components: PopUp (pad, rocket, the sticky notes), PencilLine (the trail), NumberRoll, ScreenOnPaper (the window).
| Local | Event |
|---|---|
| 0.0-3.0 | the pad folds (`fold` 0.0); the rocket folds up (`fold` 1.0, 2.0): 160 x 520, three fins, a drawn porthole |
| 0.0 | VO FOUNDER F10 (ends ~4.3) |
| 3.0, 5.0, 7.0 | the status plaque on the rocket's side (220 x 60, DM Sans 500 24, DRAWN per contract 13.5): **Waiting for Review** → **In Review** (`snap`) → **Ready for Distribution** (`snap`) (claims: S0-B) |
| 4.0-5.0 | NumberRoll **"28 September 2026"** accent 56 at (26200, 4650), `odometer` |
| 10.0-15.0 | launch (`rocket` 10.0-14.0): the rocket (and the line, as its trail) climbs to the apex (27000, 2600) and arcs down to (27600, 3300); the world map draws under the arc 10.5-14.5 (one long rough coastline per continent; a sketch-map, no borders except the ones chapter 9 needs); 15.0-17.0 the United States fills with the accent wash at 18% (`stroke` pen) |
| 15.0 | VO FOUNDER F11 (ends ~22.8) |
| 15.0-18.0 | SUPER written by the line **"United States first. On purpose."** graphite, in the map's margin at (28000, 4150); out 21.0-21.5 |
| 22.0 | a sticky note (v1 yellow, 220 px, -4°) slaps onto the US at (27500, 3150) (`sticky_press`); 22.5-25.0 Kalam 700 accent 30: **"Listed as paid. Should be free."** |
| 25.0-28.0 | SUPER written by the line **"Day one: a mistake. Day two: fixed."** graphite, at (28000, 4150); out 31.0-31.5 |
| 26.0 | VO FOUNDER F12 (ends ~32.5) |
| 26.0-26.5 | the pencil crosses the note out (graphite 4 px); 27.0 a second note slaps at (27750, 3400) (`sticky_press`); 27.5-30.0 **"Fixed. Version 1.1. Next day."** |
| 35.0-41.0 | the zoom into the US (2.1); the notes fade 35.0-36.0; the small house (the chapter-2 `house` spec at scale 0.25, ground at y 3300, centred x 27600) is drawn 36.0-39.0 as the zoom reveals it; 40.0 the window lights (`snap`): a 40 x 30 window shows the top bar of a binder named **Dad** with the mist wallpaper (capture `binder-home-dad`, light appearance), glow: accent halo 20% |
| 35.5 | VO FOUNDER F13 (ends ~41.2) |
| 44.0-45.5 | Maya `window` (scale 0.25) draws in the window, sepia |
| 45.0 | VO MAYA Y3 (ends ~47.6) |
| 45.5-50.0 | hold at zoom 4.0 (chapter 9 pulls back from here) |
Music: a count-in of three plucked notes under the three statuses, the lift at 10.0 (brass-like swell in the strings), the US fill on the chord, the sticky notes on a dry rest, then the felt piano for the house.

### 5.9 `village` 6:55-8:10 (local 0-75)
Components: Village, PopUp (houses), LineCharacter, PencilLine, ScreenOnPaper (none). Text sizes in screen px at zoom 5.0 (visits) or 2.0 (the whole village): door names Patrick Hand 32, margin notes Caveat 500 44 accent, the bubbles Patrick Hand 36. House wallpapers (the light "leading" stop, pre-multiplied over the paper at 55%): **Dad** mist #B4DCFE · **Leo** sea glass #9DE5D6 · **Mia** blush #FECAD2 · **Maya** lavender #DBD2FD · **Jonas** sage #B9E2B4 · **Biscuit** apricot #FFD1B5 · **Sam** dusk #FED0C1 (sources: CLAIMS-additions). The door of the big house reads **Dad**: houses are binders, not homes (the house Maya lives in holds her dad's binder; her own binder is the house named Maya).
| Local | Event |
|---|---|
| 0.0-6.0 | the camera pulls back from the house; houses pop up (`fold` each) with door names: **Leo** 1.0, **Mia** 2.5, **Maya** 4.0, **Jonas** 5.5, **Biscuit** (a kennel) 7.0 |
| 0.0-3.0 | SUPER written by the line **"Version 2: a binder for everyone you call family."** graphite, sheet-space above the village (baseline y 2950, DM Sans 56 screen px); out 7.0-7.5 |
| 1.0 | VO FOUNDER F14 (ends ~7.5) |
| 8.0-10.0 | the camera slides right: the sea and Sam's flat; 10.0 **Sam, Lisbon** pops (`fold`); 10.5-13.0 dotted string connects all seven (`string`) |
| 13.0 → 50.0 | nine visits, 4.0 s each (Sam's 5.0): +0.0 flight (keynote 1.0 s; 2.0 s to Sam), +1.0 the front wall opens (`fold`), +1.0-+3.0 the interior draws, +1.0 the resident `at-home`, +1.5 Maya `doorway` (sepia, 0.5 s), +2.5-+3.5 the margin note (accent Caveat): 1 Leo and Mia 13.0 (two passports on a fridge, accent ticks 9/6/3: **"IDs for everyone, reminded early."**) · 2 Dad 17.0 (a Watch on a bedside table, a Wallet pass beside it: **"The emergency card on the wrist and in Wallet."**) · 3 Dad's kitchen 21.0 (a pill bottle, a small bell: **"Medication list, with refill reminders."**) · 4 Maya 25.0 (three phones around one card, a padlock: **"Share the card. Encrypted first."**) · 5 Jonas 29.0 (coins splitting between three figures: **"Who paid what."**) · 6 Maya 33.0 (an envelope, a circled ?: **"Is this letter a scam?"**) · 7 Dad 37.0 (a sound wave over a doctor's desk: **"Record the visit. Keep it on the phone."**) · 8 Biscuit's kennel 41.0 (a vet card in a tiny folder: **"Pets get a binder too."**) · 9 Sam 45.0 (flight to 47.0; a key, a car registration, a lease: **"Look after a friend's papers while they're away."**). The interiors reuse the v1 sketch specs (passport, watch-wallet, pill-bottle, share-card, shared-costs, scam-letter, visit-recording, where-is-it's key) at 0.16 scale: the paper versions of the screens chapter 10 snaps to |
| 29.0 | VO MAYA Y4 over the flights (ends ~34.6) |
| 50.0-55.0 | the rise (`easeInOutQuint`): the sea is the map's Atlantic; Europe is in frame |
| 55.0-57.0 | four countries light up: accent circles on the map's Europe, BE r 12 at (28470, 3085), NL r 14 at (28480, 3060), DE r 28 at (28560, 3080), FR r 34 at (28450, 3130) (`stroke` pen); 57.0-58.5 **"112"** and **"A4"** (Caveat 700 accent, 56 screen px) in the margin at (28850, 3000) and (28850, 3080) |
| 55.0-57.0 | five bubbles rise 60 sheet px from the houses over 2.0 s each (`bubble_pop`): **Hello** 55.0, **Hola** 55.5, **Hallo** 56.0, **Bonjour** 56.5, **Hoi** 57.0 |
| 57.0-59.5 | SUPER written by the line **"Five countries. Five languages."** graphite, at (28000, 3900); out 62.0-62.5 |
| 63.0 | VO MAKER M13 (ends ~69.5) |
| 63.0-65.0 | the dive to the village green; 65.0-67.0 a form (the v1 form frame at 0.25) draws on the green at (27560, 3420); 67.5-68.0 one stroke crosses it out (graphite, 4 screen px); 68.5-71.0 a conversation bubble at (27660, 3420): **"Who are you looking after?"** (Patrick Hand 36 screen px) with two chips **Dad** / **Leo** |
| 71.0-75.0 | the camera settles on the whole village (z 2.0) for the lift |
Music: home key, the felt piano and strings; a soft ostinato under the visits with a plucked note on each front wall; the rise on a swell; a pulse starts under the green (63.0) and builds into chapter 10 (it is the v1 wall pulse).

### 5.10 `paperToGlass` 8:10-9:30 (local 0-80)
The v1 transition, familyOfDevices, title, realThing and pair re-staged in one module. Components: InkToLight, the device rig (phone, watch, pass), the glass type, ScreenOnPaper (none: the screens are the rig's). Phone placement wide: centre (0.50 W, 0.52 H), height 78% of the frame; tall: (0.50, 0.50), 62%. The camera is parked (the void is screen space).
| Local | Event |
|---|---|
| 0.0-5.0 | every line in the village converts to light in stroke order (0.4 s per stroke, spread 0.0-5.0); swell at 0.0 |
| 1.5-6.5 | paper texture, shadows and vignette fade (`easeInOutSine`); 2.5-7.0 paper → black (`easeInOutCubic`); 7.0 only lit lines on black; the pulse locks |
| 7.0-8.0 | the houses lift off as hairlines (each rises 120 screen px, keynote) |
| 8.0-10.0 | they fold inward into one phone outline: each house's strokes re-trace as the phone's strokes (bright heads); 8.0-10.0 lift-off (depth), FOV 0 → 28° over 8.0-11.0, rotation Y 0 → -8° (9.5) → +22° (24.0), X 0 → -5°; edge light: one clockwise lap from the top-left 8.0-16.0, drift to the top-right by 18.0 (`sweep` 8.0-16.0) |
| 10.0, 11.5, 13.0, 14.5, 16.0, 17.5, 19.0, 20.5, 22.0 | nine snaps (`snap` each, 0.3 s, flare 160%), in visit order; each replaces the screen and carries a one-line label (DM Sans 500 36 px glassWhite 92%, 48 px under the phone): 1 `passport-reminder` **IDs for everyone, reminded early.** · 2 `phone-show-on-watch` (hot 1.8-3.8; never the Wallet button frames) **The emergency card on the wrist and in Wallet.** · 3 `med-refill` **Medication list, with refill reminders.** · 4 `family-share-card` (hot 7.8-9.8) **Share the card. Encrypted first.** · 5 `shared-costs` **Who paid what.** · 6 `scam-check` **Is this letter a scam?** · 7 `visit-summary` **Record the visit. Keep it on the phone.** · 8 capture `pet-binder` (Biscuit's binder home, apricot, light) **Pets get a binder too.** · 9 capture `friend-binder` (Sam's binder: a car registration and a lease in the documents list, dusk, light) **Look after a friend's papers while they're away.** |
| 25.0-26.5 | the phone splits into five (keynote): wide at x 0.18, 0.34, 0.50, 0.66, 0.82 W, 42% height, Y ±10° facing the centre; tall: a row of five at 26% height across the width at 0.5 H. Screens: capture `binder-home-dad/leo/mia/maya/sam` (LIGHT appearance so the wallpapers read on black) |
| 25.0-30.0 | SUPER glass **"Every person. Their own binder. Their own colour."** DM Sans 500 44 px, centred under the row, fade 0.5 |
| 25.5 | VO MAKER M14 (ends ~33.3) |
| 34.5-36.0 | the row collapses back to one phone (keynote) |
| 36.0 | the hit: the emergency card flips off the glass (`card_flip`), the phone slides to 0.36 W (tall: stays), the Watch lights at 0.66 W (tall: phone (0.5, 0.38), Watch (0.32, 0.74), pass (0.68, 0.76)); 36.5 the card lands on the Watch (`snap`); 38.0 the Wallet pass slides out (`wallet_slide`, 0.8 s); 39.0-42.0 the light settles (glow 100 → 70%) |
| 37.0-41.0 | SUPER glass **"Apple Watch. Apple Wallet."** |
| 41.5-42.0 | the devices fade out |
| 42.0, 43.5, 45.0, 46.5 | number rolls on black, 1.5 s each: the digit (DM Sans 700 200 px, rolls like an odometer in 0.4 s, `odometer`) and the words (DM Sans 400 48 px at 80%): **6 kinds of people** / **5 countries** / **5 languages** / **0 servers** (claims: S0-B) |
| 48.0 → 60.0 | eight real recordings, 1.5 s each, alternating void (Y -12, +10, -8, +14) and bleed, each with a label as above: 48.0 capture `invite-friend` **Invite a friend to a binder** (demo hooks only, `OB_DEMO_MEMBERS=pending`; never a live flow) · 49.5 capture `family-joined` **See who joined** (`OB_DEMO_MEMBERS=1`) · 51.0 `shared-costs` **Shared costs** · 52.5 `passport-reminder` **A passport reminder** · 54.0 `scam-check` **The scam note** · 55.5 `visit-summary` **A visit summary** · 57.0 `belgium-112` **A Belgian binder calling 112** · 58.5 `onboarding-question` **The first question** |
| 48.0 / 50.0 / 54.0 | VO FOUNDER F15 (ends ~49.3) / VO MAKER M15 (ends ~53.4) / VO MAYA Y5 (ends ~58.7) |
| 60.0-61.0 | the phone to 0.38 W (36% height); Maya draws in light beside it at 0.22 W (`tap`); 61.5 she taps **Invite** (`snap`; the screen is the `invite-friend` frame); 62.0 a hairline paper plane leaves her hand (`plane`) and flies to 0.86 W, where a small phone (18% height) lights at 64.0 with a drawn notification card in glass type: **Maya invited you to "Sam".** (claim: the real invitation wording, CLAIMS-additions). Tall: Maya (0.5, 0.30), the phone (0.5, 0.55), the far phone (0.5, 0.86), the plane flies down |
| 62.0-67.0 | SUPER glass **"Share a binder with anyone you trust."** |
| 68.0 | HARD STOP: picture to pure black and sound to digital silence on the same frame; 68.0-69.0 one full second of nothing; silence holds to 70.0 |
| 70.0-71.5 | **Provisum** letter by letter (8 letters, 0.12 s stagger, 0.6 s fades, `title_in` 70.0; the swell begins at -30 dB) |
| 72.0-73.0 | the accent pencil stroke writes the **2** (v1 §3 type); it completes at 73.0 exactly as the music resolves; one quiet `stroke` under it |
| 75.0-79.5 | SUPER glass subline **"A binder for your whole family. And the friends who are family."** (DM Sans 400 44/38 px at 80%, two lines in tall, fade 1.0) |
| 79.5-80.0 | the light begins to dim (chapter 11 finishes the fade) |
Music: the v1 Act 3-4 cues re-timed: swell at 0.0, strings under the fade, the pulse locks at 7.0, hits on the nine snaps, a peak at 25.0 for the row, the two hits at 36.0 and 38.0, light settles 39-42, a dry pulse under the number rolls, the ostinato under the eight recordings (48-60), warm strings for the plane, the hard stop at 68.0, the swell at 70.0, the resolve at 73.0, felt piano alone 75-80.

### 5.11 `providedFor` 9:30-10:00 (local 0-30)
Components: EndlessSheet, PencilLine, the pencil prop (the v1 desk kit), the end-card type.
| Local | Event |
|---|---|
| 0.0-3.0 | the glow fades back into graphite: the title's light dims 0.0-1.0; the paper returns (black → #F3EEE3 over 0.0-2.0 `easeInOutCubic`, texture and shadows 1.0-3.0); the village is graphite again at (27600, 3380) z 2.0 |
| 0.0-11.0 | the pull-back to the whole sheet (`easeInOutQuint`); every region shows finished (`far-done.png`); the line's last stretch draws (28800, 3300) → (37420, 4005) 2.0-11.0 |
| 3.0-11.0 | SUPER screen-space **"A no. Five filters. One idea. A whole village."** graphite; in 3.0-3.5, out 10.5-11.0 |
| 12.0-15.0 | the dive to the pencil (`easeInOutCubic`): the line's end leads into the tip of a drawn pencil (the v1 graphite pencil prop, 520 px, lying at 12°, its shadow per v1 §2.1) |
| 14.0 | VO FOUNDER F16 (ends ~19.6) |
| 15.0-17.0 | the pencil sets itself down: it rises 20 px (its shadow softens and grows) and lowers, stopping a hair above the paper at 17.0; a faint cloth `stroke` under it; nothing else moves |
| 16.0-20.0 | the closing line **"Provided for."** Caladea italic 400, 48 px wide / 42 tall, graphite 85%, bottom-centre 120 px above the bottom edge, fade 0.6 s (ESTIMATE: under the VO's "provided for"); out 20.0-20.5 |
| 20.0-21.0 | the camera drifts right so the pencil sits lower-left and the clear paper is centred |
| 20.0-24.0 | the end card ON PAPER (v1 §3 type, graphite on the paper): **Provisum 2** 20.0-21.0 · **Free on the App Store** 21.0-22.0 · the Veyago mark 22.0-23.0 · in Caladea italic 400 36/32 px: **Made by Veyago. Private by design.** 23.0-24.0. Nothing moves after 24.0 |
| 24.0 | the final chord has decayed; nothing sounds until the click |
| 28.0 | **the click of the pencil being set down** (`pencil_click`): the last sound of the film; no tail beyond 0.4 s |
| 30.0 | end on the card, no fade |
Music: the v1 end: felt piano alone from 0.0 under the pull-back, the warm final chord at 20.0 that decays by 24.0.

---

## 6. Cut-downs (`src/edits4.ts`)

- **YouTube 16:9, 10:00:** the master (`Master4-wide`); no EDL.
- **9:16 hook, 75 s** (`HOOK_75`): line 0-7 · mayasHouse 4-11 (Maya) · theNo 0-10 (the two rejections) · filterMachine 35-47 (the one card) · village 0-13 (the houses pop) · paperToGlass 0-8 (the lift) · paperToGlass 42-48 (the number rolls) · paperToGlass 68-80 (the silence and the title). Captions carry the VO lines; the supers that are copy (chapter 1's two, the title) have no caption.
- **9:16 cut, 3:00** (`CUT_180`): 21 segments, the story in order, listed in the file with their music notes and captions. Every chapter is represented; the two silences (the freeze at 2/28.0 and the hard stop at 10/68.0) both stay in.
- **Chapter shorts** (`CHAPTER_SHORTS`, 9:16, 30-48 s each): one per chapter, the chapter's own slices, with caption lines; chapters longer than 60 s are cut to their spine (the file says which slices). Each short ends on a beat the chapter itself ends on (a landing, a fold, a hand-off) so it does not feel cut.
- Rules carried from v1: cuts on the 0.5 s grid; the music is re-arranged (never sliced) per segment; captions DM Sans 500 44 px, max 2 lines, baseline 300 px above the bottom edge, paper tone on paper and glass tone on glass; never over a super, the sticky notes, the title or the end card. The hook keeps a 1.0 s silence before the title; the shorts keep 0.5 s minimum.

---

## 7. Music, voice and sound direction

### 7.1 Score (60 BPM, 4/4, bar lines every 4 s; the v1 motif family in D-flat major)
| Chapter | Mood | Key / material | Where foley carries it |
|---|---|---|---|
| 1 | curiosity, then scale | silence to 6.0; the v1 felt-piano motif; a chord at 18.0 for the lift; a lift at 26.0 | 0-6 pencil only (dry, close, slightly too loud: the signature) |
| 2 | warmth, then a storm | D-flat; the piano builds under Maya; a lift 22-28 that stops dead at 28.0; strings under the tree | the paper storm (`slide` flutters) |
| 3 | a setback, held | B-flat minor, sparse; a warm chord as the engine unfolds (13.0); a single low note for the calendar | the crumple (10-12) and the scissors (20.5-22.5) are foley alone |
| 4 | a machine thinking | the v1 "lift" ostinato in D-flat, eighth-note feel, tightening | the marble run and the stamps are the rhythm section |
| 5 | investigation | strings; a glissando as the string pulls tight (32-33); plucks for the boxes | pins, string, the truck's wheels |
| 6 | a name, then calm | a held chord for PROVISUM (5.0) resolving at 11.0; inside the screen the v1 wall pulse, soft | the laptop's fold |
| 7 | the room where it is built | an A-flat pedal (the dominant); woodblock with the train; a rest for the erased server; a low chord for the padlock; a rising figure to "Build succeeded" | the eraser, the train, the padlock |
| 8 | lift-off, a stumble, home | three plucked notes for the statuses; the swell at 10.0; a dry rest for the sticky notes; felt piano for the house | the rocket, the sticky notes |
| 9 | home | D-flat, felt piano and strings; a plucked note per front wall; the swell for the rise; the pulse from 63.0 | the folds, the bubbles |
| 10 | the v1 glass arc | the v1 cues re-timed (5.10); hard stop at 68.0; swell at 70.0; resolve at 73.0 | glass ticks only; the one pencil stroke of the "2" |
| 11 | arrival | felt piano alone; the final chord at 20.0, decayed by 24.0 | the pencil set down (15-17), the click at 28.0: the last sample |

### 7.2 Protecting the two silences
- **2/28.0 (the freeze):** every moving thing stops on one frame and the music rests for one beat (28.0-29.0); foley stops too. The camera starts its pull-back at 28.0: the only motion is the camera.
- **10/68.0 (the hard stop):** as v1 §7.2: music, foley, room tone and VO cut sample-accurately on the same frame; 68.0-69.0 is digital silence; 69.0-70.0 stays silent; the swell enters at 70.0 at -30 dB. Picture is pure black 68.0-70.0.
- The section before the stop (10/60-68) sits at the film's loudest; the title swell enters 12 dB under it.

### 7.3 The three voices
- **FOUNDER** (the owner): close, dry, centred; read slower than feels natural; first person. 16 lines, 215 words (`voWords('FOUNDER')`; the script's table says ~290: it overcounts).
- **MAKER**: brighter EQ, a touch of room, a faster register; synthetic (Kokoro) unless the owner records a second take. 15 lines, 260 words (the script says ~330).
- **MAYA**: warm, softer, a short kitchen reverb (0.4 s, 15%); synthetic or a friend. 5 lines, 65 words (the script says ~110). Her lines are never rushed: 2.0 words/s.
- Pronunciation of "Provisum": as decided in `docs/DECISIONS.md` (client decision 2026-10-16); the v4 lines F8, F16 and M13 use it.
- Voice-derived timings (the six silhouettes, the five gate labels, the closing line) are marked `estimate` in `beats4.ts` and move to the nearest 0.5 s grid point after the real word times arrive.
- A no-VO mix is delivered for every version; nothing is re-timed in it.

### 7.4 New foley families (the sound department builds these)
`fold` (paper lifting into 2.5D: a soft card snap), `scissors` (three snips), `crumple`, `stamp` (a rubber stamp on card), `string` (thread pulled taut), `odometer` (digit wheels), `train` (a tin train on card), `plane` (a paper plane: one swish), `rocket` (paper and air, not fire), `marble_run` (cards tumbling, continuous), `pin` (a push pin into cork), `padlock` (a small click). Plus the v1 set.

---

## 8. Decisions and questions for the owner

Resolved by the director (binding unless the owner objects):
1. **Houses are binders, not homes.** The big house's door reads "Dad"; Maya's own binder is the house named "Maya". Seven binders, six kinds of people (two children), which matches M9 and the number roll.
2. **The village is inside the map.** Chapter 9 is drawn at 0.25 scale in the United States of chapter 8's map; Sam's flat is at Lisbon; the Atlantic is the paper sea; the rise at 7:45 reveals Europe on the same map. One sheet, no cheat.
3. **The design file is a dark canvas of real screens**, never a tool; version history is a flicker of drawn wireframes; the colour tokens are drawn swatches.
4. **Terminal, store results, reviews and App Store Connect statuses are drawn** with the exact words (contract 13.5). Only Xcode and the Simulator are recorded, inside drawn frames.
5. **"Red" in the script is the accent**: stamps, string, "Rejected" circles. The sticky notes are the v1 yellow with accent lettering.
6. **The logotype is DM Sans 700** (the v1 title face); PROVISUM is first written in Caveat and then becomes it.
7. **MAYA's sepia is #7A4A2A**; the lower-third labels in chapter 2 are sepia.
8. **Chapter 10's five binder phones are in light appearance** (the wallpapers read on black); everything else in the void is dark appearance.
9. **The invite and who-joined moments use the demo hooks only** (PLAN risk 4).
10. **The chapter-9 chips read "Dad" / "Leo"** (fictional, consistent); the drawn question is the real onboarding question.
11. **The end card copy** adds the script's Cambria line "Made by Veyago. Private by design." as a fourth line at 23.0.

Questions for the owner:
1. **Synthetic voices credit.** If MAKER or MAYA is synthetic, the director proposes a fifth end-card line at 24.0-25.0, DM Sans 400 24 px graphite 60%: "The voices of Maker and Maya are synthetic." Yes or no, and the wording.
2. **The test count** for the number roll at 7/64-69 (the real number from a full `ProvisumTests` run on release day).
3. **The invitation wording** for the far phone at 10/64.0: the app's own notification text, or reword the drawn card.
4. **The Xcode navigator group names** as they really appear (the tabs copy the recording).
5. **The terminal suggestion strings, the store results and the one-star review texts** for the drawn cards (claims rows; the drawn cards use them verbatim).
6. **"On Behalf"** as the working name, "dozens of versions", "every screen checked at the biggest text sizes", "seven days": confirm or reword (S0-B's claims table lists them).
7. **MAYA Y4 placement:** the director put it mid-flight (9/29.0); the script allows anywhere over the flights.
8. **The Sam binder capture** (`friend-binder`) needs a sample binder with a car registration and a lease; the owner's sample data may not have one: build it with the demo hooks or reword the label.
