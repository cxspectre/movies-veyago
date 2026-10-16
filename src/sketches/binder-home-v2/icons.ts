// icons.ts — the small doodles drawn inside real glyph boxes (sketch px in, path data out). Each is a few quick
// marks, as a designer would rough an icon at this size: never a copy of the system symbol.
import {handCircle, handLine, handPath, handPolyline, handTick, type XY} from '../../paper';
import type {SketchRect} from './screen';

const cx = (r: SketchRect): number => r.x + r.w / 2;
const cy = (r: SketchRect): number => r.y + r.h / 2;

/** A closed rounded-rect region for hatching (plain geometry: the hatch flicks supply the hand). */
export const roundRectRegion = (r: SketchRect, radius: number): string => {
  const rad = Math.min(radius, r.w / 2, r.h / 2);
  const {x, y, w, h} = r;
  return `M ${x + rad} ${y} L ${x + w - rad} ${y} A ${rad} ${rad} 0 0 1 ${x + w} ${y + rad} L ${x + w} ${y + h - rad} A ${rad} ${rad} 0 0 1 ${x + w - rad} ${y + h} L ${x + rad} ${y + h} A ${rad} ${rad} 0 0 1 ${x} ${y + h - rad} L ${x} ${y + rad} A ${rad} ${rad} 0 0 1 ${x + rad} ${y} Z`;
};

/** A closed ellipse region for hatching. */
export const ellipseRegion = (r: SketchRect): string => {
  const rx = r.w / 2;
  const ry = r.h / 2;
  return `M ${cx(r) - rx} ${cy(r)} A ${rx} ${ry} 0 1 1 ${cx(r) + rx} ${cy(r)} A ${rx} ${ry} 0 1 1 ${cx(r) - rx} ${cy(r)} Z`;
};

/** Four signal bars rising left to right, one pencil movement each. */
export const signalBars = (r: SketchRect, seed: number): string =>
  [0, 1, 2, 3]
    .map((i) => {
      const x = r.x + (r.w * (i + 0.5)) / 4;
      const top = r.y + r.h * (1 - (0.4 + i * 0.2));
      return handLine(x, r.y + r.h, x, top, seed + i, {overshoot: 0, bow: 0, wobble: 0.15});
    })
    .join(' ');

/** Three nested Wi-Fi arcs. */
export const wifiArcs = (r: SketchRect, seed: number): string => {
  const ox = cx(r);
  const oy = r.y + r.h;
  const arcAt = (rad: number, k: number): string =>
    handPath(
      [-138, -114, -90, -66, -42].map((deg): XY => [ox + Math.cos((deg * Math.PI) / 180) * rad, oy + Math.sin((deg * Math.PI) / 180) * rad]),
      seed + k,
      {wobble: 0.15},
    );
  return `${arcAt(r.w * 0.72, 1)} ${arcAt(r.w * 0.46, 2)} ${arcAt(r.w * 0.2, 4)}`;
};

/** A battery: body box and the little nub on its right. */
export const battery = (r: SketchRect, seed: number): string => {
  const nub = r.w * 0.1;
  const body = {x: r.x, y: r.y + r.h * 0.12, w: r.w - nub * 1.4, h: r.h * 0.76};
  const box = handPolyline(
    [
      [body.x + 1.5, body.y],
      [body.x + body.w, body.y],
      [body.x + body.w, body.y + body.h],
      [body.x, body.y + body.h],
      [body.x, body.y],
      [body.x + 4, body.y - 0.3],
    ],
    seed,
    0.25,
  );
  const tip = handLine(r.x + r.w - nub * 0.2, cy(r) - body.h * 0.22, r.x + r.w - nub * 0.2, cy(r) + body.h * 0.22, seed + 5, {overshoot: 0, bow: 0});
  return `${box} ${tip}`;
};

/** A chevron pointing down (the binder switcher). */
export const chevronDown = (r: SketchRect, seed: number): string =>
  handPolyline([[r.x, r.y], [cx(r), r.y + r.h], [r.x + r.w, r.y]], seed, 0.25);

/** A chevron pointing right (the "1 more in Deadlines" link). */
export const chevronRight = (r: SketchRect, seed: number): string =>
  handPolyline([[r.x, r.y], [r.x + r.w, cy(r)], [r.x, r.y + r.h]], seed, 0.2);

/** A magnifier: a lens and its handle. */
export const magnifier = (r: SketchRect, seed: number): string => {
  const lens = r.w * 0.36;
  const lx = r.x + lens * 1.05;
  const ly = r.y + lens * 1.05;
  const handle = handLine(lx + lens * 0.75, ly + lens * 0.75, r.x + r.w, r.y + r.h, seed + 2, {overshoot: 0, bow: 0});
  return `${handCircle(lx, ly, lens, lens, seed, {overlap: 0.08, wobble: 0.2})} ${handle}`;
};

/** A plus. */
export const plus = (r: SketchRect, seed: number): string =>
  `${handLine(r.x, cy(r), r.x + r.w, cy(r), seed, {overshoot: 0.5, bow: 0})} ${handLine(cx(r), r.y, cx(r), r.y + r.h, seed + 1, {overshoot: 0.5, bow: 0})}`;

