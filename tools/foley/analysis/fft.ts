// fft.ts — radix-2 FFT power spectra for analysis (works on a copy of the frame; not used in synthesis).

/** Power spectrum |X(k)|^2 for k = 0..N/2 of a real frame (length must be a power of two). */
export function powerSpectrum(frame: Float64Array): Float64Array {
  const n = frame.length;
  if ((n & (n - 1)) !== 0) throw new Error(`FFT size ${n} is not a power of two`);
  const re = Float64Array.from(frame);
  const im = new Float64Array(n);
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const tr = re[i] ?? 0;
      re[i] = re[j] ?? 0;
      re[j] = tr;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    for (let i = 0; i < n; i += len) {
      for (let k = 0; k < len / 2; k++) {
        const wr = Math.cos(ang * k);
        const wi = Math.sin(ang * k);
        const a = i + k;
        const b = a + len / 2;
        const xr = (re[b] ?? 0) * wr - (im[b] ?? 0) * wi;
        const xi = (re[b] ?? 0) * wi + (im[b] ?? 0) * wr;
        re[b] = (re[a] ?? 0) - xr;
        im[b] = (im[a] ?? 0) - xi;
        re[a] = (re[a] ?? 0) + xr;
        im[a] = (im[a] ?? 0) + xi;
      }
    }
  }
  return Float64Array.from({length: n / 2 + 1}, (_, k) => (re[k] ?? 0) ** 2 + (im[k] ?? 0) ** 2);
}

export const hann = (n: number): Float64Array => Float64Array.from({length: n}, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n));
