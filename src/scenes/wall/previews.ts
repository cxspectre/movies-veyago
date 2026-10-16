// previews.ts — the wall's extra compositions (auto-registered through src/scenes/registry.ts, CONTRACT §12.4).
import {FORMATS} from '../../film';
import {SKETCH_SIZE} from '../../paper';
import type {PreviewSpec} from '../../previewTypes';
import {END_CHECK_FRAMES, WallEndCheck} from './EndCheck';
import {V1WithNote} from './pages';

/** `tools/renderPages.ts` stills frame 59 of the page compositions. */
const PAGE_FRAMES = 60;

export const previews: readonly PreviewSpec[] = [
  {id: 'WallPage-v1-home-note', component: V1WithNote, durationInFrames: PAGE_FRAMES, ...SKETCH_SIZE},
  {id: 'Wall-end-check-wide', component: WallEndCheck, durationInFrames: END_CHECK_FRAMES, ...FORMATS.wide},
  {id: 'Wall-end-check-tall', component: WallEndCheck, durationInFrames: END_CHECK_FRAMES, ...FORMATS.tall},
];
