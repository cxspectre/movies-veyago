#!/bin/zsh
# checkRules.sh — mechanical checks for the "Provided For" film (CONTRACT.md section 1).
#
# Run from anywhere: it resolves the Film/ root from its own location.
#   FAILS (exit 1):  the predecessor product name (any case) anywhere in the film's text files;
#                    Apple logo glyph U+F8FF; Apple typeface names (SF Pro, SFPro, San Francisco,
#                    SF Symbols, New York used as a font) in src/, public/fonts and CSS only.
#   WARNS (exit 0):  the avoid-words list (receipt, warranty, claim, proof, archive, timeline,
#                    scanner, life admin) in on-screen copy. Warnings never fail the run.
#
# Every sensitive literal is assembled from pieces below, so this file never contains the
# forbidden strings itself. This script is excluded from its own scan for the same reason.
set -u

root="${0:A:h:h}"
self="${0:t}"

# Assembled pieces (see header). Do not write these words out whole in this file.
identity_word="k""ept"
apple_typefaces=("SF ""Pro" "SF""Pro" "San ""Francisco" "SF ""Symbols")
apple_font_word="New ""York"
avoid_words=("receipt" "warranty" "claim" "proof" "archive" "timeline" "scanner")
avoid_phrase="life admin"

# Text locations to scan (identity check). Binary files are skipped by grep -I.
scan_targets=("$root/src" "$root/docs" "$root/tools" "$root/public" "$root/CONTRACT.md")
excludes=(--exclude-dir=node_modules --exclude-dir=.venv --exclude-dir=out
          --exclude-dir=.git --exclude="$self")

# Files that state the forbidden words as the rule itself: exempt from the Apple and
# avoid-word checks (identity is still scanned everywhere).
rule_docs=("$root/CONTRACT.md" "$root/docs/INVENTORY.md")
rule_excludes=(--exclude=CONTRACT.md --exclude=INVENTORY.md)

# On-screen copy lives in these folders; avoid-words are only warned on there.
copy_targets=("$root/src/scenes" "$root/src/sketches" "$root/src/glass" "$root/src/devices")

existing_targets() {
  for t in "${scan_targets[@]}"; do
    [[ -e "$t" ]] && print -r -- "$t"
  done
}

targets=("${(@f)$(existing_targets)}")
fail=0

# Typeface check scope (CONTRACT section 12, item 9): type is only set in src/, public/fonts and
# CSS. Documentation and manifest descriptions that merely name the typeface are exempt.
typeface_targets=()
for t in "$root/src" "$root/public/fonts"; do
  [[ -e "$t" ]] && typeface_targets+=("$t")
done
typeface_targets+=(${(f)"$(find "$root" -name '*.css' -not -path '*/node_modules/*' -not -path '*/out/*' -not -path '*/.git/*' 2>/dev/null)"})

# --- 1. Identity (fails) -----------------------------------------------------
identity_hits=$(grep -rniI "${excludes[@]}" -e "$identity_word" "${targets[@]}" 2>/dev/null)
if [[ -n "$identity_hits" ]]; then
  print -r -- "FAIL identity: predecessor product name found:"
  print -r -- "$identity_hits"
  fail=1
else
  print -r -- "ok   identity: clean"
fi

# --- 2. Apple logo glyph U+F8FF (fails) -------------------------------------
# UTF-8 bytes of U+F8FF are EF A3 BF.
apple_logo_hits=$(LC_ALL=C grep -rlI "${excludes[@]}" "${rule_excludes[@]}" -e $'\xef\xa3\xbf' "${targets[@]}" 2>/dev/null)
if [[ -n "$apple_logo_hits" ]]; then
  print -r -- "FAIL apple: U+F8FF logo glyph in:"
  print -r -- "$apple_logo_hits"
  fail=1
else
  print -r -- "ok   apple logo glyph: clean"
fi

# --- 3. Apple typeface names (fail) ------------------------------------------
for face in "${apple_typefaces[@]}"; do
  face_hits=$(grep -rniI "${excludes[@]}" "${rule_excludes[@]}" -F -e "$face" "${typeface_targets[@]}" 2>/dev/null)
  if [[ -n "$face_hits" ]]; then
    print -r -- "FAIL apple typeface \"$face\":"
    print -r -- "$face_hits"
    fail=1
  fi
done

# "New York" fails only when the same line talks about a font; a bare place name is not a hit.
ny_hits=$(grep -rniI "${excludes[@]}" "${rule_excludes[@]}" -F -e "$apple_font_word" "${typeface_targets[@]}" 2>/dev/null \
  | grep -i -E "font|typeface" || true)
if [[ -n "$ny_hits" ]]; then
  print -r -- "FAIL apple typeface \"$apple_font_word\" (font context):"
  print -r -- "$ny_hits"
  fail=1
fi
[[ $fail -eq 0 ]] && print -r -- "ok   apple typefaces: clean"

# --- 4. Avoid-words in on-screen copy (warnings only) ------------------------
warn_targets=()
for t in "${copy_targets[@]}"; do
  [[ -e "$t" ]] && warn_targets+=("$t")
done
warn_count=0
for word in "${avoid_words[@]}" "$avoid_phrase"; do
  hits=$(grep -rniI -w "${excludes[@]}" -e "$word" "${warn_targets[@]}" 2>/dev/null || true)
  if [[ -n "$hits" ]]; then
    count=$(print -r -- "$hits" | wc -l | tr -d ' ')
    warn_count=$(( warn_count + count ))
    print -r -- "WARN avoid-word \"$word\" ($count line(s)):"
    print -r -- "$hits" | head -n 20
  fi
done
print -r -- "warnings: $warn_count line(s) for the avoid-words list (non-fatal)"

if [[ $fail -ne 0 ]]; then
  print -r -- "checkRules: FAILED"
  exit 1
fi
print -r -- "checkRules: passed (identity and Apple checks clean)"
exit 0
