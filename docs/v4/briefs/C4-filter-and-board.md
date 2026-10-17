# C4: polish chapters 4 and 5 (cloud, Sonnet High, CAP $12)

Branch `claude/c4-filter-board`. You own `src/chapters/filterMachine/**` and `src/chapters/researchBoard/**` only (the camera is global and owned by another session: if a framing problem is the camera's, report it with the numbers).

## Fix
1. **Chapter 5 in 9:16.** The board is wider than the 1080 px central column: the right-hand cards ("The suggestions", "The rules") and the row of six boxes (Documents ... Packets) clip at the right edge. Re-lay the board for tall inside the column (two columns of cards, or the six boxes in two rows) so nothing clips, with the strings and the two axes still reading. Wide stays as it is unless a flaw shows.
2. **Chapter 5 labels.** "What do the others get wrong?" wraps onto the board's bottom edge in both formats: keep every question inside the board with a margin.
3. **Chapter 4, check against the beat sheet.** Render 20 frames per format across 0-55 s and compare with BIBLE4 5.4 beat by beat: the machine must visibly fold up from the page (the first review showed it already complete at 5 s; if the fold is too fast or missing, fix it), cards fly in and the "x" cards fall to the pile, each filter label is written, and the end card "A binder for the one who holds the family's papers." lands. Cards cross the filter labels while the text is half-written (around 12 s): decide the order so a card never hides a label as it is being read.
4. **Weight.** Chapter 4's machine is plain beige boxes: add pencil hatching and the lamp shadow the other chapters use (`src/paper/README.md`), so it matches chapters 3 and 6.
5. Check two adjacent frames of every card flight for flicker.

Report any claim or string you drew (the terminal, store and review text are drawn per contract 13.5; every word needs a CLAIMS row).
