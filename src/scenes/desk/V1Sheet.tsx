// V1Sheet.tsx — the cold open's sheet as it was left at 0:35: the finished v1-home page (static PNG) with the sticky
// note pressed flat over the card and the top deadline, lettered "What are we still missing?" (BIBLE §4.1, §2.6).
// It lies at its §2.10 slot for the whole module and goes into the wall as tile 1.
import React from 'react';
import {coldOpen} from '../../beats';
import type {FormatName} from '../../film';
import {DESK_LAMP, DESK_LAYOUT} from '../../desk';
import {StickyNote} from '../../paper';
import {PageSheet} from './PageSheet';

/**
 * The note on the V1 page, sketch px (BIBLE §4.1: over (600,425), −4°, 320 logical px in the cold-open framing,
 * where the V1 sheet's phone outline is 70% of the frame height: 280 sketch px). Kalam 700 at 60/320 of the note.
 * The cold open must leave the note exactly here; import this rather than re-typing it.
 */
export const V1_NOTE = {centre: {x: 600, y: 425}, size: 280, rotate: -4, face: 'kalam-700', textRatio: 60 / 320, text: coldOpen.lettering.text} as const;
/** Long ago: the note is flat (pressed and smoothed in the cold open). */
const SETTLED_PRESS = -10_000;

export const V1Sheet: React.FC<{format: FormatName; zoom: number}> = ({format, zoom}) => {
  const slot = DESK_LAYOUT[format].v1Sheet;
  const half = V1_NOTE.size / 2;
  return (
    <PageSheet id="v1-home" index={-1} pose={{...slot, lift: 6}} content={{kind: 'still'}}>
      <div style={{position: 'absolute', left: V1_NOTE.centre.x - half, top: V1_NOTE.centre.y - half}}>
        <StickyNote
          text={V1_NOTE.text}
          size={V1_NOTE.size}
          rotate={V1_NOTE.rotate}
          face={V1_NOTE.face}
          textSize={V1_NOTE.size * V1_NOTE.textRatio}
          pressAt={SETTLED_PRESS}
          frame={0}
          lamp={DESK_LAMP}
          zoom={zoom * slot.scale}
        />
      </div>
    </PageSheet>
  );
};
