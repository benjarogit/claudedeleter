/**
 * Standalone script for DevTools console on https://claude.ai
 */
import { deleteAllChats, isClaudeUrl } from "./lib/deleter.js";

async function runConsoleCleaner() {
  if (!isClaudeUrl(location.href)) {
    console.error("[ACC] Open https://claude.ai and run again.");
    return;
  }

  const confirmed = confirm(
    "Delete ALL Claude conversations?\n\nThis cannot be undone."
  );
  if (!confirmed) {
    console.log("[ACC] Cancelled.");
    return;
  }

  console.log("[ACC] Starting…");

  try {
    const result = await deleteAllChats({
      delayMs: 300,
      onProgress: (event) => {
        if (event.message) {
          console.log(
            `[ACC] ${event.message}`,
            event.overall != null ? `(${Math.round(event.overall)}%)` : ""
          );
        }
      },
    });
    console.log(`[ACC] Done. Deleted ${result.deleted} chat(s).`);
  } catch (error) {
    console.error("[ACC] Failed:", error.message);
  }
}

runConsoleCleaner();
