#!/bin/zsh
# encode.sh <raw.mov> <id> <start s> <end s> <poster s>
# Re-encodes a raw Simulator recording to public/footage/<id>.mp4: constant 30 fps, H.264 High,
# yuv420p, native pixel size, no audio; and writes <id>.png (lossless poster at <poster s>,
# measured from the trimmed clip's start). Raw files stay in $RAW (outside the film folder).
source "${0:A:h}/env.sh"
in="$1"; id="$2"; ss="$3"; to="$4"; poster="$5"
[[ -f "$in" ]] || { echo "encode.sh: no input $in" >&2; exit 1; }
dur=$(python3 -c "print(round($to - $ss, 3))")
nice -n 10 ffmpeg -v error -y -ss "$ss" -i "$in" -t "$dur" -an \
  -vf "fps=30,tpad=stop_mode=clone:stop_duration=4,format=yuv420p" -c:v libx264 -preset slow -crf 16 -profile:v high \
  -fps_mode cfr -r 30 -movflags +faststart "$FOOTAGE/$id.mp4" || { echo "encode failed" >&2; exit 1; }
# <poster s> = "still:<file.png>" copies a simctl screenshot (same pixels, taken just before the
# recording) as the poster instead.
if [[ "$poster" == still:* ]]; then
  cp "${poster#still:}" "$FOOTAGE/$id.png" || { echo "poster copy failed" >&2; exit 1; }
  ffprobe -v error -show_entries stream=width,height,avg_frame_rate,pix_fmt,nb_frames:format=duration -of compact "$FOOTAGE/$id.mp4"
  exit 0
fi
# The poster comes from the raw file (not the H.264 encode) so it stays lossless.
rm -f "$FOOTAGE/$id.png"
abs=$(python3 -c "print(round($ss + $poster, 3))")
ffmpeg -v error -y -ss "$abs" -i "$in" -frames:v 1 -update 1 "$FOOTAGE/$id.png"
# Past the raw file's last frame (a still screen writes no frames): take its last frame instead.
[[ -s "$FOOTAGE/$id.png" ]] || ffmpeg -v error -y -sseof -0.05 -i "$in" -frames:v 1 -update 1 "$FOOTAGE/$id.png" \
  || { echo "poster failed" >&2; exit 1; }
ffprobe -v error -show_entries stream=width,height,avg_frame_rate,pix_fmt,nb_frames:format=duration -of compact "$FOOTAGE/$id.mp4"
