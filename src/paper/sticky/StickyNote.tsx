// StickyNote.tsx — a square sticky note with accent hand-lettering, pressed onto the page and smoothed flat.
// The free bottom edge curls up (shading + a shadow under it) until a finger smooths it down.
import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import {castShadow, DEFAULT_LAMP, type Lamp, lampTint, shade, shadowOffset} from '../lamp';
import {compileSketch} from '../marks/compile';
import {PencilCanvas} from '../render/PencilCanvas';
import {LINE_HEIGHT, measureHand, wrapHand} from '../text/handLayout';
import {TEXTURES, textureUrl} from '../textures';
import type {HandFaceKey, Ink, SketchSpec} from '../types';
import {type StickyTiming, stickyState} from './stickyState';

export type StickyNoteProps = StickyTiming & {
  readonly text: string;
  /** Side of the square note, px in the parent's space (default 220 ≈ a 76 mm note on the A3 page). */
  readonly size?: number;
  readonly rotate?: number;
  readonly lamp?: Lamp;
  /** Note paper colour. Default: a muted pale butter that sits quietly next to the one accent. */
  readonly color?: string;
  readonly ink?: Ink;
  readonly face?: HandFaceKey;
  /** Lettering size, px (default 15% of the note). */
  readonly textSize?: number;
  /** If set, the lettering writes itself over [writeAt, writeAt + writeFrames] instead of being already there. */
  readonly writeAt?: number;
  readonly writeFrames?: number;
  /** Magnification of the note on screen (keeps the lettering grain crisp). */
  readonly zoom?: number;
  readonly frame?: number;
  readonly style?: React.CSSProperties;
};

export const STICKY_COLOR = '#F7EDC6';
const PADDING = 0.11;
const CURL_LIFT = 12; // px the bottom edge rises at full curl
const fill: React.CSSProperties = {position: 'absolute', inset: 0, pointerEvents: 'none'};

/** Lettering as centred, wrapped lines (one label per line, written one after another). */
const letteringSpec = (text: string, size: number, textSize: number, face: HandFaceKey, ink: Ink): SketchSpec => {
  const lines = wrapHand(text, textSize, size * (1 - PADDING * 2), face).split('\n');
  const lineH = textSize * LINE_HEIGHT;
  const top = (size - lines.length * lineH) / 2 + textSize * 0.72;
  const weights = lines.map((l) => Math.max(1, l.length));
  const total = weights.reduce((a, b) => a + b, 0);
  const labels = lines.map((line, i) => {
    const before = weights.slice(0, i).reduce((a, b) => a + b, 0);
    return {
      id: `sticky-${i}-${line}`,
      text: line,
      x: (size - measureHand(line, textSize, face)) / 2 + (i % 2 === 0 ? -2 : 3),
      y: top + i * lineH,
      size: textSize,
      ink,
      face,
      rotate: -1.5,
      pressure: 1.1,
      from: before / total,
      to: (before + (weights[i] as number)) / total,
    };
  });
  return {id: `sticky-${text}`, strokes: [], labels};
};

/** The shadow pooled under the lifted bottom edge (fades to nothing inside its own box: no hard edges). */
const CurlShadow: React.FC<{lamp: Lamp; curl: number; size: number; bottom: number}> = ({lamp, curl, size, bottom}) => {
  const o = shadowOffset(lamp, CURL_LIFT * curl);
  const h = size * 0.34;
  return (
    <div
      style={{
        position: 'absolute',
        left: o.x - size * 0.06,
        top: bottom - h * 0.62 + o.y,
        width: size * 1.12,
        height: h,
        background: `radial-gradient(closest-side, ${shade(0.4 * curl * lamp.strength)}, ${shade(0.16 * curl * lamp.strength)} 55%, ${shade(0)} 100%)`,
      }}
    />
  );
};

const NoteLight: React.FC<{lamp: Lamp; curl: number; sweep: number | null}> = ({lamp, curl, sweep}) => (
  <>
    {/* The free bottom edge curls up and away from the lamp: a soft crest of light, then shade toward the edge. */}
    <div
      style={{
        ...fill,
        background: `linear-gradient(to bottom, ${shade(0)} 0%, ${shade(0)} ${(60 - curl * 10).toFixed(1)}%, ${lampTint(lamp, 0.2 * curl)} ${(74 - curl * 6).toFixed(1)}%, ${shade(0.02 * curl)} ${(84 - curl * 4).toFixed(1)}%, ${shade(0.2 * curl)} 100%)`,
      }}
    />
    <div style={{...fill, boxShadow: `inset 1px 1px 0 rgba(255,255,255,0.45), inset -1px -1px 0 ${shade(0.1)}`}} />
    {sweep !== null ? (
      <div
        style={{
          ...fill,
          background: `linear-gradient(to bottom, ${lampTint(lamp, 0)} ${(sweep * 100 - 18).toFixed(1)}%, ${lampTint(lamp, 0.14)} ${(sweep * 100).toFixed(1)}%, ${lampTint(lamp, 0)} ${(sweep * 100 + 14).toFixed(1)}%)`,
        }}
      />
    ) : null}
  </>
);

export const StickyNote: React.FC<StickyNoteProps> = (p) => {
  const current = useCurrentFrame();
  const frame = p.frame ?? current;
  const size = p.size ?? 220;
  const lamp = p.lamp ?? DEFAULT_LAMP;
  const ink = p.ink ?? 'accent';
  const face = p.face ?? 'caveat-700';
  const textSize = p.textSize ?? size * 0.165;
  const spec = useMemo(() => letteringSpec(p.text, size, textSize, face, ink), [p.text, size, textSize, face, ink]);
  const marks = useMemo(() => compileSketch(spec), [spec]);
  const s = stickyState(frame, p);
  if (!s.visible) return null;
  const writing = p.writeAt === undefined ? 1 : (frame - p.writeAt) / Math.max(1, p.writeFrames ?? 30);
  const scale = 1 + s.height * 0.003;
  const squash = 1 - s.curl * 0.035; // the curled bottom is foreshortened from above
  return (
    <div style={{position: 'relative', width: size, height: size, transform: `rotate(${p.rotate ?? -2.5}deg) scale(${scale})`, ...p.style}}>
      <CurlShadow lamp={lamp} curl={s.curl} size={size} bottom={size * squash} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: size,
          height: size * squash,
          backgroundColor: p.color ?? STICKY_COLOR,
          boxShadow: castShadow(lamp, {height: s.height + 1.2 + s.curl * 1.5}),
          backgroundImage: `url(${textureUrl('paper')})`,
          backgroundSize: `${TEXTURES.paper.logical}px ${TEXTURES.paper.logical}px`,
          backgroundBlendMode: 'multiply',
          isolation: 'isolate',
          overflow: 'hidden',
        }}
      >
        <PencilCanvas marks={marks} progress={writing} width={size} height={size} zoom={(p.zoom ?? 1) * scale} />
        <NoteLight lamp={lamp} curl={s.curl} sweep={s.sweep} />
      </div>
    </div>
  );
};
