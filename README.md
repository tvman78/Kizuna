# Kizuna ⚔️

PlayStation (PS1–PS5) game launcher — **Tv Man & FKOAC**

## Download

Latest release: **[Releases](https://github.com/tvman78/Kizuna/releases/latest)**

| Platform | File |
|---|---|
| Windows | `Kizuna-Setup-<version>.exe` — updates itself automatically |
| Android | `Kizuna-Android-<version>.apk` |
| iPhone | `Kizuna-iOS-<version>.ipa` — install with AltStore or Sideloadly |

> The Windows installer is unsigned, so SmartScreen may show a warning: **More info › Run anyway**.

## Features

- 237-game PS1–PS5 catalog with cover art
- Windows: one-click install of the official emulators (DuckStation, PCSX2, RPCS3, shadPS4) inside the app
- Phones: PS1 games run inside the app with PlayStation-style touch controls (EmulatorJS)
- Kizuna AI, powered by Claude
- Themes, year-based UI, original music, offline voice commands, controller navigation, 13 languages

Kizuna does not distribute game files; players use their own copies.

## Developer notes

- `Baslat.bat` — opens the app in development mode
- `Kurulum-Exe-Olustur.bat` — builds a local Windows installer (does not publish)
- `Guncelleme-Yayinla.bat` — bumps the version, publishes to GitHub; Android and iPhone builds are then made by GitHub Actions (`.github/workflows/mobile.yml`)
- `mobile/` — Capacitor project for Android / iOS (`node scripts/prepare.js` builds `mobile/www` from `app/`)
