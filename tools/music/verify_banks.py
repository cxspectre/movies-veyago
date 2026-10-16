"""verify_banks.py — measure the real pitch of every sample and check the file-name key mapping.

Writes audio/music/analysis/bank_pitch.json: per bank, the octave offset that makes names match
measured pitch, and the residual tuning (cents) per zone that the sampler then corrects.
Run: .venv/bin/python -I tools/music/verify_banks.py
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import numpy as np  # noqa: E402

from config import ANALYSIS_DIR  # noqa: E402
from samples import BANKS, estimate_f0, hz_to_midi, list_zones, load_zone_audio, midi_to_hz  # noqa: E402

WINDOW = {"upright_player": (0.15, 0.8), "upright_nr1": (0.15, 0.8)}
DEFAULT_WINDOW = (1.0, 2.0)  # strings: past the bow attack
OUTLIER_CENTS = 40.0


def measure_bank(name: str) -> dict:
    spec = BANKS[name]
    start, length = WINDOW.get(name, DEFAULT_WINDOW)
    rows = []
    for zone in list_zones(spec):
        audio = load_zone_audio(zone.path)
        nominal_hz = midi_to_hz(zone.key)
        f0 = estimate_f0(audio, start, length, fmin=nominal_hz / 2.6, fmax=nominal_hz * 2.6)
        rows.append({"file": zone.path.name, "key": zone.key, "layer": zone.layer, "f0": round(f0, 2),
                     "deviation_semitones": round(float(hz_to_midi(f0) - zone.key), 3)})
    devs = np.array([r["deviation_semitones"] for r in rows])
    octave_shift = int(np.round(np.median(devs) / 12))
    # HPS can lock onto the octave above/below on very low or very high piano notes; fold those
    # measurement errors back, then flag anything still more than OUTLIER_CENTS out of tune.
    folded_cents = (((devs - 12 * octave_shift) + 6) % 12 - 6) * 100
    good = np.abs(folded_cents) < OUTLIER_CENTS
    tuned = [{**r, "residual_cents": round(float(c), 1)} for r, c in zip(rows, folded_cents)]
    return {"octave_shift": octave_shift, "zones": len(rows),
            "median_residual_cents": round(float(np.median(folded_cents[good])), 1) if good.any() else None,
            "outliers": [r for r, ok in zip(tuned, good) if not ok], "rows": tuned}


def main() -> None:
    ANALYSIS_DIR.mkdir(parents=True, exist_ok=True)
    report = {name: measure_bank(name) for name in BANKS}
    (ANALYSIS_DIR / "bank_pitch.json").write_text(json.dumps(report, indent=1))
    for name, r in report.items():
        print(f"{name:16s} zones={r['zones']:3d} octave_shift={r['octave_shift']:+d} "
              f"median_residual={r['median_residual_cents']} cents outliers={len(r['outliers'])}")
        for o in r["outliers"][:6]:
            print("   outlier", o["file"], o["key"], o["f0"], o["deviation_semitones"])


if __name__ == "__main__":
    main()
