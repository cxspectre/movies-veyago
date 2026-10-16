#!/bin/zsh
# Saves a PNG still of the film iPhone (or the watch with WATCH=1) to $RAW/<name>.png.
source "${0:A:h}/env.sh"
dev="$PHONE"; [[ "$WATCH_SHOT" == 1 ]] && dev="$WATCH"
xcrun simctl io "$dev" screenshot --type=png "$RAW/$1.png" >/dev/null 2>&1 && echo "$RAW/$1.png"
