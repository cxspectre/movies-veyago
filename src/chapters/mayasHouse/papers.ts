// papers.ts — where each flying paper is at a module-local time: on the table, lifting, hovering, in the storm,
// frozen, flying to its tree node (and turning into the node's paper disc), or riding the branch out to Sam's plane.
// Pure and deterministic (no randomness): a function of the paper and the time.
import {mayasHouse as B} from '../../beats4';
import type {Point} from '../../sheet4';
import {CUTOUTS, FLIGHTS, LIFT_SECONDS, NODE_R, PLANE, REG_TO_PLANE, REGISTRATION, STORM, TABLE, TREE, TREE_FLIGHT, treeFlightStart, type Flight, type FlyingId} from './layout';

/** The registration rising out of the box is drawn behind the box front. */
export const BEHIND_THE_BOX = -2;

export type PaperPose = {
  /** Centre (sheet px). */
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
  /** In-plane rotation (deg) and the 3D flutter (deg about the paper's x and y axes). */
  readonly rot: number;
  readonly rx: number;
  readonly ry: number;
  readonly scale: number;
  /** Corner radius as a fraction of the short side: 0 = a sheet, 0.5 = a disc (the tree node). */
  readonly round: number;
  /** Opacity of the paper's own drawing (it fades as the paper becomes a node). */
  readonly art: number;
  /** Height above the paper for the lamp shadow (px). */
  readonly height: number;
  /** > 0 in front of Maya, < 0 behind her (the storm's far side); BEHIND_THE_BOX: behind the cutouts. */
  readonly depth: number;
  readonly visible: boolean;
};

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
const smooth = (u: number): number => {
  const k = clamp01(u);
  return k * k * (3 - 2 * k);
};
const easeInOutCubic = (u: number): number => {
  const k = clamp01(u);
  return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
};
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
/** A small deterministic per-paper number in [0, 1). */
const hash = (s: string, salt: number): number => {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
};

/** The standing card on the table (or, for the registration, inside the box). */
const restPose = (f: Flight): PaperPose => {
  if (f.id === 'registration') {
    const box = CUTOUTS.find((c) => c.id === 'box');
    const bx = box ? box.x + box.w / 2 : 5180;
    return {x: bx, y: TABLE.top - REGISTRATION.h / 2 + 30, w: REGISTRATION.w, h: REGISTRATION.h, rot: 0, rx: 0, ry: 0, scale: 1, round: 0, art: 1, height: 0, depth: -1, visible: false};
  }
  const c = CUTOUTS.find((k) => k.id === f.id);
  if (!c) throw new Error(`mayasHouse: no cutout for ${f.id}`);
  return {x: c.x + c.w / 2, y: TABLE.top - c.h / 2, w: c.w, h: c.h, rot: 0, rx: c.lean, ry: 0, scale: 1, round: 0, art: 1, height: 2, depth: 1, visible: true};
};

const flutter = (id: string, t: number, amount: number): {rx: number; ry: number; bob: number; sway: number} => {
  const p = hash(id, 1) * Math.PI * 2;
  const q = hash(id, 2) * Math.PI * 2;
  return {
    rx: amount * 16 * Math.sin(t * 2.3 + p),
    ry: amount * 22 * Math.sin(t * 1.7 + q),
    bob: amount * 9 * Math.sin(t * 1.3 + q),
    sway: amount * 5 * Math.sin(t * 0.9 + p),
  };
};

/** Lift from the table (or out of the box) to the hover spot, along an arc, fluttering. */
const liftPose = (f: Flight, t: number): PaperPose => {
  const rest = restPose(f);
  const u = (t - f.lift) / LIFT_SECONDS;
  const e = easeInOutCubic(u);
  const fl = flutter(f.id, t, Math.sin(Math.PI * clamp01(u)) + (u >= 1 ? 0.35 : 0));
  // the registration first rises straight out of the box (the first 30%), then flies
  const outOfBox = f.id === 'registration' ? smooth(u / 0.3) : 1;
  const start: Point = f.id === 'registration' ? [rest.x, lerp(rest.y, rest.y - REGISTRATION.h - 20, outOfBox)] : [rest.x, rest.y];
  const fly = f.id === 'registration' ? smooth((u - 0.25) / 0.75) : e;
  const arc = -80 * Math.sin(Math.PI * fly);
  return {
    ...rest,
    x: lerp(start[0], f.hover[0], fly) + fl.sway,
    y: lerp(start[1], f.hover[1], fly) + arc + fl.bob,
    rot: lerp(0, f.tilt, fly) + fl.sway * 0.6,
    rx: lerp(rest.rx, 0, e) + fl.rx,
    ry: fl.ry,
    height: lerp(rest.height, 40, e),
    depth: f.id === 'registration' && u < 0.3 ? BEHIND_THE_BOX : 1,
    visible: true,
  };
};

const STORM_SECONDS = B.storm.to - B.storm.from;
/** Turns completed since the storm began: the speed ramps linearly from revPerSecond[0] to [1]. */
const stormTurns = (tau: number): number => {
  const [r0, r1] = B.storm.revPerSecond;
  return r0 * tau + ((r1 - r0) * tau * tau) / (2 * STORM_SECONDS);
};

