// Scene.tsx — module `endCard` (2:33-2:40, local 0-7; BIBLE 6.5). Home to the paper: "Provisum 2" (0-1),
// "Free on the App Store" (1-2), the Veyago mark (2-3); nothing moves after 3.0; the pencil click at 5.0 is sound
// only (a bridge from the hand at 2:29); hold to the end, no fade.
import React, {useMemo} from 'react';
import {Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {FONTS} from '../../film';
import {useFormat} from '../../useFormat';
import {measureWord} from '../title/measure';
import {cardLayout} from './layout';
import {PaperCard} from './PaperCard';
import {cardState} from './timing';
import {END_CARD, type CardTypeRole} from './tokens';

const typeProps = (role: CardTypeRole, size: number) => ({
  fontFamily: FONTS.super,
  fontWeight: role.weight,
  fontSize: size,
  letterSpacing: `${role.trackingEm}em`,
  fill: role.color,
  style: {fontKerning: 'normal' as const},
});

const specOf = (role: CardTypeRole, size: number) => ({weight: role.weight, size, trackingEm: role.trackingEm});

export const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {format, width, height} = useFormat();
  const t = frame / fps;
  const titleSize = END_CARD.title.size[format];
  const lineSize = END_CARD.line.size[format];
  const layout = useMemo(
    () => cardLayout({format, width, height}, measureWord(END_CARD.title.text, specOf(END_CARD.title, titleSize)), measureWord(END_CARD.line.text, specOf(END_CARD.line, lineSize))),
    [format, width, height, titleSize, lineSize],
  );
  const s = cardState(t);
  return (
    <PaperCard>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{position: 'absolute', inset: 0}}>
        <text x={layout.titleX} y={layout.titleBaseline} opacity={s.title} {...typeProps(END_CARD.title, titleSize)}>
          {END_CARD.title.text}
        </text>
        <text x={layout.lineX} y={layout.lineBaseline} opacity={s.line} {...typeProps(END_CARD.line, lineSize)}>
          {END_CARD.line.text}
        </text>
      </svg>
      <Img
        src={staticFile(END_CARD.mark.file)}
        style={{position: 'absolute', left: layout.markX, top: layout.markY, width: layout.markSize, height: layout.markSize, opacity: END_CARD.mark.opacity * s.mark}}
      />
    </PaperCard>
  );
};
