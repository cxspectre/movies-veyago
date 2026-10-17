# Chapter 10, paperToGlass (8:10-9:30, local 0-80)

Overlay-only chapter (parked camera, screen space); `Art` is empty. Files: `Chapter.tsx` (everything), `motion.ts` (pure state maps), `VillageLight.tsx` + `village.ts` (0-10 s), `Invite.tsx` (60-68 s), `title/` (v1 title copied, re-timed from beats4), `cues.ts`.
Reuses (imports, v1 untouched): `src/devices`, `src/glass`, v1 `scenes/familyOfDevices/layout` (run on `t - 36.0`), `DockStarPatch`, `transition/homeScreen`.

## Measured (cloud, 4 cores, FILM_GL=swangle, 1080p, scale 1, one browser reused)
- Step 0: v1 `Devices-phone-still-wide`: 3.7-3.9 s per still (plus about 35 s bundle). Works.
- Chapter stills: no WebGL (0-7 s, 42-47 s, 68+ s): 1.0-1.3 s; phone stills 3-5 s; clip-on-screen or bleed stills 3.5-13 s (cold video seek). Tall similar. (The 5-10 s figures in the last run are the three-frame run including video seeks.)

## C3 polish
- Handoff: the title holds fully lit to 79.5 and dims to `HANDOFF_LIGHT` (0.6, motion.ts) by 80.0; chapter 11 draws the same `TitleLayer` at that level and dims it 0-1 while the paper returns (its glow now rises from nothing instead of popping in).
- Bleed labels sit in a dark scrim pill near the foot (both formats); void labels sit on the void under the phone.
- 8.0-9.7: each house's own clean lines are mapped (translate + scale, no resampling) onto the phone rectangle; the phone's rounded outline is drawn in light 8.4-10.0.
- Tall: row of five stays at 24% (26% is 240 px wide per phone, five need 1200 px in a 1080 frame). Far phone has a lit lock screen and the invitation card overlaps its screen; the plane swings out to the right around the near phone.
- Silence cue: `silence` is not in src/audio/cues.ts on main yet; a comment in cues.ts says what to add.

## Weak
- Village strokes are still my front-elevation hairlines, not chapter 9's. Far-phone screen is a drawn gradient (no words). Wide far phone is mostly covered by its card.
