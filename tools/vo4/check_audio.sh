#!/bin/sh
# Independent check of the v4 scratch VO with ffprobe and ffmpeg's ebur128 filter.
# Usage: sh tools/vo4/check_audio.sh   (run from the film root)
set -eu
VO_DIR="audio/v4/vo"
check() {
  f="$1"
  info=$(ffprobe -v error -select_streams a:0 -show_entries stream=sample_rate,channels,bits_per_raw_sample,sample_fmt,codec_name -show_entries format=duration -of csv=p=0 "$f")
  meter=$(ffmpeg -nostdin -hide_banner -nostats -i "$f" -filter_complex ebur128=peak=true -f null - 2>&1)
  integrated=$(printf '%s\n' "$meter" | awk '/^ *I: /{v=$2} END{print v}')
  peak=$(printf '%s\n' "$meter" | awk '/^ *Peak:/{v=$2} END{print v}')
  printf '%s | %s | I %s LUFS | true peak %s dBFS\n' "$(basename "$f")" "$info" "$integrated" "$peak"
}
for f in "$VO_DIR"/stem_*.wav; do check "$f"; done
for f in "$VO_DIR"/clips/*.wav; do check "$f"; done
