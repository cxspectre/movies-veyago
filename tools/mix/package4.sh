#!/bin/bash
# package4.sh — mux the finished v4 silent videos with their mixes into out/final4/. Skips any pair that is missing.
# usage: tools/mix/package4.sh <suffix>      e.g. 4k (reads out/film4-4k.mp4 ...)   or  1080
# Names: out/<id>-<suffix>.mp4 (silent video) + audio/v4/mix/<id>[-novo].wav -> out/final4/<id>_<suffix>_{with-VO,no-VO}.mp4
# The 9:16 master is out/master4-tall-<suffix>.mp4 and takes the master4 mix (same 600 s, same audio) -> master4-tall_<suffix>_*.mp4.
# Warns (does not stop) when picture and audio differ by more than 0.1 s.
set -e
cd "$(dirname "$0")/../.."
s=${1:-4k}
mkdir -p out/final4
mux() { # video audio output
  [ -f "$1" ] && [ -f "$2" ] || { echo "skip ($1 + $2)"; return 0; }
  # picture and mix must be the same length to the frame; a longer file means the mix or the render is wrong
  vd=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"); ad=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$2")
  awk -v v="$vd" -v a="$ad" 'BEGIN{d=v-a; if(d<0)d=-d; exit !(d>0.1)}' && echo "WARNING: $1 is ${vd}s but $2 is ${ad}s"
  ffmpeg -y -v error -i "$1" -i "$2" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -movflags +faststart "$3"
  echo "wrote $3 ($(du -h "$3" | cut -f1))"
}
mux "out/master4-tall-$s.mp4" "audio/v4/mix/master4.wav"      "out/final4/master4-tall_${s}_with-VO.mp4"
mux "out/master4-tall-$s.mp4" "audio/v4/mix/master4-novo.wav" "out/final4/master4-tall_${s}_no-VO.mp4"
for id in master4 Hook75 Cut180 Short-line Short-mayasHouse Short-theNo Short-filterMachine Short-researchBoard Short-nameAndLook \
          Short-engineRoom Short-launch Short-village Short-paperToGlass Short-providedFor; do
  mux "out/$id-$s.mp4" "audio/v4/mix/$id.wav"      "out/final4/${id}_${s}_with-VO.mp4"
  mux "out/$id-$s.mp4" "audio/v4/mix/$id-novo.wav" "out/final4/${id}_${s}_no-VO.mp4"
done
