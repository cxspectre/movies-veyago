# Chapter 10, paperToGlass (8:10-9:30, local 0-80)

Overlay-only chapter (parked camera, screen space); `Art` is empty. Files: `Chapter.tsx` (everything), `motion.ts` (pure state maps), `VillageLight.tsx` + `village.ts` (0-10 s), `Invite.tsx` (60-68 s), `title/` (v1 title copied, re-timed from beats4), `cues.ts`.
Reuses (imports, v1 untouched): `src/devices`, `src/glass`, v1 `scenes/familyOfDevices/layout` (run on `t - 36.0`), `DockStarPatch`, `transition/homeScreen`.

## Measured (cloud, 4 cores, FILM_GL=swangle, 1080p, scale 1, one browser reused)
- Step 0: v1 `Devices-phone-still-wide`: 3.7-3.9 s per still (plus about 35 s bundle). Works.
- Chapter stills: no WebGL (0-7 s, 42-47 s, 68+ s): 1.0-1.3 s; phone stills 3-5 s; clip-on-screen or bleed stills 3.5-13 s (cold video seek). Tall similar. (The 5-10 s figures in the last run are the three-frame run including video seeks.)

## Not done / weak
- Village-to-light uses my own front-elevation hairlines from `HOUSES`, not chapter 9's strokes (those are popup nets). The paper beneath is only what the sheet shows. The 8.0-9.7 re-trace into the phone outline is a visible scribble (strokes resampled onto perimeter arcs); it fades by 9.7.
- Hard stop has no cue kind in `audio/cues.ts`; the silence is the beats4 `hard-stop` beat.
- Plane frames 62-64 and snap-flare frames not individually inspected. Bleed crops use centre focus (not tuned per clip). Labels sit min(48 px, frame edge) under the phone.
- Tall row of five is 24% height (26% would not fit 1080 px); tall family layout is v1's tuned one, not BIBLE4's numbers. Far-phone notification card floats above the phone (too small to read inside it).
