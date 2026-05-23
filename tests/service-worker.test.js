import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const serviceWorkerSource = await readFile(new URL("../service-worker.js", import.meta.url), "utf8");

function toCacheKey(requestOrUrl) {
  if (typeof requestOrUrl === "string") return requestOrUrl;
  return requestOrUrl?.url;
}

async function loadServiceWorker({ fetchImpl, cachedResponses = {} }) {
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
