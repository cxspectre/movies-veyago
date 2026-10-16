#!/bin/zsh
# Builds the Provisum 1.2 app (release/1.2 worktree, read-only) for the film iPhone simulator.
# The iOS build also builds the embedded ProvisumWatch app (watchsimulator).
source "${0:A:h}/env.sh"
cd "$PV_SRC" || exit 1
nice -n 10 xcodebuild -project "$PV_SRC/Provisum.xcodeproj" -scheme Provisum \
  -destination "platform=iOS Simulator,id=$PHONE" -derivedDataPath "$PV_DD" build CODE_SIGNING_ALLOWED=NO
