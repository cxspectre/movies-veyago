// layout.ts — chapter 4's geometry in SHEET px (BIBLE4 5.4) and the card plan: 24 idea cards, the gate each one stops at,
// and one pure function from the clock to where a card is. Everything is deterministic (seeded hashes).
import {filterMachine as M} from '../../beats4';
import {regionOrigin} from '../../kit';
import {hash01} from './hand';

export const ORIGIN = regionOrigin('filterMachine');
export const toRegion = (x: number, y: number): [number, number] => [x - ORIGIN[0], y - ORIGIN[1]];

export const CX = 12600;
export const BODY = {x0: 12250, x1: 12950, y0: 2800, y1: 4300} as const;
export const HOPPER = {y0: 2540, wTop: 640, wBottom: 420} as const;
/** The lip of each gate; a card stops on the ledge just above it, and the gate's label hangs just below. */
export const LIP = [3000, 3260, 3520, 3780, 4040] as const;
export const REST = LIP.map((y) => y - 60);
export const PLAQUE = {x: 12220, w: 760, h: 68, below: 16} as const;
export const CARD = {w: 160, h: 100} as const;
export const PILE = {x: 12100, y: 4600} as const;
export const TRAY = {x: 12600, y: 4800, w: 560, front: 4870, back: 4770} as const;

const START_Y = 2150;
const G = 2200;
const EXIT_X = 12170;
const HOLD = 0.85;
const SLIDE = 0.45;
const BOUNCE = 0.2;

export type CardPlan = {
  readonly i: number;
  readonly release: number;
  /** 0-4: the gate that stops it. 5: the one that passes. */
  readonly gate: number;
  readonly jx: number;
  readonly tilt: number;
  readonly tint: number;
  readonly pileX: number;
  readonly pileY: number;
  readonly pileRot: number;
};

const stopOrder = (): number[] => {
  const pool = M.cards.stoppedPerGate.flatMap((n, g) => Array.from({length: n}, () => g));
  const out: number[] = [];
  let seed = 3;
  while (pool.length) {
    seed += 1;
    out.push(pool.splice(Math.floor(hash01(seed * 7.3) * pool.length), 1)[0] as number);
  }
  return out;
};

export const PLAN: readonly CardPlan[] = (() => {
  const order = stopOrder();
  const n = M.cards.count;
  return Array.from({length: n}, (_, i): CardPlan => {
    const last = i === n - 1;
    return {
      i,
      release: M.cards.first + (i * (M.cards.last - M.cards.first)) / (n - 1),
      gate: last ? 5 : (order[i] as number),
      jx: last ? 0 : (hash01(i + 1) - 0.5) * 70,
      tilt: (hash01(i + 40) - 0.5) * 8,
      tint: Math.floor(hash01(i + 90) * 3),
      pileX: PILE.x + (hash01(i + 150) - 0.5) * 230,
      pileY: PILE.y - Math.floor(i / 5) * 6 + (hash01(i + 200) - 0.5) * 36,
      pileRot: (hash01(i + 250) - 0.5) * 70,
    };
  });
})();

/** The last card lingers at each gate (it is the one that makes it): arrival times at the five gates, then the drop. */
const LAST = {arrive: [31.1, 31.9, 32.5, 33.1, 33.6] as const, drop: M.cardLands};

export type CardPose = {
  readonly visible: boolean;
  readonly x: number;
  readonly y: number;
  readonly rot: number;
  /** Seconds since the stamp hit, or -1. */
  readonly stamp: number;
  readonly scale: number;
};

const bounce = (u: number): number => -16 * Math.sin(Math.PI * u) * (1 - 0.4 * u);

/** Seconds (module-local) at which card `p` reaches the ledge of gate `k` (an ordinary card: constant 500 px/s, 0.2 s bounce per gate). */
export const arrival = (p: CardPlan, k: number): number =>
  p.gate === 5 && p.i === M.cards.count - 1 ? (LAST.arrive[k] as number) : p.release + ((REST[k] as number) - START_Y) / M.cards.fallPxPerSecond + BOUNCE * k;

