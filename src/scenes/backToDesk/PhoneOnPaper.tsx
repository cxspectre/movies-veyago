// PhoneOnPaper.tsx — the real iPhone lying face up on the drawn home: the device rig's Phone3D seen straight down
// (FOV at its flat minimum), showing binder-home.png, its void clipped away to the body's own rounded outline so it
// sits on the paper, with a contact shadow under it and the lamp's soft diagonal reflection on the glass (8%).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {DeviceStage, MIN_FOV_DEG, Phone3D, PHONE} from '../../devices';
import {shadowRgba, SHADOWS, type DeskPoint} from '../../desk';
import type {FormatName} from '../../film';
import {FORMATS} from '../../film';

/** What the screen shows: the clean still of the binder home the drawing was built on (the Island is drawn by the rig). */
export const PHONE_SCREEN = 'footage/binder-home.png';
/** The lamp's reflection on the glass: a soft diagonal band at 8% (BIBLE §6.4). */
const REFLECTION_LEVEL = 0.08;
/** Lamp light colour on the glass (BIBLE §2.1, back-to-desk lamp #FFE2B8). */
const LAMP_RGB = '255, 226, 184';
/** The clip sits this far inside the body edge (frame px) so no black void survives at the rim. */
const CLIP_INSET = 0.6;
/** Contact shadow right under the body (BIBLE §2.1: "a contact shadow"). */
const CONTACT = {x: 1.2, y: 1.6, blur: 2.5, opacity: 0.5} as const;

type Box = {readonly cx: number; readonly cy: number; readonly w: number; readonly h: number; readonly r: number; readonly rotation: number};

const rotate = (b: Box, x: number, y: number): string => {
  const a = (b.rotation * Math.PI) / 180;
  const px = b.cx + x * Math.cos(a) - y * Math.sin(a);
  const py = b.cy + x * Math.sin(a) + y * Math.cos(a);
  return `${px.toFixed(2)} ${py.toFixed(2)}`;
};

/** SVG path of a rounded rectangle turned about its centre (circular corners stay circular under rotation). */
export const roundedRectPath = (b: Box): string => {
  const hw = b.w / 2;
  const hh = b.h / 2;
  const r = Math.min(b.r, hw, hh);
  const arc = (x: number, y: number): string => `A ${r.toFixed(2)} ${r.toFixed(2)} 0 0 1 ${rotate(b, x, y)}`;
  return [
    `M ${rotate(b, -hw + r, -hh)}`,
    `L ${rotate(b, hw - r, -hh)}`,
    arc(hw, -hh + r),
    `L ${rotate(b, hw, hh - r)}`,
    arc(hw - r, hh),
    `L ${rotate(b, -hw + r, hh)}`,
    arc(-hw, hh - r),
    `L ${rotate(b, -hw, -hh + r)}`,
    arc(-hw + r, -hh),
    'Z',
  ].join(' ');
};

const boxStyle = (b: Box): React.CSSProperties => ({
  position: 'absolute',
  left: b.cx - b.w / 2,
  top: b.cy - b.h / 2,
  width: b.w,
  height: b.h,
  borderRadius: b.r,
  transform: `rotate(${b.rotation}deg)`,
});

export type PhoneOnPaperProps = {
  readonly format: FormatName;
  /** Body centre in frame px. */
  readonly centre: DeskPoint;
  /** Body height in frame px. */
  readonly height: number;
  /** Clockwise, degrees (as the desk props are). */
  readonly rotation: number;
  /** Camera scale (the shadow table is in logical px at 1.0). */
  readonly cameraScale: number;
};

export const PhoneOnPaper: React.FC<PhoneOnPaperProps> = ({format, centre, height, rotation, cameraScale}) => {
  const {width: fw, height: fh} = FORMATS[format];
  const body: Box = {cx: centre.x, cy: centre.y, w: PHONE.outline.width * height, h: height, r: PHONE.outline.radius * height, rotation};
  const clip: Box = {...body, w: body.w - CLIP_INSET * 2, h: body.h - CLIP_INSET * 2, r: body.r - CLIP_INSET};
  const screen: Box = {...body, w: PHONE.screen.width * height, h: PHONE.screen.height * height, r: PHONE.screen.radius * height};
  const s = SHADOWS.phone;
  const shadow = `${(s.x * cameraScale).toFixed(2)}px ${(s.y * cameraScale).toFixed(2)}px ${(s.blur * cameraScale).toFixed(2)}px ${shadowRgba(s.color, s.opacity)}, ${CONTACT.x * cameraScale}px ${CONTACT.y * cameraScale}px ${CONTACT.blur}px ${shadowRgba(s.color, CONTACT.opacity)}`;
  return (
    <AbsoluteFill>
      <div style={{...boxStyle(body), boxShadow: shadow}} />
      <AbsoluteFill style={{clipPath: `path('${roundedRectPath(clip)}')`}}>
        <DeviceStage fov={MIN_FOV_DEG} bloom={false}>
          <Phone3D
            placement={{x: centre.x / fw, y: centre.y / fh, height}}
            rotation={{z: -rotation}}
            screen={{kind: 'image', src: PHONE_SCREEN}}
            island
            edgeLight={{intensity: 0}}
            glow={0}
          />
        </DeviceStage>
      </AbsoluteFill>
      <div
        style={{
          ...boxStyle(screen),
          overflow: 'hidden',
          background: `linear-gradient(118deg, rgba(${LAMP_RGB},0) 18%, rgba(${LAMP_RGB},${REFLECTION_LEVEL}) 34%, rgba(${LAMP_RGB},${(REFLECTION_LEVEL * 0.7).toFixed(3)}) 50%, rgba(${LAMP_RGB},0) 66%)`,
        }}
      />
    </AbsoluteFill>
  );
};
