#!/bin/zsh
# Reproduce the VO toolchain: a Python 3.12 venv with Kokoro (kokoro-onnx), faster-whisper
# for word timings, and the Kokoro v1.0 model + voices from the kokoro-onnx GitHub release.
# Usage: tools/vo/setup.sh   (run from anywhere; installs into Film/.venv)
set -euo pipefail

FILM_DIR="${0:A:h:h:h}"
VENV="$FILM_DIR/.venv"
MODELS="$VENV/models"
RELEASE="https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0"
MODEL_SHA="7d5df8ecf7d4b1878015a32686053fd0eebe2bc377234608764cc0ef3636a6c5"
VOICES_SHA="bca610b8308e8d99f32e6fe4197e7ec01679264efed0cac9140fe9c29f1fbf7d"

command -v uv >/dev/null || HOMEBREW_NO_AUTO_UPDATE=1 brew install uv
[[ -d "$VENV" ]] || uv venv --python 3.12 "$VENV"
VIRTUAL_ENV="$VENV" uv pip install -r "$FILM_DIR/tools/vo/requirements.txt"

mkdir -p "$MODELS"
fetch() {
  local name=$1 sha=$2
  if [[ ! -f "$MODELS/$name" ]] || [[ "$(shasum -a 256 "$MODELS/$name" | cut -d' ' -f1)" != "$sha" ]]; then
    curl -fSL -o "$MODELS/$name" "$RELEASE/$name"
  fi
  [[ "$(shasum -a 256 "$MODELS/$name" | cut -d' ' -f1)" == "$sha" ]] || { echo "checksum mismatch: $name" >&2; exit 1; }
}
fetch kokoro-v1.0.onnx "$MODEL_SHA"
fetch voices-v1.0.bin "$VOICES_SHA"
echo "VO toolchain ready in $VENV (faster-whisper downloads its small.en model on first run)."
