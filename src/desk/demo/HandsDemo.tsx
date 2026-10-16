// HandsDemo.tsx — a page drawing itself over 6 s on the desk with the pencil hand following the tip, then resting.
// Registered as `Hands-demo-wide` / `Hands-demo-tall`. The tall framing is wide enough to keep the drawing hand in
// frame when the tip is at the sheet's right edge (the film's own 1.25 framing crops the sheet itself).
import React from 'react';
import {useCurrentFrame} from 'remotion';
import {sec} from '../../film';
import {GraphiteSketch, PaperSheet} from '../../paper';
import {DEMO_SPEC} from '../../paper/demo/demoSpec';
import {useFormat} from '../../useFormat';
import {DeskStage, SheetAt} from '../DeskStage';
import {DESK_LAYOUT} from '../layout';
import {DESK_LAMP} from '../palette';
import {PencilHand} from '../hands/PencilHand';
import {Hand} from '../hands/Hand';
import {presenceAt} from '../hands/presence';
import {HANDS_MODE, type HandsMode} from '../hands/mode';

export const HANDS_DEMO_FRAMES = sec(9);
const DRAW_FRAMES = sec(6);
const CAMERA = {wide: {scale: 1.25, centre: {x: 1080, y: 560}}, tall: {scale: 1.02, centre: {x: 620, y: 900}}} as const;
/** Where pair A's left hand holds the sheet (sketch px) and how its arm leaves, per format. */
const STEADY = {wide: {x: 300, y: 690, rotation: 16}, tall: {x: 300, y: 690, rotation: 14}} as const;
const PENCIL_YAW = {wide: 60, tall: 66} as const;

export const HandsDemo: React.FC<{mode?: HandsMode}> = ({mode = HANDS_MODE}) => {
  const frame = useCurrentFrame();
  const {format} = useFormat();
  const layout = DESK_LAYOUT[format];
  const sheet = layout.activeSheet;
  const t = frame / 30;
  const handIn = presenceAt(t, {enter: {from: 0, to: 0.8}});
  const steadyIn = presenceAt(t, {enter: {from: 0.2, to: 1.0}});
  const steady = STEADY[format];
  return (
    <DeskStage format={format} camera={CAMERA[format]} cupPencils={['accent', 'graphite']}>
      <SheetAt centre={sheet.centre} scale={sheet.scale} rotation={sheet.rotation}>
        <PaperSheet lamp={DESK_LAMP} curl={0.3}>
          <GraphiteSketch spec={DEMO_SPEC} drawFrames={DRAW_FRAMES} zoom={sheet.scale * CAMERA[format].scale} />
        </PaperSheet>
        <Hand pose="steady" handed="left" x={steady.x} y={steady.y} anchor="indexTip" rotation={steady.rotation} presence={steadyIn} enterFrom="bottom" mode={mode} />
        <PencilHand spec={DEMO_SPEC} drawFrames={DRAW_FRAMES} presence={handIn} mode={mode} follow={{yawBase: PENCIL_YAW[format]}} />
      </SheetAt>
    </DeskStage>
  );
};

/** The fallback look (CONTRACT §6): only the hands' cast shadows, the pencil and the props. */
export const HandsShadowsDemo: React.FC = () => <HandsDemo mode="shadows" />;
