// types.ts — the public prop types shared by every rig.

/**
 * Degrees, about the device's centre: yaw (y) first, then pitch (x), then roll (z). Positive y turns the screen toward the
 * viewer's left (the right edge comes forward); negative x leans the top away. See rigEuler in placement.ts.
 */
export type Rotation = {x?: number; y?: number; z?: number};

/**
 * Where a device sits. `x`/`y` are FRAME FRACTIONS (0..1, y down, as the BIBLE gives positions), `z` is px toward the
 * camera from the frame plane. `height` is the device body's height in logical px at z = 0.
 */
export type Placement = {x: number; y: number; z?: number; height: number};

/**
 * The light on a device edge (BIBLE section 3).
 * - `position`: 0..1 along the perimeter, clockwise from the top-left corner (use `cornerParam` for corners);
 * - `intensity`: the travelling band's brightness (1 = 100%; snaps may push it to 1.6);
 * - `width`: the band's length along the edge as a fraction of the device height (default 0.07);
 * - `sweep`: a second band that crosses the device left -> right (the pair's sweep): `x` 0..1 across the width.
 */
export type EdgeLight = {
  position?: number;
  intensity?: number;
  width?: number;
  sweep?: {x: number; intensity: number};
};

/** What a screen shows. `src` values are paths under public/ (they go through staticFile). */
export type ScreenSource =
  | {kind: 'none'}
  | {kind: 'image'; src: string}
  | {
      kind: 'video';
      src: string;
      /** Clip second shown at the rig's frame 0 (use the manifest's hotStart). */
      startAt?: number;
      playbackRate?: number;
      /** Freeze on this clip second instead of playing. */
      holdAt?: number;
      /** Clip seconds never to pass (the manifest's durationSec minus a frame). */
      endAt?: number;
    }
  | {
      kind: 'draw';
      width: number;
      height: number;
      /** Called once per frame, synchronously, before the frame is rendered. */
      draw: (ctx: CanvasRenderingContext2D, frame: number) => void;
    };

/** Shared props of every rig. */
export type RigProps = {
  placement: Placement;
  rotation?: Rotation;
  /** Extra uniform scale on top of `placement.height` (1 = as placed). */
  scale?: number;
  edgeLight?: EdgeLight;
  /** Overall light level of the device: halo and edge light (1 = 100%, the settle goes to 0.7, the pair to 0.4). */
  glow?: number;
  /**
   * 0..1 fade of the body and screen (to black: the void is black). The edge light and halo are NOT faded by it, so a
   * device can light in edge first; fade those with `edgeLight.intensity` / `glow`.
   */
  opacity?: number;
};
