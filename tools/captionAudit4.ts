// captionAudit4.ts — the v4 cut-downs' caption track: every caption window in edit time with the exact line breaks
// (measured from DM Sans 500 with fontkit, as the player sets them), the tone, and any overlap with a super, the sticky
// notes, the title or the end card. Exits 1 when an EDL is not playable or a caption needs a third line.
//   npx tsx tools/captionAudit4.ts [--edl=Hook75]
import * as fontkit from 'fontkit';
import path from 'node:path';
import {captionFontSize, type Measure} from '../src/edit/captionLayout';
import {layoutCaption4} from '../src/edit4/captionFit';
import {captionOverlaps, edl4Problems} from '../src/edit4/checks4';
import {edlCaptionWindows4} from '../src/edit4/captionTiming4';
import {placeSegments4, edlFrames4} from '../src/edit4/place';
import {EDLS4} from '../src/edits4';
import {FORMATS, FPS} from '../src/film';

const only = process.argv.find((a) => a.startsWith('--edl='))?.slice(6);
const font = fontkit.openSync(path.resolve('public/fonts/dm-sans-latin-500-normal.woff2')) as unknown as {unitsPerEm: number; layout: (t: string) => {advanceWidth: number}};
const size = captionFontSize('tall');
const measure: Measure = (text) => (font.layout(text).advanceWidth / font.unitsPerEm) * size;
const {width, height} = FORMATS.tall;
let failed = false;
for (const edl of EDLS4.filter((e) => !only || e.id === only)) {
  const problems = edl4Problems(edl);
  console.log(`\n${edl.id} (${edlFrames4(edl) / FPS}s, ${edl.segments.length} segments)`);
  problems.forEach((p) => { console.log(`  PROBLEM ${p}`); failed = true; });
  const placed = placeSegments4(edl);
  for (const w of edlCaptionWindows4(edl)) {
    try {
      const l = layoutCaption4(w.text, measure, width, height, 'tall');
      const tone = placed[w.segment]?.segment.props?.captionTone;
      console.log(`  ${(w.fromFrame / FPS).toFixed(1).padStart(6)}-${(w.toFrame / FPS).toFixed(1).padStart(6)} ${tone} ${l.lines.length}L base ${l.lines.at(-1)!.baseline.toFixed(0)} | ${l.lines.map((x) => x.text).join(' / ')}`);
    } catch (e) {
      console.log(`  PROBLEM ${(e as Error).message}`);
      failed = true;
    }
  }
  captionOverlaps(edl).forEach((o) => console.log(`  OVERLAP ${o.editFrom.toFixed(1)}-${o.editTo.toFixed(1)}s "${o.text.slice(0, 40)}": ${o.why}`));
}
process.exit(failed ? 1 : 0);
