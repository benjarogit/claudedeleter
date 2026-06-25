import {
  confirmDialogs,
  countMinimaxSidebarTasks,
  deleteMinimaxViaSidebar,
  findMinimaxSidebarTaskLinks,
} from "../dom.js";
import { runDeleteLoop } from "../shared.js";

const ORIGIN = "https://agent.minimax.io";

function getToken() {
  try {
    return localStorage.getItem("_token") || null;
  } catch {
    return null;
  }
}

function authHeaders(token) {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Try to list chat session IDs via /matrix/api/v1 (requires auth). */
async function listChatIds(fetchFn) {
  const token = getToken();
  if (!token) return null;

  // MiniMax agent uses /matrix/api/v1/chat — list sessions with pagination
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

async function deleteSidebarDom(fetchFn, onProgress) {
  const count = countMinimaxSidebarTasks();
  if (!findMinimaxSidebarTaskLinks().length) return { deleted: 0, total: 0 };

  const deleted = await deleteMinimaxViaSidebar(onProgress);
  if (!deleted) throw new Error("MiniMax sidebar delete controls not found");

  await assertGone(fetchFn);
  return { deleted, total: Math.max(count, deleted) };
}

/** ACC delete provider (public API). */

export const minimaxProvider = {
  id: "minimax",
  name: "MiniMax",
  match(url) {
    try {
      return new URL(url).hostname === "agent.minimax.io";
    } catch {
      return false;
    }
  },

  /** api-individual → dom-sidebar */
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

  async verifyGone(ctx) {
    await assertGone(ctx.fetchFn);
  },
};
