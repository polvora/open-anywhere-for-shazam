# Open Anywhere for Shazam

Adds **YouTube**, **YouTube Music** and **Spotify** buttons to song pages on
[shazam.com](https://www.shazam.com), next to the existing Apple Music button.

Shazam is owned by Apple, so its pages usually link to Apple Music only. This
adds the links most people actually want — no account, API key, or tracking.

![Screenshot](docs/screenshot.png)

The buttons open a **search** (`"artist title"`) on each service rather than one
fixed video, since the same song has covers, live versions and lyric videos —
letting you pick is more reliable than guessing.

## Install

**Chrome / Edge / Brave / Opera / Vivaldi / Arc**

1. Open `chrome://extensions` (or `edge://extensions`) and enable **Developer mode**.
2. **Load unpacked** → select this folder.
3. Open any song on `shazam.com` — buttons appear under "Listen on:".

**Firefox**

1. Open `about:debugging#/runtime/this-firefox`.
2. **Load Temporary Add-on** → select `manifest.json`.

## How it works

A single Manifest V3 content script runs only on `shazam.com`. It reads the
artist and title already on the page (language-independent) and injects search
links. No data is collected or sent anywhere — see [PRIVACY.md](PRIVACY.md).

## Customize

Edit the `SERVICES` array in [`content.js`](content.js) to add or remove a
service. Change the "Listen on:" label in `_locales/en` and `_locales/es`.

## Disclaimer

Unofficial. Not affiliated with Apple, Shazam, YouTube, Google, or Spotify.
"Shazam" is a trademark of Apple Inc.

## License

[MIT](LICENSE)
