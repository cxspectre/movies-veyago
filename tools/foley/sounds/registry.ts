// registry.ts — every SfxName of src/audio/cues.ts mapped to its recipe. The mapped type makes the
// compiler refuse a build if the integrator adds a name to SfxName without a recipe here.

import type {SfxName, SfxNameV1} from '../../../src/audio/cues';
import {SFX4} from '../../foley4/registry4';
import type {Rng} from '../core/rng';
import type {Voice} from '../core/voice';
import {cardFlip, bubblePop, snap, titleIn, walletSlide} from './hits/glass';
import {coinClink, keyClink} from './hits/metal';
import {paperDrop, stickyPress, stickySmooth, tick} from './hits/paper';
import {cupDown, penCap, phoneDown} from './hits/vessel';
import {pencilClick, pencilDown, rulerTap} from './hits/wood';

export type Family = 'drawing' | 'paper' | 'desk' | 'metal' | 'glass' | 'room' | 'toy';
/** dur and rate are read by the v4 recipes only (tools/foley4); the v1 recipes ignore them. */
export type HitOptions = {readonly snapHz?: number; readonly dur?: number; readonly rate?: number};
export type SfxDef = {
  readonly family: Family;
  readonly description: string;
  readonly render: (rng: Rng, pan: number | undefined, opts: HitOptions) => Voice;
};

const SFX_V1: {readonly [K in SfxNameV1]: SfxDef} = {
  tick: {family: 'drawing', description: 'Graphite tip taps the sheet, then a quick check-mark flick that lifts off.', render: (r, p) => tick(r, p)},
  cup_down: {family: 'desk', description: 'Stoneware mug with coffee set down on paper over wood: heel, then base; ceramic ring with handle doublets, desk weight.', render: (r, p) => cupDown(r, p)},
  sticky_press: {family: 'paper', description: 'Thumb presses a sticky note: soft skin contact, air puff, adhesive crackle, small roll.', render: (r, p) => stickyPress(r, p)},
  sticky_smooth: {family: 'paper', description: 'Two fingertip swipes smoothing the note flat; the curled edge crinkles first.', render: (r, p) => stickySmooth(r, p)},
  pencil_down: {family: 'desk', description: 'Hex cedar pencil set down: one end, the other, a 3-5 facet roll, a rock to rest.', render: (r, p) => pencilDown(r, p)},
  pencil_click: {family: 'desk', description: 'The last sound of the film: pencil placed with intent, tip then body (sync), finger-damped, desk weight.', render: (r, p) => pencilClick(r, p)},
  pen_cap: {family: 'desk', description: 'Cap pushed onto a fineliner: plastic slide, detent ridge jumps, cap seats (sync).', render: (r, p) => penCap(r, p)},
  phone_down: {family: 'desk', description: 'Phone laid on the sheet: aluminium corner "tk", then the flat back lands soft and weighty (sync).', render: (r, p) => phoneDown(r, p)},
  snap: {family: 'glass', description: 'A sketched element snaps into its interface: soft tuned glass tick (A5 by default), lands on the beat.', render: (r, p, o) => snap(r, p, o.snapHz)},
  card_flip: {family: 'glass', description: 'Card flips (two air flaps) and lands softly on the Watch (sync = landing).', render: (r, p) => cardFlip(r, p)},
  wallet_slide: {family: 'glass', description: 'Wallet pass slides out: release tick (sync), decelerating glide with edge sheen, soft low seat.', render: (r, p) => walletSlide(r, p)},
  paper_drop: {family: 'paper', description: 'A sheet dropped flat: air flutter, the air-cushion whump at landing (sync), soft slap, buckle, skid.', render: (r, p) => paperDrop(r, p)},
  ruler_tap: {family: 'desk', description: 'Acrylic ruler end tapped on the sheet, one rebound rattle, damped low thwack.', render: (r, p) => rulerTap(r, p)},
  key_clink: {family: 'metal', description: 'Two brass keys on a ring set down: bounces with restitution, second key chatters, damped on paper.', render: (r, p) => keyClink(r, p)},
  coin_clink: {family: 'metal', description: 'A coin set onto a lying coin: thin-disc modes ~4.3 kHz, tilt chatter, damped flat.', render: (r, p) => coinClink(r, p)},
  bubble_pop: {family: 'glass', description: 'A speech bubble appears: small cavity resonance ~700 Hz rising only 30 %, fast decay, soft "tup".', render: (r, p) => bubblePop(r, p)},
  title_in: {family: 'glass', description: 'Very low soft swell of air under the title fade (3.2 s), starts on exact zero, no tone.', render: (r, p) => titleIn(r, p)},
};

/** Every hit: the v1 set, then the v4 families (tools/foley4/registry4.ts). */
export const SFX: {readonly [K in SfxName]: SfxDef} = {...SFX_V1, ...SFX4};

export const SFX_NAMES = Object.keys(SFX) as readonly SfxName[];
/** The v1 names only: the v1 one-shot catalogue (audio/foley/oneshots) renders these. */
export const SFX_NAMES_V1 = Object.keys(SFX_V1) as readonly SfxNameV1[];
export const isSfxName = (x: unknown): x is SfxName => typeof x === 'string' && Object.prototype.hasOwnProperty.call(SFX, x);
