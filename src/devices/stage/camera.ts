// camera.ts — the stage's camera math (pure).
//
// World units are LOGICAL PIXELS. The frame plane is z = 0: an object at z = 0 that is h px tall projects to h px on
// screen whatever the field of view, because the camera dollies with the FOV (a "dolly zoom"). That is how the
// transition goes from a flat drawing (FOV ~0) to a perspective phone (FOV 28°) without the phone changing size.
// x runs right, y runs UP, the origin is the frame centre; the camera looks down -z.

/** Below this the camera is effectively orthographic (the drawing is flat). */
export const MIN_FOV_DEG = 0.5;
export const DEFAULT_FOV_DEG = 28;
/** Half the depth range held around the frame plane, in px (devices are a few hundred px deep at most). */
export const DEPTH_RANGE_PX = 6000;

export type StageSize = {width: number; height: number};

const toRad = (deg: number): number => (deg * Math.PI) / 180;

export const effectiveFov = (fovDeg: number): number => Math.max(MIN_FOV_DEG, Math.min(120, fovDeg));

/** Distance from the camera to the frame plane for a vertical FOV, so the plane spans the frame height. */
export const cameraDistance = (fovDeg: number, frameHeight: number): number =>
  frameHeight / 2 / Math.tan(toRad(effectiveFov(fovDeg)) / 2);

export const cameraClip = (distance: number): {near: number; far: number} => ({
  near: Math.max(1, distance - DEPTH_RANGE_PX),
  far: distance + DEPTH_RANGE_PX,
});

/** Frame fractions (0..1, y down, as the BIBLE gives positions) -> world px (y up, centred). */
export const frameToWorld = (fx: number, fy: number, size: StageSize): [number, number] => [
  (fx - 0.5) * size.width,
  (0.5 - fy) * size.height,
];

/** World px (y up) -> frame px (y down, origin top-left), for a point on the frame plane z = 0. */
export const worldToFramePx = (x: number, y: number, size: StageSize): [number, number] => [x + size.width / 2, size.height / 2 - y];
