# Claims the director introduced (S0-A), to merge into `docs/v4/CLAIMS.md` (S0-B owns that file)

Same columns as the claims table. "Film choice" rows are depictions, not facts; they are listed so nobody mistakes them for claims.

| Claim | Where (chapter / local) | Source of truth | Who supplies | Status |
|---|---|---|---|---|
| The app has nine wallpapers: plain, mist (Morning mist), lavender, seaGlass (Sea glass), apricot, blush, sage, linen, dusk | 6 / 28.0-33.0 (the nine swatches); 9 (house colours) | `Provisum/DesignSystem/Wallpaper.swift` (`enum Wallpaper`, 9 cases) in the 1.2 worktree | the repo | verified (2026-10-16) |
| Wallpaper light stops used as house washes: mist #B4DCFE, seaGlass #9DE5D6, blush #FECAD2, lavender #DBD2FD, sage #B9E2B4, apricot #FFD1B5, dusk #FED0C1 (each the light "leading" stop) | 9 / whole chapter; 10 / 25.0 | `Wallpaper.swift`, `stops(for:)` light values | the repo | verified |
| Binder colour → wallpaper: blue→mist, violet→lavender, teal→seaGlass, orange→apricot, pink→blush, green→sage | 10 / 25.0 (the five binder phones wear matching wallpapers) | `Wallpaper.swift`, `matching(_:)` | the repo | verified |
| House ↔ binder ↔ wallpaper assignment (Dad mist, Leo seaGlass, Mia blush, Maya lavender, Jonas sage, Biscuit apricot, Sam dusk) | 9, 10 | — | director | film choice, not a claim |
| The first onboarding question reads "Who are you looking after?" with chips | 9 / 68.5 (drawn, chips "Dad" / "Leo"); 10 / 58.5 (`onboarding-question`) | `public/footage/onboarding-question.mp4` (v1, captured from the app) | the app | verified in v1 footage; re-check against the 2.0 build on release day |
| The chips "Dad" and "Leo" on the drawn bubble | 9 / 68.5 | fictional family | director | film choice |
| Xcode navigator groups: Binder, Documents, Deadlines, Packets, EmergencyCard, Family, Visits | 7 / 9.5-18.5 (paper tabs) | the owner's `xcode-navigator` recording; the repo has `Provisum/Models`, `Features/Family`, `Features/Visits`, `Features/CallNotes` … the real group names differ from the script's list | the owner | needs the owner: the tabs copy the recording's real group names |
| The number of passing tests (the number roll) | 7 / 64.0-69.0 | a full `ProvisumTests` run on release day | the owner | needs the owner |
| "Build succeeded" | 7 / 69.0 | the owner's `xcode-tests` recording | the owner | needs the owner (recorded, not drawn) |
| The invitation card text "Maya invited you to "Sam"." | 10 / 64.0 (drawn in glass type) | the app's share invitation wording (CloudKit share invitations carry Apple's wording; the in-app join screen has the app's) | the owner / the app | needs the owner: use the app's own wording or reword the card |
| App Store Connect status labels "Waiting for Review", "In Review", "Ready for Distribution" | 8 / 3.0, 5.0, 7.0 (drawn plaque) | App Store Connect (the owner's screenshots of the 1.0 submission) | the owner | needs the owner's screenshot for the exact labels and order |
| "6 kinds of people" = parent, child, yourself, partner, friend, pet; the village shows seven binders (two children) | 7 / 18.0 (M9); 9; 10 / 42.0 | the script (M9) | — | consistency note: 7 binders, 6 kinds; the number roll says kinds |
| The design file is shown as 24 real app screens on a dark canvas (`screens-grid`) | 6 / 16.0 | capture request, not a claim; every screen must be a genuine 2.0 screen | local capture agent | capture: 24 distinct screens, dark appearance |
| The emergency view at the largest accessibility text size | 6 / 40.0 | capture `emergency-largest-text` (the app supports the largest sizes: the script's "Every screen was checked at the biggest text sizes" is S0-B's row) | local capture agent | capture |
| The passport reminders at 9, 6 and 3 months; a bill the day before | 7 / 36.5-38.5; 9 / visit 1 | `ReminderDefaults` in the app (`Provisum/Domain`) | the repo | S0-B's row; the director adds the "day before" tick as shown |
| "Rejected" written on both letters; the circles | 3 / 2.0-4.5 | the two App Review rejections (S0-B's row for 4.3(a)) | the owner | wording is the film's ("Rejected"), not a quotation |
| "Veyago server", erased; "Your own iCloud"; "Your brother"; "Sam" | 7 / 44.0-54.5 | the app's architecture (no Veyago server; CloudKit private + shared databases) | the repo (`CLAUDE.md`: "no Veyago server") | verified by the repo's own contract; the labels are the film's words |
