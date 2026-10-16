// armReach.ts — the whole arm behind a desk-kit hand when the camera is far enough out to see past the wrist (pure).
// The kit draws the hand and its first KIT_FOREARM_MM of forearm (wrist waist, swelling to full width); this
// continues the same ribbon past the elbow: it can turn toward a chosen way out of the frame, the upper arm swells
// to 1.2x the forearm (the wrist is then ~56% of it), and it keeps widening a little as it rises toward the camera,
// long enough that its far end is always beyond the frame edge. The start overlaps the kit's forearm so its flat
// end is hidden under this one.
import {handAnchorPx, handDirectionPx, type HandPlacement, type HandPose, REACH_PER_PX, SHADOW_DIR, SKETCH_PX_PER_MM} from '../../desk';
import {add, dot, mul, norm, outlineOf, type Outline, type Pt, type Ribbon, ribbonOf, rotate, smooth01, sub} from '../../desk/hands/geometry';
import {forearmOf} from '../../desk/hands/handShading';

/** The kit's own forearm stops here (mm from the wrist): past its swell (230 mm), before the elbow. */
export const KIT_FOREARM_MM = 250;
/** The extension starts this far before the kit's flat end and covers it. */
const OVERLAP_MM = 50;
const STEP_MM = 10;
/** The elbow: the arm turns toward its way out over BEND_MM centred here. */
const ELBOW_MM = 290;
const BEND_MM = 160;
/** Upper arm: 1.2x the forearm's full width by 200 mm past the elbow, then +35% per metre (rising to the camera). */
const UPPER = {swell: 0.2, overMm: 200, perspectivePerMetre: 0.35, cap: 1.9} as const;
/**
 * The arm rises off the desk past the elbow (height per unit length), so its shadow drifts away from it along the
 * lamp's direction, up to RISE_CAP_MM of height: the shadow leaves the arm gradually instead of hugging it.
 */
const RISE_SLOPE = 0.09;
const RISE_CAP_MM = 110;

export type ArmReach = {
  /** Unit direction (parent px) the upper arm leaves along; default: straight on from the forearm. */
  readonly exit?: Pt;
  /** Total length from the wrist, mm: long enough to leave the frame (see `reachMm`). */
  readonly lengthMm: number;
};

export type ArmGeometry = {
  readonly rib: Ribbon;
  readonly out: Outline;
  /** Closed fill polygon (flat at both ends). */
  readonly polygon: readonly Pt[];
  /** The part beyond the kit's own forearm (the kit casts the shadow of the rest), drifting as the arm rises. */
  readonly shadowPolygon: readonly Pt[];
};

const WRIST_A = '__armWristA';
const WRIST_B = '__armWristB';

/** px per mm of the hand drawing for a placement (the kit's own rule). */
export const handK = (p: HandPlacement): number => (p.pxPerMm ?? SKETCH_PX_PER_MM) * (p.size ?? 1);

/** The kit's forearm for a placement, exactly as HandDrawing builds it with forearmMm = KIT_FOREARM_MM. */
const kitForearm = (p: HandPlacement, pose: HandPose): ReturnType<typeof forearmOf> => {
  const withWrist: HandPose = {...pose, anchors: {...pose.anchors, [WRIST_A]: pose.wrist[0], [WRIST_B]: pose.wrist[1]}};
  const wrist: readonly [Pt, Pt] = [handAnchorPx(p, withWrist, WRIST_A), handAnchorPx(p, withWrist, WRIST_B)];
  const dir = handDirectionPx(p, pose, pose.forearm);
  return forearmOf({wrist, dir, lengthMm: KIT_FOREARM_MM, k: handK(p), ...(p.forearmBend === undefined ? {} : {bendDeg: p.forearmBend})});
};

/** Signed angle (radians, clockwise on screen positive) that turns unit `a` onto unit `b`. */
const turnAngle = (a: Pt, b: Pt): number => Math.atan2(a.x * b.y - a.y * b.x, dot(a, b));

