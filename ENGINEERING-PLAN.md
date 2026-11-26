# Hundy engineering plan

## Goal and release scope

Hundy blocks selected social media sites in Chrome. V1 has one master switch, a fixed catalog (X, Instagram, Reddit, TikTok, and Facebook), and a page that explains why a site didn't open. Begin with X, including x.com, twitter.com, and their subdomains. Use immediate toggles and a local-only settings model. Schedules, custom domains, and delayed unblocking can follow once the core flow is reliable.

## Architecture

- Use Manifest V3 with plain HTML, CSS, and JavaScript. Ship the source directly as an unpacked extension during development.
- Keep the platform IDs, domain aliases, display names, and stable rule IDs in one catalog. Adding an entry also requires reviewing its manifest host permissions.
- Store the master switch and selected site IDs in chrome.storage.local. Start with blocking off and no sites selected. Switching the master off preserves the selected sites.
- The service worker owns settings writes. Serialize changes so two popup windows can't overwrite each other's changes. Keep the popup disabled while applying a change, and show an error if the worker can't apply it.
- Derive dynamic declarativeNetRequest rules from settings and apply them in one update. Use domain matching and main-frame redirects so embedded content doesn't trigger a full-page block. Chrome applies the rules independently of whether the popup is open.
- Reconcile rules on install, startup, and popup load. If applying a settings change fails, restore the previous settings and rules. Browser storage and rule updates are separate operations, so a worker interruption between writes can leave a mismatch until reconciliation.
- After installing rules, redirect matching tabs already open. Read tab URLs through the site-specific host grants. A tab closing mid-update is an isolated failure.
- Redirect to an extension-owned page with the platform ID only. Page copy never includes the full destination URL. Expose only that page to web navigation so links from other sites can land there. Use no backend, browsing history log, or telemetry.

## Interaction contract

| Scenario | Expected behavior |
|---|---|
| Master off, X selected | X opens. The X selection remains saved. |
| Master on, X selected | x.com, twitter.com, and subdomains redirect to “X is blocked.” |
| Master on, X cleared | X opens. Other selected sites remain blocked. |
| X open when activated | The existing tab switches to the blocked page. |
| Blocked tab has back history | Offer “Go back.” |
| Blocked tab opened without history | Offer “Close tab.” |
| Blocking paused after a redirect | A new visit to X works. Leave the existing blocked page in place. |

## Milestones and exit criteria

1. **X vertical slice.** Build the extension shell, service worker, popup, and blocked page. Load unpacked in Chrome. Verify direct visits, bookmarks, links from unrelated origins, mobile aliases, and already-open tabs.
2. **State and failure cases.** Verify Chrome restart and extension reload with blocking on and off. Exercise toggles across two windows, rapid toggles, a tab closed mid-update, and a rejected rules update. Confirm a lookalike such as x.com.example.org stays accessible.
3. **Catalog expansion.** Add Instagram, Reddit, TikTok, and Facebook, with verified aliases and scoped host grants. Confirm that each toggle acts independently and that the master switch pauses and restores the whole selection.
4. **Release readiness.** Verify keyboard use, focus visibility, light and dark modes, readable error copy, and a permission review. Add Chrome Web Store materials if distribution is requested.

## Local install

Open chrome://extensions, turn on Developer mode, choose Load unpacked, and select the folder containing manifest.json. Open Hundy from the Chrome extensions menu, enable Blocking and X, then try x.com and twitter.com. Click Reload on the extension card after source changes.

## Current status

The X vertical slice is implemented. Static checks and a mocked worker check cover syntax and state transitions. The Chrome acceptance checks above are the first browser verification step.
