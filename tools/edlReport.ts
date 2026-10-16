// edlReport.ts — CLI: the cut list of every cut-down with the master timecode of each slice, the caption track
// (edit times and the exact line breaks, measured from the DM Sans file with fontkit, as the player sets them),
// and how the VO's spoken sentences (audio/vo/timing.json, the cut applied) sit under the captions.
//
//   npx tsx tools/edlReport.ts                 every EDL
//   npx tsx tools/edlReport.ts --edl=Vertical45
//
// Exits 1 when an EDL is not playable or a caption needs a third line.
import * as fontkit from 'fontkit';
import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {EDLS, segmentSeconds, type Edl} from '../src/edits';
import {FORMATS, FPS} from '../src/film';
import {captionFontSize, layoutCaption, type Measure} from '../src/edit/captionLayout';
import {edlCaptionWindows, toneAt} from '../src/edit/captionTiming';
import {assertEdl} from '../src/edit/checks';
import {placeSegments} from '../src/edit/edl';
import {edlCueSheet} from '../src/edit/edlCues';
import {SCENES} from '../src/scenes/registry';
import type {PlacedSegment} from '../src/edit/types';

const CAPTION_FONT_FILE = 'public/fonts/dm-sans-latin-500-normal.woff2';
const VO_TIMING_FILE = 'audio/vo/timing.json';
/** Speech running this far past the caption that carries it is reported. */
const SPEECH_OVERRUN_SECONDS = 0.25;

type Chunk = {text: string; start: number; end: number};
type VoTiming = {lines: readonly {id: string; durationSec: number; chunks: readonly Chunk[]}[]};

const flag = (name: string): string | undefined =>
  process.argv
    .slice(2)
    .find((a) => a.startsWith(`--${name}=`))
    ?.slice(name.length + 3);

const r2 = (n: number): string => n.toFixed(2);
/** Seconds -> m:ss:ff at the film's frame rate. */
const tc = (seconds: number): string => {
  const frames = Math.round(seconds * FPS);
  const m = Math.floor(frames / (60 * FPS));
  const s = Math.floor(frames / FPS) % 60;
  const f = frames % FPS;
  return `${m}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
};
const pad = (text: string, width: number): string => (text.length >= width ? text : text + ' '.repeat(width - text.length));

const fontMeasure = (format: Edl['format']): Measure => {
  const font = fontkit.openSync(path.resolve(CAPTION_FONT_FILE)) as unknown as {unitsPerEm: number; layout: (t: string) => {advanceWidth: number}};
  const size = captionFontSize(format);
  return (text: string) => (font.layout(text).advanceWidth / font.unitsPerEm) * size;
};

const readVoTiming = (): VoTiming | undefined => {
  if (!existsSync(VO_TIMING_FILE)) return undefined;
  try {
    return JSON.parse(readFileSync(VO_TIMING_FILE, 'utf8')) as VoTiming;
  } catch (error) {
    throw new Error(`Could not read ${VO_TIMING_FILE}: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/** The VO's sentences in edit seconds, with a `drop "<sentence>"` cut spliced out (the gap closes up). */
const spokenChunks = (timing: VoTiming | undefined, line: number, at: number, cut: string | undefined): readonly Chunk[] => {
  const chunks = timing?.lines.find((l) => l.id === `vo${line}`)?.chunks ?? [];
  const dropped = cut?.match(/drop\s+"([^"]+)"/)?.[1];
  const dropIndex = dropped === undefined ? -1 : chunks.findIndex((c) => c.text.trim() === dropped.trim());
  const removed = dropIndex === -1 ? 0 : (chunks[dropIndex + 1]?.start ?? chunks[dropIndex]?.end ?? 0) - (chunks[dropIndex]?.start ?? 0);
  return chunks
    .filter((_, i) => i !== dropIndex)
    .map((c, i) => {
      const shift = dropIndex !== -1 && i >= dropIndex ? removed : 0;
      return {text: c.text, start: at + c.start - shift, end: at + c.end - shift};
    });
};

