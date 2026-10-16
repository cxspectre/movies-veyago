#!/usr/bin/env bash
# render.sh — the one command that produces the whole score from code.
#   1. fetch the CC0 samples (once)       4. compose every arrangement (events JSON + MIDI)
#   2. measure every sample's pitch       5. render stems + premixed masters (48 kHz / 24-bit WAV)
#   3. compare the piano sources          6. measure everything and write audio/music/README.md tables
# Usage: tools/music/render.sh [master|vertical|teaser ...]     (default: all three)
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
FILM="$(cd "$HERE/../.." && pwd)"
PY="$FILM/.venv/bin/python"

if [ ! -x "$PY" ]; then
  echo "Missing $PY. Create it: uv venv $FILM/.venv && uv pip install --python $PY numpy scipy soundfile pyloudnorm matplotlib mido" >&2
  exit 1
fi
command -v ffmpeg >/dev/null || { echo "ffmpeg is required (brew install ffmpeg)" >&2; exit 1; }

"$HERE/fetch_samples.sh"
nice -n 10 "$PY" -I "$HERE/verify_banks.py"
nice -n 10 "$PY" -I "$HERE/evaluate_sources.py"
nice -n 10 "$PY" -I "$HERE/render.py" "$@"
nice -n 10 "$PY" -I "$HERE/analyze.py" "$@"
nice -n 10 "$PY" -I "$HERE/readme.py"
