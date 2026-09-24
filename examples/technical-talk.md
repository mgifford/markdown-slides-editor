---
title: Keeping the Cache Honest
subtitle: A cache-first service worker audit you can run in an afternoon
date: 2026-09-24
location: Ottawa
speakers: Priya Nair
durationMinutes: 20
titleSlide: true
closingSlide: true
closingTitle: Questions?
closingPrompt: Cache first, verify always.
contactUrl: https://example.com/cache-audit
presentationUrl: https://example.com/cache-audit
---

# The problem

Stale caches serve old app shells silently, and the bug report says
"it works after a hard refresh".

- Users get a version from last month
- The version bump is human discipline
- Nobody knows what the cache actually contains

Note:
Frame the hard-refresh comment as the symptom. Users rarely bullet-proof their
old caches, so the app must purge them.

Resources:
- [Cache API fundamentals](https://developer.mozilla.org/en-US/docs/Web/API/Cache)
- [Service worker cookbook: cache invalidation](https://example.com/cache-cookbook)

---

# Pipeline architecture

::mermaid
flowchart LR
  A[Request] --> B{Network first?}
  B -->|Yes| C[Network]
  B -->|No| D[Cache]
  C --> E[Fresh + refresh cache]
  D --> F[App shell]
  E --> G[Respond]
  F --> G
::

One rule: navigation and app-shell assets are network-first, everything else is
cache-first.

Note:
The branch is deliberate: critical assets always try the network, then fall
back, so a bad deploy is fixable hot.

Script:
Walk the diagram left to right. Emphasise where the fallback happens and why.

---

# The fix

::code javascript
const CACHE_NAME = "markdown-slides-editor-v6";
const APP_SHELL_ASSETS = ["./index.html", "./src/main.js", "./src/modules/*"];

self.addEventListener("active", () => {
  caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
  );
});
::

Bump the version with every shell change and the old cache disappears on next
activation.

Note:
The deletion is the important part. A version string alone does nothing without
an aggressive purge step.

Resources:
- [Service worker lifecycle reference](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers#download-install-and-activate)

---

# Measured impact

::figure
![Line chart showing the percentage of requests served from cache dropping momentarily with each version bump](https://example.com/cache-hit-rate.png)
---
Each version bump drops the cache-hit rate briefly, then returns to baseline within an hour.
::

The purge is cheap because it runs in the background and touches only the stale
cache name.

Note:
The chart shows the same drop repeated across three releases. The dip is the
cost of correctness; it recovers because warm caches refill quickly.

Resources:
- [Cache-hit-rate recording script](https://example.com/hit-rate)

---

# Benchmark table

::table
| Deploy | Shell fetch | Interrupted updates | Purged caches |
| --- | --- | --- | --- |
| No bump | cached | yes | 0 |
| Bump, no purge | fresh | yes | 0 |
| Bump + purge | fresh | no | 1 |
::

The full pattern is the only row that left a single cache behind.

Note:
Read the table as three rows of evidence for one decision: version + purge
together.

---

# Next steps

1. Count your current cached app shells in DevTools
2. Add a versioned `CACHE_NAME` and an aggressive purge handler
3. Verify with a hard-refresh-only user test after the next deploy

Note:
Keep the hand-off short; send people to the resources for the full recipe.

Script:
End with the verification step as the takeaway — the test that catches the
hard-refresh bug before users do.

Resources:
- [Full deployment checklist](https://example.com/deploy-checklist)