# ACC — Grafiken für Stores & Spenden-Seiten

Referenzen: [Chrome Web Store Images](https://developer.chrome.com/docs/webstore/images), [Firefox appealing listing](https://extensionworkshop.com/documentation/develop/create-an-appealing-listing/), [Ko-fi cover](https://help.ko-fi.com/hc/en-us/articles/360004243378), [Patreon creator](https://www.patreon.com/portal/registration/register-clips).

---

## Bereits im Repo (`icons/`)

| Datei | Größe | Verwendung |
|-------|-------|------------|
| `icon-16.png` | 16×16 | Browser-Toolbar |
| `icon-48.png` | 48×48 | Extensions-Seite, AMO-Thumbnail |
| `icon-128.png` | 128×128 | CWS Store-Icon, AMO Detail, ZIP-Pflicht |

Optional für AMO HiDPI: **96×96** und **32×32** im Manifest (noch nicht gesetzt).

---

## Chrome Web Store (Pflicht + empfohlen)

| Asset | Maße | Format | Pflicht | Inhalt |
|-------|------|--------|---------|--------|
| Extension icon | **128×128** | PNG | Ja (im ZIP) | ACC-Logo, klar bei 16px |
| Screenshot | **1280×800** (oder 640×400) | PNG/JPEG | **Min. 1**, max. 5 | Popup auf AI-Site, Confirm-Dialog, leere History |
| Small promo tile | **440×280** | PNG/JPEG | Ja (Dashboard-Upload) | Name + „18 AI platforms“ + Icon |
| Marquee promo | **1400×560** | PNG/JPEG | Nein | Nur für Featured; optional |

Design-Tipps CWS:
- Volle Fläche, **keine abgerundeten Ecken / kein Padding** in Screenshots
- Wenig Text im Bild — Beschreibung steht im Listing
- Screenshots = **echte UI**, aktuelle Version 1.0.x

**Empfohlene 3–5 Screenshots:**
1. Popup auf `claude.ai` (Supported site erkannt)
2. Confirm-Dialog „Delete all“
3. Progress während Delete
4. Popup Footer (GitHub / Support — keine irreführenden Claims)
5. Optional: Firefox/Android oder 18-Platform-Übersicht (Grafik, kein Fake-UI)

---

## Firefox AMO

| Asset | Maße | Format | Pflicht | Inhalt |
|-------|------|--------|---------|--------|
| Icons | 48, 128 (im XPI) | PNG | Ja | wie oben |
| Marketing icon | **512×512** | PNG/JPG | Optional (Dashboard) | Größeres Logo für AMO |
| Screenshot | **1280×800** (1,6∶1) | PNG/JPG | **Min. 1** | Gleiche Motive wie CWS |
| Min. Screenshot | 600×400 | — | — | Untergrenze |

AMO: **kein** Small/Marquee-Tile wie CWS — nur Icon + Screenshots + Text (DE/EN).

---

## Ko-fi (`ko-fi.com/aichatcleaner`)

| Asset | Maße | Format | Wo |
|-------|------|--------|-----|
| Profilbild | **1∶1**, z. B. 400×400 | PNG/JPG | Page Settings |
| Cover / Header | **1200×400** (3∶1), max. 8 MB | PNG/JPG | Cover image |
| Social preview | **600×300** (2∶1) oder 1200×630 OG | PNG/JPG | „Customize preview“ |
| Bio-Text | — | Text | GitHub, AMO, sunnyc.de Links |

Wichtig: Wichtiges **mittig** platzieren (Mobile croppt die Ränder).

---

## Patreon (`patreon.com/SunnyCueq`)

| Asset | Maße | Format | Wo |
|-------|------|--------|-----|
| Profilbild | **1∶1**, min. 300×300 | PNG/JPG | Creator settings |
| Page cover | **1600×400** empfohlen (breit) | PNG/JPG | Page header |
| Tier cover (Supporter 3 €) | **2∶1**, z. B. 460×200 | PNG/JPG | Mitgliedschafts-Level (optional) |

About-Text: ACC, 18 Plattformen, MIT, kein Tracking, Links zu GitHub + Stores.

---

## Schnell-Checkliste vor Publish

- [ ] CWS: 128 icon im ZIP + ≥1 Screenshot 1280×800 + 440×280 promo
- [ ] AMO: ≥1 Screenshot 1280×800 + Listing DE/EN
- [ ] Ko-fi: Cover 1200×400 + Avatar + Social preview
- [ ] Patreon: Avatar + Cover + Supporter-Tier veröffentlicht
- [ ] Alle Screenshots zeigen **dieselbe** Extension-Version
