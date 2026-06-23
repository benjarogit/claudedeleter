import { deleteAllChats } from "./lib/deleter.js";
import { onRuntimeMessage, sendRuntimeMessage } from "./lib/api.js";

console.log("[ACC] content script loaded");

onRuntimeMessage((request, _sender, sendResponse) => {
  if (request.action !== "deleteAll") {
    return;
  }

  deleteAllChats({
    onProgress: (event) => {
      if (event.type === "complete") {
        sendRuntimeMessage({ action: "complete", ...event });
      } else if (event.type === "error") {
        sendRuntimeMessage({ action: "error", error: event.message });
      } else {
        sendRuntimeMessage({ action: "updateProgress", ...event });
      }
    },
  })
    .catch((error) => {
      console.error("[ACC]", error);
      sendRuntimeMessage({ action: "error", error: error.message });
    });

  sendResponse({ started: true });
  return true;
});
