#!/bin/zsh
# recipes4.sh : re-captures every v4 clip in order (docs/v4/CAPTURES-done.md). One simulator job at a
# time; boot the film iPhone first: xcrun simctl boot 761ABF75-A87D-4EDA-B7D4-5E1668CF210E.
# Taps drift with machine load: check each raw with `$PY motion.py <raw> 4` and sheet.sh, adjust the
# segment times below, then encode. Shut the simulator down afterwards.
source "${0:A:h}/env.sh"
H="${0:A:h}"
B=(OB_SKIP_ONBOARDING=1 OB_DEBUG_UNLOCK=1 OB_REVIEW_PROMPT=off)
db() { echo "$(xcrun simctl get_app_container "$PHONE" "$BUNDLE" data)/Library/Application Support/Binders.store"; }
xcrun simctl status_bar "$PHONE" override --time 9:41 --batteryState charged --batteryLevel 100 >/dev/null
xcrun simctl ui "$PHONE" content_size large

# The staged family (Dad, Leo, Mia, Maya, Jonas, Biscuit, Sam), dark.
xcrun simctl ui "$PHONE" appearance dark
"$H/launch.sh" --fresh OB_SEED_SAMPLE=1 OB_SECOND_BINDER=1 "${B[@]}" OB_APPEARANCE=dark; sleep 12
"$H/stage-family.sh"
"$H/launch.sh" "${B[@]}" OB_APPEARANCE=dark; sleep 12
"$H/rec-switcher.sh" switcher-dark
"$H/encode-seg4.sh" "$RAW/switcher-dark.mov" binder-switcher-family "3.5-6.0,8.2-10.0,11.9-13.4,14.6-16.5" 6.0 0.4
"$H/stills-homes.sh" dark

# Light: stills, switcher, wallpapers.
xcrun simctl ui "$PHONE" appearance light
"$H/launch.sh" "${B[@]}" OB_APPEARANCE=light; sleep 12
"$H/stills-homes.sh" light
"$H/rec-switcher.sh" switcher-light
"$H/encode-seg4.sh" "$RAW/switcher-light.mov" binder-switcher-family-light "4.25-7.0,8.7-10.7,12.6-14.3,16.4-18.43" 6.5 0.3
axe tap -x 52 -y 84 --udid "$PHONE" >/dev/null; sleep 1.5; axe tap -x 100 -y 373 --udid "$PHONE" >/dev/null; sleep 2  # Sam
"$H/launch.sh" "${B[@]}" OB_APPEARANCE=light OB_PRESENT=settings OB_SETTINGS_PAGE=wallpaper; sleep 14
"$H/swipe.sh" 200 760 200 460 1.5; sleep 1.5
"$H/rec-wallpapers.sh" wallpapers-light
"$H/encode-seg4.sh" "$RAW/wallpapers-light.mov" wallpapers-sweep \
  "3.4-5.1,6.4-7.2,9.15-9.95,11.9-12.7,14.4-15.2,17.15-17.95,19.9-20.7,22.65-23.45,25.15-25.86" 9.9 0.6
axe tap -x 201 -y 697 --udid "$PHONE" >/dev/null; sleep 1.5   # Sam back to Dusk

# Sam's binder: documents (light), then the invite sheet (dark, Sam sorted first).
"$H/stage-sam-papers.sh"
"$H/launch.sh" "${B[@]}" OB_APPEARANCE=light OB_INITIAL_TAB=documents; sleep 12
"$H/rec-friend.sh" friend-raw
"$H/encode-seg4.sh" "$RAW/friend-raw.mov" friend-binder "2.8-10.5" 4.3 0.6
xcrun simctl ui "$PHONE" appearance dark
xcrun simctl terminate "$PHONE" "$BUNDLE"; sqlite3 "$(db)" "update ZBINDER set ZSORTORDER=-1 where ZLABEL='Sam'"
"$H/rec-invite.sh" invite-raw
"$H/encode-seg4.sh" "$RAW/invite-raw.mov" invite-friend "6.5-8.0,10.15-12.6,15.6-20.6" 21.5 0
xcrun simctl terminate "$PHONE" "$BUNDLE"; sqlite3 "$(db)" "update ZBINDER set ZSORTORDER=6 where ZLABEL='Sam'"

# Who joined (Dad's binder must be selected: switcher -> Dad, back to the home first).
"$H/launch.sh" "${B[@]}" OB_APPEARANCE=dark OB_DEMO_MEMBERS=1 OB_USER_NAME="Maya Hughes"; sleep 14
axe tap -x 52 -y 84 --udid "$PHONE" >/dev/null; sleep 1.5; axe tap -x 100 -y 122 --udid "$PHONE" >/dev/null; sleep 2
"$H/rec-family.sh" family-raw
"$H/encode4.sh" "$RAW/family-raw.mov" family-joined 3.4 12.3 3.0

# Two passports.
"$H/stage-passports.sh"
"$H/launch.sh" "${B[@]}" OB_APPEARANCE=dark OB_OPEN_ROUTE=ids; sleep 13
"$H/rec-passports.sh" passports-raw
"$H/encode-seg4.sh" "$RAW/passports-raw.mov" passports-two-children "4.5-13.35" 5.5 0

# Emergency view, default and largest text (fresh sample Mom; wipes the staged family).
"$H/launch.sh" --fresh OB_SEED_SAMPLE=1 "${B[@]}" OB_APPEARANCE=dark; sleep 12
"$H/rec-emergency.sh" emerg-default large
"$H/encode-seg4.sh" "$RAW/emerg-default.mov" emergency-default-text "3.0-10.39" 4.0 0.6
"$H/rec-emergency.sh" emerg-ax5 accessibility-extra-extra-extra-large
"$H/encode-seg4.sh" "$RAW/emerg-ax5.mov" emergency-largest-text "2.0-9.96" 3.0 0.5

"$H/ocrscan.sh" binder-switcher-family binder-switcher-family-light wallpapers-sweep invite-friend family-joined \
  friend-binder passports-two-children emergency-default-text emergency-largest-text > "$RAW/ocr.txt"
xcrun simctl shutdown "$PHONE"
