// pages.ts — the pencil pages chapter 9 draws: the nine interiors (the v1 sketch pages, BIBLE4 §5.9, minus their own
// margin notes: the visit's note is written beside the house instead), the margin notes, "112"/"A4", the form on the
// green and the conversation bubble. All are engine pages (SketchSpec) compiled once into marks.
import {
  compileSketch,
  handCircle,
  handLine,
  handPath,
  handRect,
  label,
  measureHand,
  sequence,
  stroke,
  type HandFaceKey,
  type Mark,
  type SketchSpec,
} from '../../paper';
import {SKETCH_SIZE} from '../../paper/types';
import {spec as passport} from '../../sketches/passport/spec';
import {spec as shareCard} from '../../sketches/share-card/spec';
import {spec as sharedCosts} from '../../sketches/shared-costs/spec';
import {spec as scamLetter} from '../../sketches/scam-letter/spec';
import {spec as visitRecording} from '../../sketches/visit-recording/spec';
import {spec as pillBottle} from '../../sketches/pill-bottle';
import {spec as watchWallet} from '../../sketches/watch-wallet';
import {keyTeeth, roundedRect} from '../../sketches/kit-b/glyphs';
import {bubblePath} from '../../sketches/speech-bubbles/bubble';
import type {VisitPlan} from './layout';

export type Page = {readonly marks: readonly Mark[]; readonly width: number; readonly height: number};

const page = (spec: SketchSpec, width: number = SKETCH_SIZE.width, height: number = SKETCH_SIZE.height): Page => ({marks: compileSketch(spec), width, height});

/** A v1 page without its own margin note (accent lettering longer than a mark): the visit writes its note itself. */
const withoutNote = (spec: SketchSpec): SketchSpec => ({...spec, labels: spec.labels.filter((l) => !(l.ink === 'accent' && l.text.length > 3))});

// Two interiors the v1 set does not have (BIBLE4 §5.9 visits 8 and 9). Wordless: nothing to claim.

/** Visit 8: a vet card (a paw on it) in a tiny folder. */
const vetCard = (): SketchSpec => {
  const paw = [
    handCircle(600, 470, 34, 30, 811, {overlap: 0.1}),
    handCircle(556, 418, 12, 14, 812),
    handCircle(586, 400, 12, 14, 813),
    handCircle(618, 400, 12, 14, 814),
    handCircle(646, 418, 12, 14, 815),
  ].join(' ');
  const items = [
    stroke('folder-back', handPath([[330, 300], [330, 250], [480, 250], [510, 280], [870, 280], [870, 640], [330, 640], [330, 300]], 801, {wobble: 0.8}), {width: 2.6, rough: true}),
    stroke('card', roundedRect(420, 330, 360, 230, 18, 802), {width: 2.2}),
    stroke('paw', paw, {width: 2.4, pressure: 1.1}),
    stroke('lines', [handLine(690, 400, 760, 400, 803), handLine(690, 430, 750, 431, 804), handLine(690, 460, 740, 460, 805)].join(' '), {width: 1.4, pressure: 0.8}),
    stroke('folder-front', handPath([[310, 420], [890, 420], [870, 640], [330, 640], [310, 420]], 806, {wobble: 0.7}), {width: 2.6}),
    stroke('ring', handCircle(600, 470, 70, 62, 807, {overlap: 0.15}), {ink: 'accent', width: 2.8}),
  ];
  return {id: 'village-vet-card', ...sequence(items, 0, 1, 0.12)};
};

/** Visit 9: a key, a car registration and a lease, laid out on Sam's table. */
const friendPapers = (): SketchSpec => {
  const key = [
    handCircle(250, 470, 46, 44, 901, {overlap: 0.1}),
    handCircle(238, 470, 15, 15, 902, {wobble: 0.3}),
    handLine(296, 462, 480, 462, 903),
    handLine(296, 480, 480, 480, 904),
    keyTeeth([[440, 10, 26], [458, 10, 18], [476, 10, 26]], 480, 905),
  ].join(' ');
  const reg = [
    roundedRect(540, 380, 250, 160, 12, 911),
    // a little car outline on the card
    handPath([[570, 500], [570, 470], [598, 448], [650, 448], [672, 470], [700, 472], [700, 500], [570, 500]], 912, {wobble: 0.5}),
    handCircle(594, 504, 11, 11, 913),
    handCircle(676, 504, 11, 11, 914),
    handLine(720, 420, 770, 420, 915),
    handLine(720, 450, 765, 451, 916),
  ].join(' ');
  const lease = [
    handRect(840, 230, 220, 300, 921, {radius: 3}),
    ...[280, 310, 340, 370, 400, 430].map((y, i) => handLine(870, y, 1030 - (i % 3) * 18, y + 0.6, 922 + i)),
    handPath([[880, 490], [900, 470], [915, 495], [935, 468], [955, 492], [990, 480]], 930, {wobble: 0.6}),
  ].join(' ');
  const items = [
    stroke('key', key, {width: 2.6, rough: true, pressure: 1.1}),
    stroke('registration', reg, {width: 2.2}),
    stroke('lease', lease, {width: 1.8}),
    stroke('tick', handPath([[250, 560], [268, 580], [310, 530]], 940, {wobble: 0.4}), {ink: 'accent', width: 3, tick: true}),
  ];
  return {id: 'village-friend-papers', ...sequence(items, 0, 1, 0.12)};
};

