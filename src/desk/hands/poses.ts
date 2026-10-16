// poses.ts — the hand pose library, as data in millimetres.
// Hand frame: origin at the middle finger's knuckle (MCP), fingers point toward -y (up the screen), x to the right;
// a RIGHT hand palm-down has its thumb at -x. Left hands are the mirror. Pure data + builders; HandDrawing.tsx
// turns a pose into pixels. Proportions are stylised: slender, calm, no knuckle bumps, fingertips that taper.
import {add, catmullRom, mul, norm, type Pt, pt, sub} from './geometry';

export type DigitName = 'thumb' | 'index' | 'middle' | 'ring' | 'little';

export type DigitPose = {
  /** Spine joints from a root inside the palm to the visible end. */
  readonly joints: readonly Pt[];
  /** Full width at the knuckle and at the tip, mm. */
  readonly width: readonly [number, number];
  /** The finger folds under at its last joint: a round knuckle end with a fold shade. */
  readonly knuckleEnd?: boolean;
  /** Redraw the digit from this joint index on top of whatever it holds (a pencil, a cup). */
  readonly capFrom?: number;
  /** A 2 px highlight runs along its lit edge (the index finger). */
  readonly highlight?: boolean;
};

export type HandPose = {
  readonly id: string;
  /** Drawing order = overlap order (first is lowest). */
  readonly digits: readonly (readonly [DigitName, DigitPose])[];
  /** Closed palm outline, clockwise on screen, passing under the fingers at the webs. */
  readonly palm: readonly Pt[];
  /** The forearm attaches between these (thumb side first). */
  readonly wrist: readonly [Pt, Pt];
  /** Unit direction (hand frame) the forearm leaves along. */
  readonly forearm: Pt;
  /** Adjacent digit pairs joined by a soft web: [thumb-side digit, its depth mm from the knuckle, other digit, its depth]. */
  readonly webs: readonly WebSpec[];
  /** Named points scene owners anchor to (mm, hand frame). */
  readonly anchors: Readonly<Record<string, Pt>>;
  /** The held pencil, when the pose holds one: pinch point and the unit direction toward its back end. */
  readonly pencil?: {
    readonly pinch: Pt;
    readonly dir: Pt;
    readonly tiltDeg: number;
    /** How far behind the pinch (mm, hand frame, along `dir`) the pencil is hidden under both finger caps: the seam between its two drawn pieces goes there. */
    readonly seamMm?: number;
  };
};

export type WebSpec = readonly [DigitName, number, DigitName, number];

const RAD = Math.PI / 180;
/** Direction for an angle in degrees: 0 = up the screen (-y), positive = clockwise. */
export const dirOf = (deg: number): Pt => pt(Math.sin(deg * RAD), -Math.cos(deg * RAD));

/** Segment lengths, mm (proximal, middle, distal). */
export const SEGMENTS: Record<DigitName, readonly number[]> = {
  thumb: [31, 26],
  index: [40, 24, 20],
  middle: [44, 27, 22],
  ring: [41, 25, 21],
  little: [32, 19, 17],
};
export const WIDTHS: Record<DigitName, readonly [number, number]> = {
  thumb: [21, 16],
  index: [16, 12.2],
  middle: [16.5, 12.2],
  ring: [15.5, 11.7],
  little: [13.5, 10.3],
};
/** Knuckle (MCP) positions of a right hand, mm: an arc, the middle finger highest. */
export const MCP: Record<DigitName, Pt> = {
  thumb: pt(-47, 26),
  index: pt(-24, 5),
  middle: pt(0, 0),
  ring: pt(22, 4),
  little: pt(41, 13),
};
const ROOT_DEPTH = 16;
const FOLD_PITCH = 72;

type Segment = {readonly bend: number; readonly pitch?: number};

/**
 * A digit from its knuckle: `base` is the proximal segment's direction (deg), each segment bends by `bend` (deg,
 * positive = clockwise on screen) and may pitch down into the paper (`pitch`, deg: foreshortened from above; past
 * FOLD_PITCH the finger folds under and ends at that joint as a knuckle).
 */
