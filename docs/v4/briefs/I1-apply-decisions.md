# I1: apply the owner's decisions (cloud, Sonnet High, CAP $10)

Read `docs/v4/briefs/C-common.md` (the same rules apply) and `docs/v4/OWNER-DECISIONS.md`: it is the list of what to change; do exactly that and nothing else.

Branch `claude/i1-decisions`. You own: `src/beats4.ts` (strings only, never a time), `src/edits4.ts` (captions and notes only), `docs/SCRIPT-10MIN-v4.md`, `docs/v4/voicelines.json`, `docs/v4/CLAIMS.md`, `docs/v4/PUBLISH.md`, `src/chapters/theNo/**`, `src/chapters/engineRoom/**`, `src/chapters/nameAndLook/**`, `src/chapters/paperToGlass/**`, `src/chapters/providedFor/**`.

## Do
Apply decisions 1, 2, 3, 4, 6, 7, 8, 9, 10, 11 of `docs/v4/OWNER-DECISIONS.md` (5 is no change). Every place the old words live: grep for `servers`, `21 September`, `twenty-first`, the seven old names, `placeholder`, the mark. Known places: `src/beats4.ts` (F5 line, the calendar block, the `date` beat note, the number rolls), `src/edits4.ts` (the theNo segment notes and captions), the script and `voicelines.json`, the chapter folders above, `CLAIMS.md` rows (A1-A3, A7, A10, B20, B26, B40, G6, G19, G27, G34-G36, G39, and any other row that quotes a changed string: mark each decided and say how), `PUBLISH.md` (it quotes several of these).
Keep a voice line short enough for its slot: F5 gets shorter, so no timing problem. The chapter-3 calendar: the page keeps its month grid; the pencil circles the month title "September 2026" at the same beat the day circle used to land; the number roll's target is `September 2026`; keep its timing and sound.

## Prove (stills, both formats)
Render before and after stills of: chapter 3 calendar at master 1:45-1:50 (`Master4-wide`/`-tall`), chapter 6 names sheet at about 3:57-4:00, chapter 7 test-count roll at 6:00-6:12 (no placeholder tag, the number reads as the real count), chapter 10 number rolls at 8:52-8:57 (the fourth says `0 accounts`), chapter 11 end card at 9:50-9:59 (no gap where the mark was; nothing cut off in tall). Check two adjacent frames of the two number rolls. `npx tsc --noEmit` and the rules check pass; run the rules check as `if zsh tools/checkRules.sh >/dev/null 2>&1; then echo OK; else echo FAIL; fi` (a pipe hides a failure). Report anything else you noticed that quotes a changed string.
