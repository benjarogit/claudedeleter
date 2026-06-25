# Ko-fi & Patreon setup (ACC v1.0.0)

## Current URLs in popup/README

| Service | URL | Status |
|---------|-----|--------|
| Ko-fi | https://ko-fi.com/aichatcleaner | Placeholder — finish Creator onboarding |
| Patreon | https://www.patreon.com/SunnyCueq | Page exists — publish + add 3 € Supporter tier |

## Ko-fi checklist

1. Account type: **Creator**
2. Page name: **AI Chat Cleaner (ACC)**
3. Enable one-time donations (**Receive tips**)
4. Add GitHub + store links in bio
5. If final URL differs from `aichatcleaner`, update `src/popup/popup.html`, README.md, README.de.md, rebuild

## Patreon checklist

1. Creator page: **SunnyCueq** — https://www.patreon.com/SunnyCueq
2. Tier: **Supporter** — 3 €/month
3. About: bulk-delete on 20 AI platforms, MIT, no tracking
4. Links: GitHub releases, AMO listing
5. **Publish** the page when tier is ready

After Ko-fi URL is confirmed, run `npm run build`. Optional patch **1.0.1** only if stores already shipped with a wrong link.
