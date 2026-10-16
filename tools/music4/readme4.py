"""readme4.py — writes audio/v4/music/README.md from the measured reports (so every number in it is measured).
Run: .venv/bin/python -I tools/music4/readme4.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import conf4  # noqa: F401,E402

from conf4 import ANALYSIS_DIR, CHAPTERS, EVENTS_DIR, OUT_DIR  # noqa: E402

TEXT = Path(__file__).resolve().parent / "README.template.md"


def mmss(t: float) -> str:
    whole = int(t)
    frac = t - whole
    return f"{whole // 60}:{whole % 60:02d}" + (f"{frac:.3f}"[1:].rstrip("0") if frac > 1e-9 else "")


def table(header: tuple, rows: list) -> str:
    out = ["| " + " | ".join(header) + " |", "|" + "---|" * len(header)]
    out += ["| " + " | ".join(str(c) for c in r) + " |" for r in rows]
    return "\n".join(out)


def sync_table(report: dict) -> str:
    rows = []
    for s in report["sync"]:
        method = s["method"].split(":")[0]
        if method == "zero":
            measured = f"{sum(s['nonzero_samples'].values())} non-zero samples (mix + 4 stems)"
        elif method == "quiet":
            measured = f"max {s['max_rms_dbfs_window']} dBFS vs {s['max_rms_dbfs_before']} before"
        else:
            measured = f"{s['measured']:.3f}" if isinstance(s.get("measured"), (int, float)) else str(s.get("measured"))
        rows.append((s["label"], mmss(s["t"]), s["stem"], method, measured, s.get("error_ms", ""), "pass" if s["pass"] else "FAIL"))
    return table(("Bible sync point (chapter/local s)", "Master", "Stem", "Method", "Measured (s)", "Error ms", ""), rows)


def chart_tables(events: dict) -> str:
    parts = []
    for c in events["chapters"]:
        rows = [(mmss(c["master_start"] + t), f"{t:g}", sym, fn) for t, sym, fn in c["chart"]]
        parts.append(f"**{c['chapter']}** (master {mmss(c['master_start'])})\n\n" + table(("Master", "Local", "Chord", "Function"), rows))
    return "\n\n".join(parts)


def loudness_table(report: dict, render: dict, edits: dict) -> str:
    rows = [(f"master {k}", v["integrated_lufs"], v["true_peak_dbtp"], v["lra_lu"]) for k, v in report["loudness"].items()]
    rows += [(f"chapter {c['chapter']}", c["integrated_lufs"], c["true_peak_dbtp"], c["lra_lu"]) for c in report["chapters"]]
    for name, r in edits.items():
        rows.append((f"{name} mix", r["loudness"]["integrated_lufs"], r["loudness"]["true_peak_dbtp"], r["loudness"]["lra_lu"]))
        rows += [(f"{name} {s}", "", tp, "") for s, tp in r["stem_true_peaks"].items()]
    return table(("File", "Integrated LUFS", "True peak dBTP", "LRA LU"), rows)


def zero_table(report: dict, edits: dict) -> str:
    rows = [(r["label"], mmss(r["t"]), r["method"].split(":")[1], sum(r["nonzero_samples"].values()), "pass" if r["pass"] else "FAIL")
            for r in report["zero_windows"]]
    for name, e in edits.items():
        rows += [(f"{name}: {z['label']}", f"{z['start']:.3f}", f"{z['end']:.3f}", z["nonzero_samples"], "pass" if z["nonzero_samples"] == 0 else "FAIL")
                 for z in e["zero_windows"]]
    return table(("Window", "From", "To (s)", "Non-zero samples", ""), rows)


def edit_tables(edits: dict) -> str:
    parts = []
    for name, e in edits.items():
        rows = [(r["segment"], r["chapter"], f"{r['from']:g}-{r['to']:g}", f"{r['out_start']:g}-{r['out_end']:g}") for r in e["segments"]]
        sync = sum(1 for s in e["sync"] if s["pass"])
        parts.append(f"**{name}** ({e['seconds']:g} s; hard stops at {', '.join(f'{h:g}' for h in e['hard_stops']) or 'none'}; hinge chords at "
                     f"{', '.join(f'{h:g}' for h in e['hinges_at']) or 'none'}; {sync}/{len(e['sync'])} carried onsets within 20 ms; "
                     f"last sound {e['last_nonzero_sample_s']} s; stems vs mix {e['stems_sum_vs_mix_max_lsb']} LSB)\n\n"
                     + table(("#", "Chapter", "Chapter s", "Edit s"), rows))
    return "\n\n".join(parts)


def main() -> None:
    report = json.loads((ANALYSIS_DIR / "report.json").read_text())
    render = json.loads((ANALYSIS_DIR / "render.json").read_text())
    events = json.loads((EVENTS_DIR / "master.json").read_text())
    edits = {n: json.loads((ANALYSIS_DIR / f"{n}_report.json").read_text()) for n in ("hook75", "cut180")
             if (ANALYSIS_DIR / f"{n}_report.json").exists()}
    keys = table(("Section (master s)", "Estimated key", "r", "Runner-up", "Tuning (cents)"),
                 [(k["section"], k["key"], k["r"], k["runner_up"], k["tuning_cents"]) for k in report["keys"]])
    fmt = table(("File", "Rate", "Channels", "Subtype", "Seconds"),
                [(f["file"], f["samplerate"], f["channels"], f["subtype"], f["seconds"]) for f in report["formats"]])
    slots = table(("#", "Chapter", "Master start", "Length", "Last bar"),
                  [(n, c, mmss(s), f"{e - s:g} s", f"{int((e - s) % 4) or 4} beats") for c, n, s, e in CHAPTERS])
    values = {
        "SYNC_TABLE": sync_table(report), "CHARTS": chart_tables(events), "LOUDNESS": loudness_table(report, render, edits),
        "ZEROS": zero_table(report, edits), "EDITS": edit_tables(edits), "KEYS": keys, "FORMATS": fmt, "SLOTS": slots,
        "SYNC_PASS": f"{sum(s['pass'] for s in report['sync'])}/{len(report['sync'])}",
        "LAST_SOUND": f"{report['last_nonzero_sample_s']}", "SUM_LSB": f"{report['stems_sum_vs_mix_max_lsb']}",
        "LOUDEST": f"{report['loudest_3s']['start_s']:g}-{report['loudest_3s']['end_s']:g} s ({report['loudest_3s']['rms_dbfs']} dBFS RMS)",
        "SWELL": f"{report['title_swell']['difference_db']} dB (plane {report['title_swell']['plane_section_max_3s_rms_dbfs']} dBFS, "
                 f"swell {report['title_swell']['title_swell_3s_rms_dbfs']} dBFS, 3 s RMS)",
        "MIX_LUFS": f"{report['loudness']['mix']['integrated_lufs']}", "MIX_TP": f"{report['loudness']['mix']['true_peak_dbtp']}",
        "RENDER_S": f"{render['render_seconds']:g}",
    }
    text = TEXT.read_text()
    for key, value in values.items():
        text = text.replace("{{" + key + "}}", value)
    (OUT_DIR / "README.md").write_text(text)


if __name__ == "__main__":
    main()
