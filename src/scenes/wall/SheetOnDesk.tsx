// SheetOnDesk.tsx — one A3 sheet lying on (or carried just above) the desk at a wall slot, and the static tiles:
// a finished page is an IMAGE (public/tex/pages/<id>.png, CONTRACT §12.6), never the pencil engine.
import React from 'react';
import {Img, staticFile} from 'remotion';
import type {WallTile} from '../../beats';
import {boxShadowOf, DESK_LAMP, dropShadowOf, FaceDownPhone, liftedShadow, SHADOWS, SheetAt, type DeskPoint} from '../../desk';
import {PaperSheet, SKETCH_SIZE, type Lamp} from '../../paper';
import {PROP_MM} from './grid';

/** The page image of each tile; the V1 sheet carries its sticky note (rendered with it, see previews.ts). */
export const pageImage = (tile: Exclude<WallTile, 'phone'>): string => staticFile(`tex/pages/${tile === 'v1-home' ? 'v1-home-note' : tile}.png`);

export type SheetOnDeskProps = {
  readonly centre: DeskPoint;
  readonly rotation: number;
  /** Desk px per sketch px. */
  readonly scale: number;
  /** Height above the desk, px (0 = resting): the shadow drifts and softens. */
  readonly height?: number;
  readonly lamp?: Lamp;
  readonly curl?: number;
  readonly children?: React.ReactNode;
};

/** The sheet's own shadow in desk px, expressed inside the sheet's scaled box. */
const sheetShadow = (scale: number, height: number): string => {
  const e = liftedShadow(SHADOWS.sheet, {height});
  return boxShadowOf({...e, x: e.x / scale, y: e.y / scale, blur: e.blur / scale});
};

export const SheetOnDesk: React.FC<SheetOnDeskProps> = ({centre, rotation, scale, height = 0, lamp = DESK_LAMP, curl = 0, children}) => (
  <SheetAt centre={centre} scale={scale} rotation={rotation}>
    <div style={{position: 'absolute', inset: 0, width: SKETCH_SIZE.width, height: SKETCH_SIZE.height, boxShadow: sheetShadow(scale, height)}} />
    <PaperSheet lamp={lamp} lift={1} curl={curl} curlCorner="br">
      {children}
    </PaperSheet>
  </SheetAt>
);

const fillPage: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: SKETCH_SIZE.width, height: SKETCH_SIZE.height};

/** A finished page as an image on its sheet. */
export const StaticTile: React.FC<Omit<SheetOnDeskProps, 'children'> & {readonly tile: Exclude<WallTile, 'phone'>}> = ({tile, ...sheet}) => (
  <SheetOnDesk {...sheet}>
    <Img src={pageImage(tile)} style={fillPage} />
  </SheetOnDesk>
);

/** The face-down phone, at its physical size on the wall (px per mm), lifted while it is carried. */
export const PhoneOnDesk: React.FC<{readonly centre: DeskPoint; readonly rotation: number; readonly pxPerMm: number; readonly height?: number}> = ({centre, rotation, pxPerMm, height = 0}) => (
  <div style={{position: 'absolute', left: centre.x, top: centre.y, width: 0, height: 0, transform: `rotate(${rotation}deg)`}}>
    {/* The prop's own shadow is the table's; a carried phone throws it further and softer (liftedShadow). */}
    <FaceDownPhone w={PROP_MM.phone.w * pxPerMm} h={PROP_MM.phone.h * pxPerMm} style={{filter: dropShadowOf(liftedShadow(SHADOWS.phone, {height}))}} />
  </div>
);
