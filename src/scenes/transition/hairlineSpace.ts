// hairlineSpace.ts — what the hairline renderers share: how canvas coordinates relate to logical px, and the
// under-halo that makes white light read on cream paper (hairlineCanvas.ts, hairlineHead.ts).
import {COLORS} from '../../film';

export type CanvasSpace = {
  /** Logical px per sketch px (the transform's scale; line widths are divided by it). */
  readonly sketchToLogical: number;
  /** Backing px per logical px (blur radii are multiplied by it). */
  readonly blurUnit: number;
  /** 0..1: how much of the paper under-halo to draw (0 in the void). */
  readonly paperHalo: number;
};

/** The under-halo under every hairline while the paper is light (logical px). */
export const PAPER_HALO = {
  haloPx: 6,
  haloColor: COLORS.accent,
  haloOpacity: 0.35,
  shadowPx: 14,
  shadowColor: '#1A2A55',
  shadowOpacity: 0.18,
} as const;
