import test from "node:test";
import assert from "node:assert/strict";
import {
  COLOR_MODE_STORAGE_KEY,
  getCurrentColorMode,
  resolveInitialColorMode,
  setColorMode,
  subscribeToColorMode,
  toggleColorMode,
} from "../src/modules/color-mode.js";

test("resolveInitialColorMode respects saved user choice first", () => {
  assert.deepEqual(resolveInitialColorMode("dark", false), {
    mode: "dark",
    userHasOverride: true,
  });
  assert.deepEqual(resolveInitialColorMode("light", true), {
    mode: "light",
    userHasOverride: true,
  });
});

test("resolveInitialColorMode falls back to system preference when no saved mode exists", () => {
  assert.deepEqual(resolveInitialColorMode(null, true), {
    mode: "dark",
    userHasOverride: false,
  });
  assert.deepEqual(resolveInitialColorMode(undefined, false), {
    mode: "light",
    userHasOverride: false,
  });
});

function createDomMock() {
  return { documentElement: { dataset: {}, style: {} } };
}

function createStorageMock() {
  const store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = value; },
    removeItem: (key) => { delete store[key]; },
    _store: store,
  };
}

test("getCurrentColorMode returns a valid mode string without requiring DOM access", () => {
  const mode = getCurrentColorMode();
  assert.ok(mode === "light" || mode === "dark");
});

test("setColorMode updates the current mode and persists it to storage", (t) => {
  globalThis.document = createDomMock();
  const storage = createStorageMock();
  t.after(() => { delete globalThis.document; });

  setColorMode("dark", { persist: true, storage });
  assert.equal(getCurrentColorMode(), "dark");
  assert.equal(storage._store[COLOR_MODE_STORAGE_KEY], "dark");

  setColorMode("light", { persist: true, storage });
  assert.equal(getCurrentColorMode(), "light");
  assert.equal(storage._store[COLOR_MODE_STORAGE_KEY], "light");
});

test("setColorMode with persist false does not write to storage", (t) => {
  globalThis.document = createDomMock();
  const storage = createStorageMock();
  t.after(() => { delete globalThis.document; });

  setColorMode("dark", { persist: false, storage });
  assert.equal(getCurrentColorMode(), "dark");
  assert.equal(storage._store[COLOR_MODE_STORAGE_KEY], undefined);
});

test("toggleColorMode switches from dark to light and back", (t) => {
  globalThis.document = createDomMock();
  const storage = createStorageMock();
  t.after(() => { delete globalThis.document; });

  setColorMode("dark", { persist: false, storage });
  toggleColorMode(storage);
  assert.equal(getCurrentColorMode(), "light");

  toggleColorMode(storage);
  assert.equal(getCurrentColorMode(), "dark");
});

test("subscribeToColorMode calls the listener immediately with the current mode", (t) => {
  globalThis.document = createDomMock();
  const storage = createStorageMock();
  t.after(() => { delete globalThis.document; });

  setColorMode("light", { persist: false, storage });

  const updates = [];
  const unsubscribe = subscribeToColorMode((state) => updates.push(state));

  assert.equal(updates.length, 1);
  assert.equal(updates[0].mode, "light");

  unsubscribe();
});

test("subscribeToColorMode notifies listener on mode change and stops after unsubscribe", (t) => {
  globalThis.document = createDomMock();
  const storage = createStorageMock();
  t.after(() => { delete globalThis.document; });

  setColorMode("light", { persist: false, storage });

  const updates = [];
  const unsubscribe = subscribeToColorMode((state) => updates.push(state));
  const initialCount = updates.length;

  setColorMode("dark", { persist: false, storage });
  assert.equal(updates.length, initialCount + 1);
  assert.equal(updates[updates.length - 1].mode, "dark");

  // After unsubscribing the listener should no longer be called.
  unsubscribe();
  setColorMode("light", { persist: false, storage });
  assert.equal(updates.length, initialCount + 1);
});
