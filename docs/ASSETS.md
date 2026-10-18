# Assets, sources and licences

Written for the public repository. Licence names below come from each project's published terms as known when this was written; confirm against the installed packages (`node_modules/<pkg>/package.json`, `LICENSE`) before relying on them. Nothing here is legal advice.

## Fonts (in `public/fonts/`, from npm `@fontsource/*`)
| Family | Use | Source | Licence |
|---|---|---|---|
| DM Sans | supers | `@fontsource/dm-sans` (Google Fonts) | SIL Open Font License 1.1 |
| Caladea | closing line (stand-in for Cambria) | `@fontsource/caladea` (Google Fonts) | Apache 2.0 |
| Caveat | margin notes | `@fontsource/caveat` | SIL OFL 1.1 |
| Kalam | notes | `@fontsource/kalam` | SIL OFL 1.1 |
| Patrick Hand | notes | `@fontsource/patrick-hand` | SIL OFL 1.1 |
| Reenie Beanie | notes | `@fontsource/reenie-beanie` | SIL OFL 1.1 |

No Apple typefaces and no licensed Cambria are committed.

## Music
Rendered locally from **VSCO 2 Community Edition** (Versilian Studios, Sam Gossner; the upright piano is by Ivy Audio, Simon Dalzell), CC0 1.0. The samples are **not in the repository**: `tools/music/fetch_samples.sh` downloads five folders (about 620 MB) from `github.com/sgossner/VSCO-2-CE` at a pinned commit into `tools/music/.vendor/` (git-ignored). The rest of the sound is synthesised by the scripts in `tools/music`, `tools/music4` and `tools/foley*`. Credit is not required by CC0 but is encouraged: *Samples: VSCO 2 Community Edition by Versilian Studios and Ivy Audio, CC0.*

## Voice
Speech is synthesised locally with **Kokoro** (`kokoro-onnx`, model `kokoro-v1.0.onnx` and `voices-v1.0.bin`, fetched by `tools/vo/setup.sh`, not committed). The model is published under Apache 2.0; **check the voices file's terms and the terms of the phonemiser it uses (espeak-ng is GPL-licensed software, used as a separate tool)** before publishing the voices. The voices are synthetic; whether and how the film credits that is an **owner decision**. A recorded human take can replace any clip (see `docs/v4/AUDIO.md`).

## App recordings (`public/footage/`, `public/footage4/`)
Recordings and stills of the owner's own app running in the iOS Simulator, on fictional sample data only (the app's sample binder and a staged fictional family). Manifests: `manifest.json`, `manifest4.json`. The wallet pass sample uses placeholder identifiers. Brand marks in `public/brand/` are the owner's.

## npm dependencies that matter
| Package family | Role | Licence |
|---|---|---|
| Remotion (`remotion`, `@remotion/*`) | video framework | **Remotion License, not OSI open source. See below.** |
| three, `@types/three` | 3D | MIT |
| `@react-three/fiber` | React renderer for three | MIT |
| react, react-dom | UI | MIT |
| sharp | image processing (tools only) | Apache 2.0 (bundles libvips, LGPL) |
| fontkit | font reading (tools only) | MIT |
| tsx | TypeScript runner (tools only) | MIT |
| typescript | compiler | Apache 2.0 |

## Flag: Remotion licence
Remotion's licence is free for individuals and small companies but **requires a paid company licence above its stated size limit, and for some commercial uses**. **Veyago Inc. must check the current terms at remotion.dev/license and decide whether a company licence is needed for this use** (making and publishing a company's marketing film). This repository does not decide that.

## Repository licence: owner's options
No licence is set, which means all rights reserved by default.
1. **All rights reserved** (no licence file): safest; others may read but not reuse.
2. **MIT** for the code: permissive; also lets others reuse it commercially. Note Remotion's own terms still apply to anyone who runs it.
3. **Split**: MIT (or similar) for code, **CC BY-NC 4.0** for the film assets (drawings, textures, footage, scripts), so people may share with credit but not use commercially.
Brand marks and the app's artwork should stay all rights reserved in any option.
