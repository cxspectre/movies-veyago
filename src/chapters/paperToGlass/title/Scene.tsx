// Scene.tsx — the title of chapter 10 (BIBLE4 §5.10, 70.0-79.5), copied from the v1 title scene (src/scenes/title) and
// re-timed from beats4: "Provisum" letter by letter, then the accent pencil stroke of "2" as light completing at 73.0.
// The subline is a kit super in the chapter's overlay (it is a SUPER in beats4), so it is not drawn here.
import React, {useMemo} from 'react';
import {useVideoConfig} from 'remotion';
import {GLASS_TYPE} from '../../../glass';
import type {FormatName} from '../../../film';
import {titleLayout} from './layout';
import {LightTwo} from './LightTwo';
import {measureWord} from './measure';
import {BloomFilter, TitleWord} from './TitleType';
import {twoLevel, twoProgress} from './timing';
import {title} from './beats';
import {sizedTwo} from './twoSize';

export const TitleLayer: React.FC<{t: number; format: FormatName}> = ({t, format}) => {
  const {width, height} = useVideoConfig();
  const titleSize = GLASS_TYPE.title.size[format];
  const word = useMemo(() => measureWord(title.word.text, {weight: GLASS_TYPE.title.weight, size: titleSize, trackingEm: GLASS_TYPE.title.trackingEm}), [titleSize]);
  const two = sizedTwo(format);
  const layout = useMemo(() => titleLayout({format, width, height}, word, two.ink), [format, width, height, word, two]);
  if (t < title.word.from) return null;
  const bloomId = `p2g-title-bloom-${format}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{position: 'absolute', inset: 0}}>
      <defs>
        <BloomFilter id={bloomId} />
      </defs>
      <TitleWord text={title.word.text} metrics={word} size={titleSize} x={layout.wordX} baseline={layout.baseline} t={t} bloomId={bloomId} />
      {t >= title.strokeTwo.from ? (
        <LightTwo mark={two.mark} progress={twoProgress(t)} level={twoLevel(t)} x={layout.twoX} y={layout.twoY} lineWidth={two.lineWidth} idPrefix={`p2g-two-${format}`} />
      ) : null}
    </svg>
  );
};
