// tree.ts — the family tree the papers rearrange into, as one pencil page (graphite, the v1 engine): a circle round
// each paper disc as it lands (a kennel for Biscuit), the name under it, the family lines, then the dotted branch out
// to Sam's plane and its label. Timed in module-local seconds and mapped onto the page's 0-1 progress.
import {mayasHouse as B} from '../../beats4';
import {handCircle, handLine, handPath, type LabelSpec, type SketchSpec, type StrokeSpec} from '../../paper';
import {measureHand} from '../../paper/text/handLayout';
import {NODE_R, PLANE, TREE, TREE_LINES, treeLand, type TreeNodeId} from './layout';

/** The page's box (sheet px). */
export const TREE_BOX = {x: 4960, y: 2830, w: 1360, h: 600} as const;
/** The page runs from the first flight to the plane's label. */
export const TREE_WINDOW = {from: B.tree.from, to: B.plane + 1.5} as const;
const LABEL_SIZE = 30;
const FACE = 'patrick-400' as const;

const fr = (t: number): number => (t - TREE_WINDOW.from) / (TREE_WINDOW.to - TREE_WINDOW.from);
const px = (x: number): number => x - TREE_BOX.x;
const py = (y: number): number => y - TREE_BOX.y;
const at = (id: TreeNodeId): readonly [number, number] => {
  const n = TREE.find((k) => k.id === id);
  if (!n) throw new Error(`mayasHouse tree: no node ${id}`);
  return [px(n.at[0]), py(n.at[1])];
};

const centredLabel = (id: string, text: string, cx: number, baseline: number, from: number, to: number): LabelSpec => ({
  id,
  text,
  x: cx - measureHand(text, LABEL_SIZE, FACE) / 2,
  y: baseline,
  size: LABEL_SIZE,
  ink: 'graphite',
  face: FACE,
  from: fr(from),
  to: fr(to),
});

const kennel = (cx: number, cy: number): string => {
  const w = NODE_R * 2.3;
  const h = NODE_R * 2;
  const l = cx - w / 2;
  const r = cx + w / 2;
  const b = cy + h / 2;
  const eave = cy - h * 0.12;
  const top = cy - h / 2 - 8;
  return `${handPath([[l, b], [l, eave], [cx, top], [r, eave], [r, b], [l - 6, b]], 811, {wobble: 0.8})}`;
};

const strokes: StrokeSpec[] = [];
const labels: LabelSpec[] = [];

for (const n of TREE) {
  const [cx, cy] = at(n.id);
  const land = treeLand(n.id);
  strokes.push({
    id: `node-${n.id}`,
    d: n.id === 'biscuit' ? kennel(cx, cy) : handCircle(cx, cy, NODE_R + 4, NODE_R + 4, 820 + TREE.indexOf(n)),
    ink: 'graphite',
    width: 2.2,
    rough: true,
    from: fr(land),
    to: fr(land + 0.5),
  });
  labels.push(centredLabel(`name-${n.id}`, n.label, cx, cy + NODE_R + 34, land + 0.4, land + 0.9));
}

// The family lines: Dad to Maya, Maya and Jonas, and down to the children and the dog.
const [dx, dy] = at('dad');
const [jx, jy] = at('jonas');
const [mx, my] = at('maya');
const kids = (['leo', 'mia', 'biscuit'] as const).map(at);
const R = NODE_R + 6;
const midX = (jx + mx) / 2;
const barY = (my + (kids[0]?.[1] ?? my + 170)) / 2 + 12;
const lines: string[] = [
  handLine(dx + R * 0.7, dy + R * 0.7, mx - R * 0.6, my - R * 0.78, 830),
  handLine(jx + R, jy, mx - R, my, 831),
  handLine(midX, jy + 2, midX, barY, 832),
  handLine(kids[0]?.[0] ?? midX, barY, kids[2]?.[0] ?? midX, barY, 833),
  ...kids.map(([kx, ky], i) => handLine(kx, barY, kx, ky - (i === 2 ? NODE_R * 1.15 : R), 834 + i)),
];
const lineStep = (TREE_LINES.to - TREE_LINES.from) / lines.length;
lines.forEach((d, i) =>
  strokes.push({id: `line-${i}`, d, ink: 'graphite', width: 1.8, from: fr(TREE_LINES.from + i * lineStep), to: fr(TREE_LINES.from + (i + 1) * lineStep)}),
);

// The dotted branch: out of Maya's node to the plane, arching up (1.6 px, dotted).
const [planeX, planeY] = [px(PLANE.at[0]), py(PLANE.at[1])];
strokes.push({
  id: 'branch',
  d: handPath(
    [
      [mx + R, my - 6],
      [mx + R + 120, my - 70],
      [(mx + planeX) / 2 + 60, planeY - 40],
      [planeX - 80, planeY + 8],
    ],
    840,
    {wobble: 1},
  ),
  ink: 'graphite',
  width: 1.6,
  style: 'dotted',
  pressure: 0.85,
  from: fr(B.branch.from),
  to: fr(B.plane),
});
labels.push(centredLabel('sam', PLANE.label, planeX, planeY + 78, B.plane + 0.5, B.plane + 1.3));

export const TREE_PAGE: SketchSpec = {id: 'mayasHouse-tree', strokes, labels};
/** The page's progress at a module-local time. */
export const treeProgress = (t: number): number => Math.min(1, Math.max(0, fr(t)));
/** Writing windows, for the cues (module-local seconds). */
export const TREE_STROKE_WINDOWS: readonly {t: number; dur: number}[] = [
  ...TREE.map((n) => ({t: treeLand(n.id), dur: 0.9})),
  {t: TREE_LINES.from, dur: TREE_LINES.to - TREE_LINES.from},
  {t: B.plane + 0.5, dur: 0.8},
];
