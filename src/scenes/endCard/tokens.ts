// tokens.ts — the end card's numbers (BIBLE section 3, "End card", and 6.5), with the design review's changes: the
// tagline a size larger (40 / 34) and given air under the title (cap tops 40 / 34 px under its baseline, the bible
// said 24), and the Veyago mark large enough to read as a signature (64 / 56 px, 96 px above the bottom edge; the
// bible said 48 px at 72). Logical px.
import {COLORS, type FormatName} from '../../film';

export type CardTypeRole = {readonly weight: 500 | 700; readonly size: Record<FormatName, number>; readonly trackingEm: number; readonly color: string};

export const END_CARD = {
  title: {text: 'Provisum 2', weight: 700, size: {wide: 120, tall: 96}, trackingEm: -0.02, color: COLORS.graphite} as CardTypeRole & {text: string},
  line: {text: 'Free on the App Store', weight: 500, size: {wide: 40, tall: 34}, trackingEm: 0, color: COLORS.graphiteSoft} as CardTypeRole & {text: string},
  /** Cap tops of the line sit this far under the title's baseline. */
  lineGapPx: {wide: 40, tall: 34} as Record<FormatName, number>,
  mark: {file: 'brand/veyago-icon.svg', heightPx: {wide: 64, tall: 56} as Record<FormatName, number>, bottomPx: 96, opacity: 0.8},
  /** The paper: the albedo texture's tooth is the sheets' 18% (BIBLE 2.3); the card wants 10%. */
  toothPercent: 10,
  sheetToothPercent: 18,
  /** Corner darkness of the radial vignette, transparent inside 55% of the radius (BIBLE 2.1), #2A2008. */
  vignette: 0.1,
  vignetteClearRadius: 55,
  vignetteRgb: '42, 32, 8',
  /**
   * The type block (title cap top to line baseline) is centred a little above the middle, the optical centre, so the
   * mark at the foot does not pull the card down. Same fraction in both formats, matching the title card's balance.
   */
  opticalCentreOfHeight: 0.48,
} as const;
