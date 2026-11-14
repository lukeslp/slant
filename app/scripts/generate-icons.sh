#!/usr/bin/env bash
# Renders the app icons from Slant's own mark, ../slant/favicon.svg (white square,
# black square outline with one diagonal), the same mark the web game's home-screen
# icons use. Nothing is drawn by hand or generated: the square icons are that SVG
# at size, and the round one puts the same mark, smaller, on a white circle.
# Android's adaptive and themed icons are a vector drawable of the same path
# (res/drawable/ic_launcher_foreground.xml) on white.
#
# Needs ImageMagick 7 (`magick`). Run from app/: scripts/generate-icons.sh

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SVG="$APP_DIR/../slant/favicon.svg"
RES="$APP_DIR/android/app/src/main/res"
ICONSET="$APP_DIR/ios/App/App/Assets.xcassets/AppIcon.appiconset"
STORE="$APP_DIR/app-store"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

command -v magick >/dev/null || { echo "generate-icons: needs ImageMagick 7 (magick)" >&2; exit 1; }
[ -f "$SVG" ] || { echo "generate-icons: $SVG missing" >&2; exit 1; }

# The mark's path, read from the SVG so the icons follow it if it changes.
MARK="$(sed -n 's/.*<path d="\([^"]*\)" fill="none" stroke="black" stroke-width="3".*/\1/p' "$SVG")"
[ -n "$MARK" ] || { echo "generate-icons: no stroked path in $SVG" >&2; exit 1; }

# Round legacy icon: the mark at 80% on a white circle.
printf '%s\n' "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\"><circle cx=\"32\" cy=\"32\" r=\"32\" fill=\"#fff\"/><g transform=\"translate(32 32) scale(0.8) translate(-32 -32)\"><path d=\"$MARK\" fill=\"none\" stroke=\"black\" stroke-width=\"3\"/></g></svg>" > "$TMP/round.svg"

square() { magick -background none -density 1200 "$SVG" -resize "${1}x${1}" -background white -alpha remove -alpha off "PNG24:$2"; }
round()  { magick -background none -density 1200 "$TMP/round.svg" -resize "${1}x${1}" "PNG32:$2"; }

# iOS: one 1024 square, no alpha (App Store Connect rejects transparency).
mkdir -p "$ICONSET"
square 1024 "$ICONSET/AppIcon-1024.png"

# Android legacy launcher icons (API 24-25; newer use the adaptive XML).
for pair in mdpi:48 hdpi:72 xhdpi:96 xxhdpi:144 xxxhdpi:192; do
    density="${pair%%:*}"; size="${pair##*:}"
    mkdir -p "$RES/mipmap-$density"
    square "$size" "$RES/mipmap-$density/ic_launcher.png"
    round "$size" "$RES/mipmap-$density/ic_launcher_round.png"
done

# Store icons: Google Play 512, App Store marketing 1024.
mkdir -p "$STORE/google-play/images"
square 512 "$STORE/google-play/images/icon-512.png"
square 1024 "$STORE/icon-1024.png"

echo "generate-icons: done"
