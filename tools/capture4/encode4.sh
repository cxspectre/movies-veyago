#!/bin/zsh
# encode4.sh <raw.mov> <id> <start s> <end s> <poster s>
# Raw Simulator recording -> public/footage4/<id>.mp4 (constant 30 fps, H.264 High, yuv420p,
# native 1206x2622, no audio) and <id>.png (lossless poster at <poster s> into the trimmed clip).
source "${0:A:h}/env.sh"
in="$1"; id="$2"; ss="$3"; to="$4"; poster="$5"
[[ -f "$in" ]] || { echo "encode4.sh: no input $in" >&2; exit 1; }
dur=$(python3 -c "print(round($to - $ss, 3))")
nice -n 10 ffmpeg -v error -y -ss "$ss" -i "$in" -t "$dur" -an \
  -vf "fps=30,tpad=stop_mode=clone:stop_duration=4,format=yuv420p" -c:v libx264 -preset slow -crf 16 -profile:v high \
  -fps_mode cfr -r 30 -movflags +faststart "$FOOTAGE/$id.mp4" || { echo "encode failed" >&2; exit 1; }
rm -f "$FOOTAGE/$id.png"
abs=$(python3 -c "print(round($ss + $poster, 3))")
ffmpeg -v error -y -ss "$abs" -i "$in" -frames:v 1 -update 1 "$FOOTAGE/$id.png"
[[ -s "$FOOTAGE/$id.png" ]] || ffmpeg -v error -y -sseof -0.05 -i "$in" -frames:v 1 -update 1 "$FOOTAGE/$id.png" \
  || { echo "poster failed" >&2; exit 1; }
ffprobe -v error -show_entries stream=width,height,avg_frame_rate,pix_fmt,nb_frames:format=duration -of compact "$FOOTAGE/$id.mp4"
