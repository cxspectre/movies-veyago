// report.ts — markdown tables for audio/foley/analysis/MEASUREMENTS.md.

export type Row = Record<string, string | number | boolean>;

const fmt = (v: string | number | boolean): string => {
  if (typeof v !== 'number') return String(v);
  if (!Number.isFinite(v)) return v > 0 ? 'inf' : v < 0 ? '-inf' : 'n/a';
  if (Number.isInteger(v)) return String(v);
  if (Math.abs(v) < 0.001) return v.toExponential(1);
  return Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2);
};

export function table(rows: readonly Row[]): string {
  const first = rows[0];
  if (!first) return '_no rows_\n';
  const cols = Object.keys(first);
  const head = `| ${cols.join(' | ')} |`;
  const rule = `|${cols.map(() => '---').join('|')}|`;
  const body = rows.map((r) => `| ${cols.map((c) => fmt(r[c] ?? '')).join(' | ')} |`);
  return [head, rule, ...body].join('\n') + '\n';
}

export const section = (title: string, intro: string, body: string): string => `## ${title}\n\n${intro}\n\n${body}\n`;
