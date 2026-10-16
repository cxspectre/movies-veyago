"""mix.py - the final sound mix for one version of the film.

usage: .venv/bin/python tools/mix/mix.py <master|vertical|teaser> [--no-vo] [--voice primary|alt] [--target -16]

Stems: music (arranged per version), foley + a room-tone bed, VO. The music ducks under the voice, one static gain hits
the loudness target, a lookahead limiter holds the true-peak ceiling, and the silences are forced to exact zeros.
Output: audio/mix/<version>[-novo].wav (48 kHz, 24-bit stereo).
"""
import argparse
import json
import re
import sys

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy.ndimage import maximum_filter1d, minimum_filter1d, uniform_filter1d
from scipy.signal import resample_poly

SR = 48000
DUCK_DB = -6.0           # music under the voice
FOLEY_DUCK_DB = -2.0     # foley under the voice
TRUE_PEAK_CEILING_DB = -1.5
SPLICE_FADE_S = 0.008

PATHS = {
    "master": dict(seconds=160.0, music="audio/music/master/music-master-mix.wav", foley="audio/foley/stems/foley-master.wav",
                   cues="audio/foley/master.cues.json", edl=None),
    "vertical": dict(seconds=45.0, music="audio/music/vertical/music-vertical-mix.wav", foley="audio/foley/stems/foley-vertical.wav",
                     cues="audio/foley/edl/Vertical45.cues.json", edl="Vertical45"),
    "teaser": dict(seconds=15.0, music="audio/music/teaser/music-teaser-mix.wav", foley="audio/foley/stems/foley-teaser.wav",
                   cues="audio/foley/edl/Teaser15.cues.json", edl="Teaser15"),
}
ROOM_BED = "audio/foley/stems/room_tone_master.wav"


def load(path, seconds):
    """Stereo float64 at SR, padded or trimmed to `seconds`."""
    data, rate = sf.read(path, dtype="float64", always_2d=True)
    if rate != SR:
        raise ValueError(f"{path}: expected {SR} Hz, got {rate}")
    if data.shape[1] == 1:
        data = np.repeat(data, 2, axis=1)
    n = int(round(seconds * SR))
    out = np.zeros((n, 2))
    m = min(n, data.shape[0])
    out[:m] = data[:m, :2]
    return out


def room_bed(version, seconds):
    """The master room-tone bed, sliced per EDL segment so the glass world stays silent."""
    master = load(ROOM_BED, 160.0)
    if version == "master":
        return master
    edl_id = PATHS[version]["edl"]
    edls = json.load(open("audio/mix/edl-segments.json"))
    edl = next(e for e in edls if e["id"] == edl_id)
    bed = np.zeros((int(round(seconds * SR)), 2))
    for seg in edl["segments"]:
        a, b = int(round(seg["masterFrom"] * SR)), int(round(seg["masterTo"] * SR))
        start = int(round(seg["start"] * SR))
        piece = master[a:b]
        bed[start:start + len(piece)] = piece
    return bed


def fade_edges(x, n):
    x = x.copy()
    ramp = np.linspace(0.0, 1.0, n)
    x[:n] *= ramp[:, None]
    x[-n:] *= ramp[::-1][:, None]
    return x


def cut_vo(audio, line_id, cut, timing):
    """Apply a cut like: drop "And none of it on our servers." (a whole sentence chunk) with short fades at the splice."""
    match = re.search(r'drop "(.+)"', cut or "")
    if not match:
        return audio
    entry = next(l for l in timing["lines"] if l["id"] == line_id)
    chunks = entry["chunks"]
    idx = next(i for i, c in enumerate(chunks) if c["text"].strip() == match.group(1).strip())
    start = int(round(chunks[idx]["start"] * SR))
    resume = int(round(chunks[idx + 1]["start"] * SR)) if idx + 1 < len(chunks) else audio.shape[0]
    n = int(SPLICE_FADE_S * SR)
    head, tail = audio[:start].copy(), audio[resume:].copy()
    head[-n:] *= np.linspace(1, 0, n)[:, None]
    tail[:n] *= np.linspace(0, 1, n)[:, None]
    return np.concatenate([head, tail])


