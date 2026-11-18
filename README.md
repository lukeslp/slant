# Slant

Draw one diagonal in every square, match the numbers, and close no loops.
This private repository holds the Slant game source and its iPhone, iPad and
Android app.

| Path | What it is |
|---|---|
| `slant/` | The game: plain HTML, CSS and JavaScript, copied from [game-riffs](https://github.com/lukeslp/game-riffs) `slant/`. Development and the web release at <https://lukesteuber.com/games/slant/> stay there |
| `SOURCE.json` | The game-riffs commit `slant/` came from, with the SHA-256 of every file |
| `tools/sync-from-game-riffs.sh` | Copies `slant/` from a game-riffs commit and commits it as `Sync slant/ from game-riffs <sha>` |
| `app/` | The native app: a Capacitor shell around the game, for iOS and Android. Start with [app/README.md](app/README.md) |

The game is synced at game-riffs `4a9c688` (November 18, 2026), the same
commit Minimal Primitives 0.5.11 and the web release run. Earlier syncs:
`ff6f321` and `7fb1780` (November 14); before that this repository was a
one-commit snapshot from game-riffs `7d12e79` (October 11, 2026).

Open `slant/index.html` through any local static server to play the web
version. Its tests are the `test-*.cjs` files in `slant/`; the app's checks
are in `app/README.md`.

## Rights

The code is MIT licensed (`app/LICENSE`). IBM Plex Sans and IBM Plex Mono
are under the SIL Open Font License 1.1 (`slant/fonts/OFL.txt`,
`app/THIRD-PARTY-NOTICES.md`).
