import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {familyOfDevices, slotSeconds, transition} from '../../beats';
import {cornerParam} from '../../glass/edgeLightPath';
import {windowProgress} from '../../glass/motion';
import {useFormat} from '../../useFormat';
import {familyGlow, familyPhoneX, familyWatchIn, transitionPlacement} from '../drive';
import {CardFlip} from '../pass/CardFlip';
import {cardFromPhone, cardToWatch, flightCardSize} from '../pass/cardFlipMath';
import {FLIP_CARD, PASS} from '../pass/passSpec';
import {WalletPass3D} from '../pass/WalletPass3D';
import {Phone3D} from '../phone/Phone3D';
import {PHONE} from '../phone/phoneSpec';
import {DeviceStage, type StageInfo} from '../stage/DeviceStage';
import {cameraDistance} from '../stage/camera';
import type {Placement, Rotation} from '../types';
import {Watch3D} from '../watch/Watch3D';

export const FAMILY_SECONDS = slotSeconds('familyOfDevices');
const FOV = 28;
/** The Watch's screen from the landing on: the held card frame (the same picture as the flying card's back). */
const WATCH_SCREEN = {kind: 'image', src: FLIP_CARD.back} as const;
const PASS_SLIDE_PX = 120;
/** The band on the pass slides from its top-left corner a little way along the top edge as it comes out. */
const PASS_LIGHT_TRAVEL = 0.06;
const PASS_BEHIND_PX = {from: -260, to: -40};
const WATCH_ROTATION: Rotation = {y: 12, x: -5};
const PASS_ROTATION: Rotation = {y: 6, x: -6};

/**
 * Demo layout (the scene owner decides the final one). Everything stays clear of everything else so each field of the
 * pass reads, and in tall all geometry stays above y = 1600 (the captions sit at the bottom).
 * - wide: phone at the BIBLE's 0.36 W; the Watch high right at half the phone's height; the pass slides from the gap
 *   centre down-right 120 px into the space under the Watch's strap.
 * - tall: phone up at (0.5, 0.34) at 62% of its handoff height; the Watch lower left at 48% of the phone; the pass
 *   lower right at (0.74, 0.70), clear of the crown.
 */
const LAYOUT = {
  wide: {phone: {y: 0.52, heightOfHandoff: 1}, watch: {x: 0.67, y: 0.36, ofPhone: 0.5}, passTo: {x: 0.5775, y: 0.85}, passOfFrame: 0.24},
  tall: {phone: {y: 0.34, heightOfHandoff: 0.62}, watch: {x: 0.3, y: 0.67, ofPhone: 0.48}, passTo: {x: 0.74, y: 0.7}, passOfFrame: 0.17},
} as const;

type Layout = {phone: Placement; watch: Placement; passFrom: Placement; passTo: Placement};

const layoutAt = (t: number, isTall: boolean, height: number, width: number): Layout => {
  const format = isTall ? 'tall' : 'wide';
  const spec = LAYOUT[format];
  const base = transitionPlacement(format, height);
  const finalHeight = base.height * spec.phone.heightOfHandoff;
  const slide = windowProgress(familyOfDevices.phoneSlide, t, familyOfDevices.phoneSlide.easing);
  const phone = {...base, x: familyPhoneX(t, format), y: base.y + (spec.phone.y - base.y) * slide, height: base.height + (finalHeight - base.height) * slide};
  const passHeight = height * spec.passOfFrame;
  const passFrom = {x: spec.passTo.x - PASS_SLIDE_PX / width, y: spec.passTo.y - PASS_SLIDE_PX / height};
  return {
    phone,
    watch: {x: spec.watch.x, y: spec.watch.y, height: finalHeight * spec.watch.ofPhone},
    passFrom: {...passFrom, z: PASS_BEHIND_PX.from, height: passHeight},
    passTo: {...spec.passTo, z: PASS_BEHIND_PX.to, height: passHeight},
  };
};

const lerpPlacement = (a: Placement, b: Placement, k: number): Placement => ({
  x: a.x + (b.x - a.x) * k,
  y: a.y + (b.y - a.y) * k,
  z: (a.z ?? 0) + ((b.z ?? 0) - (a.z ?? 0)) * k,
  height: a.height + (b.height - a.height) * k,
});

export const FamilySegment: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const {isTall} = useFormat();
  const t = frame / fps;
  const stage: StageInfo = {width, height, fov: FOV, distance: cameraDistance(FOV, height)};
  const L = layoutAt(t, isTall, height, width);
  // The card's start and landing are taken at the hit and the landing poses (the devices barely move in 0.5 s).
  const L0 = layoutAt(familyOfDevices.flip.from, isTall, height, width);
  const L1 = layoutAt(familyOfDevices.flip.to, isTall, height, width);
  const phoneRotation: Rotation = {y: transition.handoff.rotationY, x: transition.handoff.rotationX};
  const flight = {
    from: cardFromPhone({placement: L0.phone, rotation: phoneRotation}, stage),
    to: cardToWatch({placement: L1.watch, rotation: WATCH_ROTATION}, stage),
    card: flightCardSize(L0.phone.height),
  };
  const landed = t >= familyOfDevices.cardLands;
  const watchIn = familyWatchIn(t);
  const passK = windowProgress(familyOfDevices.walletSlide, t, familyOfDevices.walletSlide.easing);
  const glow = familyGlow(t);
  return (
    <DeviceStage fov={FOV}>
      <Phone3D
        placement={L.phone}
        rotation={phoneRotation}
        edgeLight={{position: cornerParam(PHONE.outline, 'topRight'), intensity: 1}}
        glow={glow}
        screen={{kind: 'image', src: 'footage/binder-home.png'}}
        island
      />
      <Watch3D
        placement={L.watch}
        rotation={WATCH_ROTATION}
        edgeLight={{position: watchIn.position, intensity: watchIn.light}}
        glow={glow}
        opacity={watchIn.body}
        screen={landed ? WATCH_SCREEN : {kind: 'none'}}
      />
      {passK > 0 ? (
        <WalletPass3D
          placement={lerpPlacement(L.passFrom, L.passTo, passK)}
          rotation={PASS_ROTATION}
          edgeLight={{position: cornerParam(PASS.outline, 'topLeft') + PASS_LIGHT_TRAVEL * passK, intensity: 0.8 * passK}}
          glow={glow}
          opacity={Math.min(1, passK * 3)}
        />
      ) : null}
      <CardFlip {...flight} t={t - familyOfDevices.flip.from} />
    </DeviceStage>
  );
};
