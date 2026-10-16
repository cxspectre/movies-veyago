#!/bin/zsh
# rec-family.sh <raw name> : from Dad's binder home (staged family, launched with OB_DEMO_MEMBERS=1
# OB_USER_NAME="Maya Hughes"; Dad must be the selected binder), tap Family, hold on who joined
# (David co-manager, Claire viewer, Ruth invited), then a slow scroll to what's shared.
source "${0:A:h}/env.sh"
"${0:A:h}/rec.sh" start "$1"; sleep 2.0
axe tap -x 127 -y 636 --udid "$PHONE" >/dev/null; sleep 3.0
"${0:A:h}/swipe.sh" 200 640 200 420 2.5; sleep 1.8
"${0:A:h}/rec.sh" stop
