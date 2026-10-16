#!/bin/zsh
# renderCutdowns.sh — the three cut-downs at one scale, one after the other (never in parallel).
# usage: tools/mix/renderCutdowns.sh <scale> <crf> <suffix>     e.g. 1 18 1080   |   2 14 4k
cd "${0:A:h:h:h}" || exit 1
scale=${1:-1}; crf=${2:-18}; suffix=${3:-1080}
for spec in "Vertical45-tall:master-vertical" "Teaser15-tall:teaser-vertical" "Teaser15-wide:teaser-wide"; do
  comp=${spec%%:*}; name=${spec##*:}
  nice -n 5 npx tsx tools/render.ts $comp --out=out/${name}-${suffix}.mp4 --scale=$scale --chunk=300 --crf=$crf --concurrency=4 || echo "FAILED $comp"
done
echo CUTDOWNS_DONE
