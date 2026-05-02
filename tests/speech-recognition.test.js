import test from "node:test";
import assert from "node:assert/strict";

import {
  isSpeechRecognitionSupported,
  createSpeechRecognitionSource,
  CAPTION_LANGUAGES,
  CAPTION_LANGUAGE_STORAGE_KEY,
  getCaptionLanguage,
  setCaptionLanguage,
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

test("CAPTION_LANGUAGES contains BCP 47 tag, human label, and Whisper code", () => {
  assert.ok(Array.isArray(CAPTION_LANGUAGES), "CAPTION_LANGUAGES should be an array");
  assert.ok(CAPTION_LANGUAGES.length > 0, "CAPTION_LANGUAGES should not be empty");
  for (const entry of CAPTION_LANGUAGES) {
    assert.equal(entry.length, 3, `Each entry should have 3 elements, got: ${JSON.stringify(entry)}`);
    const [tag, label, whisperCode] = entry;
    assert.ok(typeof tag === "string" && tag.length > 0, `BCP 47 tag should be a non-empty string: ${tag}`);
    assert.ok(typeof label === "string" && label.length > 0, `Label should be a non-empty string: ${label}`);
    assert.ok(typeof whisperCode === "string" && whisperCode.length > 0, `Whisper code should be a non-empty string: ${whisperCode}`);
  }
});

test("CAPTION_LANGUAGES includes English (United States) as en-US", () => {
  const entry = CAPTION_LANGUAGES.find(([tag]) => tag === "en-US");
  assert.ok(entry, "en-US should be present");
  assert.equal(entry[2], "en", "Whisper code for en-US should be 'en'");
});

test("getCaptionLanguage falls back to en-US when localStorage and document are unavailable", () => {
  // Node.js has no window/localStorage/document, so the fallback should apply.
  const lang = getCaptionLanguage();
  assert.equal(lang, "en-US");
});

test("setCaptionLanguage and getCaptionLanguage round-trip through localStorage", () => {
  // Provide a minimal localStorage stub.
  const store = {};
  globalThis.localStorage = {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = value; },
    removeItem: (key) => { delete store[key]; },
  };

  setCaptionLanguage("fr-FR");
  assert.equal(getCaptionLanguage(), "fr-FR");

  setCaptionLanguage("de");
  assert.equal(getCaptionLanguage(), "de");

  delete globalThis.localStorage;
});

test("createSpeechRecognitionSource exposes getLanguage and setLanguage", () => {
  const store = {};
  globalThis.localStorage = {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = value; },
    removeItem: (key) => { delete store[key]; },
  };

  function FakeSpeechRecognition() {
    this.continuous = false;
    this.interimResults = false;
    this.lang = "";
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
  }
  globalThis.window = { SpeechRecognition: FakeSpeechRecognition };

  const updates = [];
  const source = createSpeechRecognitionSource((update) => updates.push(update));
  assert.ok(source, "source should be returned when API is available");

  assert.equal(typeof source.getLanguage, "function", "getLanguage should be a function");
  assert.equal(typeof source.setLanguage, "function", "setLanguage should be a function");

  // Initial language should default to en-US (no stored language).
  assert.equal(source.getLanguage(), "en-US");

  // setLanguage should persist to localStorage.
  source.setLanguage("ja");
  assert.equal(source.getLanguage(), "ja");
  assert.equal(store[CAPTION_LANGUAGE_STORAGE_KEY], "ja");

  delete globalThis.window;
  delete globalThis.localStorage;
});

test("createSpeechRecognitionSource accumulates full transcript across multiple results", () => {
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
    this.stop = () => { this._started = false; };
    instance = this;
  }
  globalThis.window = { SpeechRecognition: FakeSpeechRecognition };

  const updates = [];
  const source = createSpeechRecognitionSource((update) => updates.push(update));
  source.start();

  const makeEvent = (transcript) => ({
    resultIndex: 0,
    results: Object.assign(
      [Object.assign([{ transcript }], { isFinal: true })],
      { length: 1 }
    ),
  });

  instance.onresult(makeEvent("First segment."));
  instance.onresult(makeEvent(" Second segment."));

  assert.ok(source.getFullTranscript().includes("First segment."), "should contain first segment");
  assert.ok(source.getFullTranscript().includes("Second segment."), "should contain second segment");

  delete globalThis.window;
});

test("createSpeechRecognitionSource getSegments returns timestamped entries", () => {
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
    this.stop = () => { this._started = false; };
    instance = this;
  }
  globalThis.window = { SpeechRecognition: FakeSpeechRecognition };

  const source = createSpeechRecognitionSource(() => {});
  source.start();

  const makeEvent = (transcript) => ({
    resultIndex: 0,
    results: Object.assign(
      [Object.assign([{ transcript }], { isFinal: true })],
      { length: 1 }
    ),
  });

  instance.onresult(makeEvent("Hello everyone."));
  instance.onresult(makeEvent("Welcome to the talk."));

  const segments = source.getSegments();
  assert.equal(segments.length, 2, "should have two segments");
  assert.equal(segments[0].text, "Hello everyone.", "first segment text");
  assert.equal(segments[1].text, "Welcome to the talk.", "second segment text");
  assert.ok(typeof segments[0].start === "number", "start should be a number");
  assert.ok(typeof segments[0].end === "number", "end should be a number");
  assert.ok(segments[0].start <= segments[0].end, "start should not exceed end");

  delete globalThis.window;
});

test("createSpeechRecognitionSource clearText resets display text but preserves full transcript", () => {
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
    this.stop = () => { this._started = false; };
    instance = this;
  }
  globalThis.window = { SpeechRecognition: FakeSpeechRecognition };

  const updates = [];
  const source = createSpeechRecognitionSource((update) => updates.push(update));
  source.start();

  const makeEvent = (transcript) => ({
    resultIndex: 0,
    results: Object.assign(
      [Object.assign([{ transcript }], { isFinal: true })],
      { length: 1 }
    ),
  });

  instance.onresult(makeEvent("Before slide change."));
  assert.ok(source.getFullTranscript().includes("Before slide change."), "should have transcript before clear");

  source.clearText();
  // Live display text is cleared
  assert.equal(updates[updates.length - 1].text, "", "display text should be cleared");
  // Full transcript is preserved
  assert.ok(source.getFullTranscript().includes("Before slide change."), "full transcript should be preserved after clear");
  // Segments are preserved
  assert.equal(source.getSegments().length, 1, "segments should be preserved after clear");

  delete globalThis.window;
});
