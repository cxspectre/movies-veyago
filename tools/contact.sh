#!/bin/bash
# contact.sh — a labelled-by-order contact sheet of a video at given timestamps.
# usage: tools/contact.sh <video> <out.png> <cols> <tile width px> <t1> <t2> ...   (times in seconds)
set -e
video=$1; out=$2; cols=$3; width=$4; shift 4
tmp=$(mktemp -d)
i=1
for t in "$@"; do
  ffmpeg -y -v error -ss "$t" -i "$video" -frames:v 1 -vf "scale=${width}:-1" "$tmp/f$(printf %03d $i).png"
  i=$((i+1))
done
n=$((i-1)); rows=$(( (n + cols - 1) / cols ))
ffmpeg -y -v error -framerate 1 -i "$tmp/f%03d.png" -vf "tile=${cols}x${rows}" -frames:v 1 "$out"
rm -rf "$tmp"
echo "$out ($n frames, ${cols}x${rows})"
