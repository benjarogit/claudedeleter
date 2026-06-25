/**
 * @file Meta AI provider — deletes conversations on meta.ai.
 *
 * Deletion strategy:
 *  1. dom-sidebar — sidebar "More options" → Delete → Confirm (hover-reveal pattern)
 *
 * Note: No public REST API available. The sidebar uses a contenteditable div
 * for input and hover-triggered overflow buttons requiring CSS manipulation.
 */

import {
  countMetaAiSidebarChats,
  deleteMetaAiViaMoreOptions,
  findMetaAiSidebarChatLinks,
} from "../dom.js";

async function listPromptIds() {
  const seen = new Set();
  const ids = [];
  for (const a of document.querySelectorAll('a[href*="/prompt/"]')) {
    const match = a.href.match(/\/prompt\/([0-9a-f-]{36})/i);
    if (!match || seen.has(match[1])) continue;
    seen.add(match[1]);
    ids.push(match[1]);
  }
  return ids;
}

async function assertGone(fetchFn) {
  const domCount = countMetaAiSidebarChats();
  if (domCount > 0) {
    throw new Error(`Meta AI prompts still remain (${domCount} visible in sidebar)`);
  }
}

async function deleteSidebarDom(fetchFn, onProgress) {
  const estimated = Math.max(countMetaAiSidebarChats(), 1);
  if (!findMetaAiSidebarChatLinks().length) return { deleted: 0, total: 0 };

  let deleted = await deleteMetaAiViaMoreOptions(onProgress);
  if (!deleted) throw new Error("No Meta AI More options → Delete controls found");

  await assertGone(fetchFn);
  return { deleted, total: estimated };
}

/** ACC delete provider (public API). */

export const metaAiProvider = {
  id: "meta-ai",
  name: "Meta AI",
  match(url) {
    try {
      const h = new URL(url).hostname;
      return h === "www.meta.ai" || h === "meta.ai";
    } catch {
      return false;
    }
  },

  /** Live: dom-sidebar (GraphQL delete needs page tokens — DOM primary).
   * Never noop: sidebar may not be loaded at startup; always attempt deletion.
   */
  async getDeleteMethods(ctx) {
    return [
      {
        name: "dom-sidebar",
        step: null,
        fn: () => deleteSidebarDom(ctx.fetchFn, ctx.onProgress),
      },
    ];
  },

  async verifyGone(ctx) {
    await assertGone(ctx.fetchFn);
  },
};
