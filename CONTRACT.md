# CONTRACT — "Provided For" (Provisum 2 film)

Every agent on this film reads this file first. It is the shared interface. The creative source is `docs/SCRIPT.md`.

## 0. Deliverables
1. **16:9 master**, 2:40, 3840x2160, 30 fps (also a 1080p proof). Composition `Master-wide`.
2. **9:16 cut-down**, 0:45, 2160x3840 (and 1080x1920 proof): shots 4, 6 (two pages), 9, 12, 13, 16, 18 (four cuts), 21 of the script.
3. **0:15 teaser** (9:16, plus 16:9 if cheap): shot 4, a two-second sketch montage, shot 12, black, "Provisum 2".
4. Audio stems for each: music, foley, VO, plus a "no VO" mix. Captions burned into the 9:16 versions only.

## 1. Hard rules (violating any of these fails the film)
- **Identity:** the predecessor product name (a four-letter word starting with K, any case) must never appear in code, comments, filenames, strings, fonts, metadata or rendered pixels. Phrase around it.
- **Apple:** no Apple logos, event artwork or Apple typefaces (no SF Pro, SF Symbols glyph art, New York). Naming "Apple Watch" and "Apple Wallet" as features in words is fine. The phone/watch hardware is drawn by us, generic, un-badged (no logo on the back).
- **Fictional family only:** no real names, numbers, addresses, faces. The sample binder "Mom" / fictional names from the app's own sample data are fine. Never type real personal data into the Simulator.
- **Copy:** plain, warm, sentence case. Words to avoid in on-screen copy: receipt, warranty, claim, proof, archive, timeline, scanner, life admin. Out of scope, never depict: medication reminders/adherence *tracking*, symptom/vitals/mood tracking, chat, feeds, volunteer scheduling, trips, legal/medical/financial advice. (The pill-bottle page is the *medication list on the card with refill reminders*; keep it exactly that.)
- **The one rule of the film:** nothing appears on glass that was not first drawn on paper. If a screen shows an element, a sketch showed it first.
- Typography: DM Sans for supers, Cambria (Caladea stand-in, see `src/fonts.ts`) for the closing line, hand-lettering faces only for margin/sticky notes. One accent colour only for circles, ticks, arrows, notes: `COLORS.accent` in `src/film.ts`.

## 2. Machine rules (this Mac is shared with other Claude sessions and was at load average 55-80)
- **Never run two `xcodebuild` or simulator-driving jobs at once. Only the footage agent builds or drives simulators.** Check `uptime` first; prefix heavy commands with `nice -n 10`.
- The footage agent uses only its own simulators (named `Provisum Film …`) and always passes the UDID. Never touch other `PV …` / `Veyago …` simulators or `/tmp/pv-dd/*` DerivedData. Build into `/tmp/pv-dd/film`.
- Other agents render **stills only** (`npx remotion still … --scale=1` or `0.5`), never full videos, unless the director asks. `Config.setConcurrency(4)` is set; do not raise it.
- Do not run git commit/push/stash/checkout. `Film/` is excluded from git locally. Do not edit anything outside `Film/` (the app source is read-only for you; the app worktree for 1.2 is `/Users/cassiandrefke/Developer/Apps/.pv-worktrees/v12`).
- Installing tools is allowed (npm, brew, pip into a venv under `Film/.venv`). Say what you installed in your report.

