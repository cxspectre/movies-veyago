// film.ts — the single source of truth for the master timeline, formats and brand tokens.
// Everything in the film is authored in LOGICAL pixels (wide 1920x1080, tall 1080x1920) and
// rendered at --scale=2 for 4K (3840x2160 / 2160x3840).

export const FPS = 30;
export const RENDER_SCALE = 2;

export const FORMATS = {
  wide: {width: 1920, height: 1080},
  tall: {width: 1080, height: 1920},
} as const;
export type FormatName = keyof typeof FORMATS;

/** Seconds -> whole frames at the film's frame rate. */
export const sec = (seconds: number): number => Math.round(seconds * FPS);
/** m:ss -> seconds, for readable slot tables. */
export const at = (minutes: number, seconds: number): number => minutes * 60 + seconds;

export const COLORS = {
  // Paper world (Acts 1-2, end card)
  paper: '#F3EEE3',
  paperShade: '#E8E1D0',
  graphite: '#2A2A2D',
  graphiteSoft: '#5A5A60',
  // The one accent: circles, ticks, arrows, margin notes. Confirmed against VYColor by docs/INVENTORY.md.
  accent: '#2F5BEA',
  // Glass world (Acts 3-4)
  void: '#000000',
  glassWhite: '#F5F7FA',
} as const;

export const FONTS = {
  super: 'DM Sans, sans-serif',
  closing: 'Caladea, Cambria, Georgia, serif',
  hand: 'Caveat, cursive',
} as const;

export type ModuleId =
  | 'coldOpen'
  | 'desk'
  | 'wall'
  | 'transition'
  | 'familyOfDevices'
  | 'title'
  | 'realThing'
  | 'pair'
  | 'backToDesk'
  | 'endCard';

export type Slot = {id: ModuleId; start: number; end: number; shots: readonly number[]};

/** The master timeline: module slots in seconds. Shot numbers refer to docs/SCRIPT.md. Do not edit without telling the director. */
export const SLOTS: readonly Slot[] = [
  {id: 'coldOpen', start: at(0, 0), end: at(0, 35), shots: [1, 2, 3, 4]},
  {id: 'desk', start: at(0, 35), end: at(1, 20), shots: [5, 6, 7, 8, 9]},
  {id: 'wall', start: at(1, 20), end: at(1, 31), shots: [10, 11]},
  {id: 'transition', start: at(1, 31), end: at(1, 48), shots: [12, 13]},
  {id: 'familyOfDevices', start: at(1, 48), end: at(1, 53), shots: [14]},
  {id: 'title', start: at(1, 53), end: at(2, 4), shots: [15, 16, 17]},
  {id: 'realThing', start: at(2, 4), end: at(2, 20), shots: [18]},
  {id: 'pair', start: at(2, 20), end: at(2, 25), shots: [19]},
  {id: 'backToDesk', start: at(2, 25), end: at(2, 33), shots: [20]},
  {id: 'endCard', start: at(2, 33), end: at(2, 40), shots: [21]},
];

export const MASTER_SECONDS = at(2, 40);
export const slotOf = (id: ModuleId): Slot => {
  const slot = SLOTS.find((s) => s.id === id);
  if (!slot) throw new Error(`Unknown module ${id}`);
  return slot;
};
export const slotFrames = (id: ModuleId): number => {
  const s = slotOf(id);
  return sec(s.end) - sec(s.start);
};
