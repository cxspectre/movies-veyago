// BlankSheetStack.tsx — a few blank A3 sheets, each turned a degree more than the one under it, using the engine's
// PaperSheet so paper is paper everywhere on the desk. Centred on the stack's centre.
import React from 'react';
import {type Lamp, PaperSheet, SKETCH_SIZE} from '../../paper';
import {DESK_LAMP} from '../palette';

export type BlankSheetStackProps = {
  readonly count?: number;
  /** Scale of each 1200x850 sheet (BIBLE 0.55 wide, 0.45 tall). */
  readonly scale?: number;
  /** Degrees each sheet up the stack turns more. */
  readonly rotationStep?: number;
  readonly lamp?: Lamp;
  /** The stack's base rotation is applied by the caller (Placed); this is the per-sheet drift in px. */
  readonly drift?: number;
  readonly style?: React.CSSProperties;
};

export const BlankSheetStack: React.FC<BlankSheetStackProps> = ({count = 4, scale = 0.55, rotationStep = 1, lamp = DESK_LAMP, drift = 2, style}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, ...style}}>
    {Array.from({length: count}, (_, i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transform: `translate(${(i * drift).toFixed(1)}px, ${(i * drift * 0.6).toFixed(1)}px) rotate(${i * rotationStep}deg) scale(${scale}) translate(-50%, -50%)`,
          transformOrigin: '0 0',
          width: SKETCH_SIZE.width,
          height: SKETCH_SIZE.height,
        }}
      >
        <PaperSheet lamp={lamp} lift={i === 0 ? 4 : 1.5} curl={i === count - 1 ? 0.25 : 0} grainOffset={{x: i * 137, y: i * 89}} />
      </div>
    ))}
  </div>
);
