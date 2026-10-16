// geometry.ts — where the drawing is, frame by frame (pure). The page on the desk, the phone's screen in points, the
// rig's pose from beats.ts, and the projected quad the hairline overlay is pinned to. One mapping serves the whole
// module: on paper the quad is the page's own screen area; from the lift-off it is the rig's screen plane, so the
// hairlines never jump between a 2D and a 3D renderer.
import {transition} from '../../beats';
import {localToWorld, PHONE, projectToFrame, quadTransform, transitionPhone, type Placement, type Rotation} from '../../devices';
import type {FormatName} from '../../film';
import {mix, paramOfPoint, pointAt, windowProgress} from '../../glass';
import {HOME_LAYOUT, PHONE_FRAME, SCREEN_AREA, SCREEN_SCALE, type ScreenRect} from '../../sketches/binder-home-v2/layout';

export type Size = {readonly width: number; readonly height: number};
export type Pt = [number, number];
export type Quad = readonly [Pt, Pt, Pt, Pt];
export type Pose = {readonly placement: Placement; readonly rotation: Rotation; readonly fov: number};
export type Stretch = {readonly x: number; readonly y: number};
export type PageTransform = {readonly scale: number; readonly left: number; readonly top: number};

const {wPt, hPt} = HOME_LAYOUT.screen;

/** Logical px per sketch px: the drawn phone outline (PHONE_FRAME.h sketch px) is the rig's body height. */
export const pageScale = (format: FormatName, frameHeight: number): number =>
  (transition.handoff.phoneHeightFraction[format] * frameHeight) / PHONE_FRAME.h;

/** The sheet's placement in the frame: the drawn phone outline centred where the rig's phone will be. */
export const pageTransform = (format: FormatName, size: Size): PageTransform => {
  const scale = pageScale(format, size.height);
  const [cx, cy] = transition.handoff.phoneCentre[format];
  const centre = {x: PHONE_FRAME.x + PHONE_FRAME.w / 2, y: PHONE_FRAME.y + PHONE_FRAME.h / 2};
  return {scale, left: cx * size.width - centre.x * scale, top: cy * size.height - centre.y * scale};
};

/**
 * The paper's screen mapping is not the rig's: the page is 0.26% wider and 0.92% shorter than the screen plane
 * (BIBLE 4.14's mapping against the capture's aspect). The lift-off eases this to 1, so the drawing lands on the glass.
 */
export const PAPER_STRETCH: Stretch = {
  x: SCREEN_AREA.w / (PHONE_FRAME.h * PHONE.screen.width),
  y: SCREEN_AREA.h / (PHONE_FRAME.h * PHONE.screen.height),
};

export const stretchAt = (t: number): Stretch => {
  const k = windowProgress(transition.liftOff, t, 'easeInOutSine');
  return {x: mix(PAPER_STRETCH.x, 1, k), y: mix(PAPER_STRETCH.y, 1, k)};
};

/** Sketch px -> screen points (the inverse of BIBLE 4.14's mapping). */
export const sketchToPt = (x: number, y: number): Pt => [(x - SCREEN_AREA.x) / SCREEN_SCALE.x, (y - SCREEN_AREA.y) / SCREEN_SCALE.y];

/** Screen points -> device units (y up), stretched. */
export const ptToLocal = (xPt: number, yPt: number, s: Stretch): [number, number] => [
  (xPt / wPt - 0.5) * PHONE.screen.width * s.x,
  (0.5 - yPt / hPt) * PHONE.screen.height * s.y,
];

/** The front of the glass, in device units. */
export const GLASS_Z = PHONE.depth / 2;

export const poseAt = (t: number, format: FormatName, size: Size): Pose => {
  const p = transitionPhone(t, format, size.height);
  return {placement: p.placement, rotation: p.rotation, fov: p.fov};
};

/** A device-local point -> frame px through the pose and the stage camera. */
export const projectLocal = (pose: Pose, size: Size, local: readonly [number, number, number]): Pt => {
  const world = localToWorld({placement: pose.placement, rotation: pose.rotation}, size, local);
  const [x, y] = projectToFrame(world, {...size, fov: pose.fov});
  return [x, y];
};

/** The body's extent in screen points (the screen is 402 x 874 pt; the body runs a little beyond it on every side). */
export const BODY_PT = {
  width: PHONE.outline.width / (PHONE.screen.width / wPt),
  height: 1 / (PHONE.screen.height / hPt),
} as const;

/** Room around the body for the drawn outline's overshoot, the glow and the re-tracing head (screen points). */
const OVERLAY_PAD_PT = 40;

/** The hairline overlay's canvas, in screen points: the body plus padding. */
export const OVERLAY_RECT: ScreenRect = {
  x: -(BODY_PT.width - wPt) / 2 - OVERLAY_PAD_PT,
  y: -(BODY_PT.height - hPt) / 2 - OVERLAY_PAD_PT,
  w: BODY_PT.width + 2 * OVERLAY_PAD_PT,
  h: BODY_PT.height + 2 * OVERLAY_PAD_PT,
};

/** Logical px per screen point at the pose (the body's height in px over its height in points). */
export const ptToLogical = (pose: Pose): number => pose.placement.height / BODY_PT.height;

/** The overlay rect's corners (tl, tr, br, bl) on the glass, projected to frame px. */
export const overlayQuad = (pose: Pose, size: Size, s: Stretch): Quad => {
  const r = OVERLAY_RECT;
  const corner = (xPt: number, yPt: number): Pt => {
    const [lx, ly] = ptToLocal(xPt, yPt, s);
    return projectLocal(pose, size, [lx, ly, GLASS_Z]);
  };
  return [corner(r.x, r.y), corner(r.x + r.w, r.y), corner(r.x + r.w, r.y + r.h), corner(r.x, r.y + r.h)];
};

/** CSS transform pinning a canvas of OVERLAY_RECT's size (CSS px = points) onto the glass. */
export const overlayTransform = (pose: Pose, size: Size, s: Stretch): string =>
  quadTransform(OVERLAY_RECT.w, OVERLAY_RECT.h, overlayQuad(pose, size, s));

/** Device units (y up) -> screen points, undoing the stretch. */
export const localToPt = (lx: number, ly: number, s: Stretch): Pt => [(lx / (PHONE.screen.width * s.x) + 0.5) * wPt, (0.5 - ly / (PHONE.screen.height * s.y)) * hPt];

/** Screen points -> sketch px (BIBLE 4.14's mapping). */
export const ptToSketch = (xPt: number, yPt: number): Pt => [SCREEN_AREA.x + xPt * SCREEN_SCALE.x, SCREEN_AREA.y + yPt * SCREEN_SCALE.y];

/**
 * The hand-drawn outline morphing into the rig's outline, in SKETCH px: each point moves (in device space) toward
 * the nearest point of the device perimeter by `m` (0 = as drawn, 1 = the device edge) and comes back to the page,
 * so the overlay canvas draws it like any other stroke and nothing changes renderer when the lift-off starts.
 */
export const outlineMorph = (pts: readonly {readonly x: number; readonly y: number}[], s: Stretch, m: number): readonly Pt[] =>
  pts.map((p) => {
    const [xPt, yPt] = sketchToPt(p.x, p.y);
    const [lx, ly] = ptToLocal(xPt, yPt, s);
    // The perimeter maths runs y-down; device space is y-up.
    const q = pointAt(PHONE.outline, paramOfPoint(PHONE.outline, lx, -ly));
    const [mx, my] = localToPt(mix(lx, q.x, m), mix(ly, -q.y, m), s);
    return ptToSketch(mx, my);
  });
