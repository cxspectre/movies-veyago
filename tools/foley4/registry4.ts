// registry4.ts — the v4 hits (SfxNameV4 in src/audio/cues.ts) mapped to their recipes. The v1 registry
// (tools/foley/sounds/registry.ts) spreads this in, so renderCues and renderHit accept every name; the
// mapped type refuses a build if a v4 name has no recipe.

import type {SfxNameV4} from '../../src/audio/cues';
import type {SfxDef} from '../foley/sounds/registry';
import {fold, crumple, scissors} from './sounds/paper4';
import {odometer, padlock, pin, stamp, string} from './sounds/desk4';
import {marbleRun, plane, rocket, train} from './sounds/toys4';

export const SFX4: {readonly [K in SfxNameV4]: SfxDef} = {
  fold: {family: 'paper', description: 'A paper panel folds up on its crease: air push, the crease buckling faster and faster, a soft card snap at the stop. dur = the fold (several panels over ~1.2 s).', render: (r, p, o) => fold(r, p, o.dur)},
  scissors: {family: 'paper', description: 'Steel blades through paper: fibres shearing as the blades close, pivot rub, faint blade ring, the heels meeting (sync). One snip; dur = a run of snips.', render: (r, p, o) => scissors(r, p, o.dur)},
  crumple: {family: 'paper', description: 'A sheet crushed into a ball: power-law clicks following the squeezing hands, rising in pitch as the ball stiffens; palms and air pockets under it. dur = the crush.', render: (r, p, o) => crumple(r, p, o.dur)},
  stamp: {family: 'desk', description: 'A rubber stamp on card: soft 5 ms rubber thud into desk and card, the die rocking flat, ink cavities squelching, then the tacky lift and a small suction pop.', render: (r, p) => stamp(r, p)},
  string: {family: 'paper', description: 'A thread drawn taut: fibre friction through the fingers, the thread rising in pitch with tension, a quiet twang and a cork knock when it goes tight (at dur).', render: (r, p, o) => string(r, p, o.dur)},
  pin: {family: 'desk', description: 'A push pin through a card into cork: thumb, the point piercing paper, cork cells crunching, the head seating (sync) with a damped low tok. dur = a row of pins.', render: (r, p, o) => pin(r, p, o.dur)},
  odometer: {family: 'metal', description: 'Digit wheels rolling: detent ticks into wheel and housing, a carry every tenth tick, faint gear purr. dur = the roll, rate = ticks per second (default 8).', render: (r, p, o) => odometer(r, p, o.dur, o.rate)},
  train: {family: 'toy', description: 'A small tin train on a card track: four axles clacking over the joints, the tin shell rattling, wheel rumble; accelerates in, crosses left to right, slows. dur = the run.', render: (r, p, o) => train(r, p, o.dur)},
  plane: {family: 'toy', description: 'A paper plane gliding past at 30 cm: edge-air bands with an exaggerated doppler sweep, 1/r level, distance damping, trailing-edge flutter, panned across. dur = the pass.', render: (r, p, o) => plane(r, p, o.dur)},
  rocket: {family: 'toy', description: 'A paper rocket launched by air: the launch tube\'s falling air-column "phoomp", a low puff, the tube sliding off, fins crinkling, a fading fluttering wake. No fire.', render: (r, p) => rocket(r, p)},
  marble_run: {family: 'toy', description: 'A glass marble through a card run: rolling rumble rising down each ramp, the gate flap knocked, a 2-4 cm drop and geometric bounces, the flap swinging back. Continuous; dur = the run.', render: (r, p, o) => marbleRun(r, p, o.dur)},
  padlock: {family: 'metal', description: 'A small padlock snapped shut in the hand: shackle slide, a faint pre-click on the bolt, the snap (sync) of bolt and shackle, finger-damped ring, the thumb\'s soft stop.', render: (r, p) => padlock(r, p)},
};
