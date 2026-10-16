# Veyago Movies

Films for Provisum, built in code with [Remotion](https://www.remotion.dev) and three.js. Every image is drawn, animated or rendered, or is a screen recording of the app.

## What is here
- `CONTRACT.md` is the shared interface for everyone working on a film (rules, layout, timing, ownership). Read it first.
- `docs/` holds the scripts, the art bible, decisions and footage notes.
- `src/` is the film: `film.ts` (timeline and tokens), `beats.ts` (every timing), `edits.ts` (cut-downs), `paper/` (pencil-on-paper engine), `sketches/`, `scenes/`, `desk/`, `devices/`, `glass/`, `edit/`.
- `public/` holds fonts, textures, brand marks and the recorded app footage (`footage/manifest.json` describes each clip).
- `tools/` holds the render, stills, mix, music, voice and foley tooling.

## Run it
```
npm install
npx remotion studio src/index.ts          # preview
npx tsx tools/stills.ts <CompositionId> 1 0,60,120 --sheet=out/sheet.png
npx tsx tools/render.ts Master-wide --out=out/master.mp4 --scale=1 --slots
zsh tools/checkRules.sh                   # identity and asset rules, run before every commit
```

## Not in git (regenerate or keep locally)
`node_modules/`, `.venv/`, `out/` (renders), `audio/` (rendered stems, music, voice and foley WAVs) and the music sample library under `tools/music/.vendor/`. Sound is generated on a Mac; see `tools/music`, `tools/vo` and `tools/foley`.

## Status
The 2:40 launch film "Provided For" (16:9 master, 0:45 vertical, 0:15 teasers) is built. The 10-minute story film (v4) is in production: see `docs/v4/PLAN.md` and `docs/SCRIPT-10MIN-v4.md`; stage-0 briefs are in `docs/v4/briefs/`.
