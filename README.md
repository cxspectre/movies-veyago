# Veyago Movies

The source of two films about Provisum, built in code with [Remotion](https://www.remotion.dev) and three.js:

- **Provisum 2: how it was made, and why**, the 10-minute story film (v4, in production). Script: `docs/SCRIPT-10MIN-v4.md`.
- **Provided For**, the earlier 2:40 launch film (16:9 master, 0:45 vertical, 0:15 teasers). Script: `docs/SCRIPT.md`.

Every image is drawn, animated or rendered, or is a recording of the app running on fictional data. Nothing here is a real family.

## Run it
```
npm install
npx remotion studio src/index.ts                 # preview in the browser
npx tsx tools/stills.ts <CompositionId> 1 0,60,120 --sheet=out/sheet.png
zsh tools/checkRules.sh                          # identity and asset rules; run before every commit
npx tsc --noEmit                                 # typecheck
```
Composition ids you will use: `Master4-wide` and `Master4-tall` (the 10-minute film, 16:9 and 9:16), `Chapter-<id>-wide` and `Chapter-<id>-tall` (one chapter, chapter-local frames at 30 fps), and `Master-wide` for the 2:40 film. Renders and stills go to `out/`, which is not in git. Sound is made locally (see `docs/v4/AUDIO.md`); the sample libraries, voices and rendered audio are not in the repository (see `docs/ASSETS.md`).

## Folder map
- `src/paper`: the pencil-on-paper drawing engine.
- `src/endless`: the endless-canvas camera and layout helpers.
- `src/chapters`: the eleven chapters of the 10-minute film and their registry.
- `src/kit`: shared building blocks for chapters.
- `src/characters`: the drawn characters.
- `src/popup`: pop-up paper elements.
- `src/devices`: the drawn phone, watch and laptop hardware.
- `src/glass`: what appears on screens (always drawn on paper first).
- `src/audio`: audio cue data and timing used by the compositions.
- `tools/`: stills, render, capture, music, voice, foley and mix tooling.
- `docs/v4/`: plan, art bible, claims sheet, audit notes and the briefs.
- `public/`: fonts, textures, brand marks and the recorded app footage (`manifest.json` files describe each clip).
- `docs/`: scripts, older bible and decisions, asset notes.

## How it was made
The film was planned in a conductor chat and then built by cloud coding sessions, each working from a written brief in `docs/v4/briefs/` and owning a short list of folders. Review passes rendered still frames and fixed what they found. People made the decisions; the sessions wrote and checked the code. Briefs and notes are retained as they were written.

## The rules
`CONTRACT.md` binds every contributor and session: identity rules, fictional data only, on-screen copy, the one rule of the film (nothing appears on glass that was not first drawn on paper), and the layout and timing contract. Read it first.

## Not in git
`node_modules/`, `.venv/`, `out/` (renders), `audio/` (rendered stems, music, voice and foley) and `tools/music/.vendor/` (downloaded sample library).

## Licence
No licence has been chosen yet. Until one is added, all rights are reserved. Third-party assets and dependencies are listed in `docs/ASSETS.md`.
