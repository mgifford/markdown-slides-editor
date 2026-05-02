import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { STORAGE_KEY, loadSource, saveSource } from "../../src/modules/storage.js";

// ─── localStorage mock ────────────────────────────────────────────────────────

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

// ─── Shared state ─────────────────────────────────────────────────────────────

let storageKey = null;
let loadedValue = undefined;
let loadError = null;
const originalIndexedDB = globalThis.indexedDB;
const originalLocalStorage = globalThis.localStorage;

// ─── Givens ───────────────────────────────────────────────────────────────────

Given("a deck record with source {string}", function (source) {
  globalThis.indexedDB = undefined;
  globalThis.localStorage = createLocalStorageMock();
  this.pendingSource = source;
});

Given("IndexedDB is unavailable", function () {
  globalThis.indexedDB = undefined;
  globalThis.localStorage = createLocalStorageMock();
});

Given("storage is empty", function () {
  globalThis.indexedDB = undefined;
  globalThis.localStorage = createLocalStorageMock();
});

// ─── Whens ────────────────────────────────────────────────────────────────────

When("I read the storage key", function () {
  storageKey = STORAGE_KEY;
});

When("I save the deck record using in-memory storage", async function () {
  await saveSource(STORAGE_KEY, this.pendingSource);
});

When("I load the deck record from in-memory storage", async function () {
  loadedValue = await loadSource(STORAGE_KEY);
});

When("I load the deck record from storage", async function () {
  loadError = null;
  try {
    loadedValue = await loadSource(STORAGE_KEY);
  } catch (err) {
    loadError = err;
  }
});

// ─── Thens ────────────────────────────────────────────────────────────────────

Then("the storage key is {string}", function (expected) {
  assert.equal(storageKey, expected);
});

Then("the loaded source is {string}", function (expected) {
  assert.equal(loadedValue, expected);
  // Restore globals after the assertion
  globalThis.indexedDB = originalIndexedDB;
  globalThis.localStorage = originalLocalStorage;
});

Then("the load does not throw an error", function () {
  assert.equal(loadError, null);
  globalThis.indexedDB = originalIndexedDB;
  globalThis.localStorage = originalLocalStorage;
});

Then("the loaded record is null", function () {
  assert.equal(loadedValue, null);
  globalThis.indexedDB = originalIndexedDB;
  globalThis.localStorage = originalLocalStorage;
});
