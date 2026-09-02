import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import vm from "node:vm";

const serviceWorkerSource = await readFile(new URL("../service-worker.js", import.meta.url), "utf8");

/** Recursively list every `.js` file under `dir`, returning repo-root-relative paths. */
async function listJsFiles(dir, baseUrl, prefix = "") {
  const entries = await readdir(new URL(dir, baseUrl), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const rel = `${prefix}${entry.name}`;
    if (entry.isDirectory()) {
      files.push(...(await listJsFiles(`${dir}${entry.name}/`, baseUrl, `${rel}/`)));
    } else if (entry.name.endsWith(".js")) {
      files.push(rel);
    }
  }
  return files;
}

function toCacheKey(requestOrUrl) {
  if (typeof requestOrUrl === "string") return requestOrUrl;
  return requestOrUrl?.url;
}

async function loadServiceWorker({ fetchImpl, cachedResponses = {}, scope = "https://slides.example/" }) {
  const listeners = {};
  const store = new Map(Object.entries(cachedResponses));

  const cache = {
    addAll: async (assets) => {
      for (const asset of assets) {
        store.set(asset, new Response("", { status: 200 }));
      }
    },
    put: async (request, response) => {
      store.set(toCacheKey(request), response);
    },
  };

  const context = {
    URL,
    Response,
    Promise,
    console,
    fetch: fetchImpl,
    self: {
      location: { origin: "https://slides.example" },
      registration: { scope },
      skipWaiting() {},
      clients: { claim() {} },
      addEventListener(type, handler) {
        listeners[type] = handler;
      },
    },
    caches: {
      open: async () => cache,
      match: async (request) => store.get(toCacheKey(request)),
      keys: async () => ["markdown-slides-editor-v1"],
      delete: async () => true,
    },
  };

  vm.runInNewContext(serviceWorkerSource, context, { filename: "service-worker.js" });
  return { listeners };
}

async function runFetch(listeners, request) {
  let responsePromise;
  listeners.fetch({
    request,
    respondWith(promise) {
      responsePromise = promise;
    },
  });
  assert.ok(responsePromise, "Expected fetch handler to call respondWith");
  return responsePromise;
}

test("service worker uses network-first for navigation requests", async () => {
  const fetchCalls = [];
  const request = { method: "GET", mode: "navigate", url: "https://slides.example/present/" };
  const { listeners } = await loadServiceWorker({
    cachedResponses: {
      [request.url]: new Response("stale", { status: 200 }),
    },
    fetchImpl: async (incomingRequest) => {
      fetchCalls.push(incomingRequest.url);
      return new Response("fresh", { status: 200 });
    },
  });

  const response = await runFetch(listeners, request);
  assert.equal(await response.text(), "fresh");
  assert.equal(fetchCalls.length, 1);
});

test("service worker falls back to cached app shell assets when network fails", async () => {
  const fetchCalls = [];
  const request = { method: "GET", mode: "cors", url: "https://slides.example/src/main.js" };
  const { listeners } = await loadServiceWorker({
    cachedResponses: {
      [request.url]: new Response("cached-main", { status: 200 }),
    },
    fetchImpl: async (incomingRequest) => {
      fetchCalls.push(incomingRequest.url);
      throw new Error("offline");
    },
  });

  const response = await runFetch(listeners, request);
  assert.equal(await response.text(), "cached-main");
  assert.equal(fetchCalls.length, 1);
});

test("service worker uses network-first for app shell assets under a GitHub Pages subdirectory", async () => {
  const fetchCalls = [];
  const request = {
    method: "GET",
    mode: "cors",
    url: "https://slides.example/markdown-slides-editor/src/modules/markdown.js",
  };
  const { listeners } = await loadServiceWorker({
    scope: "https://slides.example/markdown-slides-editor/",
    cachedResponses: {
      [request.url]: new Response("stale-renderer", { status: 200 }),
    },
    fetchImpl: async (incomingRequest) => {
      fetchCalls.push(incomingRequest.url);
      return new Response("fresh-renderer", { status: 200 });
    },
  });

  const response = await runFetch(listeners, request);
  assert.equal(await response.text(), "fresh-renderer");
  assert.equal(fetchCalls.length, 1);
});

test("service worker keeps cache-first behavior for non-shell assets", async () => {
  const fetchCalls = [];
  const request = { method: "GET", mode: "cors", url: "https://slides.example/images/logo.png" };
  const { listeners } = await loadServiceWorker({
    cachedResponses: {
      [request.url]: new Response("cached-logo", { status: 200 }),
    },
    fetchImpl: async (incomingRequest) => {
      fetchCalls.push(incomingRequest.url);
      return new Response("fresh-logo", { status: 200 });
    },
  });

  const response = await runFetch(listeners, request);
  assert.equal(await response.text(), "cached-logo");
  assert.equal(fetchCalls.length, 0);
});

// Guards against the class of bug where a returning visitor keeps an old cached
// copy of the renderer (which broke native `\( \)` math): every source module
// must be listed in the app-shell cache, and it must all live under one bumpable
// cache version.

test("service worker caches every source module in the app shell", async () => {
  const moduleFiles = await listJsFiles("../src/", import.meta.url, "src/");
  // Ignore nothing: all runtime modules must be cacheable for offline parity.
  const missing = moduleFiles.filter(
    (file) => !serviceWorkerSource.includes(`"./${file}"`),
  );
  assert.deepEqual(
    missing,
    [],
    `Service worker APP_SHELL_ASSETS is missing modules: ${missing.join(", ")}. ` +
      "Add them to service-worker.js and bump CACHE_NAME so returning visitors refresh.",
  );
});

test("service worker declares a single versioned cache name", async () => {
  const match = /const CACHE_NAME = "([^"]+)";/.exec(serviceWorkerSource);
  assert.ok(match, "service-worker.js must declare a CACHE_NAME constant");
  assert.match(
    match[1],
    /-v(\d+)$/,
    "CACHE_NAME must end with a bumpable -vN suffix so caches can be invalidated",
  );
});
