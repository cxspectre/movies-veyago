// GlassPhase.tsx — local 7.0-17.0: the lit drawing becomes the phone (BIBLE 5.3-5.6). The rig lifts in under the
// hairlines (the band of light first, the body after it), the drawn outline straightens into the device edge, the
// perspective arrives and the phone turns; on the beats the groups snap into the real pixels on the glass. At 17.0
// the state is `transition.handoff`.
import React, {useMemo} from 'react';
import {DeviceStage, Phone3D, SCREEN_PX, transitionEdgeLight, type ScreenSource} from '../../devices';
import type {FormatName} from '../../film';
import {VoidBackground} from '../../glass';
import type {PathMark} from '../../paper';
import {clockOf, lightItemsAt, OUTLINE_ID, outlinePoints, type LightItem} from './conversion';
import {outlineMorph, poseAt, stretchAt, type Size, type Stretch} from './geometry';
import {PhoneHairlines} from './HairlineLayers';
import {homeScreenSource, useHomeStill} from './homeScreen';
import {drawScreenBands} from './screenDraw';
import {bodyOpacity, isScreenReal, outlineAlpha, outlineMorphK, outlineWidthPx, strokeFresh} from './timing';

const OUTLINE_EXCLUDED: ReadonlySet<string> = new Set([OUTLINE_ID]);

/** The phone outline on its way from the hand-drawn line to the device edge, as one light item (sketch px). */
const outlineItem = (t: number, stretch: Stretch): LightItem | null => {
  const alpha = outlineAlpha(t);
  if (alpha <= 0) return null;
  const source = outlinePoints();
  const pts = outlineMorph(source, stretch, outlineMorphK(t));
  const m: PathMark = {
    kind: 'path',
    strokeId: OUTLINE_ID,
    ink: 'graphite',
    role: 'clean',
    seed: 0,
    pts: pts.map(([x, y], i) => ({x, y, w: 1, p: 1, t: i / Math.max(1, pts.length - 1)})),
    length: 0,
    strands: 1,
    deposit: 1,
    start: 0,
    end: 1,
    order: 0,
  };
  const level = strokeFresh(t, clockOf(OUTLINE_ID).start);
  return {kind: 'path', m, local: 1, style: {ink: 'graphite', level, alpha, widthPx: outlineWidthPx(t)}};
};

export type GlassPhaseProps = {readonly t: number; readonly format: FormatName; readonly size: Size};

export const GlassPhase: React.FC<GlassPhaseProps> = ({t, format, size}) => {
  const pose = poseAt(t, format, size);
  const stretch = stretchAt(t);
  const still = useHomeStill();
  const real = isScreenReal(t);
  // The outline is drawn first (it was the first stroke), morphing, in the same pinned canvas as every other line.
  const items = useMemo(() => {
    const outline = outlineItem(t, stretch);
    return [...(outline ? [outline] : []), ...lightItemsAt(t, {which: 'phone', exclude: OUTLINE_EXCLUDED})];
  }, [t, stretch]);
  // The stage mounts only once the still is here: a `draw` screen is painted in a layout effect, and the canvas
  // renders its GL frame on mount and on frame change only, so a still arriving later would never reach the glass.
  if (!still) return <VoidBackground />;
  const screen: ScreenSource = real
    ? homeScreenSource(still)
    : {kind: 'draw', width: SCREEN_PX.width, height: SCREEN_PX.height, draw: (ctx) => drawScreenBands(ctx, still, t)};
  const overlay = items.length > 0 ? <PhoneHairlines items={items} pose={pose} size={size} stretch={stretch} /> : null;
  return (
    <DeviceStage fov={pose.fov} overlay={overlay}>
      <Phone3D placement={pose.placement} rotation={pose.rotation} edgeLight={transitionEdgeLight(t)} opacity={bodyOpacity(t)} screen={screen} island={real} />
    </DeviceStage>
  );
};
