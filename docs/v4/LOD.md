# Level-of-detail images (`public/tex/sheet/`)

Below zoom 0.15 nothing but the pencil line is live; the sheet is carried by images. Finished regions (zoom >= 0.15) also use their image instead of re-running the chapter (`FINAL_REGION_IMAGES` in `src/endless/MasterRegion.tsx`).

## Regenerate

```
FILM_GL=swangle FILM_BROWSER=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell npx tsx tools/renderSheetLod.ts            # everything, about 1.7 min
FILM_GL=swangle ... npx tsx tools/renderSheetLod.ts village far-done                                                                            # some images only
```

**Re-run after any change to a chapter's `Art`**, for that chapter's id and then `far-done` (it is composed from the region PNGs). A change to a glimpse (`src/chapters/line/glimpses.ts`) needs `far-rough`. The tool also rewrites `src/endless/lodManifest.ts` (commit it with the PNGs).

How they are made: `SheetRegionAlpha-<id>` = the chapter's `Art` held on its last frame, in a near-zoom wide-format sheet context (`RegionAlpha`, `src/endless/lodImages.tsx`); stilled at scale 2, trimmed to the drawn pixels (crop in `lodManifest.ts`), longest side capped at 4096 px. A region that draws nothing on paper (`line`) gets no image. `far-rough` = `SheetFarAlpha-rough` (the glimpses). `far-done` is composed by the tool (sharp) from the region PNGs at 1/8 scale, so it always agrees with them.

## Files (current)

| file | size | shows |
|---|---|---|
| mayasHouse.png | 2.4 MB | family tree, open house with Maya at the table, the plane |
| theNo.png | 64 KB | calendar page with 21 September 2026 circled and its caption |
| filterMachine.png | 421 KB | the five-gate filter machine and the pile of cards |
| researchBoard.png | 38 KB | the board frame (its end state: the cards have left for the truck) |
| nameAndLook.png | 53 KB | the PROVISUM title and the shelf |
| engineRoom.png | 251 KB | the phone-shaped cutaway outline with laptop and phone |
| launch.png | 347 KB | the map, the pad, "Ready for Distribution" |
| village.png | 515 KB | the five houses inside the United States |
| providedFor.png | 45 KB | pencil, "Provisum 2", "Free on the App Store", the sign-off |
| far-rough.png | 254 KB | 5000 x 1000, the glimpses (hero shapes, rough) used until 9:30 |
| far-done.png | 59 KB | 5000 x 1000, every finished region at 1/8, used from 9:30 |

Total 4.3 MB. `line` has no image (the line is live), `paperToGlass` has no region.
