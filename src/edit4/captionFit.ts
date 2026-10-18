// captionFit.ts — layout of a v4 caption: the v1 layout (captionLayout.ts), with one extension. Two v4 captions
// ("Some weeks I'm the mom, the daughter, ..." 912 px balanced, "And Sam's car registration, ..." 877 px) need more
// than the 852 px the v1 side margin leaves; rather than a third line (max 2, BIBLE4 §6) the side margin shrinks
// from 96 px to 60 px for a caption that cannot be set in two lines otherwise (pill still 66 px from each edge).
import type {FormatName} from '../film';
import {layoutCaption, type CaptionBox, type Measure} from '../edit/captionLayout';

const WIDE_SIDE_MARGIN_PX = 60;
const DEFAULT_SIDE_MARGIN_PX = 96;

export const layoutCaption4 = (text: string, measure: Measure, width: number, height: number, format: FormatName): CaptionBox => {
  try {
    return layoutCaption(text, measure, width, height, format);
  } catch {
    const extra = (DEFAULT_SIDE_MARGIN_PX - WIDE_SIDE_MARGIN_PX) * 2;
    // Lay out in a canvas `extra` px wider (wraps at the wider limit), then move the box back: lines stay centred on `width / 2`.
    const wide = layoutCaption(text, measure, width + extra, height, format);
    return {...wide, box: {...wide.box, x: wide.box.x - extra / 2}};
  }
};
