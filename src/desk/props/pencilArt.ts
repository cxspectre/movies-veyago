// pencilArt.ts — geometry of the three drawing tools (BIBLE §2.2), in millimetres, tip at the origin, body along +x.
// Pure data and path builders; Pencil.tsx and the hands draw from it.
import {DESK_PALETTE} from '../palette';

export type PencilKind = 'graphite' | 'accent' | 'fineliner' | 'finelinerUncapped';

export type PencilGeometry = {
  /** Overall length, mm, from the tip. */
  readonly length: number;
  /** Body diameter, mm. */
  readonly diameter: number;
  /** Where the fingers pinch it: mm from the tip along the axis. */
  readonly pinch: number;
};

export const PENCIL_GEOMETRY: Record<PencilKind, PencilGeometry> = {
  graphite: {length: 175, diameter: 7.2, pinch: 34},
  accent: {length: 172, diameter: 7.4, pinch: 34},
  fineliner: {length: 142, diameter: 9.5, pinch: 34},
  finelinerUncapped: {length: 150, diameter: 9.5, pinch: 28},
};

/** One painted facet or body band along the axis: x0..x1, y from -d/2 .. d/2 scaled by `top`/`bottom` (-1..1). */
export type Band = {readonly x0: number; readonly x1: number; readonly top: number; readonly bottom: number; readonly fill: string; readonly opacity?: number};
export type Poly = {readonly points: readonly (readonly [number, number])[]; readonly fill: string; readonly opacity?: number};
export type Line = {readonly x0: number; readonly y0: number; readonly x1: number; readonly y1: number; readonly stroke: string; readonly width: number; readonly opacity: number};

export type PencilArt = {
  readonly bands: readonly Band[];
  readonly polys: readonly Poly[];
  readonly lines: readonly Line[];
  /** The outer silhouette (for shadows), as [x, y] points, mm. */
  readonly silhouette: readonly (readonly [number, number])[];
};

const P = DESK_PALETTE.pencil;
const LEAD = 4;
const CONE = 16;
const FERRULE = 12;
const ERASER = 7;
const CAP = 42;
const NIB = 8;

/** A hexagonal pencil from above: three facets (the top one widest), lit from the upper left. */
const hexBands = (x0: number, x1: number, d: number, light: string, mid: string, dark: string): Band[] => [
  {x0, x1, top: -1, bottom: -0.5, fill: light},
  {x0, x1, top: -0.5, bottom: 0.5, fill: mid},
  {x0, x1, top: 0.5, bottom: 1, fill: dark},
];

/** A round body from above: a gradient across; drawn as four bands of increasing shade. */
const roundBands = (x0: number, x1: number, light: string, mid: string, dark: string): Band[] => [
  {x0, x1, top: -1, bottom: -0.55, fill: light},
  {x0, x1, top: -0.55, bottom: 0.1, fill: mid},
  {x0, x1, top: 0.1, bottom: 0.6, fill: dark, opacity: 0.85},
  {x0, x1, top: 0.6, bottom: 1, fill: dark},
];

const cone = (x0: number, x1: number, d0: number, d1: number, fill: string, opacity?: number): Poly => ({
  points: [
    [x0, -d0 / 2],
    [x1, -d1 / 2],
    [x1, d1 / 2],
    [x0, d0 / 2],
  ],
  fill,
  ...(opacity === undefined ? {} : {opacity}),
});

const graphiteArt = (kind: 'graphite' | 'accent'): PencilArt => {
  const g = PENCIL_GEOMETRY[kind];
  const d = g.diameter;
  const bodyStart = LEAD + CONE;
  const accent = kind === 'accent';
  const bodyEnd = accent ? g.length - 3 : g.length - FERRULE - ERASER;
  const woodDark = accent ? P.woodDark : P.woodDark;
  const bands: Band[] = accent
    ? roundBands(bodyStart, bodyEnd, P.accentLight, P.accentBody, P.accentDark)
    : hexBands(bodyStart, bodyEnd, d, P.bodyLight, P.body, P.bodyDark);
  const polys: Poly[] = [
    // Lead point, then the sharpened wood cone (its underside darker).
    cone(0, LEAD, 0.3, 2.2, accent ? P.accentBody : P.lead),
    cone(LEAD, bodyStart, 2.2, d, P.wood),
    {points: [[LEAD, 0.2], [bodyStart, d * 0.1], [bodyStart, d / 2], [LEAD, 1.1]], fill: woodDark, opacity: 0.8},
  ];
  const lines: Line[] = [
    // Specular along the lit top edge of a painted body.
    {x0: bodyStart + 2, y0: -d * 0.36, x1: bodyEnd - 2, y1: -d * 0.36, stroke: '#FFFFFF', width: 0.55, opacity: 0.45},
    // The faint seam where paint meets wood.
    {x0: bodyStart, y0: -d / 2, x1: bodyStart, y1: d / 2, stroke: '#3A2A14', width: 0.35, opacity: 0.35},
  ];
  if (accent) {
    polys.push(cone(bodyEnd, g.length, d, d * 0.9, P.accentDark));
  } else {
    const fx0 = bodyEnd;
    const fx1 = bodyEnd + FERRULE;
    bands.push(
      {x0: fx0, x1: fx1, top: -1, bottom: -0.45, fill: P.ferruleLight},
      {x0: fx0, x1: fx1, top: -0.45, bottom: 0.35, fill: P.ferrule},
      {x0: fx0, x1: fx1, top: 0.35, bottom: 1, fill: P.ferruleDark},
    );
    for (const rx of [fx0 + 2.2, fx0 + 4.2, fx1 - 4.2, fx1 - 2.2]) {
      lines.push({x0: rx, y0: -d / 2, x1: rx, y1: d / 2, stroke: '#5A5750', width: 0.5, opacity: 0.55});
    }
    bands.push(
      {x0: fx1, x1: g.length - 1.5, top: -1, bottom: -0.3, fill: P.eraser},
      {x0: fx1, x1: g.length - 1.5, top: -0.3, bottom: 1, fill: P.eraserDark},
    );
    polys.push({points: [[g.length - 1.5, -d / 2], [g.length, -d * 0.3], [g.length, d * 0.3], [g.length - 1.5, d / 2]], fill: P.eraserDark});
  }
  const silhouette: (readonly [number, number])[] = [[0, 0], [LEAD, -1.1], [bodyStart, -d / 2], [g.length - 1, -d / 2], [g.length, -d * 0.3], [g.length, d * 0.3], [g.length - 1, d / 2], [bodyStart, d / 2], [LEAD, 1.1]];
  return {bands, polys, lines, silhouette};
};

