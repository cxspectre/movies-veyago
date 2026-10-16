"""The film's eight VO lines and their windows (CONTRACT.md section 8, VO windows v1).

Each line is a list of chunks. A chunk is synthesized on its own (one sentence, so the
engine holds its natural intonation inside it) and followed by `pause_after` seconds of
silence. Chunk boundaries are therefore exact in the rendered file, which is what the
pencil ticks in VO 1 sync to.

`say` is what the engine reads (spelled for the phonemizer: "Provisum one", not "1").
`text` is the script text, used for captions and for timing.json.
VO 1 (master 6.5, CONTRACT section 12 item 8) keeps a breath of at least `min_pause` (0.5 s)
between its sentences; its ticked chunks are NOT forced onto the grid any more. Their real
start times are measured and the pencil ticks move to the first 0.5 s grid point at or after
each (timing.json `ticks[].gridMaster`, src/beats.ts). `onset_at` still exists for a line that
must put a chunk on a fixed time.
`{NAME}` marks where "Provisum" is spoken; it is replaced by a phoneme override per
pronunciation variant.
"""

from dataclasses import dataclass

NAME_TOKEN = "{NAME}"

# Phoneme spellings (espeak / Kokoro IPA) for the two pronunciations the director is choosing between.
NAME_VARIANTS: dict[str, str] = {
    "veezum": "pɹoʊvˈiːzəm",  # pro-VEE-zum
    "vyzum": "pɹoʊvˈaɪzəm",  # pro-VY-zum
}
DEFAULT_NAME_VARIANT = "veezum"
# Director, after Phase A: VO 1 breathes at least this long between sentences.
VO1_MIN_BREATH_SEC = 0.5


@dataclass(frozen=True)
class Chunk:
    say: str
    pause_after: float  # seconds of silence after this chunk (0 for the last one)
    tick: str | None = None  # VO 1: the item the pencil ticks when this chunk starts
    display: str | None = None  # script spelling when it differs from `say` ("1" for "one")
    onset_at: float | None = None  # line-local second this chunk's first sound is placed on

    @property
    def shown(self) -> str:
        return (self.display or self.say).replace(NAME_TOKEN, "Provisum")


@dataclass(frozen=True)
class Line:
    id: str
    text: str
    window_start_master: float
    next_window_start_master: float  # the hard limit (CONTRACT section 8)
    soft_end_master: float  # where the picture wants the line finished (see README)
    chunks: tuple[Chunk, ...]
    min_pause: float = 0.0  # no breath between chunks is ever shorter than this, whatever the pause scale

    @property
    def has_name(self) -> bool:
        return any(NAME_TOKEN in c.say for c in self.chunks)

    @property
    def budget(self) -> float:
        return self.next_window_start_master - self.window_start_master


LINES: tuple[Line, ...] = (
    Line(
        "vo1",
        "Provisum 1 already did a lot. Mom's papers, in one place. Every deadline, with the right "
        "reminder. The emergency card, for the night the hospital calls.",
        6.5, 19.5, 19.5,
        (
            Chunk(f"{NAME_TOKEN} one already did a lot.", 0.6, display="Provisum 1 already did a lot."),
            Chunk("Mom's papers, in one place.", 0.55, tick="Mom's papers"),
            # No comma in `say`: with it, Kokoro adds a vowel-like onset that a listener
            # (and the recogniser) hears as "It's every deadline".
            Chunk("Every deadline with the right reminder.", 0.55, tick="every deadline",
                  display="Every deadline, with the right reminder."),
            Chunk("The emergency card, for the night the hospital calls.", 0.0, tick="the emergency card"),
        ),
        min_pause=VO1_MIN_BREATH_SEC,
    ),
    Line(
        "vo2", "It worked. So we sat down and asked the harder question.",
        21.0, 36.0, 28.0,
        (
            Chunk("It worked.", 0.75),
            Chunk("So we sat down, and asked the harder question.", 0.0),
        ),
    ),
    Line("vo3", "We started with a person.", 36.0, 56.3, 38.5,
         (Chunk("We started with a person.", 0.0),)),
    Line("vo4", "Then we went through Mom's mail.", 56.3, 66.3, 59.5,
         (Chunk("Then we went through Mom's mail.", 0.0),)),
    Line("vo5", "And we looked past one country.", 66.3, 73.0, 69.5,
         (Chunk("And we looked past one country.", 0.0),)),
    Line(
        "vo6", "And then the biggest one. Stop asking people to fill in forms. Just ask them.",
        73.0, 124.5, 80.0,
        (
            Chunk("And then, the biggest one.", 0.8),
            Chunk("Stop asking people to fill in forms.", 0.6),
            Chunk("Just ask them.", 0.0),
        ),
    ),
    Line(
        "vo7",
        "Everything we drew. On your iPhone. And none of it on our servers. No account. No tracking.",
        124.5, 146.0, 140.0,
        (
            Chunk("Everything we drew.", 0.55),
            Chunk("On your iPhone.", 0.7),
            Chunk("And none of it on our servers.", 0.6),
            Chunk("No account.", 0.45),
            Chunk("No tracking.", 0.0),
        ),
    ),
    Line(
        "vo8", "Provisum. It's Latin for provided for.",
        146.0, 160.0, 153.0,
        (
            Chunk(f"{NAME_TOKEN}.", 0.7),
            Chunk("It's Latin for provided for.", 0.0),
        ),
    ),
)


def line_by_id(line_id: str) -> Line:
    for line in LINES:
        if line.id == line_id:
            return line
    raise KeyError(f"Unknown VO line {line_id!r}")
