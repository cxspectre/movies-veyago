// Chapter 2, "Maya's house" (0:30-1:15, local 0-45). BIBLE4 §5.2; the script's "2. Maya's house".
// The outline chapter 1's line drew folds up into a dollhouse; the table and the papers stand up in it; Maya draws in
// (sepia) and names the papers, which fly up around her, labelling themselves; a small storm; the freeze; the papers
// rearrange into the family tree above the house, and a dotted branch runs out to Sam's paper plane.
import React from 'react';
import {mayasHouse as B, SUPERS} from '../../beats4';
import {COLORS} from '../../film';
import {ChapterShell, Super, superFromBeat, useChapter} from '../../kit';
import {LineCharacter, boundsOf, placeFigure} from '../../characters';
import {PopUp} from '../../popup';
import {castShadow, compileSketch, DEFAULT_LAMP, PencilCanvas, textureUrl, TEXTURES} from '../../paper';
import {CUTOUT_SPECS, DOLLHOUSE, DollhouseArt, HOUSE_BOX, PaperArt, TABLE_SPEC, TableArt} from './house';
import {
  BOIL_REST,
  BOIL_STORM,
  CUTOUTS,
  FLIGHTS,
  HOUSE,
  local,
  MAYA,
  PLANE,
  REGISTRATION,
  SUPER_STORM_AT,
  SUPER_TREE_AT,
  SUPER_TREE_WIDTH,
  SWAP_SECONDS,
  SWAP_TO_A,
  SWAP_TO_B,
  TABLE,
  TREE,
  treeLand,
  type FlyingId,
} from './layout';
import {BEHIND_THE_BOX, paperPose, type PaperPose} from './papers';
import {PAPER_PLANE, PlaneArt} from './plane';
import {TREE_BOX, TREE_PAGE, TREE_WINDOW, treeProgress} from './tree';

const ID = 'mayasHouse' as const;
const FPS = 30;
const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
const smooth = (u: number): number => {
  const k = clamp01(u);
  return k * k * (3 - 2 * k);
};
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

const TREE_MARKS = compileSketch(TREE_PAGE);
const NO_POP = {tilt: 0} as const;

/** A flat paper in the air: paper colour and tooth, its drawing, a lamp shadow for its height. */
const Paper: React.FC<{id: FlyingId; pose: PaperPose}> = ({id, pose}) => {
  const [x, y] = local([pose.x, pose.y]);
  const base = id === 'registration' ? REGISTRATION : (CUTOUTS.find((c) => c.id === id) ?? REGISTRATION);
  const radius = pose.round * Math.min(pose.w, pose.h);
  return (
    <div
      style={{
        position: 'absolute',
        left: x - pose.w / 2,
        top: y - pose.h / 2,
        width: pose.w,
        height: pose.h,
        transform: `perspective(900px) rotate(${pose.rot}deg) rotateX(${pose.rx}deg) rotateY(${pose.ry}deg) scale(${pose.scale})`,
        backgroundColor: COLORS.paper,
        backgroundImage: `url(${textureUrl('paper')})`,
        backgroundSize: `${TEXTURES.paper.logical}px ${TEXTURES.paper.logical}px`,
        borderRadius: radius,
        boxShadow: `${castShadow(DEFAULT_LAMP, {height: pose.height})}, inset 0 0 0 0.7px rgba(42,42,45,0.22)`,
        overflow: 'hidden',
      }}
    >
      <div style={{position: 'absolute', left: (pose.w - base.w) / 2, top: (pose.h - base.h) / 2, width: base.w, height: base.h, opacity: pose.art}}>
        <PaperArt id={id} w={base.w} h={base.h} />
      </div>
    </div>
  );
};

const at = (sheetX: number, sheetY: number): React.CSSProperties => {
  const [x, y] = local([sheetX, sheetY]);
  return {position: 'absolute', left: x, top: y};
};

