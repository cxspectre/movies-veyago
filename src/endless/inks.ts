// inks.ts — the voice inks of the line (BIBLE4 §3). Graphite and accent are the v1 inks; sepia is Maya's and is added to
// the engine's own Ink type by S1-B, so here it is a stub: it is deposited as graphite and recoloured on the way out.
import {INK4, VOICE_INK, voiceAt} from '../beats4';
import {COLORS} from '../film';
import {slotAtMaster} from './timeline';

export type LineInk = 'graphite' | 'accent' | 'sepia';

/** The ink of the voice speaking at a master time; with no voice, graphite (BIBLE4 §3 rule 1). */
export const voiceInkAt = (master: number): LineInk => {
  const slot = slotAtMaster(master);
  const voice = voiceAt(slot.id, master - slot.start);
  return voice ? (VOICE_INK[voice] as LineInk) : 'graphite';
};

/** A uniform ink for the whole line (tests, stills of one voice). */
export const constantInk = (ink: LineInk) => (): LineInk => ink;

const hex = (h: string): readonly [number, number, number] => {
  const v = Number.parseInt(h.replace('#', ''), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};

/** Sepia pencil multiplied onto the paper, the same recipe the engine uses for graphite and accent. */
export const SEPIA_ON_PAPER: readonly [number, number, number] = (() => {
  const ink = hex(INK4.sepia);
  const paper = hex(COLORS.paper);
  return [0, 1, 2].map((i) => Math.round(((ink[i] as number) * (paper[i] as number)) / 255)) as unknown as readonly [number, number, number];
})();
