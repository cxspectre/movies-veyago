# B9: chapter 11, `providedFor` 9:30-10:00 (cloud, Sonnet Medium, CAP $8)

Read `docs/v4/briefs/B-common.md` first, then BIBLE4 sections 1.3, 1.5, 1.6 and 5.11, and the script's "11. Provided for". Beat times are in `src/beats4.ts` (`providedFor`, F16 at 14.0, `SUPERS`); never hard-code a time it holds.

Build `src/chapters/providedFor/`: the end of the film, all on paper and 2D, so no WebGL is needed.

1. **0.0-3.0** the glow fades back into graphite: the title's light dims, the paper returns (black to #F3EEE3, texture and shadows after), the village is graphite again where chapter 9 left it. Chapter 10 ends at 79.5 with the light beginning to dim; match that state exactly.
2. **0.0-11.0** the pull-back to the whole sheet (`easeInOutQuint`) and the line's last stretch from (28800, 3300) to (37420, 4005) at 2.0-11.0. Use the endless sheet's level of detail as it is described in `src/endless/README.md` and BIBLE4 1.6. Chapters 4 and 5 are still stubs and the far-zoom images for the finished regions have not all been generated: do NOT generate them (that is a separate local job); render what the engine gives you and say in the report what the pull-back looked like and which regions were empty or stubs.
3. **3.0-11.0** the super `A no. Five filters. One idea. A whole village.` in screen space, graphite (from `SUPERS`).
4. **12.0-15.0** the dive to the pencil: the line's end leads into the tip of the v1 graphite pencil prop (`src/desk`, 520 px, lying at 12 degrees, shadow per the v1 lamp). **15.0-17.0** it sets itself down (rises 20 px, shadow softens, lowers, stops a hair above the paper).
5. **16.0-20.0** the closing line `Provided for.` (Caladea italic 400, 48 px wide / 42 tall, graphite 85%, 120 px above the bottom edge; out 20.0-20.5).
6. **20.0-24.0** the end card on paper: `Provisum 2`, `Free on the App Store`, the Veyago mark, `Made by Veyago. Private by design.` in the order and sizes of BIBLE4 5.11 (reuse the v1 end card type; check the claims sheet for `Free on the App Store`). Nothing moves after 24.0. Hold to 30.0; **no fade**.
7. `cues.ts`: the complete list from BIBLE4 5.11 and 7 (`pencil_click` at 28.0 is the last sound of the film, no tail beyond 0.4 s; nothing sounds between the final chord's decay at 24.0 and the click). `previews.ts` for extra stills.

## Proof
Stills at scale 1 into `out/review/b9/` (contact sheet): `Chapter-providedFor-wide` and `-tall` at 0, 1.5, 3, 6, 11, 13, 15, 17, 18, 20.5, 22, 24, 29.9. LOOK; at most two rounds. In tall, check the end card and the closing line against the 1080 px column. Record the measured seconds per frame.

`npx tsc --noEmit` and `zsh tools/checkRules.sh` must pass. Claims to confirm in your report: `Free on the App Store`, `Made by Veyago. Private by design.`, the Veyago mark you drew, and the super.
