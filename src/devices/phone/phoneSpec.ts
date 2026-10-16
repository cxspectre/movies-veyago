// phoneSpec.ts — the generic phone's proportions, in DEVICE UNITS (the body is 1 unit tall).
// Modelled on a 6.3-inch class phone (150 x 71.9 x 8.75 mm) with the screen at the exact aspect of the captures
// (1206 x 2622 px = 402 x 874 pt). Un-badged: no logo, no camera detail beyond a soft plateau.
import layout from '../../../public/footage/binder-home.layout.json';
import type {RoundedRect} from '../../glass/edgeLightPath';

const MM_PER_UNIT = 150;
const mm = (v: number): number => v / MM_PER_UNIT;

export const SCREEN_PT = {width: layout.screen.wPt, height: layout.screen.hPt} as const;
export const SCREEN_PX = {width: layout.screen.wPx, height: layout.screen.hPx} as const;
const SCREEN_ASPECT = SCREEN_PX.width / SCREEN_PX.height;
/** Display corner radius in points (a 6.3-inch class display). */
const SCREEN_RADIUS_PT = 62;

const BODY_W = mm(71.9);
const SIDE_BORDER = mm(2.4);
const SCREEN_W = BODY_W - 2 * SIDE_BORDER;
const SCREEN_H = SCREEN_W / SCREEN_ASPECT;

export const PHONE = {
  outline: {width: BODY_W, height: 1, radius: mm(12.6)} as RoundedRect,
  depth: mm(8.75),
  frontEdge: mm(1.7),
  backEdge: mm(1.9),
  screen: {
    width: SCREEN_W,
    height: SCREEN_H,
    radius: (SCREEN_RADIUS_PT / SCREEN_PT.width) * SCREEN_W,
    /** Screen centre, y up, device units. */
    centreY: 0,
  },
  /** Dynamic Island in screen points (iOS standard geometry for the capture device, from the layout file). */
  islandPt: layout.dynamicIsland,
  /** Buttons: [from, to] as fractions of the height from the TOP; protrusion and thickness in device units. */
  buttons: {
    left: [
      [0.178, 0.214],
      [0.262, 0.33],
      [0.355, 0.423],
    ] as const,
    right: [[0.275, 0.392]] as const,
    cameraControl: [0.59, 0.655] as const,
    protrusion: mm(0.55),
    thickness: mm(2.3),
  },
  plateau: {inset: mm(3.2), height: mm(31), radius: mm(9.5), rise: mm(1.1), fromTop: mm(3.2)},
} as const;

/** A screen point (x right, y down, in the capture's 402 x 874 pt) -> device-local coordinates (y up). */
export const screenPointToLocal = (xPt: number, yPt: number): [number, number] => [
  (xPt / SCREEN_PT.width - 0.5) * PHONE.screen.width,
  PHONE.screen.centreY + (0.5 - yPt / SCREEN_PT.height) * PHONE.screen.height,
];

/** The emergency button (the dock's first circle) on the binder home, in screen points (centre and diameter). */
const dock = layout.elements.find((e) => e.kind === 'dockButton');
const DOCK_CIRCLE_PT = 52;
export const DOCK_EMERGENCY_PT = {
  x: (dock?.frame.x ?? 20) + (dock?.frame.w ?? 69.3) / 2,
  y: (dock?.frame.y ?? 610.7) + DOCK_CIRCLE_PT / 2,
  diameter: DOCK_CIRCLE_PT,
} as const;