/** Bust offsets so each figure sits in the middle of its node (the tree pose's origin is its cut line). */
const BUST_SCALE = 0.65;
const BUST_OFFSET = Object.fromEntries(
  TREE.map((n) => {
    const b = boundsOf([placeFigure(n.character, 'tree', {x: 0, y: 0, scale: BUST_SCALE, boil: 0})], 0);
    return [n.id, [-(b.x0 + b.x1) / 2, -(b.y0 + b.y1) / 2 + 4] as const];
  }),
) as Record<string, readonly [number, number]>;

const Maya: React.FC<{t: number; zoom: number}> = ({t, zoom}) => {
  if (t < B.mayaDraws.from) return null;
  const [x, y] = local(MAYA.ground);
  const common = {character: 'maya' as const, x, y, scale: MAYA.scale, zoom};
  const stormK = clamp01((t - B.storm.from) / (B.storm.to - B.storm.from));
  if (t < SWAP_TO_B) {
    const progress = clamp01((t - B.mayaDraws.from) / (B.mayaDraws.to - B.mayaDraws.from));
    return <LineCharacter {...common} pose="sit-A" progress={progress} boil={BOIL_REST} />;
  }
  if (t < SWAP_TO_B + SWAP_SECONDS) {
    return <LineCharacter {...common} pose="sit-B" swapFrom="sit-A" swapProgress={(t - SWAP_TO_B) / SWAP_SECONDS} boil={BOIL_STORM.from} rough={false} />;
  }
  if (t < B.freeze) return <LineCharacter {...common} pose="sit-B" boil={lerp(BOIL_STORM.from, BOIL_STORM.to, stormK)} rough={false} />;
  // the freeze: her boil stops on the frame the storm stops on, until the swap back
  if (t < SWAP_TO_A) return <LineCharacter {...common} pose="sit-B" boil={BOIL_STORM.to} rough={false} frame={Math.round(B.freeze * FPS)} />;
  if (t < SWAP_TO_A + SWAP_SECONDS) {
    const u = (t - SWAP_TO_A) / SWAP_SECONDS;
    return <LineCharacter {...common} pose="sit-A" swapFrom="sit-B" swapProgress={u} boil={lerp(BOIL_STORM.to, BOIL_REST, u)} rough={false} />;
  }
  return <LineCharacter {...common} pose="sit-A" boil={BOIL_REST} rough={false} />;
};

