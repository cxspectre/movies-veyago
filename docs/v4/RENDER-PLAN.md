# Render plan: the 4K master on the owner's Mac (H3)

Written from stills and code only. **No video was rendered in the cloud**, so every time below is an estimate from still timings. The numbers marked *measured* are real (cloud box, 4 cores, 15 GB, `FILM_GL=swangle`, one browser reused, `tools/probe4k.ts`).

## What the 4K stills showed (measured)

12 heaviest frames of `Master4-wide` (3840x2160) and `Master4-tall` (2160x3840) at scale 2, against scale 1 (wide). Stills are in `out/review/h3/` (not committed).

| frame (master time) | 1080p | 4K wide | 4K tall | peak process-tree memory 4K (wide / tall) |
|---|---|---|---|---|
| 1:40 crumple (3000) | 0.9 s | 2.1 s | 1.4 s | 1.9 / 1.1 GB |
| 5:00 laptop on paper (9000) | 1.0 s | 1.8 s | 1.5 s | 1.9 / 1.2 GB |
| 7:20 village visit (13200) | 2.5 s | 4.7 s | 3.2 s | 2.2 / 1.5 GB |
| 8:10 held regions under the veil (14700) | 1.2 s | 2.5 s | 1.8 s | |
| 8:20 phone (15000) | 4.2 s | 11.8 s | 11.4 s | 3.6 / 2.8 GB |
| 8:30 phone + recording (15300) | 4.0 s | 9.7 s | 9.9 s | 3.8 / 3.1 GB |
| 8:50 phone, Watch, wallet card (15900) | 5.8 s | 17.9 s | 16.2 s | 3.8 / 3.1 GB |
| 9:31, 9:33, 9:36 pull-back (17130, 17190, 17280) | 0.9 s | 1.1-1.6 s | 1.4-1.6 s | |
| 9:42 dive, 9:50 ending (17460, 17700) | 0.8-1.0 s | 1.0-1.4 s | 1.1-1.4 s | |

