// Check.tsx — `Check-binder-home-v2`: proves the drawing sits on the real screen. Four panels of the phone, each the
// real still stretched into SCREEN_AREA exactly as the transition must place it:
//   1 the finished graphite sketch at 50% over binder-home.png (dark)      2 the same strokes as light lines
//   3 the graphite sketch at 50% over the light still                       4 the sketch with every mapped frame
// and the largest drawn-vs-real error per kind. Review composition only: never part of the film.
import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {COLORS, FONTS} from '../../film';
import {GraphiteSketch, LightSketch, SKETCH_SIZE} from '../../paper';
import {ALIGNMENT, ASPECT_FIT_DRIFT_PX, maxError} from './alignment';
import {PHONE_FRAME, SCREEN_AREA} from './screen';
import {spec} from './spec';

export const CHECK_FRAMES = 1;
const DRAWN = 30;
const OVERLAY_OPACITY = 0.5;
const MARGIN = 24;
/** The part of the page each panel shows: the phone and a little paper round it. */
const VIEW = {x: PHONE_FRAME.x - 20, y: PHONE_FRAME.y - 20, w: PHONE_FRAME.w + 40, h: PHONE_FRAME.h + 40} as const;
const PANELS = 4;
const CAPTION_H = 44;
const FOOTER_H = 86;
export const CHECK_SIZE = {width: MARGIN + PANELS * (VIEW.w + MARGIN), height: MARGIN + CAPTION_H + VIEW.h + FOOTER_H} as const;
/** Debug colour for the mapped frames (review only; never the film's accent). */
const FRAME_INK = '#E0249A';

type Still = 'footage/binder-home.png' | 'footage/binder-home-light-still.png';

const Screen: React.FC<{still: Still}> = ({still}) => (
  <Img src={staticFile(still)} style={{position: 'absolute', left: SCREEN_AREA.x, top: SCREEN_AREA.y, width: SCREEN_AREA.w, height: SCREEN_AREA.h}} />
);

const Frames: React.FC = () => (
  <svg width={SKETCH_SIZE.width} height={SKETCH_SIZE.height} style={{position: 'absolute', inset: 0}}>
    {ALIGNMENT.map((r) => (
      <rect key={r.id} x={r.target.x} y={r.target.y} width={Math.max(0.5, r.target.w)} height={Math.max(0.5, r.target.h)} fill="none" stroke={FRAME_INK} strokeWidth={0.5} opacity={0.85} />
    ))}
  </svg>
);

const Panel: React.FC<{index: number; caption: string; children: React.ReactNode}> = ({index, caption, children}) => (
  <div style={{position: 'absolute', left: MARGIN + index * (VIEW.w + MARGIN), top: MARGIN}}>
    <div style={{fontFamily: FONTS.super, fontSize: 15, color: COLORS.graphite, height: CAPTION_H}}>{caption}</div>
    <div style={{position: 'relative', width: VIEW.w, height: VIEW.h, overflow: 'hidden', background: COLORS.paper, boxShadow: '0 0 0 1px #D8D0BE'}}>
      <div style={{position: 'absolute', left: -VIEW.x, top: -VIEW.y, width: SKETCH_SIZE.width, height: SKETCH_SIZE.height}}>{children}</div>
    </div>
  </div>
);

const Graphite: React.FC<{opacity?: number}> = ({opacity = 1}) => (
  <div style={{position: 'absolute', inset: 0, opacity}}>
    <GraphiteSketch spec={spec} drawFrames={DRAWN} frame={DRAWN} />
  </div>
);

const summary = (): string => {
  const kinds = (['box', 'line', 'label', 'icon', 'inside'] as const).flatMap((k) => {
    const m = maxError(ALIGNMENT, [k]);
    return m ? [`${k} ${m.errorPx.toFixed(1)} px (${m.id})`] : [];
  });
  return `max drawn-vs-real error, sketch px: ${kinds.join(' · ')}. Mapped frames vs the still: 0 px (stretched as here; ${ASPECT_FIT_DRIFT_PX.toFixed(1)} px at the sides if drawn at its own aspect).`;
};

export const CheckBinderHome: React.FC = () => (
  <AbsoluteFill style={{background: '#FBF8F2'}}>
    <Panel index={0} caption="1 · graphite 50% over binder-home.png">
      <Screen still="footage/binder-home.png" />
      <Graphite opacity={OVERLAY_OPACITY} />
    </Panel>
    <Panel index={1} caption="2 · the same strokes as light, over binder-home.png">
      <Screen still="footage/binder-home.png" />
      <div style={{position: 'absolute', inset: 0, opacity: 0.85}}>
        <LightSketch spec={spec} progress={1} />
      </div>
    </Panel>
    <Panel index={2} caption="3 · graphite 50% over the light still">
      <Screen still="footage/binder-home-light-still.png" />
      <Graphite opacity={OVERLAY_OPACITY} />
    </Panel>
    <Panel index={3} caption="4 · the sketch and every mapped frame">
      <Graphite />
      <Frames />
    </Panel>
    <div style={{position: 'absolute', left: MARGIN, right: MARGIN, bottom: 18, fontFamily: FONTS.super, fontSize: 15, lineHeight: 1.35, color: COLORS.graphite}}>{summary()}</div>
  </AbsoluteFill>
);
