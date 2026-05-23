import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SOURCE,
  STORAGE_KEY,
  clearStoredDocuments,
  loadSource,
  removeSource,
  saveSource,
} from "../src/modules/storage.js";
import { parseSource } from "../src/modules/parser.js";

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
    clear() {
      store.clear();
    },
  };
}

test("storage helpers fall back to localStorage when indexedDB is unavailable", async (t) => {
  const originalIndexedDb = globalThis.indexedDB;
  const originalLocalStorage = globalThis.localStorage;
  globalThis.indexedDB = undefined;
  globalThis.localStorage = createLocalStorageMock();

  t.after(() => {
    globalThis.indexedDB = originalIndexedDb;
    globalThis.localStorage = originalLocalStorage;
  });

  await saveSource(STORAGE_KEY, "# Slide");
  assert.equal(await loadSource(STORAGE_KEY), "# Slide");

  await removeSource(STORAGE_KEY);
  assert.equal(await loadSource(STORAGE_KEY), null);
});

test("clearStoredDocuments clears the localStorage fallback key", async (t) => {
  const originalIndexedDb = globalThis.indexedDB;
  const originalLocalStorage = globalThis.localStorage;
  globalThis.indexedDB = undefined;
  globalThis.localStorage = createLocalStorageMock({
    [STORAGE_KEY]: "# Saved deck",
  });

  t.after(() => {
    globalThis.indexedDB = originalIndexedDb;
    globalThis.localStorage = originalLocalStorage;
  });

  await clearStoredDocuments();
  assert.equal(await loadSource(STORAGE_KEY), null);
});

test("default source includes representative image-hero demo slides", () => {
  const heroSlides = parseSource(DEFAULT_SOURCE).slides
    .map((slide) => slide.body)
    .filter((body) => body.includes("::image-hero"));

  assert.ok(heroSlides.length >= 6, "default deck includes multiple hero-image slides");
  assert.ok(
    heroSlides.some((body) => body.includes("::image-hero\n") && body.includes("Start with the room")),
    "includes the default bottom-left hero sample",
  );
  assert.ok(
    heroSlides.some((body) => body.includes("text-top-left logo-bottom-right")),
    "includes the top-left hero sample",
  );
  assert.ok(
    heroSlides.some((body) => body.includes("text-top-right logo-bottom-left")),
    "includes the top-right hero sample",
  );
  assert.ok(
    heroSlides.some((body) => body.includes("text-bottom-right logo-top-left show-title show-subtitle")),
    "includes the bottom-right visible-heading hero sample",
  );
  assert.ok(
    heroSlides.some((body) => body.includes("text-center logo-top-right")),
    "includes the centered hero sample",
  );
  assert.ok(
    heroSlides.some((body) => body.includes("stay-2 transition-6 final-0.2")),
    "includes the timed hero sample",
  );
  assert.ok(
    heroSlides.some((body) => body.includes("Image-only hero") && !body.includes("\n---\n")),
    "includes the image-only hero sample",
  );
});

test("default source includes non-hero image wrapping samples for media-left and media-right", () => {
  const mediaSlides = parseSource(DEFAULT_SOURCE).slides
    .map((slide) => slide.body)
    .filter((body) => body.includes("::media-left") || body.includes("::media-right"));

  assert.ok(
    mediaSlides.some((body) => body.includes("::media-left") && body.includes("\n---\n")),
    "includes a media-left slide with image/text split",
  );
  assert.ok(
    mediaSlides.some((body) => body.includes("::media-right") && body.includes("\n---\n")),
    "includes a media-right slide with image/text split",
  );
});
