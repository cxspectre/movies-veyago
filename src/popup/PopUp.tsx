// PopUp.tsx — lifts a flat drawing into a folded paper object: hinged panels in CSS 3D, a one-sided lamp shadow,
// a thin paper edge and paper tooth. Deterministic (a pure function of the spec and the time).
import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS} from '../film';
import {DEFAULT_LAMP, shade, textureUrl, TEXTURES, type Lamp} from '../paper';
import {evaluate, type PanelState} from './fold';
import {faceOverlay, shadowShapes} from './light';
import {matrix3d, mul, translation} from './math';
import type {Panel, PopUpLook, PopUpSpec, PopUpView} from './types';

export type PopUpProps = {
  readonly spec: PopUpSpec;
  /** Time in seconds (default: the current frame / fps, i.e. module-local time). */
  readonly time?: number;
  readonly view?: PopUpView;
  readonly look?: PopUpLook;
  /** The flat drawing in net coordinates (spec.size box); each panel shows its own piece of it. A function draws per panel. */
  readonly children?: React.ReactNode | ((panel: Panel) => React.ReactNode);
  readonly style?: React.CSSProperties;
};

const DEFAULT_TILT = 24;
const DEFAULT_PERSPECTIVE = 1500;
const DEFAULT_THICKNESS = 1.6;
const DEFAULT_REACH = 0.5;
const SHADOW_Z = 0.4;
const SHADOW_MARGIN = 40;
const EDGE_COLOR = '#CFC6B1';
const BACK_COLOR = '#E9E2D2';

const fill: React.CSSProperties = {position: 'absolute', inset: 0, pointerEvents: 'none'};

const clipPath = (panel: Panel): string | undefined =>
  panel.clip ? `polygon(${panel.clip.map(([x, y]) => `${x}% ${y}%`).join(',')})` : undefined;

const paperBackground = (panel: Panel, grain: {x: number; y: number}): React.CSSProperties => ({
  backgroundColor: COLORS.paper,
  backgroundImage: `url(${textureUrl('paper')})`,
  backgroundSize: `${TEXTURES.paper.logical}px ${TEXTURES.paper.logical}px`,
  backgroundPosition: `${-(panel.rect.x + grain.x)}px ${-(panel.rect.y + grain.y)}px`,
});

const Face: React.FC<{state: PanelState; lamp: Lamp; spec: PopUpSpec; grain: {x: number; y: number}; thickness: number; children: PopUpProps['children']}> = ({
  state,
  lamp,
  spec,
  grain,
  thickness,
  children,
}) => {
  const {panel, normal} = state;
  const {w, h} = panel.rect;
  const cut = clipPath(panel);
  const art = typeof children === 'function' ? children(panel) : children;
  const back: Vec3Tuple = [-normal[0], -normal[1], -normal[2]];
  return (
    <>
      <div style={{...fill, width: w, height: h, backfaceVisibility: 'hidden', clipPath: cut, overflow: 'hidden', ...paperBackground(panel, grain)}}>
        {art !== undefined && art !== null ? (
          <div style={{position: 'absolute', left: -panel.rect.x, top: -panel.rect.y, width: spec.size.w, height: spec.size.h}}>{art}</div>
        ) : null}
        {panel.tint ? <div style={{...fill, background: panel.tint}} /> : null}
        <div style={{...fill, background: faceOverlay(lamp, normal)}} />
        <div style={{...fill, boxShadow: `inset 0 0 0 0.6px ${shade(0.18)}, inset 0 0 14px ${shade(0.05)}`}} />
      </div>
      <div
        style={{
          ...fill,
          width: w,
          height: h,
          backfaceVisibility: 'hidden',
          clipPath: cut,
          transform: `translateZ(${-thickness}px) rotateY(180deg)`,
          backgroundColor: BACK_COLOR,
          backgroundImage: `url(${textureUrl('paper')})`,
          backgroundSize: `${TEXTURES.paper.logical}px ${TEXTURES.paper.logical}px`,
          backgroundPosition: `${panel.rect.x + grain.x}px ${-(panel.rect.y + grain.y)}px`,
        }}
      >
        <div style={{...fill, background: faceOverlay(lamp, back)}} />
        <div style={{...fill, boxShadow: `inset 0 0 0 0.6px ${shade(0.2)}`}} />
      </div>
      {cut ? null : <Edges w={w} h={h} t={thickness} />}
    </>
  );
};

