# Device checks

Checklist for each candidate, then the record of each run.

## Checklist

- [ ] Opens straight to the board (the opening boards on a first launch); nothing opens by itself.
- [ ] Solve a few boards by taps; the board fills with color and the arrow goes on.
- [ ] A board in progress survives the app being killed and relaunched.
- [ ] Light and dark follow the system; the in-game theme overrides it, cutout band included.
- [ ] Download (Settings → Colored puzzle, or after a Free draw) opens the share sheet with the PNG.
- [ ] Copy link puts a `https://lukesteuber.com/games/slant/?puzzle=…` link on the clipboard.
- [ ] Android: system Back closes an open sheet, then leaves the app.
- [ ] Links open the system browser.
- [ ] iOS: the console prints `⚡️  WebView loaded` and no "UIScene life cycle is required" line.
- [ ] iPhone Duo: the page logs `SlantCheck duoFold=true duoHandler=true saveHandler=true`.
- [ ] Android: `dumpsys package com.oneimpossiblethingatatime.slant` lists no runtime or INTERNET permission.

## 2026-11-14, payload 16b71d2 (game-riffs 7fb1780), debug builds

Simulators (napoleon, Xcode 27.2, iOS 27.2 runtime), made for this app so
other sessions' simulators were not touched: "Slant iPhone 6.9" (iPhone 17
Pro Max), "Slant iPad 13" (iPad Pro 13-inch M5), "Slant iPhone Duo".
Emulator: AVD `Slant_Check_API36` (Pixel 6, API 36.1, Google APIs) on port
5566. The Mac's load average was 150–350 during the run, so first loads were
slow (30 s for the first iOS WebView load).

Android checks drove the WebView over Chrome DevTools (debug build) to seed
saves and press buttons, plus real `adb shell input` taps where a user
gesture mattered. iOS checks used the Debug-only `-SlantShot` scenes (no taps
are possible on the simulator from the command line).

| Check | iPhone 17 Pro Max (iOS 27.2) | iPad 13" | Duo outer | Android (API 36.1) |
|---|---|---|---|---|
| Launch, board shown | yes; `WebView loaded`, no UIScene line | yes | yes | yes (after Android's one-time "Viewing full screen" notice) |
| Page sees the bridges | `SlantCheck duoFold=true duoHandler=true saveHandler=true native=true duoCss=true` | not logged | not logged | `SlantShell.savePicture` present |
| Solved board in color | yes (seeded board 41) | yes | yes | yes |
| Download → share sheet | yes: "slant-s35, PNG Image, 112 KB", Save Image offered | not run | not run | yes: Android chooser, "Sharing image" with the colored board |
| Copy link | not run (needs a tap) | | | yes with a real tap: "Link copied." (a scripted click falls back to showing the link, as designed) |
| Save after kill + relaunch | not run | | | kept (force-stop, relaunch: board 41, 41 solved) |
| In-game Dark on a light phone | n/a | | | **cutout band was white; fixed** (window background now follows the page) |
| Back closes sheet, then leaves | n/a | n/a | n/a | yes |
| Scores | absent (scores.js not shipped); no request leaves the page | | | `BridgesScores` absent |
| Access: camera and eye-tracker inputs | disabled by the CSP (Head, Eyes, Eye tracker grayed out) | | | same |

Unit tests: Android `scripts/android-build.sh test` 13 tests (viewport bounds,
backdrop color, shared picture names and PNG check), all pass. Lint
(`lintRelease`): no issues. `smoke.sh --with-source ../slant`: green.

Game tests in `../slant/` at game-riffs 7fb1780: test-engine (16155 checks),
test-regions (25476), test-feedback (28304), test-ui (359 browser checks,
10 viewport/theme states, axe), test-free (115), test-locks (79),
test-regions-ui (63 + 112), test-settled-clues, test-share (37),
test-download (48), test-capture (9): all pass. test-scores needs
game-riffs' `bridges/leaderboard/server.py` and was not run; the app ships
no scores.

Duo layout (changed 2026-11-14): the book and laptop layouts were removed, so
the board keeps the game's own layout in every pose and spans the hinge. Seen
on the "Slant Duo 20261114" simulator's inner screen, unfolded by hand in
Device Hub, in portrait and landscape on board 24: the board is centered and
fills the screen, with the readout above and the toolbar below. The earlier
split layouts had only been checked in Chromium with a hand-set fold.

Not checked: physical devices, VoiceOver and TalkBack, a hardware keyboard,
iOS Copy link and the iOS "Share" button (Web Share), Android API levels
below 36, landscape, a Release-signed binary on either platform.

Store screenshots in `app-store/` come from these runs.
