// sfxNames.ts — every SfxName at runtime, checked complete by the compiler (a Record over the union in cues.ts).
import type {SfxName} from './cues';

const ALL: Record<SfxName, true> = {
  tick: true, cup_down: true, sticky_press: true, sticky_smooth: true, pencil_down: true, pencil_click: true, pen_cap: true,
  phone_down: true, snap: true, card_flip: true, wallet_slide: true, paper_drop: true, ruler_tap: true, key_clink: true,
  coin_clink: true, bubble_pop: true, title_in: true,
  fold: true, scissors: true, crumple: true, stamp: true, string: true, pin: true, odometer: true, train: true, plane: true,
  rocket: true, marble_run: true, padlock: true,
};

export const SFX_NAMES_ALL = Object.keys(ALL) as readonly SfxName[];
export const isSfxName = (name: string): name is SfxName => Object.hasOwn(ALL, name);

/** `snap_card` -> `snap`: an `sfxAt` key is an SfxName, optionally followed by `_<what>` for the editor's reading. */
export const sfxNameOf = (key: string): SfxName => {
  const parts = key.split('_');
  const match = parts.map((_, i) => parts.slice(0, parts.length - i).join('_')).find(isSfxName);
  if (!match) throw new Error(`sfxAt key "${key}" names no SfxName (src/audio/cues.ts)`);
  return match;
};
