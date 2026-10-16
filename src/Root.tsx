import React from 'react';
import {Composition} from 'remotion';
import {FORMATS, FPS, MASTER_SECONDS, SLOTS, sec, slotFrames} from './film';
import {shelled} from './FilmShell';
import {MasterFilm} from './MasterFilm';
import {SCENES} from './scenes/registry';
import {SKETCH_IDS} from './sketches/registry';
import {SKETCH_PREVIEW_FRAMES, SketchAlpha, SketchPreview} from './SketchPreview';
import {PREVIEWS} from './previews';
import {SKETCH_SIZE} from './paper/types';
import {ENGINE_DEMO_FRAMES, EngineDemo} from './paper/demo/EngineDemo';

// Compositions registered here:
//   Master-wide                      the 2:40 master (16:9)
//   Scene-<module>-wide / -tall      each module alone, in both formats
//   Sketch-<id>                      each hand-drawn page alone (1200x850)
// Cut-downs (Vertical45, Teaser15) are registered from src/edits.ts by the editor.
export const Root: React.FC = () => (
  <>
    <Composition
      id="Master-wide"
      component={shelled(MasterFilm)}
      durationInFrames={sec(MASTER_SECONDS)}
      fps={FPS}
      {...FORMATS.wide}
    />
    {SLOTS.flatMap((slot) =>
      (['wide', 'tall'] as const).map((format) => (
        <Composition
          key={`${slot.id}-${format}`}
          id={`Scene-${slot.id}-${format}`}
          component={shelled(SCENES[slot.id].Scene)}
          durationInFrames={slotFrames(slot.id)}
          fps={FPS}
          {...FORMATS[format]}
        />
      )),
    )}
    <Composition
      id="Engine-demo"
      component={shelled(EngineDemo)}
      durationInFrames={ENGINE_DEMO_FRAMES}
      fps={FPS}
      {...FORMATS.wide}
    />
    {SKETCH_IDS.map((id) => (
      <Composition
        key={id}
        id={`Sketch-${id}`}
        component={shelled(() => <SketchPreview id={id} />)}
        durationInFrames={SKETCH_PREVIEW_FRAMES}
        fps={FPS}
        width={SKETCH_SIZE.width}
        height={SKETCH_SIZE.height}
      />
    ))}
    {SKETCH_IDS.map((id) => (
      <Composition
        key={`fast-${id}`}
        id={`SketchFast-${id}`}
        component={shelled(() => <SketchPreview id={id} drawFrames={45} />)}
        durationInFrames={90}
        fps={FPS}
        width={SKETCH_SIZE.width}
        height={SKETCH_SIZE.height}
      />
    ))}
    {SKETCH_IDS.map((id) => (
      <Composition
        key={`alpha-${id}`}
        id={`SketchAlpha-${id}`}
        component={shelled(() => <SketchAlpha id={id} />)}
        durationInFrames={60}
        fps={FPS}
        width={SKETCH_SIZE.width}
        height={SKETCH_SIZE.height}
      />
    ))}
    {PREVIEWS.map((p) => (
      <Composition
        key={p.id}
        id={p.id}
        component={shelled(p.component)}
        durationInFrames={p.durationInFrames}
        fps={p.fps ?? FPS}
        width={p.width}
        height={p.height}
      />
    ))}
  </>
);
