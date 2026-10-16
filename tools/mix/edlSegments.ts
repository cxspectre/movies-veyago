// edlSegments.ts — each EDL's segments with their EDIT-timeline start and MASTER source range, as JSON for tools/mix/mix.py.
//   npx tsx tools/mix/edlSegments.ts   -> audio/mix/edl-segments.json
import {mkdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {EDLS, segmentSeconds} from '../../src/edits';
import {slotOf} from '../../src/film';

const out = EDLS.map((edl) => {
  let start = 0;
  const segments = edl.segments.map((s) => {
    const slot = slotOf(s.module);
    const entry = {module: s.module, start, seconds: segmentSeconds(s), masterFrom: slot.start + s.from, masterTo: slot.start + s.to};
    start += segmentSeconds(s);
    return entry;
  });
  return {id: edl.id, seconds: start, segments};
});
const file = path.resolve('audio/mix/edl-segments.json');
mkdirSync(path.dirname(file), {recursive: true});
writeFileSync(file, `${JSON.stringify(out, null, 1)}\n`);
process.stdout.write(`wrote ${path.relative(process.cwd(), file)}\n`);
