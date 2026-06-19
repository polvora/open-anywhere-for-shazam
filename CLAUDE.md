# CLAUDE.md — Open Anywhere for Shazam

Context for Claude Code working on this project.

## Localization (confirmed multilingual — keep it)

shazam.com is genuinely multilingual: the same track renders fully localized per
locale path (e.g. `/es-es/` shows Spanish page chrome and `document.title`
suffix, `/en-us/` shows English). This is why `extractSong` must stay
language-independent and why the `_locales/en` + `_locales/es` + `__MSG__` i18n
setup is kept rather than collapsed to English-only.

## What this is

A browser extension (Manifest V3) that injects **YouTube**, **YouTube Music**
and **Spotify** search buttons into `shazam.com` song pages, next to the
existing Apple Music button. Shazam (owned by Apple) almost always links only to
Apple Music; this fills the gap.

No audio recognition, no API, no API key, no data collection. It only reads the
artist + title already on the page and builds search links.

## Architecture

| File | Role |
|---|---|
| `manifest.json` | MV3 config. Name/description via `__MSG__` i18n. Universal: includes `browser_specific_settings.gecko` so the same package loads on Chromium **and** Firefox. |
| `content.js` | All logic: extraction, button building, injection, SPA handling. Runs only on `shazam.com`. |
| `styles.css` | Button styles (pill buttons, brand colors). |
| `_locales/en`, `_locales/es` | UI label + store name/description (English default). |
| `icons/` | 16 / 48 / 128 px PNG icons. |
| `docs/screenshot.png` | README / store screenshot (currently a mockup; replace with a real capture if desired). |

## Key implementation notes (don't regress these)

- **Language-independent extraction** (`extractSong` in `content.js`): primary
  strategy is the visible artist link (`a[class*="ArtistLink"]`) + `document.title`
  parsed as `"TITLE - ARTIST: <localized suffix>"`. Fallbacks: `og:description`
  (English only) and `og:title`. Do not make extraction depend on Shazam's CSS
  class names alone — they are hashed and change.
- **SPA navigation**: shazam.com is a Next.js SPA. The script patches
  `history.pushState/replaceState`, listens to `popstate`, and runs a
  `MutationObserver` to re-inject when the song changes without a reload.
  Injection is debounced (~350ms) and de-duplicated by song key.
- **Injection target**: `[class*="musicButtonsContainer"]`, with fallbacks
  (next to the Apple Music button, then a floating button).
- **Search links, not direct videos** — intentional. On YouTube the same song
  has covers/lives/lyric videos, so showing search results and letting the user
  pick is more reliable than guessing one video. A direct top result would need
  the YouTube Data API + key; only add that if explicitly requested.
- **Naming is trademark-aware**: the store **title** is "Open Anywhere for
  Shazam" (the `for X` pattern, no Google/YouTube trademark in the title).
  Service names belong in the **description**, not the title. Don't put "YouTube"
  back in the name.

## Next steps you can help with

1. **Initialize Git and push:**
   ```bash
   git init && git add -A
   git commit -m "feat: Open Anywhere for Shazam v1.0.0"
   git branch -M main
   ```
   Then create the GitHub repo and push. If the `gh` CLI is installed:
   ```bash
   gh repo create open-anywhere-for-shazam --public --source=. --push
   ```
   Otherwise create an empty repo on github.com, then:
   ```bash
   git remote add origin https://github.com/<USER>/open-anywhere-for-shazam.git
   git push -u origin main
   ```
   The first push triggers a one-time browser auth (Git Credential Manager);
   later pushes reuse the cached token.
2. **Replace `YOUR_USERNAME`** in `manifest.json` (`homepage_url`) with the real
   GitHub user.
3. **Build store packages** (zip the extension files only — manifest, content.js,
   styles.css, _locales, icons; not docs/CLAUDE.md/git files):
   ```bash
   zip -r open-anywhere-for-shazam.zip manifest.json content.js styles.css _locales icons
   ```
4. **Optional:** real screenshot, YouTube Data API option for direct video links,
   Firefox AMO signing.

## Publishing reference

| Store | Cost | Notes |
|---|---|---|
| Chrome Web Store | one-time $5 dev fee | https://developer.chrome.com/docs/webstore/register |
| Microsoft Edge Add-ons | free | same zip |
| Firefox (AMO) | free | same zip; needs AMO signing for permanent install |

## Testing

Load unpacked: `chrome://extensions` (or `edge://extensions`) → Developer mode →
Load unpacked → select this folder. Open any `shazam.com/song/...` page; buttons
appear under the "Listen on:" label. Verified working on a live Shazam page
during initial build (extraction + injection + placement).
