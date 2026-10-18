# Captures done, v4 (2026-10-16)

Simulator captures for the 10-minute film. Files are in `public/footage4/`, metadata in `public/footage4/manifest4.json`, scripts in `tools/capture4/` (`recipes4.sh` runs the whole thing in order). The v1 footage in `public/footage/` was not touched.

## Setup
- **App:** `~/Developer/Apps/.pv-worktrees/v12` at `6d5f5eb` ("chore: build 2 of version 2.0"), used read-only. The worktree already had an uncommitted `project.pbxproj` change and an untracked `Tools/store_event.py` before I started. Neither came from me. `/tmp/pv-dd/film` was empty after a reboot, so I rebuilt once: `nice -n 10 xcodebuild -project Provisum.xcodeproj -scheme Provisum -destination 'platform=iOS Simulator,id=761ABF75-…' -derivedDataPath /tmp/pv-dd/film build CODE_SIGNING_ALLOWED=NO`. It succeeded and was the only build.
- **Simulator:** I used only `Provisum Film iPhone` 761ABF75-A87D-4EDA-B7D4-5E1668CF210E (iPhone 17 Pro, iOS 27.0). The Watch was not booted. Every launch had the status bar at 9:41, charged, 100 %. The text size was `large` (default) except in the AX5 take. The phone is shut down now.
- **Every launch** used `OB_SKIP_ONBOARDING=1 OB_DEBUG_UNLOCK=1 OB_REVIEW_PROMPT=off` plus `OB_APPEARANCE=<dark|light>`, together with the matching `simctl ui appearance`.
- **Format:** all clips are 1206x2622, H.264 High, yuv420p, constant 30 fps, no audio, 8.0-8.9 s long. Each poster is a lossless frame of the raw recording, with the Dynamic Island. The `binder-home-*.png` stills are clean simctl screenshots without the island. Raw recordings are in `/tmp/pv-film-raw4`, which is outside the repo and is cleared on reboot.
- **Load:** the Mac went up to a load average of 110-130 for a few minutes during the session, from other sessions. AXe taps took 1.5-2.6 s, so some clips join pieces of one take. Every join falls inside a static hold, where the screen is identical on both sides. The manifest lists the joins. Nothing is sped up or slowed down.

## How the family was staged (read this before using the clips as "genuine")
The app has no hook that makes the story's binders. `tools/capture4/stage-family.sh` edits the app's local SwiftData store (`Binders.store`) with `sqlite3` while the app is stopped:
- It starts from `launch.sh --fresh OB_SEED_SAMPLE=1 OB_SECOND_BINDER=1 …` (Mom plus Dad).
- The full sample "Mom" binder becomes **Dad** (Robert Hughes, blue). It keeps the sample's dates, documents and bills.
- The sample "Dad" binder becomes **Leo** (child, teal).
- Five binders are inserted: **Mia** (child), **Maya** (myself), **Jonas** (partner, "Jonas Weber"), **Biscuit** (pet), **Sam** (other, "Sam Costa"). These five are empty.
- Each binder gets its own backdrop through the device-only setting `ob.wallpaper.binders`: Dad mist, Leo sea glass, Mia blush, Maya lavender, Jonas sage, Biscuit apricot, Sam dusk. These are the bible's house colours.
- `stage-sam-papers.sh` adds "Car registration" (expires 14 May 2027) and "Flat lease" (type lease, ends 31 Aug 2027) to Sam. Neither has a number.
- `stage-passports.sh` adds a passport each to Leo (2 Jul 2027) and Mia (14 Sep 2027).

The documents are copies of the sample's own rows. Lesson learned: every non-optional column, including `ZPACKETMARKSSTORAGE`, has to be copied. A NULL there crashed the app in `Document.isArchived`.

Everything on screen is the real app drawing this data, but the data is staged. Dad's binder still holds the sample's content: Cardiology follow-up with Dr. Alan Brooks, Spectrum, AEP Ohio, the Buick Encore registration, and "David is on it".

