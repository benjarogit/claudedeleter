import {
  countZaiSidebarChats,
  deleteZaiViaSidebar,
  findZaiSidebarChatLinks,
} from "../dom.js";
import { runDeleteLoop } from "../shared.js";

const ORIGIN = "https://chat.z.ai";
const API_BASE = "https://api.z.ai";

function getToken() {
  try {
    return localStorage.getItem("token") || null;
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

async function listConversationIds(fetchFn) {
  const token = getToken();
  if (!token) return null;

  // z.ai (ZhipuAI / ChatGLM) uses /v1/conversations with JWT auth
  for (const base of [ORIGIN, API_BASE]) {
    try {
      const response = await fetchFn(`${base}/v1/conversations?page=0&size=100`, {
        credentials: "include",
        headers: authHeaders(token),
      });
      if (!response.ok) continue;

      const data = await response.json().catch(() => null);
      if (!data) continue;

      const items = data.conversations || data.data || data.list || data.items || [];
      if (Array.isArray(items)) {
        return items.map((c) => c.id || c.conversationId || c.uid).filter(Boolean);
      }
    } catch {
      /* try next base */
    }
  }
  return null;
}

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
      const response = await fetchFn(`${ORIGIN}/v1/conversations/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: authHeaders(token),
      });
      if (!response.ok && response.status !== 204) {
        throw new Error(`delete ${id} HTTP ${response.status}`);
      }
    },
  });

  await assertGone(fetchFn);
  return result;
}

async function deleteSidebarDom(fetchFn, onProgress) {
  const count = countZaiSidebarChats();
  if (!findZaiSidebarChatLinks().length) return { deleted: 0, total: 0 };

  const deleted = await deleteZaiViaSidebar(onProgress);
  if (!deleted) throw new Error("Z.ai sidebar delete controls not found");

  await assertGone(fetchFn);
  return { deleted, total: Math.max(count, deleted) };
}

/** ACC delete provider (public API). */

export const zaiProvider = {
  id: "zai",
  name: "Z.ai",
  match(url) {
    try {
      return new URL(url).hostname === "chat.z.ai";
    } catch {
      return false;
    }
  },

  /** api-individual → dom-sidebar */
  async getDeleteMethods(ctx) {
    let apiIds = null;
    try {
      apiIds = await listConversationIds(ctx.fetchFn);
    } catch {
      /* auth */
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

  async verifyGone(ctx) {
    await assertGone(ctx.fetchFn);
  },
};
