// dog.ts — Biscuit, a scruffy terrier in one loop (BIBLE4 §4): nose, muzzle, two ears up, the back, a tail stroke,
// the hind leg and paw, the belly, the front leg and paw, the chest, back to the nose. Side view, facing left.
import type {XY} from '../paper';
import type {Figure, Polyline, PoseId, Segment} from './types';

const WOBBLE = 1.6;

type DogParams = {
  /** The spine as a line from the neck top (left) to the rump (right) at these points. */
  readonly backStart: XY;
  readonly backEnd: XY;
  readonly headC: XY;
  readonly headR: number;
  readonly hind: {readonly hock: XY; readonly paw: XY};
  readonly front: {readonly knee: XY; readonly paw: XY};
  readonly belly: number;
  readonly tailUp: number;
  readonly bust?: boolean;
};

const seg = (name: string, pts: readonly XY[]): Segment => ({name, pts});
const p = (x: number, y: number): XY => [x, y];

const dogOutline = (d: DogParams): readonly Segment[] => {
  const [hx, hy] = d.headC;
  const r = d.headR;
  const nose = p(hx - r * 1.55, hy + r * 0.35);
  const muzzle = [nose, p(hx - r * 1.35, hy - r * 0.05), p(hx - r * 0.9, hy - r * 0.55), p(hx - r * 0.45, hy - r * 0.95)];
  const ears = [p(hx - r * 0.25, hy - r * 1.05), p(hx - r * 0.1, hy - r * 1.9), p(hx + r * 0.3, hy - r * 1.15), p(hx + r * 0.6, hy - r * 1.1), p(hx + r * 0.95, hy - r * 1.85), p(hx + r * 1.15, hy - r * 1.0)];
  const neckTop = p(hx + r * 1.3, hy - r * 0.55);
  const bs = d.backStart;
  const be = d.backEnd;
  const back = [neckTop, bs, p(bs[0] + (be[0] - bs[0]) * 0.33, bs[1] + (be[1] - bs[1]) * 0.33 - 4), p(bs[0] + (be[0] - bs[0]) * 0.66, bs[1] + (be[1] - bs[1]) * 0.66 - 2), be];
  const tail = [p(be[0] + 6, be[1] - 6), p(be[0] + 12, be[1] - d.tailUp), p(be[0] + 20, be[1] - d.tailUp * 0.75), p(be[0] + 14, be[1] + 4)];
  const hock = d.hind.hock;
  const hp = d.hind.paw;
  const hind = [p(be[0] + 10, be[1] + 24), hock, p(hp[0] + 2, hp[1] - 6)];
  const hindPaw = [p(hp[0] + 9, hp[1]), p(hp[0] - 4, hp[1] + 2), p(hp[0] - 10, hp[1] - 4)];
  const bellyY = d.belly;
  const fk = d.front.knee;
  const fp = d.front.paw;
  const belly = [p(hock[0] - 12, hock[1] - 2), p(hock[0] - 18, bellyY), p((hock[0] + fk[0]) / 2, bellyY + 4), p(fk[0] + 10, bellyY - 2)];
  const front = [p(fk[0] + 8, fk[1]), p(fp[0] + 7, fp[1] - 6)];
  const frontPaw = [p(fp[0] + 9, fp[1] + 1), p(fp[0] - 6, fp[1] + 2), p(fp[0] - 9, fp[1] - 5)];
  const chest = [p(fk[0] - 8, fk[1]), p(fk[0] - 10, bellyY - 10), p(hx - r * 1.1, hy + r * 0.95), p(hx - r * 1.5, hy + r * 0.65)];
  if (d.bust) {
    return [
      seg('muzzle', muzzle), seg('ears', ears), seg('back', [neckTop, p(neckTop[0] + 10, neckTop[1] + 26)]), seg('tail', []), seg('hind', []),
      seg('hindPaw', []), seg('belly', []), seg('front', []), seg('frontPaw', []), seg('chest', [p(hx - r * 1.05, hy + r * 1.25), p(hx - r * 1.5, hy + r * 0.65)]),
    ];
  }
  return [
    seg('muzzle', muzzle), seg('ears', ears), seg('back', back), seg('tail', tail), seg('hind', hind), seg('hindPaw', hindPaw),
    seg('belly', belly), seg('front', front), seg('frontPaw', frontPaw), seg('chest', chest),
  ];
};

const dogFace = (d: DogParams): readonly Polyline[] => {
  const [hx, hy] = d.headC;
  const r = d.headR;
  return [
    {pts: [p(hx - r * 0.75, hy - r * 0.3), p(hx - r * 0.55, hy - r * 0.32)], smooth: 0},
    {pts: [p(hx - r * 1.62, hy + r * 0.25), p(hx - r * 1.5, hy + r * 0.18), p(hx - r * 1.45, hy + r * 0.35), p(hx - r * 1.6, hy + r * 0.4)], smooth: 1, closed: true},
  ];
};

/** The collar: a 50 x 8 arc around the neck. */
const collar = (d: DogParams): readonly Polyline[] => {
  const [hx, hy] = d.headC;
  const r = d.headR;
  const a = p(hx - r * 0.95, hy + r * 1.05);
  const b = p(hx + r * 1.15, hy - r * 0.05);
  return [{pts: [a, p((a[0] + b[0]) / 2 + 4, (a[1] + b[1]) / 2 + 8), b], smooth: 1}];
};

const dog = (d: DogParams): Figure => ({body: dogOutline(d), face: dogFace(d), accent: collar(d), wobble: WOBBLE});

const STAND: DogParams = {
  headC: [-40, -76], headR: 17, backStart: [-4, -74], backEnd: [56, -70], tailUp: 30,
  hind: {hock: [58, -34], paw: [60, -5]}, front: {knee: [-40, -40], paw: [-42, -5]}, belly: -42,
};
const SIT: DogParams = {
  headC: [-28, -88], headR: 17, backStart: [4, -80], backEnd: [44, -38], tailUp: 22,
  hind: {hock: [50, -16], paw: [34, -5]}, front: {knee: [-24, -48], paw: [-26, -5]}, belly: -36,
};
const LIE: DogParams = {
  headC: [-50, -44], headR: 17, backStart: [-10, -48], backEnd: [60, -40], tailUp: 14,
  hind: {hock: [62, -22], paw: [48, -5]}, front: {knee: [-44, -24], paw: [-54, -5]}, belly: -14,
};

export const dogPoses: Readonly<Partial<Record<PoseId, () => Figure>>> = {
  stand: () => dog(STAND),
  sit: () => dog(SIT),
  lie: () => dog(LIE),
  tree: () => dog({...STAND, bust: true}),
};
