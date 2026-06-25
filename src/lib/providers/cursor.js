/**
 * @file Cursor Agents provider — archives agent threads on cursor.com/agents.
 *
 * Deletion strategy (in order):
 *  1. api-dom  — reads `bcId` values from DOM (`a[data-composer-id]`),
 *               archives each via POST /api/auth/archiveBackgroundComposer
 *  2. dom-sidebar — clicks "Archive" buttons directly in the sidebar
 *
 * Auth: session cookies (credentials: "include") — no extra token required.
 * Note: The Cursor API archives threads rather than permanently deleting them;
 *       archived threads are hidden from the sidebar and considered "cleared".
 */

import {
  countCursorAgentThreads,
  deleteCursorViaSidebar,
  readCursorBcIds,
} from "../dom.js";
import { runDeleteLoop } from "../shared.js";

const ARCHIVE_URL = "/api/auth/archiveBackgroundComposer";

/**
 * Archives a single agent thread via the Cursor REST API.
 *
 * @param {typeof fetch} fetchFn - Injected fetch (allows mocking in tests).
 * @param {string} bcId - Background composer ID (format: `bc-{uuid}`).
 * @returns {Promise<void>}
 * @throws {Error} When the server returns a non-2xx status.
 */
async function archiveOne(fetchFn, bcId) {
  const response = await fetchFn(ARCHIVE_URL, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ bcId }),
  });
  if (!response.ok) {
    throw new Error(`archive ${bcId} HTTP ${response.status}`);
  }
}

/**
 * Throws if any agent threads remain visible in the sidebar after deletion.
 *
 * @returns {void}
 * @throws {Error} When threads are still present.
 */
function assertGone() {
  const remaining = countCursorAgentThreads();
  if (remaining > 0) {
    throw new Error(
      `Cursor agent threads still remain (${remaining} visible in sidebar)`
    );
  }
}

/**
 * Reads all visible `bcId`s from the DOM and archives each via the API.
 *
 * @param {typeof fetch} fetchFn
 * @param {Function} onProgress
 * @param {number} delayMs
 * @returns {Promise<{deleted: number, total: number}>}
 */
async function archiveAllViaApi(fetchFn, onProgress, delayMs) {
  const ids = readCursorBcIds();
  if (!ids.length) {
    assertGone();
    return { deleted: 0, total: 0 };
  }

  const result = await runDeleteLoop({
    ids,
    delayMs,
    label: "agent thread",
    onProgress,
    deleteOne: (id) => archiveOne(fetchFn, id),
  });

  assertGone();
  return result;
}

/**
 * Clicks "Archive" buttons in the sidebar as fallback.
 *
 * @param {Function} onProgress
 * @returns {Promise<{deleted: number, total: number}>}
 */
async function archiveViaDom(onProgress) {
  const count = countCursorAgentThreads();
  if (!count) return { deleted: 0, total: 0 };

  const deleted = await deleteCursorViaSidebar(onProgress);
  if (!deleted) throw new Error("Cursor sidebar Archive buttons not found");

  assertGone();
  return { deleted, total: Math.max(count, deleted) };
}

/** ACC delete provider — Cursor Agents (cursor.com/agents). */
export const cursorProvider = {
  id: "cursor",
  name: "Cursor",

  /**
   * Returns true when the active URL is cursor.com/agents (or a sub-path).
   *
   * @param {string} url
   * @returns {boolean}
   */
  match(url) {
    try {
      const { hostname, pathname } = new URL(url);
      return hostname === "cursor.com" && pathname.startsWith("/agents");
    } catch {
      return false;
    }
  },

  /**
   * Returns available deletion methods in priority order:
   *  1. api-dom     (fastest: DOM read + API archive)
   *  2. dom-sidebar (fallback: clicks Archive buttons)
   *
   * @param {import("../deleter.js").DeleteContext} ctx
   * @returns {Promise<import("../deleter.js").DeleteMethod[]>}
   */
  async getDeleteMethods(ctx) {
    const domCount = countCursorAgentThreads();

    if (!domCount) {
      return [{ name: "noop", step: null, fn: () => ({ deleted: 0, total: 0 }) }];
    }

    return [
      {
        name: "api-dom",
        step: null,
        fn: () => archiveAllViaApi(ctx.fetchFn, ctx.onProgress, ctx.delayMs),
      },
      {
        name: "dom-sidebar",
        step: null,
        fn: () => archiveViaDom(ctx.onProgress),
      },
    ];
  },

  /**
   * Verifies no agent threads remain in the sidebar; throws if any are found.
   *
   * @returns {void}
   */
  verifyGone() {
    assertGone();
  },
};
