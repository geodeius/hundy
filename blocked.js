import { sites } from "./sites.js";

const siteId = new URLSearchParams(location.search).get("site");
const site = sites.find(candidate => candidate.id === siteId);
if (site) document.querySelector("#heading").textContent = site.name + " is blocked";

const leave = document.querySelector("#leave");
const canGoBack = window.navigation?.canGoBack ?? history.length > 1;
leave.textContent = canGoBack ? "Go back" : "Close tab";
leave.addEventListener("click", async () => {
  if (canGoBack) {
    history.back();
    return;
  }
  const tab = await chrome.tabs.getCurrent();
  if (tab?.id !== undefined) await chrome.tabs.remove(tab.id);
});
