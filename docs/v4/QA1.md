# QA1: whole-film sweep, 2026-10-17 (D3)

Scope: read-only except this file and `docs/v4/CLAIMS.md` (new section G, 40 rows). No code was changed.
Method: 52 stills per format of `Master4-wide` and `Master4-tall` at scale 1 (1920x1080 and 1080x1920) at the beat times of every super, number roll, chapter start and end, plus 7 extra frames per format to settle doubts. Stills are in `out/review/d3/` (not committed). Measured about 4.1 s per still with `FILM_GL=swangle`, two formats rendered in parallel. `tsc --noEmit` is clean; `zsh tools/checkRules.sh` passes.
Limit: this is a sampled sweep (52 times in 600 s), not every frame. Pixel sizes below are read off stills at 1920x1080 (wide) and 1080 px wide (tall); "28 sheet px at working zoom" could not be measured exactly from stills, so text is judged by its size in the frame.

## 1. Ranked defects (most visible first)

| # | Ch | Master s | Fmt | What is wrong | Suggested fix | Owner folder |
|---|---|---|---|---|---|---|
| 1 | 7 | 358-372 (local 64-72) | both | A working tag, "placeholder: the release-day test count", is drawn on screen and the number roll sits at "000" even after the green check at 360. | Supply the real count (B26) and remove the tag before any export; until then hide the tag. | `src/chapters/engineRoom` |
| 2 | 1 | 1.5-5 (checked at 3.0 and 4.5) | both | The first words of the film, "Every app starts as a line.", are written starting off the left edge of the frame: at 4.5 s only "ts as a line." is visible (wide); in tall nothing but a sliver of "a" shows at 3 s. The film's first super is unreadable. | Start the super at x >= 96 px (wide) and inside the central 1080 px column (tall); the line must start inside the frame. | `src/chapters/line` (and `src/endless` camera if it owns the start position) |
| 3 | 11 | 586-593 | both | The closing line "Provided for." is about 24 px tall; "Free on the App Store" about 20 px; "Made by Veyago. Private by design." about 16 px, all in a 1080 px frame. The last words of the film and the end card are too small to read on a phone. | Raise to at least 40 / 32 / 28 px, keep the centred stack inside the tall column. | `src/chapters/providedFor` |
| 4 | 11 | 591-593 | both | The Veyago "mark" is a placeholder chevron in a dark rounded square (CLAIMS G39). | Owner supplies the real mark or the mark is cut. | `src/chapters/providedFor` |
| 5 | 3 | 80.5 | tall | The second rejected letter is cut by the right frame edge (two letters do not fit the column). | Stack or scale the two letters so both sit inside the 1080 column. | `src/chapters/theNo` |
| 6 | 3 | 105.5-114 | tall | The "keep" gears card is cut by the right edge; the date roll "00 September 0000" (mid-roll) reads as junk when paused. | Same fix as 5. For the roll, start the roll at the final width or fade it in with the final digits (mid-roll is expected, check two adjacent frames). | `src/chapters/theNo`, `src/kit/NumberRoll` |
| 7 | 9 | 416, 420 | both | The super "Version 2: a binder for everyone you call family." is written across the base of the Dad house and its nameplate: text over art, partly lost in the cardboard. | Move the super to a clear band (top of the frame) or place it on a paper tint. | `src/chapters/village` |
| 8 | 10 | 527.5 | wide | "Apple Watch. Apple Wallet." overlaps the bottom of the phone (tab bar) at the frame bottom. In tall it is clear. | Raise the super or lower the phone group in wide. | `src/chapters/paperToGlass` |
| 9 | 10 | 554.5 | both | The far phone is behind the invitation card; the card cuts across the phone, so neither reads well. In tall the far phone sits below Maya's phone, nearly out of the column. | Offset the card above the phone or fade the phone behind it. | `src/chapters/paperToGlass` (`Invite.tsx`) |
| 10 | 9 | 483 | both | The village-green chat "Who are you looking after?" and its two chips are faint and small (about 14 px), crossed by the pencil line and the crossed-out form. | Draw the bubble on a paper tint, enlarge to 36+ px, route the line away. | `src/chapters/village` |
| 11 | 6 | 264-268 | tall | The row of wallpaper phones is cut by both frame edges (only five of nine visible, the fifth clipped). | Slide in a narrower row or scale to 1080 px column. | `src/chapters/nameAndLook` |
| 12 | 6 | 275.5 | both | The emergency-card footage shows "Eleanor Hughes", a birth date and "Card updated Oct 16, 2026", and the card is cropped at the bottom ("Shellfish" cut). It is a dated sample on glass, and the persona does not match the film's family (CLAIMS G19). | Re-capture with the film's names and no date, or scrub the date. | capture / `src/chapters/nameAndLook` |
| 13 | 6 | 258-290 | both | Rule check needed: this chapter shows glass (tokens, wallpapers, emergency card, wireframes) on black that was never first drawn on paper (the laptop is the only paper object). See contract sweep, row "paper before glass". | Director ruling. If strict, draw each glass object on paper first or reframe the section as the imagined design file. | `src/chapters/nameAndLook` |
| 14 | 5 | 208-210 | wide | The super "The gap: all of it, for everyone, privately." is written on the bottom edge of the frame and is partly cut (at 210 s only "The gap: all of it, for every" fits in wide, and the baseline touches the bottom). In tall it sits inside. | Raise the gap super about 60 px or shrink the board. | `src/chapters/researchBoard` |
| 15 | 7 | 300-330 | both | Engine-room text is small: the tab labels (Binder, Documents ... about 12 px) and the Xcode navigator rows (about 6 px, unreadable), floor labels "Code", "The data" (about 14 px), box labels (about 20 px). In tall the "EmergencyCard" tab touches the column edge. | Raise the type, minimum 28 px for labels that carry meaning; the navigator rows can stay as texture. | `src/chapters/engineRoom` |
| 16 | 8 | 369, 391 | both | Status plaque "Waiting for Review" (about 14 px) and "Ready for Distribution" (about 12 px) are tiny; the sticky note "Listed as paid. Should be free." is about 11 px and the pencil line runs through it. The super "Day one: a mistake..." (mid-write at 391) is small, about 22 px. | Scale the plaque and note up 2x, move the line off the note. | `src/chapters/launch` |
| 17 | 4 | 168, 150 | both | At 168 s (pull-back) the whole machine, calendar and gears are glyph-sized; the gate texts are about 8 px. It is a transition frame but it lasts several seconds. | Shorten the hold, or enlarge. | `src/chapters/filterMachine` / director |
| 18 | 5 | 175, 183, 188 | both | Card titles "The store" etc. are about 14 px; mid-write frames show "The st", "The rev" (expected). The four question supers (G11) were not visible in these frames; confirm they are on screen (their write window is 5-21 s, we sampled 175, 183 which is local 5 and 13). | Confirm in a frame at local 7, 11, 15, 19. | `src/chapters/researchBoard` |
| 19 | 11 | 573 | both | The start of the closing chapter: a pulled-back sheet where the line, a spike and tiny glyphs are the only content; the super "A no. Five filters. One idea. A whole village." is the only readable thing, at the bottom. Nearly empty frame for 11 s. | Director decision: it is the intended "every chapter one drawing" shot, but the sheet is empty at this zoom. | `src/chapters/providedFor` |
| 20 | 6 | 259 | both | In the Light/Dark token card the "Text" label on the dark swatch is grey on near-black (contrast about 2:1); labels are about 14 px. | Use the chapter's light ink on dark and 28 px. | `src/chapters/nameAndLook` |
| 21 | 3 | 105.5 | both | The gear labels "storage, sync, reminders, export" and the label "keep" are about 10 px. | Enlarge with the card. | `src/chapters/theNo` |
| 22 | 9 | 472 | both | Bubbles "Hello", "Hola", "Hallo", "Bonjour" are about 24 px; "Hoi" arrives later. The country circles are tiny blue ovals. | Enlarge bubbles; acceptable otherwise. | `src/chapters/village` |
| 23 | 10 | 491, 515 | both | Phone footage text is about 8-12 px (home screen). Acceptable for footage; it is not meant to be read. | None. | n/a |

