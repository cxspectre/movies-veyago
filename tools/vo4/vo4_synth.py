"""Kokoro synthesis of one v4 VO line: sentence by sentence, with explicit silences.

Adapted from tools/vo/vo_synth.py (v1). Each sentence is spoken on its own so its intonation
holds, the gap after every sentence is digital silence (PAUSE_AFTER_SEC scaled by the caller),
and "Provisum" is spoken through a phoneme override (pro-VEE-zum by default).
"""

import re
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from kokoro_onnx import Kokoro

from vo4_audio import OUT_RATE, resample, trim_bounds

FILM_DIR = Path(__file__).resolve().parents[2]
MODEL_PATH = FILM_DIR / ".venv/models/kokoro-v1.0.onnx"
VOICES_PATH = FILM_DIR / ".venv/models/voices-v1.0.bin"
LANG = "en-us"
NAME_WORD = "Provisum"
# What the phonemizer makes of the name by default; replaced by the chosen pronunciation.
NAME_DEFAULT_PHONEMES = "pɹəvˈɪsəm"
NAME_VARIANTS: dict[str, str] = {
    "veezum": "pɹoʊvˈiːzəm",  # pro-VEE-zum
    "vyzum": "pɹoʊvˈaɪzəm",  # pro-VY-zum
}
DEFAULT_NAME_VARIANT = "veezum"
PAUSE_AFTER_SEC = 0.5  # silence after each sentence, before the pause scale
SENTENCE_BREAK = re.compile(r"(?<=[.!?])\s+")


@dataclass(frozen=True)
class ChunkSpan:
    say: str
    start: float  # seconds in the rendered line
    end: float
    tick: str | None = None


@dataclass(frozen=True)
class Rendered:
    audio: np.ndarray  # mono float64 at OUT_RATE, not yet loudness-normalised
    spans: tuple[ChunkSpan, ...]


def split_sentences(text: str) -> list[str]:
    return [s for s in SENTENCE_BREAK.split(text.strip()) if s]


def load_engine() -> Kokoro:
    for path in (MODEL_PATH, VOICES_PATH):
        if not path.exists():
            raise FileNotFoundError(f"{path} is missing; the v1 setup (tools/vo/setup.sh) installs it")
    return Kokoro(str(MODEL_PATH), str(VOICES_PATH))


class Speaker:
    """One Kokoro voice with one pronunciation of the name. Sentence audio is cached by
    (text, speed), so re-fitting a line with different pauses does not re-run the engine."""

    def __init__(self, engine: Kokoro, voice: str, variant: str = DEFAULT_NAME_VARIANT):
        if voice not in engine.voices:
            raise ValueError(f"Unknown Kokoro voice {voice!r}")
        self.engine = engine
        self.voice = voice
        self.variant = variant
        self.style = np.asarray(engine.get_voice_style(voice), dtype=np.float32)
        self._cache: dict[tuple[str, float], np.ndarray] = {}

    def sentence(self, text: str, speed: float) -> np.ndarray:
        key = (text, speed)
        if key not in self._cache:
            self._cache[key] = self._speak(text, speed)
        return self._cache[key]

    def _phonemes(self, text: str) -> str:
        phonemes = self.engine.tokenizer.phonemize(text, LANG)
        if NAME_WORD not in text:
            return phonemes
        if NAME_DEFAULT_PHONEMES not in phonemes:
            raise RuntimeError(f"Name phonemes not found in {phonemes!r}; update NAME_DEFAULT_PHONEMES")
        return phonemes.replace(NAME_DEFAULT_PHONEMES, NAME_VARIANTS[self.variant])

    def _speak(self, text: str, speed: float) -> np.ndarray:
        audio, rate = self.engine.create(
            self._phonemes(text), voice=self.style, speed=speed, is_phonemes=True, lang=LANG,
        )
        up = resample(np.asarray(audio), rate, OUT_RATE)
        start, end = trim_bounds(up, OUT_RATE)
        return up[start:end]


def render_line(speaker: Speaker, sentences: list[str], speed: float, pause_scale: float) -> Rendered:
    speeches = [speaker.sentence(s, speed) for s in sentences]
    gap = np.zeros(int(round(PAUSE_AFTER_SEC * pause_scale * OUT_RATE)), dtype=np.float64)
    pieces: list[np.ndarray] = []
    spans: list[ChunkSpan] = []
    cursor = 0
    for i, (sentence, speech) in enumerate(zip(sentences, speeches)):
        if i > 0:
            pieces.append(gap)
            cursor += len(gap)
        spans.append(ChunkSpan(sentence, cursor / OUT_RATE, (cursor + len(speech)) / OUT_RATE))
        pieces.append(speech)
        cursor += len(speech)
    return Rendered(np.concatenate(pieces).astype(np.float64), tuple(spans))
