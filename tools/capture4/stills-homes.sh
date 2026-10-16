#!/bin/zsh
# stills-homes.sh <light|dark> : a clean still of each staged family binder's home (switcher picks).
source "${0:A:h}/env.sh"
tap() { axe tap -x "$1" -y "$2" --udid "$PHONE" >/dev/null; }
for pair in Dad:122 Leo:163 Mia:205 Maya:247 Jonas:289 Biscuit:331 Sam:373; do
  name=${pair%%:*}; y=${pair##*:}
  tap 52 84; sleep 1.3; tap 100 $y; sleep 2.5
  xcrun simctl io "$PHONE" screenshot --type=png "$FOOTAGE/binder-home-${name:l}-$1.png" >/dev/null
done
tap 52 84; sleep 1.3; tap 100 122; sleep 1.5
