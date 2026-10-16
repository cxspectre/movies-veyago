"""Kokoro synthesis of one VO line: chunk by chunk, with explicit pauses and a name override."""

from dataclasses import dataclass
from pathlib import Path

import numpy as np
from kokoro_onnx import Kokoro

from vo_audio import OUT_RATE, onset_sec, resample, trim_bounds
from vo_lines import NAME_TOKEN, NAME_VARIANTS, Line

FILM_DIR = Path(__file__).resolve().parents[2]
MODEL_PATH = FILM_DIR / ".venv/models/kokoro-v1.0.onnx"
VOICES_PATH = FILM_DIR / ".venv/models/voices-v1.0.bin"
LANG = "en-us"
# What the phonemizer makes of the placeholder word; swapped for the chosen variant.
NAME_PLACEHOLDER_WORD = "Provisum"
NAME_DEFAULT_PHONEMES = "pɹəvˈɪsəm"
MIN_GRID_GAP_SEC = 0.2  # a grid-locked chunk never gets less breath than this before it


@dataclass(frozen=True)
class ChunkSpan:
    say: str
    start: float  # seconds in the finished line file
    end: float
    tick: str | None


@dataclass(frozen=True)
class Rendered:
    audio: np.ndarray  # mono float64 at OUT_RATE, not yet loudness-normalised
    spans: tuple[ChunkSpan, ...]


def silence_samples(n: int) -> np.ndarray:
    return np.zeros(max(0, n), dtype=np.float64)


def load_engine() -> Kokoro:
    for path in (MODEL_PATH, VOICES_PATH):
        if not path.exists():
            raise FileNotFoundError(f"{path} is missing; run tools/vo/setup.sh first")
    return Kokoro(str(MODEL_PATH), str(VOICES_PATH))


def voice_style(engine: Kokoro, voice: str) -> np.ndarray:
    """A voice name, or a blend written "af_heart:0.7+af_bella:0.3"."""
    parts = [p.split(":") for p in voice.split("+")]
    weights = [float(p[1]) if len(p) > 1 else 1.0 for p in parts]
    total = sum(weights)
    styles = []
    for (name, *_), weight in zip(parts, weights):
        if name not in engine.voices:
            raise ValueError(f"Unknown Kokoro voice {name!r}")
        styles.append(engine.get_voice_style(name) * (weight / total))
    return np.sum(styles, axis=0).astype(np.float32)


def chunk_phonemes(engine: Kokoro, say: str, name_variant: str) -> str:
    text = say.replace(NAME_TOKEN, NAME_PLACEHOLDER_WORD)
    phonemes = engine.tokenizer.phonemize(text, LANG)
    if NAME_TOKEN not in say:
        return phonemes
    if NAME_DEFAULT_PHONEMES not in phonemes:
        raise RuntimeError(f"Name phonemes not found in {phonemes!r}; update NAME_DEFAULT_PHONEMES")
    return phonemes.replace(NAME_DEFAULT_PHONEMES, NAME_VARIANTS[name_variant])


def _speak(engine: Kokoro, phonemes: str, style: np.ndarray, speed: float) -> np.ndarray:
    audio, rate = engine.create(phonemes, voice=style, speed=speed, is_phonemes=True, lang=LANG)
    up = resample(np.asarray(audio), rate, OUT_RATE)
    start, end = trim_bounds(up, OUT_RATE)
    return up[start:end]


def render_line(
    engine: Kokoro, line: Line, voice: str, speed: float, name_variant: str, pause_scale: float = 1.0
) -> Rendered:
    style = voice_style(engine, voice)
    speeches = [_speak(engine, chunk_phonemes(engine, c.say, name_variant), style, speed) for c in line.chunks]
    gaps = _gaps(line, speeches, pause_scale)
    pieces: list[np.ndarray] = []
    spans: list[ChunkSpan] = []
    cursor = 0
    for chunk, speech, gap in zip(line.chunks, speeches, gaps):
        pieces.append(silence_samples(gap))
        cursor += gap
        spans.append(ChunkSpan(chunk.say, cursor / OUT_RATE, (cursor + len(speech)) / OUT_RATE, chunk.tick))
        pieces.append(speech)
        cursor += len(speech)
    return Rendered(np.concatenate(pieces), tuple(spans))


def _gaps(line: Line, speeches: list[np.ndarray], pause_scale: float) -> list[int]:
    """Silence (samples) before each chunk. A chunk with `onset_at` gets the gap that puts its
    first sound on that time (never shorter than MIN_GRID_GAP_SEC); the rest use pause_after.
    No gap between chunks is shorter than the line's `min_pause`."""
    gaps: list[int] = []
    cursor = 0
    previous = None
    floor = int(round(line.min_pause * OUT_RATE))
    for chunk, speech in zip(line.chunks, speeches):
        natural = 0 if previous is None else max(floor, int(round(previous.pause_after * pause_scale * OUT_RATE)))
        gap = natural
        if chunk.onset_at is not None and previous is not None:
            wanted = int(round(chunk.onset_at * OUT_RATE)) - cursor - int(round(onset_sec(speech, OUT_RATE) * OUT_RATE))
            gap = wanted if wanted >= max(floor, int(MIN_GRID_GAP_SEC * OUT_RATE)) else natural
        gaps.append(gap)
        cursor += gap + len(speech)
        previous = chunk
    return gaps