## 3. Layout and ownership (edit only your own paths; additive changes to shared files only)
```
Film/
  CONTRACT.md  docs/{SCRIPT,BIBLE,DECISIONS,INVENTORY,FOOTAGE}.md
  src/
    film.ts            FPS, FORMATS, COLORS, FONTS, SLOTS (master timeline)      [director owns; read-only]
    useFormat.ts  FilmShell.tsx  MasterFilm.tsx  Root.tsx  SketchPreview.tsx      [integrator owns]
    beats.ts  edits.ts                                                           [creative director]
    audio/cues.ts      Cue / SfxName vocabulary                                  [integrator owns; additive]
    paper/**           paper + graphite engine (types.ts is shared, additive)    [paper-engine]
    sketches/<id>/     one hand-drawn page each; registry.ts                     [sketch owners]
    scenes/<module>/   one folder per film module; registry.ts                   [scene owners]
    devices/**         3D phone / watch / wallet card rigs (three.js)            [device-rig]
    glass/**           black-void language: edge light, light lines, big type    [glass owners]
  public/{fonts,tex,brand,footage}/   assets (footage -> footage agent, brand -> inventory)
  audio/{music,vo,foley,mix}/         all sound (rendered WAVs live here, never in public/)
  tools/                              node/tsx scripts
  out/                                renders, stills, contact sheets (disposable)
```
Never rename or delete another owner's files. If you need a change in a shared file, make the smallest additive edit and say so in your report.

## 4. Time, space and formats
- **Logical canvas:** wide 1920x1080, tall 1080x1920. Author in logical px, always layout from `useFormat()`; render with `--scale=2` for 4K. Never hard-code 1920x1080.
- **Frames:** 30 fps. `sec(s)` converts seconds to frames.
- **Modules** (see `SLOTS` in `src/film.ts`): coldOpen 0:00-0:35, desk 0:35-1:20, wall 1:20-1:31, transition 1:31-1:48, familyOfDevices 1:48-1:53, title 1:53-2:04, realThing 2:04-2:20, pair 2:20-2:25, backToDesk 2:25-2:33, endCard 2:33-2:40. Each module renders inside a `<Sequence>`, so `useCurrentFrame()` = module-local frame. Scenes take no props and must work in both formats.
- **All times in `beats.ts`, `cues`, and VO windows are MODULE-LOCAL seconds** unless a name says `master`. Convert with `slotOf(id).start`.
- **Sync grid:** every audio-visual sync point lands on the 0.5 s grid (every 15 frames) except stroke-level foley, which follows the drawing.
- Cut-downs slice modules with a negative `<Sequence from>`; they are assembled from `src/edits.ts`. Sketch pages take `drawFrames` so they can run in 6 s or 2 s.