export const digit = (name: DigitName, base: number, segments: readonly Segment[], o: Partial<DigitPose> = {}, mcpOverride?: Pt): DigitPose => {
  const lengths = SEGMENTS[name];
  const mcp = mcpOverride ?? MCP[name];
  const joints: Pt[] = [sub(mcp, mul(dirOf(base), ROOT_DEPTH)), mcp];
  let angle = base;
  let knuckleEnd = false;
  for (const [i, seg] of segments.entries()) {
    const length = lengths[i];
    if (length === undefined) break;
    angle += seg.bend;
    const pitch = seg.pitch ?? 0;
    if (pitch >= FOLD_PITCH) {
      knuckleEnd = true;
      break;
    }
    joints.push(add(joints[joints.length - 1] as Pt, mul(dirOf(angle), length * Math.cos(pitch * RAD))));
  }
  return {joints, width: WIDTHS[name], ...(knuckleEnd ? {knuckleEnd} : {}), ...o};
};

/** A digit from explicit joints (root inside the palm first), for the hero poses that are authored by eye. */
export const digitFrom = (name: DigitName, joints: readonly Pt[], o: Partial<DigitPose> = {}): DigitPose => ({joints, width: WIDTHS[name], ...o});

/**
 * The palm of a right hand: a smooth closed outline. Its top runs under the fingers (their fills cover it); the
 * thumb side carries the thenar bulge, the little side the hypothenar; it narrows to the wrist.
 */
const palmOutline = (o: {thumbOut?: number} = {}): Pt[] => {
  const t = o.thumbOut ?? 0;
  return catmullRom(
    [
      pt(-29, 98),
      pt(-40, 78),
      pt(-50 - t, 56),
      pt(-50 - t, 40),
      pt(-40, 22),
      pt(-33, 12),
      pt(-12, 14),
      pt(11, 14),
      pt(32, 18),
      pt(48, 24),
      pt(53, 44),
      pt(50, 70),
      pt(33, 98),
    ],
    8,
    true,
  );
};

const WRIST: readonly [Pt, Pt] = [pt(-29, 98), pt(33, 98)];
const DOWN = pt(0, 1);
const FINGER_WEBS: readonly WebSpec[] = [
  ['index', 14, 'middle', 14],
  ['middle', 14, 'ring', 14],
  ['ring', 15, 'little', 16],
];
const THUMB_WEB: WebSpec = ['thumb', 18, 'index', 8];

const common = {palm: palmOutline(), wrist: WRIST, forearm: DOWN, webs: [THUMB_WEB, ...FINGER_WEBS]};
const PALM = pt(2, 52);

/** Relaxed open hand reaching in: fingers gently curled, the index a little apart, the little finger curling more. */
export const REACH: HandPose = {
  id: 'reach',
  ...common,
  digits: [
    ['little', digit('little', 14, [{bend: 4, pitch: 22}, {bend: 12, pitch: 34}, {bend: 10, pitch: 44}])],
    ['ring', digit('ring', 6, [{bend: 2, pitch: 16}, {bend: 9, pitch: 28}, {bend: 8, pitch: 38}])],
    ['middle', digit('middle', 0, [{bend: 0, pitch: 12}, {bend: 6, pitch: 24}, {bend: 6, pitch: 34}])],
    ['index', digit('index', -8, [{bend: -1, pitch: 8}, {bend: 4, pitch: 18}, {bend: 4, pitch: 28}], {highlight: true})],
    ['thumb', digit('thumb', -52, [{bend: 4, pitch: 16}, {bend: 22, pitch: 30}])],
  ],
  anchors: {palm: PALM, indexTip: pt(-36, -74)},
};

/**
 * Flat hand on paper: steadying a sheet corner, sliding a sheet, laying one down. `spread` 0 = together, 1 = open
 * (about 25° across the four fingers when open). The fingers relax into the paper: each joint flexes 10-15°, so
 * from above they foreshorten a little instead of lying as straight sticks.
 */
export const flatPose = (spread: number, id = 'flat'): HandPose => {
  const k = Math.min(1, Math.max(0, spread));
  const splay = (together: number, open: number): number => together + (open - together) * k;
  return {
    id,
    ...common,
    digits: [
      ['little', digit('little', splay(4, 13), [{bend: 3, pitch: 14}, {bend: 5, pitch: 26}, {bend: 4, pitch: 36}])],
      ['ring', digit('ring', splay(1.5, 6), [{bend: 1, pitch: 12}, {bend: 3, pitch: 22}, {bend: 3, pitch: 32}])],
      ['middle', digit('middle', splay(-0.5, 0), [{bend: 0, pitch: 11}, {bend: 1, pitch: 20}, {bend: 1, pitch: 30}])],
      ['index', digit('index', splay(-3, -8), [{bend: 0, pitch: 10}, {bend: -2, pitch: 18}, {bend: -2, pitch: 28}], {highlight: true})],
      ['thumb', digit('thumb', splay(-30, -44), [{bend: 6, pitch: 16}, {bend: 16, pitch: 24}])],
    ],
    anchors: {palm: PALM, indexTip: pt(-30, -78), fingertips: pt(0, -84)},
  };
};

