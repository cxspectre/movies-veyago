// passSpec.ts — the Wallet pass (public/footage/wallet-pass.png, a reconstruction: 370 x 300 pt, 14 pt corners) as a
// thin rounded card, and the emergency card that flips from the phone to the Watch. DEVICE UNITS: height 1.
import type {RoundedRect} from '../../glass/edgeLightPath';

export const PASS_ART_PX = {width: 1110, height: 900} as const;
const PASS_ASPECT = PASS_ART_PX.width / PASS_ART_PX.height;
const PT_PER_UNIT = 300;

export const PASS = {
  outline: {width: PASS_ASPECT, height: 1, radius: 14 / PT_PER_UNIT} as RoundedRect,
  depth: 0.012,
  edge: 0.0045,
  art: 'footage/wallet-pass.png',
  /**
   * The pass background (#B42318, from wallet-pass.pass.json), a deeper red for its back and rim, and its 1 px rim line:
   * #F5F7FA at 55% over the face red, so the pass edge catches light like the devices'.
   */
  face: '#B42318',
  back: '#8F1B12',
  rimHighlight: '#D89794',
} as const;

/** The emergency card that flips (BIBLE 5.7): a 3:2 card, the dock's red button growing into it. */
export const FLIP_CARD = {
  aspect: 3 / 2,
  /** Card width as a fraction of the phone body's width. */
  widthOfPhone: 0.4,
  /** Corner radius as a fraction of the card height. */
  radiusOfHeight: 0.07,
  /** The dock button's red (sampled from binder-home.png; the same red as the pass). */
  red: '#B42318',
  /** The front: the pass art (red, "Emergency card"), contain-fit on the red card so it reads as the red card. */
  front: 'footage/wallet-pass.png',
  back: 'footage/watch-card-still.png',
  durationSeconds: 0.5,
  /** How far toward the camera the card arcs, as a fraction of the card width. */
  liftOfWidth: 0.55,
} as const;
