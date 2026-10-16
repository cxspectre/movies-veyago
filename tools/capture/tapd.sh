#!/bin/zsh
# tapd.sh <x> <y> : tap the film iPhone at a point given in 920 px-wide preview coordinates
# (the size screenshots are previewed at); converts to points (402 pt wide).
source "${0:A:h}/env.sh"
px=$(python3 -c "print(round($1 * 402 / 920, 1))"); py=$(python3 -c "print(round($2 * 402 / 920, 1))")
axe tap -x "$px" -y "$py" --udid "$PHONE" >/dev/null
