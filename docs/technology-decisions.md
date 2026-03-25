# Technology Decisions

This document records significant technology evaluations and the reasoning behind decisions to adopt or decline them.

---

## htmx

**Evaluated:** 2026-03

**Decision:** Not adopted for the current static baseline. Revisit if and when a server-rendering layer is added.

### What htmx is

[htmx](https://htmx.org) is a JavaScript library that lets HTML attributes drive AJAX behavior. Its core model is "Hypermedia As The Engine Of Application State" (HATEOAS): the server returns HTML fragments, and htmx swaps them into the page using attributes such as `hx-get`, `hx-post`, `hx-swap`, and `hx-trigger`. It also supports Server-Sent Events and WebSocket bindings.


### Why it is a good library in general

- Dramatically reduces the amount of JavaScript needed in server-rendered applications.
- Keeps UI state close to the server, which is valuable for multi-user apps, admin panels, and CRUD workflows.
- Has very small footprint, good accessibility defaults, and an active community.
- Works well alongside frameworks such as Django, Rails, Laravel, Go's `templ`, and similar server-rendered stacks.

### Why it does not fit this project's current architecture

This project is a fully client-side, static single-page application (SPA) that runs on GitHub Pages with no backend. Several constraints make htmx a poor fit for the current baseline.

**1. There is no server to return HTML fragments.**
htmx's primary value is receiving HTML from a server and merging it into the DOM. This project has no server. All rendering happens inside the browser from Markdown source. There is no endpoint that could return the slide HTML fragments htmx would need.

**2. The project has zero runtime dependencies by design.**
The package has no npm runtime dependencies. Adding htmx (even via CDN) introduces an external dependency for a feature set that simply does not apply to this runtime model. The existing vanilla ES module patterns are the correct choice for a static, browser-only tool.

**3. All DOM updates are driven by in-browser Markdown compilation.**
When a user edits Markdown the editor compiles it synchronously in the browser and writes the result into the preview DOM. This is a purely local, data-driven update loop — not an HTTP round-trip. htmx would add no value here; it would only add indirection.

**4. The only actual HTTP interactions do not benefit from htmx.**
Two HTTP requests exist in the codebase:

| Location | Purpose | htmx benefit |
|---|---|---|
| `editor-view.js` `readCss()` | Fetches the local CSS file once for export snapshot generation | None — this is a one-shot local resource read, not a server HTML fragment swap. |
| `captions.js` `fetchCaptionState()` | Polls an optional caption/transcript source URL | None — the response is JSON, not HTML. The result must be parsed and integrated into the presenter state machine. |

For the caption polling case, htmx does have a polling trigger (`hx-trigger="every Ns"`), but it requires the endpoint to return HTML, which is incompatible with the current JSON-based transcript format and the local Whisper demo server.

**5. The static-by-default product principle rules it out for the baseline.**
The project's documented [product principles](./product-principles.md) state: "The baseline product must work on GitHub Pages without a server." A library whose primary purpose is server-driven HTML responses cannot improve that baseline.

### Where htmx could be reconsidered

The planned optional [Cloudflare Worker integration](./cloudflare-sync-plan.md) would introduce a real HTTP API for cloud save/load, deck comments, and revision history. If that Worker were extended to support HTML-fragment responses, htmx could simplify the cloud-sync UI: for example, login state, deck listing, and comment rendering could be handled declaratively with `hx-get` and `hx-target` attributes rather than bespoke fetch calls.

However, even for that layer the current plan uses a JSON REST API, which is a better fit for a client-side SPA that integrates server data into a complex in-browser editor state machine. The htmx HATEOAS model works best when the server owns the rendered output; here the browser always owns the final rendered slide HTML.

**Recommendation for the Cloudflare layer:** Use `fetch` with JSON responses. Keep htmx under consideration only if the Worker layer grows large enough that a server-rendered HTML fragment model would genuinely simplify the UI code.

### Summary

| Criterion | Assessment |
|---|---|
| Server exists to return HTML fragments | ✗ None in static baseline |
| Runtime dependency acceptable | ✗ Project has zero dependencies by design |
| DOM updates require AJAX HTML swaps | ✗ All updates are local Markdown compilation |
| Existing HTTP interactions return HTML | ✗ One local asset fetch, one JSON poll |
| Aligns with static-first product principle | ✗ htmx's core value is server-driven state |
| Potential future relevance | ✔ Revisit if Cloudflare Worker UI grows complex |