Not defects, checked: mid-write frames ("Every family has", "And every fam", "The st", "Prov") are expected; the number roll showing "4.3(a)" with a glitchy first digit at 80.5 is a roll in motion; calendar weekdays are right for September 2026; the research-card art contains only grey bars, no real store, terminal or review text.

Flicker check: only one pair was possible within budget (the 4.3(a) roll, frames 2415 and 2416 were not rendered). Fast-motion flicker was NOT checked by this sweep.

## 2. Contract sweep

| Rule | Method | Result |
|---|---|---|
| The first app is never named, nor its plain-English form | `zsh tools/checkRules.sh` (src, docs, tools, public, CONTRACT.md); extra grep of file names, comments, strings | Clean. No file name contains it. The film's own drawn label "keep" (`theNo/Chapter.tsx:130`, `popup/effects/ScissorsCut.tsx:164`) is a different word; flagged to the owner as G7 because it is one letter from the banned word. The git history was not searched. |
| No Apple logo glyph or Apple typeface authored by us | checkRules plus grep for SF Pro, San Francisco, SF Symbols, system font stacks | Clean. Fonts in `public/fonts` are Caladea, Caveat, DM Sans, Kalam, Patrick Hand, Reenie Beanie. The app, Watch and Wallet UI seen on screen is app footage, not authored by the film. |
| No `mix-blend-mode` | grep `src`, `tools` | None in code. Four comments/READMEs say it is forbidden. `globalCompositeOperation` is used in `paper/render/deposit.ts` for canvas texture only, which is not CSS blending. |
| Nothing on glass that was not first drawn on paper | stills | One suspected breach: Ch6 (see defect 13). Ch10 phones come from the village houses by the intended conversion. Ch11 returns to paper. |
| App Store Connect, store, review and terminal text are drawn, not recorded | stills, code | Pass. Status plaque, search results, terminal and reviews are drawn shapes or plaques; no capture of them. Xcode is drawn on the laptop. |
| No launch date, no "seven days" | grep `src`, `tools`, `docs` | Pass in code and on screen. Only the removal notes in `docs/v4/BIBLE4.md` and `CLAIMS.md` mention the words. The date "21 September 2026" (A7) remains by design. |
| Claims in the build that contradict the claims sheet | code vs sheet | Voice and super still carry rejected wordings: spoken M10 "the day before", M11 "There is no Veyago server", M5 "Everything the app does...", F12/F9 "day two"; beats4 `SUPERS.nameAndLook` says "Dozens of versions" while the code shows "Many versions". The `engineRoom`, `nameAndLook` and `launch` code already carry the rewords; `beats4.ts`, `docs/v4/voicelines.json` and the voice recordings have not. Owner of `beats4.ts`/`vo4` must align. |
| Avoid-words list | checkRules | 0 warnings. |

