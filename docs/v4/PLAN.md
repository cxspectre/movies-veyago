# Provided For, the long film (v4): production plan

Written 2026-10-16. Source script: `docs/SCRIPT-10MIN-v4.md`. Rules: `CONTRACT.md` (section 13 for v4).

## Goal
- **YouTube:** 16:9, 10:00, 4K.
- **TikTok / Shorts:** 9:16, 4K: a 60-90 s hook, a ~3:00 cut, and chapter shorts (each chapter is a region of one sheet, so a short is a slice of the camera path).
- The 2:40 "Provided For" film (v1) stays the product film; v4 is the story film. Chapters 10-11 are mostly v1 Acts 3-4 re-staged.

## What we reuse and what is new
- **Reuse (v1):** paper and pencil engine (`src/paper`), desk kit and hands, 3D devices and glass (`src/devices`, `src/glass`), recorded app footage (`public/footage`), the audio tools (music, voice, foley, mix), the chunked renderer, stills and contact-sheet tools, the rules check.
- **New:** `EndlessSheet` + unbroken `PencilLine` + camera with level-of-detail, both formats; `PopUp` paper objects; `LineCharacter` (Maya and family); `ScreenOnPaper`; `NumberRoll`; `FilterMachine`; `StringBoard`; `Cutaway`; `Village`; ten new sound families; a 10-minute score; three voices; new captures.

## Where each thing runs
| Work | Where | Model |
|---|---|---|
| Creative direction: the sheet layout, camera paths for both formats, character design, per-chapter beat sheet, cut-down edit lists | Cloud | Fable (or Opus) |
| Engine pieces (endless sheet, characters, pop-up, machines, cutaway, village) | Cloud | Opus for the hard ones, Sonnet Medium for the rest |
| Chapter scenes 1-9, both formats | Cloud, one session per chapter or pair | Sonnet Medium, Opus where it is hard |
| Paperwork: `--gl` flag, voice-line file, claims sheet, capture list, chapter stubs | Cloud | Sonnet / Haiku |
| Design review of stills | Local (fast GPU) | Sonnet |
| Chapters 10-11 (10 is WebGL devices, 11 is 2D) | Cloud (B8 with a swangle proof first, B9), reviewed locally | Opus / Sonnet |
| Voice scratch tracks (MAKER and MAYA), the owner's FOUNDER takes | Local (the owner records FOUNDER) | Kokoro, Haiku to drive it |
| 10-minute score, new foley | Local | Opus |
| Simulator captures, any Xcode recording | Local | Opus drives the Simulator; the owner records Xcode |
| Mix, 1080p proofs, 4K renders, cut-downs, packaging | Local | scripts (free) |

Cloud sessions only render stills (4 cores, software WebGL). Local renders are fast: the 2:40 master took about 35 minutes at 4K.

## Stages and gates
- **Stage 0 (cloud, about $10-25):** the director (S0-A: `docs/v4/BIBLE4.md`, `src/beats4.ts`) and the paperwork (S0-B). Briefs in `docs/v4/briefs/`.
- **Stage 1 (cloud, about $40-60):** endless sheet + camera + unbroken line (both formats), the character system with a Maya style test, chapter 1 and the pop-up component. **Gate 1:** the owner approves the look from stills (I fetch the branch, render locally and send stills).
- **Stage 2 (cloud, about $100-120):** chapters 2-9 in parallel sessions, then reviews and fixes. **Gate 2:** owner approves chapter stills.
- **Stage 3 (local):** (chapters 10-11 moved to the cloud, B8 and B9) assemble `Master4`, mix, 1080p proofs in both formats, review and fix. **Gate 3:** owner watches and listens.
- **Stage 4 (local):** 4K renders, hook, 3:00 cut, chapter shorts, packaging into `out/final/`.
- Reserve $30-80 of the $250 cloud credit for fixes. The credit expires 2026-11-05 08:59 GMT+1.

## Local track running in parallel (uses the weekly plan allowance, which resets Monday 09:00)
- **L1:** MAKER and MAYA scratch voices from the script (Kokoro), FOUNDER scratch; timing files.
- **L2:** the 10-minute score from the chapter map (same motif family and key as v1), stems per chapter.
- **L3:** new Simulator footage with the story's family (Dad, Leo, Mia, Maya, Jonas, Biscuit, Sam): binder switcher, wallpapers, invite flow, who-joined view, largest text size.
- **After the reset:** new foley (paper fold, scissors, crumple, stamp, string, odometer, train, plane, rocket), reviews, renders.

## How work moves between cloud and Mac
Cloud sessions push `claude/<brief-id>` branches and open PRs on `cxspectre/movies-veyago`. The conductor (a local chat in `~/Developer/Apps/MoviesVeyago`) fetches, renders stills locally, sends them to the owner, merges after review, and writes the next briefs. The owner reads the remaining cloud credit off the credits page after each stage.

## Risks
1. **Characters** (Maya and six others) are the biggest art risk: the style test is at Gate 1.
2. **Endless sheet performance:** only what is in view renders; far views use pre-rendered page images (the wall trick from v1).
3. **Claims:** every number and date needs a source (`docs/v4/CLAIMS.md`).
4. **Invite and sharing flows:** the Family CloudKit schema was missing in Production at the last check, so capture those moments with the app's demo hooks (`OB_DEMO_MEMBERS`, `OB_DEMO_JOINING`), never a live flow, and the film's claims must match what is shipped on release day.
5. **Cost:** v4 cannot be brute-forced on $250; hence reuse, Sonnet by default, stage caps and gates.

## Wave C (cloud, 2026-10-17): assembly, sound plumbing, polish
C1 Master4 on one sheet plus the handoff audit ($25), C2 v4 cue export, `silence` cue and cut-down cues ($12, code only), C3 chapters 10-11 polish ($14), C4 chapters 4-5 polish ($12), C5 chapters 2 and 6 polish ($12), C6 chapters 8-9 reconcile and polish ($14). Total cap $89; each session owns separate folders. Wave D (after Wave C merges): sheet LOD images, full local audio and renders. The audio mix and the 4K renders stay local.
