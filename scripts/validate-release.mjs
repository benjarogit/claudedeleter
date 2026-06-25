#!/usr/bin/env node
/** Static release validation — provider count, manifests, URLs, version. */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

const registry = read("src/lib/registry.js");
const providerCount = (registry.match(/Provider,/g) || []).length;
if (providerCount !== 20) {
  errors.push(`Expected 20 providers in registry, found ${providerCount}`);
}

for (const manifest of ["manifests/chrome.json", "manifests/firefox.json"]) {
  const json = JSON.parse(read(manifest));
  if (json.version !== "1.0.1") errors.push(`${manifest}: version must be 1.0.1`);
  if (manifest.includes("chrome") && json.description.length > 132) {
    errors.push(`${manifest}: description ${json.description.length} chars (CWS max 132)`);
  }
  const hosts = JSON.stringify(json.host_permissions);
  if (!hosts.includes("assistant.kagi.com")) {
    errors.push(`${manifest}: missing assistant.kagi.com host_permissions`);
  }
  if (!hosts.includes("agent.minimax.io")) {
    errors.push(`${manifest}: missing agent.minimax.io host_permissions`);
  }
  if (!hosts.includes("chat.z.ai")) {
    errors.push(`${manifest}: missing chat.z.ai host_permissions`);
  }
  const matches = JSON.stringify(json.content_scripts);
  if (!matches.includes("assistant.kagi.com")) {
    errors.push(`${manifest}: missing assistant.kagi.com content_scripts`);
  }
  if (!matches.includes("agent.minimax.io")) {
    errors.push(`${manifest}: missing agent.minimax.io content_scripts`);
  }
  if (!matches.includes("chat.z.ai")) {
    errors.push(`${manifest}: missing chat.z.ai content_scripts`);
  }
}

if (read("package.json").includes('"version": "2.0.0"')) {
  errors.push("package.json still at 2.0.0");
}

const staleUrlFiles = [
  "README.md",
  "src/popup/popup.html",
  "SOURCE_CODE_SUBMISSION.md",
  "scripts/build.mjs",
];
for (const f of staleUrlFiles) {
  const content = read(f);
  if (content.includes("benjarogit/claudedeleter")) {
    errors.push(`${f}: still references benjarogit/claudedeleter`);
  }
}

const bugTpl = read(".github/ISSUE_TEMPLATE/bug_report.yml");
if (!bugTpl.includes("Kagi Assistant")) {
  errors.push("bug_report.yml: missing Kagi Assistant");
}

const providersDir = join(root, "src/lib/providers");
const providerFiles = readdirSync(providersDir).filter((f) => f.endsWith(".js"));
if (providerFiles.length !== 20) {
  errors.push(`Expected 20 provider files, found ${providerFiles.length}`);
}

if (errors.length) {
  console.error("Validation FAILED:\n" + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}

console.log("Validation OK: 20 providers, v1.0.1, Kagi+MiniMax+Z.ai in manifests, CWS description ≤132.");
