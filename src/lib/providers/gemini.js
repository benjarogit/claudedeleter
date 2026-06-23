import {
  clickKeywords,
  clickVisibleExactText,
  confirmDialogs,
  findByKeywords,
  queryVisible,
  waitFor,
  KW,
} from "../dom.js";
import { geminiBatchInPage } from "../gemini-page.js";
import { navigateTo } from "../navigate.js";
import { report, runDeleteLoop, sleep, tryMethods } from "../shared.js";

const GEMINI_ORIGIN = "https://gemini.google.com";
const MYACTIVITY_URL = "https://myactivity.google.com/product/gemini?utm_source=gemini";

function normalizeGeminiId(id) {
  if (!id) return null;
  return id.startsWith("c_") ? id : `c_${id}`;
}

function extractChatIdsFromBatch(data) {
  const ids = new Set();
  const walk = (node) => {
    if (typeof node === "string") {
      if (/^c_[a-zA-Z0-9_-]+$/.test(node)) ids.add(node);
      else if (/^[a-f0-9]{12,}$/i.test(node)) ids.add(`c_${node}`);
    } else if (Array.isArray(node)) {
      node.forEach(walk);
    } else if (node && typeof node === "object") {
      Object.values(node).forEach(walk);
    }
  };
  try {
    walk(JSON.parse(data?.[0]?.[2] || "[]"));
  } catch {
    walk(data);
  }
  return [...ids];
}

function listChatIdsFromDom() {
  const ids = new Set();
  for (const a of document.querySelectorAll('a[href*="/app/"]')) {
    const match = a.href.match(/\/app\/([a-zA-Z0-9_-]+)/);
    if (match) {
      const normalized = normalizeGeminiId(match[1]);
      if (normalized) ids.add(normalized);
    }
  }
  return [...ids];
}

async function listChatIds() {
  const payloads = [100, 50, 25];
  for (const size of payloads) {
    try {
      const data = await geminiBatchInPage("MaZiqc", [size]);
      const fromApi = extractChatIdsFromBatch(data);
      if (fromApi.length) return fromApi;
    } catch {
      /* try next payload */
    }
  }
  return listChatIdsFromDom();
}

function countMyActivityItems() {
  return document.querySelectorAll(
    'button[aria-label^="Aktivitätselement löschen"], button[aria-label^="Delete activity"]'
  ).length;
}

/**
 * Live-verified on myactivity.google.com/product/gemini:
 * bulk dropdown = button text/aria exactly "Löschen" (not "Aktivitätselement löschen").
 */
function findMyActivityBulkDeleteDropdown() {
  return (
    queryVisible("button").find((b) => {
      const text = (b.textContent || "").trim();
      const aria = b.getAttribute("aria-label") || "";
      return (
        (text === "Löschen" || text === "Delete") &&
        (aria === "Löschen" || aria === "Delete")
      );
    }) ?? null
  );
}

async function assertGeminiGone() {
  let apiCount = null;
  try {
    if (location.hostname === "gemini.google.com") {
      apiCount = (await listChatIds()).length;
    }
  } catch {
    /* batchexecute unavailable */
  }

  const domCount = listChatIdsFromDom().length;
  const activityCount =
    location.hostname === "myactivity.google.com" ? countMyActivityItems() : null;

  const parts = [];
  if (apiCount > 0) parts.push(`${apiCount} in API`);
  if (domCount > 0) parts.push(`${domCount} visible in sidebar`);
  if (activityCount > 0) parts.push(`${activityCount} in My Activity`);
  if (parts.length) {
    throw new Error(`Gemini chats still remain (${parts.join(", ")})`);
  }
}

async function goToGeminiForVerify() {
  if (location.hostname !== "gemini.google.com") {
    location.assign(`${GEMINI_ORIGIN}/app`);
    await sleep(2500);
  }
}

async function deleteChatId(cid) {
  const id = normalizeGeminiId(cid);
  await geminiBatchInPage("GzXR5e", [id]);
  try {
    await geminiBatchInPage("GzXR5e", [id, [1, null, 0, 1]]);
  } catch {
    /* optional second RPC */
  }
}

async function deleteAllApi(onProgress, delayMs) {
  const ids = await listChatIds();
  if (!ids.length) {
    const domCount = listChatIdsFromDom().length;
    if (domCount > 0) throw new Error(`API listed 0 chats but ${domCount} visible in sidebar`);
    return { deleted: 0, total: 0 };
  }

  const result = await runDeleteLoop({
    ids,
    delayMs,
    label: "chat",
    onProgress,
    deleteOne: (id) => deleteChatId(id),
  });

  await assertGeminiGone();
  return result;
}

function findGeminiOverflowMenu() {
  return (
    queryVisible('button[aria-label*="Optionen" i], button[aria-label*="options" i]')[0] ??
    queryVisible(
      'button[aria-label*="Unterhaltung" i], button[aria-label*="conversation" i]'
    )[0] ??
    findByKeywords(KW.more)
  );
}

