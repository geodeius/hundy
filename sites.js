export const sites = [
  { id: "x", ruleId: 1, name: "X", domains: ["x.com", "twitter.com"] },
];

export function activeSites(settings) {
  return settings.enabled ? sites.filter(site => settings.selected[site.id]) : [];
}

export function matchingSite(url, candidates) {
  if (!url) return undefined;
  const { protocol, hostname } = new URL(url);
  if (protocol !== "http:" && protocol !== "https:") return undefined;
  const host = hostname.replace(/\.$/, "");
  return candidates.find(site =>
    site.domains.some(domain => host === domain || host.endsWith("." + domain))
  );
}

export function blockedPath(site) {
  return "/blocked.html?site=" + site.id;
}
