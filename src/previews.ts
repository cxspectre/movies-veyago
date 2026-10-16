import type {PreviewSpec} from './previewTypes';
import {deskPreviews} from './desk/previews';
import {devicePreviews} from './devices/previews';
import {editPreviews} from './edit/previews';
import {SKETCHES} from './sketches/registry';
import {SCENES} from './scenes/registry';

/** Every owner-registered composition. Root.tsx maps these; owners never edit Root.tsx. */
export const PREVIEWS: readonly PreviewSpec[] = [
  ...deskPreviews,
  ...devicePreviews,
  ...editPreviews,
  ...Object.values(SKETCHES).flatMap((s) => s.previews ?? []),
  ...Object.values(SCENES).flatMap((s) => s.previews ?? []),
];