async function deleteSidebarMenus(onProgress) {
  const estimated = Math.max(listChatIdsFromDom().length, 1);
  let deleted = 0;

  for (let i = 0; i < 150; i++) {
    const menu = findGeminiOverflowMenu();
    if (!menu) break;

    report(onProgress, {
      type: "status",
      message: `Deleting chat ${deleted + 1} via menu…`,
      overall: Math.min(10 + ((deleted + 1) / estimated) * 85, 95),
      current: 40,
    });

    menu.click();
    await sleep(400);
    const del = findByKeywords(KW.delete);
    if (!del) break;

    del.click();
    await sleep(300);
    await confirmDialogs();
    deleted++;

    report(onProgress, {
      type: "status",
      message: `Deleted ${deleted} via sidebar menu`,
      overall: Math.min(10 + (deleted / estimated) * 85, 95),
      current: 100,
    });
    await sleep(450);
  }

  if (!deleted) throw new Error("No Gemini sidebar delete menus found");
  return { deleted, total: deleted };
}

/** Live-verified: confirm dialog has Abbrechen + Löschen buttons. */
async function confirmMyActivityModal() {
  await sleep(700);
  const confirmBtn = queryVisible("button").find((b) => {
    const t = (b.textContent || "").trim();
    const aria = (b.getAttribute("aria-label") || "").toLowerCase();
    return (
      (t === "Löschen" || t === "Delete") &&
      !aria.includes("abbrechen") &&
      !aria.includes("cancel") &&
      !aria.includes("aktivitätselement")
    );
  });
  if (confirmBtn) {
    confirmBtn.click();
    return true;
  }
  return clickKeywords(KW.confirm, { timeout: 8000 });
}

async function deleteMyActivityDom(ctx) {
  const onMyActivity =
    location.hostname === "myactivity.google.com" && location.pathname.includes("/product/gemini");

  if (!onMyActivity && ctx.step !== "myactivity-delete") {
    await navigateTo(MYACTIVITY_URL, {
      providerId: "gemini",
      step: "myactivity-delete",
      method: "dom-myactivity",
      tabId: ctx.tabId,
    });
  }

  await sleep(1500);

  const deleteDropdown = findMyActivityBulkDeleteDropdown();
  if (!deleteDropdown) throw new Error("My Activity bulk “Löschen” dropdown not found");
  deleteDropdown.click();
  await sleep(700);

  let picked = await clickVisibleExactText(["Gesamte Zeit", "All time", "All Time"], {
    timeout: 8000,
  });
  if (!picked) picked = await clickKeywords(KW.allTime, { timeout: 5000 });

  if (!picked) {
    const before = countMyActivityItems();
    if (!before) return { deleted: 0, total: 0 };
    for (let i = 0; i < before + 5; i++) {
      const itemBtn = document.querySelector(
        'button[aria-label^="Aktivitätselement löschen"], button[aria-label^="Delete activity"]'
      );
      if (!itemBtn) break;
      itemBtn.click();
      await sleep(400);
      await confirmMyActivityModal();
      await sleep(500);
    }
    if (countMyActivityItems() > 0) {
      throw new Error("My Activity individual delete did not clear all items");
    }
    await goToGeminiForVerify();
    await assertGeminiGone();
    return { deleted: before, total: before };
  }

  await sleep(900);
  const confirmed = await confirmMyActivityModal();
  if (!confirmed) throw new Error("My Activity delete confirmation not found");

  await waitFor(() => countMyActivityItems() === 0, { timeout: 30000, interval: 1000 });
  await sleep(1000);
  await goToGeminiForVerify();
  await sleep(2000);

  try {
    await assertGeminiGone();
  } catch {
    await sleep(3000);
    await assertGeminiGone();
  }

  return { deleted: "all", total: "all" };
}

export const geminiProvider = {
  id: "gemini",
  name: "Gemini",
  match(url) {
    try {
      const u = new URL(url);
      if (u.hostname === "gemini.google.com") return true;
      return u.hostname === "myactivity.google.com" && u.pathname.includes("/product/gemini");
    } catch {
      return false;
    }
  },

  async deleteAll(ctx) {
    report(ctx.onProgress, { type: "status", message: "Gemini: starting…", overall: 5 });

    if (ctx.step === "myactivity-delete") {
      return { ...(await deleteMyActivityDom(ctx)), method: "dom-myactivity", provider: "gemini" };
    }

    const result = await tryMethods(
      [
        { name: "dom-myactivity", step: "myactivity-delete", fn: () => deleteMyActivityDom(ctx) },
        {
          name: "api-batchexecute",
          step: null,
          fn: () => deleteAllApi(ctx.onProgress, ctx.delayMs),
        },
        {
          name: "dom-sidebar",
          step: null,
          fn: async () => {
            const r = await deleteSidebarMenus(ctx.onProgress);
            await assertGeminiGone();
            return r;
          },
        },
      ],
      ctx
    );

    return { ...result, provider: "gemini" };
  },
};
