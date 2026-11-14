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
| iOS bundle id | `com.oneimpossiblethingatatime.slant` (confirmed by Luke 2026-11-14; permanent after first upload) |
| Android application id | same |
| Apple team | `596T7J7FB6` |
| Android key | toolkit profile `slant`, alias `slant-release` (toolkit PR 25, merged `ec3d98c`) |
| Version | `1.0.0 (1)` on both platforms |

## 0. Before anything

1. ~~Luke confirms the id.~~ Done 2026-11-14 ("Yes, use it"). The sign
   script's PROPOSED gate now passes.
2. ~~Privacy page.~~ Live at `https://lukesteuber.com/games/slant/privacy.html`
   since 2026-11-14 (game-riffs PR 164; web release `slant-privacy-ff6f321` on
   Drummer, with `rollback.sh` beside it).
3. ~~Spelling fix.~~ game-riffs PR 161 merged; the app is synced at ff6f321 and
   the How to play screenshots were retaken.
4. Optional: tell the Minimal Primitives release session which game commit
   this app ships, so the two stay in step.

## Store records (created 2026-11-14, Luke's yes)

| Store | Record |
|---|---|
| App Store Connect | "Slant: Line Puzzle", app id 6834941283, bundle id resource TSD26XQ3UR, SKU `slant-ios`, version 1.0 Prepare for Submission. Description, keywords, promotional text, subtitle, support/marketing/privacy URLs, copyright, category Games > Puzzle, age-rating answers (all None/No) and 12 screenshots (6.9" iPhone, 13" iPad, Duo outer) are set. App Privacy "Data Not Collected" is saved but **not published**: its Publish button is an attestation for Luke to click. Price and availability not set yet |
| Google Play | "Slant: Line Puzzle", app id 4975454377394591407, Game, Free, both declarations ticked, automatic protection left on (as Notan). App signing key swapped to the slant key with PEPK on 2026-11-14 (now D9:C7:71:83:…:80:91:F9; Google's generated 63:BB:90:79:… was never used). Encryption public key: `~/workspace/play-packets-20261111/play-signing/slant/encryption_public_key.pem` (SHA-256 56f8c613…). No release uploaded yet |

## Where 1.0.0 (1) stands (2026-11-14 evening)

Luke's go for all four channels: "Yes, all four".

| Channel | State |
|---|---|
| App Store | Build 1 uploaded (altool), processed VALID and attached to version **1.0.0**. **Submitted for review 2026-11-14 evening (Luke: "let's submit"), Waiting for Review**, after a casual-voice pass over the store copy. Free in all 175 territories; App Privacy "Data Not Collected" published; content rights, export compliance (no non-exempt encryption), age rating, review contact and notes set. |
| Google Play | Internal testing: release 1 (1.0.0) **available to internal testers** (email list luke-only) since 15:16 PST. The store listing, graphics and App content forms are not filled yet, so Play shows a temporary name; they are needed before a closed test |
| Direct download | https://dr.eamer.dev/downloads/android/slant/slant-1.0.0-1-244d1fa3.apk (SHA-256 `244d1fa3…63ab`), page https://lukesteuber.com/downloads/apps/slant/ (downloads-site `c6ec008`; toolkit PR 28) |
| F-Droid (LocalType releases) | Slant 1.0.0 (1) in the index (target `20261114-slant-1.0.0-1-244d1fa3`, downloads-site `942e2a3`; keyboard PR 281) |

## 1. Sign and build (Terminal.app on napoleon)

```bash
bash ~/workspace/play-builds-20261112/sign/slant-1.0.0-1.sh
```

It makes the `slant` key (password straight into the Keychain), backs it up
sops-encrypted on Beast (`~/signing-keys/android/slant.yaml`), writes the PEPK
key-swap ZIP (`play-signing/slant/slant-play-signing-key.zip`), runs smoke,
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

## 4. Downloads page (needs Luke's yes)

`/downloads/apps/slant/` is drafted and staged, not published: catalog row and
curated page in android-release-toolkit PR 26 (`assets/slant/`), stage with a
check-then-replace manifest in `~/workspace/slant-downloads-stage-20261114/`
(its README has the publish steps). It offers the web game now; the Android
button arrives with `record-download` once the APK is signed.

## 5. After that

F-Droid (the LocalType releases repository, owned batch) and the downloads
site (`android-download-publish` skill) both take the signed APK; see
[PUBLISH-AFTER-SIGNING.md](PUBLISH-AFTER-SIGNING.md).
