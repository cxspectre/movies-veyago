// Scene.tsx — module `title` (1:53-2:04, local 0-11; BIBLE 6.1). Pure black and silent to local 2.0 (frames of
// zeros), "Provisum" letter by letter, the accent pencil stroke of "2" as light completing at 5.0, the subline at 7.0.
import React, {useMemo} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {title} from '../../beats';
import {GLASS_TYPE, VoidBackground} from '../../glass';
import {useFormat} from '../../useFormat';
import {titleLayout} from './layout';
import {LightTwo} from './LightTwo';
import {measureWord} from './measure';
import {BloomFilter, Subline, TitleWord} from './TitleType';
import {isBlack, sublineFade, twoLevel, twoProgress} from './timing';
import {TITLE} from './tokens';
import {sizedTwo} from './twoSize';

export const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {format, width, height} = useFormat();
  const t = frame / fps;
  const titleSize = GLASS_TYPE.title.size[format];
  const word = useMemo(() => measureWord(title.word.text, {weight: GLASS_TYPE.title.weight, size: titleSize, trackingEm: GLASS_TYPE.title.trackingEm}), [titleSize]);
  const two = sizedTwo(format);
  const layout = useMemo(() => titleLayout({format, width, height}, word, two.ink), [format, width, height, word, two]);
  if (isBlack(t)) return <VoidBackground />;
  const bloomId = `title-bloom-${format}`;
  return (
    <VoidBackground>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{position: 'absolute', inset: 0}}>
        <defs>
          <BloomFilter id={bloomId} />
        </defs>
        <TitleWord text={title.word.text} metrics={word} size={titleSize} x={layout.wordX} baseline={layout.baseline} t={t} bloomId={bloomId} />
        {t >= title.strokeTwo.from ? (
          <LightTwo mark={two.mark} progress={twoProgress(t)} level={twoLevel(t)} x={layout.twoX} y={layout.twoY} lineWidth={two.lineWidth} idPrefix={`title-two-${format}`} />
        ) : null}
        <Subline text={title.subline.text} size={TITLE.subline.size[format]} opacity={TITLE.subline.opacity} centreX={layout.centreX} baseline={layout.sublineBaseline} fade={sublineFade(t)} />
      </svg>
    </VoidBackground>
  );
};
