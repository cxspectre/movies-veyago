# Shared settings for the footage capture scripts. Source this file.
export PV_SRC="$HOME/Developer/Apps/.pv-worktrees/v12"
export PV_DD="/tmp/pv-dd/film"
export FILM="$HOME/Developer/Apps/Provisum/Film"
export FOOTAGE="$FILM/public/footage"
# Raw (unencoded) recordings stay outside the film folder.
export RAW="/tmp/pv-film-raw"
export PHONE="761ABF75-A87D-4EDA-B7D4-5E1668CF210E"   # Provisum Film iPhone (iOS 27.0, iPhone 17 Pro)
export WATCH="FFBCBDAF-95C7-45C5-8353-04F6792098EB"   # Provisum Film Watch (watchOS 27.0, Series 11 46mm), paired
export BUNDLE="app.veyago.Provisum"
export WATCH_BUNDLE="app.veyago.Provisum.watchkitapp"
mkdir -p "$RAW"
