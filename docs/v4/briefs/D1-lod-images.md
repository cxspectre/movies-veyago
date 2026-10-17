# D1: the sheet's level-of-detail images and the pull-back (cloud, Sonnet High, CAP $20; runs beside D2 and D3)

Read `docs/v4/briefs/C-common.md` (the same rules apply), `docs/v4/MASTER4-AUDIT.md` (especially "How regions mount" and "The 9:30 pull-back without LOD images"), `src/endless/README.md`, `tools/renderSheetLod.ts`, `src/endless/lod.ts`, `src/endless/MasterRegion.tsx`.

Branch `claude/d1-lod`. You own `tools/renderSheetLod.ts`, `src/endless/**`, `src/endless/lodManifest.ts`, `public/tex/sheet/**` and `docs/v4/LOD.md`. Chapter folders are read-only.

## Problem
The images in `public/tex/sheet/` are still placeholder marks. So below zoom 0.15 (the opening far view at 0:18, the 9:36-9:42 pull-back and the dive back in) the whole sheet is the unbroken line plus grey ticks: none of the finished drawings show, and the end of the film (the whole sheet as one drawing) does not pay off.

## Build
1. Make each chapter's finished region render correctly through the tool (`SheetRegionAlpha-<id>`, `SheetFarAlpha-rough`, `SheetFarAlpha-done`; if a chapter's finished state is missing or wrong, fix the composition wiring in `src/endless`, not the chapter art) and run `npx tsx tools/renderSheetLod.ts` with `FILM_GL=swangle` for all 11 regions, `far-rough.png` (the glimpses, BIBLE4 1.5) and `far-done.png`. Trim and compress the PNGs so the whole set is committed under about 25 MB; report each file's size. If it cannot fit, lower the region scale and say so.
2. Add every chapter id that now has a real image to `FINAL_REGION_IMAGES` in `MasterRegion.tsx`, so the images replace the held art. The swap must not pop: render adjacent frames across the zoom 0.30 to 0.15 fade in both formats and check.
3. Verify with `Master4-wide` / `-tall` stills (the master is the proof): the opening far view at 0:18 (glimpses, both formats), and the pull-back at master seconds 570 to 592 in 2 s steps (both formats), the 2:45 pass back over Maya's house, and the dive at 9:42-9:45. The whole-sheet view at 9:41 must show every chapter's finished drawing, small but recognisable, along the unbroken line.
4. Write `docs/v4/LOD.md`: how to regenerate (the exact command), when it must be re-run (after any chapter art change), file sizes, and what each far image shows.

Report as in C-common, with the contact sheets.

## Running beside D2
Another session (D2) is changing the art of chapters 6 (`nameAndLook`), 8 (`launch`), 9 (`village`) and 11 (`providedFor`) at the same time. Render from `main` as it is, and when you are done: `git fetch origin && git merge origin/main`. If D2's PR has merged by then and touched those four chapters, re-run `renderSheetLod.ts` for those ids and `far-done`, commit the new images and re-check the pull-back stills. If D2 has not merged yet, say so at the top of your report (list which images will need a re-run: `nameAndLook`, `launch`, `village`, `providedFor`, `far-done`) and the conductor will re-run them after D2 lands. Do not edit D2's folders.
