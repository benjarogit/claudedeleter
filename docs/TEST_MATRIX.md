# ACC v1.0.0 — Provider test matrix

**Live-Tests Phase 2A:** Alle 20 Provider vollständig durchgeführt (25. Jun 2026).

Methodik: Login auf der Site, 2× ACC-TEST-Items erstellen, besten Löschweg + alle Fallbacks testen, auf 0 verifizieren.

---

## Phase 2A — Live-Probes (20/20 abgeschlossen ✅)

| # | Provider | URL | Methode | Baseline→Create→Nach | Status |
|---|----------|-----|---------|----------------------|--------|
| 1 | Claude | https://claude.ai | API DELETE /api/conversations/{id} | 18→20→18 | **PASS** |
| 2 | ChatGPT | https://chatgpt.com | API PATCH /backend-api/conversation/{id} | 0→2→0 | **PASS** |
| 3 | Gemini | https://gemini.google.com | API batchexecute GzXR5e | 5→7→5 | **PASS** |
| 4 | Grok.com | https://grok.com | API DELETE /rest/app-chat/conversations/{id} | 0→2→0 | **PASS** |
| 5 | Grok X | https://x.com/i/grok | DOM History-Panel (GraphQL Cloudflare-geschützt) | 2→4→2 | **PASS** |
| 6 | DeepSeek | https://chat.deepseek.com | API POST /api/v0/chat_session/delete | 20→22→20 | **PASS** |
| 7 | Perplexity | https://www.perplexity.ai | API DELETE /rest/thread/delete_thread_by_entry_uuid | 0→4→0 | **PASS** |
| 8 | GitHub Copilot | https://github.com/copilot | DOM "Manage chat" → Delete | 0→2→0 | **PASS** |
| 9 | Microsoft Copilot | https://copilot.microsoft.com | DOM "View Options" → Delete | 0→2→0 | **PASS** |
| 10 | Mistral | https://chat.mistral.ai | tRPC chat.delete | 0→2→0 | **PASS** |
| 11 | Pi | https://pi.ai | API DELETE /api/conversations/{sid} | 0→2→0 | **PASS** |
| 12 | Meta AI | https://www.meta.ai | DOM "More options" → Delete → Confirm | 0→2→0 | **PASS** |
| 13 | Poe | https://poe.com | DOM History page → "More actions" → Delete chat → Confirm | 0→2→0 | **PASS** |
| 14 | Kagi | https://assistant.kagi.com | API DELETE /api/conversations/{id} | 0→2→0 | **PASS** |
| 15 | Suno | https://suno.com | API POST /api/gen/trash (Clerk-Auth) | 15→19→15 | **PASS** |
| 16 | Manus | https://manus.im/app | DOM aria-haspopup reveal + click → Delete → Confirm | 0→2→0 | **PASS** |
| 17 | AgentGPT | https://agentgpt.reworkd.ai | DOM Sidebar click → Delete button | 0→2→0 | **PASS** |
| 18 | CrewAI | https://app.crewai.com/studio/v2 | API DELETE /studio/v2/projects/{id} | 0→2→0 | **PASS** |
| 19 | MiniMax | https://agent.minimax.io | DOM ant-dropdown-trigger → Delete → Confirm dialog | 0→2→0 | **PASS** |
| 20 | Z.ai | https://chat.z.ai | API DELETE /api/v1/chats/{id} | 0→2→0 | **PASS** |

**Ergebnis: 20/20 PASS** ✅

---

## Static checks

| Check | Status |
|-------|--------|
| `node scripts/check-probe-coverage.mjs` | ✅ 20/20 |
| `node scripts/validate-release.mjs` | ✅ |
| `npm run build` | ✅ |

---

## Phase 2B — Extension-interne Methoden (noch ausstehend)

Phase 2B (alle Methoden per Extension-Button) wurde nicht durchgeführt — Phase 2A Live-Tests bestätigen alle kritischen Pfade. Für Post-Release.

---

## Release / Store

| Check | Status |
|-------|--------|
| CWS manifest description ≤132 | **FIX 1.0.0** |
| AMO 1.0.x upload | User: hochgeladen |
| CWS 1.0.x upload | User: Fehler description → **1.0.0 zip neu** |
| Ko-fi | User: erledigt |
| Patreon Supporter 3 € | User: erledigt |
