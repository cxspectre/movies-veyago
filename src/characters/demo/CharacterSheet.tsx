// CharacterSheet.tsx — the Gate 1 style test: `CharacterSheet-wide` (all seven standing on paper, evenly lit) and
// `Maya-poses-wide` (Maya's poses plus one swap caught mid-redraw). The figures draw on over DRAW_SECONDS, then hold.
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {COLORS, sec} from '../../film';
import {PaperSheet} from '../../paper';
import {CHARACTER_IDS, DESIGNS} from '../designs';
import {SWAP} from '../figure';
import {LineCharacter} from '../LineCharacter';
import type {CharacterId, PoseId} from '../types';

const DRAW_SECONDS = 3;
export const CHARACTER_SHEET_FRAMES = sec(6);
const WIDE = {width: 1920, height: 1080} as const;
const LAMP_FLAT = {azimuth: 205, elevation: 62, strength: 0.75, warmth: 0.35};

const Caption: React.FC<{x: number; y: number; text: string; width?: number}> = ({x, y, text, width = 240}) => (
  <div style={{position: 'absolute', left: x - width / 2, top: y, width, textAlign: 'center', fontFamily: 'DM Sans', fontWeight: 500, fontSize: 20, color: COLORS.graphite, opacity: 0.55}}>{text}</div>
);

const Paper: React.FC<{children: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{background: COLORS.paperShade}}>
    <PaperSheet width={WIDE.width} height={WIDE.height} curl={0} lift={0} lamp={LAMP_FLAT} falloff={0.02}>
      {children}
    </PaperSheet>
  </AbsoluteFill>
);

const drawProgress = (frame: number, startFrame = 0): number => Math.min(1, Math.max(0, (frame - startFrame) / sec(DRAW_SECONDS)));

const SHEET_GROUND = 790;
const SHEET_X0 = 180;
const SHEET_STEP = 262;

export const CharacterSheet: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Paper>
      {CHARACTER_IDS.map((id: CharacterId, i) => {
        const x = SHEET_X0 + i * SHEET_STEP;
        const d = DESIGNS[id];
        return (
          <React.Fragment key={id}>
            <LineCharacter character={id} pose="stand" x={x} y={SHEET_GROUND} progress={drawProgress(frame, i * 4)} />
            <Caption x={x} y={SHEET_GROUND + 40} text={`${d.name} · ${d.height}`} />
          </React.Fragment>
        );
      })}
      <Caption x={WIDE.width / 2} y={60} text="The design sheet: standing, scale 1, one accent detail each" width={900} />
    </Paper>
  );
};

type Slot = {pose: PoseId; x: number; y: number; label: string; swapFrom?: PoseId; boil?: number};
const ROW1 = 470;
const ROW2 = 1000;
const MAYA_SLOTS: readonly Slot[] = [
  {pose: 'stand', x: 220, y: ROW1, label: 'stand'},
  {pose: 'doorway', x: 620, y: ROW1, label: 'doorway'},
  {pose: 'tap', x: 1020, y: ROW1, label: 'tap'},
  {pose: 'window', x: 1420, y: ROW1 - 160, label: 'window (bust)'},
  {pose: 'tree', x: 1700, y: ROW1 - 160, label: 'tree (bust)'},
  {pose: 'sit-A', x: 260, y: ROW2, label: 'sit-A'},
  {pose: 'sit-B', x: 660, y: ROW2, label: 'sit-B (boil 3)', boil: 3},
  {pose: 'look-up', x: 1060, y: ROW2, label: 'look-up'},
  {pose: 'sit-B', x: 1500, y: ROW2, label: 'swap sit-A → sit-B, mid-redraw', swapFrom: 'sit-A'},
];
const SWAP_AT = 0.6;

export const MayaPoses: React.FC = () => {
  const frame = useCurrentFrame();
  const swapping = frame >= sec(DRAW_SECONDS);
  const swapProgress = swapping ? SWAP_AT + (((frame - sec(DRAW_SECONDS)) % SWAP.frames) / SWAP.frames) * 0 : 0;
  return (
    <Paper>
      {MAYA_SLOTS.map((s) => (
        <React.Fragment key={s.label}>
          {s.swapFrom && swapping ? (
            <LineCharacter character="maya" pose={s.pose} swapFrom={s.swapFrom} swapProgress={swapProgress} x={s.x} y={s.y} scale={0.9} rough={false} />
          ) : (
            <LineCharacter character="maya" pose={s.swapFrom ?? s.pose} x={s.x} y={s.y} scale={0.9} boil={s.boil} progress={drawProgress(frame)} />
          )}
          <Caption x={s.x} y={s.y + 36} text={s.label} width={320} />
        </React.Fragment>
      ))}
      <Caption x={WIDE.width / 2} y={40} text="Maya, sepia, scale 0.9" width={600} />
    </Paper>
  );
};
