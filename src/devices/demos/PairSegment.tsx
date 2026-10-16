import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {slotSeconds} from '../../beats';
import {useFormat} from '../../useFormat';
import {pairGlow, pairSweepIntensity, pairSweepX, sweepFor} from '../drive';
import {Phone3D} from '../phone/Phone3D';
import {PHONE} from '../phone/phoneSpec';
import {DeviceStage} from '../stage/DeviceStage';
import type {Placement} from '../types';
import {Watch3D} from '../watch/Watch3D';
import {WATCH} from '../watch/watchSpec';
import {FLIP_CARD} from '../pass/passSpec';

export const PAIR_SECONDS = slotSeconds('pair');
/**
 * BIBLE 6.3: phone left at 0.36 W (Y -14°), Watch right at 0.66 W (Y +12°) at 55% of the phone's height. Tall moves
 * up and tightens (phone (0.5, 0.33) at 38% of the frame, Watch (0.5, 0.672) at 50% of the phone) so the strap ends at
 * y 1600, above the captions.
 */
const SWEEP_FROM = 0.12;
const SWEEP_TO = 0.88;

export const PairSegment: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const {isTall} = useFormat();
  const t = frame / fps;
  const phoneHeight = isTall ? height * 0.38 : height * 0.74;
  const phone: Placement = isTall ? {x: 0.5, y: 0.33, height: phoneHeight} : {x: 0.36, y: 0.52, height: phoneHeight};
  const watch: Placement = isTall ? {x: 0.5, y: 0.672, height: phoneHeight * 0.5} : {x: 0.66, y: 0.52, height: phoneHeight * 0.55};
  const stage = {width, height};
  const sx = pairSweepX(t, SWEEP_FROM, SWEEP_TO);
  const intensity = pairSweepIntensity(t);
  const glow = pairGlow(t);
  return (
    <DeviceStage fov={28}>
      <Phone3D
        placement={phone}
        rotation={{y: -14, x: -4}}
        glow={glow}
        edgeLight={{sweep: sweepFor(sx, phone, PHONE.outline.width, stage, intensity)}}
        screen={{kind: 'image', src: 'footage/binder-home.png'}}
        island
      />
      <Watch3D
        placement={watch}
        rotation={{y: 12, x: -4}}
        glow={glow}
        edgeLight={{sweep: sweepFor(sx, watch, WATCH.outline.width, stage, intensity)}}
        screen={{kind: 'image', src: FLIP_CARD.back}}
      />
    </DeviceStage>
  );
};
