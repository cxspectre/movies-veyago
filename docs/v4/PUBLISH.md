# Publish kit: captions, YouTube, TikTok and Shorts, thumbnails

Written for the owner by H2. **Nothing here is posted.** Every factual statement below is a row of `docs/v4/CLAIMS.md` (row ids in brackets) or is left out. The first app is never named, no launch date and no build time appear, and nothing says the film is live or the app is released until A19 is confirmed.

Status key used below: **PENDING** = the owner decides; **UNCONFIRMED** = the claims row is not yet confirmed, so the text is left out of the copy (the film itself may still say it: see the hold list).

## 1. Hold list: what must be confirmed before anything is posted

The captions and clips repeat what the film says. The film still carries these unconfirmed rows, so each clip is blocked until its rows are answered (the owner's open list is in `CLAIMS.md`):

| Item | Blocked by |
|---|---|
| Master, `Hook75`, `Cut180` | A4 (the engine); A19 (is 2.0 live: publishing waits for it). Decided 2026-10-18 (`OWNER-DECISIONS.md`): A1, A3 (owner-confirmed by delegation, not verified against Resolution Center), A7 (`September 2026`, no day), B20 and G34 (the roll reads `0 accounts`), G27 (`4,497 tests`, the real count), G39 (the mark is cut), G40 (the voice credit is in the description, not on screen) |
| Short-line | G1, G2 |
| Short-mayasHouse | C1, C2, C3, G3, G4 (fiction; credit it) |
| Short-theNo | A4, G5, G7, G8 (A1 to A3 and G6 owner-confirmed by delegation 2026-10-18; A7 decided: `September 2026`) |
| Short-filterMachine | B2, B4, E15, G9, G10 |
| Short-researchBoard | D1 to D4, D6, B5, B6, G11 to G14 |
| Short-nameAndLook | B1, B7 to B10, G16 to G18 (A10 and G15 decided 2026-10-18: "On Behalf" stays; the seven crossed-out names are invented, see the note under the YouTube description) |
| Short-engineRoom | B13 to B15, B17 to B24, G22 to G26 (B26 and G27 decided 2026-10-18: `4,497 tests`, re-run on release day if the code changes) |
| Short-launch | A11 to A16, G28, G29 |
| Short-village | C1, B33, B34, B35 to B37, G30 to G33 |
| Short-paperToGlass | B16, B35, B37, G35 (B20 and G34 decided 2026-10-18: the roll reads `0 accounts`) |
| Short-providedFor | B1, A19 (A18, G38 decided 2026-10-18: keep both lines, publish once 2.0 is live; G39: the mark is cut) |

## 2. Caption files (sidecar `.srt` / `.vtt`, not burned in)

```sh
npx tsx tools/captions4.ts                                   # all 14 ids -> out/captions/<id>.srt and <id>.vtt (git-ignored)
npx tsx tools/captions4.ts --id=Hook75                       # one id: master4, Hook75, Cut180, Short-<chapter>
npx tsx tools/captions4.ts --vo-dir=audio/v4/vo --out-dir=out/captions
node --import tsx --test tools/captions4.test.ts             # the tests; no audio needed
```

- The text is the spoken voice-over only (`VO4` in `src/beats4.ts`); supers are not captions. The written-out supers stay in the picture.
- A line starts at its beat time and ends at the real length of its recorded stem when `audio/v4/vo/<id>.wav` (or `audio/v4/vo/clips/<id>.wav`) exists, else at the estimate in `beats4.ts`. The tool prints how many lines used a real stem. **`docs/v4/captions/master4.{srt,vtt}` is a sample made from estimates (no stems exist in the cloud): re-run on the Mac once the voices are placed, and replace the sample.**
- Rules: lines break at 42 characters, two lines at most, each cue 1 to 7 seconds, none crosses a cut. In a cut-down the line is placed at its segment start plus `at` (`src/edits4.ts`), and a sentence that would run past the end of its segment is dropped: this is why the 3:00 cut loses "Sharing goes straight to the people you invite." (the EDL drops it too). `Short-paperToGlass` has no voice-over, so its file is empty (a valid VTT with no cues): upload none.
- The tool exits 1 and lists the problem if any cue breaks a rule. Upload the master `.srt` (or `.vtt`) in YouTube Studio under Subtitles. For the cut-downs, upload the matching file with each short; TikTok takes `.srt`/`.vtt` for its caption import.

## 3. YouTube: the 16:9 master

### Title options (pick one; none states a date or time)
1. `Provisum 2: how it was made, and why` (the film's own title super, G2)
2. `Every app starts as a line` (G1)
3. `Provided for: the story of Provisum 2` (the closing line, G38)

### Description
```
Every app starts as a line. This is the story of one app, from a no, to a launch, to a binder for everyone you call family.
Provisum 2: how it was made, and why.

0:00 The line
0:30 Maya's house
1:15 The no
1:55 The filter machine
2:50 The research board
3:55 The name and the look
4:50 The engine room
6:05 The launch
6:55 The village
8:10 Paper to glass
9:30 Provided for

Provisum is Latin for "provided for." (B1)

Credits
Made by Veyago.
The voices are synthetic. The family is fictional.
Music and sound: PENDING (the owner's credit line)

Get the app: PENDING (the store link only once Provisum 2 is live, A19; do not post a link before that)
```
The voice line is owner decision 8 (C4, G40, C1). **When uploading, tick YouTube's altered-or-synthetic-content disclosure** (the voices are synthetic).
The seven crossed-out working names in chapter 6 (Ferngate, Brindle, Lanternly, Mapleside, Quillfold, Tidewell, Oakhaven) are **invented** for the film, a dramatisation of the naming (A10, G15). They were not checked against trademarks; do not name them in any copy.
The first two lines are the hook (YouTube shows them before "more"). The chapter times and names are `SLOTS4` in `src/film4.ts` and the script's chapter map (E17, verified).

### Tags
`Provisum`, `Provisum 2`, `Veyago`, `making of`, `how an app is made`, `indie app`, `app development`, `native Swift` (B13), `iPhone app`, `hand drawn animation`, `pencil animation`, `family caregiving`, `paper and pencil`
Dropped on purpose: the first app's name, store results, anything about release, price, countries, reviews or privacy (B20 to B24, A18, A19, B35 all unconfirmed).

### Pinned comment
```
Thanks for watching. The voices are synthetic. The family is fictional. Which part of the line would you have drawn differently? I read every reply.
```
(The signature "I" is PENDING: the owner decides whether the account speaks as the founder or as Veyago.)

### Thumbnail
Pick one of `Thumb-wide-a|b|c` (section 5). Upload the 1280x720 PNG; the same three read at 160 px wide.

## 4. TikTok and YouTube Shorts

Captions: one or two lines in the film's own words, no claim beyond the spoken lines. Hashtags: `#provisum #provisum2` plus the row's own; add `#Shorts` for YouTube Shorts only. Every clip's `.srt`/`.vtt` is in `out/captions/`. Full-film link in the caption or the first comment: PENDING (until A19).

| Clip | Caption | Hashtags |
|---|---|---|
| `Hook75` (75 s) | Every app starts as a line. This is the story of one app, from a no to a binder for everyone you call family. Full film on YouTube: PENDING link. | #provisum2 #indieapp #madeinpencil #makingof |
| `Cut180` (3:00, TikTok only; Shorts are 3 minutes at most, so post it there if the owner wants) | Provisum 2 in three minutes: the pencil line, the filter, the name, the engine, the village. | #provisum2 #indieapp #appdevelopment #makingof |
| `Short-line` | Every app starts as a line. | #provisum #madeinpencil #handdrawn #indieapp |
| `Short-mayasHouse` | Some weeks Maya is the mom, the daughter, and the one who knows where everything is. (Fictional.) | #provisum #familypapers #handdrawn #storytime |
| `Short-theNo` | The first app got a no. What came next. | #provisum #indieapp #startupstory #handdrawn |
| `Short-filterMachine` | Before we had one idea, we built the filter every idea had to pass. | #provisum #buildinpublic #indieapp #productdesign |
| `Short-researchBoard` | Next, we stopped guessing. Six building blocks. | #provisum #userresearch #buildinpublic #indieapp |
| `Short-nameAndLook` | Provisum. Latin for "provided for." Then the look: calm, because people open this app on hard days. | #provisum #branding #appdesign #latin |
| `Short-engineRoom` | Inside the app: native Swift, one binder per person, no account. | #provisum #swift #appdevelopment #indiedev |
| `Short-launch` | And App Review said yes. | #provisum #indieapp #appstore #buildinpublic |
| `Short-village` | Version one was a binder for a parent. Nobody looks after just one person. | #provisum2 #familyapp #handdrawn #storytime |
| `Short-paperToGlass` | Everything we drew, built natively. | #provisum2 #appdesign #handdrawn #indiedev |
| `Short-providedFor` | Provisum. It's Latin for provided for. For everyone you call family. | #provisum2 #providedfor #handdrawn #indieapp |

Rows that depend on a confirmed claim: `Short-engineRoom` ("no account" is B20 reworded by E6, UNCONFIRMED; delete that clause until the owner confirms), `Short-launch` ("App Review said yes" is the script's F10, A8/A9 were removed; the owner confirms the sentence), `Short-theNo` ("got a no" rests on A1). Captions that name no one's rejection count, date or store state are used on purpose.

### Order and days
Days count from the day the owner posts the master; the film states no date and neither does this plan. Post at the owner's usual time (PENDING).

| Day | Post | Why |
|---|---|---|
| 0 | YouTube master (with the sidecar `master4.srt`), then `Hook75` on TikTok and Shorts the same day | the hook points at the film |
| 1 | `Short-theNo` | the strongest stand-alone story beat |
| 2 | `Short-mayasHouse` | the human opening |
| 3 | `Short-filterMachine` | |
| 4 | `Short-researchBoard` | |
| 5 | `Short-nameAndLook` | |
| 6 | `Short-engineRoom` | |
| 7 | `Short-launch` | |
| 8 | `Short-village` | |
| 9 | `Short-paperToGlass` | |
| 10 | `Short-line` | the film's opening as a loop |
| 11 | `Cut180` (TikTok) | the full arc for people who came late |
| 12 | `Short-providedFor` | the close |

The order is a recommendation, not a fact; change it freely.

## 5. Thumbnails and covers

Compositions (registered in `src/previews4.ts`, code in `src/thumbs/`): `Thumb-wide-a|b|c` at 1280x720 (YouTube) and `Cover-tall-a|b|c` at 1080x1920 (TikTok and Shorts cover). They use the film's paper colour, its hand-drawn line engine (`handPath`), the graphite pencil of the desk, the village wallpaper colours (`HOUSE_WALLPAPER`) and the end-card type (DM Sans 700). The only words are "Provisum 2" (G2, G38). No Apple logo, no app screen, no first-app name.

| Id | Picture | Read at 160 px |
|---|---|---|
| `a` | the pencil line and the graphite pencil, the title, an accent rule | line, pencil and title all read |
| `b` | Maya's house (lavender wallpaper, one window lit), the line trailing in, the title | the house and the title read |
| `c` | seven houses in their wallpaper colours (the village), the title | the seven colours and the title read |

```sh
FILM_GL=swangle npx tsx tools/stills.ts Thumb-wide-a 1 0          # -> out/stills/Thumb-wide-a/f00000.png; repeat for b, c, Cover-tall-a|b|c
```

Placeholders and cautions: the village names are the film's fictional family (C1, B39); the village cover shows no names. The tall covers keep everything inside the 1080 px width; the top and bottom 200 px of a tall cover are covered by app UI on TikTok and Shorts, so the title sits in the middle.
