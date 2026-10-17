// pages.tsx — the four DRAWN frames inside the research cards (BIBLE4 5.5, contract 13.5): no recording. The owner has not
// supplied the exact store results, suggestions, reviews or form pages (docs/v4/CLAIMS.md D1-D4), so every line of text here is a
// grey bar: a clearly drawn placeholder with no invented words, no names and no logos. 380 x 230 each.
import React from 'react';
import {COLORS} from '../../film';
import {hash01} from '../filterMachine/hand';

const BAR = 'rgba(42,42,45,0.22)';
const bar = (x: number, y: number, w: number, h = 9, fill = BAR): React.ReactElement => <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={fill} />;

/** Search results: a search field and rows of app icon + two bars. */
const Store: React.FC = () => (
  <g>
    <rect x={0} y={0} width={380} height={230} fill="#F6F6F3" />
    <rect x={18} y={14} width={344} height={30} rx={15} fill="rgba(42,42,45,0.1)" />
    {bar(40, 24, 120, 10)}
    {[0, 1, 2, 3].map((i) => (
      <g key={i} transform={`translate(18 ${58 + i * 42})`}>
        <rect width={34} height={34} rx={8} fill="rgba(42,42,45,0.16)" />
        {bar(46, 5, 120 + hash01(i + 5) * 90, 10)}
        {bar(46, 21, 70 + hash01(i + 9) * 80, 7, 'rgba(42,42,45,0.12)')}
        <rect x={290} y={6} width={52} height={22} rx={11} fill="rgba(42,42,45,0.1)" />
      </g>
    ))}
  </g>
);

/** A terminal listing: a dark panel, a prompt and rows of suggestions. */
const Terminal: React.FC = () => (
  <g>
    <rect x={0} y={0} width={380} height={230} fill="#1D1D20" />
    {[0, 1, 2].map((i) => <circle key={i} cx={16 + i * 16} cy={14} r={4.5} fill="rgba(245,247,250,0.28)" />)}
    <path d="M 18 40 L 30 47 L 18 54" fill="none" stroke="rgba(245,247,250,0.75)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    {bar(40, 42, 150, 9, 'rgba(245,247,250,0.6)')}
    {[0, 1, 2, 3, 4, 5, 6].map((i) => bar(22, 72 + i * 21, 90 + hash01(i + 20) * 190, 8, 'rgba(245,247,250,0.34)'))}
    <rect x={22} y={208} width={10} height={14} fill="rgba(245,247,250,0.7)" />
  </g>
);

const star = (cx: number, cy: number, r: number): string =>
  Array.from({length: 10}, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`;
  }).join(' ');

/** One-star reviews: a lit star, four dark ones, a grey (blurred) name bar, short text. */
const Reviews: React.FC = () => (
  <g>
    <rect x={0} y={0} width={380} height={230} fill="#F6F6F3" />
    {[0, 1, 2].map((i) => (
      <g key={i} transform={`translate(18 ${12 + i * 72})`}>
        {[0, 1, 2, 3, 4].map((s) => (
          <polygon key={s} points={star(10 + s * 24, 10, 10)} fill={s === 0 ? COLORS.accent : 'none'} stroke={s === 0 ? COLORS.accent : 'rgba(42,42,45,0.35)'} strokeWidth={1.6} />
        ))}
        <rect x={150} y={3} width={90} height={14} rx={7} fill="rgba(42,42,45,0.28)" />
        {bar(0, 30, 330, 8)}
        {bar(0, 46, 250 - hash01(i) * 60, 8)}
      </g>
    ))}
  </g>
);

/** The rules: a state form, a Medicare-style page and a plain agency page, side by side, headers left blank. */
const Rules: React.FC = () => (
  <g>
    <rect x={0} y={0} width={380} height={230} fill="#E9E8E3" />
    {[0, 1, 2].map((i) => (
      <g key={i} transform={`translate(${12 + i * 124} ${12 + (i === 1 ? 6 : 0)}) rotate(${(i - 1) * 1.5})`}>
        <rect width={112} height={206} fill="#FBFAF6" stroke="rgba(42,42,45,0.3)" strokeWidth={1.4} />
        <rect x={10} y={12} width={92} height={16} fill={i === 1 ? 'rgba(47,91,234,0.18)' : 'rgba(42,42,45,0.18)'} />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((r) => (
          <g key={r}>
            {i === 0 ? <rect x={10} y={42 + r * 20} width={9} height={9} fill="none" stroke="rgba(42,42,45,0.4)" strokeWidth={1.3} /> : null}
            {bar(i === 0 ? 26 : 10, 44 + r * 20, (i === 0 ? 70 : 88) - hash01(r + i * 9) * 30, 6)}
          </g>
        ))}
      </g>
    ))}
  </g>
);

export const PAGES = [Store, Terminal, Reviews, Rules] as const;
