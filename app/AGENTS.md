# Notan (native): agent notes

Capacitor shell around the Notan nonogram for iOS and Android, modeled on
Hexsweeper's `app/` (lukeslp/hexsweeper). Read `README.md` first: it records
the bundle id `com.playnotan.app` (confirmed, permanent), the owner's
decisions, and why game-riffs' sync script must keep excluding `/app`.

## The one rule

**`www/` is generated. Never edit it by hand.** `scripts/export-www.py`
writes it from the game at the repository root and records the source commit
and checksums in `WWW_SOURCE.txt`; `scripts/smoke.sh` fails on any drift.
Gameplay, copy and look are fixed in game-riffs `notan/` (the source of
truth), synced here, then re-exported. Nothing about the game is authored in
this folder.

## What this folder owns

Native shell only: Xcode and Gradle projects, signing metadata, manifests,
launch screens, icons, Capacitor config, store listing and release process.

## Offline by construction

No network permission on Android, no usage-description keys on iOS, a
bundle-only Content-Security-Policy in the payload, analytics stripped by the
exporter. Keep it that way: the privacy answers in `app-store/PRIVACY.md`
depend on it.

## Deliberately absent

No bundler, no TypeScript, no web test toolchain, no Capacitor plugins
beyond the core (no splash-screen plugin: the launch screens are plain page
color). `capacitor.config` stays `.js`.

## Safety

No secrets in this tree. iOS signing is automatic under the owner's team.
Android release signing reads `NOTAN_ANDROID_*` environment variables; the
keystore lives outside the repository. Uploads to App Store Connect, Google
Play, F-Droid or the downloads site are the owner's to trigger.
