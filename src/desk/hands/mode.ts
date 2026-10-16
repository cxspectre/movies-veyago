// mode.ts — the one switch between the illustrated hands and the fallback (BIBLE §2.11 / CONTRACT §6):
// 'illustrated' draws the stylised hands; 'shadows' draws only the soft cast shadow of a hand entering from off
// frame, plus the pencil and props. Same components, same API, same timing either way.
export type HandsMode = 'illustrated' | 'shadows';

export const HANDS_MODE: HandsMode = 'illustrated';
