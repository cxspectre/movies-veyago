#!/bin/zsh
# Launches Provisum on the film iPhone with DEBUG launch hooks.
#   launch.sh [--fresh] [--] OB_KEY=value ... [-- app args...]
# --fresh: uninstall + reinstall the build first and add OB_RESET=1 (clean stores and settings).
# Every OB_KEY=value is passed to the app as SIMCTL_CHILD_OB_KEY=value. Arguments after a second
# "--" go to the app itself (e.g. -AppleLocale en_BE -AppleLanguages "(en)").
source "${0:A:h}/env.sh"
APP="$PV_DD/Build/Products/Debug-iphonesimulator/Provisum.app"
fresh=0
envs=()
appargs=()
inargs=0
for a in "$@"; do
  if [[ $inargs == 1 ]]; then appargs+=("$a"); continue; fi
  case "$a" in
    --fresh) fresh=1 ;;
    --) inargs=1 ;;
    OB_*=*) envs+=("SIMCTL_CHILD_$a") ;;
    *) echo "launch.sh: unknown argument $a" >&2; exit 2 ;;
  esac
done
xcrun simctl terminate "$PHONE" "$BUNDLE" 2>/dev/null
if [[ $fresh == 1 ]]; then
  xcrun simctl uninstall "$PHONE" "$BUNDLE" || { echo "uninstall failed" >&2; exit 1; }
  xcrun simctl install "$PHONE" "$APP" || { echo "install failed" >&2; exit 1; }
  envs+=("SIMCTL_CHILD_OB_RESET=1")
fi
# Keep the status bar clean on every launch (an override can be dropped by a reboot).
xcrun simctl status_bar "$PHONE" override --time 9:41 --batteryState charged --batteryLevel 100 \
  --cellularBars 4 --wifiBars 3 --dataNetwork wifi --operatorName "" >/dev/null
env "${envs[@]}" xcrun simctl launch "$PHONE" "$BUNDLE" "${appargs[@]}"
