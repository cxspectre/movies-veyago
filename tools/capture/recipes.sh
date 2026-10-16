#!/bin/zsh
# recipes.sh <clip id> : re-captures one clip the way docs/FOOTAGE.md describes (the clips that
# launch hooks alone can reach). Boot the film iPhone first (see FOOTAGE.md, "Setup"); clips that
# need hand-made data (family-tabs, passport-reminder) and the watch clips are manual, see the doc.
# Taps and scroll lengths drift with machine load: always check the contact sheet (sheet.sh) and
# pick the trim from motion.py before encoding. Raw files land in $RAW; encode with encode.sh /
# encode-seg.sh and add the entry with addclip.py.
source "${0:A:h}/env.sh"
HERE="${0:A:h}"
BASE=(OB_SKIP_ONBOARDING=1 OB_APPEARANCE=dark OB_DEBUG_UNLOCK=1 OB_REVIEW_PROMPT=off)
SEED=(OB_SEED_SAMPLE=1 "${BASE[@]}")
BELGIUM=(-- -AppleLocale en_BE -AppleLanguages "(en)")

settle() { sleep "${1:-11}"; }

binder_home() {   # $1 = dark | light
  xcrun simctl ui "$PHONE" appearance "$1"
  "$HERE/launch.sh" --fresh OB_SEED_SAMPLE=1 OB_SKIP_ONBOARDING=1 OB_APPEARANCE="$1" OB_DEBUG_UNLOCK=1 OB_REVIEW_PROMPT=off
  settle 10
  "$HERE/shot.sh" "binder-home-$1"
  axe describe-ui --udid "$PHONE" > "$RAW/binder-home-$1.ax.json"
  "$HERE/rec.sh" start "binder-home-$1-scroll2"; sleep 1
  "$HERE/swipe.sh" 200 680 200 300 3; sleep 1.2
  "$HERE/swipe.sh" 200 300 200 680 3; sleep 1
  "$HERE/rec.sh" stop
  xcrun simctl ui "$PHONE" appearance dark
}

scam_check() {
  "$HERE/launch.sh" --fresh "${SEED[@]}"; settle
  xcrun simctl terminate "$PHONE" "$BUNDLE"; sleep 1
  "$HERE/rec.sh" start scam-check
  "$HERE/launch.sh" "${BASE[@]}" OB_PRESENT_MAIL=1 OB_MAIL_FIXTURES=scam OB_MAIL_SORT=1; settle 12
  "$HERE/swipe.sh" 200 600 200 420 2; sleep 2
  "$HERE/rec.sh" stop
}

med_refill() {
  "$HERE/launch.sh" --fresh "${SEED[@]}" OB_PRESENT_EMERGENCY_CARD=1; settle
  "$HERE/swipe.sh" 200 700 200 330 1.5; sleep 2
  "$HERE/shot.sh" med-refill-position   # check where the Eliquis row is before the tap below
  "$HERE/rec.sh" start med-refill; sleep 3
  axe tap -x 200 -y 615 --udid "$PHONE"; sleep 2.2
  "$HERE/swipe.sh" 200 720 200 330 2.5; sleep 2.5
  "$HERE/rec.sh" stop
}

shared_costs() {
  "$HERE/launch.sh" --fresh "${SEED[@]}"; settle
  "$HERE/launch.sh" "${BASE[@]}" OB_COSTS=demo OB_INITIAL_TAB=people; settle 12
  for i in 1 2 3; do axe swipe --start-x 200 --start-y 700 --end-x 200 --end-y 150 --duration 0.3 --udid "$PHONE"; sleep 0.8; done
  sleep 1.5
  for i in 1 2; do axe swipe --start-x 200 --start-y 200 --end-x 200 --end-y 800 --duration 0.3 --udid "$PHONE"; sleep 0.6; done
  sleep 2
  "$HERE/rec.sh" start costs; sleep 4
  "$HERE/swipe.sh" 200 700 200 330 3; sleep 2.5
  "$HERE/rec.sh" stop
}

visit_summary() {
  "$HERE/launch.sh" --fresh "${SEED[@]}"; settle
  "$HERE/launch.sh" "${BASE[@]}" OB_VISIT_DEMO=after OB_VISIT_RECORDING=demo OB_VISIT_OPEN=1; settle 13
  "$HERE/rec.sh" start visit; sleep 3.5
  "$HERE/swipe.sh" 200 690 200 110 4; sleep 3   # start above the bottom accessory bar (y > 735 grabs it)
  "$HERE/rec.sh" stop
}

