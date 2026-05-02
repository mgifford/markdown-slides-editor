import test from "node:test";
import assert from "node:assert/strict";

import {
  formatVttTime,
  buildVttContent,
  buildTranscriptCleanupPrompt,
} from "../src/modules/transcript-export.js";

test("formatVttTime formats zero as 00:00:00.000", () => {
  assert.equal(formatVttTime(0), "00:00:00.000");
});

test("formatVttTime formats a simple offset", () => {
  // 1 minute 23 seconds 456 ms = 83456 ms
  assert.equal(formatVttTime(83456), "00:01:23.456");
});

test("formatVttTime formats over one hour", () => {
  // 1 hour 2 min 3 sec 4 ms = 3723004 ms
  assert.equal(formatVttTime(3723004), "01:02:03.004");
});

test("formatVttTime clamps negative values to zero", () => {
  assert.equal(formatVttTime(-500), "00:00:00.000");
});

test("buildVttContent returns header-only string for empty segments", () => {
  assert.equal(buildVttContent([]), "WEBVTT\n");
  assert.equal(buildVttContent(null), "WEBVTT\n");
  assert.equal(buildVttContent(undefined), "WEBVTT\n");
});

test("buildVttContent skips segments with empty text", () => {
  const segments = [
    { start: 0, end: 1000, text: "" },
    { start: 1000, end: 2000, text: "   " },
  ];
  assert.equal(buildVttContent(segments), "WEBVTT\n");
});

test("buildVttContent generates a single cue", () => {
  const segments = [{ start: 0, end: 5000, text: "Hello world" }];
  const result = buildVttContent(segments);
  assert.ok(result.startsWith("WEBVTT\n\n"), "should start with WEBVTT header");
  assert.ok(result.includes("00:00:00.000 --> 00:00:05.000"), "should include timing line");
  assert.ok(result.includes("Hello world"), "should include cue text");
  assert.ok(result.includes("1\n"), "should include cue index");
});

test("buildVttContent generates multiple sequential cues", () => {
  const segments = [
    { start: 0, end: 4000, text: "First sentence." },
    { start: 4000, end: 9000, text: "Second sentence." },
  ];
  const result = buildVttContent(segments);
  assert.ok(result.includes("1\n00:00:00.000 --> 00:00:04.000\nFirst sentence."), "first cue");
  assert.ok(result.includes("2\n00:00:04.000 --> 00:00:09.000\nSecond sentence."), "second cue");
});

test("buildVttContent uses start + 1000ms when end <= start", () => {
  const segments = [{ start: 5000, end: 5000, text: "Short cue" }];
  const result = buildVttContent(segments);
  assert.ok(result.includes("00:00:05.000 --> 00:00:06.000"), "end should be start + 1 second");
});

test("buildTranscriptCleanupPrompt includes the raw transcript", () => {
  const prompt = buildTranscriptCleanupPrompt("Hello world transcript.", "# Slide one\n\nContent.");
  assert.ok(prompt.includes("Hello world transcript."), "should include transcript text");
});

test("buildTranscriptCleanupPrompt includes the markdown source", () => {
  const prompt = buildTranscriptCleanupPrompt("Some transcript.", "# My Slide\n\nSlide body.");
  assert.ok(prompt.includes("# My Slide"), "should include markdown source");
});

test("buildTranscriptCleanupPrompt handles empty transcript gracefully", () => {
  const prompt = buildTranscriptCleanupPrompt("", "# Slide");
  assert.ok(prompt.includes("[No transcript text captured yet]"), "should note empty transcript");
});

test("buildTranscriptCleanupPrompt handles missing markdown source gracefully", () => {
  const prompt = buildTranscriptCleanupPrompt("Some words.", "");
  assert.ok(prompt.includes("[No slide content available]"), "should note missing slide content");
});

test("buildTranscriptCleanupPrompt includes cleanup instructions", () => {
  const prompt = buildTranscriptCleanupPrompt("Text.", "# Slide");
  assert.ok(prompt.includes("Remove duplicate phrases"), "should include duplicate removal instruction");
  assert.ok(prompt.includes("incorrectly transcribed"), "should include transcription fix instruction");
  assert.ok(prompt.includes("Preserve the speaker"), "should include intent preservation instruction");
});
