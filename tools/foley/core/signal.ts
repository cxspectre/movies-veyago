// signal.ts — small pure helpers over mono Float64Array signals. Inputs are never modified;
// every function allocates and returns a new buffer (the accumulator in mix.ts is the one exception).

export type Mono = Float64Array;

export const clamp = (x: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, x));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const smoothstep = (t: number): number => {
  const u = clamp(t, 0, 1);
  return u * u * (3 - 2 * u);
};
export const dbToGain = (db: number): number => Math.pow(10, db / 20);
export const gainToDb = (gain: number): number => (gain > 0 ? 20 * Math.log10(gain) : -Infinity);

export function zeros(length: number): Mono {
  return new Float64Array(Math.max(0, Math.round(length)));
}

export function scale(x: Mono, gain: number): Mono {
  return x.map((v) => v * gain);
}

export function multiply(a: Mono, b: Mono): Mono {
  const out = new Float64Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = (a[i] ?? 0) * (b[i] ?? 0);
  return out;
}

/** Sum of parts (each optionally gained and offset in samples); length covers the longest part. */
export function mixMono(length: number, parts: readonly {sig: Mono; gain?: number; offset?: number}[]): Mono {
  const out = zeros(length);
  for (const part of parts) {
    const g = part.gain ?? 1;
    const off = Math.round(part.offset ?? 0);
    for (let i = 0; i < part.sig.length; i++) {
      const j = i + off;
      if (j >= 0 && j < out.length) out[j] = (out[j] ?? 0) + (part.sig[i] ?? 0) * g;
    }
  }
  return out;
}

export function rms(x: Mono): number {
  let s = 0;
  for (let i = 0; i < x.length; i++) s += (x[i] ?? 0) ** 2;
  return x.length > 0 ? Math.sqrt(s / x.length) : 0;
}

export function peakAbs(x: Mono): number {
  let p = 0;
  for (let i = 0; i < x.length; i++) p = Math.max(p, Math.abs(x[i] ?? 0));
  return p;
}

export function mean(x: Mono): number {
  let s = 0;
  for (let i = 0; i < x.length; i++) s += x[i] ?? 0;
  return x.length > 0 ? s / x.length : 0;
}

/** Running integral (cumulative sum divided by the sample rate). */
export function integrate(x: Mono, sampleRate: number): Mono {
  const out = new Float64Array(x.length);
  let acc = 0;
  for (let i = 0; i < x.length; i++) {
    acc += (x[i] ?? 0) / sampleRate;
    out[i] = acc;
  }
  return out;
}

/** Build a signal from a per-sample function of the index. */
export function generate(length: number, f: (i: number) => number): Mono {
  const out = zeros(length);
  for (let i = 0; i < out.length; i++) out[i] = f(i);
  return out;
}
