// index.ts — the shared chapter kit's public API. Import from 'src/kit' (or '../../kit' from a chapter folder).
export {Super, superCues, superFromBeat, superTiming, defaultWriteSeconds, SCREEN_ANCHORS, type ScreenAnchorName, type SuperAnchor, type SuperInk, type SuperProps} from './Super';
export {NumberRoll, numberRollCue, rollState, type NumberRollInk, type NumberRollProps} from './NumberRoll';
export {ScreenOnPaper, deviceGeometry, type Device, type DeviceGeometry, type ScreenFit, type ScreenOnPaperProps} from './ScreenOnPaper';
export {footageClip, footageStill, stillSource, type ScreenSource} from './footage';
export {ChapterShell, KitOverlay, KitRegion, useChapter, type ChapterClock, type ChapterShellProps} from './ChapterShell';
export {KitScopeContext, regionOrigin, useIsNear, useLocalSeconds, useSheetZoom, useToLocal, type KitScope} from './context';