## 3. Questions for the owner (with a recommended answer)

Ch1: 
1. Q: Is "Provisum 2. How it was made, and why." the title you want, and is the film published only after 2.0 is live? A: Yes, and hold publishing until 2.0 is approved (A19, 2.0 was rejected for 3.1.2 on 16 Oct).

Ch2:
2. Q: Credit Maya, Dad, Leo, Mia, Jonas, Biscuit and Sam as fictional? A: Yes, one line in the credits (C1).

Ch3:
3. Q: Exact count and wording of the rejections, guideline "4.3(a)" and title "Design - Spam" (A1, A2, G6)? A: Take both from Resolution Center, word for word, and say "turned down twice" only if two messages exist.
4. Q: Keep "Apple was right." spoken (A3)? A: Keep; it is your opinion and flatters nobody, but you must own it.
5. Q: 21 September 2026 as the restart date (A7)? A: Confirm against first commit and the new bundle id.
6. Q: Is the drawn label "keep" acceptable (G7)? A: Change it to "carry" to stay far from the old name.

Ch4:
7. Q: Do the five gate texts match your real rules; "six to eight weeks" versus the voice's "weeks, not years" (B2, G9)? A: Make screen and voice say the same; use the screen text, and change the voice to match.
8. Q: "five gates" (Ch4) or "five filters" (Ch11 super)? A: Use "filters" in both, the spoken word.

