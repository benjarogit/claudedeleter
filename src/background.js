// MV3 background — service worker (Chrome) or script (Firefox fallback).
const api = globalThis.browser ?? globalThis.chrome;
const ALARM_NAME = "acc-keepalive";

api.runtime.onMessage.addListener((message) => {
  if (message.action === "deleteAll" || message.action === "updateProgress") {
    api.alarms.create(ALARM_NAME, { periodInMinutes: 0.4 });
  }
  if (message.action === "complete" || message.action === "error") {
    api.alarms.clear(ALARM_NAME);
  }
});

api.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    console.log("[ACC] keepalive");
  }
});
