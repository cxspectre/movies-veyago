"""compose4.py — builds the eleven chapter scores, checks them, writes the events JSON and one MIDI file.

events/master.json: per chapter its local events, zero windows, sync points and chord chart, plus its master
offset. midi/master.mid: one track per part in master time at 60 BPM, with a time-signature change wherever a
chapter's last bar is shortened, so every chapter starts on a downbeat in a DAW too.
Run: .venv/bin/python -I tools/music4/compose4.py
"""
from __future__ import annotations

import json

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import conf4  # noqa: F401,E402
import mido

import ch_a
import ch_b
import ch_c
import ch_d
from conf4 import BAR_BEATS, BPM, CHAPTER_LENGTH, CHAPTER_START, CHAPTERS, EVENTS_DIR, MIDI_DIR, check_slots
from score4 import PARTS4, shift, validate

TICKS_PER_BEAT = 480
PROGRAM = {"piano": 0, "violins": 48, "violas": 48, "celli": 48, "basses": 48, "pulse": 116, "wood": 115, "pad": 89, "air": 122,
           "shimmer": 92}
BUILDERS = {**ch_a.BUILDERS, **ch_b.BUILDERS, **ch_c.BUILDERS, **ch_d.BUILDERS}


def build_all() -> dict:
    check_slots()
    scores = {}
    for cid, _, _, _ in CHAPTERS:
        cs = BUILDERS[cid]()
        if abs(cs.length - CHAPTER_LENGTH[cid]) > 1e-9:
            raise ValueError(f"{cid}: score is {cs.length} s, the slot is {CHAPTER_LENGTH[cid]} s")
        problems = validate(cs)
        if problems:
            raise ValueError("\n  ".join(("inconsistent score:",) + problems[:20]))
        scores[cid] = cs
    return scores


def ticks(seconds: float) -> int:
    return int(round(seconds * BPM / 60.0 * TICKS_PER_BEAT))


def meter_track() -> mido.MidiTrack:
    """Tempo, a marker per chapter and a time signature wherever the bar length changes."""
    events = []
    current = None
    for cid, number, start, end in CHAPTERS:
        events.append((ticks(start), 0, mido.MetaMessage("marker", text=f"{number} {cid}", time=0)))
        t = start
        while t < end - 1e-9:
            beats = int(min(BAR_BEATS, end - t))
            if beats != current:
                events.append((ticks(t), 1, mido.MetaMessage("time_signature", numerator=beats, denominator=4, time=0)))
                current = beats
            t += beats
    track = mido.MidiTrack([mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0),
                            mido.MetaMessage("track_name", name="Provided For v4 - master", time=0)])
    now = 0
    for tick, _, msg in sorted(events, key=lambda e: (e[0], e[1])):
        track.append(msg.copy(time=tick - now))
        now = tick
    return track


def write_midi(scores: dict, path) -> None:
    mid = mido.MidiFile(ticks_per_beat=TICKS_PER_BEAT)
    mid.tracks.append(meter_track())
    notes = tuple(x for cid, cs in scores.items() for x in shift(cs.notes, CHAPTER_START[cid]))
    for channel, part in enumerate(PARTS4):
        events = []
        for x in (y for y in notes if y.part == part):
            key = max(0, min(127, 60 if part == "air" else x.key))
            vel = max(1, min(127, int(round(x.vel * 127))))
            events += [(ticks(x.t), 1, key, vel), (ticks(x.t + x.dur), 0, key, 0)]
        if not events:
            continue
        events.sort(key=lambda e: (e[0], e[1]))
        ch = 9 if part in ("pulse", "wood") else channel % 16
        track = mido.MidiTrack([mido.MetaMessage("track_name", name=part, time=0),
                                mido.Message("program_change", program=PROGRAM[part], channel=ch, time=0)])
        now = 0
        for tick, on, key, vel in events:
            track.append(mido.Message("note_on" if on else "note_off", note=key, velocity=vel, channel=ch, time=tick - now))
            now = tick
        mid.tracks.append(track)
    mid.save(path)


def events_json(scores: dict) -> dict:
    return {"bpm": BPM, "meter": "4/4, bar lines every 4 s from each chapter start; a chapter's last bar is shortened",
            "chapters": [{**cs.to_json(), "master_start": CHAPTER_START[cid]} for cid, cs in scores.items()]}


def main() -> dict:
    EVENTS_DIR.mkdir(parents=True, exist_ok=True)
    MIDI_DIR.mkdir(parents=True, exist_ok=True)
    scores = build_all()
    (EVENTS_DIR / "master.json").write_text(json.dumps(events_json(scores)))
    write_midi(scores, MIDI_DIR / "master.mid")
    for cid, cs in scores.items():
        print(f"  {cid:14s} {len(cs.notes):5d} notes  {cs.length:5.1f} s  {len(cs.sync):2d} sync points")
    return scores


if __name__ == "__main__":
    main()
