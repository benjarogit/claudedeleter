# Provider probes — Phase 2A & 2B

## Warum nicht automatisch im CI?

Probes rufen **site-eigene APIs** mit **deiner Session** auf (`credentials: "include"`). Ohne Login in derselben Browser-Instanz liefern sie nur 401/Redirect — kein sinnvoller PASS/FAIL.

Phase **2A**: In-Page-Skripte (kein Extension-Build nötig).  
Phase **2B**: ACC-Extension geladen, echte Delete-Methoden, 2 Test-Items pro Methode.

---

## Phase 2A — Alle 18 Sites (≈30–45 Min)

1. `node scripts/check-probe-coverage.mjs` — listet URLs + Skripte
2. Pro Site: **eingeloggt** Tab öffnen → DevTools (F12) → Console
3. Inhalt von `scripts/e2e-probe.js` **oder** `scripts/live-probe-new-sites.js` einfügen → Enter
4. JSON-Ausgabe in `docs/TEST_MATRIX.md` Spalte „Ergebnis“ eintragen

**Perplexity / Suno:** nur nach kurzer Bestätigung (echte History/Clips).

Optional isolierter Delete-Test (live-probe):

```js
accLiveProbeNewSites({ doDeleteOne: true })
```

---

## Phase 2B — Voll-Live (Extension)

1. `dist/chrome` oder `dist/firefox` via `about:debugging` / „Entpackt laden“
2. Pro Provider (Reihenfolge = `docs/TEST_MATRIX.md`):
   - Baseline: Popup zeigt 0 / API list = 0
   - 2× Test-Chat anlegen (`ACC-TEST-1`, `ACC-TEST-2`)
   - **Eine** Delete-Methode (Extension) → Reload → verify 0
   - Wiederholen für nächste Methode
3. Status in TEST_MATRIX Spalte 2B eintragen

---

## Static checks (jeder Release)

```bash
npm run probe:coverage
npm run validate
npm run build
```
