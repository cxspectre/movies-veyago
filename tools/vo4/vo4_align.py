"""Word timings for a rendered line.

Kokoro's ONNX export has no duration output, so word times come from forced recognition:
faster-whisper transcribes each chunk (whose position in the file is exact) with word
timestamps, the recognised words are matched to the script words, and any script word
the recogniser missed is placed by interpolation inside its chunk. The same pass gives an
objective intelligibility score (word error rate and mean word probability) per voice.
"""

import re
from dataclasses import dataclass
from difflib import SequenceMatcher
from functools import lru_cache

import numpy as np

from vo4_audio import OUT_RATE, onset_sec, resample
from vo4_synth import ChunkSpan

WHISPER_MODEL = "small.en"
WHISPER_RATE = 16_000
# "Provisum" is not an English word; tell the recogniser to expect it.
PROMPT = "Provisum. Mom's papers. iPhone."


@dataclass(frozen=True)
class WordTime:
    word: str
    start: float
    end: float
    matched: bool  # False when interpolated rather than recognised


@dataclass(frozen=True)
class Alignment:
    words: tuple[WordTime, ...]
    recognised: str
    wer: float
    mean_probability: float


@lru_cache(maxsize=1)
def _model():
    from faster_whisper import WhisperModel

    return WhisperModel(WHISPER_MODEL, device="cpu", compute_type="int8")


def _norm(word: str) -> str:
    return re.sub(r"[^a-z0-9']", "", word.lower().replace("’", "'"))


def _recognise(audio: np.ndarray) -> list[tuple[str, float, float, float]]:
    pcm = resample(audio, OUT_RATE, WHISPER_RATE).astype(np.float32)
    segments, _ = _model().transcribe(
        pcm, language="en", word_timestamps=True, initial_prompt=PROMPT, beam_size=5,
        condition_on_previous_text=False, vad_filter=False,
    )
    return [(w.word.strip(), w.start, w.end, w.probability) for s in segments for w in (s.words or [])]


def _interpolate(words: list[str], known: dict[int, tuple[float, float]], lo: float, hi: float) -> list[tuple[float, float]]:
    """Fill gaps between recognised words, sharing the gap by character count."""
    out: list[tuple[float, float]] = []
    i = 0
    while i < len(words):
        if i in known:
            out.append(known[i])
            i += 1
            continue
        j = i
        while j < len(words) and j not in known:
            j += 1
        start = out[-1][1] if out else lo
        end = known[j][0] if j < len(words) else hi
        lengths = [max(1, len(w)) for w in words[i:j]]
        edges = np.cumsum([0, *lengths]) / sum(lengths) * (end - start) + start
        out.extend((float(a), float(b)) for a, b in zip(edges[:-1], edges[1:]))
        i = j
    return out


def _align_chunk(audio: np.ndarray, span: ChunkSpan, shown: str) -> tuple[list[WordTime], list[str], int, list[float]]:
    a, b = int(span.start * OUT_RATE), int(span.end * OUT_RATE)
    heard = _recognise(audio[a:b])
    script = shown.split()
    matcher = SequenceMatcher(a=[_norm(w) for w in script], b=[_norm(h[0]) for h in heard], autojunk=False)
    known: dict[int, tuple[float, float]] = {}
    for block in matcher.get_matching_blocks():
        for k in range(block.size):
            h = heard[block.b + k]
            known[block.a + k] = (span.start + h[1], span.start + h[2])
    # The recogniser pins a chunk's first word to the chunk edge; the speech itself starts
    # at the first frame that rises out of the trimmed air, which is what a tick syncs to.
    onset = span.start + onset_sec(audio[a:b], OUT_RATE)
    if 0 in known:
        known[0] = (max(known[0][0], onset), known[0][1])
    times = _interpolate(script, known, onset, span.end)
    words = [WordTime(w, round(s, 3), round(e, 3), i in known) for i, (w, (s, e)) in enumerate(zip(script, times))]
    errors = len(script) - len(known) + max(0, len(heard) - len(known))
    return words, [h[0] for h in heard], errors, [h[3] for h in heard]


def align(audio: np.ndarray, spans: tuple[ChunkSpan, ...], shown: tuple[str, ...]) -> Alignment:
    words: list[WordTime] = []
    heard: list[str] = []
    errors = 0
    probs: list[float] = []
    for span, text in zip(spans, shown):
        w, h, e, p = _align_chunk(audio, span, text)
        words += w
        heard += h
        errors += e
        probs += p
    total = max(1, len(words))
    return Alignment(tuple(words), " ".join(heard), round(errors / total, 3), round(float(np.mean(probs)) if probs else 0.0, 3))
