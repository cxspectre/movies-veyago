// stickyState.ts — pure timing of a sticky note being pressed onto the page and then smoothed flat.
import type {ModuleCues} from '../../audio/cues';
import {FPS} from '../../film';
import {clamp, easeInOut} from '../geometry/noise';

export type StickyTiming = {
  /** Frame the note touches the paper. */
  readonly pressAt: number;
  /** Frames it spends coming down from the hand before touching (default 9). */
  readonly approachFrames?: number;
  /** Frame a finger starts smoothing it flat (default pressAt + 24). */
  readonly smoothAt?: number;
  /** Frames the smoothing takes (default 14). */
  readonly smoothFrames?: number;
};

export type StickyState = {
  /** False before the note arrives. */
  readonly visible: boolean;
  /** Height of the note above the paper, px (drives scale and shadow). */
  readonly height: number;
  /** 0 = flat, 1 = the free bottom edge clearly curled up. */
  readonly curl: number;
  /** Where the smoothing finger is, 0 (adhesive strip) to 1 (bottom edge); null when not smoothing. */
  readonly sweep: number | null;
};

export const STICKY_DEFAULTS = {approachFrames: 9, smoothDelay: 24, smoothFrames: 14, dropHeight: 46, restCurl: 0.85};

const resolved = (t: StickyTiming): {pressAt: number; approach: number; smoothAt: number; smoothFrames: number} => ({
  pressAt: t.pressAt,
  approach: t.approachFrames ?? STICKY_DEFAULTS.approachFrames,
  smoothAt: t.smoothAt ?? t.pressAt + STICKY_DEFAULTS.smoothDelay,
  smoothFrames: t.smoothFrames ?? STICKY_DEFAULTS.smoothFrames,
});

/** The note at `frame`: arriving (falling and curled), resting (bottom edge lifted), smoothing, flat. */
export const stickyState = (frame: number, timing: StickyTiming): StickyState => {
  const t = resolved(timing);
  const arrive = t.pressAt - t.approach;
  if (frame < arrive) return {visible: false, height: STICKY_DEFAULTS.dropHeight, curl: 1, sweep: null};
  if (frame < t.pressAt) {
    const k = clamp((frame - arrive) / Math.max(1, t.approach), 0, 1);
    const fall = 1 - k * k; // accelerating down onto the paper
    return {visible: true, height: STICKY_DEFAULTS.dropHeight * fall, curl: 1 - 0.15 * k, sweep: null};
  }
  if (frame < t.smoothAt) {
    const settle = clamp((frame - t.pressAt) / 4, 0, 1);
    return {visible: true, height: 0, curl: STICKY_DEFAULTS.restCurl + (1 - settle) * 0.1, sweep: null};
  }
  const k = clamp((frame - t.smoothAt) / Math.max(1, t.smoothFrames), 0, 1);
  if (k >= 1) return {visible: true, height: 0, curl: 0, sweep: null};
  return {visible: true, height: 0, curl: STICKY_DEFAULTS.restCurl * (1 - easeInOut(k)), sweep: easeInOut(k)};
};

/** 'sticky_press' and 'sticky_smooth' hits (seconds from the same origin as the frames). */
export const stickyCues = (timing: StickyTiming): ModuleCues => {
  const t = resolved(timing);
  return [
    {kind: 'hit', t: t.pressAt / FPS, name: 'sticky_press'},
    {kind: 'hit', t: t.smoothAt / FPS, name: 'sticky_smooth'},
  ];
};
