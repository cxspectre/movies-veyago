#!/bin/zsh
# rec-emergency.sh <raw name> <content size> : the sample "Mom" (fresh OB_SEED_SAMPLE=1 first) in
# emergency mode (OB_EMERGENCY_MODE=1). The hook only fires at a standard text size, so the app opens
# at the default size ("large") and the text size is then changed live to <content size>
# (accessibility-extra-extra-extra-large = the largest). Hold, one slow scroll, hold.
source "${0:A:h}/env.sh"
xcrun simctl terminate "$PHONE" "$BUNDLE" 2>/dev/null; xcrun simctl ui "$PHONE" content_size large; sleep 2
"${0:A:h}/launch.sh" OB_SKIP_ONBOARDING=1 OB_APPEARANCE=dark OB_DEBUG_UNLOCK=1 OB_REVIEW_PROMPT=off OB_EMERGENCY_MODE=1 >/dev/null
sleep 16
[[ "$2" != large ]] && { xcrun simctl ui "$PHONE" content_size "$2"; sleep 4; }
"${0:A:h}/shot.sh" "$1-still" >/dev/null
"${0:A:h}/rec.sh" start "$1"; sleep 3.0
"${0:A:h}/swipe.sh" 200 700 200 330 3.0; sleep 2.0
"${0:A:h}/rec.sh" stop
xcrun simctl ui "$PHONE" content_size large