/** When the stamp lands (stopped cards only). */
export const stampAt = (p: CardPlan): number => arrival(p, p.gate) + 0.25;

const pileLanding = (p: CardPlan): {start: number; land: number} => {
  const k = p.gate;
  const start = arrival(p, k) + HOLD + SLIDE;
  const fall = Math.sqrt((2 * (p.pileY - ((REST[k] as number) + 10))) / G);
  return {start, land: start + fall};
};

export const landingAt = (p: CardPlan): number => pileLanding(p).land;

export const cardPose = (p: CardPlan, t: number): CardPose => {
  const hidden: CardPose = {visible: false, x: 0, y: 0, rot: 0, stamp: -1, scale: 1};
  if (t < p.release) return hidden;
  const x = CX + p.jx;
  const final = p.i === M.cards.count - 1;
  const stops = p.gate < 5 ? p.gate : 5;
  // descent through the gates
  let y = START_Y;
  let clock = p.release;
  for (let k = 0; k <= stops && k < 5; k++) {
    const rest = REST[k] as number;
    const a = arrival(p, k);
    if (t < a) {
      const from = k === 0 ? {t: p.release, y: START_Y} : {t: arrival(p, k - 1) + BOUNCE, y: REST[k - 1] as number};
      const u = (t - from.t) / (a - from.t);
      y = from.y + (rest - from.y) * (final ? smoothFall(u) : u);
      return {visible: true, x, y, rot: p.tilt * (1 - u), stamp: -1, scale: 1};
    }
    clock = a;
    if (t < a + BOUNCE) return {visible: true, x, y: rest + bounce((t - a) / BOUNCE), rot: 0, stamp: -1, scale: 1};
    if (k === stops && p.gate < 5) {
      const s = stampAt(p);
      const st = t >= s ? t - s : -1;
      const sl = pileLanding(p);
      if (t < sl.start - SLIDE) return {visible: true, x, y: rest, rot: 0, stamp: st, scale: 1};
      if (t < sl.start) {
        const u = (t - (sl.start - SLIDE)) / SLIDE;
        const e = u * u;
        return {visible: true, x: x + (EXIT_X - x) * e, y: rest + 10 * e, rot: -10 * e, stamp: st, scale: 1};
      }
      if (t < sl.land) {
        const u = (t - sl.start) / (sl.land - sl.start);
        const tau = t - sl.start;
        const y0 = rest + 10;
        return {visible: true, x: EXIT_X + (p.pileX - EXIT_X) * u, y: y0 + 0.5 * G * tau * tau, rot: -10 + (p.pileRot + 10) * u, stamp: st, scale: 1};
      }
      const since = t - sl.land;
      const hop = since < 0.18 ? -10 * Math.sin((Math.PI * since) / 0.18) : 0;
      return {visible: true, x: p.pileX, y: p.pileY + hop, rot: p.pileRot, stamp: st, scale: 1};
    }
  }
  // the one that passes: out of the last gate, down through the slot, into the tray
  if (final) {
    const from = (LAST.arrive[4] as number) + BOUNCE;
    const y0 = REST[4] as number;
    if (t < LAST.drop) {
      const u = (t - from) / (LAST.drop - from);
      return {visible: true, x: CX, y: y0 + (TRAY.y - y0) * u * u, rot: 0, stamp: -1, scale: 1};
    }
    return {visible: true, x: CX, y: TRAY.y + (t < LAST.drop + 0.2 ? bounce((t - LAST.drop) / 0.2) * 0.5 : 0), rot: 0, stamp: -1, scale: 1};
  }
  void y;
  void clock;
  return hidden;
};

const smoothFall = (u: number): number => Math.min(1, Math.max(0, u));
