# Claims sheet, "Provided For" v4 (10:00)

Rule (CONTRACT section 13.6): every number, date, status, name and quotation that is shown or spoken has a row here with its source. No row, no pixel. The first app is never named.

Written 2026-10-16 from `docs/SCRIPT-10MIN-v4.md`. App facts were read from the 2.0 release worktree (`/Users/cassiandrefke/Developer/Apps/.pv-worktrees/v12`, branch `release/1.2`, marketing version 2.0); `main` of the app repo is 1.1.

**Who can supply:** owner = Cassian (store history, dates, screenshots of App Store Connect, intent); app = the Provisum source or a Simulator run; repo = this film repo; official = a published form or page. 
**Status:** verified (checked against the named source on the date above) / needs the owner / cannot be verified: reword (the script text must change; a suggested rewording is in the note).

Times are the script's chapter-map times (master time). Ch = chapter number.

## A. Dates and the first app's history

| # | Claim (shown or spoken) | Where | Source of truth | Who | Status |
|---|---|---|---|---|---|
| A1 | The first app "was turned down twice" | Ch3 1:15, spoken | App Store Connect Resolution Center history of the first app | owner | needs the owner (count and that both were the same guideline) |
| A2 | "4.3(a)" and "Design - Spam" on the number roll | Ch3 1:15, shown | The rejection messages (guideline number and title, exact words) | owner | needs the owner. Draw the words only as the message wrote them. |
| A3 | "It wasn't different enough. Apple was right." | Ch3 1:15, spoken | Editorial judgement of the owner; the guideline wording in A2 | owner | needs the owner (opinion; the owner confirms they want it said, naming Apple) |
| A4 | "We stopped resubmitting and held on to the one thing that was good" (the engine) | Ch3 1:25, spoken | Owner's account; engine parts in A5 | owner | needs the owner |
| A5 | Engine gears labelled storage, sync, reminders, export | Ch3 1:25, shown | App: SwiftData store, iCloud sync, `ReminderEngine`, `Features/Export` | app | verified (areas exist in the app source). Whether they came from the first app: owner. |
| A6 | Old name, old idea, old purpose shown blurred, nothing legible | Ch3 1:35, shown | CONTRACT 13.5 and 13.6 (never named) | repo | verified as a rule: the art must be unreadable at 4K. |
| A7 | "21 September 2026", "the twenty-first of September, we started again" | Ch3 1:43, shown and spoken | Owner's records (first commit, new bundle id, App Store Connect creation date) | owner | needs the owner |
| A8 | "28 September 2026" on the number roll | Ch8 6:05, shown | App Store Connect: date the status became Ready for Distribution (or the approval email) | owner | needs the owner |  **REMOVED by the owner 2026-10-17: the film no longer states the launch date or that it took seven days.**
| A9 | "Seven days after the first sketch, App Review said yes." | Ch8 6:05, spoken | 28 Sept minus the "first sketch" date. 21 to 28 September is seven days, but 21 September is "started again", not "first sketch". | owner | needs the owner: confirm which event is day zero; otherwise reword to "Seven days after we started again, App Review said yes." |  **REMOVED by the owner 2026-10-17: the film no longer states the launch date or that it took seven days.**
| A10 | "For a few days it was called On Behalf." | Ch6 3:55, spoken; shown crossed-out names | Owner's notes (earlier working name of Provisum) | owner | needs the owner (also: the other crossed-out names must be invented or owner-supplied; none may be the first app's name) |
| A11 | App Store Connect statuses "Waiting for Review", "In Review", "Ready for Distribution" | Ch8 6:05, shown on the rocket | App Store Connect's own status names | owner | needs the owner (exact spelling and the order they happened). Drawn, not recorded (CONTRACT 13.5). |
| A12 | "We launched in the United States" | Ch8 6:15, spoken; map | App Store Connect: availability on release (storefronts) | owner | needs the owner (confirm US only at 1.0 launch) |
| A13 | "where Veyago does business" | Ch8 6:15, spoken | Owner (company's market) | owner | needs the owner |
| A14 | "with its states' forms and Medicare built in" | Ch8 6:15, spoken | App: `Provisum/Resources/StatePaperwork.json`, Medicare content in the app | app | needs the owner (confirm the 1.0 launch build had both; the 2.0 tree has the state data file) |
| A15 | Sticky note "Listed as paid. Should be free." | Ch8 6:27, shown | Owner's account of day one; App Store Connect price history | owner | needs the owner |
| A16 | Sticky note "Fixed. Version 1.1. Next day." and spoken "On day one we got the price wrong. On day two we fixed it." | Ch8 6:27, shown and spoken | App Store Connect price change date; version history. The repo's `Release-1.1.md` describes 1.1 as backgrounds and sharing reliability, not a price change. | owner | cannot be verified: reword. A price fix is a price change in App Store Connect, not a version. Suggest "Fixed. The next day." with no version number, unless the owner confirms 1.1 was the fix. |
| A17 | "Version 1.1" as a name for the build | Ch8 6:27 (A16) | `project.yml` of the app on main: 1.1 | app | verified that 1.1 exists; not verified as the price fix (see A16) |
| A18 | The app is "Free on the App Store" | Ch11 9:50, shown | App Store Connect: price Free with in-app purchase `app.veyago.Provisum.full` | owner | needs the owner. True at 1.0 and 1.1 per the product model (Free / Full); confirm 2.0 is live when the film is published. |
| A19 | "Provisum 2" is released | Ch1 0:18, Ch10 9:20, Ch11 9:50 | App Store Connect: 2.0 state. At 2026-10-16 it was rejected by App Review for guideline 3.1.2 (Terms of Use link) and not live. | owner | needs the owner. Publish the film only when 2.0 is approved and live, or change the end card. |

## B. The product (the app)

| # | Claim | Where | Source of truth | Who | Status |
|---|---|---|---|---|---|
| B1 | "Provisum. Latin for provided for." | Ch6 4:00, Ch11 9:42; shown "Latin. "Provided for."" | Project identity (`CLAUDE.md` of the app: "Latin: provided for") | owner | verified against the project's own definition. Optional: a Latin teacher's check of the grammar (provisum, from providere). |
| B2 | Five gates (the filter): useful for years; not something the iPhone already does; private (no account, no tracking); buildable in six to eight weeks; free to start, paid to unlock | Ch4 2:02, shown and spoken | Owner's product rules (founding notes) | owner | needs the owner (the five wordings, and that "six to eight weeks" matches what the owner used). Spoken form is shorter ("Buildable in weeks, not years"): keep both consistent. |
| B3 | "Free to start, paid to unlock" | Ch4, shown | App: `Entitlements` (Free tier limits; Full is a one-time purchase) | app | verified (tier rules exist). Do not show a price. |
| B4 | "One idea made it through all five." | Ch4 2:30, spoken | Owner (story device) | owner | needs the owner (confirm the story beat is the owner's real process, not staged) |
| B5 | Six building blocks: Documents, Dates, Bills, People, Emergency card, Packets | Ch5 3:35, shown and spoken | App: features `Documents`, `Deadlines` (the app calls them due dates / deadlines), `Bills`, `People`, `EmergencyCard`, `Packets` all exist in `Provisum/Features` | app | verified that all six exist. Check the label "Dates" against the tab name used in the app (the app tab is Deadlines); use the app's word if they differ. |
| B6 | "Everything the app does is one of them, or a mix of them." | Ch5 3:35, spoken | Not literally true: the app has Visits, Call notes, Family, Search and more | owner | cannot be verified: reword to "Six building blocks. Most of the app is one of them, or a mix." |
| B7 | Nine wallpapers; "Every person gets their own colour." | Ch6 4:15, shown | App: `DesignSystem/Wallpaper.swift` has nine cases (plain, mist, lavender, seaGlass, apricot, blush, sage, linen, dusk) | app | verified (9) |
| B8 | "One accent. Nothing shouts." (colour tokens, light and dark) | Ch6 4:15, shown | App: `VYColor`, one accent; light and dark appearances | app | verified |
| B9 | "Dozens of versions. One home screen." (version history scrubs) | Ch6 4:15, shown | Owner's design history; the design tool's history count. Also CONTRACT 13.4: the design file is imagined, no recording. | owner | cannot be verified: reword. Unless the owner counts the versions, say "Many versions. One home screen." and draw the flicker; no recording. |
| B10 | "Every screen was checked at the biggest text sizes. When something broke, we redesigned the screen, not the text." | Ch6 4:45, spoken | App: Dynamic Type everywhere (`VYFont`); UI tests / screenshots at accessibility sizes | owner | needs the owner (is there a run that backs "every screen"? if not, "the key screens") |
| B11 | "Tested at every text size" | Ch10 8:58, spoken | same as B10; and the text-size range tested (up to AX5?) | owner | needs the owner. Wording differs from B10 ("biggest" vs "every"): pick one. |
| B12 | "Readable on the worst night of your life." (emergency view at the largest text size) | Ch6 4:15, shown | Editorial; the emergency card supports large text | owner | needs the owner (tone check; no medical claim intended) |
| B13 | "Native Swift, for iPhone, Apple Watch and widgets." | Ch7 4:50, spoken | App: Swift source; targets in `project.yml` (`ProvisumWidgetsExtension`, a watch app, `WatchShared`) | app | verified (targets exist) |
| B14 | Xcode project navigator folders: Binder, Documents, Deadlines, Packets, EmergencyCard, Family, Visits | Ch7 4:56, shown | App: `Provisum/Features/{Binder,Documents,Deadlines,Packets,EmergencyCard,Family,Visits}` all exist | app | verified (folder names). The real Xcode recording must match this list and hide anything else (CAPTURES C-07). |
| B15 | "Everything belongs to a binder, and a binder belongs to a person: your dad, your daughter, yourself, your partner, a friend, even the dog." | Ch7 5:06, spoken | App: `Models/PersonType.swift` (parent, child, myself, partner, pet, other) | app | verified (a friend is `other`) |
| B16 | "6 kinds of people" on the number roll | Ch10 8:52, shown | App: `PersonType` has six cases | app | verified (6) |
| B17 | "Passports get nine, six and three months." | Ch7 5:18; Ch9 7:08 ticks "9, 6, 3 months" | App: `ReminderPlanning.personalIDPlan = [270, 180, 90]` days | app | verified (270, 180, 90 days; say "about nine, six and three months" if exact calendar months matter) |
| B18 | "A bill gets the day before." | Ch7 5:18, spoken | App: `ReminderPlanning` for `.billDue` returns [3, 0] days (autopay [2]): three days before and on the day | app | cannot be verified: reword. Suggest "A bill gets a nudge three days before, and on the day." |
| B19 | "Every date from every source joins one list" (train of passport expiry, bill, appointment) | Ch7 5:18, shown and spoken | App: `DueEntry`/`DueQuery` merge documents' expiries, bills and deadlines in one place (`CLAUDE.md`) | app | verified |
| B20 | "There is no Veyago server." / "0 servers" / "No server. No account." | Ch7 5:32; Ch10 8:52; Ch1 | App: no account, no Veyago sync server. BUT the privacy notes name a Supabase processor and a Wallet signing service (2.0 release notes), so a Veyago-operated server may exist for passes. | owner | cannot be verified: reword unless the owner confirms. Safer: "No account. Nothing collected." and drop the digit "0 servers" until the Wallet signing path is settled. |
| B21 | "Your data lives on your phone and in your own iCloud." | Ch7 5:32, spoken | App: SwiftData + the user's own iCloud (`iCloud.app.veyago.Provisum`) | app | verified |
| B22 | "Sharing goes straight to the people you invite." | Ch7 5:32, spoken | App: CloudKit sharing via `ShareLink` (`Provisum/Sharing`). Needs the Family schema deployed to Production (not done on 2026-10-16). | owner | needs the owner (true only once the Family CloudKit schema is in Production) |
| B23 | "Data Not Collected" (the App Privacy label) | Ch7 5:32, shown | App Store Connect App Privacy answers for Provisum; check against the Wallet signing service | owner | needs the owner (open item as of 2026-10-16) |
| B24 | "The emergency card is encrypted on your iPhone before it goes anywhere." | Ch7 5:46, spoken | App: `EmergencyCard` is a local-only store and never synced; family sharing of the card uses encrypted fields (`FamilyCard`, see `Support/AppStore/CloudKitSetup.md`) | owner | needs the owner (the claim must match the shipped build; the encrypted-field check is open) |
| B25 | "Share the card. Encrypted first." | Ch9 7:08, shown | same as B24 | owner | needs the owner |
| B26 | Passing-test count on a number roll, "Build succeeded" | Ch7 5:52, shown | `xcodebuild test` result on the build the film shows | app | needs the owner (the number must come from a fresh run on the day, read from Xcode's report; do not estimate) |
| B27 | "We carried the engine over from our first app, and rebuilt everything around it." | Ch7 5:52, spoken | Owner's account (A4); CONTRACT 13.6 wording | owner | needs the owner |
| B28 | Emergency card on Apple Watch and in Apple Wallet | Ch9 7:08; Ch10 8:46 | App: `Features/AppleWatch`, `Features/Wallet`; footage `watch-card`, `wallet-pass` | app | verified (features exist). Wallet needs the signing service (see B20). |
| B29 | "Medication list, with refill reminders." | Ch9 7:08, shown | App: medication list on the emergency card with refill reminders (CONTRACT 1: reminders only, no adherence tracking) | app | verified (footage `med-refill`) |
| B30 | "Who paid what." (shared costs) | Ch9 7:08, shown | App: `Features/Costs`; footage `shared-costs`; new in 2.0 | app | verified (2.0 build) |
| B31 | "Is this letter a scam?" | Ch9 7:08, shown | App: `Features/ScamCheck`; footage `scam-check` | app | verified. Wording must stay a check, never a verdict (no advice). |
| B32 | "Record the visit. Keep it on the phone." | Ch9 7:08, shown | App: `Features/Visits`; footage `visit-summary` (transcript private, on device) | app | needs the owner (confirm transcription is on the device in the shipped build) |
| B33 | "Pets get a binder too." | Ch9 7:08, shown | App: `PersonType.pet` | app | verified |
| B34 | "Look after a friend's papers while they're away." | Ch9 7:08, shown | App: person type "other"; sharing. Product promise tied to the final line. | owner | needs the owner (Open decisions in the script: onboarding and store listing must say the same) |
| B35 | "Five countries" | Ch9 7:45 shown; Ch10 8:52 number roll | Not found in the source: the map shows four (Belgium, the Netherlands, Germany, France), plus the United States = five? App: country-aware content (`CountryDeadlineTemplate`, `CountryOutlines`) | app | needs the owner (list the countries the shipped app supports; the digit on screen must equal the drawn countries) |
| B36 | Belgium, the Netherlands, Germany, France light up; "112" and "A4" in the margin | Ch9 7:45, shown | App: country templates; footage `belgium-112`. "A4" (what it refers to) is not defined in the script. | owner | needs the owner (define "A4" or cut it; 112 verified by `belgium-112` footage) |
| B37 | "Five languages": Hello, Hola, Hallo, Bonjour, Hoi | Ch9 7:45, shown; Ch10 8:52 | App: `Localizable.xcstrings` has en, nl, fr, es, de | app | verified (5 languages: English, Spanish, German, French, Dutch). "Hoi" is Dutch, "Hallo" German: label correctly if labelled. |
| B38 | "No more forms. Provisum asks one question at a time." | Ch9 7:58, spoken | App: conversation onboarding; footage `onboarding-question` | app | verified |
| B39 | Binder row: Dad, Leo, Mia, Maya, Sam, each with a wallpaper colour | Ch10 8:35, shown | Fictional names; the app's sample data names (Mom, Dad, Me, Lily, Biscuit) | owner | needs the owner (fictional family only; the names Leo, Mia, Jonas, Maya, Sam are the film's own) |
| B40 | "Maya invited you to "Sam"." (invitation text on a far phone) | Ch10 9:10, shown | App: invitation wording of `BinderInvitation` | app | needs the owner (the exact text must be drawn, or shot via `OB_DEMO_ARRIVING`; not a live invite) |
| B41 | "Share a binder with anyone you trust." | Ch10 9:10, shown | Editorial | owner | needs the owner |

## C. The story and the family (fiction)

| # | Claim | Where | Source of truth | Who | Status |
|---|---|---|---|---|---|
| C1 | Maya, Dad, Leo, Mia, Jonas (partner), Biscuit (dog), Sam in Lisbon "for a year" | Ch2 0:34 to 0:58; Ch9 | Fictional; CONTRACT rule "fictional family only" | owner | verified as fiction. Label as fictional in the end credits ("Maya and her family are fictional"). |
| C2 | "Sam's car registration", "my dad's insurance", "the kids' passports" | Ch2 0:41, spoken | Fictional | owner | verified as fiction |
| C3 | "Every family has someone who holds it together." / "...bigger than its tree." | Ch2, shown | Editorial | owner | needs the owner |
| C4 | The film's voices MAKER and MAYA may be synthetic | Credits | Script, Open decisions | owner | needs the owner (if synthetic, say so in the credits) |

## D. Research and the outside world

| # | Claim | Where | Source of truth | Who | Status |
|---|---|---|---|---|---|
| D1 | App Store search results shown ("Does it already exist?") | Ch5 2:54, shown | A real App Store search the owner or a local agent runs on the day; names of other apps | owner | needs the owner. Competitor app names and icons: blur or drawn as blank pins; no logo. |
| D2 | A terminal listing of App Store search suggestions ("What do people really type?") | Ch5 2:54, shown | A real command run on the Mac, output captured | owner / local agent | needs the owner (what the suggestion list actually returned; no invented queries) |
| D3 | One-star reviews of other apps ("What do the others get wrong?") | Ch5 2:54, shown | Real reviews, names blurred; quoted text from reviews is third-party writing | owner | needs the owner (draw paraphrased or short; do not quote long reviews; no reviewer names) |
| D4 | "States, Medicare, the FTC" publish the real rules | Ch5 3:20, spoken; shown forms | Official pages: a state form, a Medicare page, an FTC page | official | needs the owner (pick the exact three public pages; record the URLs and the access date) |
| D5 | "We searched the store like a tired person at eleven at night." | Ch5, spoken | Editorial | owner | verified as a figure of speech |
| D6 | The 2x2 chart: X "Organises the family", Y "Handles the hard stuff", top right empty; "The gap: all of it, for everyone, privately." | Ch5 3:20, shown | Owner's own competitive reading; competitors shown only as blank pins | owner | needs the owner (the claim that nothing sits top-right is a market claim: say "we found no one" or keep it as the film's thesis, not a fact) |
| D7 | "the one he trusts" / Apple's guideline text paraphrases | Ch2, Ch3 | Fiction / A2 | owner | see A2 |

## E. Counts and numbers on screen (roll-ups)

| # | Number | Where | Source | Who | Status |
|---|---|---|---|---|---|
| E1 | 4.3(a) | Ch3 1:15 | A2 | owner | needs the owner |
| E2 | 21 September 2026 | Ch3 1:43 | A7 | owner | needs the owner |
| E3 | 28 September 2026 | Ch8 6:05 | A8 | owner | needs the owner |  **REMOVED by the owner 2026-10-17: the film no longer states the launch date or that it took seven days.**
| E4 | "Seven days" | Ch8 6:05 | A9 | owner | needs the owner |  **REMOVED by the owner 2026-10-17: the film no longer states the launch date or that it took seven days.**
| E5 | five gates | Ch4 | B2 | owner | needs the owner |
| E6 | six building blocks | Ch5 | B5 | app | verified |
| E7 | nine wallpapers | Ch6 | B7 | app | verified |
| E8 | nine, six, three months | Ch7, Ch9 | B17 | app | verified |
| E9 | passing tests | Ch7 5:52 | B26 | app | needs the owner (fresh run) |
| E10 | 6 kinds of people | Ch10 8:52 | B16 | app | verified |
| E11 | 5 countries | Ch9, Ch10 | B35 | app | needs the owner |
| E12 | 5 languages | Ch9, Ch10 | B37 | app | verified |
| E13 | 0 servers | Ch10 8:52 | B20 | owner | cannot be verified: reword |
| E14 | "dozens of versions" | Ch6 | B9 | owner | cannot be verified: reword |
| E15 | "Six to eight weeks" | Ch4 | B2 | owner | needs the owner |
| E16 | Eight Simulator moments (invite, who joined, shared costs, passport, scam, visit, 112, onboarding) | Ch10 8:58 | CAPTURES.md rows C-30 to C-37 | local agent | needs the owner (the invite and who-joined moments depend on the Family schema; use the demo hooks) |
| E17 | Chapter times in the script (0:00, 0:30, 1:15, 1:55, 2:50, 3:55, 4:50, 6:05, 6:55, 8:10, 9:30, 10:00) | Whole film | `src/film4.ts` slots | repo | verified (the film4 slots equal the chapter map) |

## F. Wording and rule checks

| # | Item | Source | Status |
|---|---|---|---|
| F1 | The first app is never named; "held on to", "carried over" are used instead | CONTRACT 13.6; `tools/checkRules.sh` | verified for the script, voicelines and this sheet (the check passes) |
| F2 | Avoid words in on-screen copy: receipt, warranty, claim, proof, archive, timeline, scanner, life admin | CONTRACT 1 | The script's supers contain none (the heading "Chapter map" text uses none). Re-check supers when written. |
| F3 | Apple's name appears as "Apple was right" (Ch3), "Apple Watch", "Apple Wallet", "App Review" | CONTRACT 1 and 12 | needs the owner for the first (A3); the rest verified |
| F4 | "Provisum is Latin..." spoken twice (Ch6 and Ch11) | Script | verified as intentional repetition (the end line) |
| F5 | The 4:08 line "a real recording of the design file" | Script vs CONTRACT 13.4 | cannot be verified: the contract wins. Draw the canvas of real app screens; do not record the design tool. |

## Open list for the owner (short)

1. A1 to A3, A7 to A11: the dates, the rejection count and words, the status order (App Store Connect history).
2. A16 and A9: the price-fix version number and which event is day zero for "seven days".
3. B18, B20, B6, B9: four lines to reword (bill reminder days, "0 servers", "everything is one of them", "dozens of versions").
4. B23, B24, B22: the Data Not Collected label, the encrypted card claim and Family CloudKit in Production, which must match the build that ships.
5. B35, B36: which countries count as five, and what "A4" means.
6. A19: whether 2.0 is live before the film is published.
