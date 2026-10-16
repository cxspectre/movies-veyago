#!/usr/bin/env bash
# fetch_samples.sh — download the CC0 sample folders the score uses (VSCO 2 Community Edition, ~620 MB).
# Source: https://github.com/sgossner/VSCO-2-CE (CC0 1.0), pinned to the commit below for reproducibility.
# Only data (WAV files and the licence) is fetched; nothing from it is executed.
set -euo pipefail

COMMIT="440300901dfe9275fd84e0b7763af1f8443ae62e"
HERE="$(cd "$(dirname "$0")" && pwd)"
DEST="$HERE/.vendor/vsco2ce"
FOLDERS=(
  "Keys/Upright Piano"
  "Keys/Upright Nr1"
  "Strings/Violin Section/susVib"
  "Strings/Viola Section/susvib"
  "Strings/Cello Section/susvib"
  "Strings/Solo Contrabass/SusNV"
)

if [ -f "$DEST/LICENSE" ] && [ -d "$DEST/Keys/Upright Piano" ]; then
  echo "samples already present in $DEST"
  exit 0
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
git clone --filter=blob:none --no-checkout https://github.com/sgossner/VSCO-2-CE.git "$TMP/repo"
git -C "$TMP/repo" sparse-checkout init --no-cone
{
  echo "/LICENSE"
  for f in "${FOLDERS[@]}"; do echo "/$f/"; done
} > "$TMP/repo/.git/info/sparse-checkout"
git -C "$TMP/repo" checkout "$COMMIT"
mkdir -p "$DEST"
cp "$TMP/repo/LICENSE" "$DEST/"
for f in "${FOLDERS[@]}"; do
  mkdir -p "$DEST/$f"
  cp -R "$TMP/repo/$f/." "$DEST/$f/"
done
echo "samples in $DEST"
