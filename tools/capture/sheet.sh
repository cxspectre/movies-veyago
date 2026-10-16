#!/bin/zsh
# sheet.sh <video> [cols] : a contact sheet (one frame every 0.5 s, small) to $RAW/<name>.sheet.jpg
source "${0:A:h}/env.sh"
in="$1"; cols="${2:-8}"
name="${in:t:r}"
ffmpeg -v error -y -i "$in" -vf "fps=2,scale=240:-1,tile=${cols}x3:padding=4" -frames:v 1 "$RAW/$name.sheet.jpg" && echo "$RAW/$name.sheet.jpg"
