"""readme.py — writes audio/music/README.md from README.template.md plus the measured reports.

Every number in the README's tables comes from audio/music/analysis/*.json (written by analyze.py and
render.py), so the README cannot drift from the audio. Placeholders: {{SOURCES}}, {{CALIBRATION}},
{{LOUDNESS}}, {{KEYS}}, {{LIFTS}}, {{SYNC:<version>}}, {{CHART:<version>}}.
Run: .venv/bin/python -I tools/music/readme.py
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import ANALYSIS_DIR, EVENTS_DIR, OUT_DIR, VERSIONS  # noqa: E402

TEMPLATE = Path(__file__).resolve().parent / "README.template.md"
ROMAN = {"Db": "I", "Eb": "ii", "F": "iii", "Gb": "IV", "Ab": "V", "Bb": "vi", "C": "vii"}


def mmss(t: float) -> str:
    return f"{int(t // 60)}:{t % 60:04.1f}" if t % 1 else f"{int(t // 60)}:{int(t % 60):02d}"


def read(name: str) -> dict:
    return json.loads((ANALYSIS_DIR / name).read_text())


def measured_text(s: dict) -> str:
    method = s["method"].split(":")[0]
    if method == "silence":
        return f"{s['nonzero_samples']} non-zero samples to {mmss(float(s['method'].split(':')[1]))} (peak {s['peak_dbfs']} dBFS)"
    if method == "quiet":
        return f"loudest 0.4 s {s['max_rms_dbfs_window']} dBFS vs {s['max_rms_dbfs_before']} dBFS before"
    if method == "lastsound":
        return f"last sample above 1 LSB at {s['measured']:.4f} s ({s['rms_dbfs_100ms_before']} dBFS RMS just before)"
    if method == "entry":
        return f"first sample above 1 LSB at {s['measured']:.4f} s"
    if method == "drop":
        return (f"clean cut at the target; level falls {s['drop_db']} dB ({s['before_dbfs']} -> {s['after_dbfs']} dBFS) and "
                f"passes its midpoint at {s['measured']:.3f} s, after the held note's own attack")
    if method == "silentafter":
        return f"below -60 dBFS from {s['measured']:.3f} s"
    if method == "crest":
        return f"crest at {s['measured']:.3f} s ({s['level_dbfs']} dBFS)"
    return f"{s['measured']:.4f} s (salience {s.get('salience')})"


def sync_table(version: str) -> str:
    rows = ["| Sync point | Target | Proved in | Method | Measured | Error | Pass |", "|---|---|---|---|---|---|---|"]
    for s in read(f"{version}_report.json")["sync"]:
        err = "" if s["error_ms"] is None else f"{s['error_ms']:+.1f} ms"
        rows.append(f"| {s['label']} | {mmss(s['t'])} ({s['t']:.1f} s) | {s['stem']} | {s['method'].split(':')[0]} | "
                    f"{measured_text(s)} | {err} | {'yes' if s['pass'] else '**NO**'} |")
    return "\n".join(rows)


def loudness_table() -> str:
    rows = ["| Version | File | Integrated | LRA | True peak |", "|---|---|---|---|---|"]
    for version in VERSIONS:
        for name, m in read(f"{version}_report.json")["loudness"].items():
            rows.append(f"| {version} | music-{version}-{name}.wav | {m['integrated_lufs']} LUFS | {m['lra_lu']} LU | {m['true_peak_dbtp']} dBTP |")
    return "\n".join(rows)


def keys_table() -> str:
    rows = ["| Version | Section (s) | Estimated key (r) | Runner-up (r) | Tuning vs A440 |", "|---|---|---|---|---|"]
    for version in VERSIONS:
        for k in read(f"{version}_report.json")["keys"]:
            rows.append(f"| {version} | {k['section']} | {k['key']} ({k['r']}) | {k['runner_up']} ({k['runner_up_r']}) | {k['tuning_cents']:+.1f} cents |")
    return "\n".join(rows)


def lifts_table() -> str:
    rows = ["| Window (s) | Piano onsets/s in the score | Measured (spectral flux, approximate) |", "|---|---|---|"]
    for lift in read("master_report.json")["lift_onset_rates"]:
        rows.append(f"| {lift['window']} | {lift['score_onsets_per_s']} | {lift['measured_onsets_per_s']} |")
    return "\n".join(rows)


def sources_table() -> str:
    data = read("source_evaluation.json")
    cols = list(next(iter(data.values())).keys())
    rows = ["| Candidate | " + " | ".join(cols) + " |", "|---" * (len(cols) + 1) + "|"]
    rows += [f"| {name} | " + " | ".join(str(r[c]) for c in cols) + " |" for name, r in data.items()]
    return "\n".join(rows)


def chart_table(version: str) -> str:
    chart = json.loads((EVENTS_DIR / f"{version}.json").read_text())["chart"]
    rows = ["| Time | Chord | Function | Section |", "|---|---|---|---|"]
    for t, sym, section in chart:
        root = re.match(r"[A-G]b?", sym)
        func = ROMAN.get(root.group(0), "") if root and not sym.startswith(("silence",)) and "single" not in sym and "pedal" not in sym else ""
        rows.append(f"| {mmss(float(t))} | {sym} | {func} | {section} |")
    return "\n".join(rows)


def calibration() -> str:
    lat = read("master_report.json")["onset_detector_latency_s"]
    return ", ".join(f"{k} {v * 1000:+.1f} ms" for k, v in lat.items())


def main() -> None:
    text = TEMPLATE.read_text()
    text = text.replace("{{SOURCES}}", sources_table()).replace("{{LOUDNESS}}", loudness_table())
    text = text.replace("{{KEYS}}", keys_table()).replace("{{LIFTS}}", lifts_table()).replace("{{CALIBRATION}}", calibration())
    for version in VERSIONS:
        text = text.replace(f"{{{{SYNC:{version}}}}}", sync_table(version)).replace(f"{{{{CHART:{version}}}}}", chart_table(version))
    for version in VERSIONS:
        r = read(f"{version}_report.json")
        text = text.replace(f"{{{{PASS:{version}}}}}", f"{sum(s['pass'] for s in r['sync'])}/{len(r['sync'])}")
        text = text.replace(f"{{{{SUMERR:{version}}}}}", f"{r['stems_sum_vs_mix_max_abs']:.1e}")
    leftover = re.findall(r"\{\{[^}]+\}\}", text)
    if leftover:
        raise ValueError(f"Unfilled placeholders: {leftover}")
    (OUT_DIR / "README.md").write_text(text)
    print(f"wrote {OUT_DIR / 'README.md'}")


if __name__ == "__main__":
    main()
