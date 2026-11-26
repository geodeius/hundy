import { sites } from "./sites.js";

const master = document.querySelector("#enabled");
const list = document.querySelector("#sites");
const status = document.querySelector("#status");
const inputs = new Map();
let settings;

master.addEventListener("change", () => request({ type: "set", value: master.checked }));
for (const site of sites) {
  const label = document.createElement("label");
  label.className = "row";
  const name = document.createElement("span");
  name.textContent = site.name;
  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("role", "switch");
  input.addEventListener("change", () => request({ type: "set", site: site.id, value: input.checked }));
  inputs.set(site.id, input);
  label.append(name, input);
  list.append(label);
}

async function request(message) {
  const controls = [master, ...inputs.values()];
  controls.forEach(control => { control.disabled = true; });
  status.textContent = "";
  try {
    const result = await chrome.runtime.sendMessage(message);
    if (!result?.settings) throw new Error("Settings unavailable");
    settings = result.settings;
  } catch {
    status.textContent = message.type === "get"
      ? "Couldn’t load settings. Reopen Hundy to retry."
      : "Couldn’t update blocking. Try again.";
  } finally {
    if (settings) {
      master.checked = settings.enabled;
      for (const [id, input] of inputs) input.checked = Boolean(settings.selected[id]);
      controls.forEach(control => { control.disabled = false; });
    }
  }
}

request({ type: "get" });