/** Carrying a sheet from above: fingers together on top, the thumb tucked underneath (hidden by the sheet). */
export const CARRY: HandPose = {
  ...flatPose(0.1, 'carry'),
  digits: flatPose(0.1).digits.filter(([name]) => name !== 'thumb'),
  webs: FINGER_WEBS,
  anchors: {palm: PALM, fingertips: pt(0, -84)},
};

/** Index and middle fingers extended to press and smooth (the sticky note), close together; the others curl under. */
export const POINT: HandPose = {
  id: 'point',
  ...common,
  digits: [
    ['little', digit('little', 11, [{bend: 5, pitch: 46}, {bend: 18, pitch: 80}])],
    ['ring', digit('ring', 6, [{bend: 3, pitch: 42}, {bend: 16, pitch: 80}])],
    ['middle', digit('middle', 1, [{bend: 0, pitch: 8}, {bend: 1, pitch: 14}, {bend: 1, pitch: 20}])],
    ['index', digit('index', -3, [{bend: -1, pitch: 8}, {bend: 1, pitch: 14}, {bend: 1, pitch: 20}], {highlight: true})],
    ['thumb', digit('thumb', -34, [{bend: 6, pitch: 26}, {bend: 20, pitch: 36}])],
  ],
  anchors: {palm: PALM, indexTip: pt(-29, -78), pad: pt(-16, -74)},
};

/** Resting: pencil set down, the hand lying relaxed with the fingers gently curled toward the paper. */
export const REST: HandPose = {
  id: 'rest',
  ...common,
  digits: [
    ['little', digit('little', 12, [{bend: -4, pitch: 30}, {bend: -6, pitch: 48}, {bend: -4, pitch: 56}])],
    ['ring', digit('ring', 6, [{bend: -3, pitch: 26}, {bend: -4, pitch: 42}, {bend: -3, pitch: 50}])],
    ['middle', digit('middle', 1, [{bend: -1, pitch: 22}, {bend: -2, pitch: 36}, {bend: -2, pitch: 44}])],
    ['index', digit('index', -5, [{bend: 0, pitch: 14}, {bend: 2, pitch: 26}, {bend: 2, pitch: 34}], {highlight: true})],
    ['thumb', digit('thumb', -36, [{bend: 8, pitch: 18}, {bend: 26, pitch: 30}])],
  ],
  anchors: {palm: PALM, indexTip: pt(-34, -72)},
};

/**
 * Setting a cup down, held by its handle: the index finger leads and hooks through the loop (its first segment is
 * seen reaching the handle's outer end, then it passes under the bar), the middle finger follows a little behind,
 * the thumb's last segment presses the top of the handle near the rim, the other fingers curl beneath. The mug
 * (r ~44 mm) sits at anchor `grip`, its handle pointing +x in the hand frame (`cupHandleAngle`), so the bar runs from
 * the rim to `handleEnd` and stays visible in the gap between thumb and index. Draw the cup as `held`: it covers the
 * fingers that pass under the bar; the thumb's tip is redrawn over the handle.
 */
export const CUP_MUG_RADIUS_MM = 44;
export const CUP_HOLD: HandPose = {
  id: 'cupHold',
  ...common,
  palm: palmOutline({thumbOut: 3}),
  webs: [
    ['thumb', 16, 'index', 7],
    ['index', 13, 'middle', 13],
    ['middle', 13, 'ring', 12],
    ['ring', 12, 'little', 13],
  ],
  digits: [
    ['little', digitFrom('little', [pt(42, 28), pt(41, 13), pt(37, -2)], {knuckleEnd: true})],
    ['ring', digitFrom('ring', [pt(24, 19), pt(22, 4), pt(16, -16)], {knuckleEnd: true})],
    ['middle', digitFrom('middle', [pt(2, 16), pt(0, 0), pt(-8, -24)], {knuckleEnd: true})],
    ['index', digitFrom('index', [pt(-20, 20), pt(-24, 5), pt(-34, -18), pt(-38, -36)], {highlight: true, knuckleEnd: true})],
    ['thumb', digitFrom('thumb', [pt(-32, 36), pt(-48, 20), pt(-60, -6), pt(-60, -28)], {capFrom: 1})],
  ],
  anchors: {palm: PALM, grip: pt(-104, -22), handleEnd: pt(-37, -22)},
};

