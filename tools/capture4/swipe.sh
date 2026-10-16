#!/bin/zsh
# swipe.sh <x0> <y0> <x1> <y1> <seconds>  : a slow, smooth drag on the film iPhone (2 px steps).
source "${0:A:h}/env.sh"
axe swipe --start-x "$1" --start-y "$2" --end-x "$3" --end-y "$4" --duration "$5" --delta 2 --udid "${SWIPE_UDID:-$PHONE}" >/dev/null
