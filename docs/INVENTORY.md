# INVENTORY — facts for the film crew

Owner: inventory and mechanical checks. Sources are read from the 1.2 worktree
(`/Users/cassiandrefke/Developer/Apps/.pv-worktrees/v12`) unless marked 1.1 (`.pv-worktrees/v11`).
Nothing here was built or run in the Simulator; every fact is from source.

## 1. Accent colour

Source: `Provisum/DesignSystem/AccentTheme.swift` and `VYColor.swift` (v12).

| Token | Light | Dark | Source |
|---|---|---|---|
| Default accent (`AccentTheme.blue`, the default) | `#2F5BEA` | `#6E8BFF` | `AccentTheme.swift` lines 11, 36 (`.blue: (0x2F5BEA, 0x6E8BFF)`) |
| `VYColor.accent` | follows the active accent theme | | `VYColor.swift` line 61 |
| `VYColor.Fixed.accent` (splash and onboarding cover) | `#2F5BEA` | n/a | `VYColor.swift` line 114 |
| Canvas (`AppBackground` asset) | `#F3F5F9` | `#0B0D12` | `Resources/Assets.xcassets/AppBackground.colorset/Contents.json` |
| `VYColor.canvas` (`Color("AppBackground")`) | `#F3F5F9` | `#0B0D12` | `VYColor.swift` line 34 |
| `VYColor.Fixed.canvas` | `#F3F5F9` | n/a | `VYColor.swift` line 113 |
| Surface (cards) | `#FFFFFF` | `#171A21` | `VYColor.swift` line 40 |
| Text primary | `#111827` | `#F3F5F9` | `VYColor.swift` line 46 |
| Text secondary | `#4F596B` | `#A6AFBF` | `VYColor.swift` line 49 |
| Accent on solid fill (`onAccent`) | `#FFFFFF` | `#0B1020` | `VYColor.swift` line 68 |

**Verdict: `COLORS.accent = '#2F5BEA'` in `src/film.ts` matches the shipped default accent in light mode.**
Dark mode's default accent is `#6E8BFF`.

