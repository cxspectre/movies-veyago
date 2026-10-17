"""Tests for tools/mix/silence.py (numpy only; no audio files).   python3 -m unittest discover -s tools/mix/test -p 'test_*.py'"""
import pathlib
import sys
import unittest

import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from silence import exact_zero, gate, silence_mask, silence_ranges  # noqa: E402

SR = 48000


class SilenceTests(unittest.TestCase):
    def test_ranges_from_both_shapes_and_dedupe(self):
        sheet = {
            "silences": [{"start": 10.0, "end": 12.0}],
            "cues": [{"kind": "hit", "t": 1.0, "name": "tick"}, {"kind": "silence", "at": 20.0, "dur": 1.0}],
            "silenceCues": [{"kind": "silence", "at": 10.0, "dur": 2.0}, {"kind": "silence", "at": 5.0, "dur": 0.5}],
        }
        self.assertEqual(silence_ranges(sheet), [(5.0, 5.5), (10.0, 12.0), (20.0, 21.0)])

    def test_v1_sheet_is_unchanged(self):
        self.assertEqual(silence_ranges({"cues": [], "silences": [{"start": 113, "end": 115}]}), [(113.0, 115.0)])
        self.assertEqual(silence_ranges({"cues": []}), [])

    def test_gate_makes_exact_zeros_on_every_stem_and_leaves_the_rest_bit_identical(self):
        rng = np.random.default_rng(3)
        ranges = [(0.5, 0.75)]
        for stem in (rng.uniform(-1, 1, (SR, 2)), rng.uniform(-1, 1, (SR, 2)) * 1e-9, np.full((SR, 2), 0.25)):
            out = gate(stem, ranges, SR)
            a, b = int(0.5 * SR), int(0.75 * SR)
            self.assertTrue(np.all(out[a:b] == 0))
            self.assertTrue(np.array_equal(out[:a], stem[:a]))
            self.assertTrue(np.array_equal(out[b:], stem[b:]))
            self.assertTrue(exact_zero(out, ranges, SR)[0])
            self.assertFalse(exact_zero(stem, ranges, SR)[0])

    def test_silence_cue_zeroes_a_mix_after_a_gain_stage(self):
        sheet = {"cues": [{"kind": "silence", "at": 0.25, "dur": 0.5}]}
        ranges = silence_ranges(sheet)
        mix = np.ones((SR, 2)) * 0.3
        mask = silence_mask(mix.shape[0], ranges, SR)
        mix = mix * 3.7 * mask[:, None]
        self.assertEqual(exact_zero(mix, ranges, SR), [True])
        self.assertEqual(float(mix[0, 0]), 0.3 * 3.7)


if __name__ == "__main__":
    unittest.main()
