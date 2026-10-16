// PaperSheet.tsx — an A3 landscape sheet of warm off-white drawing paper lying on the desk under the lamp:
// fibre/tooth texture, slight edge shading, a corner that lifts a little, and a soft one-sided shadow.
// Children (e.g. <GraphiteSketch>) are drawn ON the paper, under its lighting.
import React from 'react';
import {COLORS} from '../film';
import {castShadow, DEFAULT_LAMP, type Lamp, lampFalloff, lampTint, lampVector, shade, shadowOffset} from './lamp';
import {TEXTURES, textureUrl} from './textures';
import {SKETCH_SIZE} from './types';

export type Corner = 'tl' | 'tr' | 'bl' | 'br';

export type PaperSheetProps = {
  readonly width?: number;
  readonly height?: number;
  readonly lamp?: Lamp;
  /** Which corner curls up, and how much (0 = flat, 1 = a clearly lifted corner). */
  readonly curlCorner?: Corner;
  readonly curl?: number;
  /** Height of the sheet's body above the desk (paper is never perfectly flat). Default 2.5 px. */
  readonly lift?: number;
  /** Shifts the paper grain; pass the same offset to <GraphiteSketch grainOffset>. */
  readonly grainOffset?: {x: number; y: number};
  /** Strength of the lamp falloff across the sheet (0 = none). Default 0.06. */
  readonly falloff?: number;
  readonly style?: React.CSSProperties;
  readonly children?: React.ReactNode;
};

const CORNER_POS: Record<Corner, {x: number; y: number}> = {tl: {x: 0, y: 0}, tr: {x: 1, y: 0}, bl: {x: 0, y: 1}, br: {x: 1, y: 1}};
const CORNER_KEYWORD: Record<Corner, string> = {tl: 'to top left', tr: 'to top right', bl: 'to bottom left', br: 'to bottom right'};
const CURL_HEIGHT = 22; // px the corner rises at curl = 1
const CURL_REACH = 170; // px of sheet the curl affects

const fill: React.CSSProperties = {position: 'absolute', inset: 0, pointerEvents: 'none'};

/** The faint shadow pooled under a lifted corner (drawn under the sheet, so only its edge shows). */
const CornerShadow: React.FC<{lamp: Lamp; corner: Corner; curl: number; width: number; height: number}> = ({lamp, corner, curl, width, height}) => {
  const c = CORNER_POS[corner];
  const o = shadowOffset(lamp, CURL_HEIGHT * curl);
  const size = CURL_REACH * (0.6 + curl * 0.6);
  return (
    <div
      style={{
        position: 'absolute',
        left: c.x * width - size + o.x,
        top: c.y * height - size + o.y,
        width: size * 2,
        height: size * 2,
        background: `radial-gradient(closest-side, rgba(48,34,20,${(0.6 * curl * lamp.strength).toFixed(3)}), rgba(48,34,20,${(0.22 * curl * lamp.strength).toFixed(3)}) 50%, rgba(48,34,20,0) 100%)`,
        pointerEvents: 'none',
      }}
    />
  );
};

/** Lighting over the paper and its drawing: falloff, edge darkening, the lit edge, and the curl's shading. */
const SheetLight: React.FC<{lamp: Lamp; corner: Corner; curl: number; falloff: number}> = ({lamp, corner, curl, falloff}) => {
  const v = lampVector(lamp);
  const lit = `${(-v.x * 1.2).toFixed(2)}px ${(-v.y * 1.2).toFixed(2)}px 0 rgba(255,255,255,0.5)`;
  const curlStart = 100 - (CURL_REACH / 9) * Math.max(0.15, curl);
  return (
    <>
      <div style={{...fill, background: lampFalloff(lamp, falloff)}} />
      <div style={{...fill, boxShadow: `inset ${lit}, inset 0 0 22px rgba(90,70,40,0.07), inset 0 0 3px rgba(90,70,40,0.08)`}} />
      {curl > 0 ? (
        <>
          {/* The lifted corner tilts back toward the lamp: a soft highlight, then a darker rim where it turns. */}
          <div
            style={{
              ...fill,
              background: `linear-gradient(${CORNER_KEYWORD[corner]}, ${lampTint(lamp, 0)} ${curlStart.toFixed(1)}%, ${lampTint(lamp, 0.22 * curl)} ${(curlStart + (100 - curlStart) * 0.7).toFixed(1)}%, ${lampTint(lamp, 0)} 100%)`,
            }}
          />
          <div
            style={{
              ...fill,
              background: `linear-gradient(${CORNER_KEYWORD[corner]}, ${shade(0)} ${(curlStart + (100 - curlStart) * 0.8).toFixed(1)}%, ${shade(0.12 * curl)} 100%)`,
            }}
          />
        </>
      ) : null}
    </>
  );
};

export const PaperSheet: React.FC<PaperSheetProps> = ({
  width = SKETCH_SIZE.width,
  height = SKETCH_SIZE.height,
  lamp = DEFAULT_LAMP,
  curlCorner = 'br',
  curl = 0.35,
  lift = 6,
  grainOffset = {x: 0, y: 0},
  falloff = 0.06,
  style,
  children,
}) => (
  <div style={{position: 'relative', width, height, ...style}}>
    {curl > 0 ? <CornerShadow lamp={lamp} corner={curlCorner} curl={curl} width={width} height={height} /> : null}
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: COLORS.paper,
        backgroundImage: `url(${textureUrl('paper')})`,
        backgroundSize: `${TEXTURES.paper.logical}px ${TEXTURES.paper.logical}px`,
        backgroundPosition: `${-grainOffset.x}px ${-grainOffset.y}px`,
        boxShadow: castShadow(lamp, {height: lift}),
        overflow: 'hidden',
        isolation: 'isolate',
      }}
    >
      {children}
      <SheetLight lamp={lamp} corner={curlCorner} curl={curl} falloff={falloff} />
    </div>
  </div>
);
