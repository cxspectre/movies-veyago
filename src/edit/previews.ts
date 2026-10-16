import React from 'react';
import {EDLS, edlFrames} from '../edits';
import {FORMATS} from '../film';
import type {PreviewSpec} from '../previewTypes';
import {CaptionSpecimen, CAPTION_SPECIMEN_FRAMES} from './CaptionSpecimen';
import {assertEdl} from './checks';
import {compositionIdOf} from './edl';
import {EditFilm} from './EditFilm';

// Every EDL is checked when this module loads (validateEdl + the player's own rules); a broken EDL throws here
// and the bundle fails loudly instead of rendering a wrong cut.
const CHECKED = EDLS.map(assertEdl);

const edlPreview = (edl: (typeof CHECKED)[number]): PreviewSpec => ({
  id: compositionIdOf(edl),
  component: () => React.createElement(EditFilm, {edl}),
  durationInFrames: edlFrames(edl.segments),
  ...FORMATS[edl.format],
});

/** Registered automatically by src/previews.ts: Vertical45-tall, Teaser15-tall, Teaser15-wide, CaptionSpecimen-tall. */
export const editPreviews: readonly PreviewSpec[] = [
  ...CHECKED.map(edlPreview),
  {id: 'CaptionSpecimen-tall', component: CaptionSpecimen, durationInFrames: CAPTION_SPECIMEN_FRAMES, ...FORMATS.tall},
];
