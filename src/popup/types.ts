// types.ts — the pop-up data model. A pop-up is a flat NET of rectangular panels on the page; each panel is
// hinged to its parent along one edge and its fold angle is a function of time. Everything is data.
import type {Lamp} from '../paper';

export type Edge = 'top' | 'bottom' | 'left' | 'right';

/** Where a panel lies in the unfolded net (logical px, origin = top-left of the pop-up's footprint). */
export type Rect = {readonly x: number; readonly y: number; readonly w: number; readonly h: number};

/** Angle (degrees) at time `t` (seconds). Between two keys the angle eases; `spring` adds a settle overshoot. */
export type FoldKey = {readonly t: number; readonly a: number; readonly spring?: number};

/** A free hinge line in net coordinates; the fold follows the right-hand rule around a -> b. */
export type HingeLine = {readonly a: readonly [number, number]; readonly b: readonly [number, number]};

export type Panel = {
  readonly id: string;
  readonly rect: Rect;
  /** Parent panel id; omit for the root panel, which lies on the page. */
  readonly parent?: string;
  /**
   * Which edge of THIS panel is the hinge (the child's edge that touches the parent). Positive angles lift the panel
   * toward the viewer (a valley fold); negative angles fold it back under the page plane. Ignored when `line` is set.
   */
  readonly hinge?: Edge;
  /** A slanted hinge (roof pitches, fins). */
  readonly line?: HingeLine;
  /** Fold angle over time. Omit = flat (0). A bare number is a constant angle. */
  readonly angle?: number | readonly FoldKey[];
  /** Polygon (percent of the panel's own box) that cuts the panel's silhouette: gables, nose cones, trapezoids. */
  readonly clip?: readonly (readonly [number, number])[];
  /** Panel paper colour wash (rgba over the paper albedo), e.g. a wallpaper. */
  readonly tint?: string;
  /** Hide the panel before it starts moving (it is part of the drawing, not paper, until its first key). */
  readonly hideBefore?: number;
};

export type PopUpSpec = {
  readonly id: string;
  /** Size of the net's bounding box (the art is authored in this box). */
  readonly size: {readonly w: number; readonly h: number};
  readonly panels: readonly Panel[];
  /** Keep the folded object anchored: `ground` lowers it so nothing sinks under the page, `centre` keeps its middle over the net's middle (a crumpled ball). */
  readonly keep?: {readonly ground?: boolean; readonly centre?: boolean};
};

/** The camera on the object: a slight tilt reveals the walls; perspective gives the 2.5D. All optional. */
export type PopUpView = {
  /** Tilt of the whole object about the x axis, degrees (0 = straight down). Default 24. */
  readonly tilt?: number;
  /** Turn about the vertical, degrees. Default 0. */
  readonly yaw?: number;
  /** Perspective distance, px. Default 1500. */
  readonly perspective?: number;
};

export type PopUpLook = {
  readonly lamp?: Lamp;
  /** Paper thickness in px (a thin edge). Default 1.6. */
  readonly thickness?: number;
  /** Shadow darkness multiplier. Default 1. */
  readonly shadow?: number;
  /** How far shadows reach relative to physical (1 = physical for the lamp elevation). Default 0.85. */
  readonly reach?: number;
  /** Shift the paper grain so neighbouring objects do not share a pattern. */
  readonly grainOffset?: {readonly x: number; readonly y: number};
};
