# C1: Master4, the real single-sheet master and the handoff audit (cloud, Opus if the picker offers it, else Sonnet High, CAP $25)

Branch `claude/c1-master`. You own: `src/MasterFilm4.tsx`, `src/sheet4.ts`, `src/endless/**`, `src/film4.ts` (never move a slot boundary), your own new files, and ONE additive block in `src/previews4.ts` for your previews. Chapter folders are read-only for you.

## The problem
`MasterFilm4` today plays the eleven chapters back to back in a `Series`, each with its own camera. That is a stack of clips, not the film: the film is one endless sheet, one unbroken pencil line and one global camera (BIBLE4 1, 2). Chapters export `Art` (sheet space) and `Overlay` (screen space) for exactly this (`src/chapters/registry.ts`, `src/kit/README.md`: `KitRegion`, `KitOverlay`).

## Build
1. A new `MasterFilm4`: ONE `EndlessSheet` with the `PencilLine`, ONE camera driven by `CAMERA` in `sheet4.ts` for the whole 600 s, every chapter's `Art` placed in its region (mounted only while the camera is near it: level of detail, see `src/endless/README.md`), and each chapter's `Overlay` mounted only inside its slot window. Chapter 10 (parked camera, the void is screen space) and chapter 11 (the pull-back) are special: read BIBLE4 2, 5.10 and 5.11. Keep the old back-to-back version registered as `Master4-series-wide` / `-tall` for debugging; the new one is `Master4-wide` / `-tall`.
2. **Handoff audit.** For each of the 10 chapter boundaries render stills at slot end minus 0.5 s, the end, the next start and next start plus 0.5 s, both formats (a contact sheet per boundary). The line must be continuous across every boundary, the camera must not jump, and no overlay may pop. Fix what is film-level (camera keys, overlay windows, line path joins) in your folders. For chapter-level mismatches write the exact fix for the owner of that chapter: known one: chapter 10 ends on the full lit "Provisum 2" title but chapter 11 starts on a bare grey glow (the title is missing at 9:30).
3. **Cost.** Measure seconds per still of `Master4` at 1080p at five sample times (a chapter of many regions, the glass, the pull-back). If any is above about 20 s a 4K full render is unaffordable: propose and implement the culling that fixes it (only mount Art near the camera; use the sheet's LOD images where they exist).
4. Far-zoom LOD images (`tools/renderSheetLod.ts`) are NOT your job (a later wave, after the polish merges); say what the pull-back at 9:30 looks like without them.

## Deliver
`MasterFilm4` and its previews, the audit contact sheets in `out/review/c1/`, a short `docs/v4/MASTER4-AUDIT.md` (each boundary: verdict, fix applied or fix requested), the timing table. Report as in C-common.