export const Art: React.FC = () => {
  const {t, camera} = useChapter(ID);
  const zoom = camera.zoom;
  const poses = FLIGHTS.map((f) => ({id: f.id, pose: paperPose(f.id, t)}));
  const flying = (pred: (p: PaperPose) => boolean) =>
    poses.filter((p): p is {id: FlyingId; pose: PaperPose} => p.pose !== null && p.pose.visible && pred(p.pose)).map((p) => <Paper key={p.id} id={p.id} pose={p.pose} />);
  const lifted = new Set(poses.filter((p) => p.pose !== null).map((p) => p.id));
  const houseIn = smooth((t - B.popUp.from) / 0.3);
  const houseArt = smooth((t - B.popUp.from - 0.3) / (B.popUp.to - B.popUp.from));
  const eye = [HOUSE.eye[0] - HOUSE_BOX.x, HOUSE.eye[1] - HOUSE_BOX.y];
  const stormSuper = superFromBeat(SUPERS.mayasHouse[0] ?? {t: 22, dur: 6.5, text: '', ink: 'sepia', space: 'sheet'}, {sheet: SUPER_STORM_AT, align: 'centre'});
  const treeSuper = superFromBeat(SUPERS.mayasHouse[1] ?? {t: 34, dur: 6.5, text: '', ink: 'graphite', space: 'sheet'}, {sheet: SUPER_TREE_AT, align: 'centre'}, {maxWidth: SUPER_TREE_WIDTH});
  const planeIn = t >= B.plane;
  return (
    <>
      {/* the dollhouse */}
      <div style={{...at(HOUSE_BOX.x, HOUSE_BOX.y), opacity: houseIn}}>
        <PopUp spec={DOLLHOUSE} time={t} view={{...NO_POP, perspective: HOUSE.perspective}} style={{perspectiveOrigin: `${eye[0]}px ${eye[1]}px`}}>
          {(panel) => <DollhouseArt panel={panel.id} k={houseArt} />}
        </PopUp>
      </div>
      {/* the registration, rising out of the box behind its front */}
      {flying((p) => p.depth === BEHIND_THE_BOX)}
      {/* the table and the cutouts standing on it */}
      <div style={at(TABLE.x, TABLE.top)}>
        <PopUp spec={TABLE_SPEC} time={t} view={NO_POP}>
          <TableArt />
        </PopUp>
      </div>
      {CUTOUTS.filter((c) => !lifted.has(c.id as FlyingId)).map((c) => {
        const spec = CUTOUT_SPECS[c.id];
        return spec ? (
          <div key={c.id} style={at(c.x, TABLE.top - c.h)}>
            <PopUp spec={spec} time={t} view={NO_POP}>
              <PaperArt id={c.id} w={c.w} h={c.h} />
            </PopUp>
          </div>
        ) : null;
      })}
      {/* the storm's far side, Maya, then everything in front of her */}
      {flying((p) => p.depth < 0 && p.depth !== BEHIND_THE_BOX)}
      {t >= B.mayaDraws.from ? (
        <div
          style={{
            ...at(MAYA.ground[0] - 250, MAYA.ground[1] - 520),
            width: 500,
            height: 560,
            opacity: smooth((t - B.mayaDraws.from) / 1.5),
            background: 'radial-gradient(ellipse at 50% 55%, rgba(250,243,228,0.97) 0%, rgba(250,243,228,0.9) 50%, rgba(250,243,228,0) 72%)',
          }}
        />
      ) : null}
      <Maya t={t} zoom={zoom} />
      {flying((p) => p.depth >= 0)}
      {/* the tree: the pencil page, and a bust drawing into each node once its paper has landed */}
      {t >= TREE_WINDOW.from ? (
        <PencilCanvas marks={TREE_MARKS} progress={treeProgress(t)} width={TREE_BOX.w} height={TREE_BOX.h} zoom={zoom} style={at(TREE_BOX.x, TREE_BOX.y)} />
      ) : null}
      {TREE.map((n) => {
        const land = treeLand(n.id);
        if (t < land + 0.2) return null;
        const [x, y] = local(n.at);
        const off = BUST_OFFSET[n.id] ?? [0, 0];
        return (
          <LineCharacter key={n.id} character={n.character} pose="tree" scale={BUST_SCALE} x={x + off[0]} y={y + off[1]} progress={clamp01((t - land - 0.2) / 0.8)} boil={0.4} zoom={zoom} />
        );
      })}
      {/* Sam's plane */}
      {planeIn ? (
        <div style={{...at(PLANE.at[0] - REGISTRATION.w / 2, PLANE.at[1] - REGISTRATION.h / 2), transform: `rotate(${PLANE.heading}deg) scale(${PLANE.scale})`}}>
          <PopUp spec={PAPER_PLANE} time={t} view={{tilt: 0, perspective: 600}}>
            <PlaneArt />
          </PopUp>
        </div>
      ) : null}
      <Super {...stormSuper} />
      <Super {...treeSuper} />
    </>
  );
};

/** The lower-third labels: each paper names itself as Maya says it (sepia, screen space). */
export const Overlay: React.FC = () => (
  <>
    {B.papersFly.map((p) => (
      <Super key={p.label} text={p.label} ink="sepia" start={p.labelAt} write={0} hold={B.labelSeconds - 0.8} fadeOut={0.3} anchor={{screen: 'lower-third'}} />
    ))}
  </>
);

export const Chapter: React.FC = () => <ChapterShell id={ID} art={<Art />} overlay={<Overlay />} />;
