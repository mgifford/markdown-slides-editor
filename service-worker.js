const CACHE_NAME = "markdown-slides-editor-v1";
const APP_SHELL_ASSETS = [
  "./",
  "./index.html",
  "./404.html",
  "./present/index.html",
  "./presenter/index.html",
  "./styles/app.css",
  "./src/main.js",
  "./src/modules/a11y.js",
  "./src/modules/ai-prompt.js",
  "./src/modules/captions.js",
  "./src/modules/color-mode.js",
  "./src/modules/export.js",
  "./src/modules/markdown.js",
  "./src/modules/mermaid.js",
  "./src/modules/parser.js",
  "./src/modules/presentation-state.js",
  "./src/modules/presenter-layout.js",
  "./src/modules/presenter-timer.js",
  "./src/modules/render.js",
  "./src/modules/router.js",
  "./src/modules/sa11y.js",
  "./src/modules/slide-layout.js",
  "./src/modules/source-format.js",
  "./src/modules/speech-recognition.js",
  "./src/modules/storage.js",
  "./src/modules/sync.js",
  "./src/modules/theme.js",
  "./src/modules/transcript-export.js",
  "./src/modules/utils.js",
  "./src/modules/views/editor-view.js",
  "./src/modules/views/presentation-view.js",
  "./src/modules/views/presenter-view.js",
  "./src/modules/views/shared.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key !== CACHE_NAME)
        .map((key) => caches.delete(key)),
    )),
  );
  self.clients.claim();
});

function shouldCacheResponse(request, response) {
  if (!response || !response.ok) return false;
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  return url.origin === self.location.origin && (url.protocol === "http:" || url.protocol === "https:");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          if (!shouldCacheResponse(request, response)) return response;
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, copy);
          });
          return response;
        })
        .catch(() => {
          if (request.mode === "navigate") {
            return caches.match("./index.html");
          }
          return undefined;
        });
    }),
  );
});
