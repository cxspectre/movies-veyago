"""Parse the spoken lines of docs/SCRIPT-10MIN-v4.md into audio/v4/vo/lines.json.

    .venv/bin/python tools/vo4/script_lines.py [--script docs/SCRIPT-10MIN-v4.md] [--out audio/v4/vo/lines.json]

A spoken line starts with FOUNDER:, MAKER: or MAYA: (a stage direction in brackets may sit
between the name and the colon, as in "MAYA (over the flight):"). Its startMaster is the
timecode of the paragraph it sits in: the most recent **m:ss** marker above it, which is the
paragraph's own marker when it has one. nextLineStart is the start of the next spoken line
in document order, and FILM_END_SEC for the last one. Chapter is the number of the
"## N." section the line sits in.
"""

import argparse
import json
import re
from pathlib import Path

FILM_DIR = Path(__file__).resolve().parents[2]
DEFAULT_SCRIPT = FILM_DIR / "docs/SCRIPT-10MIN-v4.md"
DEFAULT_OUT = FILM_DIR / "audio/v4/vo/lines.json"
FILM_END_SEC = 600.0
TIMECODE = re.compile(r"^\*\*(\d+):(\d{2})\*\*")
SPEAKER = re.compile(r"^(FOUNDER|MAKER|MAYA)\b[^:]*:\s*(.+)$")
NUMBERED_SECTION = re.compile(r"^## (\d+)\. ")
OTHER_SECTION = re.compile(r"^## ")
MARKUP = re.compile(r"\*+|`")


def _seconds(minutes: str, seconds: str) -> float:
    return int(minutes) * 60 + int(seconds)


def _clean(text: str) -> str:
    return " ".join(MARKUP.sub("", text).split())


def parse_script(markdown: str) -> list[dict]:
    """Spoken lines in document order, without nextLineStart (filled by `with_next_starts`)."""
    lines: list[dict] = []
    chapter: int | None = None
    paragraph_start: float | None = None
    for raw in markdown.splitlines():
        text = raw.strip()
        numbered = NUMBERED_SECTION.match(text)
        if numbered:
            chapter, paragraph_start = int(numbered.group(1)), None
            continue
        if OTHER_SECTION.match(text):
            chapter, paragraph_start = None, None
            continue
        stamp = TIMECODE.match(text)
        if stamp:
            paragraph_start = _seconds(stamp.group(1), stamp.group(2))
            text = text[stamp.end():].strip()
        speaker = SPEAKER.match(MARKUP.sub("", text))
        if not speaker:
            continue
        if chapter is None or paragraph_start is None:
            raise ValueError(f"Spoken line outside a chapter or timecode: {raw!r}")
        lines.append({
            "voice": speaker.group(1),
            "chapter": chapter,
            "text": _clean(speaker.group(2)),
            "startMaster": float(paragraph_start),
        })
    return lines


def _next_later_start(lines: list[dict], index: int) -> float:
    """The first start after this line's own start: lines in one paragraph share a start, and
    the window for the paragraph runs to the next paragraph that has speech."""
    own = lines[index]["startMaster"]
    later = [line["startMaster"] for line in lines[index + 1:] if line["startMaster"] > own]
    return later[0] if later else FILM_END_SEC


def with_next_starts(lines: list[dict]) -> list[dict]:
    """Adds id and nextLineStart; ids are L001... in document order."""
    return [
        {"id": f"L{i + 1:03d}", **line, "nextLineStart": _next_later_start(lines, i)}
        for i, line in enumerate(lines)
    ]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--script", type=Path, default=DEFAULT_SCRIPT)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = parser.parse_args()
    lines = with_next_starts(parse_script(args.script.read_text(encoding="utf-8")))
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(lines, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    counts = {voice: sum(1 for line in lines if line["voice"] == voice) for voice in ("FOUNDER", "MAKER", "MAYA")}
    print(f"{args.out}: {len(lines)} lines {counts}")


if __name__ == "__main__":
    main()
