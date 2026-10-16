#!/bin/zsh
# rec-invite.sh <raw name> : the invite sheet for Sam's binder (staged family with Sam sorted first,
# OB_DEMO_MEMBERS=0 OB_PRESENT_INVITE=1). Switches on "The invitation is for Sam", scrolls, types a
# fictional reserved address (sam@example.com). Never presses Invite (no iCloud; nothing is sent).
source "${0:A:h}/env.sh"
"${0:A:h}/launch.sh" OB_SKIP_ONBOARDING=1 OB_APPEARANCE=dark OB_DEBUG_UNLOCK=1 OB_REVIEW_PROMPT=off \
  OB_DEMO_MEMBERS=0 OB_PRESENT_INVITE=1 >/dev/null
sleep 14
"${0:A:h}/rec.sh" start "$1"; sleep 2.0
axe tap -x 340 -y 555 --tap-style physical --udid "$PHONE" >/dev/null; sleep 1.2
"${0:A:h}/swipe.sh" 200 620 200 380 2; sleep 1.0
axe tap -x 194 -y 449 --udid "$PHONE" >/dev/null; sleep 0.8
for k in s a m @ e x a m p l e . c o m; do axe type "$k" --udid "$PHONE" >/dev/null; done
sleep 2.0
"${0:A:h}/rec.sh" stop
