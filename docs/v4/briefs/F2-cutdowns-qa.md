# F2: the cut-downs (cloud, Sonnet High, CAP $10)

Read `docs/v4/briefs/C-common.md` (the same rules apply). Read `docs/v4/BIBLE4.md` section 6 (cut-downs), `src/edits4.ts`, `src/Root.tsx` and `src/previews4.ts` for how the cut-down compositions are registered, `docs/v4/AUDIO.md` and `tools/mix/edlCues4.ts` (the cue sheets for the same cuts).

Branch `claude/f2-cutdowns`. You own `src/edits4.ts` and `docs/v4/QA3.md`. No chapter folders.

The film has a 75 s hook (HOOK_75), a 3:00 cut (CUT_180) and 11 chapter shorts, each in 16:9 and 9:16, built from segments of the master (`src/edits4.ts`). Nobody has looked at them. For every cut-down, in both formats:
1. Render stills at each segment join (last frame of a segment, first frame of the next, and 0.5 s either side) and at the start and end. Judge: does the join read as an intentional cut or a glitch (a pencil line that jumps, a half-drawn super, an object appearing whole, a number roll cut mid-roll, a voice-over or caption cut mid-sentence)? Does each cut-down have a beginning that hooks in the first 2 seconds (the shorts are for TikTok and YouTube Shorts: the first frame must show something, never empty paper or a half-written word) and an ending that lands (not a mid-motion frame)?
2. Check every caption text in the EDLs against `docs/v4/CLAIMS.md` and the current spoken lines (`VO4` in `src/beats4.ts`, which was aligned to the claims sheet in E6): a caption must say what the voice says.
3. Check durations: HOOK_75 is 75 s, CUT_180 is 180 s, the shorts are about 30-60 s; `tools/mix/edlCues4.ts` must report no warnings on the real EDLs after your edits (run it).
4. Fix what you can inside `src/edits4.ts` (cut points moved to the nearest clean frame, segment order, in and out times, captions, segment trims), keeping the total durations. For problems that need chapter changes (a super that cannot be cut cleanly), write the exact change for the chapter owner.
5. `docs/v4/QA3.md`: per cut-down, a short verdict, the joins fixed and the joins still weak, with the master seconds. Contact sheets in `out/review/f2/` (not committed).
