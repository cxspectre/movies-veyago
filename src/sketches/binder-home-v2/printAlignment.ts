// printAlignment.ts — prints the alignment table: `npx tsx src/sketches/binder-home-v2/printAlignment.ts`.
import {ALIGNMENT, ASPECT_FIT_DRIFT_PX, maxError} from './alignment';

const f = (v: number): string => v.toFixed(2).padStart(6);
const rows = [...ALIGNMENT].sort((a, b) => b.errorPx - a.errorPx);
rows.forEach((r) => process.stdout.write(`${r.id.padEnd(28)} ${r.fit.padEnd(5)} ${f(r.errorPx)} px ${f(r.errorPt)} pt\n`));
(['box', 'line', 'label', 'icon', 'inside'] as const).forEach((fit) => {
  const m = maxError(ALIGNMENT, [fit]);
  if (m) process.stdout.write(`max ${fit.padEnd(5)} ${m.id.padEnd(24)} ${f(m.errorPx)} px ${f(m.errorPt)} pt\n`);
});
process.stdout.write(`aspect-fit drift if the still is NOT stretched: ${ASPECT_FIT_DRIFT_PX.toFixed(2)} px\n`);
