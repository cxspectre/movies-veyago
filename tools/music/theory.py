"""theory.py — pitches, chords and voice leading for the score (key of D-flat major).

Chords are written as symbols ("Gbmaj9", "Db/F", "Absus4") and voiced by `lead`, which picks the
voicing of the chord's pitch classes inside a register that moves the fewest semitones from the
previous voicing. Voice leading is therefore a property of the generator, not of luck.
"""
from __future__ import annotations

import itertools
import re
from dataclasses import dataclass

PCS = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
QUALITIES = {
    "": (0, 4, 7),
    "add9": (0, 4, 7, 14),
    "6": (0, 4, 7, 9),
    "maj7": (0, 4, 7, 11),
    "maj9": (0, 4, 7, 11, 14),
    "maj7#11": (0, 4, 7, 11, 18),
    "m": (0, 3, 7),
    "m7": (0, 3, 7, 10),
    "m9": (0, 3, 7, 10, 14),
    "madd9": (0, 3, 7, 14),
    "sus4": (0, 5, 7),
    "7sus4": (0, 5, 7, 10),
    "sus2": (0, 2, 7),
}


def pc_of(name: str) -> int:
    base = PCS[name[0]]
    accidental = name[1:]
    return (base + accidental.count("#") - accidental.count("b")) % 12


def n(name: str) -> int:
    """'Db4' -> 61 (C4 = 60)."""
    match = re.fullmatch(r"([A-G](?:#|b)?)(-?\d)", name)
    if not match:
        raise ValueError(f"Bad note name {name!r}")
    letter, octave = match.groups()
    base = PCS[letter[0]] + (1 if "#" in letter else 0) - (1 if letter.endswith("b") and len(letter) > 1 else 0)
    return 12 * (int(octave) + 1) + base


def ns(names: str) -> tuple:
    return tuple(n(x) for x in names.split())


@dataclass(frozen=True)
class Chord:
    symbol: str
    root: int  # pitch class
    bass: int  # pitch class of the lowest note
    tones: tuple  # pitch classes, root first


def chord(symbol: str) -> Chord:
    match = re.fullmatch(r"([A-G](?:#|b)?)([a-z0-9#]*)(?:/([A-G](?:#|b)?))?", symbol)
    if not match:
        raise ValueError(f"Bad chord symbol {symbol!r}")
    root_name, quality, bass_name = match.groups()
    if quality not in QUALITIES:
        raise ValueError(f"Unknown chord quality {quality!r} in {symbol!r}")
    root = pc_of(root_name)
    tones = tuple(dict.fromkeys((root + i) % 12 for i in QUALITIES[quality]))
    bass = pc_of(bass_name) if bass_name else root
    return Chord(symbol, root, bass, tones)


def bass_note(c: Chord, lo: int, hi: int) -> int:
    """The chord's bass pitch class placed in [lo, hi] (lowest fit)."""
    for key in range(lo, hi + 1):
        if key % 12 == c.bass:
            return key
    raise ValueError(f"No {c.symbol} bass in range {lo}-{hi}")


def _candidates(c: Chord, voices: int, lo: int, hi: int):
    keys = [k for k in range(lo, hi + 1) if k % 12 in c.tones]
    for combo in itertools.combinations(keys, voices):
        pcs = {k % 12 for k in combo}
        if len(pcs) < min(voices, len(c.tones)) - (1 if voices < len(c.tones) else 0):
            continue
        if combo[-1] - combo[0] > 17 or any(b - a < 1 for a, b in zip(combo, combo[1:])):
            continue
        yield combo


def lead(prev: tuple | None, c: Chord, voices: int = 4, lo: int = 55, hi: int = 72) -> tuple:
    """Voicing of `c` with `voices` notes in [lo, hi] that moves least from `prev`.

    Must contain the chord's third (or its suspension) so the quality is heard; avoids the bass pitch
    class doubled at the bottom of the voicing (muddy) unless the chord has fewer tones than voices.
    """
    thirds = {t for t in c.tones if (t - c.root) % 12 in (3, 4)}
    colour = thirds or {t for t in c.tones if (t - c.root) % 12 in (2, 5)}
    sevenths = {t for t in c.tones if (t - c.root) % 12 in (10, 11)}
    best, best_cost = None, None
    for combo in _candidates(c, voices, lo, hi):
        pcs = {k % 12 for k in combo}
        if colour and not (colour & pcs):
            continue
        if prev is None:
            cost = abs(sum(combo) / voices - (lo + hi) / 2)
        else:
            cost = sum(abs(a - b) for a, b in zip(combo, sorted(prev)))
        cost += 0.6 * sum(1 for a, b in zip(combo, combo[1:]) if b - a <= 1)  # semitone rubs
        cost += 1.5 * (voices - len(pcs)) if len(c.tones) >= voices else 0.0  # doubled tones waste a voice
        cost += 1.0 if sevenths and not (sevenths & pcs) else 0.0  # the seventh names the chord; prefer voicings that hold it
        if best_cost is None or cost < best_cost:
            best, best_cost = combo, cost
    if best is None:
        raise ValueError(f"No voicing for {c.symbol} with {voices} voices in {lo}-{hi}")
    return best


def name_of(key: int) -> str:
    names = ("C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B")
    return f"{names[key % 12]}{key // 12 - 1}"