/** The emergency mark: a six-armed asterisk (three crossing strokes; never a cross). */
export const asterisk = (r: SketchRect, seed: number): string => {
  const rad = Math.min(r.w, r.h) / 2;
  return [90, 30, -30]
    .map((deg, i) => {
      const a = (deg * Math.PI) / 180;
      const dx = Math.cos(a) * rad;
      const dy = Math.sin(a) * rad;
      return handLine(cx(r) - dx, cy(r) - dy, cx(r) + dx, cy(r) + dy, seed + i, {overshoot: 0.3, bow: 0});
    })
    .join(' ');
};

/** Two people: two heads with their shoulders, the second a little behind. */
export const people = (r: SketchRect, seed: number): string => {
  const person = (x: number, w: number, k: number): string => {
    const head = w * 0.22;
    const hy = r.y + head * 1.1;
    const shoulders = handPath(
      [
        [x - w * 0.46, r.y + r.h],
        [x - w * 0.36, r.y + r.h * 0.66],
        [x, r.y + r.h * 0.55],
        [x + w * 0.36, r.y + r.h * 0.66],
        [x + w * 0.46, r.y + r.h],
      ],
      seed + k,
      {wobble: 0.15},
    );
    return `${handCircle(x, hy, head, head, seed + k + 1, {overlap: 0.05, wobble: 0.15})} ${shoulders}`;
  };
  return `${person(r.x + r.w * 0.3, r.w * 0.55, 0)} ${person(r.x + r.w * 0.72, r.w * 0.5, 4)}`;
};

/** A tray with an arrow coming up out of it (Packets). */
export const trayUp = (r: SketchRect, seed: number): string => {
  const trayTop = r.y + r.h * 0.5;
  const tray = handPolyline([[r.x, trayTop], [r.x, r.y + r.h], [r.x + r.w, r.y + r.h], [r.x + r.w, trayTop]], seed, 0.2);
  const shaft = handLine(cx(r), r.y + r.h * 0.72, cx(r), r.y, seed + 1, {overshoot: 0, bow: 0});
  const head = handPolyline([[cx(r) - r.w * 0.22, r.y + r.h * 0.22], [cx(r), r.y], [cx(r) + r.w * 0.22, r.y + r.h * 0.22]], seed + 2, 0.15);
  return `${tray} ${shaft} ${head}`;
};

/** Three dots in a row (More). */
export const threeDots = (r: SketchRect, seed: number): string =>
  [0.12, 0.5, 0.88].map((t, i) => handCircle(r.x + r.w * t, cy(r), 0.9, 0.9, seed + i, {overlap: 0.3, wobble: 0.1})).join(' ');

/** A small bound book (Binder). */
export const book = (r: SketchRect, seed: number): string => {
  const box = handPolyline([[r.x + r.w * 0.04, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x + r.w * 0.04, r.y + r.h], [r.x + r.w * 0.04, r.y]], seed, 0.2);
  const spine = handLine(r.x + r.w * 0.24, r.y + 0.5, r.x + r.w * 0.28, r.y + r.h - 0.5, seed + 1, {overshoot: 0, bow: 0});
  return `${box} ${spine}`;
};

/** A page with a folded corner and two lines (Documents). */
export const page = (r: SketchRect, seed: number): string => {
  const fold = r.w * 0.32;
  const outline = handPolyline([[r.x + r.w - fold, r.y], [r.x, r.y], [r.x, r.y + r.h], [r.x + r.w, r.y + r.h], [r.x + r.w, r.y + fold], [r.x + r.w - fold, r.y]], seed, 0.2);
  const lines = [0.58, 0.78].map((t, i) => handLine(r.x + r.w * 0.22, r.y + r.h * t, r.x + r.w * 0.78, r.y + r.h * t, seed + 2 + i, {overshoot: 0, bow: 0})).join(' ');
  return `${outline} ${lines}`;
};

/** A calendar: a box with a header rule and two rings on top (Deadlines). */
export const calendar = (r: SketchRect, seed: number): string => {
  const top = r.y + r.h * 0.14;
  const box = handPolyline([[r.x + 1, top], [r.x + r.w, top], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h], [r.x, top], [r.x + 3, top]], seed, 0.2);
  const rule = handLine(r.x, r.y + r.h * 0.4, r.x + r.w, r.y + r.h * 0.4, seed + 1, {overshoot: 0, bow: 0});
  const rings = [0.3, 0.7].map((t, i) => handLine(r.x + r.w * t, r.y, r.x + r.w * t, top + r.h * 0.1, seed + 3 + i, {overshoot: 0, bow: 0})).join(' ');
  return `${box} ${rule} ${rings}`;
};

/** A tiny circular-arrow mark (the "Still right?" tile) and a little envelope (the mail tile). */
export const loopMark = (r: SketchRect, seed: number): string => handCircle(cx(r), cy(r), r.w * 0.26, r.h * 0.26, seed, {overlap: -0.12, wobble: 0.15});
export const envelope = (r: SketchRect, seed: number): string => {
  const e = {x: r.x + r.w * 0.22, y: r.y + r.h * 0.3, w: r.w * 0.56, h: r.h * 0.42};
  return handPolyline([[e.x, e.y], [e.x + e.w, e.y], [e.x + e.w, e.y + e.h], [e.x, e.y + e.h], [e.x, e.y], [e.x + e.w / 2, e.y + e.h * 0.55], [e.x + e.w, e.y]], seed, 0.15);
};

/** The Done button's check, its knee placed so the mark fills the real check's box. */
export const doneCheck = (r: SketchRect, seed: number): string => {
  const size = r.h;
  return handTick(r.x + size * 0.36, r.y + r.h - size * 0.02, size, seed);
};
