# C6: reconcile and polish chapters 8 and 9 (cloud, Sonnet High, CAP $14)

Branch `claude/c6-launch-village`. You own `src/chapters/launch/**` and `src/chapters/village/**` only. Do not edit `src/sheet4.ts`; if a map coordinate must change in the shared sheet file, report the exact change.

## Fix
1. **One map.** Chapter 8 (the launch) draws the world map, the US, and ends zoomed into Maya's house; chapter 9 draws the village inside the same US at 0.25 scale and rises to Europe on the same map (BIBLE4 5.8, 5.9, decision 2). Today each chapter has its own map numbers. Put the map geometry in ONE file (`src/chapters/launch/mapGeometry.ts`, imported by the village; one direction only) and make the two chapters agree: the same US, the same position of Maya's house, the same Europe. Resolve the Lisbon-versus-France overlap.
2. **One house.** Dad's house, and Maya's, are drawn twice in the two chapters. Draw each once (shared art file in the same place) and reuse it, so the end of chapter 8 and the start of chapter 9 show the identical house.
3. **The village in 9:16 and 16:9**, from the review: the door names are tiny (make them legible at the working zoom, minimum about 28 sheet px), margin notes clip at the right edge in tall (keep them in the central 1080 px column), the houses read as open boxes (add the roof thickness, eaves, hatching and shadow the other chapters use), and the faces are tiny (enlarge the people where they carry a beat).
4. **Both chapters**: render 20 frames per format against BIBLE4 5.8 and 5.9 and fix the next three worst things you see, listing them.
5. Remember: no launch date and no seven-days claim anywhere (decision 2026-10-17); the status labels are drawn words only. Do not add words without a CLAIMS row.
