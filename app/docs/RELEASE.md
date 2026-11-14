# Release

Nothing here has been signed, uploaded or published. Every step below is the
owner's. App sessions on napoleon cannot read the login keychain, so the
signing steps run from Luke's own Terminal.

## Identity

| Thing | Value |
|---|---|
| App Store name | `Slant: Line Puzzle` (fallback `Slant Logic Puzzle`) |
| Google Play title | `Slant: Line Puzzle` |
| Home-screen name | `Slant` (`CFBundleDisplayName` / `app_name`) |
| iOS bundle id | `com.oneimpossiblethingatatime.slant` (**proposed**; permanent after first upload) |
| Android application id | same |
| Apple team | `596T7J7FB6` |
| Android key | toolkit profile `slant`, alias `slant-release` (toolkit PR 25, merged `ec3d98c`) |
| Version | `1.0.0 (1)` on both platforms |

## 0. Before anything

1. **Luke confirms the id.** Then change the `PROPOSED` comment in
   `capacitor.config.js` to "Confirmed by the owner <date>" and update the
   README table. The sign script refuses to run until then, because an
   automatic-signing archive registers the App ID with Apple.
2. **Privacy page.** `app-store/privacy.html` has to be live before either
   store accepts the listing. Proposed home:
   `https://lukesteuber.com/games/slant/privacy.html` (add it to game-riffs
   `slant/`, or copy it onto Drummer). Luke's OK first.
3. **Spelling fix.** game-riffs PR 161 changes the game's three "colour" strings
   to "color". After it merges: `tools/sync-from-game-riffs.sh <merge commit>`,
   re-export, retake the How to play screenshots (`04-*`).
4. Optional: tell the Minimal Primitives release session which game commit
   this app ships, so the two stay in step.

## 1. Sign and build (Terminal.app on napoleon)

```bash
bash ~/workspace/play-builds-20261112/sign/slant-1.0.0-1.sh
```

It makes the `slant` key (password straight into the Keychain), backs it up
sops-encrypted on Beast (`~/signing-keys/android/slant.yaml`), runs smoke,
unit tests and lint, builds and signs the release APK and AAB, checks both
signers against the key, writes the toolkit's Play shelf, stages
`Slant-1.0.0-1.aab` and its notes in `~/workspace/play-uploads/to-upload/`
with a README row, and archives and exports an App Store IPA **without
uploading it**. It prints the keystore, alias and certificate fingerprints
for the Play key swap. Log: `~/workspace/play-builds-20261112/sign/slant-1.0.0-1.log`.

Later Android builds sign the same way:

```bash
cd ~/workspace/android-release-toolkit
scripts/android-release with-signing --profile slant -- \
  bash -c 'cd ~/workspace/slant/app && scripts/android-build.sh assembleRelease && scripts/android-build.sh bundleRelease'
```

Raise `versionCode` in `android/app/build.gradle` and `CURRENT_PROJECT_VERSION`
for every upload.

## 2. Google Play (needs Luke's yes)

1. Play Console → Create app: `Slant: Line Puzzle`, English (United States),
   Game, Free.
2. **Before the first upload**, replace the key Play generated with the
   `slant` key: App integrity → App signing → Change key → "Export and upload
   a key from Java keystore". Download that app's encryption public key into
   `~/workspace/play-packets-20261111/play-signing/slant/encryption_public_key.pem`,
   add a `slant:slant:<first 11 of the cert SHA-256>` line to
   `export-keys-napoleon.sh`, run it in Terminal, upload the ZIP, Save
   (see `CONSOLE-INSTRUCTIONS.md` there).
3. Internal testing: drag `~/workspace/play-uploads/to-upload/Slant-1.0.0-1.aab`;
   release notes from the `.notes.txt` beside it. Then a closed test with the
   email lists luke-only, what-color, wildcard and coolhand-group
   (`play-packets-20261111/CLOSED-TEST-RECIPE.md`).
4. Listing: `app-store/google-play/en-US/*.txt`; icon
   `google-play/images/icon-512.png`; feature graphic
   `google-play/images/feature-1024x500.png` (cropped from the app's own
   Download picture of board 41); phone screenshots
   `google-play/images/phone/` (four, 1080×2160, from the Android emulator).
   Data safety, content rating and target audience: `app-store/PRIVACY.md`.

## 3. App Store (needs Luke's yes)

1. App Store Connect → New App: iOS, `Slant: Line Puzzle` (or the fallback),
   English (U.S.), bundle id as above, SKU `slant-ios`.
2. Upload the IPA from step 1 (`xcrun altool --upload-app -f
   ~/workspace/play-builds-20261112/slant/ios/export/App.ipa -t ios --apiKey
   <key> --apiIssuer <issuer>`, or Transporter), or rerun the archive with the
   upload added.
3. Listing: `app-store/metadata/en-US/`. Screenshots:
   `app-store/screenshots/en-US/0*.png` (1320×2868, 6.9" iPhone),
   `*-ipad.png` (2064×2752, 13" iPad), `iphone-duo-outer/` (1398×2034, the
   folded Duo's outer screen). Answers: `app-store/PRIVACY.md` (Data Not
   Collected; age rating questions including
   `ageRatingDeclarations.socialMedia` = No).
4. TestFlight: internal group first.

## 4. After that

F-Droid (the LocalType releases repository, owned batch) and the downloads
site (`android-download-publish` skill) both take the signed APK; see
[PUBLISH-AFTER-SIGNING.md](PUBLISH-AFTER-SIGNING.md).
