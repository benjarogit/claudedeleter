/**
 * @file MiniMax Agent provider — deletes tasks/sessions on agent.minimax.io.
 *
 * Deletion strategy (in order):
 *  1. api-individual  — POST /matrix/api/v1/chat/delete per session (requires localStorage._token)
 *  2. dom-sidebar     — Ant Design dropdown reveal + confirm dialog click
 */

import {
  confirmDialogs,
  countMinimaxSidebarTasks,
  deleteMinimaxViaSidebar,
  findMinimaxSidebarTaskLinks,
} from "../dom.js";
import { runDeleteLoop } from "../shared.js";

const ORIGIN = "https://agent.minimax.io";

/**
 * Reads the JWT from localStorage set by the MiniMax web app.
 * Tries multiple common key names across MiniMax app versions.
 *
 * @returns {string|null} Bearer token or null when unauthenticated.
 */
function getToken() {
  try {
    for (const key of ["_token", "token", "access_token", "authToken", "jwt"]) {
      const val = localStorage.getItem(key);
      if (val && val.length > 20) return val;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Builds the common fetch headers including optional Bearer auth.
 *
 * @param {string|null} token
 * @returns {Record<string, string>}
 */
function authHeaders(token) {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Lists all chat/task session IDs via the MiniMax REST API.
 *
 * @param {typeof fetch} fetchFn - Injected fetch (allows mocking in tests).
 * @returns {Promise<string[]|null>} Array of session IDs or null on auth failure.
 */
async function listChatIds(fetchFn) {
  const token = getToken();
  if (!token) return null;

  const response = await fetchFn(`${ORIGIN}/matrix/api/v1/chat/list?pageSize=100`, {
    credentials: "include",
    headers: authHeaders(token),
  });
  if (!response.ok) return null;

  const data = await response.json().catch(() => null);
  if (!data) return null;

  const sessions = data.sessions || data.chats || data.list || data.data || [];
  return Array.isArray(sessions)
    ? sessions.map((s) => s.chatId || s.sessionId || s.id || s.uid).filter(Boolean)
    : null;
}

/**
 * Throws if any sessions remain after deletion (API or DOM count).
 *
 * @param {typeof fetch} fetchFn
 * @returns {Promise<void>}
 * @throws {Error} When sessions still remain.
 */
async function assertGone(fetchFn) {
  let apiCount = null;
  try {
    const ids = await listChatIds(fetchFn);
    if (ids !== null) apiCount = ids.length;
  } catch {
    /* DOM fallback */
  }

  const domCount = countMinimaxSidebarTasks();
  const parts = [];
  if (apiCount > 0) parts.push(`${apiCount} in API`);
  if (domCount > 0) parts.push(`${domCount} visible in sidebar`);
  if (parts.length) {
    throw new Error(`MiniMax tasks still remain (${parts.join(", ")})`);
  }
}

/**
 * Deletes all sessions one by one via the MiniMax REST API.
 *
 * @param {typeof fetch} fetchFn
 * @param {Function} onProgress
 * @param {number} delayMs
 * @returns {Promise<{deleted: number, total: number}>}
 */
async function deleteAllOneByOne(fetchFn, onProgress, delayMs) {
  const token = getToken();
  if (!token) throw new Error("MiniMax _token not found — reload and log in");

  const ids = await listChatIds(fetchFn);
  if (!ids || !ids.length) {
    const domCount = countMinimaxSidebarTasks();
    if (domCount > 0) throw new Error(`API listed 0 sessions but ${domCount} visible in sidebar`);
    return { deleted: 0, total: 0 };
  }

  const result = await runDeleteLoop({
    ids,
    delayMs,
    label: "session",
    onProgress,
    deleteOne: async (id) => {
      const response = await fetchFn(`${ORIGIN}/matrix/api/v1/chat/delete`, {
        method: "POST",
        credentials: "include",
        headers: authHeaders(token),
        body: JSON.stringify({ chatId: id }),
      });
      if (!response.ok) throw new Error(`delete ${id} HTTP ${response.status}`);
    },
  });

  await assertGone(fetchFn);
  return result;
}

/**
 * Deletes all visible tasks via the sidebar Ant Design dropdown.
 *
 * @param {typeof fetch} fetchFn
 * @param {Function} onProgress
 * @returns {Promise<{deleted: number, total: number}>}
 */
async function deleteSidebarDom(fetchFn, onProgress) {
  const count = countMinimaxSidebarTasks();
  if (!findMinimaxSidebarTaskLinks().length) return { deleted: 0, total: 0 };

  const deleted = await deleteMinimaxViaSidebar(onProgress);
  if (!deleted) throw new Error("MiniMax sidebar delete controls not found");

  await assertGone(fetchFn);
  return { deleted, total: Math.max(count, deleted) };
}

/** ACC delete provider — MiniMax Agent (agent.minimax.io). */
export const minimaxProvider = {
  id: "minimax",
  name: "MiniMax",

  /**
   * Returns true when the active URL is the MiniMax Agent app.
   *
   * @param {string} url
   * @returns {boolean}
   */
  match(url) {
    try {
      return new URL(url).hostname === "agent.minimax.io";
    } catch {
      return false;
    }
  },

  /**
   * Returns available deletion methods in priority order:
   *  1. api-individual (fastest, uses REST API)
   *  2. dom-sidebar    (fallback, Ant Design dropdown interaction)
   *
   * @param {import("../deleter.js").DeleteContext} ctx
   * @returns {Promise<import("../deleter.js").DeleteMethod[]>}
   */
  async getDeleteMethods(ctx) {
    let apiIds = null;
    try {
      apiIds = await listChatIds(ctx.fetchFn);
    } catch {
      /* auth */
    }
    const domCount = countMinimaxSidebarTasks();

    if (!apiIds?.length && !domCount) {
      return [{ name: "noop", step: null, fn: () => ({ deleted: 0, total: 0 }) }];
    }

    const methods = [];
    if (apiIds?.length) {
      methods.push({
        name: "api-individual",
        step: null,
        fn: () => deleteAllOneByOne(ctx.fetchFn, ctx.onProgress, ctx.delayMs),
      });
    }
    if (domCount > 0) {
      methods.push({
        name: "dom-sidebar",
        step: null,
        fn: () => deleteSidebarDom(ctx.fetchFn, ctx.onProgress),
      });
    }
    return methods;
  },

  /**
   * Verifies that no sessions remain; throws if any are found.
   *
   * @param {import("../deleter.js").DeleteContext} ctx
   * @returns {Promise<void>}
   */
  async verifyGone(ctx) {
    await assertGone(ctx.fetchFn);
  },
};
