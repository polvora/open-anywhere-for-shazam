# Changelog

All notable changes to this project are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [1.0.0] - 2026-06-18 — Open Anywhere for Shazam

### Added
- Inject **YouTube**, **YouTube Music** and **Spotify** search buttons on
  `shazam.com` song pages, next to the Apple Music button.
- Language-independent extraction of artist + title (works regardless of the
  Shazam interface language).
- SPA navigation handling (re-injects when the song changes without a reload).
- Robust injection with fallbacks (music buttons container → next to Apple
  Music → floating button).
- English / Spanish UI localization.
- Universal MV3 package compatible with Chromium browsers and Firefox.