const stormPose = (f: Flight, t: number): PaperPose => {
  const hover = liftPose(f, t);
  const tau = Math.max(0, Math.min(t, B.storm.to) - B.storm.from);
  const k = FLIGHTS.indexOf(f);
  const theta0 = (k / FLIGHTS.length) * Math.PI * 2 + 0.4;
  const theta = theta0 + stormTurns(tau) * Math.PI * 2;
  const [ra, rb] = B.storm.radius;
  const r = lerp(ra, rb, tau / STORM_SECONDS) * (1 + 0.08 * Math.sin(k * 1.9));
  const ox = STORM.centre[0] + r * Math.cos(theta);
  const oy = STORM.centre[1] + r * STORM.squash * Math.sin(theta) + 30 * Math.sin(theta * 2 + k);
  const depth = Math.sin(theta);
  const fl = flutter(f.id, t, 1 + tau / 3);
  const blend = smooth(tau / STORM.blendIn);
  return {
    ...hover,
    x: lerp(hover.x, ox, blend),
    y: lerp(hover.y, oy, blend),
    rot: lerp(hover.rot, f.tilt + tau * (k % 2 === 0 ? 70 : -60) + fl.sway * 2, blend),
    rx: lerp(hover.rx, fl.rx * 1.6, blend),
    ry: lerp(hover.ry, fl.ry * 1.4, blend),
    scale: lerp(1, 1 + 0.14 * depth, blend),
    height: lerp(hover.height, 50 + 20 * depth, blend),
    depth: blend < 0.5 ? 1 : depth,
  };
};

const nodeOf = (f: Flight) => TREE.find((n) => n.id === f.to);

/** Fly from the frozen storm pose to the node, turning into a paper disc (or a kennel card for Biscuit). */
const treePose = (f: Flight, t: number): PaperPose => {
  const frozen = stormPose(f, B.freeze);
  const node = nodeOf(f);
  if (!node) return frozen;
  const start = treeFlightStart(node.id);
  const u = (t - start) / TREE_FLIGHT;
  if (u <= 0) return frozen;
  const e = easeInOutCubic(u); // a keynote move
  const morph = smooth((u - 0.35) / 0.65);
  const kennel = node.id === 'biscuit';
  const size = kennel ? {w: NODE_R * 1.9, h: NODE_R * 1.55} : {w: NODE_R * 2, h: NODE_R * 2};
  const arc = -120 * Math.sin(Math.PI * e);
  return {
    x: lerp(frozen.x, node.at[0], e),
    y: lerp(frozen.y, node.at[1], e) + arc,
    w: lerp(frozen.w, size.w, morph),
    h: lerp(frozen.h, size.h, morph),
    rot: lerp(frozen.rot % 360, 0, e),
    rx: lerp(frozen.rx, 0, e),
    ry: lerp(frozen.ry, 0, e),
    scale: lerp(frozen.scale, 1, e),
    round: kennel ? 0.12 * morph : 0.5 * morph,
    art: 1 - morph,
    height: lerp(frozen.height, 6, e),
    depth: 1,
    visible: true,
  };
};

/** The registration: frozen with the others, then out along the dotted branch to where it folds into the plane. */
const planePose = (f: Flight, t: number): PaperPose => {
  const frozen = stormPose(f, B.freeze);
  const u = (t - REG_TO_PLANE.from) / (REG_TO_PLANE.to - REG_TO_PLANE.from);
  if (u <= 0) return frozen;
  const e = easeInOutCubic(u);
  const fl = flutter(f.id, t, Math.sin(Math.PI * clamp01(u)));
  return {
    ...frozen,
    x: lerp(frozen.x, PLANE.at[0], e) + fl.sway,
    y: lerp(frozen.y, PLANE.at[1], e) - 260 * Math.sin(Math.PI * e) + fl.bob,
    rot: lerp(frozen.rot % 360, PLANE.heading, e),
    rx: lerp(frozen.rx, 0, e) + fl.rx * 0.5,
    ry: lerp(frozen.ry, 0, e) + fl.ry * 0.5,
    scale: lerp(frozen.scale, PLANE.scale, e),
    height: lerp(frozen.height, 14, e),
    depth: 1,
    visible: t < B.plane,
  };
};

export const flightOf = (id: FlyingId): Flight => {
  const f = FLIGHTS.find((k) => k.id === id);
  if (!f) throw new Error(`mayasHouse: no flight ${id}`);
  return f;
};

/** The pose of a flying paper, or null while it still stands on the table (its pop-up shows it then). */
export const paperPose = (id: FlyingId, t: number): PaperPose | null => {
  const f = flightOf(id);
  if (t < f.lift) return null;
  if (t < B.storm.from) return liftPose(f, t);
  if (t < B.freeze) return stormPose(f, t);
  return f.to === 'plane' ? planePose(f, t) : treePose(f, t);
};
