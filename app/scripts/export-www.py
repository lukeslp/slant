#!/usr/bin/env python3
"""Build app/www/ from the Slant game source and record where it came from.

The game is plain HTML, CSS and JS in this repository's slant/ folder (synced
from `slant/` in lukeslp/game-riffs by tools/sync-from-game-riffs.sh). The
native app ships it as a sealed offline payload. This script is the only thing
that writes app/www/, and it changes the game in exactly these ways, each
asserted so a source change that moves the target fails loudly instead of
shipping a half-applied payload:

1. Copies the files listed in the source's runtime.json, minus the home-screen
   (PWA) files (pwa.js, sw.js, manifest.webmanifest, icons/) and the public
   score files (scores.js, score-clock.js). A service worker has no place in
   an app's web view, the app has its own icons, and the score service is a
   web feature: without scores.js the game simply has no Scores (slant.js
   checks for it), instead of posting runs to an address the app does not have.
2. Removes the GoatCounter, pwa.js, scores.js and score-clock.js <script>s and
   the manifest and apple-touch-icon <link>s from index.html. The app sends
   nothing.
3. Adds a Content-Security-Policy <meta> that limits every fetch, socket,
   script, style, font and image to the bundled files. With it, the Access
   frame hides its camera and eye-tracker rows (they need WebAssembly or a
   socket to 127.0.0.1).
4. Drops the name from the <title> ("Slant · ..." becomes "Slant").
5. Points shared puzzle links at https://lukesteuber.com/games/slant/ instead of
   the web view's own origin (capacitor://localhost or https://localhost),
   which nobody else could open.
6. Adds two files the shell owns, from app/native/, and links them from
   index.html: duo-layout.css (iPhone Duo fold layout; inert without the iOS
   fold bridge) and native.js (hands the Download button's picture to the
   system share sheet, since neither web view saves a blob download; inert in
   a browser).

Usage (from app/):
    python3 scripts/export-www.py                 # source = ../slant, writes www/ + WWW_SOURCE.txt
    python3 scripts/export-www.py --source DIR --out DIR --no-record
                                                  # used by smoke.sh to regenerate and compare
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = APP_DIR.parent
GAME_DIR = REPO_ROOT / "slant"
NATIVE_DIR = APP_DIR / "native"
NATIVE_FILES = ["duo-layout.css", "native.js"]

HOME_SCREEN_FILES = {"pwa.js", "sw.js", "manifest.webmanifest"}
SCORE_FILES = {"scores.js", "score-clock.js"}
HOME_SCREEN_DIRS = ("icons/",)

ANALYTICS = re.compile(r'<script data-goatcounter="[^"]*" async src="https://stats\.dr\.eamer\.dev/count\.js"></script>')
PWA_SCRIPT = re.compile(r'<script src="\./pwa\.js(\?v=[0-9a-f]+)?" defer></script>')
SCORE_SCRIPTS = [re.compile(r'<script src="\./%s(\?v=[0-9a-f]+)?"></script>' % re.escape(name)) for name in sorted(SCORE_FILES)]
MANIFEST_LINK = '<link rel="manifest" href="./manifest.webmanifest">\n'
TOUCH_ICON_LINK = '<link rel="apple-touch-icon" href="./icons/icon-180.png">\n'
TITLE = re.compile(r"<title>Slant · [^<]*</title>")
CHARSET = '<meta charset="utf-8">'
CSP = (
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; "
    "img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' blob: data:; media-src 'none'; "
    "object-src 'none'; base-uri 'none'"
)
CSP_META = f'<meta http-equiv="Content-Security-Policy" content="{CSP}">'
HEAD_END = "</head>"
SHARE_FROM = "function puzzleLink(){const url=new URL(location.href);"
SHARE_TO = "function puzzleLink(){const url=new URL('https://lukesteuber.com/games/slant/');"
OFF_DEVICE = re.compile(r'<(script|link|img|iframe|source|audio|video)\b[^>]*\b(src|href)="(https?:)?//', re.I)


def die(message: str) -> None:
    print(f"export-www: {message}", file=sys.stderr)
    sys.exit(1)


def replace_once(text: str, old: str, new: str, what: str) -> str:
    count = text.count(old)
    if count != 1:
        die(f"{what}: expected exactly one match, found {count}. The game source changed; update scripts/export-www.py.")
    return text.replace(old, new)


def sub_once(text: str, pattern: re.Pattern, new: str, what: str) -> str:
    found = len(pattern.findall(text))
    if found != 1:
        die(f"{what}: expected exactly one match, found {found}. The game source changed; update scripts/export-www.py.")
    return pattern.sub(lambda _m: new, text)


def payload_files(source: Path) -> list[str]:
    runtime = json.loads((source / "runtime.json").read_text())
    listed = set(runtime["files"]) | {runtime["entry"]}
    missing = (HOME_SCREEN_FILES | SCORE_FILES) - listed
    if missing:
        die(f"runtime.json no longer lists {sorted(missing)}; check what became of the game's home-screen or score support")
    dropped = HOME_SCREEN_FILES | SCORE_FILES
    return sorted(f for f in listed if f not in dropped and not f.startswith(HOME_SCREEN_DIRS))


def export(source: Path, out: Path) -> list[str]:
    files = payload_files(source)
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    for rel in files:
        src = source / rel
        if not src.is_file():
            die(f"runtime.json lists {rel}, which is not in {source}")
        dest = out / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(src, dest)
    for name in NATIVE_FILES:
        shutil.copyfile(NATIVE_DIR / name, out / name)

    index = out / "index.html"
    html = index.read_text()
    html = sub_once(html, ANALYTICS, "", "index.html GoatCounter <script>")
    html = sub_once(html, PWA_SCRIPT, "", "index.html pwa.js <script>")
    for pattern in SCORE_SCRIPTS:
        html = sub_once(html, pattern, "", f"index.html <script> {pattern.pattern}")
    html = replace_once(html, MANIFEST_LINK, "", "index.html manifest <link>")
    html = replace_once(html, TOUCH_ICON_LINK, "", "index.html apple-touch-icon <link>")
    html = sub_once(html, TITLE, "<title>Slant</title>", "index.html <title>")
    html = replace_once(html, CHARSET, CHARSET + CSP_META, "index.html charset meta")
    html = replace_once(html, HEAD_END, '<link rel="stylesheet" href="./duo-layout.css">\n' + HEAD_END, "index.html </head>")
    # native.js goes last, after the game's own scripts.
    html = replace_once(html, "</body>", '<script src="./native.js"></script></body>', "index.html </body>")
    bad = [m.group(0) for m in OFF_DEVICE.finditer(html)]
    if bad:
        die(f"index.html still loads something off the device: {bad}")
    for gone in ("pwa.js", "manifest.webmanifest", "icons/", "scores.js", "score-clock.js"):
        if gone in html:
            die(f"index.html still refers to {gone}")
    index.write_text(html)

    game = out / "slant.js"
    game.write_text(replace_once(game.read_text(), SHARE_FROM, SHARE_TO, "slant.js share link"))
    return files + NATIVE_FILES


def git(source: Path, *args: str) -> str:
    return subprocess.run(["git", "-C", str(source), *args], check=True, capture_output=True, text=True).stdout.strip()


def record(source: Path, out: Path) -> None:
    rel = source.relative_to(REPO_ROOT).as_posix()
    tracked = [*(f"{rel}/{f}" for f in json.loads((source / "runtime.json").read_text())["files"]), f"{rel}/runtime.json"]
    native = [f"app/native/{n}" for n in NATIVE_FILES]
    dirty = git(REPO_ROOT, "status", "--porcelain", "--untracked-files=all", "--", *tracked, *native)
    if dirty:
        die("the game source or app/native has uncommitted changes; commit them before exporting so the payload has a source commit")
    # The last commit that touched the game files (normally a sync from
    # game-riffs), not HEAD: other commits do not change the game.
    commit = git(REPO_ROOT, "log", "-1", "--format=%H", "--", *tracked)
    subject = git(REPO_ROOT, "log", "-1", "--format=%s", commit)
    native_commit = git(REPO_ROOT, "log", "-1", "--format=%H", "--", *native)
    upstream = re.search(r"from game-riffs ([0-9a-f]{7,40})", subject)
    lines = [
        "# Vendored payload provenance. Do not hand-edit www/.",
        "#",
        "# Regenerate from app/ at the source commit below:",
        "#   python3 scripts/export-www.py",
        "# scripts/smoke.sh verifies these checksums; scripts/export-www.py lists",
        "# the six deliberate differences from the web game.",
        "",
        "source_repo     https://github.com/lukeslp/slant",
        f"source_commit   {commit}",
    ]
    if upstream:
        lines.append(f"upstream        https://github.com/lukeslp/game-riffs slant/ at {upstream.group(1)}")
    lines.append(f"native_commit   {native_commit}")
    lines.append("")
    for path in sorted(p for p in out.rglob("*") if p.is_file()):
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        lines.append(f"{digest}  {path.relative_to(out).as_posix()}")
    (APP_DIR / "WWW_SOURCE.txt").write_text("\n".join(lines) + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--source", type=Path, default=GAME_DIR, help="Slant game folder (default: ../slant)")
    parser.add_argument("--out", type=Path, default=APP_DIR / "www", help="output folder (default: app/www)")
    parser.add_argument("--no-record", action="store_true", help="do not rewrite WWW_SOURCE.txt")
    args = parser.parse_args()
    source, out = args.source.resolve(), args.out.resolve()
    files = export(source, out)
    if not args.no_record:
        record(source, out)
    print(f"export-www: {len(files)} files from {source} -> {out}")


if __name__ == "__main__":
    main()
