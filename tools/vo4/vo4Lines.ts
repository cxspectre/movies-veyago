// vo4Lines.ts — write audio/v4/vo/lines.json from VO4 (src/beats4.ts), the timeline the picture is built on.
// script_lines.py read the script's paragraph timestamps, which drift from the beats (up to 16 s). The voice must sit where
// the supers and captions expect it, so the lines, their ids (Y1, F3, M7 ...) and their start times come from VO4.
// usage: npx tsx tools/vo4/vo4Lines.ts            then render_vo4.py, place_vo4.py as in docs/v4/AUDIO.md step 4
import {mkdirSync, writeFileSync} from 'node:fs';
import {VO4} from '../../src/beats4';
import {MASTER4_SECONDS, slotOf4} from '../../src/film4';

const sorted = [...VO4].sort((a, b) => a.masterStart - b.masterStart);
const lines = sorted.map((v, i) => ({
  id: v.id,
  voice: v.voice,
  chapter: slotOf4(v.chapter).number,
  text: v.text,
  startMaster: v.masterStart,
  nextLineStart: sorted[i + 1]?.masterStart ?? MASTER4_SECONDS,
}));
mkdirSync('audio/v4/vo', {recursive: true});
writeFileSync('audio/v4/vo/lines.json', JSON.stringify(lines, null, 2) + '\n');
console.log(`wrote audio/v4/vo/lines.json: ${lines.length} lines from VO4`);
