import test from "node:test";
import assert from "node:assert/strict";

import {
  isSpeechRecognitionSupported,
  createSpeechRecognitionSource,
} from "../src/modules/speech-recognition.js";

test("isSpeechRecognitionSupported returns false when window is undefined", () => {
  // Node.js has no window object, so the API should not be detected.
  assert.equal(isSpeechRecognitionSupported(), false);
});

test("createSpeechRecognitionSource returns null when API is unavailable", () => {
  const updates = [];
  const source = createSpeechRecognitionSource((update) => updates.push(update));
  assert.equal(source, null);
  assert.equal(updates.length, 0);
});

test("createSpeechRecognitionSource uses injected SpeechRecognition constructor", () => {
  // Simulate a minimal SpeechRecognition implementation.
  let instance = null;
  function FakeSpeechRecognition() {
    this.continuous = false;
    this.interimResults = false;
    this.onstart = null;
    this.onresult = null;
    this.onend = null;
    this.onerror = null;
    this._started = false;
    this.start = () => {
      this._started = true;
      if (this.onstart) this.onstart();
    };
    this.stop = () => {
      this._started = false;
      if (this.onend) this.onend();
    };
    instance = this;
  }

  // Temporarily inject into global scope.
  globalThis.window = { SpeechRecognition: FakeSpeechRecognition };

  const updates = [];
  const source = createSpeechRecognitionSource((update) => updates.push(update));
  assert.ok(source, "source should be returned when API is available");

  source.start();
  assert.ok(instance._started, "recognition.start() should have been called");
  assert.equal(updates.length, 1);
  assert.equal(updates[0].active, true);

  // Simulate a result.
  const fakeEvent = {
    resultIndex: 0,
    results: [
      Object.assign([{ transcript: "Hello world" }], { isFinal: true, length: 1 }),
    ],
  };
  fakeEvent.results[0].length = 1;
  instance.onresult(fakeEvent);
  assert.equal(updates[updates.length - 1].text, "Hello world");

  source.stop();
  assert.equal(instance._started, false);
  const lastUpdate = updates[updates.length - 1];
  assert.equal(lastUpdate.active, false);

  delete globalThis.window;
});

test("createSpeechRecognitionSource clears text on clearText()", () => {
  let instance = null;
  function FakeSpeechRecognition() {
    this.continuous = false;
    this.interimResults = false;
    this.onstart = null;
    this.onresult = null;
    this.onend = null;
    this.onerror = null;
    this._started = false;
    this.start = () => {
      this._started = true;
      if (this.onstart) this.onstart();
    };
    this.stop = () => {
      this._started = false;
    };
    instance = this;
  }
  globalThis.window = { SpeechRecognition: FakeSpeechRecognition };

  const updates = [];
  const source = createSpeechRecognitionSource((update) => updates.push(update));
  source.start();

  // Simulate finalized text.
  const fakeEvent = {
    resultIndex: 0,
    results: [
      Object.assign([{ transcript: "Test text" }], { isFinal: true }),
    ],
  };
  fakeEvent.results[0].length = 1;
  instance.onresult(fakeEvent);
  assert.equal(updates[updates.length - 1].text, "Test text");

  source.clearText();
  assert.equal(updates[updates.length - 1].text, "");

  delete globalThis.window;
});

test("createSpeechRecognitionSource disables on permission error", () => {
  let instance = null;
  function FakeSpeechRecognition() {
    this.continuous = false;
    this.interimResults = false;
    this.onstart = null;
    this.onresult = null;
    this.onend = null;
    this.onerror = null;
    this._started = false;
    this.start = () => {
      this._started = true;
      if (this.onstart) this.onstart();
    };
    this.stop = () => {
      this._started = false;
    };
    instance = this;
  }
  globalThis.window = { SpeechRecognition: FakeSpeechRecognition };

  const updates = [];
  const source = createSpeechRecognitionSource((update) => updates.push(update));
  source.start();

  // Simulate a permission denial.
  instance.onerror({ error: "not-allowed" });
  const lastUpdate = updates[updates.length - 1];
  assert.equal(lastUpdate.active, false);
  assert.equal(lastUpdate.error, "not-allowed");

  delete globalThis.window;
});
