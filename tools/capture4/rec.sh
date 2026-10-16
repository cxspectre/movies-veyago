#!/bin/zsh
# rec.sh start <name> [phone|watch]   starts an H.264 screen recording to $RAW/<name>.mov
# rec.sh stop                          stops it (SIGINT so the file is finalised)
source "${0:A:h}/env.sh"
PIDFILE="$RAW/.rec.pid"
case "$1" in
  start)
    dev="$PHONE"; [[ "$3" == watch ]] && dev="$WATCH"
    rm -f "$RAW/$2.mov"
    xcrun simctl io "$dev" recordVideo --codec=h264 --force "$RAW/$2.mov" >"$RAW/$2.rec.log" 2>&1 &
    echo $! > "$PIDFILE"
    # Wait until the recorder reports it has started (it prints "Recording started").
    for i in {1..40}; do grep -q "started" "$RAW/$2.rec.log" 2>/dev/null && break; sleep 0.25; done
    echo "recording $2 (pid $(cat $PIDFILE))"
    ;;
  stop)
    pid=$(cat "$PIDFILE" 2>/dev/null) || { echo "no recording" >&2; exit 1; }
    kill -INT "$pid" 2>/dev/null
    while kill -0 "$pid" 2>/dev/null; do sleep 0.2; done
    rm -f "$PIDFILE"
    echo "stopped"
    ;;
  *) echo "usage: rec.sh start <name> [phone|watch] | stop" >&2; exit 2 ;;
esac
