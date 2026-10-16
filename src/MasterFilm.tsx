import React from 'react';
import {Series} from 'remotion';
import {SLOTS, slotFrames} from './film';
import {SCENES} from './scenes/registry';

/** The 2:40 master: every module in its slot, back to back. */
export const MasterFilm: React.FC = () => (
  <Series>
    {SLOTS.map((slot) => {
      const {Scene} = SCENES[slot.id];
      return (
        <Series.Sequence key={slot.id} durationInFrames={slotFrames(slot.id)} name={slot.id}>
          <Scene />
        </Series.Sequence>
      );
    })}
  </Series>
);
