# After signing: Play, App Store, downloads, F-Droid

Prepared 2026-11-14, nothing here done yet. It starts once Luke has
confirmed the id and run `~/workspace/play-builds-20261112/sign/slant-1.0.0-1.sh`
in Terminal.app on napoleon. That script makes the `slant` key (toolkit PR 25
added the profile), backs it up encrypted on Beast, builds and signs Android
1.0.0 (1), stages the AAB in `~/workspace/play-uploads/to-upload/`, exports
an iOS 1.0.0 (1) IPA without uploading it, and prints the values marked
⟨from the script⟩. Its log is `~/workspace/play-builds-20261112/sign/slant-1.0.0-1.log`;
the files land in `~/workspace/play-builds-20261112/slant/`.

The model is Slant 1.0.0 (lukeslp/slant `app/docs/`), itself following
Minimal Primitives 0.5.0.

## Identity

| Thing | Value |
|---|---|
| Package / bundle id | `com.oneimpossiblethingatatime.slant` (confirmed 2026-11-14; the App ID is registered by the sign script's first archive; team `596T7J7FB6`) |
| Version | 1.0.0, build / versionCode 1 |
| Android keystore | `~/Library/Application Support/AndroidReleaseToolkit/keystores/slant-release.jks` |
| Key alias | `slant-release` |
| Keychain item | service `com.lukesteuber.android-release-toolkit.release-key.slant`, account `android-release-signing` |
| Public certificate | `~/Library/Application Support/AndroidReleaseToolkit/public/slant-release.pem` and `.json` (SHA-256, SHA-1) |
| Encrypted backup | Beast `~/signing-keys/android/slant.yaml` (sops, age `age1enms…kpd6`) |

## Google Play (console session)

1. Create the app: name `Slant: Line Puzzle`, default language English (United
   States), Game, Free.
2. Before the first upload, change Play App Signing to the `slant` key
   (Change app signing key, then "Export and upload a key from Java keystore"
   with PEPK and Play's encryption public key, as was done for Minimal
   Primitives). Luke runs the PEPK command himself: the keystore password
   is in his Keychain. Keystore and alias as in the table above; the
   certificate fingerprints come from the script output. Then Play, direct and
   F-Droid installs update each other.
3. Internal testing release: upload
   `~/workspace/play-uploads/to-upload/Slant-1.0.0-1.aab` (same bytes as `play-builds-20261112/slant/slant-1.0.0-1-release.aab`)
   (versionCode 1, SHA-256 ⟨from the script⟩, signer ⟨from the script⟩). Name
   "Initial Testing Release". Release notes: `First release.` Testers: the
   same email lists as Minimal Primitives. The toolkit shelf copy, with
   `release.json` and `SHA256SUMS.txt`, is under
   `~/workspace/play-builds-20261112/slant/artifacts/google-play/com.oneimpossiblethingatatime.slant/1.0.0-1/`.
4. Store listing: `app/app-store/google-play/en-US/` (title, short and full
   description, release notes); icon `google-play/images/icon-512.png`;
   feature graphic `google-play/images/feature-1024x500.png`; phone
   screenshots `google-play/images/phone/` (four, 1080×2160). No tablet set
   yet. Privacy policy
   `https://lukesteuber.com/games/slant/privacy.html`. Data safety, content rating, target
   audience: `app/app-store/PRIVACY.md`.

## App Store Connect (console session)

1. New App: platform iOS, name `Slant: Line Puzzle` (`Slant Logic Puzzle` if taken), primary
   language English (U.S.), bundle id `com.oneimpossiblethingatatime.slant`, SKU
   `slant-ios`, full access. Price Free (tier 0), all territories.
2. Listing from `app/app-store/metadata/en-US/` (name, subtitle, promotional
   text, description, keywords, release notes). Support URL
   `https://lukesteuber.com/games/slant/`; marketing URL `https://lukesteuber.com/games/slant/`;
   privacy policy `https://lukesteuber.com/games/slant/privacy.html`; copyright
   `2026 Luke Steuber`. Category Games, subcategory Puzzle.
3. Screenshots: `app/app-store/screenshots/en-US/` — four iPhone files at
   1320×2868 (6.9" slot) and four `*-ipad.png` at 2064×2752 (13" slot).
   `asc_ship.py screenshots com.oneimpossiblethingatatime.slant IOS 1.0.0 <dir>` places them;
   the folded Duo's outer screen set is in `screenshots/iphone-duo-outer/` (1398×2034).
4. App Privacy: Data Not Collected; no tracking.
5. Age rating: every content question None / No; Unrestricted Web Access
   No; `socialMedia` false (the field App Store Connect now requires before
   submission); gambling, contests, user-generated content, messaging No.
   Expected 4+.
6. TestFlight: upload the IPA the script exported, then create an internal group
   and add Luke. Do not submit for review until Luke says so.

## Direct download (dr.eamer.dev/downloads)

Follow the `android-download-publish` skill. Values for Slant:

- APK: `slant-1.0.0-1-⟨sha8⟩.apk` from the script's output folder; slug
  `slant`; host dir `android/slant`; version `1.0.0`.
- New app, so the toolkit registry gets an entry in
  `scripts/generate_download_catalog.py` (plus a regression test), for example:

  ```python
  App(
      "slant",
      "Slant",
      "A quiet diagonal-line logic puzzle.",
      "Games",
      "https://lukesteuber.com/games/slant/",
      None,  # lukeslp/slant is private
      (
          android_download(
              "slant",
              "1.0.0",
              "slant-1.0.0-1-⟨sha8⟩.apk",
              "⟨apk sha256⟩",
              test=False,
              released="⟨date⟩",
          ),
          web_app("https://lukesteuber.com/games/slant/"),
      ),
      "No account. Saves stay on your device. The apps make no network requests.",
      ("Android 7 or later", "A current browser for the web game"),
  ),
  ```

  Add the iOS row (App Store link) once the app is live there.
- Then `record-download`, stage the catalog against a copy of the live files,
  publish under the shared lock with `check-then-replace-publish.sh`, and
  `audit-catalog --live-registry`, as in the skill.

## Hosted F-Droid repository (LocalType releases)

In `~/workspace/keyboard/web/distribution/fdroid/` (owned batch, as in
localtype-keyboard PR 258):

1. `metadata/com.oneimpossiblethingatatime.slant.yml`:

   ```yaml
   Categories:
   - Games
   License: MIT
   AuthorName: Luke Steuber
   WebSite: https://lukesteuber.com/games/slant/
   Name: Slant
   Summary: A quiet diagonal-line logic puzzle.
   Description: <p>Draw one diagonal in every square, match the numbers, close no loops:
     54 boards from 2×2 to 9×9, New Game+ and Free draw.</p><p>Runs offline. No account, no tracking and no
     internet permission.</p><p>This is an independent binary repository, separate from
     the official F-Droid catalog. The APK keeps its existing app signing key.</p>
   AutoUpdateMode: None
   UpdateCheckMode: None
   CurrentVersion: 1.0.0
   CurrentVersionCode: 1
   AllowedAPKSigningKeys:
   - ⟨signer sha256, lowercase, no colons⟩
   ```

   No `SourceCode` line: the repository is private (as for Hexsweeper).
2. `metadata/com.oneimpossiblethingatatime.slant/en-US/images/icon.png`: copy
   `app/app-store/google-play/images/icon-512.png`.
3. A new batch `releases-⟨date⟩.json` with this entry (URL from the direct
   download above):

   ```json
   {
     "slug": "slant",
     "package": "com.oneimpossiblethingatatime.slant",
     "name": "slant-1.0.0-1-⟨sha8⟩.apk",
     "url": "https://dr.eamer.dev/downloads/android/slant/slant-1.0.0-1-⟨sha8⟩.apk",
     "sha256": "⟨apk sha256⟩",
     "bytes": ⟨apk bytes⟩,
     "certificate": "⟨signer sha256⟩",
     "versionName": "1.0.0",
     "versionCode": 1,
     "debuggable": false,
     "watch": false
   }
   ```
4. Rebuild and publish the repository the usual way (new live target under
   `~/published/android-apps-fdroid/`, symlink swap), then check the index on
   both domains and fetch the APK through the repository.
