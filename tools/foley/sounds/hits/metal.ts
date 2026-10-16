// metal.ts — keys and coins: hard, small, lightly damped bodies that ring until they come to rest.
//
// Metal rings for a long time in air, but once an object lies flat on paper the contact damps it hard.
// We model both: modes ring freely between bounces, then a settle envelope (T60 ~ 80-90 ms) takes over.

import type {Contact, Mode} from '../../core/modal';
import {DISC_RATIOS, modesFromRatios} from '../../core/modal';
import {decayAfter} from '../../core/envelope';
import type {Rng} from '../../core/rng';
import {mixMono, multiply} from '../../core/signal';
import type {Voice} from '../../core/voice';
import {deskPan, DESK_MODES, lengthOf, relativeTo, struck} from '../kit';

/** Bounces with restitution e: each flight time and impulse shrink by e (a dropped object settling). */
function bounces(first: number, interval: number, restitution: number, count: number, tau: number, scale = 1): Contact[] {
  return Array.from({length: count}, (_, k) => {
    const at = first + (k === 0 ? 0 : (interval * (1 - Math.pow(restitution, k))) / (1 - restitution));
    return {at, impulse: scale * Math.pow(restitution, k), tau};
  });
}

/**
 * A 50 mm brass key: a flat, notched bar. Bending modes (beam ratios) mixed with torsion modes
 * (x1.62, x3.9) from the bit and the bow: dense, inharmonic, bright.
 */
function keyModes(f0: number): Mode[] {
  return modesFromRatios(f0, [1, 1.62, 2.757, 3.9, 5.404], [0.3, 0.22, 0.18, 0.12, 0.1], [1, 0.5, 0.7, 0.35, 0.4]);
}

/**
 * key_clink — a small bunch (two keys on a ring) set down from a couple of cm: the first key bounces
 * 3-4 times (e = 0.35-0.5), the second key hits it ~12 ms later and chatters, then both lie damped.
 */
export function keyClink(rng: Rng, pan?: number): Voice {
  const e = rng.uniform(0.35, 0.5);
  const count = rng.int(3, 4);
  const interval = rng.uniform(0.03, 0.045);
  const a = bounces(0, interval, e, count, 0.0001);
  const b = bounces(0.012, interval * 0.8, e, count - 1, 0.0001, 0.4);
  const last = Math.max(a[a.length - 1]?.at ?? 0, b[b.length - 1]?.at ?? 0);
  const len = last + 0.45;
  const n = lengthOf(len);
  const settle = decayAfter(n, last + 0.01, 0.08);
  const keyA = multiply(struck(len, a, keyModes(rng.uniform(2300, 2600)), rng.fork('a')), settle);
  const keyB = multiply(struck(len, b, keyModes(rng.uniform(3000, 3300)), rng.fork('b')), settle);
  const desk = struck(len, a, DESK_MODES, rng.fork('desk'));
  const mono = mixMono(n, [{sig: keyA}, {sig: relativeTo(keyB, keyA, 0.5)}, {sig: relativeTo(desk, keyA, 0.15)}]);
  return {mono, pan: deskPan(rng.fork('pan'), pan, 0.2), space: 'desk', syncSample: 0};
}

/**
 * coin_clink — a coin set onto a coin lying on the desk. Thin-disc modes (2,0), (0,1), (3,0), (1,1),
 * (4,0) at 1 : 1.73 : 2.33 : 3.91 : 4.11 from ~4.3 kHz. The falling coin rings, chatters as it tilts flat
 * (two smaller contacts), then is damped; the lying coin is damped throughout.
 */
export function coinClink(rng: Rng, pan?: number): Voice {
  const contacts: Contact[] = [
    {at: 0, impulse: 1, tau: 0.00006},
    {at: rng.uniform(0.015, 0.022), impulse: 0.35, tau: 0.00006},
    {at: rng.uniform(0.028, 0.04), impulse: 0.15, tau: 0.00007},
    {at: rng.uniform(0.045, 0.055), impulse: 0.08, tau: 0.00008},
  ];
  const len = 0.5;
  const n = lengthOf(len);
  const falling = modesFromRatios(rng.uniform(4100, 4500), DISC_RATIOS, [0.5, 0.35, 0.3, 0.2, 0.2], [1, 0.6, 0.5, 0.3, 0.25]);
  const lying = modesFromRatios(rng.uniform(4700, 5100), DISC_RATIOS, [0.06, 0.05, 0.04, 0.03, 0.03], [0.8, 0.5, 0.4, 0.2, 0.2]);
  const coinA = multiply(struck(len, contacts, falling, rng.fork('a')), decayAfter(n, 0.06, 0.15));
  const coinB = struck(len, contacts, lying, rng.fork('b'));
  const desk = struck(len, contacts, DESK_MODES, rng.fork('desk'));
  const mono = mixMono(n, [{sig: coinA}, {sig: relativeTo(coinB, coinA, 0.6)}, {sig: relativeTo(desk, coinA, 0.1)}]);
  return {mono, pan: deskPan(rng.fork('pan'), pan, 0.2), space: 'desk', syncSample: 0};
}
