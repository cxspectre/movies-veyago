# D2: chapter handoff pops and camera fixes (cloud, Sonnet High, CAP $14)

Read `docs/v4/briefs/C-common.md` (the same rules apply) and `docs/v4/MASTER4-AUDIT.md` (the boundary table and "Fixes requested").

Branch `claude/d2-handoffs`. You own `src/sheet4.ts` (the camera keys and anchors), `src/chapters/nameAndLook/**`, `src/chapters/launch/**`, `src/chapters/village/**`, `src/chapters/providedFor/**`. Never move a slot boundary in `src/film4.ts`. The proof is `Master4-wide` / `-tall` stills (one browser, `tools/stills.ts`).

## Fix
1. **Chapter 6 (3:55.0)**: the names sheet appears whole on the paper at local 0.0. Bring it in with the line, which reaches it at local 4.5 (`LINE_ANCHORS.nameAndLook`): draw its outline on over 0.0-4.5 like the other hand-drawn frames (audit item 1).
2. **Chapter 8 (6:05.0)**: the pad and the standing rocket appear whole at local 0.0 but the line reaches the pad at 3.0: draw the pad's strokes on over 0.0-3.0 and fade the rocket body in over 2.5-3.0 (audit item 2).
3. **Chapter 9 (6:55.0)**: Dad's lit window (the binder home screen) vanishes at local 0.0: the village's Dad house must still show chapter 8's lit window at 0.0 (audit item 3; the house art is now shared, `src/chapters/launch/houseArt.tsx`, so put the window in the shared art or pass it as a prop).
4. **Chapter 11's super** `A no. Five filters. One idea. A whole village.` is crossed by the pencil line around 9:35 in wide (the line runs through the text): move it clear of the line in both formats for its whole window (3.0-11.0 local).
5. **Camera** (`src/sheet4.ts`), from the session reports: chapter 11 tall camera centre x 38300 to about 38020 (then remove the tall pencil workaround in `providedFor`); chapter 5 tall: the hand truck at x 17100 is outside the visible column during local 58-65 s, so add a tall override (for example zoom 0.55 at t 47-61, or centre x about 16800); chapter 3's last key 40.0 at about (12600, 3300) so the line stays in frame at 1:55; chapter 9: the green's form and speech bubble overlap the Maya and Jonas walls, move the bubble to about (27610, 3720) in the village folder and adjust the camera keys that point at it; chapter 2 to 3 in tall: the line head is just off-frame at 1:15 (optional, only if cheap).
6. Check each with `Master4-wide` and `-tall` stills: before and after at the three boundaries (3:55, 6:05, 6:55) and at the times above, and adjacent frames across each boundary for pops.
