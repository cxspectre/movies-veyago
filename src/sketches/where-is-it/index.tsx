// where-is-it — page 8, "Where is the original?" (BIBLE §4.9). Drawing in ./spec.ts.
import type {ModuleCues} from '../../audio/cues';
import {pageCues, type PageHit} from '../kit-b/cues';
import {pageComponent} from '../kit-b/page';
import {spec} from './spec';

/**
 * Only the teeth clink. `key-ring` and `key-shaft` keep the bible's ids (they share the `key-` prefix) but are
 * pencil strokes: three clinks in 0.3 s would be noise, and the brief names the teeth as the sound.
 */
const HITS: readonly PageHit[] = [{id: 'key-teeth', name: 'key_clink', replacesStroke: true}];

export {spec};
export const Sketch = pageComponent(spec);
export const cues = (drawFrames: number): ModuleCues => pageCues(spec, drawFrames, HITS);
