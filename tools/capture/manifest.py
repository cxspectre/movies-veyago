"""Writes public/footage/manifest.json from tools/capture/clips.json (the metadata maintained by hand)
plus what ffprobe reads from each file (size, fps, duration).

    python3 manifest.py
"""
import json
import os
import subprocess
import struct

HERE = os.path.dirname(os.path.abspath(__file__))
FOOTAGE = os.path.normpath(os.path.join(HERE, "..", "..", "public", "footage"))


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height,avg_frame_rate:format=duration", "-of", "json", path],
                         capture_output=True, check=True, text=True).stdout
    data = json.loads(out)
    stream = data["streams"][0]
    num, den = stream["avg_frame_rate"].split("/")
    return {"width": stream["width"], "height": stream["height"],
            "fps": round(int(num) / int(den), 3), "durationSec": round(float(data["format"]["duration"]), 3)}


def png_size(path):
    with open(path, "rb") as handle:
        head = handle.read(24)
    w, h = struct.unpack(">II", head[16:24])
    return {"width": w, "height": h, "fps": None, "durationSec": None}


def entry(clip):
    file_path = os.path.join(FOOTAGE, clip["file"])
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"{clip['id']}: missing {clip['file']}")
    if clip.get("poster") and not os.path.exists(os.path.join(FOOTAGE, clip["poster"])):
        raise FileNotFoundError(f"{clip['id']}: missing poster {clip['poster']}")
    facts = probe(file_path) if clip["file"].endswith(".mp4") else png_size(file_path)
    keys = ["id", "file", "poster", "width", "height", "fps", "durationSec", "appearance", "feature",
            "sketchId", "hotStart", "hotEnd", "description", "howCaptured"]
    merged = {**{"poster": None, "sketchId": None, "hotStart": None, "hotEnd": None}, **clip, **facts}
    extra = {k: v for k, v in merged.items() if k not in keys}
    return {**{k: merged.get(k) for k in keys}, **extra}


def main():
    with open(os.path.join(HERE, "clips.json")) as handle:
        clips = json.load(handle)
    manifest = [entry(c) for c in clips]
    with open(os.path.join(FOOTAGE, "manifest.json"), "w") as handle:
        json.dump(manifest, handle, indent=2)
    print(f"{len(manifest)} entries -> {FOOTAGE}/manifest.json")


if __name__ == "__main__":
    main()
