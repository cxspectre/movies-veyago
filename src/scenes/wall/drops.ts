// drops.ts — who lays which sheet when (pure). Fourteen sheets land in seven pairs on the half-seconds
// (`wall.layout.dropsAt`, two per drop: one per pair of hands), then pair B puts the phone face down at
// `wall.layout.phoneDownAt`. Each pair uses both hands, alternately, so no hand is ever in two places: a trip is
// carry in (from beyond the frame edge) -> land -> let go -> withdraw. BIBLE §2.10, §2.11, §7.1.
import {wall, type WallTile} from '../../beats';
import type {FormatName} from '../../film';
import type {HandPair, Handedness} from '../../desk';

export type HandId = `${HandPair}-${Handedness}`;

export type DropPlan = {
  readonly tile: WallTile;
  /** The moment the sheet touches the desk (module-local seconds, on the 0.5 s grid). */
  readonly landsAt: number;
  readonly hand: HandId;
};

type Row = readonly [WallTile, HandId];

/** Per drop, [pair A's sheet, pair B's sheet]; the phone is pair B's eighth trip. */
const PLAN: Record<FormatName, readonly (readonly [Row, Row])[]> = {
  // Wide: A (from the bottom) lays the left and lower tiles and the centre; B (from the right) the right and upper.
  wide: [
    [['passport', 'A-right'], ['shared-costs', 'B-left']],
    [['europe-map', 'A-left'], ['watch-wallet', 'B-right']],
    [['speech-bubbles', 'A-right'], ['form-to-chat', 'B-left']],
    [['scam-letter', 'A-left'], ['pill-bottle', 'B-right']],
    [['binder-home-v2', 'A-right'], ['where-is-it', 'B-left']],
    [['visit-recording', 'A-left'], ['family-tabs', 'B-right']],
    [['v1-home', 'A-right'], ['share-card', 'B-left']],
  ],
  // Tall: A (from the bottom) the lower rows and the centre; B (from the top-right) the upper rows.
  tall: [
    [['visit-recording', 'A-right'], ['shared-costs', 'B-left']],
    [['where-is-it', 'A-left'], ['share-card', 'B-right']],
    [['form-to-chat', 'A-right'], ['scam-letter', 'B-left']],
    [['passport', 'A-left'], ['pill-bottle', 'B-right']],
    [['binder-home-v2', 'A-right'], ['watch-wallet', 'B-left']],
    [['speech-bubbles', 'A-left'], ['family-tabs', 'B-right']],
    [['europe-map', 'A-right'], ['v1-home', 'B-left']],
  ],
};

const PHONE_HAND: HandId = 'B-right';

/** Every trip of the layout, in landing order (sheets, then the phone). */
export const dropPlan = (format: FormatName): readonly DropPlan[] => {
  const plan = PLAN[format];
  if (plan.length !== wall.layout.dropsAt.length) throw new Error(`wall: ${plan.length} drops planned, beats.ts has ${wall.layout.dropsAt.length}`);
  const sheets = plan.flatMap((pair, i) => {
    const landsAt = wall.layout.dropsAt[i] ?? 0;
    return pair.map(([tile, hand]) => ({tile, landsAt, hand}));
  });
  return [...sheets, {tile: 'phone', landsAt: wall.layout.phoneDownAt, hand: PHONE_HAND}];
};

export const dropOf = (format: FormatName, tile: WallTile): DropPlan => {
  const d = dropPlan(format).find((p) => p.tile === tile);
  if (!d) throw new Error(`wall: ${tile} is never laid (${format})`);
  return d;
};

// ---- the trip, in seconds relative to landing ---------------------------------------------------------------------

/** Push in from beyond the frame and glide over this long before landing (keynote ease: fast, then settling). */
export const CARRY_SECONDS = 0.5;
/** The fingers stay on the landed sheet this long. */
export const LET_GO_SECONDS = 0.06;
/** Then the hand withdraws along its arm. */
export const WITHDRAW_SECONDS = 0.32;
/** After letting go the hand coasts on a little before it withdraws. */
export const COAST_SECONDS = 0.1;
/** How high the sheet rides as it enters, px above the desk (its shadow drifts and softens as it settles). */
export const CARRY_HEIGHT = 16;
/** It enters turned this much more than its resting rotation, degrees (A turns one way, B the other). */
export const CARRY_TURN = 5;

/** Problems with the plan: a hand making two trips at once. Empty when clean. */
export const validateDrops = (format: FormatName): readonly string[] => {
  const trips = dropPlan(format);
  // The longest trip: carried all the way to the slot (no glide), let go, coast, withdraw.
  const busy = CARRY_SECONDS + LET_GO_SECONDS + COAST_SECONDS + WITHDRAW_SECONDS;
  return trips.flatMap((a, i) =>
    trips.slice(i + 1).flatMap((b) => (a.hand === b.hand && Math.abs(a.landsAt - b.landsAt) < busy ? [`${format}: ${a.hand} lays ${a.tile} and ${b.tile} at once`] : [])),
  );
};
