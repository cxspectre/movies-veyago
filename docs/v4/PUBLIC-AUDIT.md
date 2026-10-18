# Public repository audit (H1)

Repository `cxspectre/movies-veyago` is public. Scope: working tree plus a grep of all 50 commits on all branches. Cloud scan; nothing was run on the owner's Mac.

## Findings
| # | Area | Finding | Where | Status |
|---|---|---|---|---|
| 1 | Privacy | Owner's macOS home-folder name (full name in the username) in absolute paths | `CONTRACT.md` 23; `docs/FOOTAGE.md` 46, 183; `docs/INVENTORY.md` 4, 40-42; `docs/v4/CAPTURES-done.md` 6; `docs/v4/CLAIMS.md` 5; `tools/capture/env.sh`; `tools/capture4/env.sh`; `tools/capture/wallet-pass/build-pass.mjs` 9 | **Fixed in tree** (now `~` or `$HOME`). Still present in git history. |
| 2 | Privacy | A committed Python bytecode file embedded the same home path | `tools/music/__pycache__/config.cpython-312.pyc` | **Removed from the index** (already in `.gitignore`). Still in history. |
| 3 | Privacy | Author email on 31 commits is a personal iCloud address; 19 commits use the GitHub no-reply address | git history | **Owner decision.** Cannot change without rewriting history. |
| 4 | Secrets | No API keys, tokens, passwords, private keys, `.env`, certificates, provisioning profiles in tree or history | whole repo | Clean |
| 5 | Email | Only `sam@example.com` (reserved example domain) and `@2x`/`@3x` filenames | `docs/v4/CAPTURES-done.md`, `CLAIMS.md`, `manifest4.json`, `tools/capture4/rec-invite.sh` | Fine |
| 6 | Phone | `(614) 555-01xx` numbers are fictional (555-01xx range). `1-800-MEDICARE` is a public helpline | `docs/FOOTAGE.md`, `tools/capture/wallet-pass/build-pass.mjs` | Fine |
| 7 | Apple ids | Wallet pass uses placeholders `FILM000000`, `pass.example.film`; no Apple IDs or team ids | `public/footage/wallet-pass.pass.json`, `build-pass.mjs` | Fine |
| 8 | Video metadata | All 28 mp4 files carry only container tags (encoder Lavf, handler "Core Media Video"); no location or device name | `public/footage*/*.mp4` | Clean |
| 9 | Image metadata | PNG `eXIf` chunks hold only dimension and colour-space fields (no strings); 81 images checked | `public/` | Clean |
| 10 | Fictional data | Manifests and docs state seeded sample data only (sample "Mom", staged family: Dad, Leo, Mia, Maya, Jonas, Biscuit, Sam). I read the manifests and docs; **I did not visually review all 28 clips and 80 stills**. | `public/footage*/` | **Owner to skim once** |
| 11 | Predecessor name | A grep for every standalone four-letter word starting with K in tree and history found only ordinary words (kind, keep, keys, know...) and no filenames. The brief says the name appears as an ordinary word in a few old commits; I could not tell which word without being told it. | history | Owner to confirm with their own grep; removal needs a history rewrite |
| 12 | Size | `.git` 108 MB (one pack, 1,389 objects); tracked tree 835 files, `public/` 105 MB; largest file 3.1 MB; none above 5 MB; no blob above 3.3 MB in history | whole repo | Fine |
| 13 | Ignored | `.gitignore` covers `node_modules`, `.venv`, `out/`, `audio/`, `*.wav`, `*.aiff`, `tools/music/.vendor`, `.DS_Store`, `__pycache__`. No wav, aiff, out, audio, venv or node_modules path appears anywhere in history. | | Clean |
| 14 | Lockfile | `package-lock.json` is tracked (the cloud rule is not to commit it) | root | Owner decision: keep or untrack |
| 15 | Licence | No repository licence; Remotion terms unresolved | | See `docs/ASSETS.md` |

## What I changed (no film behaviour)
- `README.md` rewritten; `docs/ASSETS.md` and this file added.
- Home-folder paths replaced in the files listed in finding 1 (scripts now use `$HOME` / `process.env.HOME`; syntax checked with `bash -n` and `node --check`).
- Untracked the committed `.pyc`.

## Owner must decide
1. **Licence** for code and for film assets (options in `docs/ASSETS.md`).
2. **Remotion**: whether Veyago Inc. needs a company licence.
3. **History**: findings 1-3 and 11 live in old commits. Removing them means a history rewrite (`git filter-repo`) and a force-push, which breaks every clone and PR; the alternative is to accept them. Rotate nothing: no secrets were found.
4. **Whether the planning briefs, claims sheet and QA notes stay public.** They contain unconfirmed claims, internal decisions and release-process detail (`docs/v4/CLAIMS.md`, `QA*.md`, `briefs/`).
5. Whether to untrack `package-lock.json`, and which author email to use going forward (`git config user.email` the no-reply address).
6. Whether to credit the synthetic voices.

## Repeat the audit
```
git grep -nIE '(AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{30,}|BEGIN [A-Z ]*PRIVATE KEY)'
git grep -nIE '(/Users/|/home/)[A-Za-z0-9._-]+'
git ls-files | grep -iE '\.env|\.pem|\.p12|mobileprovision|__pycache__|\.pyc'
git log --all --format='%an <%ae>' | sort | uniq -c
git log --all -p | grep -nE '^\+.*(/Users/[a-z]|BEGIN .*PRIVATE KEY)'
git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectsize) %(rest)' | awk '$1=="blob" && $2>1000000' | sort -k2 -rn | head
for f in $(git ls-files '*.mp4'); do ffprobe -v error -show_entries format_tags:stream_tags -of default=nw=1 "$f"; done | sort | uniq -c
```
