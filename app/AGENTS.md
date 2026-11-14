# Slant (native): agent notes

Capacitor shell around the Slant puzzle for iOS and Android, modeled on
Notan's `app/` (lukeslp/notan), itself modeled on Hexsweeper's. Read
`README.md` first: it records the proposed id
`com.oneimpossiblethingatatime.slant` (not confirmed; permanent once a store
has it), the owner's decisions, and the six changes the exporter makes.

## The one rule

**`www/` is generated. Never edit it by hand.** `scripts/export-www.py`
writes it from the game in `../slant/` plus the two files in `native/`, and
records the source commits and checksums in `WWW_SOURCE.txt`;
`scripts/smoke.sh` fails on any drift. Gameplay, copy and look are fixed in
game-riffs `slant/` (the source of truth), synced here with
`../tools/sync-from-game-riffs.sh`, then re-exported. Nothing about the game
is authored in this folder.

## What this folder owns

Native shell only: Xcode and Gradle projects, signing metadata, manifests,
launch screens, icons, Capacitor config, `native/duo-layout.css` and
`native/native.js`, store listing and release process.

## Offline by construction

No permission at all on Android, a bundle-only Content-Security-Policy in the
payload, analytics and public scores stripped by the exporter. The only iOS
usage string is `NSPhotoLibraryAddUsageDescription`, for Save Image in the
share sheet. Keep it that way: the privacy answers in `app-store/PRIVACY.md`
and `app-store/privacy.html` depend on it.

## Deliberately absent

No bundler, no TypeScript, no web test toolchain, no Capacitor plugins
beyond the core (the share sheet and Duo bridge are a few dozen lines of
native code each). `capacitor.config` stays `.js`.

## Simulators and emulators

Other sessions share napoleon's simulators and `emulator-5562`. This app's
checks used its own: iOS 27.2 "Slant iPhone 6.9", "Slant iPad 13" and
"Slant iPhone Duo", and the AVD `Slant_Check_API36` on port 5566.

## Safety

No secrets in this tree. iOS signing is automatic under the owner's team.
Android release signing reads `SLANT_ANDROID_*` environment variables
(android-release-toolkit profile `slant`); the keystore lives outside the
repository. Store records, uploads to App Store Connect, Google Play,
F-Droid or the downloads site, and publishing the privacy page are the
owner's to trigger.