## Clips (priority order)
| # | id | Look | Hot | Status |
|---|---|---|---|---|
| 1 | `binder-switcher-family` | dark | 1.2-3.2 | done (staged family): the switcher lists Dad, Leo, Mia, Maya, Jonas, Biscuit, Sam; Dad (mist) → Maya (lavender) → Sam (dusk) |
| 1 | `binder-switcher-family-light` | light | 1.3-3.3 | done, same moment in light (the wallpapers read more strongly) |
| 1 | `binder-home-<dad,leo,mia,maya,jonas,biscuit,sam>-<light,dark>.png` | both | – | 14 stills for C-41 / chapter 10 (the five-phone row) and the village houses |
| 2 | `wallpapers-sweep` | light | 0.6-8.0 | done: Settings › Background (`OB_PRESENT=settings OB_SETTINGS_PAGE=wallpaper`, scoped to Sam's binder) with all nine tiles visible, tapped in turn so the backdrop changes through all nine about every 0.8 s. **The tiles sit in a grid and do not slide past.** For a sliding row, draw it from these frames or use the 14 stills. |
| 3 | `emergency-default-text` | dark | 0.5-2.5 | done: emergency mode (`OB_EMERGENCY_MODE=1`) for the sample Mom at the default size, with a slow scroll |
| 3 | `emergency-largest-text` | dark | 0.5-2.5 | done: the same view at `accessibility-extra-extra-extra-large`. The hook does not fire when the app starts at an accessibility size, so the take opens at `large` and the size is changed live, then a 4 s pause, then recording. |
| 4 | `invite-friend` | dark | 6.9-8.9 | done (demo hook `OB_PRESENT_INVITE=1`, `OB_DEMO_MEMBERS=0`, Sam's binder sorted first so the hook picks it): "Share Sam's binder", "The invitation is for Sam" switched on, and `sam@example.com` (a reserved example domain) typed. **The bottom card reads "Sign in to iCloud to invite family".** No iCloud account is signed in, so the app never shows the Invite button. Nothing was sent, and no live CloudKit flow ran. |
| 5 | `family-joined` | dark | 1.2-3.2 | done (`OB_DEMO_MEMBERS=1`, `OB_USER_NAME="Maya Hughes"`): Dad's Family access shows "Shared with 2 people": You (owner), **David**, **Claire**, **Ruth (invited, not joined yet)**. The hook hard-codes those names, so they are not the story family, and I could not change them without editing the app. |
| 6 | `friend-binder` | light | 0.5-2.5 | done (staged): Sam's Documents, "2 papers in Sam's binder": Flat lease and Car registration; then the car registration opens |
| 7 | `passports-two-children` | dark | 0.0-1.9 (alt 7.4-8.8) | done (staged): Family IDs shows Dad's driver's license, Leo's passport and Mia's passport, with "Reminders come 9, 6 and 3 months before each one expires". Mia's passport opens and scrolls to the 9/6/3-month chips. |

Every item on the priority list was captured; none was infeasible. The exact segment times and commands are in `manifest4.json` (`howCaptured`) and `tools/capture4/recipes4.sh`.

## Checks
- **OCR:** one frame per second plus the poster of every clip, using Vision (`ocrscan.sh`). There were no hits for receipt, warranty, claim, proof, archive, timeline, scanner, life admin or the predecessor name. No debug overlays, crash dialogs, Simulator chrome, "◀ Safari" back badge or real phone numbers appear. The only address is `sam@example.com`.
- **Real business names** come from the sample data: Spectrum, AEP Ohio and "Buick Encore registration" on Dad's home, in both switcher clips and the `family-joined` start. Riverside Methodist Hospital appears in `emergency-default-text` at about 6.5-8.0 s. None of them is inside a hot window, but keep those frames short.
- **People:** only fictional names appear: Eleanor and Robert Hughes from the sample; David, Claire and Ruth from the demo hooks; the staged Leo, Mia and Maya Hughes, Jonas Weber, Biscuit and Sam Costa. I looked at a contact sheet of every clip and at a strip of all nine posters.
- **A take I discarded:** a stray tap reached Springboard while the app was down after the crash above, which put a "◀ Safari" badge in the status bar. I relaunched from simctl and re-took everything after that. No delivered clip has the badge.

## Fragile or unfinished
- The staging lives only in the simulator's store. `launch.sh --fresh` wipes it. Run `recipes4.sh` from the top, because the emergency takes come last for this reason.
- The tap coordinates assume the switcher row positions for seven binders and default text size. Re-check with a screenshot if the app changes.
- Not done: the Watch, any Xcode or terminal recording (C-02, C-07 to C-09; the owner records Xcode), the `pet-binder`, `binder-home-dad` window crop (the stills cover it), `screens-grid` and C-44's arrival notification (`OB_DEMO_ARRIVING` / `OB_DEMO_JOINING` say "Robert Hughes's binder", which does not match the "Sam" invitation, so I did not capture them).
