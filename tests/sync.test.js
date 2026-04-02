import test from "node:test";
import assert from "node:assert/strict";
import { createSyncChannel } from "../src/modules/sync.js";

function makeFakeBroadcastChannel() {
  const instances = [];

  function FakeBroadcastChannel(name) {
    this.name = name;
    this._closed = false;
    this._listeners = [];
    this.postMessage = (data) => {
      for (const listener of this._listeners) {
        listener({ data });
      }
    };
    this.addEventListener = (event, handler) => {
      if (event === "message") this._listeners.push(handler);
    };
    this.close = () => { this._closed = true; };
    instances.push(this);
  }

  return { FakeBroadcastChannel, instances };
}

test("createSyncChannel BroadcastChannel path: postMessage and subscribe use the channel", (t) => {
  const { FakeBroadcastChannel, instances } = makeFakeBroadcastChannel();
  const original = globalThis.BroadcastChannel;
  globalThis.BroadcastChannel = FakeBroadcastChannel;
  t.after(() => { globalThis.BroadcastChannel = original; });

  const channel = createSyncChannel();
  assert.equal(typeof channel.postMessage, "function");
  assert.equal(typeof channel.subscribe, "function");
  assert.equal(instances.length, 1);

  const received = [];
  channel.subscribe((msg) => received.push(msg));

  // postMessage should forward data to the underlying channel listeners.
  instances[0].postMessage({ type: "nav", index: 2 });
  assert.equal(received.length, 1);
  assert.equal(received[0].type, "nav");
});

test("createSyncChannel uses localStorage fallback when BroadcastChannel is unavailable", (t) => {
  const originalBC = globalThis.BroadcastChannel;
  globalThis.BroadcastChannel = undefined;

  const storageListeners = [];
  globalThis.localStorage = {
    _store: {},
    getItem(key) { return this._store[key] ?? null; },
    setItem(key, value) { this._store[key] = value; },
    removeItem(key) { delete this._store[key]; },
  };
  globalThis.window = {
    addEventListener(event, handler) {
      if (event === "storage") storageListeners.push(handler);
    },
  };

  t.after(() => {
    globalThis.BroadcastChannel = originalBC;
    delete globalThis.localStorage;
    delete globalThis.window;
  });

  const channel = createSyncChannel();
  assert.equal(typeof channel.postMessage, "function");
  assert.equal(typeof channel.subscribe, "function");

  // subscribe registers a storage event listener
  const received = [];
  channel.subscribe((msg) => received.push(msg));
  assert.equal(storageListeners.length, 1);

  // postMessage writes serialized JSON into localStorage
  channel.postMessage({ type: "slide", index: 3 });
  const stored = JSON.parse(globalThis.localStorage._store["markdown-slides-editor.presenter"]);
  assert.equal(stored.type, "slide");
  assert.equal(stored.index, 3);
  assert.equal(typeof stored.timestamp, "number");

  // Simulating a storage event delivers the message to the subscriber
  storageListeners[0]({
    key: "markdown-slides-editor.presenter",
    newValue: JSON.stringify({ type: "slide", index: 5 }),
  });
  assert.equal(received.length, 1);
  assert.equal(received[0].index, 5);
});

test("createSyncChannel localStorage fallback ignores events for other keys or empty values", (t) => {
  const originalBC = globalThis.BroadcastChannel;
  globalThis.BroadcastChannel = undefined;

  const storageListeners = [];
  globalThis.localStorage = {
    _store: {},
    getItem(key) { return this._store[key] ?? null; },
    setItem(key, value) { this._store[key] = value; },
    removeItem(key) { delete this._store[key]; },
  };
  globalThis.window = {
    addEventListener(event, handler) {
      if (event === "storage") storageListeners.push(handler);
    },
  };

  t.after(() => {
    globalThis.BroadcastChannel = originalBC;
    delete globalThis.localStorage;
    delete globalThis.window;
  });

  const channel = createSyncChannel();
  const received = [];
  channel.subscribe((msg) => received.push(msg));

  // Event for a different key should be ignored.
  storageListeners[0]({ key: "some-other-key", newValue: JSON.stringify({ x: 1 }) });
  // Event with a null/empty value should be ignored.
  storageListeners[0]({ key: "markdown-slides-editor.presenter", newValue: null });
  storageListeners[0]({ key: "markdown-slides-editor.presenter", newValue: "" });

  assert.equal(received.length, 0);
});