const cutList = (placed: readonly PlacedSegment[]): readonly string[] => [
  `${pad('#', 3)}${pad('edit in-out', 18)}${pad('dur', 6)}${pad('module', 16)}${pad('local', 12)}${pad('master in-out', 18)}note`,
  ...placed.map((p) =>
    [
      pad(String(p.index + 1), 3),
      pad(`${tc(p.start)}-${tc(p.end)}`, 18),
      pad(r2(segmentSeconds(p.segment)), 6),
      pad(p.module + (p.black ? ' (black)' : ''), 16),
      pad(`${p.segment.from}-${p.segment.to}`, 12),
      pad(`${tc(p.masterFrom)}-${tc(p.masterTo)}`, 18),
      p.segment.note,
    ].join(''),
  ),
];

const captionReport = (edl: Edl, placed: readonly PlacedSegment[], speech: readonly Chunk[]): {lines: readonly string[]; problems: readonly string[]} => {
  const measure = fontMeasure(edl.format);
  const {width, height} = FORMATS[edl.format];
  const windows = edlCaptionWindows(edl);
  const results = windows.map((w) => {
    const from = w.fromFrame / FPS;
    const to = w.toFrame / FPS;
    // Speech that starts under this caption and is still going when it ends, with no caption taking over on that frame.
    const handedOn = w.holdOut === true;
    const isLate = (c: Chunk): boolean => !handedOn && c.start >= from && c.start < to && c.end > to + SPEECH_OVERRUN_SECONDS;
    try {
      const layout = layoutCaption(w.text, measure, width, height, edl.format);
      const said = speech.filter((c) => c.start < to && c.end > from);
      const late = said.filter(isLate);
      const head = `  ${tc(from)}-${tc(to)} [${toneAt(placed, w.fromFrame)}] over segment(s) ${w.over.map((i) => i + 1).join(',')}: ${layout.lines.map((l) => `"${l.text}"`).join(' / ')}`;
      const voLines = said.map((c) => `      VO ${r2(c.start)}-${r2(c.end)}s "${c.text}"${isLate(c) ? `  <- runs ${r2(c.end - to)}s past the caption` : ''}`);
      return {lines: [head, ...voLines], problems: late.map((c) => `speech "${c.text}" runs ${r2(c.end - to)}s past its caption (${tc(to)})`), fatal: []};
    } catch (error) {
      return {lines: [`  ${tc(from)} "${w.text}": ${error instanceof Error ? error.message : String(error)}`], problems: [], fatal: [String(error)]};
    }
  });
  if (results.some((r) => r.fatal.length > 0)) throw new Error(`${edl.id}: a caption cannot be set in two lines`);
  return {lines: results.flatMap((r) => r.lines), problems: results.flatMap((r) => r.problems)};
};

const report = (edl: Edl, timing: VoTiming | undefined): string => {
  const placed = placeSegments(edl);
  const sheet = edlCueSheet(edl, (m) => SCENES[m].cues);
  const speech = sheet.vo.flatMap((v) => spokenChunks(timing, v.line, v.t, v.cut));
  const captions = captionReport(edl, placed, speech);
  return [
    `== ${edl.id} (${edl.format}, ${sheet.lengthSec}s, ${placed.length} segments)`,
    ...cutList(placed),
    '',
    `captions${captions.lines.length === 0 ? ': none' : ''}`,
    ...captions.lines,
    '',
    `VO: ${sheet.vo.map((v) => `VO ${v.line} at ${tc(v.t)}${v.cut ? ` (${v.cut})` : ''}`).join('; ') || 'none'}`,
    `silences: ${sheet.silences.map((s) => `${tc(s.start)}-${tc(s.end)} (${s.reason})`).join('; ') || 'none'}`,
    `foley: ${sheet.cues.length} cues${sheet.modulesWithoutCues.length > 0 ? `; no cues exported yet by ${sheet.modulesWithoutCues.join(', ')}` : ''}`,
    ...[...sheet.warnings, ...captions.problems].map((w) => `WARN ${w}`),
    '',
  ].join('\n');
};

const main = (): void => {
  const id = flag('edl');
  const edls = id === undefined ? EDLS : EDLS.filter((e) => e.id === id);
  if (edls.length === 0) throw new Error(`No EDL "${id}" (known: ${EDLS.map((e) => e.id).join(', ')})`);
  const timing = readVoTiming();
  if (!timing) process.stdout.write(`(no ${VO_TIMING_FILE}: VO alignment skipped)\n`);
  for (const edl of edls.map(assertEdl)) process.stdout.write(report(edl, timing));
};

try {
  main();
} catch (error) {
  process.stderr.write(`edlReport failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
