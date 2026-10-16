#!/bin/zsh
# rec-friend.sh <raw name> : Sam's binder (staged: stage-family.sh + stage-sam-papers.sh), light, on
# Documents (OB_INITIAL_TAB=documents, Sam selected): hold on the list (Flat lease, Car registration),
# open the car registration, hold, back.
source "${0:A:h}/env.sh"
"${0:A:h}/rec.sh" start "$1"; sleep 2.5
axe tap -x 194 -y 553 --udid "$PHONE" >/dev/null; sleep 3.2
axe tap -x 38 -y 80 --udid "$PHONE" >/dev/null; sleep 2.0
"${0:A:h}/rec.sh" stop
