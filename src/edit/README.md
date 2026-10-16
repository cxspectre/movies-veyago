# Cut-downs (`src/edit`)

The player for the edit decision lists in `src/edits.ts` (`VERTICAL_45`, `TEASER_15`, `TEASER_15_WIDE`). Nothing
here holds a time: every slice, caption and hit comes from `edits.ts`, every black/silence window from `beats.ts`.

## Compositions (registered by `previews.ts`, picked up by `src/previews.ts`)

| Id | EDL | Canvas | Frames | Captions |
|---|---|---|---|---|
| `Vertical45-tall` | `VERTICAL_45` | 1080x1920 (render `--scale=2` for 2160x3840) | 1350 | yes |
| `Teaser15-tall` | `TEASER_15` | 1080x1920 | 450 | none in the EDL |
| `Teaser15-wide` | `TEASER_15_WIDE` | 1920x1080 | 450 | never (9:16 only) |
| `CaptionSpecimen-tall` | every caption of the 9:16 EDLs, 1 s each on its own ground, with guides | 1080x1920 | 30 per caption | review only |

Every EDL is checked when `previews.ts` loads (`assertEdl` in `checks.ts`: `validateEdl` from `edits.ts`, frames add
up to the target, captions placeable). A broken EDL throws and the bundle fails loudly; it never renders a wrong cut.

## How a segment plays

`EditFilm` puts each segment in a `<Sequence from={editStart} durationInFrames={segmentFrames(s)}>` (hard cuts), and
inside it the module's scene in `<Sequence from={-sec(s.from)}>`, so **inside the scene `useCurrentFrame()` is the
module-local frame**, exactly as in the master. `useVideoConfig()` inside the scene still reports the cut-down's
composition (do not use its `durationInFrames` to time a scene).

- **Black slices.** A slice wholly inside a window `beats.ts` declares black (`coldOpen.black`, `title.black`;
  `BLACK_WINDOWS` in `edl.ts`) is drawn as `#000000`, not by the scene: the teaser's second of black is pure zeros
  whatever the title scene does.
- **`EditableScene` (optional, per scene folder).** A scene folder may export
  `export const EditableScene: React.FC<EditableSceneProps>` from its `index.ts`; the player prefers it over `Scene`.
  It gets `{edlId, format, segmentIndex, from, to, props, captioned}` (`types.ts`): `props` is the segment's whole
  `EditProps`, so any prop the director adds later reaches the scene without a player change; `captioned` says a
  caption is drawn over this slice, so keep the scene's own copy (the sticky note) out of `CAPTION_BAND`
  (`captionLayout.ts`, tall px 1517-1641). The frame is module-local as for `Scene`. No folder exports one yet.

## Captions (BIBLE §3 "9:16 captions", §7.4)

DM Sans 500, 44 px, at most two lines, centred, the **last** line's baseline 300 px above the bottom edge. Glass:
`#F5F7FA` at 92%. Paper: graphite at 90% on a 40% `#F3EEE3` pill (radius 16, padding 10x18). 6-frame fade in and
out. Line breaks (`wrapCaption`) prefer a sentence end, then a comma, then the most balanced pair; a caption that
needs three lines throws. The same pure layout runs in the browser (canvas `measureText`) and in
`tools/edlReport.ts` (fontkit on the woff2), so the report prints the exact breaks the film shows.

Timing (`captionTiming.ts`, edit frames): a caption starts at its `at` and holds until the next caption of its
segment. The last caption of a segment **holds across the cut** into following segments that set a `captionTone`
but carry no captions (in the vertical: "Everything we drew. On your iPhone." over the Watch cut, "No account. No
tracking." over the chips, which is where the trimmed VO 7 says them); it ends on the cut into a segment that has
its own captions or no tone. The tone follows the segment under it. Never over `title` or `endCard`, never over a
black slice, never in a wide EDL (all checked).

## Sound for the cut-downs

```
npx tsx tools/edlCues.ts                    # -> audio/foley/edl/<EDL id>.cues.json (all EDLs)
npx tsx tools/edlCues.ts --edl=Vertical45 --stdout
npx tsx tools/foley/renderCues.ts --cues audio/foley/edl/Vertical45.cues.json --out <stem.wav>
npx tsx tools/edlReport.ts                  # cut list, master timecodes, caption breaks, VO under captions
```

`edlCueSheet` (`edlCues.ts`, pure): each scene folder's `cues` (module-local) sliced to `[from, to)` and moved onto
the edit timeline (hits inside the slice; strokes/slides/sweeps clipped to it, dropped under 0.04 s), plus the
segment's `sfxAt` hits (`snap_card` reads as the SfxName `snap`: an SfxName plus an optional `_what`). An `sfxAt` hit
replaces a sliced module hit of the same name within 0.1 s (same event). Silences: any slice of `title.silence`, and
on the cut into the title from another module at least 0.5 s (BIBLE §7.2). The file is renderCues' format (`cues`,
`silences`, `lengthSec`) plus `vo` placements, `modulesWithoutCues` (stubs count as empty) and `warnings`. Re-run it
whenever a scene's cues change: the JSON is a snapshot.

## Files

`EditFilm.tsx` (player), `SegmentPicture.tsx` (one slice, EditableScene lookup), `Caption.tsx`, `captionLayout.ts`,
`captionTiming.ts`, `edl.ts` (placement, black/silence windows, EDL rules), `checks.ts` (`assertEdl`), `edlCues.ts`,
`types.ts`, `CaptionSpecimen.tsx`, `previews.ts`.
