"""addclip.py '<json object>' : adds or replaces one entry (by id) in clips.json, then rebuilds
the manifest."""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
path = os.path.join(HERE, "clips.json")
clip = json.loads(sys.argv[1])
with open(path) as handle:
    clips = json.load(handle)
clips = [c for c in clips if c["id"] != clip["id"]] + [clip]
with open(path, "w") as handle:
    json.dump(clips, handle, indent=2)
subprocess.run([sys.executable, os.path.join(HERE, "manifest.py")], check=True)