/** The cup's `handleAngle` (degrees from +x) for a hand placed with `rotation`, so the handle points at the hand. */
export const cupHandleAngle = (rotation: number, handed: 'right' | 'left' = 'right'): number => (handed === 'left' ? 180 - rotation : rotation);

/** The handle bar's outer end is at `handleEnd`, 1.52 radii from the cup's centre (CoffeeCup's HANDLE_REACH). */
const CUP_HANDLE_END_RADII = 1.52;

/**
 * Where a mug of radius `rMm` (in the hand's own mm: its px radius over the hand's px per mm) sits so its handle
 * ends under the thumb: the `cupHold` pose with this as its `grip` anchor fits that cup. `CUP_HOLD.anchors.grip`
 * is this for `CUP_MUG_RADIUS_MM`.
 */
export const cupGripAnchor = (rMm: number): Pt => {
  const end = CUP_HOLD.anchors.handleEnd ?? pt(-37, -22);
  return pt(end.x - CUP_HANDLE_END_RADII * rMm, end.y);
};

/**
 * The tripod pencil grip, right hand, authored by eye. The index lies along the pencil's far side and its pad presses
 * the top near the tip; the thumb's first segment runs beside the pencil's near side and its pad presses it a little
 * behind the index; the pencil passes between them over the web and lies on the back of the hand, its end reaching
 * the heel's thumb-side edge. The middle finger supports it from below (its last joint disappears under it); ring
 * and little fingers fold under. The pencil is held at 45° so a good length of it shows from above.
 */
const GRIP_PALM = catmullRom(
  [pt(-29, 98), pt(-44, 78), pt(-56, 56), pt(-56, 36), pt(-50, 20), pt(-38, 12), pt(-12, 14), pt(11, 14), pt(32, 18), pt(48, 24), pt(53, 44), pt(50, 70), pt(33, 98)],
  8,
  true,
);
const GRIP_PINCH = pt(-46, -50);
const GRIP_PENCIL_DIR = norm(pt(-2, 118));
export const GRIP: HandPose = {
  id: 'grip',
  ...common,
  palm: GRIP_PALM,
  webs: [
    ['thumb', 16, 'index', 7],
    ['index', 13, 'middle', 13],
    ['middle', 13, 'ring', 12],
    ['ring', 12, 'little', 13],
  ],
  digits: [
    ['little', digitFrom('little', [pt(42, 28), pt(41, 13), pt(34, -9)], {knuckleEnd: true})],
    ['ring', digitFrom('ring', [pt(24, 19), pt(22, 4), pt(12, -24)], {knuckleEnd: true})],
    ['middle', digitFrom('middle', [pt(2, 16), pt(0, 0), pt(-11, -30), pt(-22, -42)], {knuckleEnd: true})],
    ['index', digitFrom('index', [pt(-21, 20), pt(-24, 5), pt(-31, -29), pt(-37, -45), pt(-44, -55)], {highlight: true, capFrom: 2})],
    ['thumb', digitFrom('thumb', [pt(-36, 40), pt(-53, 22), pt(-65, -6), pt(-54, -36)], {capFrom: 2})],
  ],
  anchors: {palm: PALM, pinch: GRIP_PINCH},
  pencil: {pinch: GRIP_PINCH, dir: GRIP_PENCIL_DIR, tiltDeg: 45, seamMm: 10},
};

/** Holding the pencil ready to lay it down (2:29-2:32.5): the grip, the pencil a little steeper. */
export const LOWER: HandPose = {
  ...GRIP,
  id: 'lower',
  pencil: {pinch: GRIP_PINCH, dir: GRIP_PENCIL_DIR, tiltDeg: 56, seamMm: 10},
};

export const POSES = {
  reach: REACH,
  grip: GRIP,
  lower: LOWER,
  rest: REST,
  steady: flatPose(0.2, 'steady'),
  slide: flatPose(0.55, 'slide'),
  lay: CARRY,
  press: flatPose(0.15, 'press'),
  smooth: POINT,
  cupHold: CUP_HOLD,
} as const;

export type PoseName = keyof typeof POSES;