type Vec3Tuple = readonly [number, number, number];

/** The four thin strips that give a rectangular panel its paper thickness. */
const Edges: React.FC<{w: number; h: number; t: number}> = ({w, h, t}) => {
  const strip: React.CSSProperties = {position: 'absolute', background: EDGE_COLOR, transformOrigin: '0 0', backfaceVisibility: 'visible'};
  return (
    <>
      <div style={{...strip, left: 0, top: 0, width: w, height: t, transform: 'rotateX(-90deg)'}} />
      <div style={{...strip, left: 0, top: h, width: w, height: t, transform: 'rotateX(-90deg)'}} />
      <div style={{...strip, left: 0, top: 0, width: t, height: h, transform: 'rotateY(90deg)'}} />
      <div style={{...strip, left: w, top: 0, width: t, height: h, transform: 'rotateY(90deg)'}} />
    </>
  );
};

const Shadow: React.FC<{states: readonly PanelState[]; lamp: Lamp; reach: number; strength: number}> = ({states, lamp, reach, strength}) => {
  const shapes = shadowShapes(states, lamp, reach);
  if (shapes.length === 0) return null;
  const xs = shapes.flatMap((s) => s.points.map((p) => p[0]));
  const ys = shapes.flatMap((s) => s.points.map((p) => p[1]));
  const x0 = Math.min(...xs) - SHADOW_MARGIN;
  const y0 = Math.min(...ys) - SHADOW_MARGIN;
  const w = Math.max(...xs) - x0 + SHADOW_MARGIN;
  const h = Math.max(...ys) - y0 + SHADOW_MARGIN;
  const layers = [
    {blur: 1.6, alpha: 0.22},
    {blur: 7, alpha: 0.15},
    {blur: 22, alpha: 0.09},
  ];
  return (
    <>
      {layers.map((layer) => (
        <svg
          key={layer.blur}
          width={w}
          height={h}
          viewBox={`${x0} ${y0} ${w} ${h}`}
          style={{position: 'absolute', left: x0, top: y0, overflow: 'visible', filter: `blur(${layer.blur}px)`, transform: `translateZ(${SHADOW_Z}px)`, pointerEvents: 'none'}}
        >
          <g fill="rgb(48,34,20)" opacity={Math.min(1, layer.alpha * lamp.strength * strength)}>
            {shapes.map((s) => (
              <polygon key={s.id} points={s.points.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ')} />
            ))}
          </g>
        </svg>
      ))}
    </>
  );
};

export const PopUp: React.FC<PopUpProps> = ({spec, time, view, look, children, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = time ?? frame / fps;
  const lamp = look?.lamp ?? DEFAULT_LAMP;
  const thickness = look?.thickness ?? DEFAULT_THICKNESS;
  const grain = look?.grainOffset ?? {x: 0, y: 0};
  const states = evaluate(spec, t);
  const tilt = view?.tilt ?? DEFAULT_TILT;
  const yaw = view?.yaw ?? 0;
  return (
    <div style={{position: 'relative', width: spec.size.w, height: spec.size.h, perspective: view?.perspective ?? DEFAULT_PERSPECTIVE, perspectiveOrigin: '50% 50%', ...style}}>
      <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateX(${tilt}deg) rotateZ(${yaw}deg)`}}>
        <Shadow states={states} lamp={lamp} reach={look?.reach ?? DEFAULT_REACH} strength={look?.shadow ?? 1} />
        {states
          .filter((s) => s.visible)
          .map((s) => (
            <div
              key={s.panel.id}
              style={{position: 'absolute', left: 0, top: 0, width: s.panel.rect.w, height: s.panel.rect.h, transformStyle: 'preserve-3d', transformOrigin: '0 0', transform: matrix3d(mul(s.world, translation(s.panel.rect.x, s.panel.rect.y)))}}
            >
              <Face state={s} lamp={lamp} spec={spec} grain={grain} thickness={thickness}>
                {children}
              </Face>
            </div>
          ))}
      </div>
    </div>
  );
};
