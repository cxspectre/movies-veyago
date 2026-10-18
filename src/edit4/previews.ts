import React from 'react';
import {FORMATS} from '../film';
import type {PreviewSpec} from '../previewTypes';
import {EDLS4, type Edl4} from '../edits4';
import {assertEdl4} from './checks4';
import {Edit4Film} from './Edit4Film';
import {compositionId4, edlFrames4} from './place';

// Every v4 EDL is checked when this module loads; a broken EDL throws and the bundle fails loudly.
const preview = (edl: Edl4): PreviewSpec => ({
  id: compositionId4(edl),
  component: () => React.createElement(Edit4Film, {edl}),
  durationInFrames: edlFrames4(edl),
  ...FORMATS[edl.format],
});

/** Hook75-tall, Cut180-tall and Short-<id>-tall (the 11 chapter shorts), played by Edit4Film from the 9:16 master. */
export const edit4Previews: readonly PreviewSpec[] = EDLS4.map(assertEdl4).map(preview);

/**
 * Review only (never rendered into a cut-down): no shipped EDL puts a caption on a glass-tone segment (the glass
 * segments carry a tone and no caption), so this 4 s EDL shows the glass pill and ink for the proof stills.
 * The text is an existing caption of CUT_180.
 */
const CAPTION_PROBE4: Edl4 = {
  id: 'CaptionProbe4',
  format: 'tall',
  targetSeconds: 4,
  segments: [
    {chapter: 'paperToGlass', from: 28.0, to: 32.0, note: 'glass-tone probe', props: {music: 'review only', captions: [{at: 0.5, text: 'One idea made it through all five.'}], captionTone: 'glass'}},
  ],
};


/** Review only: CaptionProbe4-tall (a glass-tone caption). Registered with the cut-downs; not part of any render script. */
export const edit4ReviewPreviews: readonly PreviewSpec[] = [preview(assertEdl4(CAPTION_PROBE4))];
