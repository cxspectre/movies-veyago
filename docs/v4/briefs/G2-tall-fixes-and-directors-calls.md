# G2: tall-format fixes and the director's calls on the shorts (cloud, Sonnet High, CAP $12)

Read `docs/v4/briefs/C-common.md` (the same rules apply), `docs/v4/QA2.md` and `docs/v4/QA3.md` (sections "For the chapter owners" and the table of shorts).

Branch `claude/g2-tall-fixes`. You own `src/edits4.ts`, the TALL camera keys and overrides in `src/sheet4.ts`, `src/chapters/line/**`, `src/chapters/filterMachine/**`, `src/chapters/researchBoard/**`, `src/chapters/village/**`. Prove every fix with `Master4-tall` stills (before and after), and for the EDL changes with the stills from `tools/cutdownFrames.ts`.

## Fix
1. **Chapter 1 tall**: "Every app starts as a line." leaves the frame on the left from about 6.3 s as the camera follows the pencil: hold the tall camera on the super until about 7.5 s, or anchor the super inside the central column, without changing the line's path or the handoff to chapter 2.
2. **Chapter 5 tall**: "Six building blocks. Everything else hangs off them." is cut on the left at local 53.0: keep it inside the central 1080 px.
3. **Chapter 4 tall**: the top gate label "Useful for years, not for a week" is cut by the top edge at local 35.0: keep the whole machine's labels in frame.
4. **Hook and cut join, village to glass** (village local 13.0 to paperToGlass 0.0 in HOOK_75): the same houses at a different zoom, with the Europe outline and the green form appearing whole, so it reads as a jump cut: make village 13.0 show the same framing as paperToGlass 0.0 in the hook's slice (a tall camera key in `sheet4.ts`, or a different out point in the EDL), without changing the full film's camera more than you must.
5. **Director's calls on the shorts** (decided): Short-launch starts about 3.0 (the statuses) and finds its 2 s elsewhere in the chapter; Short-mayasHouse ends on its last readable beat and drops the empty paper at 43.5-45 (it may be 1.5 s shorter); Short-researchBoard and Short-engineRoom start on the first frame where something readable is drawn (move the start, keep the length by extending the end to a landing); filterMachine at 1:55 in CUT_180 and providedFor 12.0 (the dive) in CUT_180: shorten or move so no join sits on near-empty paper for more than 0.5 s. Captions under a super that says nearly the same thing as the voice: KEEP the caption (an uncaptioned voice is worse). Keep all totals except where a short's own length changes; HOOK_75 stays 75.0 s and CUT_180 stays 180.0 s.
6. Run `npx tsx tools/mix/edlCues4.ts --out-dir <outside audio/>` and report no warnings; update `docs/v4/QA3.md` rows you changed.
