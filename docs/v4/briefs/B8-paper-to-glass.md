# B8: chapter 10, `paperToGlass` 8:10-9:30 (cloud, Opus if the picker offers it, else Sonnet High, CAP $22)

Read `docs/v4/briefs/B-common.md` first, then BIBLE4 sections 1.4, 5.10 and 7, and the script's "10. Paper to glass". The beat times are already in `src/beats4.ts` (`paperToGlass`, `SNAP_PLAN`, `Recording`, `VO4` M14, F15, M15, Y5); never hard-code a time it holds.

This is the one WebGL chapter, so it has an extra risk and an extra rule.

## Step 0: prove the cloud can render it (spend under $2 here)
The v1 device rig (`src/devices`, tested locally with `--gl=angle`) has never been rendered with software GL. Before building anything, render ONE still of an existing v1 device preview (`src/devices/previews.ts`, or the v1 `src/scenes/familyOfDevices` preview) with `FILM_GL=swangle`, and write down the seconds per still. If the context fails, or one 1080p still takes longer than about 90 s, STOP and report that with the numbers; do not build the chapter blind. If it works, go on.

## Build `src/chapters/paperToGlass/`
The v1 transition, family of devices, title, real thing and pair, re-staged as one chapter (reuse `src/devices`, `src/glass`, and the v1 scene code under `src/scenes/` : grep for `InkToLight`, `familyOfDevices`, `realThing`; copy what you need into your folder rather than editing v1, so the 2:40 film still renders identically). The camera is parked: the void is screen space (BIBLE4 5.10).

1. **0.0-7.0 paper to light.** The village from chapter 9 (`src/chapters/village`, find how it exposes its strokes) converts to light in stroke order while the paper, shadows and vignette fade to black. If you cannot reuse chapter 9's strokes, draw the conversion over a copy of the outline and say so. Nothing on glass that was not first drawn on paper: the phone outline is the houses' strokes re-traced (8.0-10.0).
2. **The phone and the nine snaps** (10.0-22.0), each with its one-line label, using the real recordings from `public/footage` / `public/footage4` (`manifest.json`, `manifest4.json`; hot windows as the beat sheet says; never the Wallet button frames of `phone-show-on-watch`).
3. **25.0-42.0** the phone splits into five (binder-home captures, light appearance), collapses, the card flips to the Watch, the Wallet pass slides out. **42.0-46.5** the four number rolls on black (`6 kinds of people`, `5 countries`, `5 languages`, `0 servers`; use `NumberRoll` from the kit, DM Sans 700 200 px).
4. **48.0-60.0** the eight recordings, alternating void and bleed. Demo-hook captures only (`invite-friend`, `family-joined`), never a live flow.
5. **60.0-68.0** Maya (sepia is the paper colour; here she is drawn in light) taps Invite, a hairline paper plane flies to the small phone with the drawn notification card. Wording: use the CLAIMS row for the invitation text; if it is not confirmed, draw it and flag it.
6. **68.0 hard stop**: picture to pure black and sound to digital silence on the same frame, one full second of nothing, silence to 70.0. Then **Provisum** letter by letter and the accent pencil stroke writing the **2** (70.0-73.0), then the subline (75.0-79.5), then the light begins to dim at 79.5 (chapter 11 finishes the fade).
7. Wide and tall from the same logic: placements are in BIBLE4 5.10 (phone 78% / 62% of the frame height, the row of five, the Maya / phone / far-phone column in tall).
8. `cues.ts`: the COMPLETE foley cue list from BIBLE4 5.10 and 7.4 (nine `snap`s, `card_flip`, `wallet_slide`, `odometer` for each roll, `plane`, the hard-stop silence marker, `title_in`, one quiet `stroke` under the 2). `previews.ts` for extra stills.

## Proof
Stills only, `FILM_GL=swangle`, into `out/review/b8/` (a contact sheet via `tools/stills.ts --sheet`): `Chapter-paperToGlass-wide` and `-tall` at 0, 3, 7, 9, 10, 16, 25, 36, 42, 46, 50, 55, 62, 66, 67.9, 68.5, 71, 73, 77. LOOK at them. At most two render-and-look rounds. Check two adjacent frames around 7.0 (paper to black) and 36.0 (the card flip) for flicker. Record the measured seconds per frame (WebGL stills are the expensive ones) in your report and in a short README in the chapter folder.

## Cap and stopping
Stop at the cap even if unfinished: push what works, list in the report exactly which beats are done, which are placeholders and which are missing. A half-done but clean chapter is better than a full one that does not render.

`npx tsc --noEmit` and `zsh tools/checkRules.sh` must pass. Claims to confirm in your report: the invitation wording, `0 servers`, the nine labels, the two supers, and any app string you drew.
