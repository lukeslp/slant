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
| Version | `1.0.1 (2)` on both platforms (1.0.0 (1) is live) |

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
| Google Play | Internal testing: release 1 (1.0.0) **available to internal testers** (email list luke-only) since 15:16 PST. Store listing (casual copy, icon, feature graphic, 4 phone shots, assets not labeled as generated), category Game > Puzzle, contact email and website, and every App content form (privacy policy, sign-in none, no ads, not a government app, no financial or health features, no advertising ID, target 13+, Data safety "no data collected", content rating: ESRB Everyone / ACB General / ClassInd All ages) were sent for review on 2026-11-14 (~16:45 PST) with a **closed test (Closed testing - Alpha)**: release 1 (1.0.0), notes "First release.", all 177 countries plus rest of world, testers on the email lists coolhand-group, luke-only, what-color and wildcard, feedback to Luke's Gmail. Publishing overview shows 16 changes **in review** (managed publishing off, so it goes live when approved). The only release warning: no deobfuscation file (R8 is off) |
| Direct download | 1.0.1 (2) since 2026-11-19 (see its receipts below); 1.0.0 was https://dr.eamer.dev/downloads/android/slant/slant-1.0.0-1-244d1fa3.apk (SHA-256 `244d1fa3…63ab`), page https://lukesteuber.com/downloads/apps/slant/ (downloads-site `c6ec008`; toolkit PR 28) |
| F-Droid (LocalType releases) | 1.0.1 (2) added 2026-11-19 (receipts below); Slant 1.0.0 (1) in the index (target `20261114-slant-1.0.0-1-244d1fa3`, downloads-site `942e2a3`; keyboard PR 281) |

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

## 1.0.1 (2), prepared 2026-11-18, signed and published 2026-11-19

Brings the app to the game the web and Minimal Primitives 0.5.11 run
(game-riffs `4a9c688`; 1.0.0 shipped `ff6f321`), plus the Duo hinge layout
merged in slant#2 after 1.0.0 was built.

What players get, from game-riffs `ff6f321..4a9c688` (`slant/`):
Settings grouped under headings (Mode is now Rules, its Hard is Classic; the
shared Minimal Settings standard); a second Hint press fixes a wrong
diagonal; after the solve, Next is the round continue disc Weaves uses,
shown at once and placed by the painted board; Next past the last board
goes to the first unfinished one; the end of each campaign shows on screen.
On the iPhone Duo the board spans the hinge in every pose.

Checked on napoleon 2026-11-18, side by side with the web copy and Minimal
0.5.11's `build/html` (Playwright at 390×844, light and dark, Chromium and
WebKit): the Settings sheet lists the same headings, rows and footer in all
three except Minimal's own (Collection scores, no Share, All games to its
library); the continue disc is the same 64 px disc at the same spot; Help is
the same; no page errors. `pnpm smoke` green.

Simulator, 2026-11-18 (napoleon, Xcode 27.2, iOS 27.2 iPhone Duo sim
"Slant Duo 20261114", folded outer screen): Debug build, `scripts/capture-shots.sh … outer`
scenes solved, in progress and how to play all accepted; the solved scene shows
the new continue disc. `simctl launch --console-pty` printed `WebView
loaded`, no UIScene line and no errors, and the page logged its Duo fold bridge as wired (`SlantCheck duoFold=true duoHandler=true`). The other outer shots are
pixel-identical to 1.0's; `iphone-duo-outer/02-solved.png` was replaced
with the new disc. On the folded screen the toolbar stops short of the
trailing edge: that is iOS's status-bar column beside the camera, and 1.0
did the same. External links: no `allowNavigation` is set, so Capacitor
opens any outside host in Safari (iOS `WebViewDelegationHandler`) or the
browser (Android `Bridge.launchIntent`, `ACTION_VIEW`); read in the
Capacitor 8.5.3 source, not tapped. **Not run:** the unfolded Duo poses
(folding needs a click in Device Hub), an Android emulator (the Android
WebView is the Chromium checked above), a phone.

