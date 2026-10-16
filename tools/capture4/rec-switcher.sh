#!/bin/zsh
# rec-switcher.sh <raw name> : records the binder switcher on the staged family (stage-family.sh):
# from Dad, open the switcher (the family list), pick Maya, open it again, pick Sam.
# Row centres (pt) in the switcher menu: Dad 122, Leo 163, Mia 205, Maya 247, Jonas 289, Biscuit 331, Sam 373.
source "${0:A:h}/env.sh"
tap() { axe tap -x "$1" -y "$2" --udid "$PHONE" >/dev/null; }
tap 52 84; sleep 1.2; tap 100 122; sleep 1.5          # back to Dad, menu closed
"${0:A:h}/rec.sh" start "$1"; sleep 2.0
tap 52 84; sleep 2.2                                   # the family list
tap 100 247; sleep 1.8                                 # Maya (lavender)
tap 52 84; sleep 1.4
tap 100 373; sleep 2.2                                 # Sam (dusk)
"${0:A:h}/rec.sh" stop
