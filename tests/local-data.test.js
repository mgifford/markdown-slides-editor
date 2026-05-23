import test from "node:test";
import assert from "node:assert/strict";
import {
  APP_LOCAL_STORAGE_KEYS,
  clearAllLocalData,
  clearDeckData,
} from "../src/modules/local-data.js";
import { COLOR_MODE_STORAGE_KEY } from "../src/modules/color-mode.js";
import { STORAGE_KEY } from "../src/modules/storage.js";

function createLocalStorageMock(initialEntries = {}) {
  const store = new Map(Object.entries(initialEntries));
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
  };
}

test("clearDeckData only clears the saved deck source", async (t) => {
  const originalIndexedDb = globalThis.indexedDB;
  const originalLocalStorage = globalThis.localStorage;
  globalThis.indexedDB = undefined;
  globalThis.localStorage = createLocalStorageMock({
    [STORAGE_KEY]: "# Saved deck",
    [COLOR_MODE_STORAGE_KEY]: "dark",
  });

  t.after(() => {
    globalThis.indexedDB = originalIndexedDb;
    globalThis.localStorage = originalLocalStorage;
  });

  await clearDeckData();

  assert.equal(globalThis.localStorage.getItem(STORAGE_KEY), null);
  assert.equal(globalThis.localStorage.getItem(COLOR_MODE_STORAGE_KEY), "dark");
});

test("clearAllLocalData clears known local keys, cache storage, and service workers", async (t) => {
  const originalIndexedDb = globalThis.indexedDB;
  const originalLocalStorage = globalThis.localStorage;
  globalThis.indexedDB = undefined;
  globalThis.localStorage = createLocalStorageMock({
    [STORAGE_KEY]: "# Saved deck",
    "markdown-slides-editor.color-mode": "dark",
    "markdown-slides-editor.captionLanguage": "en-US",
    "markdown-slides-editor.presenter": "{}",
    "markdown-slides-editor.audience-primary": "{}",
    "unrelated-key": "keep",
  });

  t.after(() => {
    globalThis.indexedDB = originalIndexedDb;
    globalThis.localStorage = originalLocalStorage;
  });

  const deletedCaches = [];
  const cacheStorage = {
    keys: async () => ["markdown-slides-editor-v1", "legacy-cache"],
    delete: async (key) => {
      deletedCaches.push(key);
      return true;
    },
  };

  let unregisterCalls = 0;
  const serviceWorker = {
    getRegistrations: async () => [
      { unregister: async () => { unregisterCalls += 1; return true; } },
      { unregister: async () => { unregisterCalls += 1; return true; } },
    ],
  };

  await clearAllLocalData({
    storage: globalThis.localStorage,
    cacheStorage,
    serviceWorker,
  });

  APP_LOCAL_STORAGE_KEYS.forEach((key) => {
    assert.equal(globalThis.localStorage.getItem(key), null);
  });
  assert.equal(globalThis.localStorage.getItem("unrelated-key"), "keep");
  assert.deepEqual(deletedCaches.sort(), ["legacy-cache", "markdown-slides-editor-v1"]);
  assert.equal(unregisterCalls, 2);
});
