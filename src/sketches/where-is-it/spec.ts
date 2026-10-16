// spec.ts — page 8, "Where is the original?" (BIBLE §4.9). A key, a safe deposit box, a dotted line from the key's
// teeth to the box's keyhole, and the keyhole circled. The teeth are heard as a `key_clink`.
import {handCircle, handDottedLine, handLine, handPolyline, handRect, type SketchSpec, type XY} from '../../paper';
import {keyTeeth, roundedRect} from '../kit-b/glyphs';
import {checkSpec, STROKE_CAP_FAST} from '../kit-b/page';
import {accent, line, note, WEIGHT} from '../kit-b/timed';

const RING = {cx: 300, cy: 400, r: 50} as const;
/** The bow's hole: the ring of a key is a loop with a hole, which is what makes it a key and not a magnifier. */
const HOLE = {cx: 286, cy: 400, r: 17} as const;
const SHAFT = {x1: 350, x2: 560, y: 400} as const;
/** Three teeth 10 wide hanging from the shaft; depths vary slightly, as cut keys do (`[x, width, depth]`). */
const TEETH: readonly (readonly [number, number, number])[] = [
  [520, 10, 30],
  [538, 10, 22],
  [556, 10, 30],
];
const BOX = {x1: 680, y1: 260, x2: 1000, y2: 560, r: 10} as const;
const INNER = {x1: 700, y1: 280, x2: 980, y2: 540} as const;
const HANDLE = {cx: 960, cy: 410, r: 14} as const;
const KEYHOLE = {cx: 840, cy: 410, r: 5, slot: 14} as const;
const TARGET = {r: 40} as const;
const COLLAR = {x: 368, gap: 9, half: 9} as const;
const HINGE = {w: 12, h: 34} as const;
const HINGE_Y = [325, 495] as const;
/** The key's blade is pressed a little harder than an outline so the thin key holds its own beside the box. */
const SHAFT_PRESSURE = 1.2;

const ring = [
  handCircle(RING.cx, RING.cy, RING.r, RING.r * 0.96, 801, {overlap: 0.1}),
  handCircle(HOLE.cx, HOLE.cy, HOLE.r, HOLE.r, 802, {overlap: 0.08, wobble: 0.3}),
].join(' ');

/** The keyhole's outline in one closed movement: round the dot over the top, down into the wedge and back. */
const keyholeOutline = (): string => {
  const {cx, cy, r, slot} = KEYHOLE;
  const arc = Array.from({length: 9}, (_, i): XY => {
    const a = (115 + (i / 8) * 310) * (Math.PI / 180);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });
  return handPolyline([...arc, [cx + 3.5, cy + r + slot], [cx - 3.5, cy + r + slot], arc[0] ?? [cx, cy + r]], 803, 0.15);
};
/** Shaded solid, the way a keyhole is filled in: tight hatching inside the same outline. */
const KEYHOLE_HATCH_GAP = 1.6;

/** The shaft, then the collar just after the bow (two short bands), which every drawn key has. */
const shaft = [
  handLine(SHAFT.x1, SHAFT.y, SHAFT.x2, SHAFT.y, 805, {overshoot: 3, bow: 0.8}),
  handLine(COLLAR.x, SHAFT.y - COLLAR.half, COLLAR.x - 0.5, SHAFT.y + COLLAR.half, 813, {overshoot: 0.5, bow: 0}),
  handLine(COLLAR.x + COLLAR.gap, SHAFT.y - COLLAR.half + 1, COLLAR.x + COLLAR.gap + 0.5, SHAFT.y + COLLAR.half - 1, 814, {overshoot: 0.5, bow: 0}),
].join(' ');

/** Two hinge knuckles on the door's left edge: they make the box a door that opens, i.e. a safe. */
const hinges = HINGE_Y.map((y, i) => handRect(BOX.x1 - 7, y - HINGE.h / 2, HINGE.w, HINGE.h, 815 + i, {radius: 2, overshoot: 2})).join(' ');

export const spec: SketchSpec = checkSpec(
  {
    id: 'where-is-it',
    strokes: [
      line('key-ring', ring, 0.0, 0.12, {width: WEIGHT.device}),
      line('key-shaft', shaft, 0.12, 0.2, {width: WEIGHT.box, pressure: SHAFT_PRESSURE}),
      line('key-teeth', keyTeeth(TEETH, SHAFT.y, 806), 0.2, 0.28, {width: WEIGHT.box, pressure: SHAFT_PRESSURE}),
      line('box', roundedRect(BOX.x1, BOX.y1, BOX.x2 - BOX.x1, BOX.y2 - BOX.y1, BOX.r, 807, 9), 0.28, 0.48, {width: WEIGHT.device, rough: true}),
      line('box-inner', roundedRect(INNER.x1, INNER.y1, INNER.x2 - INNER.x1, INNER.y2 - INNER.y1, 4, 808, 5), 0.48, 0.54, {width: WEIGHT.box}),
      line('hinges', hinges, 0.54, 0.56, {width: 1.8}),
      line('handle', handCircle(HANDLE.cx, HANDLE.cy, HANDLE.r, HANDLE.r, 809, {overlap: 0.15}), 0.56, 0.59, {width: WEIGHT.box}),
      line('keyhole', keyholeOutline(), 0.59, 0.61, {width: 1.6}),
      line('keyhole-fill', keyholeOutline(), 0.61, 0.62, {style: 'hatch', width: WEIGHT.hatch, hatchGap: KEYHOLE_HATCH_GAP, pressure: 1.1}),
      line('link', handDottedLine(565, 402, 828, 410, 810), 0.62, 0.7, {style: 'dotted', width: WEIGHT.dotted}),
      accent('circle', handCircle(KEYHOLE.cx, KEYHOLE.cy, TARGET.r, TARGET.r * 0.94, 811), 0.8, 0.86),
    ],
    labels: [note('Where is the original?', 640, 660, -2, 0.88, 1.0)],
  },
  STROKE_CAP_FAST,
);
