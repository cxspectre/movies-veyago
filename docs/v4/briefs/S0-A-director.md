# S0-A: the director (cloud, Fable or Opus, high effort, cap about $25)

Read first: `CONTRACT.md` (all, section 13 especially), `docs/SCRIPT-10MIN-v4.md`, `docs/v4/PLAN.md`, `docs/BIBLE.md` (the v1 bible: copy its level of numeric detail), `src/beats.ts` and `src/edits.ts` (the v1 beat sheet and cut-down patterns to follow), `src/film.ts`.

You are the creative director of the 10-minute film. You write direction, not scene code. The crew builds literally what you write, so be concrete and numeric. Stop at the spend cap and report. Work on branch `claude/s0a-director` and open a PR.

## Deliver
1. **`docs/v4/BIBLE4.md`**
   a. *The sheet.* A coordinate system for one endless sheet (logical px). Where each of the 11 chapter regions sits (centre, size), the unbroken pencil line as one SVG path in sheet coordinates (with the corner turns, the dips and climbs of chapter 1, the hand-off points between chapters), and where the glimpsed far-away chapters sit for the 0:18 pull-back. Every chapter's essential art lives in a central column about 1080 px wide so it reads in 16:9 and 9:16.
   b. *Camera.* For every chapter two keyframe lists (wide and tall): module-local time on the 0.5 s grid, centre, zoom, easing (use the v1 easing names), including the dives, the pull-backs (0:18 and 9:30) and the hand-offs along the line. State the level-of-detail rule (what renders at which zoom; far views use pre-rendered page images).
   c. *Ink and voice colours.* The sepia hex for MAYA; how FOUNDER graphite, MAKER accent and MAYA sepia apply to the pencil line and to supers; how the accent's v1 jobs (ticks, circles, margin notes) coexist without muddle.
   d. *Characters.* A design sheet for Maya, Dad, Leo, Mia, Jonas, Sam, Biscuit the dog: continuous-line, no filled faces, one accent detail each; the pose list per chapter with durations; how pose swaps are redrawn (flipbook of 2-4 poses).
   e. *Each chapter's beat sheet,* in module-local seconds on the 0.5 s grid: events, supers (text, ink, window), the VO line at each start, the components used (EndlessSheet, PencilLine, PopUp, LineCharacter, ScreenOnPaper, NumberRoll, FilterMachine, StringBoard, Cutaway, Village, InkToLight), the footage clip ids (from `public/footage/manifest.json` or "to capture"), and the sound cues needed (v1 `SfxName`s plus the new ones: fold, scissors, crumple, stamp, string, odometer, train, plane, rocket, marble run).
   f. *Cut-downs.* YouTube 16:9 10:00; 9:16: a 60-90 s hook, a ~3:00 cut, and chapter shorts (chapter, in/out, caption lines).
   g. *Music, voice and sound direction* per chapter (mood, key continuity with the v1 score in D-flat major, the 9:18 second of silence, where foley carries the scene).
   h. *Decisions and questions for the owner.* Resolve what you can; list the rest.
2. **`src/beats4.ts`**: a typed beat sheet per chapter (module-local seconds) plus helpers, and a `validateBeats4()` that checks every beat is inside its chapter slot and on the 0.5 s grid. Follow the structure of `src/beats.ts`. Chapter slots are the script's chapter map (11 chapters, 600 s total); S0-B writes `src/film4.ts`, so import chapter ids and slots from it if it exists, otherwise define a local table and note it.
3. **`src/edits4.ts`**: the cut-down edit lists using the v1 `EditSegment` types, with a validator.

## Rules that bite
Nothing on glass that was not first drawn on paper. The first app is never named and the banned plain-English word is never used. The design file is imagined: depict it as a drawn canvas of real app screens. Every number or date shown or spoken must exist in `docs/v4/CLAIMS.md` (S0-B writes it; add rows you introduce). Verify with `npx tsc --noEmit` and `zsh tools/checkRules.sh`.
