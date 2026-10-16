// KitDemo.tsx — Kit-demo-wide / Kit-demo-tall: every kit piece on paper under a parked camera (zoom 1, so sheet px =
// screen px), through the same SheetContext the endless sheet provides. 12 s. Suggested stills: 45, 135, 228, 330.
import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {SheetContext, type SheetState} from '../../endless/sheetContext';
import {lodOf} from '../../endless/lod';
import {viewportOf} from '../../endless/camera';
import {DEFAULT_LAMP, lampFalloff} from '../../paper/lamp';
import {TEXTURES, textureUrl} from '../../paper/textures';
import type {Point} from '../../sheet4';
import {useFormat} from '../../useFormat';
import {KitScopeContext} from '../context';
import {footageClip} from '../footage';
import {NumberRoll} from '../NumberRoll';
import {ScreenOnPaper} from '../ScreenOnPaper';
import {Super} from '../Super';

export const KIT_DEMO_SECONDS = 12;

type Layout = {
  supers: readonly [Point, Point, Point];
  superSize: number;
  maxWidth: number;
  rolls: readonly [Point, Point];
  laptop: {at: Point; scale: number};
  phone: {at: Point; scale: number};
};

const LAYOUT: Record<'wide' | 'tall', Layout> = {
  wide: {
    supers: [[110, 150], [110, 270], [110, 390]],
    superSize: 48,
    maxWidth: 880,
    rolls: [[110, 650], [110, 770]],
    laptop: {at: [1290, 400], scale: 0.56},
    phone: {at: [1735, 620], scale: 0.95},
  },
  tall: {
    supers: [[90, 170], [90, 290], [90, 410]],
    superSize: 48,
    maxWidth: 880,
    rolls: [[90, 650], [90, 770]],
    laptop: {at: [540, 1180], scale: 0.85},
    phone: {at: [830, 1650], scale: 0.85},
  },
};

const Paper: React.FC = () => (
  <>
    <AbsoluteFill style={{background: 'rgb(246, 241, 231)'}} />
    <AbsoluteFill style={{backgroundImage: `url(${textureUrl('paper')})`, backgroundSize: `${TEXTURES.paper.logical}px ${TEXTURES.paper.logical}px`}} />
  </>
);

export const KitDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {format, width, height} = useFormat();
  const camera = {centre: [width / 2, height / 2] as Point, zoom: 1};
  const sheet: SheetState = {
    format,
    width,
    height,
    masterSeconds: frame / fps,
    startSeconds: 0,
    camera,
    viewport: viewportOf(camera, width, height),
    lod: lodOf(camera.zoom),
    showBounds: false,
  };
  const L = LAYOUT[format];
  return (
    <SheetContext.Provider value={sheet}>
      <KitScopeContext.Provider value={{origin: [0, 0]}}>
        <AbsoluteFill style={{overflow: 'hidden'}}>
          <Paper />
          {/* Sheet supers, one per voice ink: written by the pencil, then resolved to DM Sans. */}
          <Super text="Every app starts as a line." ink="graphite" start={0.5} anchor={{sheet: L.supers[0]}} size={L.superSize} maxWidth={L.maxWidth} />
          <Super text="Does it already exist?" ink="accent" start={2.5} anchor={{sheet: L.supers[1]}} size={L.superSize} maxWidth={L.maxWidth} />
          <Super text="Every family has someone who holds it together." ink="sepia" start={4.0} anchor={{sheet: L.supers[2]}} size={L.superSize} maxWidth={L.maxWidth} />
          {/* Number rolls: 4.3(a) lands at 6.0, the date is still rolling at 7.6 and lands at 8.5. */}
          <NumberRoll to="4.3(a)" start={5.0} duration={1.0} at={L.rolls[0]} size={64} />
          <NumberRoll to="21 September 2026" start={7.0} duration={1.5} at={L.rolls[1]} size={56} />
          {/* Screens on paper with real clips (phone footage is 1206 x 2622; in the laptop it is contained on the dark screen). */}
          <ScreenOnPaper device="laptop" source={footageClip('onboarding-question')} at={L.laptop.at} scale={L.laptop.scale} drawStart={0.5} drawDuration={1.5} />
          <ScreenOnPaper device="phone" source={footageClip('binder-switcher-family')} at={L.phone.at} scale={L.phone.scale} drawStart={1.0} drawDuration={1.5} seed={11} />
          <AbsoluteFill style={{background: lampFalloff(DEFAULT_LAMP, 0.05)}} />
          {/* A screen-space lower-third (type only, as BIBLE4 §5.2's labels). */}
          <Super text="Dad's insurance" ink="sepia" start={9.0} anchor={{screen: 'lower-third'}} />
        </AbsoluteFill>
      </KitScopeContext.Provider>
    </SheetContext.Provider>
  );
};
