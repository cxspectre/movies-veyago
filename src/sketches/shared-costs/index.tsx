// shared-costs — page 7, "Who paid what?" (BIBLE §4.8). Drawing in ./spec.ts.
import type {ModuleCues} from '../../audio/cues';
import {pageCues, prefixHits} from '../kit-b/cues';
import {pageComponent} from '../kit-b/page';
import {spec} from './spec';

export {spec};
export const Sketch = pageComponent(spec);
/** Pencil cues, and a `coin_clink` as each `coin-` lands (the coins are heard, not scratched). */
export const cues = (drawFrames: number): ModuleCues => pageCues(spec, drawFrames, prefixHits(spec));
