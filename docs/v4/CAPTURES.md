# Captures list, "Provided For" v4 (10:00)

Every screen recording or still the script needs, one row each. Source: `docs/SCRIPT-10MIN-v4.md` (times are the script's master times). Rules: CONTRACT section 13.4 and 13.5 (the design file is imagined, never recorded; App Store Connect statuses, review messages, store search results and one-star reviews are DRAWN with the exact words unless the owner supplies a clean recording; Xcode and the Simulator may appear inside drawn frames with the Apple logo and menu bar hidden and account names, team IDs, emails and the first app's name blurred). Claims behind each row are in `docs/v4/CLAIMS.md`.

**Exists** means present in `public/footage/manifest.json` (checked 2026-10-16: 22 entries). **Who:** local agent = a Mac session driving the Simulator or terminal (one build or simulator job at a time, own simulator only, pass the UDID); owner = Cassian (accounts, App Store Connect, Xcode on his screen, official pages if a login or a clean recording is wanted); drawn = made in Remotion, no capture.

**Family:** the existing footage uses the 2.0 sample binder ("Mom", Lily, Biscuit). The story family is Dad, Leo, Mia, Maya, Jonas, Biscuit, Sam. Where a row says "new family", the sample data or hand-made binders must use those names (PLAN local track L3). Never type real personal data into the Simulator.

## Chapter 3, the no (1:15 to 1:55)

