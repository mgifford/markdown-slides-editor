import test from "node:test";
import assert from "node:assert/strict";
import { updateFrontMatterValue, removeFrontMatterValue } from "../src/modules/source-format.js";

test("updateFrontMatterValue creates a front matter block when the source has none", () => {
  const result = updateFrontMatterValue("# Slide", "title", "My Deck");
  assert.equal(result.startsWith("---\ntitle: My Deck\n---\n"), true);
  assert.equal(result.includes("# Slide"), true);
});

test("updateFrontMatterValue appends a new key when it does not exist in front matter", () => {
  const source = "---\ntitle: Demo\n---\n\n# Slide";
  const result = updateFrontMatterValue(source, "theme", "night-slate");
  assert.equal(result.includes("theme: night-slate"), true);
  assert.equal(result.includes("title: Demo"), true);
  assert.equal(result.includes("# Slide"), true);
});

test("updateFrontMatterValue updates an existing key value", () => {
  const source = "---\ntitle: Demo\ntheme: night-slate\n---\n\n# Slide";
  const result = updateFrontMatterValue(source, "theme", "civic-bright");
  assert.equal(result.includes("theme: civic-bright"), true);
  assert.equal(result.includes("night-slate"), false);
});

test("updateFrontMatterValue trims the supplied value", () => {
  const source = "---\ntitle: Demo\n---\n\n# Slide";
  const result = updateFrontMatterValue(source, "lang", "  en  ");
  assert.equal(result.includes("lang: en"), true);
  assert.equal(result.includes("lang:   en"), false);
});

test("updateFrontMatterValue returns the normalized source unchanged when front matter has no closing marker", () => {
  const malformed = "---\ntitle: Demo\n# Slide";
  const result = updateFrontMatterValue(malformed, "lang", "en");
  assert.equal(result, malformed);
});

test("updateFrontMatterValue normalizes CRLF line endings", () => {
  const crlf = "---\r\ntitle: Demo\r\n---\r\n\r\n# Slide";
  const result = updateFrontMatterValue(crlf, "theme", "night-slate");
  assert.equal(result.includes("theme: night-slate"), true);
  assert.equal(result.includes("title: Demo"), true);
});

test("removeFrontMatterValue returns source unchanged when it has no front matter", () => {
  const source = "# Slide\n\nNo front matter here.";
  const result = removeFrontMatterValue(source, "theme");
  assert.equal(result, source);
});

test("removeFrontMatterValue removes the specified key from front matter", () => {
  const source = "---\ntitle: Demo\nthemeStylesheet: https://example.com/theme.css\n---\n\n# Slide";
  const result = removeFrontMatterValue(source, "themeStylesheet");
  assert.equal(result.includes("themeStylesheet"), false);
  assert.equal(result.includes("title: Demo"), true);
});

test("removeFrontMatterValue leaves front matter unchanged when the key is not present", () => {
  const source = "---\ntitle: Demo\n---\n\n# Slide";
  const result = removeFrontMatterValue(source, "nonExistentKey");
  assert.equal(result.includes("title: Demo"), true);
});

test("removeFrontMatterValue returns source unchanged when front matter has no closing marker", () => {
  const malformed = "---\ntitle: Demo\n# Slide";
  const result = removeFrontMatterValue(malformed, "title");
  assert.equal(result, malformed);
});
