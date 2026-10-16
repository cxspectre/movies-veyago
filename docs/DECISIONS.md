# Production decisions — "Provided For"

Numbered so the crew can cite them. Each one is a call the script left open, an arithmetic fix, or a place where I chose between two readings. The timings that result are in `src/beats.ts`; the look is in `docs/BIBLE.md`. `src/film.ts` SLOTS were not changed (see #28 for the boundaries I checked).

## A. The script's open questions

1. **The name stays "Provisum 2".** The title, the end card and the teaser all say "Provisum 2" as written. FLAG: the 1.2 release branch, the What's New text and the paywall copy say 1.2. The film cannot go out while the App Store listing says 1.2; the script itself says the store version must ship as 2.0. Until the client confirms, nothing in the film says "1.2" and nothing says "2.0" either (only the "2").
2. **Europe is in the master.** Page 10 (the map, 3 s) and cut 8 (the Belgian binder's Call 112, 1.5 s) stay. If a US-only version is asked for, cut 8 becomes the `where-is-it` footage at the same 1.5 s and page 10 is untouched (it is 3 s and reads as breadth, not as a market); no music re-timing is needed. We do not produce that version unless asked.
3. **VO plus a no-VO mix.** Both are delivered for every version (contract §0). The hand-lettered notes already carry the argument; in the no-VO mix nothing is re-timed and the captions of the 9:16 versions carry the VO's words.
4. **Hands are stylised illustrations** (contract §6): graphite contour and three flat tones, no photography. Fallback at review: props and the hands' shadows only. The two pairs are "the author" (draws) and "the assistant" (slides, presses, lays the grid): the second person is who writes the question on the sticky note, which is the point of "we".
5. **Pronunciation:** both reads are recorded (contract §8). My recommendation for the pick: pro-VEE-zum (closer to the Latin, softer under felt piano). The director decides at the VO review.

## B. Script arithmetic and duplicated beats, fixed in beats.ts

6. **VO 1 is at its time limit.** 26 words at the contract's 2.3 words/s plus three sentence pauses of 0.4 s = 12.5 s: it ends at 0:19.504 against the contract's "ends by 0:19.5". `validateBeats()` allows one frame (33 ms) of tolerance so this does not read as a failure, but the VO engineer must hit 2.3 words/s or faster on this line. If the natural read is slower, drop "already" ("Provisum 1 did a lot.") rather than start earlier (0:07.0 is after the piano enters at 0:06, which is right).
7. **Five ticks, three nouns.** VO 1 names papers (binder), deadlines and the card; the V1 page also shows mail and packets. The pencil ticks the three named items on their nouns (estimates: 0:10.5, 0:13.0, 0:16.5) and the two un-named ones as a quick double tick at 0:19.0 / 0:19.5 under "hospital calls", then stops at 0:20.0: "already did a lot" covers them. Adding words to VO 1 was not an option (#6).
8. **Act boundaries vs modules.** The script's Act 2 heading says 0:35-1:25 while its own Act 3 starts at 1:25 and the wall at 1:20. SLOTS put shot 10 (the grid, 1:20) and shot 11 (the push-in, 1:25) together in `wall` (1:20-1:31); the transition starts when the lines catch light (1:31). The push-in therefore belongs to the wall scene, not the transition scene, and the transition opens on a static frame.
9. **Page pacing.** The script says "about 6 seconds each ... 2 seconds by the end", but its shot list gives pages 10-11 six seconds (3 s each), slower than pages 5-9. I held to the shot list's windows because VO 5 (1:06.3), the music lift (1:06) and the music drop (1:12) are anchored to them and the map needs 3 s. The schedule: pages 1-4 = 6, 5, 4, 3 s (0:38-0:56); pages 5-9 = 2 s each (0:56-1:06); pages 10-11 = 3 s each (1:06-1:12); the form page = 8 s (1:12-1:20). Sum 45 s = the desk slot. Within a page: slide-in 0.5 s (0.3 s for the 2 s pages), draw, a short hold; the next sheet slides in over the hold.
10. **The form page's internal timing** is fixed to the VO: the form draws 1:12.5-1:15.0, a pause, the cross-out at 1:15.5-1:16.0 on "Stop", the chat frame and question 1:16.5-1:18.0, the chips at ~1:18.4 and ~1:18.8, the accent circle 1:19.5-1:20.0 under "Just ask them". VO 6's estimate ends at 1:20.3, 0.3 s into the wall; acceptable (the wall's first second is hands and paper), but the VO engineer should aim to land by 1:20.0.
11. **"Card lands on the Watch at 1:48.0".** 1:48.0 is a module boundary, and scenes take no props, so a card cannot be mid-flight across it. The hit at 1:48.0 is the card peeling off the glass (`card_flip`); it lands on the Watch face at 1:48.5 (`snap`). The two scenes meet on `transition.handoff` (rotation 22°/−5°, screen complete, light at the top-right corner).
12. **"One word at a time" for a one-word title** is read as letter by letter: 8 letters, 0.12 s stagger, 0.6 s fades, done by 1:56.5; the "2" is drawn 1:57.0-1:58.0 and completes exactly on the resolve.
13. **The redrawn binder home is a thirteenth sheet.** The script lays "all eleven pages and the redesign" into the grid and then pushes into "the redrawn binder home", which was never drawn in Act 2. Decision: the sheet (`binder-home-v2`, the clean pass the script asks for) lands in the centre tile at 1:22 drawn to 70% (frame, tabs, card, deadlines, dock, the corner "2"); the hand draws its last strokes, the two chips and their accent circle, during the push-in (1:25.1-1:28.3) and is out of frame by 1:29. Every element on it was drawn on an earlier page (tabs: page 1; card and deadlines: V1 and page 2; chips: page 12), so the one rule holds, and the last thing drawn before the light is the conversation. The sheet is built from the real screen layout (`public/footage/binder-home.layout.json`), see BIBLE §4.14. If the hand in the push-in looks wrong at review, drop the sheet fully drawn and keep the push-in clean.
14. **The pencil click is a sound bridge.** Shot 20 sets the pencil down on camera; shot 21 says the click is the last sound (2:38.0, music map). Both survive by splitting the gesture: the hand lowers the pencil 2:29-2:32.5 and stops a hair above the paper; the cut to the end card is at 2:33.0; the click at 2:38.0 is the pencil finally touching the desk, heard, not seen. No `pencil_down` is played at 2:32.
15. **The silence beat** is 1:53.0-1:55.0: picture pure black and all stems cut on the same frame (BIBLE §7.2). The cut-downs keep a shorter one (0.5 s vertical, 1.0 s teaser), never less than 0.5 s.
16. **Cut lengths follow the music map** (2.0/1.5 alternating), so the Watch cut is 1.5 s although "the Watch is the shot people will remember"; the Watch has the flip at 1:48 and the hero at 2:20 to make up for it. Framing alternates with the lengths: 2.0 s cuts are the phone in the void, 1.5 s cuts are full-bleed crops.
17. **The nine cuts drop two pages** (`where-is-it`, `speech-bubbles`), exactly as the script's list does; both live on the wall and page 11's languages are implied by the Belgian binder.
18. **The wall has 15 slots:** the 12 pages, the V1 sheet with its sticky note, the redrawn home in the centre, and the face-down iPhone in the last slot (it foreshadows 2:25, when the same phone lies face up on the grid). Sheets land two per half-second so the drops sit on the grid.

## C. Look-and-copy calls

19. **The scam page's "red question mark" is the accent colour.** One accent only (contract §1); the real scam banner's colour is the app's business, not the film's.
20. **The cross-out is graphite, not accent.** Accent is the film's "yes" (ticks, circles, arrows, notes, the "2"); a rejection is drawn in pencil, heavy. The answer (the circle around the chips) is accent.
21. **The sticky note is pressed blank and lettered on camera** (0:28.5-0:32.5), by the second pair of hands, with a fineliner (the script's "pen cap" sound, used once). The chord lands on the smoothing (0:28.0), before a word is written; the question is written while we read it. Kalam 700 for sticky notes; Caveat 500 for margin notes; Patrick Hand for labels inside drawings; Reenie Beanie only for the dead form's placeholders.
22. **The Cambria closing line is on the desk, not the end card.** The script gives Cambria "the closing line" and gives the end card DM Sans. "Provided for." appears in Caladea italic at 2:28.0 under VO 8, bottom-centre, over the paper; the end card stays DM Sans exactly as scripted.
23. **Appearance:** dark (`OB_APPEARANCE=dark`) for everything in the void (1:38-2:25) as the script suggests; LIGHT for the face-up phone on the desk at 2:25 (the app is light-first and it is lying in daylight). Same layout, same state: the footage agent exports both stills of the binder home.
24. **The child and the dog on page 1 are drawn, not named**, so no fictional names are invented beyond the app's own sample data; the real switcher in cut 1 shows the sample names.
25. **One eraser moment** (page 1, the "Dad" tab) with crumbs that stay on the sheet into the wall; nothing else is erased. Honest, not fussy.
26. **The film ends on the end card** with no fade, and with digital silence after the click (≤ 0.4 s of room tail).
27. **Cut-downs.** Vertical (45.0 s, 12 segments): the sticky note, pages 1 and 2 (their full draw windows), the form page, the light catch, the rotating phone with three snaps, the title, four cuts (tabs, Watch, scam, chips), the end card. VO 2 is placed over the sticky note; VO 7 is trimmed to "Everything we drew. On your iPhone. No account. No tracking." to fit 7 s (the cut is logged on the segment). Teaser (15.0 s, 8 segments): the sticky note, four half-second slices of pages 1, 2, 3 and 10 at the moment each margin note lands, the light catch, one second of black, "Provisum" with the "2" completing on the last frame; no captions.

## D. Slot boundaries checked (no change requested)

28. All master anchors convert cleanly: snaps at transition-local 10/12/14/16 = 1:41/1:43/1:45/1:47; the "2" at title-local 5.0 = 1:58.0; the sweep at pair-local 1.0 = 2:21; the click at endCard-local 5.0 = 2:38.0; the chord at 0:28.0; the smooth at 0:28.0. Two boundaries carry visual continuity by agreement rather than shared state: 1:48.0 (#11) and 2:20.0 (cut 9 ends with the phone facing camera; the pair opens on the same pose). `wall` at 11 s is tight (3.5 s of drops, a 5 s rise overlapping them, a 6 s push) but it works; I would not move 1:31.

## E. Questions the client must answer

1. Will the App Store version be 2.0 on the day the film goes out? (The film says "Provisum 2" and nothing else.)
2. Do you want a US-only cut (Europe shortened or removed, #2), or is the master with Europe the only master?
3. Pronunciation: pro-VEE-zum or pro-VY-zum? (We recommend the first.)
4. Illustrated hands are fine? (We are not filming anyone; #4.)
5. End-card copy: "Free on the App Store" as scripted, or should it say anything about the one-time Full purchase?
6. Watch and Wallet: are real-device captures coming, or do we ship the rig with Simulator captures composited on it?
7. Music: composed/arranged to the music map (it needs a true hard stop at 1:53 and a resolve at 1:58), or a licensed track? A licensed track will not give us the stop.
8. The sample family's names (Eleanor Hughes and the sample data) on screen are fine?
9. Captions: English only on the 9:16 versions, or also Spanish, German, French and Dutch?
10. The quieter features (after-hospital list, the checklist for after a death) stay out of the film, as the script says?


## Client decision (2026-10-16): pronunciation
The client chose **pro-VEE-zum** for "Provisum" in the voice-over (VO 1 and VO 8). Every VO stem and mix already used the `_veezum` takes; the `_vyzum` files remain in audio/vo/ only as an unused alternative. All mixes and the six 4K deliverables in out/final/ were rebuilt from those stems on this date.
