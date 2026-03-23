import test from "node:test";
import assert from "node:assert/strict";
import { buildAiAuthoringPrompt, createAiPromptDefaults } from "../src/modules/ai-prompt.js";

test("createAiPromptDefaults uses deck metadata, slide headings, and resources", () => {
  const defaults = createAiPromptDefaults({
    metadata: {
      title: "Accessible AI",
      speakers: "Alice Example; Bob Example",
      durationMinutes: "30",
      titleSlide: true,
      closingSlide: true,
    },
    renderedSlides: [
      { kind: "title", headings: [{ level: 1, text: "Accessible AI" }], resources: "" },
      { kind: "content", headings: [{ level: 1, text: "Why this matters" }], resources: "- https://example.com/one" },
      { kind: "content", headings: [{ level: 1, text: "What to do next" }], resources: "- https://example.com/two" },
      { kind: "closing", headings: [{ level: 1, text: "Questions?" }], resources: "" },
    ],
    slides: [
      { resources: "" },
      { resources: "- https://example.com/one" },
      { resources: "- https://example.com/two" },
      { resources: "" },
    ],
  });

  assert.equal(defaults.title, "Accessible AI");
  assert.equal(defaults.presenters, "Alice Example; Bob Example");
  assert.deepEqual(defaults.topics, ["Why this matters", "What to do next"]);
  assert.deepEqual(defaults.references, ["https://example.com/one", "https://example.com/two"]);
  assert.equal(defaults.includeTitleSlide, true);
  assert.equal(defaults.includeScript, false);
});

test("buildAiAuthoringPrompt includes selected requirements and schema", () => {
  const prompt = buildAiAuthoringPrompt({
    title: "Accessible AI",
    presenters: "Alice Example",
    durationMinutes: "30",
    audience: "Public sector teams",
    purpose: "Explain how to use AI responsibly",
    topics: "Why this matters\nPractical workflow",
    references: "https://example.com/one\nhttps://example.com/two",
    tone: "Credible and practical",
    callToAction: "Review current deck practices",
    includeTitleSlide: true,
    includeClosingSlide: true,
    includeNotes: true,
    includeResources: true,
    includeScript: true,
  });

  assert.equal(prompt.includes("- Title: Accessible AI"), true);
  assert.equal(prompt.includes("- Include `titleSlide: true` and `speakers`."), true);
  assert.equal(prompt.includes("Resources:"), true);
  assert.equal(prompt.includes("Script:"), true);
  assert.equal(prompt.includes("closingSlide: true"), true);
  assert.equal(prompt.includes("Do not prefix the presentation title with labels like `Presentation:`"), true);
  assert.equal(prompt.includes("Do not number slide headings unless the brief explicitly asks for numbered slides."), true);
  assert.equal(prompt.includes("Do not return a generic outline format with headings like `Key Points` or `The Script`."), true);
  assert.equal(prompt.includes("Carry the provided references forward into meaningful `Resources:` sections"), true);
});
