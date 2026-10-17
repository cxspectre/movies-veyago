# C3: polish chapters 10 and 11 (cloud, Sonnet High, CAP $14)

Branch `claude/c3-glass-end`. You own `src/chapters/paperToGlass/**` and `src/chapters/providedFor/**` only. The first versions are merged (PR #14, #15); read their READMEs and the review list below.

## Fix, in this order
1. **The 9:30 handoff.** Chapter 10 ends at 80.0 on the full lit title ("Provisum 2", subline); chapter 11 starts on a bare grey glow with no title. Fix both so the cut is invisible: chapter 10 holds the title fully lit to 79.5 and dims it 79.5-80.0 exactly as BIBLE4 5.10 says; chapter 11 draws the same title dimming from the same light level over 0.0-1.0 (BIBLE4 5.11) while the paper returns. Render the last frame of 10 and the first frames of 11 side by side to prove the match.
2. **Labels over the real app screens.** In the bleed recordings (48-60) the label ("See who joined", "Shared costs", and so on) lands on top of the app's own text. Give every label a clear place (a dark scrim pill, or the void edge outside the screen) in both formats, for all nine snaps and all eight recordings.
3. **The 8.0-9.7 re-trace.** The houses folding into the phone outline reads as a scribble (strokes resampled onto perimeter arcs). Make it read as paper turning into light: each house's outline moves and resizes toward the phone outline while the lines stay clean; the phone outline completes at 10.0. Both formats.
4. **Tall layouts.** The row of five is 24% height (BIBLE4 asks 26%): fix or document why not. The far phone at 62-66 is a dark box and the notification card floats above it: light the far phone's screen (the drawn invitation card inside, readable) and place the plane's path for tall. In chapter 11 tall the pencil is half off the frame during the end card: keep the whole pencil visible, lower-left.
5. **Frames nobody inspected**: 62-64 (the plane), the snap flare frames, the number rolls (42-46.5, check `0 servers` is the 4th), the 79.5 dim. Render and fix.
6. The hard stop's silence cue: if `silence` exists in `src/audio/cues.ts` on `main` when you start (the C2 session adds it), put one at 68.0 for 2.0 s in chapter 10's `cues.ts`; otherwise leave a one-line comment and say so.
7. Chapter 11's Veyago mark is a drawn placeholder (a caret in a rounded square): keep it, but make it clearly a plain drawn mark and say in the report that the owner must supply or confirm the real one.

Owner decisions pending, flag in the report: `0 servers`, `Free on the App Store`, the invitation wording `Maya invited you to "Sam".`. Do not change the words.
