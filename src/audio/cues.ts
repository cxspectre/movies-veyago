// cues.ts — the vocabulary visuals use to tell the sound department what happens when.
// Times are MODULE-LOCAL seconds (0 = the start of the module's slot, see film.ts SLOTS).

export type SfxName =
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

export type Cue =
  | {kind: 'stroke'; t: number; dur: number; pressure?: number; tool?: 'pencil' | 'pen'} // continuous drawing sound
  | {kind: 'erase'; t: number; dur: number}
  | {kind: 'slide'; t: number; dur: number; pan?: number} // a sheet of paper sliding on the desk
  | {kind: 'sweep'; t: number; dur: number} // the band of edge light travelling
  | {kind: 'hit'; t: number; name: SfxName; gain?: number; pan?: number};

export type ModuleCues = readonly Cue[];
