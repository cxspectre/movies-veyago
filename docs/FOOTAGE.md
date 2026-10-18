# FOOTAGE — Provisum 1.2 screen captures for "Provided For"

Owner: footage capture. Everything here was captured from the real app (release/1.2, the product
the film calls "Provisum 2") in the iOS and watchOS Simulators, except **`wallet-pass.png`**, which is
a reconstruction (see "Apple Wallet pass"). `public/footage/manifest.json` is the machine-readable
list; this file is the human one and wins where names differ from requests in BIBLE §6.2.

## 1. What exists

All phone clips are 1206 x 2622 px (iPhone 17 Pro, 402 x 874 pt at 3x), watch clips 416 x 496 px
(46 mm, native). All videos: H.264 High, yuv420p, constant 30 fps, no audio. Hot window = the
1.5-2 s the cuts should use (clip-local seconds).

| Group | id (BIBLE request) | Dur | Hot | Sketch | What it shows |
|---|---|---|---|---|---|
| P0 | `binder-home-dark` | 7.8 | 1.5-3.5 | binder-home-v2 | Mom's home: still 1.1 s, then a slow scroll to the glance and family cards |
| P0 | `binder-home-light` | 7.6 | 1.5-3.5 | binder-home-v2 | the same, light appearance (for the face-up phone at 2:25) |
| P1-1 | `family-tabs` | 7.8 | 0.9-2.9 | family-tabs | binder switcher: Mom, Dad, Me, Lily, Biscuit; Lily picked, home turns amber |
| P1-2 | `watch-card` | 7.6 | 0.0-2.0 | watch-wallet | the watch app with Mom's card (synced from the phone), crown-style scroll to medications |
| P1-3 | `med-refill` (refill-reminder) | 8.2 | 6.0-8.0 | pill-bottle | card's Medications list with a Refill Oct 27 pill → Eliquis page → Refill: reminder 3 days before and on the day |
| P1-4 | `scam-check` (scam-note) | 7.4 | 1.6-3.6 | scam-letter | mail sorting card: Social Security Administration letter, "Looks like a common scam pattern" |
| P1-5 | `passport-reminder` | 7.6 | 5.6-7.6 | passport | Family IDs → Passport (Sep 14, 2027) → "We'll remind you 9 months, 6 months and 3 months before" |
| P1-6 | `shared-costs` | 7.6 | 0.2-2.2 | shared-costs | who paid what: David $204.00, You $140.62, split, To even it out |
| P1-7 | `visit-summary` | 7.6 | 5.6-7.6 | visit-recording | appointment → Visit recording (42 min) → Summary of what was said, new dates |
| P1-8 | `belgium-112` (call-112) | 9.3 | 7.3-9.3 | europe-map | Belgian binder's emergency mode: Belgian fields, then WHO TO CALL / Call 112 |
| P1-9 | `onboarding-question` (onboarding-chips) | 7.0 | 2.4-4.4 | form-to-chat | "Who are you looking after?" tiles; Mom tapped; "What's Mom's full name?" |
| P2 | `watch-card-arrives` | 6.0 | 2.5-4.5 | watch-wallet | watch "No emergency card yet" → Mom's card arrives from the iPhone (real sync) |
| P2 | `phone-show-on-watch` | 7.0 | 1.8-3.8 | watch-wallet | the phone side: Show on Apple Watch switched on (same moment as above) |
| P2 | `emergency-card-full` | 5.8 | 1.6-3.6 | watch-wallet | emergency mode slides up and becomes the card view (front and back of the printable card) |
| P2 | `wallet-card-front` / `-back` (PNG) | – | – | watch-wallet | the printable card faces cropped from the app's card view, 1086 x 686 px each |
| P2 | `wallet-pass` (PNG) | – | – | watch-wallet | **reconstruction** of the Apple Wallet pass front (section 4) |
| P3 | `onboarding-country-chips` | 6.0 | 1.6-3.6 | europe-map | "Where does Mom live?" country chips; Belgium tapped, the binder's flag badge turns Belgian |
| P3 | `onboarding-welcome` | 9.0 | 3.5-5.5 | family-tabs | first screen: the binder's label cycles Grandma, Grandpa, Me, Mom, Dad |
| P3 | `family-share-card` | 10.0 | 7.8-9.8 | share-card | Family access (David, Claire, Ruth) → "Share the emergency card with family", "encrypted on this iPhone before it goes to iCloud" |
| P3 | `wallet-pass-fields` | 9.4 | 0.6-2.6 | watch-wallet | Add to Apple Wallet → "What goes on the card": switches flipped, consent text |
| P3 | `ask-about-mom` | 7.0 | 2.4-4.4 | form-to-chat | Ask about Mom: a Try asking chip → a plain answer. **Shows 1-800-MEDICARE (real number)** |

