// share-card — page 4, share the emergency card with family (BIBLE §4.5). Drawing in ./spec.ts.
import type {ModuleCues} from '../../audio/cues';
import {pageCues, prefixHits} from '../kit-b/cues';
import {pageComponent} from '../kit-b/page';
import {spec} from './spec';

export {spec};
export const Sketch = pageComponent(spec);
/** Pencil cues only: no object sound on this page. */
export const cues = (drawFrames: number): ModuleCues => pageCues(spec, drawFrames, prefixHits(spec));
