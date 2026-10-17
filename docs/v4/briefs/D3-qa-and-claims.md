# D3: whole-film QA sweep and the claims audit (cloud, Sonnet High, CAP $10; read-only except docs)

Read `docs/v4/briefs/C-common.md` (the same rules apply), `CONTRACT.md` section 13, `docs/v4/CLAIMS.md`, `docs/v4/BIBLE4.md`, `src/beats4.ts`.

Branch `claude/d3-qa`. You own ONLY `docs/v4/QA1.md` and `docs/v4/CLAIMS.md` (add rows). You change no code.

## Do
1. **Claims audit.** Collect EVERY word, number and date that appears on screen (supers, labels, drawn app and store strings, the number rolls, the end card, the notes) by reading `src/beats4.ts` and each `src/chapters/*/` folder. Check each against `docs/v4/CLAIMS.md`. Add a row for each missing one, marked UNCONFIRMED with its source line. Then write a single list of the questions the owner must answer (wording, numbers, dates, anything that states a fact about the app or the company), grouped by chapter, each with your recommended answer and why. Known ones: `0 servers`, `Free on the App Store`, the invitation wording, the Veyago mark, the date on chapter 3's calendar, the test count, the synthetic-voice credit.
2. **Contract sweep.** Grep the whole repo and render evidence for: the first app's name or its plain-English form anywhere (including strings, comments, alt text, file names); Apple logos or typefaces authored by us; `mix-blend-mode`; anything on glass not first drawn on paper; recorded (not drawn) App Store Connect, store, review or terminal text; a launch date or "seven days" anywhere.
3. **Visual sweep.** Render 40 `Master4-wide` and 40 `Master4-tall` stills at the beat times from `beats4.ts` that matter most (every super, every number roll, every chapter start and end), read them, and list every defect: text under 28 sheet px at its working zoom, clipping at the frame or at the 1080 px column in tall, overlaps (text over art, line through text), flat or empty frames, wrong words. Rank them by how visible they are to a viewer.
4. Write `docs/v4/QA1.md`: the ranked defect list (chapter, master second, format, what is wrong, a suggested fix and which folder owns it), the contract-sweep result, and the owner's question list.
