// PaperPhase.tsx — local 0.0-7.0: the centre sheet on the desk in the wall's last framing, its graphite turning to
// light stroke by stroke while the paper fades (BIBLE 3 "How the paper fades"): texture, shadows and vignette go
// first, then the paper colour goes to black, then everything outside the phone outline. At 7.0 only light is left.
import React, {useMemo} from 'react';
import {COLORS, type FormatName} from '../../film';
import {VoidBackground} from '../../glass';
import {castShadow, DEFAULT_LAMP, DeskSurface, lampFalloff, lampVector, PencilCanvas, SKETCH_SIZE, TEXTURES, textureUrl} from '../../paper';
import {graphiteRemainderAt, graphiteRemains, lightItemsAt} from './conversion';
import {pageTransform, poseAt, stretchAt, type Size} from './geometry';
import {PageHairlines, PhoneHairlines} from './HairlineLayers';
import {blackness, graphiteLevel, offPhoneLevel, paperHaloLevel, textureLevel} from './timing';

/** The sheet lies a little above the desk (PaperSheet's default). */
const SHEET_LIFT_PX = 6;
const SHEET_FALLOFF = 0.06;
const lamp = DEFAULT_LAMP;

const fill: React.CSSProperties = {position: 'absolute', inset: 0, pointerEvents: 'none'};

const hexToRgb = (hex: string): readonly [number, number, number] => {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** The paper colour on its way to black, as a CSS colour. */
export const paperColour = (black: number): string => {
  const [r, g, b] = hexToRgb(COLORS.paper);
  const [vr, vg, vb] = hexToRgb(COLORS.void);
  const k = Math.max(0, Math.min(1, black));
  return `rgb(${Math.round(r + (vr - r) * k)}, ${Math.round(g + (vg - g) * k)}, ${Math.round(b + (vb - b) * k)})`;
};

/** The sheet's own light (PaperSheet's falloff and edge shading), scaled to the page zoom. */
const SheetLight: React.FC<{scale: number; opacity: number}> = ({scale, opacity}) => {
  const v = lampVector(lamp);
  const lit = `${(-v.x * 1.2 * scale).toFixed(2)}px ${(-v.y * 1.2 * scale).toFixed(2)}px 0 rgba(255,255,255,0.5)`;
  return (
    <>
      <div style={{...fill, background: lampFalloff(lamp, SHEET_FALLOFF), opacity}} />
      <div style={{...fill, boxShadow: `inset ${lit}, inset 0 0 ${(22 * scale).toFixed(1)}px rgba(90,70,40,0.07), inset 0 0 ${(3 * scale).toFixed(1)}px rgba(90,70,40,0.08)`, opacity}} />
    </>
  );
};

export type PaperPhaseProps = {readonly t: number; readonly format: FormatName; readonly size: Size};

export const PaperPhase: React.FC<PaperPhaseProps> = ({t, format, size}) => {
  const page = pageTransform(format, size);
  const pose = poseAt(t, format, size);
  const stretch = stretchAt(t);
  const texture = textureLevel(t);
  const black = blackness(t);
  const offPhone = offPhoneLevel(t);
  const paperHalo = paperHaloLevel(t);
  const graphite = useMemo(() => (graphiteRemains(t) ? graphiteRemainderAt(t) : null), [t]);
  const phoneItems = useMemo(() => lightItemsAt(t, {which: 'phone'}), [t]);
  const pageItems = useMemo(() => (offPhone > 0 ? lightItemsAt(t, {which: 'offPhone'}) : []), [t, offPhone]);
  const sheet = {left: page.left, top: page.top, width: SKETCH_SIZE.width * page.scale, height: SKETCH_SIZE.height * page.scale};
  return (
    <VoidBackground>
      {texture > 0 ? (
        <div style={{...fill, opacity: texture}}>
          <DeskSurface lamp={lamp} textureScale={page.scale} />
        </div>
      ) : null}
      <div style={{position: 'absolute', ...sheet, opacity: offPhone}}>
        {texture > 0 ? <div style={{...fill, boxShadow: castShadow(lamp, {height: SHEET_LIFT_PX}), opacity: texture}} /> : null}
        <div style={{...fill, backgroundColor: paperColour(black)}} />
        {texture > 0 ? (
          <div
            style={{
              ...fill,
              backgroundImage: `url(${textureUrl('paper')})`,
              backgroundSize: `${TEXTURES.paper.logical * page.scale}px ${TEXTURES.paper.logical * page.scale}px`,
              opacity: texture,
            }}
          />
        ) : null}
        {graphite ? (
          <div style={{position: 'absolute', left: 0, top: 0, width: SKETCH_SIZE.width, height: SKETCH_SIZE.height, transform: `scale(${page.scale})`, transformOrigin: '0 0', opacity: graphiteLevel(t)}}>
            <PencilCanvas marks={graphite} progress={1} width={SKETCH_SIZE.width} height={SKETCH_SIZE.height} zoom={page.scale} />
          </div>
        ) : null}
        {texture > 0 ? <SheetLight scale={page.scale} opacity={texture} /> : null}
      </div>
      {pageItems.length > 0 ? <PageHairlines items={pageItems} page={page} size={size} opacity={offPhone} paperHalo={paperHalo} /> : null}
      <PhoneHairlines items={phoneItems} pose={pose} size={size} stretch={stretch} paperHalo={paperHalo} />
    </VoidBackground>
  );
};
