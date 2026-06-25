# ACC v1.0.1 — Provider test matrix

**Plan Phase 2:** 2A automatisierte Probes + 2B Voll-Live-Protokoll (18× Methoden).

> Die frühere Matrix mit durchgehend „PASS“ war **nicht durchgeführte Läufe**, nur vorbereitete Skripte. Diese Datei ist die ehrliche Quelle.

---

## Phase 2A — Automated probes (`e2e-probe.js` / `live-probe-new-sites.js`)

Voraussetzung: **eingeloggt** auf der jeweiligen Site, Skript in DevTools-Konsole einfügen.

Coverage-Check: `node scripts/check-probe-coverage.mjs`

| # | Provider | Probe script | URL | 2A Status | Ergebnis / Notiz |
|---|----------|--------------|-----|-----------|------------------|
| 1 | Claude | e2e-probe | https://claude.ai | **PENDING** | |
| 2 | ChatGPT | e2e-probe | https://chatgpt.com | **PENDING** | |
| 3 | Gemini | e2e-probe | https://gemini.google.com | **PENDING** | |
| 4 | Grok.com | e2e-probe | https://grok.com | **PENDING** | |
| 5 | Grok X | e2e-probe | https://x.com/i/grok | **PENDING** | |
| 6 | DeepSeek | live-probe | https://chat.deepseek.com | **PENDING** | |
| 7 | Perplexity | live-probe | https://www.perplexity.ai | **BLOCKED** | Echte Threads — nur mit deinem OK |
| 8 | GitHub Copilot | live-probe | https://github.com/copilot | **PENDING** | |
| 9 | Microsoft Copilot | live-probe | https://copilot.microsoft.com | **PENDING** | |
| 10 | Mistral | live-probe | https://chat.mistral.ai | **PENDING** | |
| 11 | Pi | live-probe | https://pi.ai | **PENDING** | |
| 12 | Meta AI | live-probe | https://www.meta.ai | **PENDING** | |
| 13 | Poe | live-probe | https://poe.com | **PENDING** | |
| 14 | Kagi | live-probe | https://assistant.kagi.com | **PENDING** | |
| 15 | Suno | live-probe | https://suno.com | **PENDING** | Clips — kurz bestätigen |
| 16 | Manus | live-probe | https://manus.im | **PENDING** | |
| 17 | AgentGPT | live-probe | https://agentgpt.reworkd.ai | **PENDING** | |
| 18 | CrewAI | live-probe | https://app.crewai.com | **PENDING** | |

Static checks (kein Login nötig):

| Check | Status |
|-------|--------|
| `node scripts/check-probe-coverage.mjs` | Run after edit |
| `node scripts/validate-release.mjs` | Run after edit |
| `npm run build` | Run after edit |

---

## Phase 2B — Full live protocol (extension, je Methode)

Pro Provider: Baseline → 2× ACC-Test-Items → **eine** Methode → Reload → verify 0 → nächste Methode.

| # | Provider | Methoden (Reihenfolge) | 2B Status |
|---|----------|------------------------|-----------|
| 1 | Claude | dom-recents, api, dom-overflow | **PENDING** |
| 2 | ChatGPT | dom-settings, api-individual, dom-sidebar | **PENDING** |
| 3 | Gemini | dom-sidebar, api-batchexecute, dom-myactivity | **PENDING** |
| 4 | Grok.com | api-bulk, api-individual, dom-history | **PENDING** |
| 5 | Grok X | dom-history, dom-settings | **PENDING** |
| 6 | DeepSeek | api-bulk, api-individual, dom-sidebar | **PENDING** |
| 7 | Perplexity | api-individual, dom-sidebar | **BLOCKED** |
| 8 | GitHub Copilot | api-bulk, api-individual, dom-sidebar | **PENDING** |
| 9 | Microsoft Copilot | dom-sidebar | **PENDING** |
| 10 | Mistral | api-individual, dom-sidebar | **PENDING** |
| 11 | Pi | api-individual, dom-sidebar | **PENDING** |
| 12 | Meta AI | dom-sidebar | **PENDING** |
| 13 | Poe | dom-sidebar | **PENDING** |
| 14 | Kagi | api-individual, dom-sidebar | **PENDING** |
| 15 | Suno | api-individual, dom-library | **PENDING** |
| 16 | Manus | api-individual, dom-sidebar | **PENDING** |
| 17 | AgentGPT | dom-sidebar | **PENDING** |
| 18 | CrewAI | api-individual, dom-studio | **PENDING** |

Test-Item-Namen: `ACC-TEST-*` — nur frische Test-Chats, keine produktive History löschen.

---

## Release / Store

| Check | Status |
|-------|--------|
| CWS manifest description ≤132 | **FIX 1.0.1** |
| AMO 1.0.x upload | User: hochgeladen |
| CWS 1.0.x upload | User: Fehler description → **1.0.1 zip neu** |
| Ko-fi | User: erledigt |
| Patreon Supporter 3 € | User: erledigt |
