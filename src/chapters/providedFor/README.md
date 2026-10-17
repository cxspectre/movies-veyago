
## C3 notes
- Starts with the chapter 10 title at the handoff level dimming over 0-1 (imports `TitleLayer` and `HANDOFF_LIGHT` from paperToGlass).
- The Veyago mark is a PLACEHOLDER drawn inline (caret in a rounded square); the owner must supply or confirm the real one.
- Tall: sheet4.ts's camera drift leaves the pencil half off frame, so the pencil is nudged (+370, +420 sheet px, 20-21 s) to rest whole lower-left. Cleaner fix outside this folder: tall camera centre x 38300 -> about 38020 in src/sheet4.ts (and cardLayout cx to match).
