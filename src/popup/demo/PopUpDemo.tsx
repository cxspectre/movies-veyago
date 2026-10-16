// PopUpDemo.tsx — proof compositions: the house opening, the crumple and the rocket folding up, wide and tall.
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {FPS} from '../../film';
import {PaperSheet} from '../../paper';
import {PopUp} from '../PopUp';
import {HouseArt, MAYAS_HOUSE} from '../presets/house';
import {CRUMPLE_LETTER, EngineArt, LetterArt} from '../presets/crumple';
import {FILTER_MACHINE, MachineArt} from '../presets/machine';
import {ROCKET, RocketArt} from '../presets/rocket';

export const POPUP_DEMO_FRAMES = 8 * FPS;
const SWAP_AT = 4.0;

type Slot = {readonly x: number; readonly y: number; readonly scale: number};
const LAYOUT: Record<'wide' | 'tall', {house: Slot; crumple: Slot; rocket: Slot; machine: Slot}> = {
  wide: {
    house: {x: 20, y: 300, scale: 0.5},
    crumple: {x: 700, y: 330, scale: 0.8},
    rocket: {x: 1130, y: 330, scale: 0.6},
    machine: {x: 1450, y: 280, scale: 0.5},
  },
  tall: {
    house: {x: 130, y: 60, scale: 0.65},
    crumple: {x: 40, y: 880, scale: 0.65},
    rocket: {x: 360, y: 860, scale: 0.5},
    machine: {x: 640, y: 880, scale: 0.55},
  },
};

const placed = (s: Slot, w: number, h: number): React.CSSProperties => ({
  position: 'absolute',
  left: s.x,
  top: s.y,
  width: w,
  height: h,
  transformOrigin: '0 0',
  transform: `scale(${s.scale})`,
});

export const PopUpDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const t = frame / FPS;
  const slots = LAYOUT[width > height ? 'wide' : 'tall'];
  return (
    <AbsoluteFill>
      <PaperSheet width={width} height={height} curl={0} falloff={0.04}>
        <div style={placed(slots.house, MAYAS_HOUSE.size.w, MAYAS_HOUSE.size.h)}>
          <PopUp spec={MAYAS_HOUSE} time={t}>
            <HouseArt spec={MAYAS_HOUSE} />
          </PopUp>
        </div>
        <div style={placed(slots.crumple, CRUMPLE_LETTER.size.w, CRUMPLE_LETTER.size.h)}>
          <PopUp spec={CRUMPLE_LETTER} time={t}>
            {t < SWAP_AT ? <LetterArt spec={CRUMPLE_LETTER} /> : <EngineArt spec={CRUMPLE_LETTER} />}
          </PopUp>
        </div>
        <div style={placed(slots.rocket, ROCKET.size.w, ROCKET.size.h)}>
          <PopUp spec={ROCKET} time={t}>
            <RocketArt spec={ROCKET} />
          </PopUp>
        </div>
        <div style={placed(slots.machine, FILTER_MACHINE.size.w, FILTER_MACHINE.size.h)}>
          <PopUp spec={FILTER_MACHINE} time={t}>
            <MachineArt spec={FILTER_MACHINE} />
          </PopUp>
        </div>
      </PaperSheet>
    </AbsoluteFill>
  );
};
