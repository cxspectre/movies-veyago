// captions4.ts — sidecar caption files (.srt and .vtt) for the v4 film: the 16:9 master, Hook75, Cut180 and the 11 shorts.
// Text is the spoken voice-over only (VO4); supers are not captions. Not burned in: YouTube and the short-form apps read the sidecar.
//   npx tsx tools/captions4.ts                      all ids -> out/captions/<id>.srt and <id>.vtt
//   npx tsx tools/captions4.ts --id=Hook75          one id (master4, Hook75, Cut180, Short-<chapter>)
//   npx tsx tools/captions4.ts --vo-dir=audio/v4/vo --out-dir=out/captions
// Timing: a line starts at its beat time and ends at the real length of its recorded stem (<vo-dir>/<id>.wav or
// <vo-dir>/clips/<id>.wav) when it exists, else at the estimate in src/beats4.ts. A cue is 1-7 s, at most two lines of 42 characters,
// and never crosses a cut: in a cut-down, a piece of a line that would run past the end of its segment is left out.
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {placeSegments4} from '../src/audio/sheet4';
import {VO4} from '../src/beats4';
import type {VoLine4} from '../src/beats4';
import {EDLS4} from '../src/edits4';

export const MAX_LINE_CHARS = 42;
export const MAX_CUE_LINES = 2;
export const MIN_CUE_SECONDS = 1;
export const MAX_CUE_SECONDS = 7;
/** A piece may overrun its segment by this much before it counts as crossing the cut (then it is dropped). */
const CUT_TOLERANCE = 0.25;
/** Sentences are joined into one cue only up to about this long. */
const PIECE_TARGET_SECONDS = 4.5;

export type Cue = {start: number; end: number; lines: readonly string[]};

const round3 = (n: number): number => Math.round(n * 1000) / 1000;
const flat = (s: string): string => s.replace(/\s+/g, ' ').trim();

/** Duration in seconds of a PCM WAV file from its header (RIFF chunks: fmt for the byte rate, data for the size). */
export const wavSeconds = (buf: Uint8Array): number | undefined => {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const tag = (o: number): string => String.fromCharCode(...buf.subarray(o, o + 4));
  if (buf.length < 12 || tag(0) !== 'RIFF' || tag(8) !== 'WAVE') return undefined;
  let byteRate = 0;
  for (let o = 12; o + 8 <= buf.length; ) {
    const size = view.getUint32(o + 4, true);
    if (tag(o) === 'fmt ' && o + 20 <= buf.length) byteRate = view.getUint32(o + 16, true);
    if (tag(o) === 'data') {
      const bytes = Math.min(size, buf.length - o - 8);
      return byteRate > 0 ? round3(bytes / byteRate) : undefined;
    }
    o += 8 + size + (size % 2);
  }
  return undefined;
};

export type VoDurations = (line: VoLine4) => number;

/** The duration of each line: the stem's real length when `voDir` holds one, else the estimate from beats4. */
export const durationsFrom = (voDir: string | undefined): VoDurations => (line) => {
  if (voDir) {
    for (const f of [path.join(voDir, `${line.id}.wav`), path.join(voDir, 'clips', `${line.id}.wav`)]) {
      if (existsSync(f)) {
        const s = wavSeconds(readFileSync(f));
        if (s !== undefined && s > 0) return s;
      }
    }
  }
  return round3(line.estimatedEnd - line.start);
};

/** Split text into sentences, keeping the closing punctuation. */
const sentences = (text: string): string[] => flat(text).match(/[^.!?]+[.!?]+["')]*|[^.!?]+$/g)?.map((s) => s.trim()) ?? [];

/** Split a too-long piece in two at the comma, colon or space nearest the middle. */
const splitHalf = (text: string): [string, string] => {
  const mid = text.length / 2;
  const cuts = [...text.matchAll(/[,:;] /g)].map((m) => (m.index ?? 0) + 1);
  const spaces = [...text.matchAll(/ /g)].map((m) => m.index ?? 0);
  const nearest = (xs: number[]): number | undefined => xs.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))[0];
  const punct = nearest(cuts);
  const at = punct !== undefined && Math.abs(punct - mid) <= text.length / 4 ? punct : (nearest(spaces) ?? Math.floor(mid));
  return [text.slice(0, at).trim(), text.slice(at).trim()];
};

