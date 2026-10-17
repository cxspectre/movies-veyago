// MasterFilm4.tsx — the 10:00 master as the film is meant to be: ONE endless sheet, ONE unbroken pencil line, ONE camera
// (CAMERA in sheet4.ts) for the whole 600 s (BIBLE4 §1-2). Every chapter's `Art` sits in its region and mounts only while
// the camera is near it (<MasterRegion>: live while it runs, held on its last frame once finished); every chapter's
// `Overlay` mounts only inside its slot window. Chapter 10's void is all overlay over a parked camera; chapter 11's
// pull-back is just the camera and the regions it passes over. The old back-to-back version stays as MasterFilm4Series.
import React from 'react';
import {AbsoluteFill, Sequence, Series} from 'remotion';
import {CHAPTER_MODULES, CHAPTERS} from './chapters/registry';
import {lineGeometry} from './chapters/line/geometry';
import {EndlessSheet} from './endless/EndlessSheet';
import {MasterRegion} from './endless/MasterRegion';
import {PencilLine} from './endless/PencilLine';
import {useSheet} from './endless/sheetContext';
import {sec} from './film';
import {type ChapterId, SLOTS4, slotFrames4, slotOf4} from './film4';
import {KitScopeContext, regionOrigin} from './kit/context';

/**
 * Overlay windows that run past their slot, with a fade-out over the tail (seconds). Film-level hand-off fixes only.
 *   paperToGlass 1.0: the lit "Provisum 2" title (and its black) dims away over 9:30-9:31 on top of chapter 11's opening,
 *   instead of vanishing on the cut (BIBLE4 §5.11 0.0-1.0 "the title's light dims"). Remove it if chapter 11 draws the
 *   title itself.
 */
export const OVERLAY_TAILS: Partial<Record<ChapterId, number>> = {paperToGlass: 1.0};

/** The line with chapter 1's detours (heart rate, calendar, passport, key): the same path the whole film draws. */
const FILM_LINE = lineGeometry();

const smooth = (x: number): number => {
  const u = Math.min(1, Math.max(0, x));
  return u * u * (3 - 2 * u);
};

/** A chapter's screen-space layer, in kit scope, mounted only inside its slot (plus its tail, fading). */
const OverlayWindow: React.FC<{id: ChapterId; tail?: number; children?: React.ReactNode}> = ({id, tail = 0, children}) => {
  const {masterSeconds} = useSheet();
  const slot = slotOf4(id);
  if (masterSeconds < slot.start || masterSeconds >= slot.end + tail) return null;
  const opacity = masterSeconds < slot.end ? 1 : 1 - smooth((masterSeconds - slot.end) / tail);
  // Frames inside are module-local, as in the chapter's own ChapterShell (some overlays use <Sequence>/useCurrentFrame).
  const body = (
    <Sequence from={sec(slot.start)} layout="none" name={`${id} overlay`}>
      <KitScopeContext.Provider value={{chapter: id, origin: [0, 0]}}>{children}</KitScopeContext.Provider>
    </Sequence>
  );
  return opacity < 1 ? <AbsoluteFill style={{opacity}}>{body}</AbsoluteFill> : body;
};

const overlayOf = (id: ChapterId): React.ReactNode => {
  const Overlay = CHAPTER_MODULES[id].Overlay;
  return Overlay ? <Overlay /> : null;
};

export const MasterFilm4: React.FC<{showBounds?: boolean}> = ({showBounds = false}) => (
  <AbsoluteFill>
    <EndlessSheet
      showBounds={showBounds}
      overlay={
        <>
          <PencilLine geometry={FILM_LINE} />
          {SLOTS4.filter((s) => !OVERLAY_TAILS[s.id]).map((s) => (
            <OverlayWindow key={s.id} id={s.id}>
              {overlayOf(s.id)}
            </OverlayWindow>
          ))}
          {/* Tails go on top: the outgoing chapter's last image fades over the incoming chapter's first. */}
          {SLOTS4.filter((s) => OVERLAY_TAILS[s.id]).map((s) => (
            <OverlayWindow key={s.id} id={s.id} tail={OVERLAY_TAILS[s.id]}>
              {overlayOf(s.id)}
            </OverlayWindow>
          ))}
        </>
      }
    >
      {SLOTS4.map((s) => {
        const Art = CHAPTER_MODULES[s.id].Art;
        return (
          <MasterRegion key={s.id} id={s.id}>
            <KitScopeContext.Provider value={{chapter: s.id, origin: regionOrigin(s.id)}}>{Art ? <Art /> : null}</KitScopeContext.Provider>
          </MasterRegion>
        );
      })}
    </EndlessSheet>
  </AbsoluteFill>
);

/** The old master: every chapter alone (its own ChapterShell and camera), back to back. Registered as Master4-series-*. */
export const MasterFilm4Series: React.FC = () => (
  <Series>
    {SLOTS4.map((slot) => {
      const Chapter = CHAPTERS[slot.id];
      return (
        <Series.Sequence key={slot.id} durationInFrames={slotFrames4(slot.id)} name={slot.id}>
          <Chapter />
        </Series.Sequence>
      );
    })}
  </Series>
);
