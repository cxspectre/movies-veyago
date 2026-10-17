// previews.tsx — Village-onmap-wide / -tall: the chapter as Chapter-village renders it, plus a PLACEHOLDER outline of
// the United States, the Atlantic and Europe so the nested village can be judged in place. Chapter 8 (src/chapters/
// launch) owns the real map; this outline is never part of the chapter's Art.
import React from 'react';
import {FORMATS} from '../../film';
import {slotFrames4} from '../../film4';
import {ChapterShell} from '../../kit';
import {handPath} from '../../paper';
import type {PreviewSpec} from '../../previewTypes';
import type {Point} from '../../sheet4';
import {Art, Overlay} from './Chapter';
import {toRegion} from './layout';

const US: readonly Point[] = [
  [26760, 2930], [27350, 2960], [27900, 2990], [28060, 2930], [28120, 3000], [28010, 3130], [27980, 3330], [27880, 3560],
  [27960, 3760], [27890, 3790], [27760, 3640], [27500, 3690], [27300, 3800], [27120, 3640], [26900, 3560], [26780, 3300], [26760, 2930],
];
const EUROPE: readonly Point[] = [
  [28330, 3120], [28400, 3080], [28420, 3020], [28460, 2990], [28500, 3010], [28560, 2960], [28620, 2900], [28700, 2880],
  [28800, 2900], [28820, 3000], [28760, 3120], [28700, 3180], [28640, 3160], [28600, 3210], [28520, 3170], [28470, 3200],
  [28440, 3250], [28360, 3260], [28330, 3200], [28330, 3120],
];
const BRITAIN: readonly Point[] = [[28400, 2920], [28430, 2860], [28460, 2900], [28450, 2980], [28410, 2990], [28400, 2920]];

const outline = (pts: readonly Point[], seed: number): string => handPath(pts.map(toRegion), seed, {wobble: 1.4, smooth: 0.8});

/** The placeholder map: rough graphite at 35%, the way a glimpse is drawn (BIBLE4 §1.5). Labelled so nobody ships it. */
export const MapPlaceholder: React.FC = () => {
  const [lx, ly] = toRegion([28120, 3500]);
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, width: 1, height: 1, overflow: 'visible'}}>
      {[outline(US, 1), outline(EUROPE, 2), outline(BRITAIN, 3)].map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#5A5A60" strokeOpacity={0.35} strokeWidth={3} strokeLinejoin="round" />
      ))}
      <text x={lx} y={ly} fontSize={28} fill="#5A5A60" fillOpacity={0.5} style={{fontFamily: 'DM Sans'}}>
        placeholder map (chapter 8 owns it)
      </text>
    </svg>
  );
};

const OnMap: React.FC = () => (
  <ChapterShell
    id="village"
    art={
      <>
        <MapPlaceholder />
        <Art />
      </>
    }
    overlay={<Overlay />}
  />
);

export const previews: readonly PreviewSpec[] = (['wide', 'tall'] as const).map((format) => ({
  id: `Village-onmap-${format}`,
  component: OnMap,
  durationInFrames: slotFrames4('village'),
  ...FORMATS[format],
}));
