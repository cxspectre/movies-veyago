#!/usr/bin/env bash
# render.sh — the one command that produces the whole v4 score from code (deterministic: seeded, no clock).
#   1. compose the eleven chapters (events JSON + MIDI)      4. a quick-look picture
#   2. render, mix and write the 600 s master + chapters      5. re-arrange and render HOOK_75 and CUT_180
#   3. measure everything (sync, zeros, loudness, keys)       6. write audio/v4/music/README.md
# Needs the v1 samples (tools/music/.vendor, fetched by tools/music/fetch_samples.sh) and the v1 pitch report
# (audio/music/analysis/bank_pitch.json); both are produced by tools/music/render.sh.
set -euo pipefail
export PYTHONDONTWRITEBYTECODE=1  # never write caches into the v1 tools folder

HERE="$(cd "$(dirname "$0")" && pwd)"
FILM="$(cd "$HERE/../.." && pwd)"
PY="$FILM/.venv/bin/python"

[ -x "$PY" ] || { echo "Missing $PY (see tools/music/render.sh for the venv)" >&2; exit 1; }
command -v ffmpeg >/dev/null || { echo "ffmpeg is required (brew install ffmpeg)" >&2; exit 1; }
[ -d "$FILM/tools/music/.vendor/vsco2ce" ] || "$FILM/tools/music/fetch_samples.sh"

nice -n 10 "$PY" -I "$HERE/render4.py"
nice -n 10 "$PY" -I "$HERE/analyze4.py"
nice -n 10 "$PY" -I "$HERE/plots4.py"
nice -n 10 "$PY" -I "$HERE/edits4_music.py"
nice -n 10 "$PY" -I "$HERE/readme4.py"
