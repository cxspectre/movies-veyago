// Chapter.tsx — chapter 11, "Provided for" (9:30-10:00, local 0-30; BIBLE4 §5.11, script §11).
// The glow dims back into graphite and the paper returns; the camera pulls back to the whole sheet while the line draws
// its last stretch (the engine's, from LINE_ANCHORS); the line ends at the tip of the graphite pencil, which sets itself
// down; "Provided for."; the end card on paper; hold to 30.0 with no fade. All 2D, no WebGL.
import React from 'react';
import {SUPERS, providedFor as B} from '../../beats4';
import {COLORS, FONTS} from '../../film';
import {ChapterShell, Super, superFromBeat, useChapter} from '../../kit';
import {Pencil} from '../../desk';
import {REGIONS} from '../../sheet4';
import {HANDOFF_LIGHT} from '../paperToGlass/motion';
import {TitleLayer} from '../paperToGlass/title/Scene';
import {CARD, PENCIL, cardLayout, hoverAt} from './layout';

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const easeInOutCubic = (x: number): number => {
  const u = clamp01(x);
  return u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
};
const smooth = (x: number): number => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const win = (t: number, from: number, to: number): number => clamp01((t - from) / (to - from));

const REGION = REGIONS.providedFor;
const ORIGIN: readonly [number, number] = [REGION.centre[0] - REGION.size[0] / 2, REGION.centre[1] - REGION.size[1] / 2];
const local = (p: readonly [number, number]): [number, number] => [p[0] - ORIGIN[0], p[1] - ORIGIN[1]];

/** The graphite pencil lying at 12 degrees, the line's end at its tip; it sets itself down 15.0-17.0. */
const SetDownPencil: React.FC = () => {
  const {t, camera, isTall} = useChapter('providedFor');
  const [tx, ty] = local(PENCIL.tip);
  // Tall only: the camera's drift (sheet4.ts, not ours) leaves the pencil half off the 1080 px frame, so during the drift it is
  // nudged right and down in sheet space to rest whole in the lower-left (see README: the clean fix is the tall camera centre).
  const nudge = isTall ? smooth(win(t, 20.0, 21.0)) : 0;
  const x = tx + 370 * nudge;
  const y = ty + 420 * nudge;
  // The live pencil takes over from the far image's glimpse between zoom 0.15 and 0.30 (BIBLE4 §1.5).
  const fade = smooth((camera.zoom - 0.15) / 0.15);
  if (fade <= 0) return null;
  return <Pencil kind="graphite" x={x} y={y} yaw={PENCIL.yaw} pxPerMm={PENCIL.pxPerMm} shadow="lying" hover={hoverAt(t)} opacity={fade} />;
};

/** The end card, on the paper (v1 type: DM Sans 700 title, 500 line, the Veyago mark, then Caladea italic). */
const EndCard: React.FC = () => {
  const {t, isTall} = useChapter('providedFor');
  if (t < B.endCard.title) return null;
  const c = cardLayout(isTall);
  const [cx, titleY] = local([c.cx, c.titleBaseline]);
  const lineY = c.lineBaseline - ORIGIN[1];
  const camY = c.cambriaBaseline - ORIGIN[1];
  const markY = c.markTop - ORIGIN[1];
  const title = easeInOutCubic(win(t, B.endCard.title, B.endCard.title + 1.0));
  const line = smooth(win(t, B.endCard.line, B.endCard.line + 1.0));
  const mark = smooth(win(t, B.endCard.mark, B.endCard.mark + 1.0));
  const cambria = smooth(win(t, B.endCard.cambria.at, B.endCard.cambria.at + 1.0));
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, width: 1, height: 1, overflow: 'visible'}}>
      <text x={cx} y={titleY} textAnchor="middle" opacity={title} fill={COLORS.graphite} fontFamily={FONTS.super} fontWeight={700} fontSize={c.titleSize} letterSpacing={`${-0.02}em`}>
        {CARD.title}
      </text>
      <text x={cx} y={lineY} textAnchor="middle" opacity={line} fill={COLORS.graphiteSoft} fontFamily={FONTS.super} fontWeight={500} fontSize={c.lineSize}>
        {CARD.line}
      </text>
      {/* PLACEHOLDER mark: a plainly drawn caret in a rounded square. The owner supplies or confirms the real Veyago mark. */}
      <g opacity={0.85 * mark}>
        <rect x={cx - c.markSize / 2} y={markY} width={c.markSize} height={c.markSize} rx={c.markSize * 0.22} fill={COLORS.graphite} />
        <polyline
          points={`${cx - c.markSize * 0.22},${markY + c.markSize * 0.62} ${cx},${markY + c.markSize * 0.36} ${cx + c.markSize * 0.22},${markY + c.markSize * 0.62}`}
          fill="none"
          stroke={COLORS.paper}
          strokeWidth={c.markSize * 0.09}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <text x={cx} y={camY} textAnchor="middle" opacity={cambria} fill={COLORS.graphite} fontFamily={FONTS.closing} fontStyle="italic" fontWeight={400} fontSize={c.cambriaSize}>
        {CARD.cambria}
      </text>
    </svg>
  );
};

export const Art: React.FC = () => (
  <>
    <SetDownPencil />
    <EndCard />
  </>
);

const fill: React.CSSProperties = {position: 'absolute', inset: 0};

/** Screen space: the light dims and the paper returns (0-3), the super (3-11), the closing line (16-20.5). */
export const Overlay: React.FC = () => {
  const {t, isTall} = useChapter('providedFor');
  const black = 1 - easeInOutCubic(win(t, 0, 2.0));
  // no glow at 0.0 (chapter 10 ends on black): it rises as the title dims and is gone as the paper returns
  const glow = 0.5 * Math.sin(Math.PI * win(t, 0, 2.0));
  const titleLight = HANDOFF_LIGHT * (1 - easeInOutCubic(win(t, 0, 1.0)));
  // Texture and shadows come back 1.0-3.0: a flat paper wash over the textured sheet thins out.
  const wash = 0.55 * (1 - smooth(win(t, 1.0, 3.0)));
  const closing = smooth(win(t, B.closingLine.at, B.closingLine.at + B.closingLine.fadeSeconds)) * (1 - win(t, 20.0, 20.5));
  return (
    <>
      {wash > 0 ? <div style={{...fill, background: COLORS.paper, opacity: wash}} /> : null}
      {black > 0 ? <div style={{...fill, background: COLORS.void, opacity: black}} /> : null}
      {glow > 0 ? <div style={{...fill, background: 'radial-gradient(ellipse at 50% 50%, rgba(245,247,250,0.9) 0%, rgba(245,247,250,0) 60%)', opacity: glow}} /> : null}
      {titleLight > 0 ? (
        <div style={{...fill, opacity: titleLight}}>
          <TitleLayer t={80} format={isTall ? 'tall' : 'wide'} />
        </div>
      ) : null}
      {SUPERS.providedFor.map((s) => (
        <Super key={s.text} {...superFromBeat(s)} />
      ))}
      {closing > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 120,
            textAlign: 'center',
            fontFamily: FONTS.closing,
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: isTall ? 42 : 48,
            lineHeight: 1,
            color: COLORS.graphite,
            opacity: 0.85 * closing,
          }}
        >
          {B.closingLine.text}
        </div>
      ) : null}
    </>
  );
};

export const Chapter: React.FC = () => <ChapterShell id="providedFor" art={<Art />} overlay={<Overlay />} />;
