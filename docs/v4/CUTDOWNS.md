# v4 cut-downs: the player and how to render them (G1)

`src/edit4/` plays the EDLs of `src/edits4.ts` (`Hook75`, `Cut180`, the 11 `Short-<chapter>`; all 9:16). YouTube 16:9 is `Master4-wide`: no EDL.

## How it plays
`Edit4Film` puts each segment in a `<Sequence>` (hard cuts) and inside it `MasterFilm4` (the same one-sheet component as `Master4-tall`) in a `<Sequence from={-masterFrame}>`, so `useCurrentFrame()` inside is the MASTER frame: a segment of chapter c at local [from, to) shows master time `slot(c).start + from`. No chapter code is copied.

Compositions (`src/edit4/previews.ts`, registered by one block in `src/previews4.ts`): `Hook75-tall` (2250 f, 75 s), `Cut180-tall` (5400 f, 180 s), `Short-<id>-tall` for line, mayasHouse, theNo, filterMachine, researchBoard, nameAndLook, engineRoom, launch, village, paperToGlass, providedFor (each its EDL's own length). Every EDL is checked at bundle load (`checks4.ts`: `validateEdl4`, frame total, captions need a tone, ordered, on screen >= 0.8 s); a broken EDL fails the bundle. `CaptionProbe4-tall` is review only (one glass-tone caption; no shipped EDL has one).

## Captions
The v1 rules (BIBLE4 §6): DM Sans 500, 44 px, max 2 lines, last baseline 300 px above the bottom (y 1620), paper tone on paper (graphite on a 40% paper pill), glass tone on glass, 6-frame fades, held until the next caption of the segment or the segment end, carried over following segments with a `captionTone` and no captions. Reused unchanged from `src/edit/`: `captionLayout.ts`, `captionOpacity`, the `CaptionWindow` type. Ported for `Edl4`: `captionTiming4.ts` (window maths), `Caption4.tsx`.

Two additions the v4 EDLs needed:
1. **Clipping.** A caption running when a super, the sticky notes, the title or the end card begins ends there (`protected4.ts`, windows read from `beats4.ts`), unless that would leave < 0.8 s. Short-providedFor's F16 caption now ends at 20.0, before the end card.
2. **Wider margin for two lines.** "Some weeks I'm the mom, ..." (912 px) and "And Sam's car registration, ..." (877 px) do not fit the v1 852 px (96 px side margin) and v1 throws. `captionFit.ts` retries with a 60 px side margin (pill still 66 px from the edge), so they stay in 2 lines.

## Audit (no render)
`npx tsx tools/captionAudit4.ts [--edl=Hook75]` prints every caption window (edit seconds, tone, line breaks, baseline) and every caption that still overlaps a super, the sticky notes, the title or the end card. Exit 1 on a problem or a third line. `npx tsx tools/proofFrames4.ts <EdlId>` prints the proof frames (first, captions mid-fade, both frames of each join, last).

## Render (cloud: stills only; the film is rendered on the Mac)
```sh
tools/renderCutdowns4.sh 2 14 4k                    # all 13, 2160x3840, silent -> out/<id>-4k.mp4
tools/renderCutdowns4.sh 1 18 1080 Hook75 Cut180    # 1080x1920 drafts of chosen ones
npx tsx tools/render.ts Hook75-tall --out=out/Hook75-4k.mp4 --scale=2 --chunk=300 --crf=14   # one, by hand
```
Chunked and resumable (`out/chunks/<id>-tall-s<scale>/`); never run two at once. Render before or after the audio, it does not matter: the picture has none.

## Joining the audio
The picture's name is the mix's name: `out/<id>-<suffix>.mp4` pairs with `audio/v4/mix/<id>.wav` and `<id>-novo.wav` (`docs/v4/AUDIO.md` steps 1-5 make them, with `tools/mix/edlCues4.ts` from the same `edits4.ts`).
```sh
tools/mix/package4.sh 4k        # -> out/final4/<id>_4k_{with-VO,no-VO}.mp4 (video copied, audio AAC 320k); missing pairs are skipped and listed
```
The mix length must equal the picture (75.0, 180.0, the short's seconds); the player and `edlCues4` both sum `segmentFrames4`, so they agree unless `edits4.ts` changed between the two runs: re-run both.

## Proof (stills in `out/review/g1/`, not committed; `FILM_GL=swangle`, scale 0.5)
`Hook75.png` (21 frames), `Cut180.png` (44), `Short-mayasHouse.png`, `Short-providedFor.png`, `Short-launch.png`, plus `out/stills/CaptionProbe4-tall/f00045.png` (glass). Seen: baseline and 2-line wrap right on every caption, both fades mid-motion, the mayasHouse long captions in 2 lines, no caption on the title or end card.

## Still weak (EDL owner: `src/edits4.ts`)
Captions that START under a super (the player cannot move them): Hook75 village "Version one was a binder..." at 38.0 under "Version 2: a binder for everyone you call family." (also Cut180, Short-village); Cut180 and Short-researchBoard M5 under "Six building blocks..."; Cut180 launch F12 under "Day one: a mistake..." and the sticky notes; Short-engineRoom M9/M11/M12 under four supers; Short-theNo F4 under "Keep the engine...", Short-mayasHouse F2 under "And every family is bigger than its tree.". QA3 already lists some as knowingly left; `tools/captionAudit4.ts` has the full list. **No shipped EDL has a glass-tone caption.**

## Not verified without video
Flicker at joins beyond the two adjacent stills each; the fade timing in motion; chunk joins of `render.ts`; the audio length match; 4K at scale 2 (stills were scale 0.5).
