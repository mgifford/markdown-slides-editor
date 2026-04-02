import test from "node:test";
import assert from "node:assert/strict";

import {
  fetchCaptionState,
  getCaptionConfig,
  parseCaptionPayload,
} from "../src/modules/captions.js";

test("getCaptionConfig prefers explicit caption source", () => {
  const config = getCaptionConfig(
    { captionsSource: "https://captions.example.test/live.json", captionsProvider: "service" },
    { href: "https://slides.example.test/", hostname: "slides.example.test" },
  );

  assert.equal(config.enabled, true);
  assert.equal(config.source, "https://captions.example.test/live.json");
  assert.equal(config.provider, "service");
});

test("getCaptionConfig uses localhost whisper transcript by default", () => {
  const config = getCaptionConfig({}, { href: "http://localhost:4173/", hostname: "localhost" });

  assert.equal(config.enabled, true);
  assert.equal(config.source, "http://localhost:4173/whisper-demo/transcript.json");
});

test("parseCaptionPayload understands transcript json state", () => {
  const payload = parseCaptionPayload('{"active":true,"generated":"2026-03-22T12:00:00Z","text":"Hello world"}');

  assert.equal(payload.available, true);
  assert.equal(payload.active, true);
  assert.equal(payload.text, "Hello world");
  assert.equal(payload.generated, "2026-03-22T12:00:00Z");
});

test("fetchCaptionState hides captions when the source is unavailable", async () => {
  const state = await fetchCaptionState(
    { enabled: true, source: "http://localhost:4173/whisper-demo/transcript.json", provider: "whisper.cpp", pollMs: 1500 },
    async () => ({ ok: false, status: 404, text: async () => "" }),
  );

  assert.equal(state.available, false);
  assert.equal(state.active, false);
  assert.equal(state.text, "");
});

test("getCaptionConfig returns a disabled config when captions metadata is false", () => {
  const config = getCaptionConfig(
    { captions: false },
    { href: "http://localhost:4173/", hostname: "localhost" },
  );
  assert.equal(config.enabled, false);
  assert.equal(config.source, "");
  assert.equal(config.provider, "none");
});

test("getCaptionConfig returns a disabled config when captionsEnabled metadata is false", () => {
  const config = getCaptionConfig(
    { captionsEnabled: false },
    { href: "http://localhost:4173/", hostname: "localhost" },
  );
  assert.equal(config.enabled, false);
});

test("getCaptionConfig returns a disabled config for a non-local host with no explicit source", () => {
  const config = getCaptionConfig(
    {},
    { href: "https://slides.example.com/", hostname: "slides.example.com" },
  );
  assert.equal(config.enabled, false);
  assert.equal(config.source, "");
});

test("getCaptionConfig accepts transcriptSource as an alias for captionsSource", () => {
  const config = getCaptionConfig(
    { transcriptSource: "https://captions.example.test/live.json" },
    { href: "https://slides.example.test/", hostname: "slides.example.test" },
  );
  assert.equal(config.enabled, true);
  assert.equal(config.source, "https://captions.example.test/live.json");
});

test("parseCaptionPayload returns an unavailable state for null input", () => {
  const payload = parseCaptionPayload(null);
  assert.equal(payload.available, false);
  assert.equal(payload.active, false);
  assert.equal(payload.text, "");
  assert.equal(payload.generated, "");
});

test("parseCaptionPayload treats a plain non-JSON string as caption text", () => {
  const payload = parseCaptionPayload("Hello world");
  assert.equal(payload.available, true);
  assert.equal(payload.active, true);
  assert.equal(payload.text, "Hello world");
});

test("parseCaptionPayload handles an invalid JSON string gracefully", () => {
  const payload = parseCaptionPayload("{not valid json}");
  assert.equal(payload.available, true);
  assert.equal(typeof payload.text, "string");
});

test("parseCaptionPayload respects active: false in a JSON payload", () => {
  const payload = parseCaptionPayload('{"active":false,"text":"Paused captions"}');
  assert.equal(payload.available, true);
  assert.equal(payload.active, false);
  assert.equal(payload.text, "Paused captions");
});

test("fetchCaptionState returns a successful state when the source responds with valid JSON", async () => {
  const state = await fetchCaptionState(
    { enabled: true, source: "http://localhost:4173/transcript.json", provider: "whisper.cpp", pollMs: 1500 },
    async () => ({
      ok: true,
      status: 200,
      text: async () => '{"active":true,"text":"Testing one two three","generated":"2026-03-22T12:00:00Z"}',
    }),
  );

  assert.equal(state.available, true);
  assert.equal(state.active, true);
  assert.equal(state.text, "Testing one two three");
  assert.equal(state.provider, "whisper.cpp");
});

test("fetchCaptionState returns a disabled state when config is not enabled", async () => {
  const state = await fetchCaptionState(
    { enabled: false, source: "", provider: "none", pollMs: 1500 },
    async () => { throw new Error("should not be called"); },
  );

  assert.equal(state.enabled, false);
  assert.equal(state.available, false);
});
