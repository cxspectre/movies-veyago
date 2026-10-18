#!/bin/zsh
# renderCutdowns4.sh — the v4 9:16 cut-downs (Hook75, Cut180, the 11 chapter shorts), silent, one after the other (never in parallel).
# usage: tools/renderCutdowns4.sh <scale> <crf> <suffix> [id ...]     e.g.  2 14 4k   |   1 18 1080 Hook75 Short-line
# Output: out/<id>-<suffix>.mp4 (the name tools/mix/package4.sh pairs with audio/v4/mix/<id>.wav). Resumable: render.ts keeps
# finished 300-frame chunks in out/chunks/<id>-tall-s<scale>/ and skips them on a re-run (add FORCE=1 to redo them).
cd "${0:A:h:h}" || exit 1
scale=${1:-2}; crf=${2:-14}; suffix=${3:-4k}
ids=(${@[4,-1]})
(( ${#ids} )) || ids=(Hook75 Cut180 Short-line Short-mayasHouse Short-theNo Short-filterMachine Short-researchBoard Short-nameAndLook \
                      Short-engineRoom Short-launch Short-village Short-paperToGlass Short-providedFor)
for id in $ids; do
  nice -n 5 npx tsx tools/render.ts ${id}-tall --out=out/${id}-${suffix}.mp4 --scale=$scale --chunk=300 --crf=$crf --concurrency=4 ${FORCE:+--force} || echo "FAILED $id"
done
echo CUTDOWNS4_DONE
