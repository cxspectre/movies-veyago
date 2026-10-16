// passport — page 6, passports and IDs reminded early (BIBLE §4.7). Drawing in ./spec.ts.
import type {ModuleCues} from '../../audio/cues';
import {pageCues, type PageHit} from '../kit-b/cues';
import {pageComponent} from '../kit-b/page';
import {spec} from './spec';

/** The real ruler is laid down as its first edge is drawn; the pencil is heard along it too. */
const HITS: readonly PageHit[] = [{id: 'ruler', name: 'ruler_tap', replacesStroke: false}];

export {spec};
export const Sketch = pageComponent(spec);
/** Pencil cues, plus `ruler_tap` at the ruler's start. The `mark-` strokes are silent ticks: pencil sound only. */
export const cues = (drawFrames: number): ModuleCues => pageCues(spec, drawFrames, HITS);
