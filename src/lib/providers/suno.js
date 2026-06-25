/**
 * @file Suno provider — deletes audio clips on suno.com.
 *
 * Deletion strategy (in order):
 *  1. api-individual — POST /api/gen/trash with clip IDs (Clerk Bearer auth)
 *  2. dom-library    — library clip menu → Trash per item (DOM fallback)
 *
 * Note: Suno uses Clerk for authentication (window.Clerk.session.getToken).
 * Each "song creation" generates 2 clips (variants), so creation counts are doubled.
 * "Trashing" moves clips to trash; the API endpoint uses the studio-api-prod subdomain.
 */

import {
  confirmDialogs,
  countSunoLibraryClips,
  deleteSunoViaClipMenu,
  findSunoClipElements,
} from "../dom.js";
import { runDeleteLoop } from "../shared.js";

const STUDIO_API = "https://studio-api-prod.suno.com";

async function getSunoAuthHeaders(fetchFn) {
  const headers = { "Content-Type": "application/json", Accept: "application/json" };

  // Clerk JWT
  if (window.Clerk?.session?.getToken) {
    try {
      const token = await window.Clerk.session.getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    } catch {
      /* Clerk unavailable */
    }
  }

  // Anti-bot headers required by studio-api-prod since 2026
  try {
    const browserToken = JSON.stringify({
      token: btoa(JSON.stringify({ timestamp: Date.now() })).replace(/=+$/, ""),
    });
    headers["browser-token"] = browserToken;

    // device-id — try common localStorage keys, otherwise generate
    const deviceId =
      localStorage.getItem("suno-device-id") ||
      localStorage.getItem("device_id") ||
      localStorage.getItem("deviceId") ||
      (() => {
        const id = crypto.randomUUID();
        try { localStorage.setItem("suno-device-id", id); } catch { /* quota */ }
        return id;
      })();
    headers["device-id"] = deviceId;
    headers["origin"] = "https://suno.com";
    headers["referer"] = "https://suno.com/";
  } catch {
    /* storage/crypto unavailable */
  }

  return headers;
}

async function listClipIds(fetchFn) {
  const headers = await getSunoAuthHeaders(fetchFn);
  const clips = [];
  const seen = new Set();

  // Primary: POST /api/feed/v3 (current Suno API as of 2026)
  try {
    let page = 0;
    while (true) {
      const response = await fetchFn(`${STUDIO_API}/api/feed/v3`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ page }),
      });
      if (!response.ok) break;
      const data = await response.json();
      for (const clip of data.clips || []) {
        const id = clip.id || clip.clip_id;
        if (id && !seen.has(id)) { seen.add(id); clips.push(id); }
      }
      if (!data.has_more) break;
      page++;
      if (page > 20) break;
    }
    if (clips.length) return clips;
  } catch {
    /* fall through */
  }

  // Fallback: GET /api/feed/v2
  try {
    const feed = await fetchFn(`${STUDIO_API}/api/feed/v2?page=0`, {
      credentials: "include",
      headers,
    });
    if (feed.ok) {
      const feedData = await feed.json();
      for (const clip of feedData.clips || feedData || []) {
        const id = clip.id || clip.clip_id;
        if (id && !seen.has(id)) { seen.add(id); clips.push(id); }
      }
    }
  } catch {
    /* DOM only */
  }

  return clips;
}

async function assertGone(fetchFn) {
  let apiCount = null;
  try {
    apiCount = (await listClipIds(fetchFn)).length;
  } catch {
    /* DOM */
  }

  const domCount = countSunoLibraryClips();
  const parts = [];
  if (apiCount > 0) parts.push(`${apiCount} in API`);
  if (domCount > 0) parts.push(`${domCount} visible in library`);
  if (parts.length) {
    throw new Error(`Suno clips still remain (${parts.join(", ")})`);
  }
}

async function deleteAllOneByOne(fetchFn, onProgress, delayMs) {
  const ids = await listClipIds(fetchFn);
  if (!ids.length) {
    const domCount = countSunoLibraryClips();
    if (domCount > 0) throw new Error(`API listed 0 clips but ${domCount} visible in library`);
    return { deleted: 0, total: 0 };
  }

  const headers = await getSunoAuthHeaders(fetchFn);

  const result = await runDeleteLoop({
    ids,
    delayMs,
    label: "clip",
    onProgress,
    deleteOne: async (id) => {
      const response = await fetchFn(`${STUDIO_API}/api/gen/trash`, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({ trash: true, clip_ids: [id] }),
      });
      if (!response.ok) throw new Error(`delete ${id} HTTP ${response.status}`);
    },
  });

  await assertGone(fetchFn);
  return result;
}

async function deleteLibraryDom(fetchFn, onProgress) {
  const estimated = Math.max(countSunoLibraryClips(), 1);
  if (!findSunoClipElements().length) return { deleted: 0, total: 0 };

  let deleted = await deleteSunoViaClipMenu(onProgress);
  if (!deleted) throw new Error("No Suno clip More options → Delete controls found");

  await assertGone(fetchFn);
  return { deleted, total: estimated };
}

/** ACC delete provider (public API). */

export const sunoProvider = {
  id: "suno",
  name: "Suno",
  match(url) {
    try {
      return new URL(url).hostname === "suno.com";
    } catch {
      return false;
    }
  },

  /** Songs/clips in library — not chat threads. api-individual → dom-library */
  async getDeleteMethods(ctx) {
    let apiIds = [];
    try {
      apiIds = await listClipIds(ctx.fetchFn);
    } catch {
      /* API headers unavailable */
    }
    const domCount = countSunoLibraryClips();

    if (!apiIds.length && !domCount) {
      return [{ name: "noop", step: null, fn: () => ({ deleted: 0, total: 0 }) }];
    }

    const methods = [];
    if (apiIds.length > 0) {
      methods.push({
        name: "api-individual",
        step: null,
        fn: () => deleteAllOneByOne(ctx.fetchFn, ctx.onProgress, ctx.delayMs),
      });
    }
    if (domCount > 0) {
      methods.push({
        name: "dom-library",
        step: null,
        fn: () => deleteLibraryDom(ctx.fetchFn, ctx.onProgress),
      });
    }
    return methods;
  },

  async verifyGone(ctx) {
    await assertGone(ctx.fetchFn);
  },
};
