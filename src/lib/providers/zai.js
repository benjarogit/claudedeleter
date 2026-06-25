/**
 * @file Z.ai provider — deletes conversations on chat.z.ai.
 *
 * Deletion strategy (in order):
 *  1. api-individual  — DELETE /api/v1/chats/{id} with Bearer JWT
 *  2. dom-sidebar     — sidebar context menu interaction
 *
 * Auth: The app stores a JWT in localStorage under the key "token".
 * Note: The app uses /api/v1/ routing; earlier /v1/ paths may return HTML (SPA routing).
 */

import {
  countZaiSidebarChats,
  deleteZaiViaSidebar,
  findZaiSidebarChatLinks,
} from "../dom.js";
import { runDeleteLoop } from "../shared.js";

const ORIGIN = "https://chat.z.ai";
const API_BASE = "https://api.z.ai";

/**
 * Reads the JWT from localStorage as stored by the Z.ai web app.
 *
 * @returns {string|null} Bearer token or null when not authenticated.
 */
function getToken() {
  try {
    return localStorage.getItem("token") || null;
  } catch {
    return null;
  }
}

/**
 * Builds common fetch headers, optionally including Bearer auth.
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
 * Lists all conversation IDs from the Z.ai REST API.
 *
 * Tries both ORIGIN/api/v1 and API_BASE/v1 to handle routing variations.
 *
 * @param {typeof fetch} fetchFn - Injected fetch function.
 * @returns {Promise<string[]|null>} Array of conversation IDs or null on failure.
 */
async function listConversationIds(fetchFn) {
  const token = getToken();
  if (!token) return null;

  // Try the discovered API paths; /v1/ may return HTML due to SPA routing
  const candidates = [
    `${ORIGIN}/api/v1/chats/?page=1&type=default`,
    `${ORIGIN}/v1/conversations?page=0&size=100`,
    `${API_BASE}/v1/conversations?page=0&size=100`,
  ];

  for (const url of candidates) {
    try {
      const response = await fetchFn(url, {
        credentials: "include",
        headers: authHeaders(token),
      });
      if (!response.ok) continue;

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("json")) continue; // skip HTML SPA responses

      const data = await response.json().catch(() => null);
      if (!data) continue;

      const items = data.chats || data.conversations || data.data || data.list || data.items || [];
      if (Array.isArray(items)) {
        return items.map((c) => c.id || c.conversationId || c.uid).filter(Boolean);
      }
    } catch {
      /* try next candidate */
    }
  }
  return null;
}

/**
 * Asserts that no conversations remain after deletion.
 *
 * @param {typeof fetch} fetchFn
 * @returns {Promise<void>}
 * @throws {Error} When conversations still remain.
 */
async function assertGone(fetchFn) {
  let apiCount = null;
  try {
    const ids = await listConversationIds(fetchFn);
    if (ids !== null) apiCount = ids.length;
  } catch {
    /* DOM fallback */
  }

  const domCount = countZaiSidebarChats();
  const parts = [];
  if (apiCount > 0) parts.push(`${apiCount} in API`);
  if (domCount > 0) parts.push(`${domCount} visible in sidebar`);
  if (parts.length) {
    throw new Error(`Z.ai chats still remain (${parts.join(", ")})`);
  }
}

/**
 * Deletes all conversations one by one via DELETE /api/v1/chats/{id}.
 *
 * @param {typeof fetch} fetchFn
 * @param {Function} onProgress
 * @param {number} delayMs
 * @returns {Promise<{deleted: number, total: number}>}
 */
async function deleteAllOneByOne(fetchFn, onProgress, delayMs) {
  const token = getToken();
  if (!token) throw new Error("Z.ai token not found — reload and log in");

  const ids = await listConversationIds(fetchFn);
  if (!ids || !ids.length) {
    const domCount = countZaiSidebarChats();
    if (domCount > 0) throw new Error(`API listed 0 chats but ${domCount} visible in sidebar`);
    return { deleted: 0, total: 0 };
  }

  const result = await runDeleteLoop({
    ids,
    delayMs,
    label: "chat",
    onProgress,
    deleteOne: async (id) => {
      const response = await fetchFn(`${ORIGIN}/api/v1/chats/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: authHeaders(token),
      });
      // 204 No Content is a valid success response
      if (!response.ok && response.status !== 204) {
        throw new Error(`delete ${id} HTTP ${response.status}`);
      }
    },
  });

  await assertGone(fetchFn);
  return result;
}

/**
 * Deletes all visible conversations via the sidebar context menu.
 *
 * @param {typeof fetch} fetchFn
 * @param {Function} onProgress
 * @returns {Promise<{deleted: number, total: number}>}
 */
async function deleteSidebarDom(fetchFn, onProgress) {
  const count = countZaiSidebarChats();
  if (!findZaiSidebarChatLinks().length) return { deleted: 0, total: 0 };

  const deleted = await deleteZaiViaSidebar(onProgress);
  if (!deleted) throw new Error("Z.ai sidebar delete controls not found");

  await assertGone(fetchFn);
  return { deleted, total: Math.max(count, deleted) };
}

/** ACC delete provider — Z.ai (chat.z.ai). */
export const zaiProvider = {
  id: "zai",
  name: "Z.ai",

  /**
   * Returns true when the active URL is the Z.ai chat app.
   *
   * @param {string} url
   * @returns {boolean}
   */
  match(url) {
    try {
      return new URL(url).hostname === "chat.z.ai";
    } catch {
      return false;
    }
  },

  /**
   * Returns available deletion methods in priority order:
   *  1. api-individual — DELETE /api/v1/chats/{id} (fastest)
   *  2. dom-sidebar    — sidebar context menu (fallback)
   *
   * @param {import("../deleter.js").DeleteContext} ctx
   * @returns {Promise<import("../deleter.js").DeleteMethod[]>}
   */
  async getDeleteMethods(ctx) {
    let apiIds = null;
    try {
      apiIds = await listConversationIds(ctx.fetchFn);
    } catch {
      /* auth error — fall through to DOM */
    }
    const domCount = countZaiSidebarChats();

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
   * Verifies that no conversations remain after deletion.
   *
   * @param {import("../deleter.js").DeleteContext} ctx
   * @returns {Promise<void>}
   */
  async verifyGone(ctx) {
    await assertGone(ctx.fetchFn);
  },
};
