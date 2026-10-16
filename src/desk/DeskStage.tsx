// DeskStage.tsx — the desk with its props laid out per BIBLE §2.10, for the coldOpen, desk, wall and backToDesk
// modules. Children are placed in DESK coORDINATES (the wide-desk framing at scale 1.0); the `camera` frames them.
// Props below the sheets (ruler, eraser, pad, blank stack) render under the children; tall props (the cups, the
// phone) render over them. Each prop can be hidden or nudged; the cup can be mid set-down.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import type {FormatName} from '../film';
import {DeskSurface, type Lamp} from '../paper';
import {DESK_LAYOUT, type DeskLayout, type DeskPoint, type DeskPropId} from './layout';
import {DESK_LAMP} from './palette';
import {BlankSheetStack} from './props/BlankSheetStack';
import {CoffeeCup} from './props/CoffeeCup';
import {PencilCup} from './props/PencilCup';
import {Placed} from './props/Placed';
import {Ruler} from './props/Ruler';
import {Eraser, FaceDownPhone, StickyPad} from './props/SmallProps';
import type {PencilKind} from './props/pencilArt';

export type DeskCamera = {
  /** 1 = the whole desk fills the frame (BIBLE §2.8 framings are in this unit). */
  readonly scale: number;
  /** Desk point at the centre of the frame. */
  readonly centre: DeskPoint;
};

export type DeskStageProps = {
  readonly format: FormatName;
  readonly camera?: DeskCamera;
  readonly lamp?: Lamp;
  /** Per-prop visibility (default: everything shown). */
  readonly show?: Partial<Record<DeskPropId, boolean>>;
  /** Per-prop nudge in desk px. */
  readonly offsets?: Partial<Record<DeskPropId, DeskPoint>>;
  /** 0 = the cup is held above the desk, 1 = resting (default). */
  readonly cupSetDown?: number;
  /** The pencils standing in the cup (the one in the hand is not in the cup). */
  readonly cupPencils?: readonly PencilKind[];
  /** Props drawn over the children (default: coffee cup, pencil cup, phone) and under them (the rest). */
  readonly over?: readonly DeskPropId[];
  readonly vignette?: number;
  readonly falloff?: number;
  /** On the desk, under the tall props. */
  readonly children?: React.ReactNode;
  /** Over everything, in desk coordinates: hands reaching across the cups. */
  readonly above?: React.ReactNode;
};

const DEFAULT_OVER: readonly DeskPropId[] = ['coffeeCup', 'pencilCup', 'phone'];

const cameraTransform = (layout: DeskLayout, cam: DeskCamera): string => {
  const tx = layout.width / 2 - cam.centre.x * cam.scale;
  const ty = layout.height / 2 - cam.centre.y * cam.scale;
  return `translate(${tx.toFixed(3)}px, ${ty.toFixed(3)}px) scale(${cam.scale.toFixed(5)})`;
};

const PropAt: React.FC<{id: DeskPropId; layout: DeskLayout; offsets: DeskStageProps['offsets']; show: DeskStageProps['show']; cupSetDown: number; cupPencils: readonly PencilKind[]}> = ({id, layout, offsets, show, cupSetDown, cupPencils}) => {
  if (show?.[id] === false) return null;
  const offset = offsets?.[id];
  switch (id) {
    case 'pencilCup':
      return (
        <Placed centre={layout.pencilCup.centre} offset={offset}>
          <PencilCup r={layout.pencilCup.size.w / 2} pencils={cupPencils} />
        </Placed>
      );
    case 'coffeeCup':
      return (
        <Placed centre={layout.coffeeCup.centre} offset={offset}>
          <CoffeeCup r={layout.coffeeCup.size.w / 2} setDown={cupSetDown} />
        </Placed>
      );
    case 'eraser':
      return (
        <Placed centre={layout.eraser.centre} rotation={layout.eraser.rotation} offset={offset}>
          <Eraser w={layout.eraser.size.w} h={layout.eraser.size.h} />
        </Placed>
      );
    case 'ruler': {
      const r = layout.ruler;
      const centre = {x: (r.from.x + r.to.x) / 2, y: (r.from.y + r.to.y) / 2};
      const along = (Math.atan2(r.to.y - r.from.y, r.to.x - r.from.x) * 180) / Math.PI;
      return (
        <Placed centre={centre} rotation={along + r.rotation} offset={offset}>
          <Ruler w={r.size.w} h={r.size.h} />
        </Placed>
      );
    }
    case 'stickyPad':
      return (
        <Placed centre={layout.stickyPad.centre} rotation={layout.stickyPad.rotation} offset={offset}>
          <StickyPad w={layout.stickyPad.size.w} h={layout.stickyPad.size.h} />
        </Placed>
      );
    case 'phone':
      return (
        <Placed centre={layout.phone.centre} rotation={layout.phone.rotation} offset={offset}>
          <FaceDownPhone w={layout.phone.size.w} h={layout.phone.size.h} />
        </Placed>
      );
    case 'blankStack':
      return (
        <Placed centre={layout.blankStack.centre} rotation={layout.blankStack.rotation} offset={offset}>
          <BlankSheetStack count={layout.blankStack.count} scale={layout.blankStack.scale} rotationStep={layout.blankStack.rotationStep} />
        </Placed>
      );
    default:
      return null;
  }
};

export const DeskStage: React.FC<DeskStageProps> = ({format, camera, lamp = DESK_LAMP, show, offsets, cupSetDown = 1, cupPencils = ['accent', 'graphite'], over = DEFAULT_OVER, vignette, falloff, children, above}) => {
  const layout = DESK_LAYOUT[format];
  const cam: DeskCamera = camera ?? {scale: 1, centre: {x: layout.width / 2, y: layout.height / 2}};
  const under: DeskPropId[] = (['ruler', 'eraser', 'stickyPad', 'blankStack', 'pencilCup', 'coffeeCup', 'phone'] as const).filter((id) => !over.includes(id));
  const common = {layout, offsets, show, cupSetDown, cupPencils};
  return (
    <DeskSurface
      lamp={lamp}
      textureScale={cam.scale}
      pan={{x: cam.centre.x * cam.scale - layout.width / 2, y: cam.centre.y * cam.scale - layout.height / 2}}
      vignette={vignette}
      falloff={falloff}
    >
      <AbsoluteFill style={{transform: cameraTransform(layout, cam), transformOrigin: '0 0'}}>
        {under.map((id) => (
          <PropAt key={id} id={id} {...common} />
        ))}
        {children}
        {over.map((id) => (
          <PropAt key={id} id={id} {...common} />
        ))}
        {above}
      </AbsoluteFill>
    </DeskSurface>
  );
};

/** A sheet-sized box at a layout slot: put a <PaperSheet> (and its sketch) inside; coordinates inside are sketch px. */
export const SheetAt: React.FC<{centre: DeskPoint; scale: number; rotation: number; offset?: DeskPoint; children: React.ReactNode; style?: React.CSSProperties}> = ({centre, scale, rotation, offset, children, style}) => (
  <div
    style={{
      position: 'absolute',
      left: centre.x + (offset?.x ?? 0),
      top: centre.y + (offset?.y ?? 0),
      width: 0,
      height: 0,
      transform: `rotate(${rotation}deg) scale(${scale})`,
      ...style,
    }}
  >
    <div style={{position: 'absolute', left: -600, top: -425}}>{children}</div>
  </div>
);
