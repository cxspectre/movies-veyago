#!/bin/zsh
# rec-wallpapers.sh <raw name> : Settings > Background (OB_PRESENT=settings OB_SETTINGS_PAGE=wallpaper),
# scrolled so all nine tiles show; taps them in turn (mist, lavender, sea glass, apricot, blush, sage,
# linen, dusk, plain) so the backdrop behind the sheet changes through all nine. Points are pt.
source "${0:A:h}/env.sh"
tap() { axe tap -x "$1" -y "$2" --udid "$PHONE" >/dev/null; sleep 0.9; }
"${0:A:h}/rec.sh" start "$1"; sleep 2.0
tap 77 325; tap 201 325; tap 325 325
tap 77 510; tap 201 510; tap 325 510
tap 77 697; tap 201 697; tap 325 165
sleep 1.5
"${0:A:h}/rec.sh" stop