Ch5:
9. Q: Is "The gap" a fact or your thesis (D6)? A: Keep the wording but say "we found no one" in the voice, not in the claim.
10. Q: "Dates" or "Deadlines" (B5)? A: Use the app's tab word, "Deadlines".
11. Q: Which three public pages are the real rules (D4)? A: One state form, one Medicare page, one FTC page; record URL and date.

Ch6:
12. Q: Are Kinfolk, Hearth, Carebook, Homebase, Tend, Familio, Papertrail real working names (G15)? A: If not, swap in clearly invented names (they are real trade names in places); keep "On Behalf" (A10) only if true.
13. Q: "Many versions" or a counted number (B9)? A: "Many versions"; the code already does this.
14. Q: "Every screen was checked at the biggest text sizes" (B10, B11)? A: Say "the key screens" unless a test run backs "every".
15. Q: Is the glass in this chapter acceptable as the imagined design file (defect 13)? A: Yes, if the director rules the laptop screen counts as drawn on paper; otherwise redraw.
16. Q: May the sample card show "Eleanor Hughes" and "Oct 16, 2026" (G19)? A: No; re-capture with a film name and no date, or blur.

Ch7:
17. Q: The test count (B26, G27)? A: Run the full test suite on the day and type the number from Xcode's report.
18. Q: "0 servers" and "no Veyago server" (B20)? A: Not until the Wallet signing path is settled; the on-screen super already says "No account. Nothing collected."; change the voice and Ch10 roll to match (roll "0 servers" replaced with "0 accounts").
19. Q: "Data Not Collected" (B23), "encrypted before it goes anywhere" (B24), sharing goes straight to invitees (B22)? A: Confirm each against the shipped build and App Privacy answers; drop any you cannot.
20. Q: Bill reminder days (B18)? A: "three days before and on the day" (screen is right; fix the voice).

Ch8:
21. Q: Status names and order (A11), "United States first. On purpose." (A12, A13), "Listed as paid. Should be free." (A15)? A: Confirm against App Store Connect screenshots; keep "On purpose" only if true.
22. Q: Day-two fix (A16)? A: Screen says "Fixed. The next day."; align the voice and super ("Day one: a mistake. Day two: fixed.") only if the dates say so, otherwise cut to "Then we fixed it."

Ch9/10:
23. Q: Which countries make "five" (B35), what is "A4" (B36)? A: List the shipped countries, make the digit equal the count, and explain or cut "A4".
24. Q: Invitation wording (B40, G36)? A: Use the app's own text exactly, or the owner's screenshot.
25. Q: "Share a binder with anyone you trust", "friends who are family" (B34, B41)? A: Keep only if onboarding and the store listing say the same.
26. Q: The 8 Simulator moments (E16): do the invite and who-joined moments depend on the Family CloudKit schema in Production? A: Yes; capture with the demo hooks.

Ch11:
27. Q: "Free on the App Store" (A18)? A: Keep once 2.0 is live and price is Free with the in-app purchase.
28. Q: The Veyago mark (G39)? A: Supply the file or cut the mark.
29. Q: "Private by design" (end card)? A: Keep only if Q19 is confirmed; otherwise "Made by Veyago."
30. Q: Synthetic-voice credit (C4, G40)? A: Yes, add a credit line ("Voices are synthetic") and the fictional-family line.

## 4. What was not done

- Not every frame: 52 times of about 18,000 per format; fast-motion flicker (two adjacent frames) was not checked.
- Master compositions only; per-chapter `Chapter-*-wide/-tall` compositions were not rendered.
- No measurement of text height by tool; sizes are read from stills.
- Git history was not searched for the banned name.
