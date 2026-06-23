# AI Chat Cleaner (ACC)

[English](README.md) · [Sunny C.](https://sunnyc.de)

Alle Unterhaltungen auf [claude.ai](https://claude.ai) gesammelt löschen.

Fork von [emcquee/claudedeleter](https://github.com/emcquee/claudedeleter), weiterentwickelt von **Sunny C.** — [sunnyc.de](https://sunnyc.de)

## Downloads

[GitHub Releases](https://github.com/benjarogit/claudedeleter/releases):

| Datei | Ziel |
|-------|------|
| `acc-firefox.zip` / `.xpi` | Firefox Desktop + **Firefox für Android** |
| `acc-chrome.zip` | Chrome Desktop |
| `acc-edge.zip` | Edge Desktop |
| `acc-console.js` | Beliebiger Browser (ohne Erweiterung) |

## Mobile Unterstützung

| Plattform | Erweiterungen |
|-----------|---------------|
| **Firefox für Android** | Ja (nach AMO-Installation) |
| Chrome Android | Nein (Google-Richtlinie) |
| Edge mobil | Nein |
| Safari iOS | Nein |

Details: `MOBILE-README.txt` im Release.

## Mozilla AMO — was hochladen?

**`acc-firefox.zip`** wählen (`.xpi` ist identisch).

Bei „Mit welchen Anwendungen kompatibel?“ **Firefox** und **Firefox für Android** ankreuzen.

Der AMO-Fehler mit `service_worker` ist behoben: Firefox-Manifest enthält jetzt `background.scripts` als Fallback.

Neue Add-on-ID: `aichatcleaner@sunnyc.de` (neuer Upload, nicht die alte `claude-deleter@…`-ID).

Quellcode bei AMO angeben: GitHub-Repo + `npm ci && npm run build`.

## Ein-Klick-Installation

Für Endnutzer nur über offizielle Stores (AMO, Chrome Web Store, Edge Add-ons). GitHub liefert ZIP/XPI für manuelle Installation und Store-Einreichung.

## Manuelle Installation

### Firefox (Desktop & Android)

**Nach AMO-Freigabe:** von addons.mozilla.org installieren.

**Temporär (Desktop):** `about:debugging` → Temporäres Add-on laden → `manifest.json` aus entpacktem `acc-firefox.zip`.

**Android:** Nach AMO-Install in Firefox für Android `claude.ai` öffnen → Menü → Erweiterungen → ACC.

### Chrome / Edge

1. `acc-chrome.zip` oder `acc-edge.zip` entpacken
2. `chrome://extensions` bzw. `edge://extensions` → Entwicklermodus → Entpackte Erweiterung laden

### Konsole (ohne Erweiterung)

1. Auf claude.ai einloggen
2. Entwicklertools → Konsole → `acc-console.js` einfügen → Enter

## Build

```bash
npm ci && npm run build
```

## Lizenz

MIT — Copyright (c) 2026 [Sunny C.](https://sunnyc.de)
