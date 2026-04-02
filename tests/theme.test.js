import test from "node:test";
import assert from "node:assert/strict";
import {
  BUILT_IN_THEMES,
  buildDeckStyleAttribute,
  isValidThemeStylesheetUrl,
} from "../src/modules/theme.js";

test("BUILT_IN_THEMES is a non-empty array of objects each with an id and a label", () => {
  assert.ok(Array.isArray(BUILT_IN_THEMES));
  assert.ok(BUILT_IN_THEMES.length > 0);
  for (const theme of BUILT_IN_THEMES) {
    assert.equal(typeof theme.id, "string");
    assert.ok(theme.id.length > 0, `theme id should not be empty: ${theme.id}`);
    assert.equal(typeof theme.label, "string");
    assert.ok(theme.label.length > 0, `theme label should not be empty: ${theme.label}`);
  }
});

test("BUILT_IN_THEMES includes the default-high-contrast theme", () => {
  const found = BUILT_IN_THEMES.find((t) => t.id === "default-high-contrast");
  assert.ok(found, "default-high-contrast theme should be present");
});

test("isValidThemeStylesheetUrl returns true for http and https URLs", () => {
  assert.equal(isValidThemeStylesheetUrl("https://example.com/theme.css"), true);
  assert.equal(isValidThemeStylesheetUrl("http://example.com/theme.css"), true);
});

test("isValidThemeStylesheetUrl returns false for empty or falsy values", () => {
  assert.equal(isValidThemeStylesheetUrl(""), false);
  assert.equal(isValidThemeStylesheetUrl(null), false);
  assert.equal(isValidThemeStylesheetUrl(undefined), false);
});

test("isValidThemeStylesheetUrl returns false for non-http protocols", () => {
  assert.equal(isValidThemeStylesheetUrl("ftp://example.com/theme.css"), false);
  assert.equal(isValidThemeStylesheetUrl("file:///etc/passwd"), false);
  assert.equal(isValidThemeStylesheetUrl("data:text/css,body{}"), false);
});

test("isValidThemeStylesheetUrl returns false for javascript pseudo-URLs", () => {
  assert.equal(isValidThemeStylesheetUrl("javascript:alert('x')"), false);
});

test("isValidThemeStylesheetUrl returns false for non-URL strings", () => {
  assert.equal(isValidThemeStylesheetUrl("not-a-url"), false);
  assert.equal(isValidThemeStylesheetUrl("theme.css"), false);
});

test("buildDeckStyleAttribute returns a CSS custom property string with default slide dimensions", () => {
  const style = buildDeckStyleAttribute({});
  assert.equal(style.includes("--slide-width-px:1280"), true);
  assert.equal(style.includes("--slide-height-px:720"), true);
  assert.equal(style.includes("--slide-aspect-ratio:"), true);
  assert.ok(style.endsWith(";"));
});

test("buildDeckStyleAttribute uses custom slide dimensions from metadata", () => {
  const style = buildDeckStyleAttribute({ slideWidth: "1024", slideHeight: "768" });
  assert.equal(style.includes("--slide-width-px:1024"), true);
  assert.equal(style.includes("--slide-height-px:768"), true);
});