const upperWidth = (full: number, mm: number): number => {
  const past = Math.max(0, mm - ELBOW_MM);
  const k = 1 + UPPER.swell * smooth01(past / UPPER.overMm) + (UPPER.perspectivePerMetre * past) / 1000;
  return full * Math.min(UPPER.cap, k);
};

type Sample = {readonly p: Pt; readonly w: number};

/** The samples past the kit's end: turning toward `exit` around the elbow, widening. */
const continuation = (start: Pt, d0: Pt, full: number, exit: Pt, lengthMm: number, k: number): Sample[] => {
  const angle = turnAngle(d0, exit);
  const count = Math.max(1, Math.ceil((lengthMm - KIT_FOREARM_MM) / STEP_MM));
  const step = STEP_MM * k;
  return Array.from({length: count}, (_, j) => (j + 1) * STEP_MM + KIT_FOREARM_MM).reduce<Sample[]>((acc, mm) => {
    const prev = acc.length > 0 ? (acc[acc.length - 1] as Sample).p : start;
    const turn = smooth01((mm - (ELBOW_MM - BEND_MM / 2)) / BEND_MM);
    const d = rotate(d0, angle * turn);
    return [...acc, {p: add(prev, mul(d, step)), w: upperWidth(full, mm)}];
  }, []);
};

/** The arm beyond the kit's forearm for a placement (pure). */
export const armGeometry = (p: HandPlacement, pose: HandPose, reach: ArmReach): ArmGeometry => {
  const kit = kitForearm(p, pose);
  const n = kit.rib.spine.length;
  const from = Math.max(0, Math.round(((KIT_FOREARM_MM - OVERLAP_MM) / KIT_FOREARM_MM) * (n - 1)));
  const last = kit.rib.spine[n - 1] as Pt;
  const d0 = norm(sub(last, kit.rib.spine[n - 2] as Pt));
  const full = kit.rib.widths[n - 1] as number;
  const exit = reach.exit ? norm(reach.exit) : d0;
  const head: Sample[] = kit.rib.spine.slice(from).map((pt, i) => ({p: pt, w: kit.rib.widths[from + i] as number}));
  const tail = continuation(last, d0, full, exit, reach.lengthMm, handK(p));
  const samples = [...head, ...tail];
  const spine = samples.map((s) => s.p);
  const base = ribbonOf(spine, () => 1);
  const rib: Ribbon = {...base, widths: samples.map((s) => s.w)};
  const out = outlineOf(rib);
  const polygon = [...out.left, ...[...out.right].reverse()];
  const kitEnd = head.length - 1;
  const drift = (i: number): Pt => {
    const mm = KIT_FOREARM_MM + (i - kitEnd) * STEP_MM;
    const h = Math.min(RISE_CAP_MM, Math.max(0, mm - ELBOW_MM) * RISE_SLOPE) * handK(p) * REACH_PER_PX;
    return {x: SHADOW_DIR.x * h, y: SHADOW_DIR.y * h};
  };
  const cast = (edge: readonly Pt[]): Pt[] => edge.slice(kitEnd).map((q, j) => add(q, drift(kitEnd + j)));
  const shadowPolygon = [...cast(out.left), ...cast(out.right).reverse()];
  return {rib, out, polygon, shadowPolygon};
};

/** Length (mm) that reaches past any frame edge from anywhere in it: the frame's diagonal in the hand's mm. */
export const reachMm = (frameDiagonalPx: number, screenPxPerParentPx: number, k: number): number => frameDiagonalPx / Math.max(1e-6, screenPxPerParentPx * k) + KIT_FOREARM_MM;

/** A unit direction (parent px, unrotated) from degrees off straight down the screen: 0 = down, positive = toward the right. */
export const exitFromDown = (degToRight: number): Pt => {
  const a = (degToRight * Math.PI) / 180;
  return {x: Math.sin(a), y: Math.cos(a)};
};