- **No failures.** All 24 stills are the right size, none blank or half-drawn (checked by pixel spread and by eye on a 12-up sheet per format). No canvas-size, texture-size or out-of-memory error at 3840x2160 or 2160x3840, even with the WebGL phone, Watch and card on screen.
- **Cost ratio 4K/1080p: about 1.5-2x on paper frames, about 2.5-3x on the glass.** Frame cost is mostly fixed page cost on the light frames, which is why they scale less than the 4x pixel count.
- **The look scales.** Side-by-side crops (laptop, village, Maya's house) show the pencil line, the stroke width, the pencil grain and the paper texture at 4K as the same drawing at twice the resolution, not a thinner one. The glass text stays crisp.
- Memory: the browser tree peaks at about 3.8 GB for one tab on the glass. A video render runs `--concurrency` tabs, so budget about 1-2 GB per tab on paper and 3-4 GB per tab on the glass (estimate).
- Not tested: a real video render, `--gl=angle` on a Mac GPU (the cloud has none), and the 4K glass with a real GPU texture limit (swangle is software; a Mac GPU limit is 16384 px, far above 3840).

## What changed in `tools/render.ts` (bugs found by review)

1. **A crash mid-chunk left a half-written chunk that the next run skipped as finished** and concatenated into the master. Now each chunk is written as `<name>.partial.mp4`, its frame count is checked against the range, and only then renamed. On resume, an existing chunk with the wrong frame count is redone.
2. **The chunk folder ignored `--crf`**, so resuming with another crf silently mixed qualities. The folder is now `out/chunks/<id>-s<scale>-crf<crf>/`. (Old folders `<id>-s<scale>/` are not read; delete them.)
3. **Chunk ranges are checked to tile the composition** before any frame renders, and are in `tools/renderRanges.ts` with a test (`node --import tsx --test tools/renderRanges.test.ts`): `--slots4` tiles frames 0-17999 exactly and matches `SLOTS4`.
4. **Per-frame timeout raised to 120 s** (`--timeout=<seconds>`). Remotion's default is 30 s; the 4K glass still took 18 s on 4 slow cores with a cold video seek, so a busy Mac could cross 30 s on the first glass frames.
5. **`--only=a,b`** renders only the named chunks (`--slots4` names are the chapter ids). Without all chunks present it stops before the concat.
6. The concat is verified: the final file must hold exactly the composition's frame count.

`tools/mix/package4.sh`: the 9:16 master was not packaged at all (no `master4-tall` id). It is now (`out/master4-tall-<suffix>.mp4` with the `master4` mix), and any picture/audio length mismatch over 0.1 s prints a warning.

Not fixed, listed: a chunk that exists and has the right frame count is reused even if its chapter changed afterwards: delete that chunk file (or `--force`). `crf`-only keying means a changed `--concurrency` or `--gl` reuses chunks (harmless). Chunks are independent h264 streams joined with `-c copy` (tested on small files; no keyframe or timestamp problem seen, but the Mac concat is the first real test: see "Check"). Remotion's temp JPEG frames are not cleaned if you kill the process hard: clear `$TMPDIR/react-motion-render*`.

## Disk and memory (estimates)

- **Final file, `--crf=14`, 4K, 10:00:** 3-9 GB per format. The paper grain is noisy, so expect the upper half. Chunks add the same again until you delete them, so plan **2x**.
- **Temp frames:** Remotion writes JPEGs (q95) while a chunk renders: about 1.3-1.7 MB per paper frame, 0.5 MB per glass frame at 4K (measured). The biggest chunks are 2,250-2,400 frames, so **up to about 4 GB** at once, freed after each chunk.
- **Free space:** 25 GB for one format, **40 GB for both** with chunks retained. The cloud box has 29 GB free, so it cannot do both.
- **RAM:** 16 GB works at `--concurrency` 4-5. Below that, lower it.

## Concurrency (recommendation; cloud default of 4 is for 4 cores)

Concurrency is parallel browser tabs. Each tab costs memory (above) and the glass chapter is the heaviest. On a Mac with GPU `angle` (the default) the glass is faster than the cloud numbers, but the memory is the same.

| cores | `--concurrency` | for the glass chunk (`paperToGlass`) |
|---|---|---|
| 8 | 4 | 3 |
| 10 | 5 | 4 |
| 12 | 6 | 4 |

Rule: about half the cores, never more than RAM / 3 GB. If the Mac swaps or a tab times out, drop by 2. Never run two renders at once.

## Commands, in order (film root, Mac)

Once: `npm install` (never commit `package-lock.json`), `brew install ffmpeg`. Remotion fetches its own Chrome on first run. Keep the Mac awake: `caffeinate -dimsu` in another tab.

### 1. 1080p proof first (faster; review this before spending hours on 4K)
```sh
npx tsx tools/render.ts Master4-wide --out=out/master4-1080.mp4      --scale=1 --crf=18 --slots4 --concurrency=4
npx tsx tools/render.ts Master4-tall --out=out/master4-tall-1080.mp4 --scale=1 --crf=18 --slots4 --concurrency=4
```
Expected (estimate, wide): roughly 1-2 h on a 10-core Mac, the glass chunk about a third of it. **Check:** the script prints `wrote ... (18000 frames)`; `ffprobe -v error -show_entries format=duration -of csv=p=0 out/master4-1080.mp4` gives `600.0`; scrub the seams at 0:30, 1:15, 1:55, 2:50, 3:55, 4:50, 6:05, 6:55, 8:10, 9:30 for a pop or a frozen frame; watch 8:10-9:30 whole.

### 2. 4K master, silent
```sh
npx tsx tools/render.ts Master4-wide --out=out/master4-4k.mp4      --scale=2 --crf=14 --slots4 --concurrency=4
npx tsx tools/render.ts Master4-tall --out=out/master4-tall-4k.mp4 --scale=2 --crf=14 --slots4 --concurrency=4
```
(Concurrency per the table; add `FILM_GL=angle` or leave default.) Expected: **2-3x the 1080p time, so 3-6 h per format** on a 10-core Mac; honest uncertainty is a factor of 2 either way, because no video was timed. **Check:** same as step 1, plus the file size (3-9 GB), and at 4K compare 8:50 and 5:00 against the 1080p proof: the pencil weight and paper grain should look the same.

### 3. Sound (all of it is in `docs/v4/AUDIO.md`, steps 0-6)
The mix must exist before the mux: `audio/v4/mix/master4.wav` and `master4-novo.wav`, 600.0 s. Check the JSON lines as AUDIO.md step 6 says.

### 4. Mix the picture and the sound
```sh
tools/mix/package4.sh 1080     # proof -> out/final4/master4_1080_*.mp4 and master4-tall_1080_*.mp4
tools/mix/package4.sh 4k       # master -> out/final4/master4_4k_{with-VO,no-VO}.mp4, master4-tall_4k_*
```
Picture is copied (no re-encode), audio is AAC 320k. **Check:** no `WARNING` line about a length mismatch; play 9:17-9:21 (the hard stop) and the last 6 s with sound.

### 5. Cut-downs (stub)
Waiting on the player built by G1. When `docs/v4/CUTDOWNS.md` is on `main`, follow it. It did not exist when this was written. (`tools/mix/renderCutdowns.sh` is the v1 script for `Vertical45-tall`, `Teaser15-*`: do not use it for v4.)

### 6. Packaging
`package4.sh` in step 4 is the packaging for the masters. Cut-down packaging comes with step 5.

## Resume after a crash or a sleep
Run **the same command again.** Finished chunks (right frame count) are skipped, the broken one is redone from its first frame, and a changed `--crf` or `--scale` starts a clean folder. To redo a chapter you changed: `rm out/chunks/Master4-wide-s2-crf14/<chapter>.mp4` and rerun, or `--only=<chapter>` then rerun without it to concat. To render one slow chunk with fewer tabs: `--only=paperToGlass --concurrency=2`.

## Most likely to fail or look wrong at 4K, and the first thing to try

1. **Chapter 10, the glass (8:10-9:30):** the heaviest frames (WebGL phone plus decoded video, 3-4 GB per tab). Symptoms: a tab timeout, Chrome "out of memory", a black or missing phone. First: `--only=paperToGlass --concurrency=2`, then `--gl=angle` if a software renderer was in use.
2. **The first frames of a chunk after a long video seek** (a delayRender timeout): already 120 s; raise `--timeout=240`.
3. **Seams between chunks** (a one-frame pop at a chapter boundary): never seen in stills; the first real check is step 1's seam scrub. If one appears, render those two chunks with `--force` and look at frames either side.
4. **Disk full during the temp-frame stage** (about 4 GB over the chunk folder). Free space before starting.
5. **Held regions re-run their canvases every frame** (MASTER4-AUDIT): this is where non-glass frames cost the most (village visit, 4.7 s still). Not a failure, but it is the main time cost outside the glass until the LOD images exist.

## Owner to confirm
All times above except the still table are estimates; run step 1 first and use its real time (x2-3) to plan step 2.