## 5. Sketch data model (`src/paper/types.ts`)
A hand-drawn page is **data**: `StrokeSpec[]` + `LabelSpec[]` on a fixed `SKETCH_SIZE` (1200x850, A3 landscape). The paper engine renders them as graphite/accent pencil; the transition re-renders the same strokes as hairlines of light. Pages draw in `drawFrames`, then hold. Pages are transparent: the paper sheet and shadow come from the desk. Each sketch folder exports `Sketch` (component), and **should also export `spec: SketchSpec`** so other renderers can reuse the strokes.
Each sketch also exports `cues(drawFrames): ModuleCues` (stroke/tick sounds, module-local seconds from the page's own start) built from its stroke schedule, so foley follows the drawing.

## 6. Visual language
- **Paper world (Acts 1-2, end):** warm off-white A3 paper under a one-sided daylight lamp, top-down, soft long shadows, paper tooth and fibre, faint vignette; graphite line with pressure variation and grain, a lighter "rough" under the clean pass, eraser crumbs left on the sheet. One accent colour for circles, ticks, arrows and the hand-lettered margin notes. Honest, imperfect, warm.
- **Glass world (Acts 3-4):** pure black void, hairlines of light, one band of light travelling along a device edge, slow rotation, large DM Sans type, the beat of silence. Premium keynote grammar, none of the Apple assets.
- **Hands:** stylised graphite-and-tone illustrated hands (we are not photographing anyone). If they do not look elegant at review, fall back to the pencil/props only with shadows of an off-frame hand. The director decides at review.

## 7. Authoritative MUSIC MAP v1 (music engineer builds to this; visuals conform to it) — master seconds
| Time | Music | 
|---|---|
| 0:00-0:06 | silence; only pencil sounds |
| 0:06 | felt piano enters, very sparse single notes (soft piano under VO 1) |
| 0:20-0:28 | piano thins to almost nothing ("hold for one breath") |
| 0:28.0 | the first real chord lands exactly as the note is smoothed flat |
| 0:35-1:12 | piano builds, ostinato gets busier; "tempo up" lift at 0:56 and again at 1:06 |
| 1:12.0 | music drops away (a single held note or near-silence under VO 6) |
| 1:20 | a soft pulse starts and builds under the wall lift |
| 1:25.0 | strings come in under the piano |
| 1:31.0 | swell as the lines catch light |
| 1:38.0 | the pulse locks to a clear beat; UI snaps land on beats at **1:41.0, 1:43.0, 1:45.0, 1:47.0** |
| 1:48.0 | hit (card lands on the Watch); 1:50.0 second hit (Wallet pass slides out); light settles 1:51-1:53 |
| 1:53.0 | **hard stop**: everything cuts, no tail, one full second of nothing (1:53-1:54) and silence holds to 1:55 |
| 1:55.0 | soft low swell as "Provisum" fades in word by word; **1:58.0** the stroke of "2" completes and the music resolves |
| 2:04-2:20 | lift: rhythmic ostinato under the 9 feature cuts (cut lengths 2.0,1.5,2.0,1.5,2.0,1.5,2.0,1.5,2.0 s) |
| 2:20.0 | peak for the phone-and-watch hero; light sweep at 2:21.0 |
| 2:25-2:33 | falls back to felt piano alone, warm, under VO 8 |
| 2:33-2:36 | final chord decays; ends cleanly by 2:37 |
| 2:38.0 | last sound of the film: the click of the pencil being put down (foley, not music) |
Tempo: **60 BPM, 4/4**, bar lines on every 4th second from 0:00, so every integer second is a beat. Same motif family must be re-arranged (not cut) for the 0:45 and 0:15 versions.

## 8. VO windows v1 (VO engineer builds to these; master seconds). ~95 words total, read slower than feels natural
| VO | Start | Lines (must fit before the next window) |
|---|---|---|
| 1 | 0:07.0 | Provisum 1 already did a lot. Mom's papers, in one place. Every deadline, with the right reminder. The emergency card, for the night the hospital calls. (ends by 0:19.5; pencil ticks each item as it is named) |
| 2 | 0:21.0 | It worked. So we sat down and asked the harder question. |
| 3 | 0:36.0 | We started with a person. |
| 4 | 0:56.3 | Then we went through Mom's mail. |
| 5 | 1:06.3 | And we looked past one country. |
| 6 | 1:13.0 | And then the biggest one. Stop asking people to fill in forms. Just ask them. |
| 7 | 2:04.5 | Everything we drew. On your iPhone. And none of it on our servers. No account. No tracking. |
| 8 | 2:26.0 | Provisum. It's Latin for provided for. |
Name pronunciation is undecided: render "Provisum" both as pro-VEE-zum and pro-VY-zum for VO 1 and VO 8; the director picks.

## 9. How to verify your work
- Typecheck: `cd Film && npx tsc --noEmit` must be clean.
- Look at pixels, not just code: `npx remotion still src/index.ts <CompositionId> out/<name>.png --frame=<n> --scale=1`, then `Read` the PNG. Check a mid-draw frame and the finished frame; check both `-wide` and `-tall` for scenes.
- Budget: a 1080p frame should render in about 2 s or less on this machine. If a technique is slow (large SVG filters, many layers), prefer pre-rendered textures in `public/tex/` and canvas.
- Determinism: no `Math.random()`, no `Date.now()`. Use `random(seed)` from `remotion` or a seeded PRNG so every render is identical.

## 10. Code style (the user's global rules apply)
Small files (<400 lines, 800 max), small functions, no mutation (return new objects), explicit error handling, no debug logging left behind, no hardcoded magic numbers (name them), TypeScript strict. The test-first rule does not apply to film scenes; type-check plus rendered stills are the verification. Prefer pure functions that map `frame -> state`.

## 11. Reporting
End with a short, factual report: files you created/changed, the public API others can import, what you verified (and how), what is unfinished or fragile. Report failures honestly; do not claim a render you did not look at.

## 12. Addenda after Phase A (director's rulings, binding)
1. **Real app UI is exempt from the Apple-typeface rule.** The film shows genuine screen recordings of the app, which is drawn in the system font with system symbols. That is the product, and the script asks for it. The ban in section 1 applies to everything WE author: supers, titles, captions, sketches, device bodies, the Wallet pass reconstruction (DM Sans stands in), icons we draw. Do not use the frames where Apple's own "Add to Apple Wallet" button or Wallet icon is the subject (the card sheet in `phone-show-on-watch`, the start of `wallet-pass-fields`): choose hot windows that avoid them. The `ask-about-mom` clip shows a real public phone number: do not use it. The sample data names a few real businesses and agencies; keep those frames short and never hero them.
2. **Footage ids are the manifest's, not the bible's requested names.** `public/footage/manifest.json` is the truth (each entry has `requestedAs`): refill-reminder = `med-refill`, scam-note = `scam-check`, call-112 = `belgium-112`, onboarding-chips = `onboarding-question`. Phone clips are 1206x2622 (iPhone 17 Pro, 402x874 pt at 3x, dark appearance unless the id says light), Watch clips 416x496. Use `<OffthreadVideo>` with `staticFile('footage/…')` and each entry's `hotStart/hotEnd` window. The Watch clock shows 10:15, not 9:41: cover it with a black patch and a 9:41 in DM Sans of the same size.
3. **Never use CSS `mix-blend-mode`** (Remotion's Chrome drops blended layers where other elements overlap). Use normal-blend overlays and pre-multiplied colours (see `src/paper/README.md`).
4. **Registries, not Root.tsx.** Owners never edit `src/Root.tsx`. Export extra compositions as `previews: PreviewSpec[]` (`src/previewTypes.ts`) from your own folder: sketch folders and scene folders export `previews`, and `src/desk/previews.ts`, `src/devices/previews.ts`, `src/edit/previews.ts` are single-owner files. They are auto-registered by `src/previews.ts`. `SketchFast-<id>` (1.5 s draw) is registered for every sketch automatically.
5. **Cues.** Every scene folder exports `cues: ModuleCues`: the COMPLETE foley cue list for the module in module-local seconds, including cues derived from embedded sketch pages (use `offsetCues` from `src/paper`). Sketch folders export `cues(drawFrames)` as in section 5. Names `tick-`, `coin-`, `key-`, `bubble-` stroke-id prefixes mean hit cues (see BIBLE section 4).
6. **Static pages are images.** Held pages (finished pages stacked on the desk, the wall's tiles) must not re-run the pencil canvas every frame. Pre-render each sketch's finished state to a transparent PNG at 2x with `tools/renderPages.ts` (the wall owner writes it; `public/tex/pages/<id>.png`, regenerate when a sketch changes) and draw those as images; only the page being drawn runs the engine.
7. **The desk kit lives in `src/desk/`** (hands in `src/desk/hands/`, props in `src/desk/props/`: pencil cup, coffee cup, eraser, ruler, sticky-note pad, face-down phone, stack of blank sheets). `src/paper/hand/` is the engine's hand-lettering metrics, not hands.
8. **VO 1 moves to master 6.5 s** (it was cramped at 7.0): the VO engineer is re-rendering it with 0.5 s breaths and real word times, and updating `src/beats.ts` (VO table, VO1_LANDMARKS, tick times and fractions). Always read tick/VO timing from `beats.ts`; never hard-code.
9. **Rules check:** identity is strict everywhere (including docs and comments); the Apple-typeface check applies only to `src/`, `public/fonts` and any CSS/font-family. Run `zsh tools/checkRules.sh` before reporting.
10. **Previews for review:** render stills with `npx tsx tools/stills.ts <CompositionId> <scale> <frame,frame,…> --sheet=out/x.png` (one bundle, many frames, a contact sheet). Look at the pixels.
11. Phone footage has the black Dynamic Island in videos; posters are frames of the clips, `binder-home.png` and `*-still.png` are clean stills without it.
