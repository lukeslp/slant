# Privacy and rating answers

What to enter in App Store Connect and the Google Play Console for Notan
1.0.0. Each answer is backed by something checkable in this folder.

## Why "no data collected" is true

- The payload (`www/`) carries a Content-Security-Policy that allows fetches,
  sockets, scripts, styles, fonts and images from the bundled files only
  (`connect-src 'self'`). `scripts/export-www.py` removes the web game's
  GoatCounter script, and `scripts/smoke.sh` fails if it comes back.
- The Android manifest requests no permissions, INTERNET included
  (`smoke.sh` fails on any `<uses-permission>`). The iOS app asks for none
  (no usage-description keys in `Info.plist`).
- Progress lives in the WebView's local storage on the device. Android
  backup is off (`allowBackup="false"`, `data_extraction_rules.xml`
  excludes everything). On iOS, app data takes part in the user's own
  iCloud or computer backup as for every app; the developer never receives it.
- The one outbound link (lukesteuber.com, at the foot of How to play) opens
  in the system browser and leaves the app. Quick play's Share blank hands a
  playnotan.com link to the system share sheet or the clipboard; nothing is
  sent by the app itself.

## App Store Connect

| Question | Answer |
|---|---|
| App Privacy: data collection | **Data Not Collected** |
| Tracking | No |
| Privacy policy URL | `https://playnotan.com/privacy.html` (live; source is game-riffs `notan/privacy.html`, also bundled as `www/privacy.html`) |
| Export compliance | Uses no non-exempt encryption (`ITSAppUsesNonExemptEncryption` = NO is already in `Info.plist`) |
| Age rating | Every content question **None** / **No**; Unrestricted Web Access **No** (the single link opens Safari, there is no in-app browser); Social media (`ageRatingDeclarations.socialMedia`) **No**; Gambling, contests, user-generated content **No**. Expected result 4+ |
| Category | Games → Puzzle (secondary: Games → Board, optional) |
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
