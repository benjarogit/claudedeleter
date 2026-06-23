# AI Chat Cleaner (ACC)

[Deutsch](README.de.md) · [Sunny C.](https://sunnyc.de)

Bulk-delete all conversations on [claude.ai](https://claude.ai).

Fork of [emcquee/claudedeleter](https://github.com/emcquee/claudedeleter), maintained by **Sunny C.** — [sunnyc.de](https://sunnyc.de)

## Downloads

[GitHub Releases](https://github.com/benjarogit/claudedeleter/releases):

| File | Target |
|------|--------|
| `acc-firefox.zip` / `.xpi` | Firefox desktop + **Firefox for Android** |
| `acc-chrome.zip` | Chrome desktop |
| `acc-edge.zip` | Edge desktop |
| `acc-console.js` | Any browser (no extension) |

## Mobile support

| Platform | Extensions |
|----------|------------|
| **Firefox for Android** | Yes (after AMO install) |
| Chrome Android | No (Google policy) |
| Edge mobile | No |
| Safari iOS | No |

See `MOBILE-README.txt` in releases.

## Mozilla AMO upload

Upload **`acc-firefox.zip`**. Check **Firefox** and **Firefox for Android**.

Firefox manifest includes `background.scripts` fallback (required by AMO). Add-on ID: `aichatcleaner@sunnyc.de`.

## One-click install

End users install from official stores (AMO, Chrome Web Store, Edge Add-ons). GitHub ships ZIP/XPI for manual install and store submission.

## Manual installation

### Firefox (desktop & Android)

**After AMO approval:** install from addons.mozilla.org.

**Temporary (desktop):** `about:debugging` → Load Temporary Add-on → `manifest.json` from unzipped `acc-firefox.zip`.

### Chrome / Edge

1. Unzip `acc-chrome.zip` or `acc-edge.zip`
2. `chrome://extensions` or `edge://extensions` → Developer mode → Load unpacked

### Console (no extension)

1. Log in at claude.ai
2. DevTools → Console → paste `acc-console.js` → Enter

## Build

```bash
npm ci && npm run build
```

## License

MIT — Copyright (c) 2026 [Sunny C.](https://sunnyc.de)
