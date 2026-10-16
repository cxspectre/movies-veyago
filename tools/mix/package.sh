#!/bin/bash
# package.sh — mux the finished silent videos with their mixes into out/final/ with the delivery names.
# usage: tools/mix/package.sh <suffix>      e.g. 4k  (reads out/master-4k.mp4 ...)   or  1080
set -e
cd "$(dirname "$0")/../.."
s=${1:-4k}; label=$([ "$s" = "4k" ] && echo 4K || echo 1080p)
mkdir -p out/final
mux() { # video audio output
  [ -f "$1" ] || { echo "skip (missing $1)"; return 0; }
  ffmpeg -y -v error -i "$1" -i "$2" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -movflags +faststart "$3"
  echo "wrote $3 ($(du -h "$3" | cut -f1))"
}
mux out/master-$s.mp4          audio/mix/master.wav        out/final/Provided-For_16x9_${label}_master_with-VO.mp4
mux out/master-$s.mp4          audio/mix/master-novo.wav   out/final/Provided-For_16x9_${label}_master_no-VO.mp4
mux out/master-vertical-$s.mp4 audio/mix/vertical.wav      out/final/Provided-For_9x16_${label}_0-45_with-VO.mp4
mux out/master-vertical-$s.mp4 audio/mix/vertical-novo.wav out/final/Provided-For_9x16_${label}_0-45_no-VO.mp4
mux out/teaser-vertical-$s.mp4 audio/mix/teaser.wav        out/final/Provided-For_9x16_${label}_0-15_teaser.mp4
mux out/teaser-wide-$s.mp4     audio/mix/teaser.wav        out/final/Provided-For_16x9_${label}_0-15_teaser.mp4