What's New, **approved by Luke 2026-11-18**, in
`app-store/metadata/en-US/release_notes.txt` and
`app-store/google-play/en-US/release_notes.txt`:

> Settings are grouped under headings, and Mode is now called Rules. Press
> Hint twice to fix a wrong diagonal. After a solve, the arrow takes you to
> the next board, and the board fills the whole screen on iPhone Duo.

Store screenshots retaken 2026-11-18 from Debug builds of the merged code
with `scripts/capture-shots.sh` on new simulators "Store iPhone 6.9
20261118" (iPhone 17 Pro Max) and "Store iPad 13 20261118" (iPad Pro 13"
M5), iOS 27.2: only `02-solved.png` and `02-solved-ipad.png` changed (the
continue disc); the in-progress, free-draw and how-to-play shots are
pixel-identical to 1.0.0's.

Sign script: `~/workspace/release-1.0.1-20261118/sign/slant-1.0.1-2.sh` (run in Terminal.app on
napoleon). It builds from a clean clone at the main commit that merges
these store files, and refuses unless every build input under `app/`
(all but docs, store copy and capture scripts) matches the 1.0.1 merge
`6698f44`. It signs Android with the existing release key, stages the AAB
and notes in `~/workspace/play-uploads/to-upload/`, then archives, checks,
validates and uploads the iOS build to App Store Connect. Nothing is
attached to a version or submitted. The App Store screenshots above go up
with the 1.0.1 version, once its build is processed.

### Receipts, 2026-11-19

- **Signed** by Luke (`~/workspace/release-1.0.1-20261118/sign/slant-1.0.1-2.log`), from main `45c04f4` (build inputs `6698f44`). Signer `d9c77183…8091f9` on APK and AAB; `jarsigner -verify` passes on the staged AAB.
  - APK `slant-1.0.1-2-b470087f.apk` SHA-256 `b470087fd33398512b2078e7346da6ea0d9bb42c5aad902d156c9e7978d0cf59`; AAB SHA-256 `524430536b913f3c8e6ee64eb70926970807b64e7b88e01969e491938762e6a2`; IPA SHA-256 `65f57e253cb925a4697e3129c7322de33c9ef7f4fb382166b68ff066d5286844`. Files: `~/workspace/release-1.0.1-20261118/out/slant-1.0.1-2/`.
- **TestFlight**: build 2 validated and uploaded about 00:01 PT; App Store Connect read it `VALID`, internal `IN_BETA_TESTING` (the internal group gets every build). No 1.0.1 App Store version yet: creating it, attaching build 2, the What's New and the new screenshots, and any submission wait on Luke.
- **Google Play**: `~/workspace/play-uploads/to-upload/Slant-1.0.1-2.aab` with its `.notes.txt` (the approved What's New), row in that folder's README. Not uploaded; Luke drags it in.
- **Direct download**: `https://dr.eamer.dev/downloads/android/slant/slant-1.0.1-2-b470087f.apk`, hash checked over HTTPS; the page on dr.eamer.dev and lukesteuber.com links it. downloads-site `080de4c` (with the other app's 1.0.1), backup `~/backups/publish-downloads-20261119T084157Z` on Drummer; `audit-catalog --live-registry` exit 0; registry row android-release-toolkit PR 50, merged `d2560e1`.
- **Hosted F-Droid**: target `20261119-slant-notan-1.0.1-b470087f` (downloads-site `f0196a3`) on top of `20261119-minimal-primitives-0.5.12-7ff2cc89`; 25 packages, 52 → 54 versions, only Slant 1.0.1 and Notan 1.0.1 added. Galactus workspace adopted (index `b449ea40…`). Batch `releases-20261119b.json`, localtype-keyboard PR 334, merged `a3911ed`. Scripts and logs: `~/workspace/release-1.0.1-20261118/publish/`.
- **Still not run**: the unfolded Duo poses, a phone run of the signed build.