const INTERIOR_SPECS: Record<VisitPlan['interior'], SketchSpec> = {
  passport: withoutNote(passport),
  'watch-wallet': withoutNote(watchWallet),
  'pill-bottle': withoutNote(pillBottle),
  'share-card': withoutNote(shareCard),
  'shared-costs': withoutNote(sharedCosts),
  'scam-letter': withoutNote(scamLetter),
  'visit-recording': withoutNote(visitRecording),
  'vet-card': vetCard(),
  'friend-papers': friendPapers(),
};

const interiorCache = new Map<string, Page>();
export const interiorPage = (id: VisitPlan['interior']): Page => {
  const hit = interiorCache.get(id);
  if (hit) return hit;
  const p = page(INTERIOR_SPECS[id]);
  interiorCache.set(id, p);
  return p;
};

// Handwriting (notes and margin labels): one engine page sized to the words

const wrapWords = (text: string, size: number, face: HandFaceKey, maxWidth: number): readonly string[] => {
  const lines: string[] = [];
  let cur = '';
  text.split(' ').forEach((w) => {
    const next = cur ? `${cur} ${w}` : w;
    if (cur && measureHand(next, size, face) > maxWidth) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  });
  if (cur) lines.push(cur);
  return lines;
};

export type HandPage = Page & {readonly lines: number};

/** Handwritten lines (top-left at 0,0 of the page). `maxWidth` in page px wraps; 0 = one line. */
export const handPage = (id: string, text: string, o: {size: number; face: HandFaceKey; ink: 'accent' | 'graphite'; maxWidth?: number; rotate?: number}): HandPage => {
  const lines = o.maxWidth ? wrapWords(text, o.size, o.face, o.maxWidth) : [text];
  const pad = o.size * 0.5;
  const step = o.size * 1.08;
  const width = Math.ceil(Math.max(...lines.map((l) => measureHand(l, o.size, o.face))) + pad * 2);
  const height = Math.ceil(o.size * 1.2 + step * (lines.length - 1) + pad * 2);
  const items = lines.map((l, i) => label(`${id}-${i}`, l, pad, pad + o.size * 0.95 + i * step, {size: o.size, ink: o.ink, face: o.face, rotate: o.rotate ?? 0}));
  return {...page({id, ...sequence(items, 0, 1, 0.05)}, width, height), lines: lines.length};
};

// The green (BIBLE4 §5.9 63-75): a form crossed out, then one question and two chips

export const FORM = {w: 360, h: 440, crossFrom: 0.84} as const;

/** The v1 form frame (field boxes, wordless at this size), and one crossing-out stroke at the end (from `FORM.crossFrom`). */
export const formPage = ((): Page => {
  const rows = [80, 150, 220, 290, 360];
  const items = [
    stroke('frame', roundedRect(20, 20, FORM.w - 40, FORM.h - 40, 14, 1001), {width: 2.4, rough: true}),
    ...rows.flatMap((y, i) => [
      stroke(`label-${i}`, handLine(50, y, 50 + 60 + (i % 3) * 18, y + 0.5, 1010 + i), {width: 1.4, pressure: 0.7}),
      stroke(`box-${i}`, handRect(50, y + 12, FORM.w - 100, 30, 1020 + i, {radius: 4}), {width: 1.6}),
    ]),
  ];
  const drawn = sequence(items, 0, FORM.crossFrom - 0.06, 0.08);
  const cross = {id: 'cross-out', d: handPath([[-10, FORM.h - 30], [FORM.w * 0.5, FORM.h * 0.48], [FORM.w + 12, 24]], 1040, {wobble: 0.5, smooth: 0.6}), ink: 'graphite' as const, width: 4, pressure: 1.3, from: FORM.crossFrom, to: 1};
  return page({id: 'village-form', strokes: [...drawn.strokes, cross], labels: drawn.labels}, FORM.w, FORM.h);
})();

/** "Who are you looking after?" and the chips (Patrick Hand 36 screen px at z 4 = 36 page px at the nested scale). */
export const CHAT = {question: 'Who are you looking after?', size: 46, chipSize: 40} as const;
const chatBox = (question: string) => {
  const pad = 34;
  const qw = measureHand(question, CHAT.size, 'patrick-400');
  return {x0: 40, y0: 30, x1: 40 + qw + pad * 2, y1: 30 + 240};
};
/** The bubble's box in page px (the chapter lays a paper tint under it). */
export const chatBubbleBox = chatBox;
export const chatPage = (question: string, chips: readonly string[]): Page => {
  const pad = 34;
  const box = chatBox(question);
  const width = Math.ceil(box.x1 + 40);
  const height = Math.ceil(box.y1 + 70);
  const bubble = bubblePath(box, {radius: 36, tail: 40, tailHalfBase: 16, toward: [0, height], seed: 1101});
  const chipW = chips.map((c) => measureHand(c, CHAT.chipSize, 'patrick-400') + 48);
  let x = box.x0 + pad;
  const chipItems = chips.flatMap((c, i) => {
    const w = chipW[i] as number;
    const at = x;
    x += w + 22;
    return [
      stroke(`chip-${i}`, roundedRect(at, box.y0 + 116, w, 78, 38, 1110 + i), {width: 2.2, ink: i === 0 ? 'accent' : 'graphite'}),
      label(`chip-${i}-text`, c, at + 24, box.y0 + 168, {size: CHAT.chipSize, face: 'patrick-400', ink: i === 0 ? 'accent' : 'graphite'}),
    ];
  });
  const items = [
    stroke('bubble', bubble.d, {width: 2.4}),
    label('question', question, box.x0 + pad, box.y0 + 72, {size: CHAT.size, face: 'patrick-400'}),
    ...chipItems,
  ];
  return page({id: 'village-chat', ...sequence(items, 0, 1, 0.08)}, width, height);
};
