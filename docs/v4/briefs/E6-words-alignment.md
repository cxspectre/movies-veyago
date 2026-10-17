# E6: bring the spoken words and supers in line with the claims sheet (cloud, Sonnet High, CAP $8; text only)

Branch `claude/e6-words`. You own `src/beats4.ts` (strings only, never a time), `docs/SCRIPT-10MIN-v4.md`, `docs/v4/voicelines.json`, `src/edits4.ts` (captions only) and `docs/v4/CLAIMS.md`. Read `docs/v4/briefs/C-common.md`, `docs/v4/QA1.md` (section 2 row "Claims in the build that contradict the claims sheet" and section 3) and `docs/v4/CLAIMS.md`.

QA1 found that some spoken lines and supers still carry wordings the claims sheet rejected (spoken M10 "the day before", M11 "There is no Veyago server", M5 "Everything the app does...", F12/F9 "day two", `SUPERS.nameAndLook` "Dozens of versions" while the code shows "Many versions"). Task:
1. For every row of `docs/v4/CLAIMS.md` whose status already says REWORD, REMOVED or a decided wording, make `beats4.ts`, the script, `voicelines.json` and the cut-down captions match it exactly (spoken line and super say the same thing).
2. For every row that is still UNCONFIRMED or waits for an owner answer (QA1 section 3), change nothing; list them in your report with the exact current text and where it lives.
3. Keep the voice-over timings valid: a reworded line must not be longer than its slot (`VO4` durations, the next beat's time); where a rewording is longer, shorten it and say so. Run `npx tsc --noEmit`, `zsh tools/checkRules.sh` and, if the voice tooling has a duration estimate (`tools/vo4`), report any line that now overruns.
4. Never write the first app's name or its plain-English form, even in a note.
