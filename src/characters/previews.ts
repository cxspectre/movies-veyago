import {FORMATS} from '../film';
import type {PreviewSpec} from '../previewTypes';
import {CHARACTER_SHEET_FRAMES, CharacterSheet, MayaPoses} from './demo/CharacterSheet';

/** Registered through src/previews4.ts. The Gate 1 style test compositions. */
export const characterPreviews: readonly PreviewSpec[] = [
  {id: 'CharacterSheet-wide', component: CharacterSheet, durationInFrames: CHARACTER_SHEET_FRAMES, ...FORMATS.wide},
  {id: 'Maya-poses-wide', component: MayaPoses, durationInFrames: CHARACTER_SHEET_FRAMES, ...FORMATS.wide},
];
