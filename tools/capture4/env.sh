# settings for the v4 capture scripts (tools/capture4). Source this file.
export PV_SRC="/Users/cassiandrefke/Developer/Apps/.pv-worktrees/v12"
export PV_DD="/tmp/pv-dd/film"
export FILM="/Users/cassiandrefke/Developer/Apps/MoviesVeyago"
export FOOTAGE="$FILM/public/footage4"
# Raw (unencoded) recordings stay outside the film folder.
export RAW="/tmp/pv-film-raw4"
export PHONE="761ABF75-A87D-4EDA-B7D4-5E1668CF210E"   # Provisum Film iPhone (iOS 27.0, iPhone 17 Pro)
export WATCH="FFBCBDAF-95C7-45C5-8353-04F6792098EB"   # Provisum Film Watch (watchOS 27.0), paired
export BUNDLE="app.veyago.Provisum"
export PY="$FILM/.venv/bin/python"
mkdir -p "$RAW"