| ID | What is shown | Source | Exists | Who | Privacy notes |
|---|---|---|---|---|---|
| C-16 | Two rejection letters, "Rejected" circled on each, "4.3(a) Design - Spam" | Drawn instead (exact words from the owner's review messages) | no | drawn; owner supplies the exact message text | Never the first app's name, its icon or the account holder's name. Claims A1, A2. |
| C-17 | Engine cutaway, scissors, "keep" and the faded old name | Drawn instead | no | drawn | Old name blurred beyond reading. Claims A5, A6. |
| C-18 | Calendar page with 21 circled, "21 September 2026" | Drawn instead | no | drawn; owner confirms the date | Claim A7. |

## Chapter 4, the filter machine (1:55 to 2:50)

| ID | What is shown | Source | Exists | Who | Privacy notes |
|---|---|---|---|---|---|
| C-19 | Idea cards with blurred titles; five gate labels | Drawn instead | no | drawn | Blurred titles must not spell any real app or the first app. Claims B2, B4. |

## Chapter 5, the research board (2:50 to 3:55)

| ID | What is shown | Source | Exists | Who | Privacy notes |
|---|---|---|---|---|---|
| C-01 | Scrolling App Store search results for the product idea ("Does it already exist?") | App Store search, recorded on the Mac or iPhone by the owner; otherwise drawn from the real results with the exact titles | no | owner (clean recording), else drawn | Other apps' names and icons are third-party: blur or draw as blank pins; never the first app. Claim D1. |
| C-02 | A terminal listing App Store search suggestions ("What do people really type?") | Terminal on the Mac | no | local agent (run the real command, capture the real output) | Show only the query list. No keys, tokens, paths with the owner's name, or prompts with the machine name. Claim D2. |
| C-03 | One-star reviews of other apps scrolling | Drawn from real reviews (paraphrased or very short) | no | drawn; owner picks the reviews | Blur reviewer names; do not quote long passages. Claim D3. |
| C-04 | A state form (an official public form) | Official site: a state agency's public page or PDF | no | local agent (screen capture) or owner | Public document only. Record the URL and access date in CLAIMS D4. |
| C-05 | A Medicare page | Official site: medicare.gov public page | no | local agent | Public page only; no logged-in view. Claim D4. |
| C-06 | An FTC page | Official site: ftc.gov public page | no | local agent | Public page only. Claim D4. |
| C-05b | The 2x2 chart and the six paper boxes | Drawn instead | no | drawn | Competitor dots are blank pins. Claim D6, B5. |

## Chapter 6, the name and the look (3:55 to 4:50)

The design file is imagined (CONTRACT 13.4): nothing in this chapter is a recording of a design tool.

| ID | What is shown | Source | Exists | Who | Privacy notes |
|---|---|---|---|---|---|
| C-10 | "The screens, all at once": a drawn canvas of real app screens, like a city at night | Drawn from the app's own stills and clip posters (`binder-home*.png`, other `*.png` in `public/footage`) | partly (posters and stills exist) | drawn; local agent may add 8 to 12 new stills from the Simulator in the new family | Sample data only. Claim B8. |
| C-11 | The nine wallpapers sliding past, then spread out as swatches | Simulator, `OB_WALLPAPER=<raw value>` for each of plain, mist, lavender, seaGlass, apricot, blush, sage, linen, dusk (nine stills), or drawn swatches from the app's colours | no (footage has `family-tabs` with a few) | local agent | Claim B7. |
| C-12 | A form screen crossed out, then a conversation screen | The conversation side: footage `onboarding-question` (exists). The form side: drawn. | partly | drawn; footage reused | Claim B38. |
| C-13 | The emergency view at the largest text size | Simulator with the largest accessibility text size; screen `emergency-card-full` layout | no (`emergency-card-full` exists at default size) | local agent (largest text size) | Sample data only; no real medical content. Claims B10, B12. |
| C-14 | Version history scrubbing, "Dozens of versions. One home screen." | Drawn instead (flicker of home screen stills) | no | drawn | CONTRACT 13.4: no design-tool recording. Claim B9 (reword the count). |
| C-14b | Crossed-out names, "On Behalf" gets the last line; PROVISUM written in pencil | Drawn instead | no | drawn; owner supplies the other names | None of them may be the first app's name. Claim A10. |

## Chapter 7, the engine room (4:50 to 6:05)

| ID | What is shown | Source | Exists | Who | Privacy notes |
|---|---|---|---|---|---|
| C-07 | Xcode project navigator unfolding: Binder, Documents, Deadlines, Packets, EmergencyCard, Family, Visits | Xcode, genuine recording on the Mac, inside a drawn laptop | no | owner (Xcode on his screen) or local agent; the folder list must match `Provisum/Features` | Hide the Apple logo and menu bar; blur the team ID, account name, email and the project's other target names; do not show the first app. Claim B14. |
| C-08 | Xcode tests running: a column of green ticks and the passing-test count | Xcode, genuine recording of `xcodebuild test` / the test navigator | no | local agent runs the tests (one build at a time); recording by owner or local agent | Same hiding as C-07. The count must come from the run, not be typed in. Claim B26. |
| C-09 | "Build succeeded", then the Simulator boots in a drawn phone | Xcode and Simulator, genuine recording | no | local agent (own simulator, pass the UDID) | Hide device names that include the owner's name. Claim B26. |
| C-09b | Phone cutaway floors, data model strings, train, vault, cloud, padlock, safe | Drawn instead | no | drawn | The drawn "Veyago server" box is erased; claim B20 wording. |

## Chapter 8, the launch (6:05 to 6:55)

| ID | What is shown | Source | Exists | Who | Privacy notes |
|---|---|---|---|---|---|
| C-15 | App Store Connect status labels changing: Waiting for Review, In Review, Ready for Distribution | Drawn instead, exact words (unless the owner supplies a clean recording) | no | drawn; owner confirms the order | Never show the account, team ID, emails or the first app. Claims A11, A8. |
| C-15b | Rocket, world map with the United States filled | Drawn instead | no | drawn | Claim A12. |
| C-17b | Sticky notes: "Listed as paid. Should be free." / the fix note | Drawn instead | no | drawn; owner confirms the wording | Claims A15, A16 (reword the version). |
| C-17c | Maya's house with the Dad tab glowing in the window | Drawn from `binder-home` still or `family-tabs` | partly (`family-tabs`, `binder-home-dark`) | drawn | Sample data. |

## Chapter 9, the village (6:55 to 8:10)

Each house opens for about three seconds to show one feature, drawn with a margin note. The drawn houses may carry a small real screen; rows list the best existing footage.

| ID | What is shown | Source | Exists | Who | Privacy notes |
|---|---|---|---|---|---|
| C-20 | Leo and Mia: two passports, ticks at 9, 6, 3 months | Footage `passport-reminder` (hot 5.6 to 7.6 s) | yes | drawn house, footage reused | Sample data only. Claim B17. |
| C-21 | Dad: Watch on a bedside table, Wallet pass beside it | Footage `watch-card`, `watch-card-arrives`, `wallet-pass`; Apple's own "Add to Apple Wallet" button must not be the subject (CONTRACT 12.1) | yes | footage reused | Watch clock covered with a 9:41 patch (CONTRACT 12.2). |
| C-22 | Dad: pill bottle and small bell | Footage `med-refill` | yes | footage reused | No dose tracking shown (CONTRACT 1). Claim B29. |
| C-23 | Maya: three phones around one card, padlock | Footage `family-share-card` | yes | footage reused | Claims B24, B25 (encryption wording). |
| C-24 | Jonas: coins splitting between three figures | Footage `shared-costs` | yes | footage reused | Claim B30. |
| C-25 | Maya: an envelope, a circled question mark | Footage `scam-check` | yes | footage reused | Do not hero real business names in the sample letter. Claim B31. |
| C-26 | Dad: a sound wave over a doctor's desk | Footage `visit-summary` | yes | footage reused | Claim B32. |
| C-27 | Biscuit's kennel: a vet card in a tiny folder | Drawn instead; optional new capture of a pet binder (`PersonType.pet`) | no (`family-tabs` shows Biscuit in the switcher) | drawn; optional local agent | Claim B33. |
| C-28 | Sam, Lisbon: a key, a car registration, a lease | Drawn instead | no | drawn | Fictional. Claim B34. |
| C-29 | Europe map: Belgium, the Netherlands, Germany, France; 112 and A4; speech bubbles in five languages | Drawn instead; footage `belgium-112` for the 112 moment | partly | drawn | Claims B35 to B37. |

## Chapter 10, paper to glass (8:10 to 9:30)

| ID | What is shown | Source | Exists | Who | Privacy notes |
|---|---|---|---|---|---|
| C-40 | The village becomes a phone outline; the phone rotates in the void; screens snap in on the beat | WebGL devices (`src/devices`, `src/glass`) with the clips below as textures | clips yes, scene no | local (WebGL is local) | Genuine app UI is exempt from the typeface rule (CONTRACT 12.1). |
| C-41 | A row of phones, one per binder, each in its wallpaper colour: Dad, Leo, Mia, Maya, Sam | Simulator, new family (or the existing `family-tabs` as a stand-in) | partly | local agent, new family | Sample data only. Claim B39. |
| C-42 | The emergency card flips onto a Watch; a Wallet pass slides out | Footage `watch-card-arrives`, `wallet-pass`, `phone-show-on-watch` | yes | footage reused | Avoid the frames with Apple's own Wallet button (CONTRACT 12.1). |
| C-30 | Inviting a friend to a binder | Simulator with the demo hooks (`OB_DEMO_JOINING=joining|arriving|failed`, `OB_DEMO_ARRIVING`), never a live flow | no | local agent | No real Apple IDs or emails; the Family CloudKit schema is not in Production (CLAIMS B22). Claim E16. |
| C-31 | The family view showing who joined | Simulator with `OB_DEMO_MEMBERS=1\|pending` | no | local agent | Same. |
| C-32 | Shared costs | Footage `shared-costs` | yes | footage reused | Claim B30. |
| C-33 | A passport reminder | Footage `passport-reminder` | yes | footage reused | Claim B17. |
| C-34 | The scam note | Footage `scam-check` | yes | footage reused | Claim B31. |
| C-35 | A visit summary | Footage `visit-summary` | yes | footage reused | Claim B32. |
| C-36 | A Belgian binder calling 112 | Footage `belgium-112` | yes | footage reused | Do not use the `ask-about-mom` clip (real phone number, CONTRACT 12.1). |
| C-37 | The first onboarding question | Footage `onboarding-question` (also `onboarding-welcome`, `onboarding-country-chips`) | yes | footage reused | Claim B38. |
| C-43 | Number rolls on black: 6 kinds of people, 5 countries, 5 languages, 0 servers | Drawn instead | no | drawn | Claims B16, B35, B37, B20 (reword "0 servers"). |
| C-44 | Maya taps Invite, a paper plane flies to a far phone: "Maya invited you to "Sam"." | Drawn plane and hairline phone; the invitation text from `OB_DEMO_ARRIVING` or drawn | no | drawn; optional local agent | Not a live invite. Claim B40. |

## Chapter 11, provided for (9:30 to 10:00)

| ID | What is shown | Source | Exists | Who | Privacy notes |
|---|---|---|---|---|---|
| C-50 | The whole endless sheet pulled back, joined by one line | Drawn instead (pre-rendered chapter page images) | no | drawn | Every chapter art must pass the rules check. |
| C-51 | End card: "Provisum 2", "Free on the App Store", the Veyago mark, "Made by Veyago. Private by design." | Drawn instead; the mark from `public/brand` | partly (brand assets) | drawn | Claims A18, A19, B23 (private by design). |
| C-52 | Pencil click | Foley (local), not a capture | no | local | None. |

## Existing footage not used by v4 (so far)

`binder-home-dark`, `binder-home-light` (best candidates for C-10 and C-17c), `wallet-card-front`, `wallet-card-back`, `wallet-pass-fields`, `emergency-card-full`, `ask-about-mom` (do not use: real phone number). These can serve C-10 as stills.

## Counts

- Rows needing a new recording by the local agent: C-02, C-04, C-05, C-06, C-07 (or owner), C-08, C-09, C-11, C-13, C-30, C-31, C-41.
- Rows needing the owner: C-01 (clean recording, optional), C-07 (optional), words for C-16, C-15, C-17b, C-14b.
- Rows reusing existing footage: C-12 (conversation side), C-20 to C-26, C-32 to C-37, C-42.
- Rows that are drawn only: C-05b, C-09b, C-14, C-14b, C-15, C-15b, C-16 to C-19, C-27 to C-29, C-43, C-44, C-50, C-51.
