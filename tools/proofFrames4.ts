// proofFrames4.ts — the EDIT frames to look at for a v4 cut-down (src/edit4): the first frame, a mid-fade frame of up to N
// captions (paper first, then glass), both frames of every picture join (last frame of a segment, first of the next;
// contiguous slices of one chapter are not joins) and the last frame. Prints `id:frame,frame,...` for tools/stills.ts.
// usage: npx tsx tools/proofFrames4.ts <EdlId> [--paper=5] [--glass=2]
import {edlCaptionWindows4} from '../src/edit4/captionTiming4';
import {edlFrames4, placeSegments4} from '../src/edit4/place';
import {EDLS4} from '../src/edits4';

const [id, ...flags] = process.argv.slice(2);
const flag = (name: string, fallback: number): number => Number(flags.find((f) => f.startsWith(`--${name}=`))?.split('=')[1] ?? fallback);
const edl = EDLS4.find((e) => e.id === id);
if (!edl) {
  console.error(`usage: tsx tools/proofFrames4.ts <${EDLS4.map((e) => e.id).join('|')}>`);
  process.exit(1);
}
const placed = placeSegments4(edl);
const windows = edlCaptionWindows4(edl);
const tone = (w: (typeof windows)[number]) => placed[w.segment]?.segment.props?.captionTone;
const mid = (w: (typeof windows)[number]) => Math.min(w.toFrame - 1, w.fromFrame + 24);
const pick = (t: string, n: number) => windows.filter((w) => tone(w) === t).slice(0, n).map(mid);
// spread the paper picks over the whole cut, not only its first captions
const paper = windows.filter((w) => tone(w) === 'paper');
const n = flag('paper', 5);
const spread = paper.length <= n ? paper : Array.from({length: n}, (_, i) => paper[Math.round((i * (paper.length - 1)) / (n - 1))]!);
const joins = placed.slice(0, -1).flatMap((p, i) => {
  const next = placed[i + 1]!;
  if (next.chapter === p.chapter && next.segment.from === p.segment.to) return [];
  return [next.startFrame - 1, next.startFrame];
});
const frames = [...new Set([0, ...spread.map(mid), ...pick('glass', flag('glass', 2)), ...joins, edlFrames4(edl) - 1])].sort((a, b) => a - b);
console.log(frames.join(','));
