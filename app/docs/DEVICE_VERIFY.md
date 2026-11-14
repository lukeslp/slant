# Device checks

Checklist for each candidate, then the record of the first run. Taps were
real input events (`idb ui tap` on the simulators, `adb shell input tap` on
the emulator), placed by reading the board out of a screenshot and the level
pictures out of `levels.js`; no page script was injected to solve anything.

## Checklist

- [ ] Opens straight to the board; nothing opens by itself.
- [ ] Solve at least three levels by taps; the picture and its name appear, the arrow goes on.
- [ ] Levels sheet jumps to a later level; a 15×15 board is tappable on the smallest phone.
- [ ] A board in progress survives the app being killed and relaunched.
- [ ] Light and dark follow the system; the launch screen matches.
- [ ] Rotation: board and sheets fit in landscape; sheets scroll.
- [ ] Android: system Back closes an open sheet, then leaves the app.
- [ ] The lukesteuber.com link opens the system browser.
- [ ] Android: `dumpsys package com.playnotan.app` lists no runtime or INTERNET permission.

## 2026-11-13, payload 2f7dd46 (game-riffs a402c74), debug builds

Simulators: iOS 26.5 runtime (the iOS 27.2 runtime dropped out of
CoreSimulator mid-session on napoleon, so 26.5 was used). Emulator:
`LocalType_Phone` AVD (Pixel 6, API 36.1), started `-read-only`; small-phone
and tablet sizes were set with `wm size` / `wm density`.

| Check | iPhone 17 Pro Max | iPhone SE (3rd gen) | iPad Pro 13" | Android phone |
|---|---|---|---|---|
| Opens to board | yes | yes | yes | yes (after Android's one-time "Viewing full screen" hint) |
| Levels solved by taps | 1–6, 14 (Fish) | 1–3, 49 (Moth, 15×15) | 1–3, 49, plus partial 35 and 45 | 1–6, 49, 35 (tablet size) |
| Save after kill + relaunch | kept (level 7, three squares) | kept even when killed 0.3 s after the tap | not run | kept after 1 s; **a move made 0.3 s before a force-stop was lost** (WebView storage commit delay) |
| Dark theme | yes | not run | yes | yes, including 720×1280 |
| Landscape | board and How to play fit; sheet scrolls | not run | not run | board fits |
| Small screen | n/a | 375×667 pt: 15×15 board fits and solves | n/a | 720×1280 at 320 dpi: fits after the density-change reload fix |
| Back closes sheet, then leaves | n/a | n/a | n/a | yes |
| External link | opens Safari | not run | not run | not run |
| Permissions | none requested | | | only Android's own `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`; no INTERNET |

Found and fixed during the run: on Android, changing display density while
the game was open left the board off center until relaunch; the shell now
reloads the page once on a density change.

Not checked: physical devices, VoiceOver and TalkBack, a hardware keyboard,
Share blank in Quick play (Web Share on iOS, clipboard fallback on Android),
New Game+, the Access switch frame, Android API levels below 36, foldables
and camera-cutout phones, a Release-signed binary on either platform.

Store screenshots in `app-store/` come from these runs.

## 2026-11-13 (later), payload 5a87207 (game-riffs a802c9a), debug builds

Re-export after game-riffs PRs 143 and 144 (Erase progress wording;
`privacy.html` added to the payload). Fresh installs on the iPhone 17 Pro
Max simulator (iOS 26.5) and the API 36 emulator: levels 1–3 solved by taps
on each, a square filled on level 4, the app killed (iOS terminate; Android
force-stop two seconds after the tap) and relaunched: level 4 came back with
the square filled on both. `smoke.sh --with-source ~/workspace/game-riffs/notan`
green.
