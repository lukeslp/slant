# Privacy and rating answers

What to enter in App Store Connect and the Google Play Console for Slant
1.0.0. Each answer is backed by something checkable in this folder.

## Why "no data collected" is true

- The payload (`www/`) carries a Content-Security-Policy that allows fetches,
  sockets, scripts, styles, fonts and images from the bundled files only
  (`connect-src 'self' blob: data:`; the two extra sources let the page read
  its own picture back for Download). `scripts/export-www.py` removes the web
  game's GoatCounter script and its public score scripts (`scores.js`,
  `score-clock.js`), and `scripts/smoke.sh` fails if either comes back.
- The Access frame's camera and eye-tracker inputs are disabled by that same
  policy (they need WebAssembly or a socket to 127.0.0.1), so the app never
  asks for the camera and has no camera usage string.
- The Android manifest requests no permissions, INTERNET included
  (`smoke.sh` fails on any `<uses-permission>`). Sharing a picture uses a
  FileProvider that lends one file in the app's cache to the app the player
  picks, for that one share. The iOS app's only usage string is
  `NSPhotoLibraryAddUsageDescription`: add-only access, asked the first time
  the player chooses Save Image in the share sheet. The app never reads the
  photo library.
- Progress lives in the WebView's local storage on the device. Android
  backup is off (`allowBackup="false"`, `data_extraction_rules.xml`
  excludes everything). On iOS, app data takes part in the user's own
  iCloud or computer backup as for every app; the developer never receives it.
- The outbound links (All games and lukesteuber.com, at the foot of Settings
  and How to play) open in the system browser and leave the app. Copy link
  puts a lukesteuber.com/games/slant/ link to the current puzzle on the
  clipboard; it names the puzzle only, never the player's answer. Download
  hands a picture to the system share sheet. Nothing is sent by the app itself.

## App Store Connect

| Question | Answer |
|---|---|
| App Privacy: data collection | **Data Not Collected** |
| Tracking | No |
| Privacy policy URL | Proposed `https://lukesteuber.com/games/slant/privacy.html`. **Not live yet**: the page is `app-store/privacy.html`; publishing it (into game-riffs `slant/` or straight onto Drummer) waits for Luke's OK |
| Export compliance | Uses no non-exempt encryption (`ITSAppUsesNonExemptEncryption` = NO is already in `Info.plist`) |
| Age rating | Every content question **None** / **No**; Unrestricted Web Access **No** (links open Safari, there is no in-app browser); Social media (`ageRatingDeclarations.socialMedia`) **No**; Gambling, contests, user-generated content **No**. Expected result 4+ |
| Category | Games → Puzzle (secondary: Games → Board, optional) |
| Photo library (App Privacy) | Not data collection: add-only saving the player starts, nothing read or sent |
| Price | Free, no in-app purchases |
| Sign-in for review | Not required |

## Google Play Console

| Section | Answer |
|---|---|
| Data safety: collects data | **No** |
| Data safety: shares data | **No** |
| Data safety: encrypted in transit | Not applicable (no data leaves the device) |
| Data safety: deletion request | Not applicable (no account, nothing collected) |
| Ads | No ads |
| App access | All functionality available without restrictions |
| Content rating (IARC questionnaire) | Category Puzzle; no violence, sexuality, language, controlled substances, gambling, user interaction, location sharing or purchases. Expected: Everyone / PEGI 3 |
| Target audience | 13 and over is the low-effort choice. Picking an under-13 group also enrolls the app in the Families policy (teacher-approved review, extra declarations); nothing in the app blocks it, but it is more paperwork |
| Government app, financial features, health, news | No |
| Privacy policy URL | Same page as for the App Store |
| Category | Game → Puzzle |
| Tags | Puzzle, Logic, Offline, Single player |