/** Wrap one piece into at most two balanced lines of 42 characters; undefined when it cannot fit. */
export const wrapLines = (text: string): string[] | undefined => {
  const t = flat(text);
  if (t.length <= MAX_LINE_CHARS) return [t];
  const words = t.split(' ');
  let best: string[] | undefined;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    if (a.length > MAX_LINE_CHARS || b.length > MAX_LINE_CHARS) continue;
    if (!best || Math.abs(a.length - b.length) < Math.abs((best[0]?.length ?? 0) - (best[1]?.length ?? 0))) best = [a, b];
  }
  return best;
};

const fits = (text: string): boolean => wrapLines(text) !== undefined;

/** Break a line's text into cue pieces: whole sentences where they fit in two lines, split at a comma or the middle otherwise. */
export const pieces = (text: string, seconds = Infinity): string[] => {
  const total = flat(text).length;
  // Sentences are joined into one cue only while the cue stays short, so a cut can fall between them.
  const joinable = (s: string): boolean => (s.length / Math.max(total, 1)) * seconds <= PIECE_TARGET_SECONDS && fits(s);
  const out: string[] = [];
  const addSplit = (s: string): void => {
    if (fits(s)) out.push(s);
    else {
      const [a, b] = splitHalf(s);
      addSplit(a);
      addSplit(b);
    }
  };
  let pending = '';
  for (const s of sentences(text)) {
    if (pending && joinable(`${pending} ${s}`)) pending = `${pending} ${s}`;
    else {
      if (pending) out.push(pending);
      pending = '';
      if (fits(s)) pending = s;
      else addSplit(s);
    }
  }
  if (pending) out.push(pending);
  return out;
};

/** The cues of one line, timed from `start` over `seconds` in proportion to characters; split again if a cue passes 7 s. */
export const lineCues = (text: string, start: number, seconds: number): Cue[] => {
  let parts = pieces(text, seconds);
  const chars = (xs: string[]): number => xs.reduce((n, p) => n + p.length, 0);
  // Over 7 s per cue: split the longest piece until none is.
  while (parts.some((p) => (p.length / chars(parts)) * seconds > MAX_CUE_SECONDS && p.includes(' '))) {
    const i = parts.findIndex((p) => (p.length / chars(parts)) * seconds > MAX_CUE_SECONDS && p.includes(' '));
    parts = [...parts.slice(0, i), ...splitHalf(parts[i] ?? ''), ...parts.slice(i + 1)];
  }
  const total = chars(parts);
  let t = start;
  return parts.map((p) => {
    const dur = (p.length / total) * seconds;
    const cue = {start: round3(t), end: round3(t + dur), lines: wrapLines(p) ?? [p]};
    t += dur;
    return cue;
  });
};

/** Hold a cue to at least 1 s where the next cue and the ceiling leave room; clamp overlaps. */
const settle = (cues: Cue[], ceiling: number): Cue[] =>
  cues.map((c, i) => {
    const room = Math.min(cues[i + 1]?.start ?? Infinity, ceiling);
    return {...c, end: round3(Math.min(Math.max(c.end, c.start + MIN_CUE_SECONDS), Math.max(room, c.end)))};
  });

/** Captions for the 16:9 master: every line at its master time. */
export const masterCues = (duration: VoDurations, lines: readonly VoLine4[] = VO4): Cue[] =>
  settle(
    [...lines].sort((a, b) => a.masterStart - b.masterStart).flatMap((l) => lineCues(l.text, l.masterStart, duration(l))),
    Infinity,
  );

/** Captions for a cut-down: each segment's voice line placed at the segment start + `at`, re-timed to the edit; pieces that run past the cut are dropped. */
export const edlCues = (id: string, duration: VoDurations, edls = EDLS4, lines: readonly VoLine4[] = VO4): Cue[] => {
  const edl = edls.find((e) => e.id === id);
  if (!edl) throw new Error(`No EDL "${id}" (known: ${edls.map((e) => e.id).join(', ')})`);
  const cues: Cue[] = [];
  for (const p of placeSegments4(edl.segments)) {
    const v = p.segment.props?.vo;
    if (!v) continue;
    const line = lines.find((l) => l.id === v.line);
    if (!line) throw new Error(`${id}: no VO line ${v.line}`);
    const inside = lineCues(line.text, round3(p.start + v.at), duration(line))
      .filter((c) => c.end <= p.end + CUT_TOLERANCE && c.start < p.end)
      .map((c) => ({...c, end: Math.min(c.end, p.end)}));
    // A segment never needs more than its own room: settle against the segment end so a short cue is not stretched over the cut.
    cues.push(...settle(inside, p.end));
  }
  return cues.sort((a, b) => a.start - b.start);
};

