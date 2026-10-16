// captionLayout.ts — pure layout of a burned-in caption (BIBLE §3 "9:16 captions" and §7.4): DM Sans 500, 44 px,
// at most two lines, centred, the LAST line's baseline 300 px above the bottom edge. Line breaks prefer a sentence
// end, then a clause (comma), then the most balanced pair; a caption that needs a third line is an error.
// Width measurement is injected, so the browser (canvas) and the node tools (fontkit) share this exact code.
import {COLORS, FORMATS, type FormatName} from '../film';
import {GLASS_TYPE, TITLE_LAYOUT} from '../glass';

export type Measure = (text: string) => number;

/** DM Sans 500 vertical metrics (hhea/typo, fraction of the em; read from public/fonts with fontkit). */
const DM_SANS_ASCENT = 0.992;
const DM_SANS_DESCENT = 0.31;

/** Horizontal room either side of the caption (logical px). Keeps the pill inside the 9:16 title-safe area. */
const CAPTION_SIDE_MARGIN_PX = 96;

export const CAPTION_STYLE = {
  fontFamily: 'DM Sans',
  weight: GLASS_TYPE.caption.weight,
  lineHeight: GLASS_TYPE.caption.lineHeight,
  baselineFromBottomPx: TITLE_LAYOUT.captionBaselineFromBottomPx,
  maxLines: TITLE_LAYOUT.captionMaxLines,
  // The pill keeps the caption legible over a phone's own buttons and text (realThing cuts), on pure black it is invisible.
  glass: {ink: GLASS_TYPE.caption.color, inkOpacity: GLASS_TYPE.caption.opacity, pill: '#000000', pillOpacity: 0.62},
  paper: {
    ink: COLORS.graphite,
    inkOpacity: 0.9,
    pill: COLORS.paper,
    pillOpacity: 0.4,
    pillRadius: 16,
    padX: 18,
    padY: 10,
  },
  /** Fade in and fade out (BIBLE §7.4 via the role brief). */
  fadeFrames: 6,
} as const;

export const captionFontSize = (format: FormatName): number => GLASS_TYPE.caption.size[format];
export const captionCanvasFont = (format: FormatName): string =>
  `${CAPTION_STYLE.weight} ${captionFontSize(format)}px "${CAPTION_STYLE.fontFamily}"`;

const SENTENCE_END = /[.?!]["'’”)]?$/;
const CLAUSE_END = /[,;:—–]$/;
/** Words a first line should not end on (they belong to what follows). */
const WEAK_ENDINGS = new Set(['a', 'an', 'the', 'and', 'or', 'to', 'of', 'in', 'on', 'for', 'with', 'your', 'her', 'his', 'our']);
const WEAK_ENDING_PENALTY = 0.25;

type Break = {lines: readonly [string, string]; widest: number; rank: number};

const breakAt = (words: readonly string[], k: number, measure: Measure): Break => {
  const first = words.slice(0, k).join(' ');
  const second = words.slice(k).join(' ');
  const last = (words[k - 1] ?? '').toLowerCase();
  const rank = SENTENCE_END.test(first) ? 0 : CLAUSE_END.test(first) ? 1 : 2;
  const widest = Math.max(measure(first), measure(second));
  return {lines: [first, second], widest: WEAK_ENDINGS.has(last) ? widest * (1 + WEAK_ENDING_PENALTY) : widest, rank};
};

/** The caption's lines (1 or 2). Throws when the text cannot be set in two lines of `maxWidth`. */
export const wrapCaption = (text: string, measure: Measure, maxWidth: number): readonly string[] => {
  const clean = text.trim().replace(/\s+/g, ' ');
  if (measure(clean) <= maxWidth) return [clean];
  const words = clean.split(' ');
  const fitting = words
    .slice(1)
    .map((_, i) => breakAt(words, i + 1, measure))
    .filter((b) => b.lines.every((line) => measure(line) <= maxWidth));
  const best = [...fitting].sort((a, b) => a.rank - b.rank || a.widest - b.widest)[0];
  if (!best) throw new Error(`Caption needs more than ${CAPTION_STYLE.maxLines} lines at ${Math.round(maxWidth)} px: "${clean}"`);
  return best.lines;
};

export type CaptionBox = {
  lines: readonly {text: string; baseline: number; width: number}[];
  /** The paper pill (also the caption's footprint, for scenes keeping it clear). */
  box: {x: number; y: number; width: number; height: number};
  fontSize: number;
};

export const captionMaxWidth = (frameWidth: number): number => frameWidth - 2 * CAPTION_SIDE_MARGIN_PX - 2 * CAPTION_STYLE.paper.padX;

const lineMetrics = (format: FormatName): {fontSize: number; lineBox: number; baselineInLine: number} => {
  const fontSize = captionFontSize(format);
  const lineBox = fontSize * CAPTION_STYLE.lineHeight;
  // CSS line-box maths: the baseline sits half the leading plus the ascent below the line box's top.
  const baselineInLine = (lineBox - (DM_SANS_ASCENT + DM_SANS_DESCENT) * fontSize) / 2 + DM_SANS_ASCENT * fontSize;
  return {fontSize, lineBox, baselineInLine};
};

/** Top of the first line box for a caption of `lineCount` lines whose last baseline sits 300 px above the bottom. */
const firstLineTopOf = (height: number, lineCount: number, format: FormatName): number => {
  const {lineBox, baselineInLine} = lineMetrics(format);
  return height - CAPTION_STYLE.baselineFromBottomPx - baselineInLine - (lineCount - 1) * lineBox;
};

/** Where every line sits in a frame of `width` x `height` (logical px). */
export const layoutCaption = (text: string, measure: Measure, width: number, height: number, format: FormatName): CaptionBox => {
  const {fontSize, lineBox, baselineInLine} = lineMetrics(format);
  const lines = wrapCaption(text, measure, captionMaxWidth(width));
  const firstLineTop = firstLineTopOf(height, lines.length, format);
  const placed = lines.map((line, i) => ({text: line, baseline: firstLineTop + i * lineBox + baselineInLine, width: measure(line)}));
  const widest = Math.max(...placed.map((l) => l.width));
  const {padX, padY} = CAPTION_STYLE.paper;
  return {
    lines: placed,
    box: {
      x: (width - widest) / 2 - padX,
      y: firstLineTop - padY,
      width: widest + 2 * padX,
      height: lines.length * lineBox + 2 * padY,
    },
    fontSize,
  };
};

/**
 * The band a two-line caption (with its pill) can occupy in the tall frame, in logical px from the top. Scenes that
 * know they are captioned (EditableSceneProps.captioned) keep their own copy (the sticky note, margin notes) above it.
 */
export const CAPTION_BAND = (() => {
  const {lineBox} = lineMetrics('tall');
  const top = firstLineTopOf(FORMATS.tall.height, CAPTION_STYLE.maxLines, 'tall') - CAPTION_STYLE.paper.padY;
  return {top: Math.floor(top), bottom: Math.ceil(top + CAPTION_STYLE.maxLines * lineBox + 2 * CAPTION_STYLE.paper.padY)};
})();
