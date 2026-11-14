# After signing: Play, App Store, downloads, F-Droid

Prepared 2026-11-13, nothing here done yet. It starts once Luke has run
`~/workspace/play-builds-20261112/sign/notan-1.0.0.sh` in Terminal.app on
napoleon. That script makes the `notan` key (toolkit PR 20 adds the profile),
backs it up encrypted on Beast, builds and signs Android 1.0.0 (1), uploads
iOS 1.0.0 (1) to TestFlight, and prints the values marked ⟨from the script⟩.
Its log is `~/workspace/play-builds-20261112/sign/notan-1.0.0.log`; the files
land in `~/workspace/play-builds-20261112/notan/`.

The model is Minimal Primitives 0.5.0 (lukeslp/minimal-collection PR 22,
`docs/deployment.md`).

## Identity

| Thing | Value |
|---|---|
| Package / bundle id | `com.playnotan.app` (App ID registered in the developer account 2026-11-13, resource `72N53SY469`, team `596T7J7FB6`) |
| Version | 1.0.0, build / versionCode 1 |
| Android keystore | `~/Library/Application Support/AndroidReleaseToolkit/keystores/notan-release.jks` |
| Key alias | `notan-release` |
| Keychain item | service `com.lukesteuber.android-release-toolkit.release-key.notan`, account `android-release-signing` |
| Public certificate | `~/Library/Application Support/AndroidReleaseToolkit/public/notan-release.pem` and `.json` (SHA-256, SHA-1) |
| Encrypted backup | Beast `~/signing-keys/android/notan.yaml` (sops, age `age1enms…kpd6`) |

## Google Play (console session)

1. Create the app: name `Notan: Nonogram`, default language English (United
   States), Game, Free.
2. Before the first upload, change Play App Signing to the `notan` key
   (Change app signing key, then "Export and upload a key from Java keystore"
   with PEPK and Play's encryption public key, as was done for Minimal
   Primitives). Luke runs the PEPK command himself: the keystore password
   is in his Keychain. Keystore and alias as in the table above; the
   certificate fingerprints come from the script output. Then Play, direct and
   F-Droid installs update each other.
3. Internal testing release: upload
   `~/workspace/play-builds-20261112/notan/notan-1.0.0-1-release.aab`
   (versionCode 1, SHA-256 ⟨from the script⟩, signer ⟨from the script⟩). Name
   "Initial Testing Release". Release notes: `First release.` Testers: the
   same email lists as Minimal Primitives. The toolkit shelf copy, with
   `release.json` and `SHA256SUMS.txt`, is under
   `~/workspace/play-builds-20261112/notan/artifacts/google-play/com.playnotan.app/1.0.0-1/`.
4. Store listing: `app/app-store/google-play/en-US/` (title, short and full
   description, release notes); icon `google-play/images/icon-512.png`;
   feature graphic `google-play/images/feature-1024x500.png`; phone
   screenshots `google-play/screenshots/phone/` (four, 1080×1920); tablet
   `google-play/screenshots/tablet/` (three, 1600×2560). Privacy policy
   `https://playnotan.com/privacy.html`. Data safety, content rating, target
   audience: `app/app-store/PRIVACY.md`.

## App Store Connect (console session)

1. New App: platform iOS, name `Notan` (`Notan Nonogram` if taken), primary
   language English (U.S.), bundle id `com.playnotan.app`, SKU
   `notan-ios`, full access. Price Free (tier 0), all territories.
2. Listing from `app/app-store/metadata/en-US/` (name, subtitle, promotional
   text, description, keywords, release notes). Support URL
   `https://playnotan.com/`; marketing URL `https://playnotan.com/`;
   privacy policy `https://playnotan.com/privacy.html`; copyright
   `2026 Luke Steuber`. Category Games, subcategory Puzzle.
3. Screenshots: `app/app-store/screenshots/en-US/` — five iPhone files at
   1320×2868 (6.9" slot) and four `*-ipad.png` at 2064×2752 (13" slot).
   `asc_ship.py screenshots com.playnotan.app IOS 1.0.0 <dir>` places them.
4. App Privacy: Data Not Collected; no tracking.
5. Age rating: every content question None / No; Unrestricted Web Access
   No; `socialMedia` false (the field App Store Connect now requires before
   submission); gambling, contests, user-generated content, messaging No.
   Expected 4+.
6. TestFlight: after the script's upload processes, create an internal group
   and add Luke. Do not submit for review until Luke says so.

## Direct download (dr.eamer.dev/downloads)

Follow the `android-download-publish` skill. Values for Notan:

- APK: `notan-1.0.0-1-⟨sha8⟩.apk` from the script's output folder; slug
  `notan`; host dir `android/notan`; version `1.0.0`.
- New app, so the toolkit registry gets an entry in
  `scripts/generate_download_catalog.py` (plus a regression test), for example:

  ```python
  App(
      "notan",
      "Notan",
      "A quiet black-and-white nonogram.",
      "Games",
      "https://playnotan.com/",
      None,  # lukeslp/notan is private
      (
          android_download(
              "notan",
              "1.0.0",
              "notan-1.0.0-1-⟨sha8⟩.apk",
              "⟨apk sha256⟩",
              test=False,
              released="⟨date⟩",
          ),
          web_app("https://playnotan.com/"),
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

1. `metadata/com.playnotan.app.yml`:

   ```yaml
   Categories:
   - Games
   License: MIT
   AuthorName: Luke Steuber
   WebSite: https://playnotan.com/
   Name: Notan
   Summary: A quiet black-and-white nonogram.
   Description: <p>A black-and-white nonogram: 53 hand-drawn pictures from 2×2 to 15×15,
     New Game+ and Quick play.</p><p>Runs offline. No account, no tracking and no
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
2. `metadata/com.playnotan.app/en-US/images/icon.png`: copy
   `app/app-store/google-play/images/icon-512.png`.
3. A new batch `releases-⟨date⟩.json` with this entry (URL from the direct
   download above):

   ```json
   {
     "slug": "notan",
     "package": "com.playnotan.app",
     "name": "notan-1.0.0-1-⟨sha8⟩.apk",
     "url": "https://dr.eamer.dev/downloads/android/notan/notan-1.0.0-1-⟨sha8⟩.apk",
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
