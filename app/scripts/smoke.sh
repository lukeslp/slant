#!/usr/bin/env bash
# Slant native smoke: payload integrity, offline posture and both Capacitor
# shells. Gradle and Xcode builds are separate gates (see README, Verify).
#
# Usage (from app/):
#   scripts/smoke.sh                       # integrity + cap sync
#   scripts/smoke.sh --with-source DIR     # also regenerate www/ from a Slant
#                                          # game folder and diff (for example
#                                          # ../slant at the recorded commit, or
#                                          # ~/workspace/game-riffs/slant at the
#                                          # upstream commit)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

SOURCE_CHECKOUT=""
if [ "${1:-}" = "--with-source" ]; then
    SOURCE_CHECKOUT="${2:?--with-source needs a path to a Slant game folder}"
fi

red()   { printf '\033[31m%s\033[0m\n' "$*" >&2; }
green() { printf '\033[32m%s\033[0m\n'  "$*"; }
gold()  { printf '\033[33m%s\033[0m\n'  "$*"; }

LOG_DIR="$(mktemp -d)"
trap 'rm -rf "$LOG_DIR"' EXIT

TOTAL=4
[ -n "$SOURCE_CHECKOUT" ] && TOTAL=5
gold "── smoke: slant app at $(git rev-parse --short HEAD 2>/dev/null || echo 'no-git') ──"

# 1. www/ matches the checksums recorded when it was exported.
gold "[1/$TOTAL] payload integrity…"
[ -f WWW_SOURCE.txt ] || { red "  ✘ WWW_SOURCE.txt missing"; exit 1; }
if ! grep -E '^[0-9a-f]{64}  ' WWW_SOURCE.txt | (cd www && shasum -a 256 -c --status -); then
    red "  ✘ www/ does not match WWW_SOURCE.txt. Either www/ was hand-edited, or it"
    red "    was exported without refreshing WWW_SOURCE.txt: run scripts/export-www.py."
    exit 1
fi
RECORDED_FILES="$(grep -cE '^[0-9a-f]{64}  ' WWW_SOURCE.txt)"
ACTUAL_FILES="$(find www -type f | wc -l | tr -d ' ')"
if [ "$RECORDED_FILES" != "$ACTUAL_FILES" ]; then
    red "  ✘ www/ has $ACTUAL_FILES files but WWW_SOURCE.txt records $RECORDED_FILES"
    exit 1
fi
green "  ✓ payload matches WWW_SOURCE.txt ($ACTUAL_FILES files)"

# 2. The payload stays offline: no analytics, a CSP limited to the bundle,
#    and nothing loaded from another host.
gold "[2/$TOTAL] offline payload…"
if grep -q 'goatcounter\|stats\.dr\.eamer\.dev' www/index.html; then
    red "  ✘ analytics script is back in www/index.html"; exit 1
fi
if ! grep -q "http-equiv=\"Content-Security-Policy\" content=\"default-src 'self';.*connect-src 'self'" www/index.html; then
    red "  ✘ www/index.html lacks the bundle-only Content-Security-Policy"; exit 1
fi
if grep -Eq '<(script|img|iframe|source|audio|video)\b[^>]*\bsrc="(https?:)?//' www/index.html \
   || grep -E '<link\b[^>]*\bhref="(https?:)?//' www/index.html | grep -v 'rel="canonical"' | grep -q .; then
    red "  ✘ www/index.html loads something from another host"; exit 1
fi
for gone in pwa.js sw.js manifest.webmanifest scores.js score-clock.js; do
    if [ -e "www/$gone" ] || grep -q "$gone" www/index.html; then
        red "  ✘ www/ still has $gone (home-screen or public score support)"; exit 1
    fi
done
for own in duo-layout.css native.js; do
    cmp -s "native/$own" "www/$own" || { red "  ✘ www/$own is missing or differs from native/$own"; exit 1; }
    grep -q "$own" www/index.html || { red "  ✘ www/index.html does not load $own"; exit 1; }
done
if grep -q 'Luke Steuber' www/index.html; then
    red "  ✘ www/index.html names the author (title or byline)"; exit 1
fi
if ! grep -q "new URL('https://lukesteuber.com/games/slant/')" www/slant.js; then
    red "  ✘ shared puzzle links no longer point at the web game"; exit 1
fi
green "  ✓ no analytics, scores or service worker, bundle-only CSP, nothing remote"
# British spellings in player-facing text are fixed in game-riffs, not here; warn
# until the game is clean (game-riffs PR 161 fixes the three "colour" strings).
if grep -Eqi "\bcolour" www/index.html www/slant.js; then
    gold "  ! www/ still says \"colour\" (game source); sync after game-riffs PR 161"
fi

# 3. Capacitor can stage the iOS project.
gold "[3/$TOTAL] npx cap sync ios…"
if ! npx cap sync ios >"$LOG_DIR/ios.log" 2>&1; then
    red "  ✘ cap sync ios failed"; tail -20 "$LOG_DIR/ios.log" >&2; exit 1
fi
[ -f ios/App/App/public/index.html ] || { red "  ✘ ios/App/App/public/index.html missing after sync"; exit 1; }
green "  ✓ payload staged into the iOS project"

# 4. Capacitor can stage Android, and the manifest asks for no permission.
gold "[4/$TOTAL] npx cap sync android…"
if ! npx cap sync android >"$LOG_DIR/android.log" 2>&1; then
    red "  ✘ cap sync android failed"; tail -20 "$LOG_DIR/android.log" >&2; exit 1
fi
[ -f android/app/src/main/assets/public/index.html ] || { red "  ✘ Android public/index.html missing after sync"; exit 1; }
if grep -q '<uses-permission' android/app/src/main/AndroidManifest.xml; then
    red "  ✘ the Android manifest requests a permission; this app needs none"; exit 1
fi
green "  ✓ payload staged into the Android project; no permissions"

# 5. Optional: www/ is exactly what the given game folder exports to.
if [ -n "$SOURCE_CHECKOUT" ]; then
    gold "[5/$TOTAL] payload matches $SOURCE_CHECKOUT…"
    python3 scripts/export-www.py --source "$SOURCE_CHECKOUT" --out "$LOG_DIR/www" --no-record >/dev/null
    if ! diff -rq "$LOG_DIR/www" www >"$LOG_DIR/diff.log" 2>&1; then
        red "  ✘ www/ differs from what $SOURCE_CHECKOUT exports:"
        sed 's/^/      /' "$LOG_DIR/diff.log" >&2
        red "    Re-export: python3 scripts/export-www.py (after syncing the game source)"
        exit 1
    fi
    green "  ✓ payload matches the game source"
fi

green ""
green "smoke: all gates green"
