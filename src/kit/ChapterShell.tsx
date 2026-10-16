// ChapterShell.tsx — the chapter template. A chapter is two layers on the ONE endless sheet:
//   art      (sheet space, region-local, mounted by <SheetRegion> only while the chapter runs and the camera is near/mid)
//   overlay  (screen space over the frame: screen supers, lower-thirds)
// The shell renders a chapter ALONE (its Chapter-<id>-wide/-tall preview, module-local frames): the sheet at the chapter's
// camera, the finished neighbours as their region images, the unbroken line, and both layers in kit scope (so kit pieces
// take SHEET coordinates and know their chapter's local time). The integrator's master puts every chapter's `Art` and
// `Overlay` on one sheet with <KitRegion> / <KitOverlay>, which is why a chapter exports them as well as `Chapter`.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EndlessSheet} from '../endless/EndlessSheet';
import {PencilLine, type PencilLineProps} from '../endless/PencilLine';
import {SheetRegion} from '../endless/SheetRegion';
import {useSheetCamera, type SheetCameraView} from '../endless/sheetContext';
import {type ChapterId, SLOTS4, slotOf4} from '../film4';
import {clamp01, KitScopeContext, regionOrigin, useLocalSeconds} from './context';

/** A chapter's region content in kit scope: kit pieces inside take SHEET px and read the chapter's local time. */
export const KitRegion: React.FC<{id: ChapterId; children?: React.ReactNode}> = ({id, children}) => (
  <SheetRegion id={id}>
    <KitScopeContext.Provider value={{chapter: id, origin: regionOrigin(id)}}>{children}</KitScopeContext.Provider>
  </SheetRegion>
);

/** A chapter's screen-space layer in kit scope (rendered only while the chapter's slot is running). */
export const KitOverlay: React.FC<{id: ChapterId; children?: React.ReactNode}> = ({id, children}) => {
  const {masterSeconds} = useSheetCamera();
  const slot = slotOf4(id);
  if (masterSeconds < slot.start || masterSeconds >= slot.end) return null;
  return <KitScopeContext.Provider value={{chapter: id, origin: [0, 0]}}>{children}</KitScopeContext.Provider>;
};

export type ChapterShellProps = {
  readonly id: ChapterId;
  /** Sheet-space content (kit pieces take SHEET px; plain elements are region-local px). */
  readonly art?: React.ReactNode;
  /** Screen-space content over the frame. */
  readonly overlay?: React.ReactNode;
  /** The unbroken line (default: the film's). Chapter 1 passes its own geometry; `false` hides it (review stills). */
  readonly line?: PencilLineProps | false;
  /** Draw the other chapters' regions (their images when finished; default true). */
  readonly neighbours?: boolean;
  readonly showBounds?: boolean;
};

/** Use as the body of a chapter's `Chapter` component: `export const Chapter = () => <ChapterShell id="theNo" art={<Art />} overlay={<Overlay />} />`. */
export const ChapterShell: React.FC<ChapterShellProps> = ({id, art, overlay, line = {}, neighbours = true, showBounds = false}) => (
  <AbsoluteFill>
    <EndlessSheet
      chapterId={id}
      showBounds={showBounds}
      overlay={
        <>
          {line === false ? null : <PencilLine {...line} />}
          <KitOverlay id={id}>{overlay}</KitOverlay>
        </>
      }
    >
      {neighbours ? SLOTS4.filter((s) => s.id !== id).map((s) => <SheetRegion key={s.id} id={s.id} />) : null}
      <KitRegion id={id}>{art}</KitRegion>
    </EndlessSheet>
  </AbsoluteFill>
);

export type ChapterClock = {
  /** Module-local seconds (the bible's chapter times). */
  readonly t: number;
  /** 0-1 progress through [from, to] (module-local seconds), clamped. */
  readonly between: (from: number, to: number) => number;
  /** True while from ≤ t < to. */
  readonly during: (from: number, to: number) => boolean;
  /** The camera, LOD, format and sheet→screen mapping (useSheetCamera). */
  readonly camera: SheetCameraView;
  readonly isTall: boolean;
};

/** The chapter's clock and camera, from anywhere inside a ChapterShell (art or overlay). */
export const useChapter = (id: ChapterId): ChapterClock => {
  const t = useLocalSeconds();
  const camera = useSheetCamera(id);
  const local = camera.localSeconds ?? t;
  return {
    t: local,
    between: (from, to) => clamp01((local - from) / Math.max(1e-6, to - from)),
    during: (from, to) => local >= from && local < to,
    camera,
    isTall: camera.format === 'tall',
  };
};
