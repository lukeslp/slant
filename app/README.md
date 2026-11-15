# Slant (iOS + Android)

Native Capacitor shell for **Slant**, the diagonal-line logic puzzle at
<https://lukesteuber.com/games/slant/>. The game is the plain HTML/CSS/JS in
`../slant/` (synced from `slant/` in lukeslp/game-riffs); this folder wraps it
for iPhone, iPad and Android as a sealed offline payload. It is Notan's shell
(`app/` in lukeslp/notan, itself modeled on Hexsweeper's) folder for folder,
plus the iPhone Duo fold bridge and a share-sheet path for the Download button.

The app opens straight onto the board, exactly like the web game: the four
one-idea opening boards on a first launch, otherwise wherever the saved game
left off. Settings and How to play are the game's own sheets.

## Decisions for the owner

| Decision | Proposed | Why |
|---|---|---|
| iOS bundle id and Android application id | **`com.oneimpossiblethingatatime.slant`** (one id for both). Confirmed by Luke 2026-11-14 | Slant has no domain of its own; this follows Minimal Primitives' `com.oneimpossiblethingatatime.minimalprimitives`. **Permanent after the first upload to either store.** To change it: `capacitor.config.js`, `android/app/build.gradle` (`namespace`, `applicationId`, plus the Java package folder), `res/values/strings.xml`, and `PRODUCT_BUNDLE_IDENTIFIER` in the Xcode project |
| App Store name | `Slant: Line Puzzle` (fallback `Slant Logic Puzzle`) | "Slant" alone is almost certainly taken (Simon Tatham's collection and several Gokigen Naname apps; "Aurora Slant: Diagonal Logic" uses "Diagonal Logic"). The home-screen name stays `Slant` (`CFBundleDisplayName`) |
| Google Play title | `Slant: Line Puzzle` | Play titles need not be unique; the suffix helps search |
| Android backup | Off | As Notan and Hexsweeper |
| Version | 1.0.0, build 1 / versionCode 1 | Fresh records on both stores |
| Game commit | game-riffs `7fb1780` | Has "color arrives at the solve" (`13e94ad`) and the Standard fill fix (`cf05b95`). Minimal Primitives pins Slant at `1e8d92e`, before both |

## The names

| Thing | Value |
|---|---|
| Product / display name | **Slant** |
| Repository | `lukeslp/slant` (private), this folder (`app/`) |
| Game source | `../slant/`, synced from game-riffs `slant/` by `../tools/sync-from-game-riffs.sh` |
| iOS bundle id / Android application id | `com.oneimpossiblethingatatime.slant` (confirmed 2026-11-14) |
| Apple team | `596T7J7FB6`, automatic signing |
| Android signing | android-release-toolkit profile `slant` (`SLANT_ANDROID_*`) |
| Store records | none yet |

## Layout

| Path | Role |
|---|---|
| `www/` | The game. Generated: **do not hand-edit** |
| `WWW_SOURCE.txt` | Which commit `www/` came from, plus per-file checksums |
| `scripts/export-www.py` | The only writer of `www/`; lists its six deliberate changes |
| `native/` | The two payload files this folder owns: `duo-layout.css`, `native.js` |
| `capacitor.config.js` | Capacitor config (`.js`, not `.ts`) |
| `ios/` | Xcode project, automatic signing, UIScene life cycle, `DuoBridge.swift` + `duo-fold.js`, `PrivacyInfo.xcprivacy` |
| `android/` | Capacitor Android project, API 24–36, no permissions |
| `scripts/smoke.sh` | Payload integrity, offline posture, both `cap sync`s |
| `scripts/android-build.sh` | JDK 21 Gradle wrapper for APK/AAB builds and unit tests |
| `scripts/generate-icons.sh` | App icons rendered from `../slant/favicon.svg` |
| `scripts/capture-shots.sh` | Store screenshots from the iPhone, iPad and Duo simulators, using the Debug scenes |
| `app-store/` | Store copy, screenshots, icons, privacy page and answers |
| `docs/` | Release steps and device checks |
| `licenses/`, `THIRD-PARTY-NOTICES.md` | Notices for bundled third-party material |

### What `export-www.py` changes

The payload is the files listed in the game's `runtime.json`, changed in six
ways, each asserted so a moved target fails the export:

1. The home-screen files (`pwa.js`, `sw.js`, `manifest.webmanifest`, `icons/`)
   and the public score files (`scores.js`, `score-clock.js`) stay out. A
   service worker has no place in a web view, and without `scores.js` the
   game has no Scores instead of posting runs to an address the app lacks.
2. The GoatCounter, `pwa.js` and score `<script>`s and the manifest and
   touch-icon `<link>`s are removed. The app sends nothing.
3. A Content-Security-Policy `<meta>` limits fetches, sockets, scripts,
   styles, fonts and images to the bundled files. The Access frame reads it
   and hides its camera and eye-tracker rows, which could not work in the app.
4. The `<title>` is just "Slant".
5. Shared puzzle links point at `https://lukesteuber.com/games/slant/`
   instead of the web view's own origin, which nobody else could open.
6. `native/duo-layout.css` and `native/native.js` are added and linked.

### Native behavior

- **Safe areas.** The game pads itself with `env(safe-area-inset-*)` under
  `viewport-fit=cover`. iOS hides the status bar; Android runs immersive and
  wraps the WebView in Hexsweeper's `GameViewport`, painting the strip beside
  a camera cutout with the page's color.
- **Theme.** The game follows the system light or dark setting unless the
  player picks one in Settings. Launch screens use the page color.
- **System Back** (Android) closes the topmost open sheet, then leaves.
- **Saves** are the game's own `localStorage` keys (`slant.*.v1`).
- **Download** (the colored-puzzle picture, in Settings and after a Free
  draw) opens the system share sheet with the PNG: Save Image, Save to Files,
  Drive, Messages. Neither web view saves a blob download by itself, so
  `native.js` hands the picture to `PictureSaver` (iOS) or
  `MainActivity.savePicture` (Android, through a FileProvider on
  `cache/shared/`). iOS's Save Image needs `NSPhotoLibraryAddUsageDescription`
  (add-only, asked the first time only).
- **Share** copies the puzzle's lukesteuber.com link. Android's WebView has
  no Web Share, so the game's own fallback copies the link there.
- **iPhone Duo.** `DuoBridge.swift` and `duo-fold.js` (snippets `d787f31`,
  as in Minimal Primitives PR 27) give the page the fold, but the layout does
  not use it: the board keeps the game's own layout in every pose and runs
  across the hinge, because the puzzle should have the whole screen.
  `native/duo-layout.css` is kept with no rules.
- **Links** open in the system browser.

The iOS shell uses the UIScene life cycle (`SceneDelegate.swift` and
`UIApplicationSceneManifest` in `Info.plist`). Keep both: UIKit refuses to
launch an iOS 27 SDK build without them (Apple TN3187). Keep Capacitor at 8.5
or later (Notan's README explains the cold-start `resume` race in 8.3.1).

## Updating the game

```bash
tools/sync-from-game-riffs.sh <game-riffs commit>   # from the repository root
cd app
python3 scripts/export-www.py
scripts/smoke.sh --with-source ../slant
```

The sync only runs `git archive` in the game-riffs checkout; it never touches
that checkout's branch. `export-www.py` refuses to run when the game files or
`native/` have uncommitted changes, so `WWW_SOURCE.txt` names real commits.

## Verify

```bash
pnpm install
pnpm smoke                                   # integrity, offline, cap sync
scripts/smoke.sh --with-source ../slant
scripts/android-build.sh test                # JVM unit tests
scripts/android-build.sh assembleDebug
JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ./android/gradlew --project-dir android lintRelease
pnpm cap:open:ios                            # Xcode
```

The game's own tests live in `../slant/` (`node test-engine.cjs`, and the
Playwright ones with `PLAYWRIGHT_MODULE` and `AXE_PATH` set); see
[docs/DEVICE_VERIFY.md](docs/DEVICE_VERIFY.md) for what was run.

To check an iOS build, launch it on an iOS 27 simulator with
`xcrun simctl launch --console-pty <device> com.oneimpossiblethingatatime.slant`:
the console must print `⚡️  WebView loaded` (a busy Mac can take a minute),
the screen must show the board, and the log must have no "UIScene life cycle
is required" line. Release steps are in [docs/RELEASE.md](docs/RELEASE.md).

## License

MIT; see [LICENSE](LICENSE). The payload bundles IBM Plex Sans and IBM Plex
Mono under the SIL Open Font License 1.1; see
[THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
