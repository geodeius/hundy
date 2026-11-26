import { activeSites, blockedPath, matchingSite, sites } from "./sites.js";

const defaults = { enabled: false, selected: {} };
const rulesApi = chrome.declarativeNetRequest;
let queue = Promise.resolve();

function enqueue(operation) {
  const result = queue.then(operation);
  queue = result.catch(error => console.error("Hundy:", error));
  return result;
}

async function readSettings() {
  const { settings = defaults } = await chrome.storage.local.get("settings");
  return settings;
}

async function reconcile(settings) {
  const blocking = activeSites(settings);
  const existing = await rulesApi.getDynamicRules();
  await rulesApi.updateDynamicRules({
    removeRuleIds: existing.map(rule => rule.id),
    addRules: blocking.map(site => ({
      id: site.ruleId,
      priority: 1,
      action: { type: "redirect", redirect: { extensionPath: blockedPath(site) } },
      condition: { requestDomains: site.domains, resourceTypes: ["main_frame"] },
    })),
  });

  if (!blocking.length) return;
  const tabs = await chrome.tabs.query({});
  const updates = tabs.map(async tab => {
    const site = matchingSite(tab.pendingUrl || tab.url, blocking);
    if (site && tab.id !== undefined) {
      const current = await chrome.tabs.get(tab.id);
      if (matchingSite(current.pendingUrl || current.url, blocking) === site) {
        await chrome.tabs.update(tab.id, { url: chrome.runtime.getURL(blockedPath(site)) });
      }
    }
  });
  // A tab can close while the update is in flight.
  await Promise.allSettled(updates);
}

chrome.runtime.onInstalled.addListener(() => enqueue(async () => reconcile(await readSettings())));
chrome.runtime.onStartup.addListener(() => enqueue(async () => reconcile(await readSettings())));

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.url !== chrome.runtime.getURL("popup.html")) return;
  if (message?.type !== "get" && message?.type !== "set") return;
  enqueue(async () => {
    const previous = await readSettings();
    if (message.type === "get") {
      await reconcile(previous);
      return previous;
    }
    if (typeof message.value !== "boolean") throw new Error("Invalid setting");
    const next = message.site === undefined
      ? { ...previous, enabled: message.value }
      : { ...previous, selected: { ...previous.selected, [message.site]: message.value } };
    if (message.site !== undefined && !sites.some(site => site.id === message.site)) {
      throw new Error("Unknown site");
    }
    await chrome.storage.local.set({ settings: next });
    try {
      await reconcile(next);
    } catch (error) {
      await chrome.storage.local.set({ settings: previous });
      await reconcile(previous);
      throw error;
    }
    return next;
  }).then(settings => respond({ settings }), () => respond({ error: true }));
  return true;
});
