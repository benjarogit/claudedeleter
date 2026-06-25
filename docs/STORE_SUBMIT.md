# ACC v1.0.0 — Store submit guide

Artifacts (after `npm run build`):

| Store | File | Path |
|-------|------|------|
| Firefox AMO | `acc-firefox.xpi` | `dist/acc-firefox.xpi` |
| Chrome CWS | `acc-chrome.zip` | `dist/acc-chrome.zip` |
| Microsoft Edge | `acc-edge.zip` | `dist/acc-edge.zip` |

Compliance copy: [STORE_COMPLIANCE.md](./STORE_COMPLIANCE.md). Source for AMO: [SOURCE_CODE_SUBMISSION.md](../SOURCE_CODE_SUBMISSION.md).

---

## Firefox AMO

Add-on slug: **ai-chat-cleaner1** — do not create a new listing.

1. Developer hub → **AI Chat Cleaner** → **Version hochladen**
2. Upload **`dist/acc-firefox.xpi`** (or `acc-firefox.zip` — same content)
3. Compatibility: **Firefox** desktop; enable **Firefox for Android** only if tested
4. Listing DE + EN: 18 platforms, confirm dialog, no tracking (see STORE_COMPLIANCE)
5. **Privacy / data collection:** none — matches manifest `data_collection_permissions.required: ["none"]`
6. **Permissions:** explain host access per AI domain (delete API + DOM fallback)
7. **Source code:** Yes — link repo + [SOURCE_CODE_SUBMISSION.md](../SOURCE_CODE_SUBMISSION.md); upload source zip if prompted
8. Release notes: **1.0.0** — first public SemVer release, 18 platforms
9. Reviewer notes: log in to e.g. claude.ai → open popup → confirm → deletes visible chats

Optional CLI sign/upload (requires [AMO API credentials](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/#sign)):

```bash
./scripts/upload-amo.sh
```

---

## Chrome Web Store

Existing item — **update**, do not create a new extension.

1. [Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Select **AI Chat Cleaner** → **Package** → upload **`dist/acc-chrome.zip`**
3. **Store listing:** title, description, screenshots (popup + confirm)
4. **Privacy:** single purpose; no user data collected; redacted debug only on user-triggered report
5. **Distribution:** free, public
6. **Permission justification** for each host group
7. **Submit for review** (optional: delay publish until AMO is live)

---

## Microsoft Edge

1. [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview) → **Extensions**
2. Update existing ACC listing or upload **`dist/acc-edge.zip`**
3. Reuse CWS privacy/permission text from STORE_COMPLIANCE.md

---

## After submit

Update checkboxes in [STORE_COMPLIANCE.md](./STORE_COMPLIANCE.md) and track review feedback in GitHub Issues.
