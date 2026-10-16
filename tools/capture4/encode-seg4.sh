#!/bin/zsh
# encode-seg4.sh <raw.mov> <id> "<s1>-<e1>,<s2>-<e2>,..." <poster raw s> [pad s]
# Joins pieces of one recording into public/footage4/<id>.mp4 (30 fps CFR, H.264 High, yuv420p).
# Use only to drop part of a hold where the screen does not change (the join is then invisible);
# note every join in the manifest. The poster is taken losslessly from the RAW file at <poster raw s>.
# [pad s] holds the last frame that long (a still screen writes no frames at the end of a take).
source "${0:A:h}/env.sh"
in="$1"; id="$2"; segs="$3"; poster="$4"; pad="${5:-0}"
[[ -f "$in" ]] || { echo "encode-seg4.sh: no input $in" >&2; exit 1; }
filter=""; labels=""; n=0
for seg in ${(s:,:)segs}; do
  s=${seg%-*}; e=${seg#*-}
  filter+="[0:v]fps=30,trim=start=${s}:end=${e},setpts=PTS-STARTPTS,format=yuv420p[v$n];"
  labels+="[v$n]"; n=$((n+1))
done
filter+="${labels}concat=n=$n:v=1:a=0,tpad=stop_mode=clone:stop_duration=${pad}[out]"
nice -n 10 ffmpeg -v error -y -i "$in" -filter_complex "$filter" -map "[out]" -an \
  -c:v libx264 -preset slow -crf 16 -profile:v high -pix_fmt yuv420p -fps_mode cfr -r 30 -movflags +faststart \
  "$FOOTAGE/$id.mp4" || { echo "encode failed" >&2; exit 1; }
rm -f "$FOOTAGE/$id.png"
ffmpeg -v error -y -ss "$poster" -i "$in" -frames:v 1 -update 1 "$FOOTAGE/$id.png" || { echo "poster failed" >&2; exit 1; }
ffprobe -v error -show_entries stream=width,height,avg_frame_rate,pix_fmt,nb_frames:format=duration -of compact "$FOOTAGE/$id.mp4"