Extra files: `<id>.png` poster for every entry (a frame of the clip); clean stills without the
Dynamic Island: `binder-home.png` (= `binder-home-dark-still.png`), `binder-home-light-still.png`,
`emergency-card-full-still.png`, `watch-card-still.png`; `binder-home.layout.json` (+ `-light`);
`wallet-pass.pass.json`; `wallet-pass-art/` (the pass's logo, thumbnail and icon PNGs, @3x).
Total about 42 MB.

## 2. Setup (how everything was made)

- **Source:** `~/Developer/Apps/.pv-worktrees/v12`, branch release/1.2 at
  `3778e86` ("feat: invite family from inside the app ..."), clean, untouched (no edits, no xcodegen).
- **Build:** `tools/capture/build.sh` (= `nice -n 10 xcodebuild -project …/Provisum.xcodeproj -scheme
  Provisum -destination 'platform=iOS Simulator,id=761ABF75-…' -derivedDataPath /tmp/pv-dd/film build
  CODE_SIGNING_ALLOWED=NO`), Xcode 27.1, BUILD SUCCEEDED first time. The iOS build also produced
  `Debug-watchsimulator/ProvisumWatch.app`. Debug build (the OB_ hooks need DEBUG).
- **Simulators (mine, created for this):** `Provisum Film iPhone` 761ABF75-A87D-4EDA-B7D4-5E1668CF210E
  (iPhone 17 Pro, iOS 27.0) paired with `Provisum Film Watch` FFBCBDAF-95C7-45C5-8353-04F6792098EB
  (Series 11 46 mm, watchOS 27.0). I chose an iOS 27 phone to match the watchOS 27 runtime and the
  current SDK; pairing the watch with `Provisum Film 2` (iOS 26.2) was not tried, and that simulator was not used. Both are shut down; delete them with
  `xcrun simctl delete <udid>` when the film is locked (left in place for re-captures).
- **Every capture:** `simctl ui dark` (light only for `binder-home-light`), status bar 9:41, charged
  100 %, 4 bars, Wi-Fi 3, no carrier (`launch.sh` re-applies it each launch), `OB_APPEARANCE=dark`,
  `OB_DEBUG_UNLOCK=1`, `OB_REVIEW_PROMPT=off`. Fictional data only: the app's sample "Mom"
  (Eleanor Hughes), its demo family (David, Claire, Ruth), the European sample (Martine Peeters) and
  names typed by me from the app's own placeholders (Claire Hughes, Lily Hughes, Biscuit). No iCloud
  account is signed in; nothing was sent anywhere (the Wallet "Add" button was never pressed).
- **Tools installed:** AXe 1.8.0 (`brew install cameroncooke/axe/axe`) for taps, swipes, typing and
  the accessibility tree. ffmpeg was already there. Python helpers use `Film/.venv` (numpy, Pillow,
  already present). Nothing else installed.
- **Scripts (`tools/capture/`):** `env.sh` (paths, UDIDs), `build.sh`, `launch.sh [--fresh] OB_…=…
  [-- app args]` (uninstall + install + OB_RESET=1 with --fresh), `rec.sh start <name> [watch] | stop`
  (simctl recordVideo --codec=h264 --force), `shot.sh`, `swipe.sh x0 y0 x1 y1 s` (2 px steps: the
  default AXe swipe moves in visible jumps), `tapd.sh`, `findcolor.py` (finds a button by colour after
  a scroll whose length varies), `motion.py` (where the motion is, to choose trims), `sheet.sh` /
  `pair.py` (contact sheets), `encode.sh <raw> <id> <start> <end> <poster s|still:file>`,
  `encode-seg.sh <raw> <id> "s1-e1,s2-e2" <poster s>`, `layout.py`, `axflat.py`, `manifest.py` +
  `addclip.py` (metadata in `clips.json` → `manifest.json`), `ocr.swift` (Vision OCR scan),
  `recipes.sh <id>` (re-captures the hook-driven clips), `wallet-pass/` (pass builder and renderer).
- **Raw recordings** stay in `/tmp/pv-film-raw` (outside the film folder; deleted on reboot).

### Conventions in the footage
- simctl records variable frame rate (frames only when the screen changes). `encode.sh` resamples to
  30 fps and pads with the last frame (`tpad`) where a trim runs past the last recorded frame; the
  manifest says where a clip ends on a held last frame.
- **Joins:** some clips are two pieces of one recording joined inside a static hold (the screen is
  identical on both sides, so the join is invisible). Each is listed in the clip's description.
  Nothing is sped up or slowed.
- **Dynamic Island:** the videos and their posters show the black island pill; `simctl io
  screenshot` stills mostly do not. Apart from the island the still and the first frame match.
- Emergency mode (`belgium-112`, `emergency-card-full`) hides the status bar by design.
- The home indicator is not drawn in any capture.

## 3. Re-capturing each clip

Run from `Film/tools/capture` after `source env.sh`, phone booted (`xcrun simctl boot $PHONE`).
`recipes.sh <id>` performs the hook-driven ones; afterwards pick the trim with
`../../.venv/bin/python motion.py $RAW/<raw>.mov 4` and `sheet.sh`, encode, then `python3 addclip.py`.
Tap points are in points on the 402 x 874 screen. AXe cannot see sheets or full-screen covers
(only the root window), so taps inside sheets are by coordinate from a screenshot.

- **binder-home-dark / -light** — `recipes.sh binder-home-dark`; `encode.sh $RAW/binder-home-dark-scroll2.mov
  binder-home-dark 1.8 9.6 still:$RAW/binder-home-dark.png` (then take the poster from the video);
  layout: `python3 layout.py $RAW/binder-home-dark.ax.json $FOOTAGE/binder-home.png
  $FOOTAGE/binder-home.layout.json dark`.
- **family-tabs** — manual. `launch.sh --fresh OB_SEED_SAMPLE=1 OB_SECOND_BINDER=1 OB_SKIP_ONBOARDING=1 …`
  (Mom + Dad). Then three times: switcher (52,84) → New binder (last binder row + 96 px in the 920-wide
  preview) → tile (Myself / My child / A pet) → type the name one key at a time ("Claire Hughes",
  "Lily Hughes", "Biscuit"; Myself becomes "Me") → Continue (200,805) → Continue on the country page →
  close the first guided question with X (41,91). Back to Mom via the switcher. Record: switcher,
  Lily row (120,247), switcher, Biscuit row (120,289). Encode 3.4-11.2. A later `--fresh` deletes these
  binders.
- **watch-card, watch-card-arrives, phone-show-on-watch** — see section 5 (watch).
- **med-refill** — `recipes.sh med-refill` (check `med-refill-position.png`: the tap at y 615 must hit the
  Eliquis row). `encode-seg.sh $RAW/med-refill.mov med-refill "3.6-6.8,9.6-14.6" 7.4`.
- **scam-check** — `recipes.sh scam-check`; `encode-seg.sh … "4.6-9.0,13.9-17.4" 3.0` (cuts the
  springboard and launch screen). Hooks: `OB_PRESENT_MAIL=1 OB_MAIL_FIXTURES=scam OB_MAIL_SORT=1`.
- **passport-reminder** — manual (the sample has no passport). `--fresh` seed with `OB_OPEN_ROUTE=ids`;
  + (364,84) → Type it in (200,494) → Type (200,408) → Passport (200,355) → scroll → Expires: Add a date →
  date pill → month arrow (313,336) 11 times to September 2027 → 14 → Save to Mom's binder (200,801).
  (I first saved June 12, 2027 and moved it to Sep 14, 2027 in the editor so that the 9-month reminder
  is still ahead.) Back to Family IDs; record: tap Passport row (200,230), `swipe.sh 200 700 200 280 2.6`.
  `encode-seg.sh … "2.6-5.6,7.4-12.0" 7.2`.
- **shared-costs** — `recipes.sh shared-costs` (`OB_COSTS=demo OB_INITIAL_TAB=people`: the hook runs
  when the costs row on People appears, then pushes Shared costs on the Binder tab). Encode 3.0-10.6.
- **visit-summary** — `recipes.sh visit-summary` (`OB_VISIT_DEMO=after OB_VISIT_RECORDING=demo
  OB_VISIT_OPEN=1`). Encode 3.4-11.0.
- **belgium-112** — `recipes.sh belgium-112` (`OB_SEED_SAMPLE=1 OB_EMERGENCY_MODE=1` with app args
  `-AppleLocale en_BE -AppleLanguages (en)`). `encode-seg.sh … "4.2-9.1,10.0-14.4" 8.8`.
  How the sample picks its country: `SampleData.sampleRegion()` → `Region.resolve(nil, device:
  Locale.current.region)`; an EU phone region gives the European sample of that country (else US).
  The emergency number follows the phone (`EmergencyNumber`). I used the seeded Mom rather than
  `OB_SAMPLE_BINDER=1`: that hook builds the labelled sample before the card store opens, so its
  emergency page says "The emergency card is empty" (it still shows Call 112).
- **onboarding-question / onboarding-country-chips** — `recipes.sh onboarding-question` (fresh, no
  OB_SKIP_ONBOARDING, `OB_ONBOARDING_STEP=who`). Encode 1.6-8.6 and 1.9-7.9.
- **onboarding-welcome** — `recipes.sh onboarding-welcome`; encode 0.2-9.2.
- **emergency-card-full** — `recipes.sh emergency-card-full` (`OB_EMERGENCY_MODE=card`); encode 5.2-11.0.
  Card faces: crop the still at (60,493)-(1146,1179) and (60,1329)-(1146,2015) px.
- **family-share-card** — `recipes.sh family-share-card` (`OB_SEED_SAMPLE=1` must be on every launch
  for the demo members; `OB_PUSH_FAMILY=1 OB_DEMO_CARD_SHARING=on`). `encode-seg.sh … "3.6-9.7,11.3-15.2" 9.6`.
- **wallet-pass-fields** — seed + `OB_PRESENT_EMERGENCY_CARD=1`, seven fast swipes to the bottom, tap Add
  to Apple Wallet (200,690); record; `axe tap --tap-style physical` on (340,589) and (340,668) (the
  default tap style does not flip SwiftUI switches); `swipe.sh 200 690 200 250 3`.
  `encode-seg.sh … "4.3-9.6,11.8-15.9" 4.8`. Do not press Add (it would contact the signing service).
- **ask-about-mom** — `recipes.sh ask-about-mom` (`OB_PRESENT=assistant OB_ASSISTANT_HEURISTIC=1`;
  without the heuristic flag the on-device model never answers in the Simulator). Encode 3.0-10.0.

## 4. binder-home.layout.json

From AXe's accessibility tree of the dark still (`binder-home.png`); the light layout is identical
(checked element by element). Screen `402 x 874 pt`, scale 3. `safeArea` top 62 / bottom 34;
`statusBar`, `dynamicIsland` and `homeIndicator` are iOS standard geometry for the device (not read
from the app). 42 elements, each `{kind, label, id, frame{x,y,w,h}, clippedFrame, onFirstScreen,
fullyVisible, texts[]}` where `texts` are the static texts inside with their own frames. Kinds:
`binderSwitcher` (the "tabs" of the sketch: the EH avatar + chevron that opens the binder list),
`navTitle`, `navButton` (Search, Add), `headline` ("Next up · 1 of 2"), `link` ("1 more in Deadlines"),
`nextUpCard` (the countdown: Tomorrow / Cardiology follow-up / detail), `nextUpAction` (Done, Snooze),
`pageIndicator`, `sectionHeader`, `laterRow` (3), `dockButton` (Emergency, Family, Bills, Packets, More:
the 52 pt circle sits at the top centre of each 69 x 70 frame, the label under it), `helperChip` (5 in
a horizontal strip; only the first two are fully on screen, the third is cut at x=402), `glanceCard`,
`row`, `familyCard`, `tabBarTab` (4). Toolbar glass buttons draw about 4 pt outside their frame
(`glassFrame`). `tabBar` is the bar's whole area, `tabBarCapsule` the drawn capsule (21,791,360,62).
I checked the frames by drawing them over the still: they sit on the pixels. There is no
conversation-chip or ask entry on the 1.2 home: "Ask about Mom" lives in Search (`ask-about-mom`);
the chip-like row on the home is HELPERS (Still right?, Go through the mail, Things to add, …).

## 5. Apple Watch

- The watch app is installed on the paired watch **through the iOS app**: `xcrun simctl install $PHONE
  Provisum.app` while the watch is booted. A bare `simctl install $WATCH ProvisumWatch.app` runs the
  app, but the phone's WCSession then reports it as not installed ("Install Provisum on your Apple
  Watch from the Watch app …"). Uninstalling the phone app (`launch.sh --fresh`) removes the watch app.
- `watch-card-arrives` + `phone-show-on-watch` are one genuine moment: watch app empty, phone card sheet
  scrolled to Apple Watch, both recording, tap Show on Apple Watch (340,310) `--tap-style physical`;
  the card arrives on the watch about 1 s later over WatchConnectivity. `watch-card` was recorded right
  after, with two `axe swipe 104,190 → 104,70 2.5 s --delta 1` on the watch.
  (An earlier take used `OB_WATCH_DEMO=1`, the watch app's own made-up card; replaced.)
- The watch clock shows the real time (10:13-10:15): `simctl status_bar` is not supported on the
  watch runtime (error 45). Cover or replace that corner if 9:41 matters.
- Not captured: the complication on a watch face (needs face editing in the Simulator; not attempted).
  BIBLE §6.2 says "the Watch face with the emergency card"; what exists is the watch app's card screen.

## 6. Apple Wallet pass (`wallet-pass.png`) — a reconstruction

Wallet is not usable in the Simulator, and the pass is not drawn by the app: the app sends the chosen
fields to Veyago's `wallet-pass` function, which builds and signs it. Its layout code is
`~/Developer/Websites/veyagocloud/supabase/functions/_shared/wallet-pass.ts`
(read-only; the `WalletCard*` files in the app are the *printed* card, not the pass).
`tools/capture/wallet-pass/build-pass.mjs` copies that file to /tmp, runs `parseCardRequest` +
`buildPassJson` on the sample card (Eleanor Hughes, A+, born 1946-03-14, Penicillin (hives) and
Shellfish, three medications, contacts David Hughes (Son) and Linda Moreno (Neighbor), Riverside
Methodist Hospital, updated 2026-09-21; Medications included as if switched on, which is off by
default and only ever reaches the back) and writes
`wallet-pass.pass.json`. `render-pass.mjs` draws the front from that JSON (HTML through Remotion's
headless shell, `cdp-shot.mjs`). Exactly what the production pass holds:

- Style **generic**, no barcode, `sharingProhibited`. `backgroundColor` rgb(180,35,24) (#B42318),
  `foregroundColor` white, `labelColor` rgb(255,220,214).
- **Logo row:** `logo` = white Star of Life with the Rod of Asclepius on transparent (30 pt), `logoText`
  "Emergency card".
- **Header (top right):** BLOOD TYPE / A+.
- **Primary:** label BORN 1946, value "Eleanor Hughes".
- **Thumbnail (90 pt, right of primary/secondary):** the sign plate: white rounded square, red keyline,
  red Star of Life with a white rod (`wallet-pass-art/thumbnail@3x.png`). The emblem is never a cross.
- **Secondary:** ALLERGIES / "Penicillin, Shellfish" (the reactions are dropped on the front to fit
  205 pt beside the thumbnail; the back keeps them).
- **Auxiliary:** IN AN EMERGENCY, CALL / "David Hughes" (left) and SON / "(614) 555-0133"
  (right-aligned).
- **Back fields, in order:** Name; Emergency contact · Son (David Hughes, number); Emergency contact ·
  Neighbor (Linda Moreno, number); Allergies and reactions; Medications (three lines); Date of birth
  (long style); Blood type; Preferred hospital; Details as of (medium style); About this card ("Made with
  Provisum from what was entered in the app. Check the details with the person, or their family,
  whenever you can.").
- Languages: en/es/de/fr/nl labels exist (`build-pass.mjs <lang>` writes `wallet-pass-<lang>.pass.json`).

What is invented in the PNG: the geometry (370 x 300 pt, 14 pt corners, Wallet-like spacing) and the
typeface (DM Sans standing in for SF Pro, which Wallet uses and the film may not). The genuine in-app
side of the feature is `wallet-pass-fields` (the "What goes on the card" picker).

## 7. Things the director should know

- **Apple typefaces and glyphs are inside every genuine capture.** The app's UI is drawn in SF Pro with
  SF Symbols (and `phone-show-on-watch`, `wallet-pass-fields` and the card sheet show Apple's own "Add
  to Apple Wallet" button with the Wallet icon). CONTRACT §1 bans Apple typefaces and SF Symbols glyph
  art in the film's own graphics; real screen footage cannot avoid them. Decision needed (it is how
  every Apple-platform app film looks, but the rule as written does not carve it out).
- **Real-world names in the app's sample data** appear on screen: CVS Pharmacy (Kenny Rd), Riverside
  Methodist Hospital, Spectrum, AEP Ohio, Buick Encore, Ohio BMV, Reader's Digest, Medicare / Social
  Security Administration (the scam fixture letter), ReportFraud.ftc.gov; in the Belgian sample AZ
  Sint-Jan Brugge and Engie. They are businesses and agencies, not people. Phone numbers are 555
  numbers (US) and +32 50 00 01 xx (Belgian sample).
- **One real phone number:** `ask-about-mom` shows **1-800-MEDICARE** (Medicare's public line, from the
  sample's "Call Medicare about the duplicate lab charge"). OCR of every second of every clip found it
  nowhere else. Blur it or do not use that clip. (The same item is page 2 of the home's Next up pager,
  which no clip shows.)
- **Made by hand inside the app (genuine UI, staged data):** the Me / Lily / Biscuit binders in
  `family-tabs`, the passport in `passport-reminder`. **Seeded demo data:** the sample binders, the
  demo family members, the shared costs (`OB_COSTS=demo`), the visit recording / transcript / summary
  (`OB_VISIT_RECORDING=demo`, silent audio), the scam letter (`MailFixtures.scam`), the Ask answer
  (deterministic reader instead of the on-device model).
- `visit-summary`: the appointment reads "Today 8:45 PM" (an hour before the real clock) while the status
  bar says 9:41.
- `shared-costs` shows the app's own "To even it out: You owe David $31.69" (it labels it arithmetic).
- `med-refill` and `wallet-pass-fields` show a fake Rx number (RX 4471902) and a date of birth.
- Poster scan: no crash dialogs, no debug overlays, no Simulator chrome, no real people. Banned-word OCR
  scan (receipt, warranty, claim, proof, archive, timeline, scanner, life admin, the predecessor name):
  no hits in any frame.
- **Load:** the Mac ran at load 85-160 during the first hour. AXe commands took 1-3 s each, so the
  timings in the scripts are approximate; trims were chosen from the motion profile of each take.

## 8. What failed or was skipped

- `Provisum Film 2` (iOS 26.2) unused (an iOS 27 / watchOS 27 pair was made instead; 26.2 pairing untried).
- AXe sees only the root window: no element frames inside sheets/covers (coordinates from screenshots).
- The first family-tabs take started with the menu already open (recorder start latency); retaken with
  2.5 s pre-roll. Typing whole strings with AXe drops letters under load ("Biscui"); type one key at a time.
- Invite family sheet: needs an iCloud account ("Sign in to iCloud to invite family"); not captured.
- On-device model answers (Ask, visit summaries) never complete in the Simulator; the visit summary is
  the seeded one and Ask uses `OB_ASSISTANT_HEURISTIC=1`.
- Watch face complication: not captured (see section 5). Watch status bar cannot be overridden.
