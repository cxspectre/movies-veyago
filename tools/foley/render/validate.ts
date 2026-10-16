// validate.ts — cue lists come from other departments as JSON; check them before rendering anything.

import type {Cue} from '../../../src/audio/cues';
import type {Silence} from '../sounds/roomTone';
import {SFX_NAMES, isSfxName} from '../sounds/registry';
import {CONTINUOUS_MAX_SEC, CONTINUOUS_MIN_SEC} from '../sounds/continuous';
import {STROKE_MAX_SEC, STROKE_MIN_SEC} from '../sounds/stroke';

export type Validated<T> = {readonly value: T; readonly warnings: readonly string[]};

const MAX_GAIN = 4;
const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
type Obj = Record<string, unknown>;

function checkOptionalRange(o: Obj, key: string, lo: number, hi: number, errors: string[], where: string): void {
  const v = o[key];
  if (v === undefined) return;
  if (!isNum(v) || v < lo || v > hi) errors.push(`${where}: '${key}' must be a number in [${lo}, ${hi}] (got ${JSON.stringify(v)})`);
}

function checkDur(o: Obj, lo: number, hi: number, errors: string[], warnings: string[], where: string): number {
  const d = o.dur;
  if (!isNum(d) || d <= 0) {
    errors.push(`${where}: 'dur' must be a positive number of seconds (got ${JSON.stringify(d)})`);
    return 0;
  }
  if (d < lo || d > hi) warnings.push(`${where}: dur ${d}s is outside ${lo}-${hi}s and will be clamped`);
  return d;
}

function checkCue(raw: unknown, index: number, errors: string[], warnings: string[]): Cue | undefined {
  const where = `cue[${index}]`;
  if (typeof raw !== 'object' || raw === null) {
    errors.push(`${where}: must be an object`);
    return undefined;
  }
  const o = raw as Obj;
  const before = errors.length;
  if (!isNum(o.t) || o.t < 0) errors.push(`${where}: 't' must be a number of seconds >= 0 (got ${JSON.stringify(o.t)})`);
  switch (o.kind) {
    case 'stroke':
      checkDur(o, STROKE_MIN_SEC, STROKE_MAX_SEC, errors, warnings, where);
      checkOptionalRange(o, 'pressure', 0, 1, errors, where);
      if (o.tool !== undefined && o.tool !== 'pencil' && o.tool !== 'pen') errors.push(`${where}: 'tool' must be 'pencil' or 'pen'`);
      break;
    case 'erase':
    case 'sweep':
      checkDur(o, CONTINUOUS_MIN_SEC, CONTINUOUS_MAX_SEC, errors, warnings, where);
      break;
    case 'slide':
      checkDur(o, CONTINUOUS_MIN_SEC, CONTINUOUS_MAX_SEC, errors, warnings, where);
      checkOptionalRange(o, 'pan', -1, 1, errors, where);
      break;
    case 'hit':
      if (!isSfxName(o.name)) errors.push(`${where}: unknown hit name ${JSON.stringify(o.name)} (known: ${SFX_NAMES.join(', ')})`);
      checkOptionalRange(o, 'gain', 0, MAX_GAIN, errors, where);
      checkOptionalRange(o, 'pan', -1, 1, errors, where);
      break;
    default:
      errors.push(`${where}: unknown kind ${JSON.stringify(o.kind)} (expected stroke, erase, slide, sweep or hit)`);
  }
  return errors.length === before ? (o as unknown as Cue) : undefined;
}

/** Validate an array of cues. Throws one Error listing every problem; returns warnings for clamped values. */
export function validateCues(input: unknown): Validated<Cue[]> {
  if (!Array.isArray(input)) throw new Error('Cue list must be a JSON array of cues');
  const errors: string[] = [];
  const warnings: string[] = [];
  const cues = input.map((raw, i) => checkCue(raw, i, errors, warnings)).filter((c): c is Cue => c !== undefined);
  if (errors.length > 0) throw new Error(`Invalid cues:\n  ${errors.join('\n  ')}`);
  return {value: cues, warnings};
}

/** Validate silence ranges ({start, end, fadeOutMs?, fadeInMs?} in master seconds). */
export function validateSilences(input: unknown): Silence[] {
  if (input === undefined) return [];
  if (!Array.isArray(input)) throw new Error("'silences' must be an array of {start, end}");
  return input.map((raw, i) => {
    const o = (typeof raw === 'object' && raw !== null ? raw : {}) as Obj;
    if (!isNum(o.start) || !isNum(o.end) || o.start < 0 || o.end <= o.start) {
      throw new Error(`silences[${i}]: needs numeric start >= 0 and end > start (got ${JSON.stringify(raw)})`);
    }
    for (const k of ['fadeOutMs', 'fadeInMs']) {
      const v = o[k];
      if (v !== undefined && (!isNum(v) || v < 0 || v > 5000)) throw new Error(`silences[${i}]: '${k}' must be 0-5000 ms`);
    }
    return o as unknown as Silence;
  });
}
