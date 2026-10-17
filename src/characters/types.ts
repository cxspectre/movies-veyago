// types.ts — the line characters' data model (BIBLE4 §4). A character is a continuous outline (ONE path per pose,
// a handful of named segments so poses can be swapped segment by segment), a 3-5 stroke face and one accent detail.
// Figure px: y down, origin at the ground point under the figure (standing height = -height .. 0), scale 1 = sheet px.
import type {Ink, XY} from '../paper';

export type CharacterId = 'maya' | 'dad' | 'leo' | 'mia' | 'jonas' | 'sam' | 'biscuit';

/** Pose ids the chapters need (BIBLE4 §4 pose list); every character has 'stand' and 'tree'. */
export type PoseId =
  | 'stand'
  | 'tree'
  | 'sit-A'
  | 'sit-B'
  | 'look-up'
  | 'window'
  | 'doorway'
  | 'tap'
  | 'sit'
  | 'reach'
  | 'lie'
  | 'hold-up';

/** One named run of points of the body outline. Poses of one character have the same segment names in the same order. */
export type Segment = {readonly name: string; readonly pts: readonly XY[]};

/** Where the face sits: centre, radii of the head egg, facing (-1 left .. 1 right) and tilt (radians, clockwise). */
export type HeadGeom = {readonly c: XY; readonly rx: number; readonly ry: number; readonly facing: number; readonly tilt: number};

/** A short pencil movement as points: smooth 1 = Catmull-Rom curve, 0 = straight segments. */
export type Polyline = {readonly pts: readonly XY[]; readonly smooth?: number; readonly closed?: boolean};

/** Everything the pencil needs for one pose, in figure px. */
export type Figure = {
  /** The body as ordered segments: concatenated, they are one continuous pencil movement. */
  readonly body: readonly Segment[];
  /** Face (3-5 strokes: brow, nose, mouth, a hint of an eye), any beard strokes, and small clothing details in the
   *  figure's ink (Maya's cardigan edge, Dad's placket, Leo's and Sam's straps). */
  readonly face: readonly Polyline[];
  /** The one accent detail (drawn last, in the accent ink); several movements make one stroke. */
  readonly accent: readonly Polyline[];
  /** What the pose sits or lies on (a chair, a bed): graphite, drawn right after the body. */
  readonly prop?: readonly Polyline[];
  /** Hand wobble of the outline points, px (the drawing hand's own imperfection, constant per pose). */
  readonly wobble: number;
};

export type CharacterDesign = {
  readonly id: CharacterId;
  readonly name: string;
  readonly ink: Ink;
  /** Standing height in figure px (the design sheet). */
  readonly height: number;
  /** Nominal line width of the outline in sheet px at scale 1 (2.2 adults). */
  readonly lineWidth: number;
  readonly poses: Readonly<Partial<Record<PoseId, () => Figure>>>;
};

export const BODY_ID = 'body';
export const FACE_ID = 'face';
export const ACCENT_ID = 'accent';
export const PROP_ID = 'prop';
