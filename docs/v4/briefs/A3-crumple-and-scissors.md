# A3: the crumple, the scissors and the page drop (cloud, Opus, effort high, CAP $10)

The pop-up paper (S1-C, `src/popup/`) works for folds, but its crumple reads as a jumble of facets, not a ball. Chapter 3 ("The no") needs three paper effects done properly.

Read first: `CONTRACT.md` (section 13), `docs/v4/BIBLE4.md` section 5.3 (the chapter 3 beat sheet) and 1.6, `src/popup/README.md` and `src/popup/**` (what exists and its known gaps), `src/paper/README.md` (pencil engine, lamp and shadow helpers; no `mix-blend-mode`).

Branch `claude/a3-crumple-scissors`, open a PR to `main`. Cloud rules (CONTRACT 13.7): stills only, `FILM_GL=swangle` if you touch WebGL, never commit `package-lock.json`, no sub-agents, do not edit `src/previews4.ts` beyond ONE additive line for your previews file. **Spend cap $10: three render-and-look rounds at most; stop when the deliverables are done; report.**

## Deliver (in `src/popup/effects/**`, exported through `src/popup/index.ts` additively)
1. **`<CrumpleBall>`**: a sheet carrying any React art (a letter with "Rejected" circled) shrinks while it crushes into an irregular paper ball: an irregular, faceted, shaded polygon mesh (2D or 2.5D, deterministic), shrinking silhouette, a few small rolls and a settle, with a soft lamp-consistent shadow that tightens as it shrinks. It must read as a crumpled ball at a glance in a still. Then **`<UnfoldFromBall>`**: the reverse, the ball opening into a flat cutaway drawing (any children), creases fading as it flattens.
2. **`<ScissorsCut>`**: drawn paper scissors (pencil style, simple) travel along a path, cutting a drawing in two; the halves slide apart in given directions, one labelled "keep" and one fading and blurring (the old name, idea and purpose), per BIBLE4 5.3. Shadows on both halves.
3. **`<PageDrop>`**: a calendar page drops in with a small bounce and settle, with a circled date; a hook for a `NumberRoll` beside it (the NumberRoll component is built separately; just leave the anchor).
4. **Proof**: `Effects-demo-wide` and `Effects-demo-tall` (registered via `src/popup/effects/previews.ts`), stills at scale 1 and one at scale 2 in `out/review/a3/`; check two adjacent frames mid-crumple for flicker. Record render time per frame in `src/popup/README.md` and the usage for chapter owners. `npx tsc --noEmit` and `zsh tools/checkRules.sh` must pass.