const pad = (n: number, w: number): string => String(n).padStart(w, '0');
export const timestamp = (seconds: number, sep: ',' | '.'): string => {
  const ms = Math.round(seconds * 1000);
  return `${pad(Math.floor(ms / 3600000), 2)}:${pad(Math.floor(ms / 60000) % 60, 2)}:${pad(Math.floor(ms / 1000) % 60, 2)}${sep}${pad(ms % 1000, 3)}`;
};

export const toSrt = (cues: readonly Cue[]): string =>
  `${cues.map((c, i) => `${i + 1}\n${timestamp(c.start, ',')} --> ${timestamp(c.end, ',')}\n${c.lines.join('\n')}\n`).join('\n')}`;
export const toVtt = (cues: readonly Cue[]): string =>
  `WEBVTT\n\n${cues.map((c) => `${timestamp(c.start, '.')} --> ${timestamp(c.end, '.')}\n${c.lines.join('\n')}\n`).join('\n')}`;

/** Problems in a cue list: order, overlap, length, line count and width. */
export const cueProblems = (id: string, cues: readonly Cue[]): string[] =>
  cues.flatMap((c, i) => {
    const where = `${id} cue ${i + 1} (${timestamp(c.start, '.')})`;
    const p: string[] = [];
    if (c.lines.length < 1 || c.lines.length > MAX_CUE_LINES) p.push(`${where}: ${c.lines.length} lines`);
    for (const l of c.lines) if (l.length > MAX_LINE_CHARS) p.push(`${where}: line over ${MAX_LINE_CHARS} characters: "${l}"`);
    const d = c.end - c.start;
    if (d > MAX_CUE_SECONDS + 1e-6) p.push(`${where}: ${round3(d)} s is over ${MAX_CUE_SECONDS} s`);
    if (d < MIN_CUE_SECONDS - 1e-6) p.push(`${where}: ${round3(d)} s is under ${MIN_CUE_SECONDS} s`);
    const prev = cues[i - 1];
    if (prev && c.start < prev.end - 1e-6) p.push(`${where}: starts before the previous cue ends`);
    return p;
  });

export const CAPTION_IDS = ['master4', ...EDLS4.map((e) => e.id)] as const;

export const cuesFor = (id: string, duration: VoDurations): Cue[] => (id === 'master4' ? masterCues(duration) : edlCues(id, duration));

const flag = (name: string): string | undefined => process.argv.slice(2).find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);

const main = (): void => {
  const only = flag('id');
  const ids = only ? CAPTION_IDS.filter((i) => i === only) : CAPTION_IDS;
  if (ids.length === 0) throw new Error(`No id "${only}" (known: ${CAPTION_IDS.join(', ')})`);
  const voDir = flag('vo-dir') ?? 'audio/v4/vo';
  const duration = durationsFrom(existsSync(voDir) ? path.resolve(voDir) : undefined);
  const real = VO4.filter((l) => duration(l) !== round3(l.estimatedEnd - l.start)).length;
  const outDir = path.resolve(flag('out-dir') ?? 'out/captions');
  mkdirSync(outDir, {recursive: true});
  const problems: string[] = [];
  for (const id of ids) {
    const cues = cuesFor(id, duration);
    problems.push(...cueProblems(id, cues));
    writeFileSync(path.join(outDir, `${id}.srt`), toSrt(cues));
    writeFileSync(path.join(outDir, `${id}.vtt`), toVtt(cues));
    process.stdout.write(`${id}: ${cues.length} cues -> ${path.relative(process.cwd(), path.join(outDir, id))}.{srt,vtt}\n`);
  }
  process.stdout.write(`timing: ${real} of ${VO4.length} lines from recorded stems, ${VO4.length - real} from estimates\n`);
  if (problems.length > 0) {
    process.stderr.write(`caption problems:\n  ${problems.join('\n  ')}\n`);
    process.exit(1);
  }
};

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename ?? '')) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`captions4 failed: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}
