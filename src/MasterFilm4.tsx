import React from 'react';
import {Series} from 'remotion';
import {SLOTS4, slotFrames4} from './film4';
import {CHAPTERS} from './chapters/registry';

/** The 10:00 master: every chapter in its slot, back to back. */
export const MasterFilm4: React.FC = () => (
  <Series>
    {SLOTS4.map((slot) => {
      const Chapter = CHAPTERS[slot.id];
      return (
        <Series.Sequence key={slot.id} durationInFrames={slotFrames4(slot.id)} name={slot.id}>
          <Chapter />
        </Series.Sequence>
      );
    })}
  </Series>
);
