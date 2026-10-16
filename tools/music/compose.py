"""compose.py — deterministic score generator: builds every arrangement and writes its events.

Outputs per version: audio/music/events/<version>.json (the exact note events the renderer plays)
and audio/music/midi/<version>.mid (one track per part, 60 BPM, so the arrangement opens in any DAW).
Run: .venv/bin/python -I tools/music/compose.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import mido  # noqa: E402

import arr_master  # noqa: E402
import arr_teaser  # noqa: E402
import arr_vertical  # noqa: E402
from config import BPM, EVENTS_DIR, MIDI_DIR  # noqa: E402
from score import PARTS, Arrangement, validate  # noqa: E402

TICKS_PER_BEAT = 480
MIDI_PROGRAM = {"piano": 0, "violins": 48, "violas": 48, "celli": 48, "basses": 48, "pulse": 116, "pad": 89,
                "air": 122, "shimmer": 92}
BUILDERS = {"master": arr_master.build, "vertical": arr_vertical.build, "teaser": arr_teaser.build}


def build_all() -> dict:
    arrangements = {}
    for name, builder in BUILDERS.items():
        arr = builder()
        problems = validate(arr)
        if problems:
            raise ValueError(f"{name} arrangement is inconsistent:\n  " + "\n  ".join(problems[:20]))
        arrangements[name] = arr
    return arrangements


def to_ticks(seconds: float) -> int:
    return int(round(seconds * BPM / 60.0 * TICKS_PER_BEAT))


def write_midi(arr: Arrangement, path: Path) -> None:
    mid = mido.MidiFile(ticks_per_beat=TICKS_PER_BEAT)
    meta = mido.MidiTrack()
    meta.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    meta.append(mido.MetaMessage("time_signature", numerator=4, denominator=4, time=0))
    meta.append(mido.MetaMessage("track_name", name=f"Provided For - {arr.version}", time=0))
    mid.tracks.append(meta)
    for channel, part in enumerate(PARTS):
        notes = [x for x in arr.notes if x.part == part]
        if not notes:
            continue
        events = []
        for x in notes:
            key = max(0, min(127, x.key if part != "air" else 60))
            vel = max(1, min(127, int(round(x.vel * 127))))
            events.append((to_ticks(x.t), 1, key, vel))
            events.append((to_ticks(x.t + x.dur), 0, key, 0))
        events.sort(key=lambda e: (e[0], e[1]))
        track = mido.MidiTrack()
        track.append(mido.MetaMessage("track_name", name=part, time=0))
        ch = 9 if part == "pulse" else channel % 16
        track.append(mido.Message("program_change", program=MIDI_PROGRAM[part], channel=ch, time=0))
        now = 0
        for tick, on, key, vel in events:
            kind = "note_on" if on else "note_off"
            track.append(mido.Message(kind, note=key, velocity=vel, channel=ch, time=tick - now))
            now = tick
        mid.tracks.append(track)
    mid.save(path)


def main() -> dict:
    EVENTS_DIR.mkdir(parents=True, exist_ok=True)
    MIDI_DIR.mkdir(parents=True, exist_ok=True)
    arrangements = build_all()
    for name, arr in arrangements.items():
        (EVENTS_DIR / f"{name}.json").write_text(json.dumps(arr.to_json(), indent=0))
        write_midi(arr, MIDI_DIR / f"{name}.mid")
        print(f"{name:9s} {len(arr.notes):5d} notes, {arr.duration:6.1f} s, {len(arr.sync)} sync points")
    return arrangements


if __name__ == "__main__":
    main()