belgium_112() {
  "$HERE/launch.sh" --fresh "${SEED[@]}" OB_EMERGENCY_MODE=1 "${BELGIUM[@]}"; settle 14
  "$HERE/swipe.sh" 200 700 200 250 1.5; sleep 2
  "$HERE/rec.sh" start be112; sleep 3.5
  "$HERE/swipe.sh" 200 700 200 250 3
  "$HERE/swipe.sh" 200 650 200 400 2; sleep 1
  "$HERE/shot.sh" be112-pos
  local pos; pos=$("$FILM/.venv/bin/python" "$HERE/findcolor.py" "$RAW/be112-pos.png" 180 35 24 200) \
    && axe tap -x "${pos% *}" -y "${pos#* }" --udid "$PHONE"
  sleep 2.5
  "$HERE/rec.sh" stop
}

onboarding() {
  "$HERE/launch.sh" --fresh OB_APPEARANCE=dark OB_REVIEW_PROMPT=off OB_ONBOARDING_STEP=who; settle 10
  "$HERE/rec.sh" start onboarding; sleep 3.5
  axe tap -x 76 -y 497 --udid "$PHONE"; sleep 2.5
  for c in E l e a n o r " " H u g h e s; do axe type "$c" --udid "$PHONE"; done   # one key at a time: whole strings drop letters under load
  sleep 1.2
  axe tap -x 200 -y 805 --udid "$PHONE"; sleep 3.5
  "$HERE/rec.sh" stop
  "$HERE/rec.sh" start onb-place; sleep 3.5
  axe tap -x 252 -y 502 --udid "$PHONE"; sleep 3.5   # Belgium
  "$HERE/rec.sh" stop
}

welcome() {
  "$HERE/launch.sh" --fresh OB_APPEARANCE=dark OB_REVIEW_PROMPT=off; settle 7
  "$HERE/rec.sh" start welcome; sleep 10
  "$HERE/rec.sh" stop
}

emergency_card_full() {
  "$HERE/launch.sh" --fresh "${SEED[@]}"; settle
  xcrun simctl terminate "$PHONE" "$BUNDLE"; sleep 1
  "$HERE/rec.sh" start ecard
  "$HERE/launch.sh" "${BASE[@]}" OB_EMERGENCY_MODE=card; sleep 22
  "$HERE/rec.sh" stop
  "$HERE/shot.sh" ecard-still
}

family_share() {
  "$HERE/launch.sh" --fresh "${SEED[@]}"; settle
  "$HERE/launch.sh" OB_SEED_SAMPLE=1 "${BASE[@]}" OB_PUSH_FAMILY=1 OB_DEMO_CARD_SHARING=on; settle 12
  "$HERE/rec.sh" start family-share; sleep 3.5
  "$HERE/swipe.sh" 200 690 200 120 3.5; sleep 0.8
  "$HERE/swipe.sh" 200 690 200 330 2.5; sleep 2
  "$HERE/rec.sh" stop
}

ask_about_mom() {
  "$HERE/launch.sh" --fresh "${SEED[@]}"; settle
  "$HERE/launch.sh" OB_SEED_SAMPLE=1 "${BASE[@]}" OB_PRESENT=assistant OB_ASSISTANT_HEURISTIC=1; settle 12
  "$HERE/rec.sh" start ask; sleep 3
  axe tap -x 120 -y 717 --udid "$PHONE"; sleep 5
  "$HERE/rec.sh" stop
}

case "$1" in
  binder-home-dark)    binder_home dark ;;
  binder-home-light)   binder_home light ;;
  scam-check)          scam_check ;;
  med-refill)          med_refill ;;
  shared-costs)        shared_costs ;;
  visit-summary)       visit_summary ;;
  belgium-112)         belgium_112 ;;
  onboarding-question|onboarding-country-chips) onboarding ;;
  onboarding-welcome)  welcome ;;
  emergency-card-full) emergency_card_full ;;
  family-share-card)   family_share ;;
  ask-about-mom)       ask_about_mom ;;
  *) echo "usage: recipes.sh <clip id> (manual clips: see docs/FOOTAGE.md)" >&2; exit 2 ;;
esac
