// printLayout.ts — prints HOME_GROUPS: `npx tsx src/sketches/binder-home-v2/printLayout.ts`.
import {HOME_GROUPS, UNREGIONED_IDS, validateHomeGroups} from './layout';

const r = (v: {x: number; y: number; w: number; h: number}): string => `(${v.x.toFixed(1)}, ${v.y.toFixed(1)}, ${v.w.toFixed(1)} x ${v.h.toFixed(1)})`;
HOME_GROUPS.forEach((g) =>
  process.stdout.write(
    `${g.id.padEnd(8)} snap=${String(g.snap).padEnd(9)} ${g.strokeIds.length} ids  band ${r(g.band)} pt  sketch ${r(g.sketchRect)}  crop dark ${r(g.crop.dark)} light ${r(g.crop.light)}\n`,
  ),
);
process.stdout.write(`unregioned: ${UNREGIONED_IDS.join(', ')}\nproblems: ${validateHomeGroups().join('; ') || 'none'}\n`);
