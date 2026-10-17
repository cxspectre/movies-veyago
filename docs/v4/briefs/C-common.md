# Wave C: assembly, audio plumbing and polish sessions, common rules (read this first, then your own brief)

All 11 chapters exist on `main` (PRs #1-#15). Wave C does NOT add chapters: it joins them, fixes what review found and prepares the sound. Each session owns a short list of folders; do not touch anyone else's.

## Read first
`CONTRACT.md` (section 13), `docs/v4/PLAN.md`, `docs/v4/BIBLE4.md` (sections 1-3, 7, and the beat sheet of every chapter you touch), `docs/v4/CLAIMS.md`, `src/kit/README.md`, `src/endless/README.md`, `src/characters/README.md`, `src/popup/README.md`, `src/paper/README.md`, the README and `previews.ts` of your chapter folders.

## Rules
Cloud rules of CONTRACT 13.7: stills only (no video renders), `FILM_GL=swangle` if you touch WebGL, never commit `package-lock.json`, no sub-agents. Do not edit `src/chapters/registry.ts` or `src/previews4.ts` unless your brief says so. Branch as named in your brief, open a PR to `main`, and do not merge it. Stay inside the folders your brief lists; if you need a change anywhere else, do not make it: write it in the report with the exact file and edit. Nothing on glass that was not first drawn on paper. The first app is never named; the plain-English form of its name is banned. The design file is imagined. App Store, store results, reviews and terminal text are drawn. Any new word, number or date on screen needs a row in `docs/v4/CLAIMS.md`.

## How to work (cheap and honest)
1. Render BEFORE stills of the problem first (`npx tsx tools/stills.ts <Composition> 1 <frames> --sheet=out/review/<id>/before.png`; the Chapter-<id>-wide and -tall compositions use chapter-local frames at 30 fps), LOOK at them, fix, render AFTER stills, LOOK. At most two render-and-look rounds. Look at both formats; in tall the essential art must sit in the central 1080 px column (BIBLE4 1.7).
2. Review at least 12 frames per format across the whole chapter, including mid-motion frames, not only the end states.
3. Check two adjacent frames of any fast motion for flicker.
4. `npx tsc --noEmit` and `zsh tools/checkRules.sh` must pass.
5. Stop at the cap even if unfinished: push what works and list exactly what is done, what is partly done and what is not.

## Report
Files changed, before/after stills (paths in `out/review/<id>/`; they are not committed), measured seconds per still, what is still weak, and every claim, word or placeholder the owner must confirm.