Recommendation:
- On paper (Acts 1-2, the end card on the desk): `#2F5BEA`, the value already in `film.ts`. Keep it.
- On black (Acts 3-4, the glass world): `#6E8BFF`. It is the shipped dark-mode accent and reads on black; `#2F5BEA` is dim on pure black. Only use it if the glass world needs an accent at all (the contract's glass palette is white hairlines, so `COLORS.glassWhite` may be enough).
- Not changed in `film.ts` (director's file). The comment there already says it was confirmed against VYColor.

The app's other accent themes (violet, coral, green, graphite) are user choices, not brand. The film uses blue only.

`VYColor.Identity` (vivid tile colours, e.g. blue `#3B82F6`) is not the accent; do not use it for the film's one accent.

## 2. Brand assets (copied into `public/brand/`, unaltered)

| File in `public/brand/` | Source | Notes |
|---|---|---|
| `provisum-app-icon-1024.png` | `/Users/cassiandrefke/Developer/Apps/.pv-worktrees/v12/Provisum/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon.png` | 1024 x 1024, 8-bit RGBA PNG, copied byte for byte. Asset catalog icon (iOS single size). |
| `veyago-icon.svg` | `/Users/cassiandrefke/Documents/Veyago-main/Logo/appicon/veyago-icon.svg` | The Veyago mark for the end card. 200 x 200 viewBox: rounded square `#09111F` (rx 44), white `#F2F4F7` V-stroke (width 11), parchment dot `#D4C9A8` at the apex. Preferred form. |
| `veyago-wordmark-transparent.svg` | `/Users/cassiandrefke/Documents/Veyago-main/Logo/appicon/veyago-wordmark-transparent.svg` | Veyago wordmark, transparent background. Use only if the end card needs the name in full. |

The Veyago logo is in the Veyago repo's `Logo/` folder. It was not found in the Provisum repo's `Support/AppStore` or `Tools/store_art.py` (no Veyago art there).
The predecessor folder named in the brief was not opened or searched.

Mismatch to note: the Veyago SVGs were copied with `-rw-------` permissions. Harmless, but `chmod 644` if a tool needs to read them as another user.

## 3. App facts for the crew

### 3a. The 1.2 binder home (v12, the redesigned home; the subject of the transition)
Source: `Provisum/Features/Binder/BinderHomeView.swift` (lines 43-70), in this order:
1. `SampleBinderCard` (only on the sample binder).
2. `BinderNextUp`: "the subject of the screen", one pressing item at a time. Copy: "Next up", "Coming up", "Snooze", "Page 1 of 3", "Opens it". Source `BinderNextUp.swift`.
3. `BinderLater`: heading "Later", the dates after the focus (shown only if there is an attention item). Source `BinderLater.swift`.
4. `BinderDock`: five round buttons in one row: Emergency (only for people types with an emergency card, via `EmergencyModeEntry`), Family, Bills, Packets, More. Source `BinderDock.swift`.
5. `BinderHelpersStrip`: heading "Helpers", chips "Still right?", "Go through the mail", "Things to add", "Paperwork helper". Source `BinderHelpersStrip.swift`.
6. `BinderGlance` (not on the sample): heading "In this binder", tiles "Papers", "People", "To-dos" with counts, a bills card "Bills due this month" with "Next: ...", a "Log" link. Source `BinderGlance.swift`.
7. `BinderFamilyActivity`: heading "Family", lines like "finished ...", "added ...", "logged ...", empty state "Nothing new from them lately." Source `BinderFamilyActivity.swift`.
8. `BinderSetupCard` (setup checklist), and `EmergencyCardShareAsk` (once, for binders shared before 1.2).

Nav title and subtitle come from `BinderText.homeTitle(for:)` / `homeSubtitle(for:)`.

### 3b. The V1 home as shipped in 1.1 (v11, `Provisum/Features/Binder/BinderHomeView.swift`)
Order, top to bottom:
1. `SampleBinderCard` (sample only).
2. `BinderMastheadCard` (binder name and summary header).
3. `BinderSetupCard`.
4. `BinderAskCard` (an ask prompt).
5. `BinderAttentionSection` (what needs attention).
6. `BinderComingUpSection` (dates coming up).
7. A family section, then `FamilyUpdateCard`.
8. `BinderGapsCard` (completeness gaps).
9. Quick actions (`BinderQuickActionsGrid.swift`).
10. `BinderRecordsSection` (records by type).

Use this for the "Provisum 1" sketch. Items in the sketch must be ones this list shows. The V1 sketch in the script (binder for Mom, emergency card, deadlines, mail, packets) is faithful to the v11 tabs and sections.

### 3c. Tabs
- **1.1 (v11), `Provisum/App/AppState.swift` line 9: five tabs**: Binder (`book.closed.fill`), Documents (`doc.text.fill`), Deadlines (`calendar`), People (`person.2.fill`), Packets (`tray.and.arrow.up.fill`).
- **1.2 (v12), `Provisum/App/AppRoute.swift` line 9: FOUR tabs**: Binder, Documents, Deadlines, People. `RootView.swift` loops over `AppTab.allCases`, so there are four in the 1.2 tab bar. Packets is a route pushed from the binder home dock (`appState.push(.packets, on: .binder)`).
- **Mismatch:** the brief and `CLAUDE.md` say "five tabs" for the current build. That is true of 1.1 only. The 1.2 source has four. Confirm with the director before drawing a tab bar in the film.

### 3d. Sample data (the sample binder)
Source: `Provisum/Persistence/SampleData.swift`, `SampleDataCopy.swift`, `Provisum/Features/Binder/SampleBinder.swift`.
- Binder name: "Mom" (`SampleCopy.momLabel`). The app labels the sample "Sample: Eleanor Hughes" (`SampleBinder.label`). Eleanor Hughes is the fictional parent. Dad is "Dad" (`dadLabel`, "Robert Hughes"). The European sample uses a different made-up parent per country (`SampleEuropeProfile`).
- Home note: "Lives on her own in Upper Arlington. Drives short distances only." (sample only).
- **Documents** (titles as in `SampleData.swift`): Medicare card, Medigap plan, drug plan (Aetna), driver's license (Ohio BMV), Social Security card, power of attorney, will, deed, homeowners insurance (State Farm), vehicle registration (expires in 12 days), bank account (Huntington), a benefits letter, a doctor letter (OhioHealth Heart & Vascular), a Medicare summary notice.
- **People** (`SampleData.swift` lines 101-125): Dr. Priya Raman (physician, Lakeside Family Medicine), Dr. Alan Brooks (specialist, OhioHealth Heart & Vascular), CVS Pharmacy, Susan Park (attorney, Park & Alvarez Elder Law), David Hughes (family, son, emergency contact), Linda Moreno (neighbour, emergency contact), Mark Ellis (insurance agent, State Farm), 1-800-MEDICARE.
- **Bills**: AEP Ohio, $142.18, monthly, due in 9 days, autopay. Spectrum, $89.99, monthly, due in 3 days. Reader's Digest, $29.99, yearly, due in 47 days, marked for review.
- **Deadlines**: a cardiology visit with Dr. Brooks, a wellness visit with Dr. Raman, the homestead filing (in 24 days), a plans review, the vehicle registration.
- **Log**: a bloodwork visit (20 days ago), a decision on who takes visits (David, 30 days ago).
- **Emergency card** (local only): blood type A+, a preferred hospital (Riverside Methodist Hospital), three medicines on the card (Eliquis 5 mg, Metformin 500 mg, Lisinopril 10 mg) with prescriptions. Only the card's medication list is in scope; no tracking.
- **Identifier caution:** the sample holds numbers shaped like real ones (a Medicare-style number, a Social-Security-style number `123-45-4821`, licence and account numbers, a 555-exchange phone). These are fictional, but the film must not show any of them on screen (CONTRACT: no real numbers). Mask them, or show a name with no number. The app masks identifiers on its own screens (`IdentifierRedaction .lastFour`).

### 3e. Quotable on-screen strings (safe)
From source, plain sentence case, no avoid-words:
- Headings and labels: "Next up", "Coming up", "Later", "Helpers", "In this binder", "Family", "Log", "Bills", "Packets", "More", "Care notes", "Family", "Bills due this month", "Papers", "People", "To-dos".
- Helper chips: "Still right?", "Go through the mail", "Things to add", "Paperwork helper".
- Family card: "Nothing new from them lately."
- Sample: "Sample", "Sample removed", "Everything in it is made up, so you can look around. It doesn't count toward the free limits and can't be shared."
- Tab names: "Binder", "Documents", "Deadlines", "People" (1.2); add "Packets" for 1.1 only.

### 3f. Avoid in on-screen copy (CONTRACT section 1)
receipt, warranty, claim, proof, archive, timeline, scanner, life admin. Also out of scope to depict: medication reminders or adherence tracking, symptom or vitals or mood tracking, chat, feeds, volunteer scheduling, trips, legal, medical or financial advice. The sample's "Reader's Digest" and "Medicare" strings are fine; the film should not quote the sample's "Summary notice" or drug names in a tracking context.

Watch: the script's own shot words (for example "Scam check", "Visit recording") are fine, but "Who paid what?" in the margin is a note, not a feature label, and is allowed.

## 4. Mechanical checks

`tools/checkRules.sh` (run from anywhere; it finds `Film/` from its own path). Scans `src/`, `docs/`, `tools/`, `public/`, `CONTRACT.md`, excluding `node_modules`, `.venv`, `out`.
- FAILS (exit 1): the predecessor product name in any case, the Apple logo glyph U+F8FF, and Apple typeface names (SF Pro, SFPro, San Francisco, SF Symbols, New York as a font). `CONTRACT.md` and this file are exempt from the Apple checks only, because they state the rule.
- WARNS (non-fatal): avoid-words in on-screen copy folders (`src/scenes`, `src/sketches`, `src/glass`, `src/devices`).
- The script never contains the forbidden strings literally (pieces are joined at run time).

Last run: see the report. The identity check fails on plain-English uses in files owned by other agents (listed in the report); those owners must rephrase, the script is not wrong.

## 5. Open facts for the director
- The 1.2 home has no Packets tab; the film's "Packets" beat must show it as a dock button on the binder home, not a tab.
- The accent in dark mode is `#6E8BFF`. Decide whether glass-world UI uses any accent at all.
- The sample binder name differs by surface: "Mom" in the binder, "Sample: Eleanor Hughes" as the label. Use "Mom" for the film, which the contract allows.
