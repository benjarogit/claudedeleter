#!/usr/bin/env node
/** Verify e2e-probe + live-probe cover all 20 registry providers. */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const SITES = [
  { id: "claude", host: "claude.ai", script: "e2e-probe.js" },
  { id: "chatgpt", host: "chatgpt.com", script: "e2e-probe.js" },
  { id: "gemini", host: "gemini.google.com", script: "e2e-probe.js" },
  { id: "grok-com", host: "grok.com", script: "e2e-probe.js" },
  { id: "grok-x", host: "x.com", path: "/i/grok", script: "e2e-probe.js" },
  { id: "deepseek", host: "chat.deepseek.com", script: "live-probe-new-sites.js" },
  { id: "perplexity", host: "perplexity.ai", script: "live-probe-new-sites.js" },
  { id: "copilot-github", host: "github.com", path: "/copilot", script: "live-probe-new-sites.js" },
  { id: "copilot-microsoft", host: "copilot.microsoft.com", script: "live-probe-new-sites.js" },
  { id: "mistral", host: "chat.mistral.ai", script: "live-probe-new-sites.js" },
  { id: "pi", host: "pi.ai", script: "live-probe-new-sites.js" },
  { id: "meta-ai", host: "meta.ai", script: "live-probe-new-sites.js" },
  { id: "poe", host: "poe.com", script: "live-probe-new-sites.js" },
  { id: "suno", host: "suno.com", script: "live-probe-new-sites.js" },
  { id: "manus", host: "manus.im", script: "live-probe-new-sites.js" },
  { id: "agentgpt", host: "agentgpt.reworkd.ai", script: "live-probe-new-sites.js" },
  { id: "crewai", host: "app.crewai.com", script: "live-probe-new-sites.js" },
  { id: "kagi", host: "assistant.kagi.com", script: "live-probe-new-sites.js" },
  { id: "minimax", host: "agent.minimax.io", script: "live-probe-new-sites.js" },
  { id: "zai", host: "chat.z.ai", script: "live-probe-new-sites.js" },
];

const e2e = readFileSync(join(root, "scripts/e2e-probe.js"), "utf8");
const live = readFileSync(join(root, "scripts/live-probe-new-sites.js"), "utf8");
const providerFiles = readdirSync(join(root, "src/lib/providers")).filter((f) => f.endsWith(".js"));

if (providerFiles.length !== 20) {
  console.error(`Expected 20 provider files, found ${providerFiles.length}`);
  process.exit(1);
}

let ok = true;
for (const site of SITES) {
  const src = site.script === "e2e-probe.js" ? e2e : live;
  if (!src.includes(`"${site.host}"`) && !src.includes(`host === "${site.host}"`)) {
    console.error(`MISSING probe branch: ${site.id} (${site.host}) in ${site.script}`);
    ok = false;
  }
}

if (!ok) process.exit(1);

console.log("Probe coverage OK: all 20 providers have in-page probe scripts.");
console.log("\nRun Phase 2A (logged-in DevTools on each site):");
for (const site of SITES) {
  const url = `https://${site.host}${site.path || ""}`;
  console.log(`  ${site.id.padEnd(18)} ${url}`);
  console.log(`    → paste scripts/${site.script} in console`);
}
console.log("\nPhase 2B: full delete protocol per docs/TEST_MATRIX.md (extension + 2 test items per method).");
