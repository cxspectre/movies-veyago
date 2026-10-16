// cues.ts — the vocabulary visuals use to tell the sound department what happens when.
// Times are MODULE-LOCAL seconds (0 = the start of the module's slot, see film.ts SLOTS).

/** The v1 hits (the 2:40 film). */
export type SfxNameV1 =
  | 'tick' // the pencil ticking a list item
  | 'cup_down'
  | 'sticky_press'
  | 'sticky_smooth'
  | 'pencil_down'
  | 'pencil_click' // the last sound of the film
  | 'pen_cap'
  | 'phone_down'
  | 'snap' // a sketched element snapping into its finished interface (soft glass tick)
  | 'card_flip'
  | 'wallet_slide'
  | 'paper_drop'
  | 'ruler_tap'
  | 'key_clink'
  | 'coin_clink'
  | 'bubble_pop'
  | 'title_in';

/** The hits the long film (v4) adds (BIBLE4 7.4; recipes in tools/foley4, see audio/v4/foley/README.md). */
export type SfxNameV4 =
  | 'fold' // a paper panel folding up on its crease: soft card snap at the end (dur = the fold)
  | 'scissors' // blades through paper: three snips by default (dur = how long the cutting lasts)
  | 'crumple' // a sheet crushed into a ball (dur = the crushing)
  | 'stamp' // a rubber stamp thud on card, a little ink squelch, the lift
  | 'string' // a thread drawn taut (dur = the pull), a tiny twang on the taut beat
  | 'pin' // a push pin pressed into cork
  | 'odometer' // digit wheels rolling (dur = the roll, rate = ticks per second)
  | 'train' // a small tin train rattling along a card track (dur = the run)
  | 'plane' // a paper plane gliding past: one swish with a doppler sweep (dur = the pass)
  | 'rocket' // a paper rocket's lift-off: paper and air, not fire
  | 'marble_run' // a marble rolling and dropping through card gates (dur = the run)
  | 'padlock'; // a small padlock snapped shut

export type SfxName = SfxNameV1 | SfxNameV4;

export type Cue =
  | {kind: 'stroke'; t: number; dur: number; pressure?: number; tool?: 'pencil' | 'pen'} // continuous drawing sound
  | {kind: 'erase'; t: number; dur: number}
  | {kind: 'slide'; t: number; dur: number; pan?: number} // a sheet of paper sliding on the desk
  | {kind: 'sweep'; t: number; dur: number} // the band of edge light travelling
  | {kind: 'hit'; t: number; name: SfxName; gain?: number; pan?: number; dur?: number; rate?: number}; // dur/rate: v4 hits only

export type ModuleCues = readonly Cue[];
