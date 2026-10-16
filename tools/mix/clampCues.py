"""Clamp stroke 'pressure' into the foley renderer's [0, 1] range (a sketch may ask for 1.3 to mean 'harder').
usage: python3 tools/mix/clampCues.py cues.json [cues.json ...]   (edits the files in place)"""
import json
import sys

for path in sys.argv[1:]:
    with open(path) as f:
        sheet = json.load(f)
    clamped = 0
    for cue in sheet["cues"]:
        p = cue.get("pressure")
        if isinstance(p, (int, float)) and not 0 <= p <= 1:
            cue["pressure"] = min(1.0, max(0.0, p))
            clamped += 1
    with open(path, "w") as f:
        json.dump(sheet, f, indent=1)
        f.write("\n")
    print(f"{path}: clamped {clamped} pressure value(s)")
