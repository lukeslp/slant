#!/usr/bin/env bash
# Copy slant/ from lukeslp/game-riffs at one commit into this repository's slant/,
# rewrite SOURCE.json, and commit it as "Sync slant/ from game-riffs <sha>"
# (app/scripts/export-www.py reads that subject to name the upstream commit).
#
# Usage: tools/sync-from-game-riffs.sh <commit> [game-riffs checkout]
#   The checkout defaults to ~/workspace/game-riffs. Only `git archive` is run there:
#   its branch and working tree are never touched, so another session can keep using it.
set -euo pipefail
commit="${1:?usage: tools/sync-from-game-riffs.sh <commit> [game-riffs checkout]}"
riffs="${2:-$HOME/workspace/game-riffs}"
repo="$(cd "$(dirname "$0")/.." && pwd)"

git -C "$riffs" fetch -q origin 2>/dev/null || true
full="$(git -C "$riffs" rev-parse --verify "$commit^{commit}")"
short="$(git -C "$riffs" rev-parse --short=7 "$full")"
[ -z "$(git -C "$repo" status --porcelain -- slant SOURCE.json)" ] || { echo "slant/ or SOURCE.json has local changes; stopping." >&2; exit 1; }

tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
git -C "$riffs" archive "$full" slant | tar -x -C "$tmp"
rsync -a --delete "$tmp/slant/" "$repo/slant/"

python3 - "$repo" "$full" <<'PY'
import hashlib, json, sys, datetime, pathlib
repo, commit = pathlib.Path(sys.argv[1]), sys.argv[2]
files = {p.relative_to(repo).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
         for p in sorted((repo / "slant").rglob("*")) if p.is_file()}
doc = {
    "repository": "https://github.com/lukeslp/game-riffs",
    "commit": commit,
    "ref": "origin/master",
    "directories": ["slant"],
    "snapshotDate": datetime.date.today().isoformat(),
    "role": "Game source for the native app in app/. Development and the web release stay in game-riffs.",
    "files": files,
}
(repo / "SOURCE.json").write_text(json.dumps(doc, indent=2) + "\n")
PY

git -C "$repo" add -A -- slant SOURCE.json
if git -C "$repo" diff --cached --quiet; then echo "Already at game-riffs $short."; exit 0; fi
git -C "$repo" commit -s -q -m "Sync slant/ from game-riffs $short"
echo "Synced slant/ from game-riffs $short."
