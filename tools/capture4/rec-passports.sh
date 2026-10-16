#!/bin/zsh
# rec-passports.sh <raw name> : Family IDs (OB_OPEN_ROUTE=ids) with Leo's and Mia's passports
# (stage-passports.sh): hold on the list, open Leo's passport, slow scroll to its reminders.
source "${0:A:h}/env.sh"
"${0:A:h}/rec.sh" start "$1"; sleep 2.5
axe tap -x 194 -y 303 --udid "$PHONE" >/dev/null; sleep 2.2
"${0:A:h}/swipe.sh" 200 700 200 330 2.5; sleep 1.8
"${0:A:h}/rec.sh" stop
