#!/usr/bin/env bash
# Reproducible Android build wrapper. Capacitor 8 compiles with Java 21, so
# this selects a JDK 21 even when a newer or older system Java is the default.
#
#   scripts/android-build.sh assembleDebug     # debug APK (debug key)
#   scripts/android-build.sh bundleRelease     # release AAB; signed only if SLANT_ANDROID_* are set
#   scripts/android-build.sh assembleRelease   # release APK; same signing rule
#   scripts/android-build.sh test              # JVM unit tests

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TASK="${1:-assembleDebug}"

case "$TASK" in
    assembleDebug|bundleRelease|assembleRelease) ;;
    test) TASK=testDebugUnitTest ;;
    *)
        printf 'android-build: unsupported task %s\n' "$TASK" >&2
        exit 2
        ;;
esac

if [ "$(uname -s)" = "Darwin" ]; then
    JAVA_21_HOME="$(/usr/libexec/java_home -v 21 2>/dev/null || true)"
    # Homebrew's openjdk@21 is keg-only and java_home does not list it.
    if [ -z "$JAVA_21_HOME" ] && [ -d /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ]; then
        JAVA_21_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
    fi
    if [ -n "$JAVA_21_HOME" ]; then
        export JAVA_HOME="$JAVA_21_HOME"
        export PATH="$JAVA_HOME/bin:$PATH"
    fi
fi

cd "$REPO_ROOT"
pnpm exec cap sync android
exec ./android/gradlew --project-dir android "$TASK"
