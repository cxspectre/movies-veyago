// layout.ts — chapter 11's numbers (BIBLE4 §1.2 and §5.11): the pencil, its set-down, and the end card's type block.
import type {Point} from '../../sheet4';

/** The pencil: 520 px long (the graphite pencil is 175 mm), lying at 12 degrees, its tip where the line ends. */
export const PENCIL = {tip: [37420, 4005] as Point, yaw: 12, pxPerMm: 520 / 175} as const;

/** Set-down: it rises 20 px (15.0-15.9), then lowers and stops a hair above the paper at 17.0. */
export const SET_DOWN = {from: 15.0, top: 15.9, to: 17.0, height: 20, rest: 1.5} as const;

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const ease = (x: number): number => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};

/** The pencil's height above the paper, px, at module-local `t`. */
export const hoverAt = (t: number): number => {
  const s = SET_DOWN;
  if (t <= s.from) return 0;
  if (t < s.top) return s.height * ease((t - s.from) / (s.top - s.from));
  if (t < s.to) return s.rest + (s.height - s.rest) * (1 - ease((t - s.top) / (s.to - s.top)));
  return s.rest;
};

export const CARD = {
  title: 'Provisum 2',
  line: 'Free on the App Store',
  cambria: 'Made by Veyago. Private by design.',
} as const;

/**
 * The card's type block in SHEET px. The camera after the drift sits at (38300, 3900) wide / (38300, 3950) tall; the card is
 * centred on it as the v1 card is on its frame: the type block a little above the middle (the optical centre, 0.48 H),
 * the mark and the Caladea line near the foot. All of it stays inside the 1080 px central column. Without a mark (owner decision 4: cut for now) the Caladea line moves
 * up into the mark's place, so the stack has no gap where the mark was.
 */
export const cardLayout = (tall: boolean, hasMark: boolean) => {
  const cx = tall ? 37900 : 38300;
  const cy = tall ? 3950 : 3900;
  const H = tall ? 1920 : 1080;
  const titleSize = tall ? 96 : 120;
  const lineSize = tall ? 40 : 46;
  const markSize = tall ? 64 : 72;
  const cambriaSize = tall ? 36 : 42;
  const gap = lineSize; // title baseline to the line's cap top (v1)
  const cap = 0.7;
  const blockH = cap * titleSize + gap + cap * lineSize;
  const top = cy - 0.02 * H - blockH / 2;
  const titleBaseline = top + cap * titleSize;
  const lineBaseline = titleBaseline + gap + cap * lineSize;
  const footBaseline = cy + H / 2 - 96;
  const markTop = footBaseline - cap * cambriaSize - 40 - markSize;
  const cambriaBaseline = hasMark ? footBaseline : markTop + cap * cambriaSize;
  return {cx, titleSize, lineSize, markSize, cambriaSize, titleBaseline, lineBaseline, cambriaBaseline, markTop};
};
