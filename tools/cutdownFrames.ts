// cutdownFrames.ts — the master frames to look at for each v4 cut-down (src/edits4.ts): the first frame and +2 s, every
// segment join (last frame of a segment - 0.5 s, its last frame, the next segment's first frame and + 0.5 s) and the end
// (- 0.5 s and the last frame). Contiguous slices of one chapter (a.to === b.from) are not joins and are skipped.
// There is no v4 cut-down composition yet, so the stills come from Master4-<format> at the
// segment's master time (chapter start + module-local time). Prints a motionDiff.ts group spec, one group per EDL.
// usage: npx tsx tools/cutdownFrames.ts [--edl=Hook75,Cut180]   then   npx tsx tools/motionDiff.ts Master4-tall 0.5 "$(...)"
import {sec} from '../src/film';
import {slotOf4} from '../src/film4';
import {EDLS4} from '../src/edits4';

const only = process.argv.find((a) => a.startsWith('--edl='))?.slice(6).split(',');
const masterFrame = (chapter: Parameters<typeof slotOf4>[0], local: number): number => sec(slotOf4(chapter).start + local);

const groups = EDLS4.filter((e) => !only || only.includes(e.id)).map((edl) => {
  const segs = edl.segments;
  const first = segs[0]!;
  const last = segs[segs.length - 1]!;
  const frames: number[] = [masterFrame(first.chapter, first.from), masterFrame(first.chapter, Math.min(first.from + 2, first.to))];
  segs.slice(0, -1).forEach((s, i) => {
    const n = segs[i + 1]!;
    if (n.chapter === s.chapter && n.from === s.to) return; // a contiguous slice: no picture join to judge
    frames.push(masterFrame(s.chapter, s.to - 0.5), masterFrame(s.chapter, s.to) - 1, masterFrame(n.chapter, n.from), masterFrame(n.chapter, n.from + 0.5));
  });
  frames.push(masterFrame(last.chapter, last.to - 0.5), masterFrame(last.chapter, last.to) - 1);
  return `${edl.id}:${frames.join(',')}`;
});
console.log(groups.join(';'));