const finelinerArt = (capped: boolean): PencilArt => {
  const g = PENCIL_GEOMETRY[capped ? 'fineliner' : 'finelinerUncapped'];
  const d = g.diameter;
  const capD = d * 1.08;
  const bands: Band[] = [];
  const polys: Poly[] = [];
  const lines: Line[] = [];
  const silhouette: (readonly [number, number])[] = [];
  if (capped) {
    // The cap covers the tip: a rounded nose, the cap body with its clip, then the pen body.
    polys.push(cone(0, 4, capD * 0.45, capD, P.finelinerCap));
    bands.push(...roundBands(4, CAP, '#6B8BF2', P.finelinerCap, '#1E3C9E'));
    bands.push(...roundBands(CAP, g.length - 2, P.finelinerLight, P.fineliner, '#141416'));
    polys.push(cone(g.length - 2, g.length, d, d * 0.7, '#141416'));
    // Clip: a slim bar along the cap's top side.
    polys.push({points: [[8, -capD * 0.62], [CAP - 4, -capD * 0.62], [CAP - 4, -capD * 0.36], [8, -capD * 0.36]], fill: '#4466D6'});
    lines.push({x0: 6, y0: -capD * 0.3, x1: CAP - 2, y1: -capD * 0.3, stroke: '#FFFFFF', width: 0.5, opacity: 0.35});
    lines.push({x0: CAP, y0: -d / 2, x1: CAP, y1: d / 2, stroke: '#0E0E10', width: 0.5, opacity: 0.6});
    silhouette.push([0, -capD * 0.22], [4, -capD * 0.62], [CAP - 4, -capD * 0.62], [CAP, -d / 2], [g.length - 2, -d / 2], [g.length, -d * 0.35], [g.length, d * 0.35], [g.length - 2, d / 2], [4, capD / 2], [0, capD * 0.22]);
  } else {
    // Nib and collar, then the body, the cap posted on the back.
    polys.push(cone(0, 1.2, 0.4, 1.2, '#9A9A9E'));
    polys.push(cone(1.2, NIB, 1.2, 3.2, '#B8B8BC'));
    polys.push(cone(NIB, NIB + 4, 3.2, d, P.fineliner));
    bands.push(...roundBands(NIB + 4, g.length - CAP, P.finelinerLight, P.fineliner, '#141416'));
    bands.push(...roundBands(g.length - CAP, g.length - 4, '#6B8BF2', P.finelinerCap, '#1E3C9E'));
    polys.push(cone(g.length - 4, g.length, capD, capD * 0.45, P.finelinerCap));
    polys.push({points: [[g.length - CAP + 4, -capD * 0.62], [g.length - 8, -capD * 0.62], [g.length - 8, -capD * 0.36], [g.length - CAP + 4, -capD * 0.36]], fill: '#4466D6'});
    lines.push({x0: NIB + 6, y0: -d * 0.3, x1: g.length - CAP - 2, y1: -d * 0.3, stroke: '#FFFFFF', width: 0.5, opacity: 0.3});
    silhouette.push([0, 0], [NIB, -1.6], [NIB + 4, -d / 2], [g.length - CAP, -d / 2], [g.length - CAP + 4, -capD * 0.62], [g.length - 8, -capD * 0.62], [g.length, -capD * 0.22], [g.length, capD * 0.22], [g.length - 4, capD / 2], [NIB + 4, d / 2], [NIB, 1.6]);
  }
  return {bands, polys, lines, silhouette};
};

const ART: Record<PencilKind, PencilArt> = {
  graphite: graphiteArt('graphite'),
  accent: graphiteArt('accent'),
  fineliner: finelinerArt(true),
  finelinerUncapped: finelinerArt(false),
};

export const pencilArt = (kind: PencilKind): PencilArt => ART[kind];
