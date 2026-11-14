# Release

Nothing here has been signed, uploaded or published. Every step below is the
owner's. App sessions on napoleon cannot read the login keychain, so the
signing steps have to run from Luke's own Terminal (or Xcode).

## Identity

| Thing | Value |
|---|---|
| App Store name | `Notan` (fallback `Notan Nonogram`, if taken) |
| Home-screen name | `Notan` (`CFBundleDisplayName`, independent of the listing) |
| iOS bundle id | `com.playnotan.app` (confirmed; permanent after first upload) |
| Android application id | `com.playnotan.app` (same) |
| Apple team | `596T7J7FB6` |
| Version | `1.0.0 (1)` on both platforms |

## 0. Before anything

Done on 2026-11-13: the id `com.playnotan.app` is confirmed (Luke), the
game-riffs sync excludes `/app` (game-riffs PR 143), and the privacy policy
is live at `https://playnotan.com/privacy.html` (PR 144).

## 1. iOS: App Store Connect record

In App Store Connect → Apps → **+** → New App: platform iOS, name `Notan`
(or the fallback), primary language English (U.S.), bundle id
`com.playnotan.app`, SKU `notan-ios`. The App ID is already registered
(App Store Connect API, 2026-11-13, resource `72N53SY469`).

Fill the listing from `app-store/metadata/en-US/` and the answers in
`app-store/PRIVACY.md`. Screenshots: `app-store/screenshots/en-US/*.png`
(1320×2868, the 6.9" iPhone slot) and `*-ipad.png` (2064×2752, the 13" iPad
slot). App icon is in the binary; `app-store/icon-1024.png` is the same art.
iPhone Duo: `app-store/screenshots/iphone-duo-outer/` (1398×2034, the folded
outer screen). `scripts/capture-duo.sh <udid> <outer|inner> <outdir> [App.app]`
makes the outer or inner set from a Debug build with no taps (its header has
the build command); `asc_ship.py screenshots` reads one folder, so stage these
next to the en-US files. The 6.9" and iPad solved shots predate the solved
colors of 1.0.0 (2) (the picture now turns a color; those shots show it black).

## 2. iOS: archive and upload to TestFlight

The same commands Hexsweeper uses (`hexsweeper/app/docs/RELEASE.md`); the
signing script in step 3 runs them for build 1:

```bash
cd ~/workspace/notan/app
pnpm install && pnpm smoke

# napoleon's App Store Connect key (team 596T7J7FB6)
read -r KEY ISS < <(python3 -c "import json,os; d=json.load(open(os.path.expanduser('~/.appstoreconnect/api_key.json'))); print(d['key_id'], d['issuer_id'])")
mkdir -p ~/notan-build
cat > ~/notan-build/export.plist <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>method</key><string>app-store-connect</string>
  <key>teamID</key><string>596T7J7FB6</string>
  <key>signingStyle</key><string>automatic</string>
  <key>uploadSymbols</key><false/>
</dict></plist>
PLIST

cd ios/App
xcodebuild -project App.xcodeproj -scheme App -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath ~/notan-build/Notan.xcarchive \
  -allowProvisioningUpdates \
  -authenticationKeyPath ~/.appstoreconnect/private_keys/AuthKey_$KEY.p8 \
  -authenticationKeyID $KEY -authenticationKeyIssuerID $ISS archive

xcodebuild -exportArchive \
  -archivePath ~/notan-build/Notan.xcarchive \
  -exportPath ~/notan-build/export \
  -exportOptionsPlist ~/notan-build/export.plist \
  -allowProvisioningUpdates \
  -authenticationKeyPath ~/.appstoreconnect/private_keys/AuthKey_$KEY.p8 \
  -authenticationKeyID $KEY -authenticationKeyIssuerID $ISS

xcrun altool --upload-app -f ~/notan-build/export/App.ipa -t ios \
  --apiKey $KEY --apiIssuer $ISS
```

Or in Xcode: `pnpm cap:open:ios`, Product → Archive, Distribute App →
App Store Connect. Keep `uploadSymbols` false (Hexsweeper's "Copy failed"
lesson). If Homebrew rsync breaks the export, put `/usr/bin` first in PATH
(the LocalType note). Raise `CURRENT_PROJECT_VERSION` for every new upload.

## 3. Android: release key and signed builds

The key is a toolkit identity like the rest: profile `notan` in
android-release-toolkit (PR 20), alias `notan-release`, keystore under
`~/Library/Application Support/AndroidReleaseToolkit/keystores/`, password in
napoleon's login Keychain, sops-encrypted backup on Beast
(`~/signing-keys/android/notan.yaml`). One script does the key, the backup,
the signed APK and AAB and the TestFlight upload, prompting only through the
Keychain:

```bash
bash ~/workspace/play-builds-20261112/sign/notan-1.0.0.sh   # Terminal.app on napoleon
```

Later builds sign the same way:

```bash
cd ~/workspace/android-release-toolkit
scripts/android-release with-signing --profile notan -- \
  bash -c 'cd ~/workspace/notan/app && scripts/android-build.sh assembleRelease && scripts/android-build.sh bundleRelease'
```

Raise `versionCode` in `android/app/build.gradle` for every upload. What
happens after signing (Play key swap, listings, downloads, F-Droid) is in
[PUBLISH-AFTER-SIGNING.md](PUBLISH-AFTER-SIGNING.md).

## 4. Google Play

Play Console → Create app: name `Notan: Nonogram`, Game, Free. Turn on Play
App Signing and upload `app-release.aab` to Internal testing first. Listing:
`app-store/google-play/en-US/*.txt`, icon `google-play/images/icon-512.png`,
feature graphic `google-play/images/feature-1024x500.png` (cropped from the
game's own `og.png`), phone screenshots `google-play/screenshots/phone/`
(1080×1920), tablet `google-play/screenshots/tablet/` (1600×2560). Data
safety, content rating and target audience: `app-store/PRIVACY.md`. A new
personal developer account may need the closed-testing period before
production.

## 5. F-Droid repository and downloads site

Both take the signed APK from step 3; details in PUBLISH-AFTER-SIGNING.md. Use the existing flows:
the owned batch in the LocalType releases F-Droid repository
(android-release-toolkit), and the `android-download-publish` skill for the
dr.eamer.dev downloads page. The APK holds no permissions and no trackers,
which suits both.
