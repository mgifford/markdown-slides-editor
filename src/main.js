import {
  DEFAULT_SOURCE,
  STORAGE_KEY,
  loadSource,
  saveSource,
} from "./modules/storage.js";
import { initColorMode } from "./modules/color-mode.js";
import { clearAllLocalData, clearDeckData } from "./modules/local-data.js";
import { createAppView } from "./modules/views/editor-view.js";
import { createPresentationView } from "./modules/views/presentation-view.js";
import { createPresenterView } from "./modules/views/presenter-view.js";
import { getCurrentRoute, restoreRedirectPath } from "./modules/router.js";

restoreRedirectPath();
initColorMode();
registerServiceWorker();

const app = document.querySelector("#app");
const route = getCurrentRoute(window.location.pathname);

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const serviceWorkerUrl = new URL("../service-worker.js", import.meta.url);
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(serviceWorkerUrl).catch(() => {});
  });
}

async function bootstrap() {
  console.info("[slides-editor] bootstrap:start", {
    route,
    pathname: window.location.pathname,
  });
  const savedSource = await loadSource(STORAGE_KEY);
  const source = savedSource || DEFAULT_SOURCE;

  if (route === "present") {
    console.info("[slides-editor] bootstrap:view", { route: "present" });
    createPresentationView(app, source);
    return;
  }

  if (route === "presenter") {
    console.info("[slides-editor] bootstrap:view", { route: "presenter" });
    createPresenterView(app, source);
    return;
  }

  console.info("[slides-editor] bootstrap:view", { route: "editor" });
  createAppView(app, {
    initialSource: source,
    onSourceChange: (nextSource) => saveSource(STORAGE_KEY, nextSource),
    onClearDeck: async () => {
      await clearDeckData();
    },
    onClearAll: async () => {
      await clearAllLocalData();
    },
  });
}

bootstrap().catch((error) => {
  console.error("[slides-editor] bootstrap:failed", error);
});
