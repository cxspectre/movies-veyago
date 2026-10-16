// plan.ts — the picture decisions for each of the nine cuts, joined onto FEATURE_CUTS (beats.ts owns every time).
//
// Times here are CLIP-LOCAL seconds (where in each recording a cut starts playing), the one number beats.ts does not
// hold. Each was chosen from the clip's motion so the bible's "what we see" (BIBLE 6.2) is on screen; the reasons are
// next to each value. The plan is validated at import: a window that runs past its clip throws.
import {FEATURE_CUTS, type FeatureCut} from '../../beats';
import type {FormatName} from '../../film';
import type {Corner} from '../../glass';
import {footageFor, type FootageClip} from './footage';

/** How a cut is framed: the phone in the void, the Watch tight in the void, or a full-bleed crop of the footage. */
export type Shot = 'phone' | 'watch' | 'bleed';

/** A point in the clip, as fractions of its width and height (0..1, y down). */
export type Focus = {x: number; y: number};

export type CutPicture = {
  /** Clip second shown on the cut's first frame. */
  clipStart: number;
  shot: Shot;
  /** Void shots: the corner the edge light rests at. */
  lightCorner: Corner;
  /** Void shots: yaw offsets (degrees, added to the cut's rotationY) at the cut's first and last frame. */
  yawDrift: readonly [number, number];
  /** Bleed shots: the part of the clip centred in each format (clamped so the crop always covers the frame). */
  focus: Record<FormatName, Focus>;
  /** Bleed shots: the 2% drift's direction (unit-ish vector in frame space). */
  drift: Focus;
  /** Bleed shots: a scale over the cover fit for a format, when the default 1.06 cannot frame the beat. */
  bleedScale?: Partial<Record<FormatName, number>>;
  /** Clip second where the picture freezes for the rest of the cut (void shots; the rigs clamp at `clipEnd`). */
  holdAt?: number;
  why: string;
};

export type PlannedCut = FeatureCut & CutPicture & {clip: FootageClip; clipEnd: number};

/** Default void drift: one degree either side of the listed yaw, turning toward the camera. */
const toward = (rotationY: number): readonly [number, number] => (rotationY >= 0 ? [1, -1] : [-1, 1]);
const CENTRE: Record<FormatName, Focus> = {wide: {x: 0.5, y: 0.5}, tall: {x: 0.5, y: 0.5}};
const NO_DRIFT: Focus = {x: 0, y: 0};

const voidShot = (clipStart: number, lightCorner: Corner, rotationY: number, why: string): CutPicture => ({
  clipStart,
  shot: 'phone',
  lightCorner,
  yawDrift: toward(rotationY),
  focus: CENTRE,
  drift: NO_DRIFT,
  why,
});

const bleedShot = (clipStart: number, focus: Record<FormatName, Focus>, drift: Focus, why: string): CutPicture => ({
  clipStart,
  shot: 'bleed',
  lightCorner: 'topRight',
  yawDrift: [0, 0],
  focus,
  drift,
  why,
});

/** Keyed by cut number (FEATURE_CUTS[n - 1]). */
const PICTURES: Record<number, CutPicture> = {
  1: voidShot(2.7, 'topLeft', -12, 'switcher open with Mom, Dad, Me, Lily, Biscuit; Lily is tapped at clip 4.1 and the home turns amber by 4.5'),
  2: {
    clipStart: 0.2,
    shot: 'watch',
    lightCorner: 'topRight',
    yawDrift: [5, 3],
    focus: CENTRE,
    drift: NO_DRIFT,
    holdAt: 1.45,
    why: "Mom's card on the Watch (EMERGENCY CARD, Eleanor Hughes, allergies); the crown scroll blurs the title from clip 1.5, so the last crisp frame (1.45) holds",
  },
  3: voidShot(0.0, 'topRight', 10, "the card's Medications list with the Refill Oct 27 pill; Eliquis is tapped at clip 1.7 and its page pushes in"),
  4: {
    ...bleedShot(
      2.1,
      // wide: from just above the banner's border to the end of the second bullet (the third would be sliced).
      // tall: 1.10x so the window runs from under the Dynamic Island to the banner's foot, above the Skip / File bar.
      // The drift is sideways: either window has no vertical slack to spend.
      {wide: {x: 0.5, y: 0.504}, tall: {x: 0.5, y: 0.447}},
      {x: -1, y: 0},
      'the sorted letter has settled (arrives 1.0-2.1, the fade from "Sorting the letters" clears by 2.05); crop on the amber "common scam pattern" banner',
    ),
    bleedScale: {tall: 1.1},
  },
  5: voidShot(3.5, 'topLeft', -8, 'the Passport page (Expires Sep 14, 2027) scrolling to Remind me before it expires with 9, 6 and 3 months lit'),
  6: bleedShot(0.4, {wide: {x: 0.5, y: 0.447}, tall: {x: 0.5, y: 0.5}}, {x: 0, y: 1}, 'the summary holds still 0-2.5; wide frames David paid, You paid and the payoff, You owe David (Total does not fit with it)'),
  7: voidShot(4.4, 'topRight', 14, 'the scroll arrives at Visit recording (42 min) and Summary of what was said, under "Only on this iPhone"'),
  8: bleedShot(7.5, {wide: {x: 0.5, y: 0.704}, tall: {x: 0.5, y: 0.62}}, {x: 0, y: -1}, 'the second scroll has settled on WHO TO CALL and the red Call 112 button; wide ends in the gap above the first contact'),
  9: {
    ...voidShot(1.3, 'topRight', 0, '"Who are you looking after?" with its tiles; Mom is tapped at clip 2.8 and lights; ends before the next question slides in (3.4)'),
    yawDrift: [2, 0],
  },
};

const ONE_FRAME = 1 / 30;

const plan = (cut: FeatureCut): PlannedCut => {
  const picture = PICTURES[cut.n];
  if (!picture) throw new Error(`realThing: no picture plan for cut ${cut.n}`);
  // The Watch cut is a 'bleed' in beats.ts: the bible frames it tight with the watch rig (its footage is 416 px wide).
  const allowed: readonly Shot[] = cut.framing === 'void' ? ['phone'] : ['bleed', 'watch'];
  if (!allowed.includes(picture.shot)) throw new Error(`realThing: cut ${cut.n} framing ${cut.framing} does not allow shot ${picture.shot}`);
  const clip = footageFor(cut.footage);
  const clipEnd = picture.clipStart + cut.dur;
  if (picture.clipStart < 0 || clipEnd > clip.durationSec + 1e-6) {
    throw new Error(`realThing: cut ${cut.n} plays ${picture.clipStart}-${clipEnd}s of ${clip.id}, which is ${clip.durationSec}s long`);
  }
  if (picture.holdAt !== undefined && (picture.shot === 'bleed' || picture.holdAt <= picture.clipStart || picture.holdAt > clipEnd)) {
    throw new Error(`realThing: cut ${cut.n} holds at ${picture.holdAt}s, outside its void window ${picture.clipStart}-${clipEnd}s`);
  }
  return {...cut, ...picture, clip, clipEnd: Math.min(picture.holdAt ?? clipEnd, clip.durationSec - ONE_FRAME)};
};

export const CUTS: readonly PlannedCut[] = FEATURE_CUTS.map(plan);

/** The cut on screen at module-local second t (the last cut holds past the end). */
export const cutAt = (t: number): PlannedCut => {
  const cut = CUTS.find((c) => t >= c.start && t < c.end) ?? CUTS[CUTS.length - 1];
  if (!cut) throw new Error('realThing: no cuts');
  return cut;
};