def build_vo(version, seconds, voice):
    folder = "audio/vo" if voice == "primary" else "audio/vo/alt"
    if version == "master":
        return load(f"{folder}/vo_stem_master.wav", seconds)
    sheet = json.load(open(PATHS[version]["cues"]))
    timing = json.load(open(f"{folder}/timing.json"))
    vo = np.zeros((int(round(seconds * SR)), 2))
    for line in sheet["vo"]:
        name = line["file"].split("/")[-1]
        audio = load(f"{folder}/{name}", 60.0)
        audio = audio[: np.max(np.nonzero(np.abs(audio).sum(axis=1) > 0)[0]) + 1]  # trim trailing zeros
        audio = cut_vo(audio, f"vo{line['line']}", line.get("cut"), timing)
        a = int(round(line["t"] * SR))
        b = min(a + len(audio), vo.shape[0])
        vo[a:b] += audio[: b - a]
    return vo


def presence(vo, hold_s=0.5, smooth_s=0.2):
    """0..1 envelope of the voice: fast attack, a half-second hold, smooth release."""
    env = uniform_filter1d(np.abs(vo).max(axis=1), int(0.05 * SR))
    on = (env > 0.002).astype(float)
    held = maximum_filter1d(on, int(2 * hold_s * SR), origin=-int(hold_s * SR) + 1)
    return uniform_filter1d(held, int(smooth_s * SR))


def lookahead_limit(x, ceiling_db, look_s=0.005):
    n = int(look_s * SR)
    ceiling = 10 ** (ceiling_db / 20)
    peak = maximum_filter1d(np.abs(x).max(axis=1), 2 * n + 1)
    gain = np.minimum(1.0, ceiling / np.maximum(peak, 1e-12))
    gain = uniform_filter1d(minimum_filter1d(gain, 2 * n + 1), 2 * n + 1)
    return x * gain[:, None], float(20 * np.log10(max(gain.min(), 1e-9)))


def true_peak_db(x):
    up = resample_poly(x, 4, 1, axis=0)
    return float(20 * np.log10(max(np.abs(up).max(), 1e-12)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("version", choices=PATHS)
    ap.add_argument("--no-vo", action="store_true")
    ap.add_argument("--voice", choices=["primary", "alt"], default="primary")
    ap.add_argument("--target", type=float, default=-16.0)
    args = ap.parse_args()
    cfg = PATHS[args.version]
    seconds = cfg["seconds"]

    music = load(cfg["music"], seconds)
    foley = load(cfg["foley"], seconds) + room_bed(args.version, seconds)
    silences = json.load(open(cfg["cues"])).get("silences", [])

    if args.no_vo:
        mix = music + foley
    else:
        vo = build_vo(args.version, seconds, args.voice)
        p = presence(vo)[:, None]
        mix = music * (1 - p * (1 - 10 ** (DUCK_DB / 20))) + foley * (1 - p * (1 - 10 ** (FOLEY_DUCK_DB / 20))) + vo

    mask = np.ones(mix.shape[0])
    for s in silences:
        mask[int(round(s["start"] * SR)):int(round(s["end"] * SR))] = 0.0
    mix *= mask[:, None]

    meter = pyln.Meter(SR)
    before = meter.integrated_loudness(mix)
    mix *= 10 ** ((args.target - before) / 20)
    mix, max_reduction_db = lookahead_limit(mix, TRUE_PEAK_CEILING_DB)
    mix *= mask[:, None]
    after = meter.integrated_loudness(mix)

    name = f"audio/mix/{args.version}{'-novo' if args.no_vo else ''}{'-alt' if args.voice == 'alt' and not args.no_vo else ''}.wav"
    sf.write(name, mix, SR, subtype="PCM_24")
    zero_check = [bool(np.all(mix[int(round(s['start'] * SR)):int(round(s['end'] * SR))] == 0)) for s in silences]
    print(json.dumps({
        "file": name, "seconds": round(mix.shape[0] / SR, 3), "lufs_before_gain": round(before, 2), "lufs_final": round(after, 2),
        "true_peak_dbtp": round(true_peak_db(mix), 2), "max_limiter_reduction_db": round(max_reduction_db, 2),
        "silences_exact_zero": zero_check,
    }))


if __name__ == "__main__":
    sys.exit(main())
