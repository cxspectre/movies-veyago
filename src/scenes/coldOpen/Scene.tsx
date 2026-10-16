// Scene.tsx — module `coldOpen` (0:00-0:35, shots 1-4; BIBLE 1, 2, 4.1, 7.1). Pure black for the first second;
// the lamp warms up while the pencil draws the phone's left edge in the dark; hand A finishes Provisum 1 as it
// shipped and ticks its five items on the VO's nouns; the pencil stops at 20.0; hand B sets the coffee cup down at
// 22.0; the breath; the sticky note pressed at 27.0 and smoothed flat on the chord at 28.0; the question lettered
// in accent from 28.5; a slow 4% push-in to the cut at 35.0.
import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {coldOpen} from '../../beats';
import {FPS} from '../../film';
import {DESK_LAMP, DESK_PROP_IDS, DeskStage, SheetAt, type DeskPropId} from '../../desk';
import {GraphiteSketch, PaperSheet} from '../../paper';
import {spec as v1Spec} from '../../sketches/v1-home';
import {useFormat} from '../../useFormat';
import {CoffeeCupSetDown, RestingCup} from './CoffeeCupSetDown';
import {FilmGrain} from './FilmGrain';
import {HandA} from './HandA';
import {LampUp} from './LampUp';
import {COLD_OPEN_LAYOUT, type ColdOpenLayout} from './layout';
import {QuestionNote} from './QuestionNote';
import {isPureBlack, lampIntensity, PUSH_IN_MAX, pushInFactor, V1_DRAW_FRAMES, V1_FROM, v1PageFrame} from './timing';

/** BIBLE 2.1: vignette #2A2008 at 0.18 in the corners. */
const VIGNETTE = 0.18;
/** The V1 sheet lies flat; a hint of lift at its free corner. */
const SHEET_CURL = 0.18;
/** Every desk prop is outside this tight framing (the cup is carried in by hand B, drawn here). */
const HIDDEN: Partial<Record<DeskPropId, boolean>> = Object.fromEntries(DESK_PROP_IDS.map((id) => [id, false]));

const V1Page: React.FC<{zoom: number}> = ({zoom}) => {
  const local = useCurrentFrame();
  return <GraphiteSketch spec={v1Spec} drawFrames={V1_DRAW_FRAMES} frame={v1PageFrame(V1_FROM + local / FPS)} zoom={zoom} />;
};

const V1Hand: React.FC<{layout: ColdOpenLayout}> = ({layout}) => {
  const local = useCurrentFrame();
  return <HandA t={V1_FROM + local / FPS} layout={layout} />;
};

export const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const {format} = useFormat();
  const t = frame / FPS;
  if (isPureBlack(t)) return <AbsoluteFill style={{backgroundColor: '#000000'}} />;
  const L = COLD_OPEN_LAYOUT[format];
  const camera = {scale: L.cameraScale * pushInFactor(t), centre: L.cameraCentre};
  // The canvases are rasterised once at the push-in's closest framing, so they stay crisp and never re-allocate.
  const zoom = L.sheet.scale * L.cameraScale * PUSH_IN_MAX;
  return (
    <LampUp intensity={lampIntensity(t)} id={`cold-open-lamp-${format}`}>
      <DeskStage format={format} camera={camera} show={HIDDEN} vignette={VIGNETTE}>
        <SheetAt centre={L.sheet.centre} scale={L.sheet.scale} rotation={L.sheet.rotation}>
          <PaperSheet lamp={DESK_LAMP} curl={SHEET_CURL}>
            <Sequence from={coldOpen.v1.sequenceFrom} layout="none" name="v1-home">
              <V1Page zoom={zoom} />
            </Sequence>
          </PaperSheet>
        </SheetAt>
        <RestingCup t={t} layout={L} />
        <SheetAt centre={L.sheet.centre} scale={L.sheet.scale} rotation={L.sheet.rotation}>
          <QuestionNote t={t} layout={L} zoom={zoom} />
          <Sequence from={coldOpen.v1.sequenceFrom} layout="none" name="hand-A">
            <V1Hand layout={L} />
          </Sequence>
        </SheetAt>
        <CoffeeCupSetDown t={t} layout={L} />
      </DeskStage>
      <FilmGrain frame={frame} />
    </LampUp>
  );
};
