#!/bin/zsh
# ocrscan.sh <id>... : OCR of every poster and one frame per second of each clip in public/footage4.
source "${0:A:h}/env.sh"
for id in "$@"; do
  d="$RAW/ocr-$id"; rm -rf "$d"; mkdir -p "$d"
  ffmpeg -v error -i "$FOOTAGE/$id.mp4" -vf fps=1 "$d/f%02d.png"
  cp "$FOOTAGE/$id.png" "$d/poster.png"
  swift "${0:A:h}/ocr.swift" "$d"/*.png | sed "s/^/$id /"
done
