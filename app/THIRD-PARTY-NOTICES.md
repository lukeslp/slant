# Third-party notices

This folder's own code is MIT licensed; see [LICENSE](LICENSE). The items
below are bundled in the tree or pulled in at build time under their own terms.

## IBM Plex Sans and IBM Plex Mono

The game payload (`www/fonts/`) bundles IBM Plex Sans 400 and IBM Plex Mono
500 as WOFF2 files.

Copyright © 2017 IBM Corp. with Reserved Font Name "Plex". Licensed under the
SIL Open Font License, Version 1.1. Full text:
[licenses/IBM-Plex-OFL.txt](licenses/IBM-Plex-OFL.txt) (also shipped as
`www/fonts/OFL.txt`). Source: <https://github.com/IBM/plex>.

## Capacitor

The native shells depend on Capacitor (`@capacitor/core`, `@capacitor/ios`,
`@capacitor/android`, `@capacitor/cli`), MIT licensed. pnpm, Swift Package
Manager and Gradle install them at build time; none is checked in. Source:
<https://github.com/ionic-team/capacitor>.

## Android libraries

The Android build links AndroidX libraries (AppCompat, Activity, Core, Core
SplashScreen, CoordinatorLayout, Fragment, WebKit and their dependencies,
copyright The Android Open Source Project), the Apache Cordova Android
framework that Capacitor includes (copyright The Apache Software Foundation)
and the Kotlin standard library (copyright JetBrains s.r.o. and Kotlin
Programming Language contributors), all under the Apache License, Version
2.0. Gradle fetches them at build time.

## Code from Hexsweeper

`GameViewport.java`, `GameViewportBounds.java`, `BackdropColor.java` and
their tests come from Hexsweeper's Android shell (lukeslp/hexsweeper), the
same author's MIT-licensed project.
