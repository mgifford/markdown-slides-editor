import test from "node:test";
import assert from "node:assert/strict";
import {
  BUILT_IN_THEMES,
  buildDeckStyleAttribute,
  buildDeckColorStyle,
  COLOR_TOKENS,
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

test("COLOR_TOKENS is a non-empty array of objects with key and cssVar", () => {
  assert.ok(Array.isArray(COLOR_TOKENS));
  assert.ok(COLOR_TOKENS.length > 0);
  for (const token of COLOR_TOKENS) {
    assert.equal(typeof token.key, "string");
    assert.ok(token.key.startsWith("color"), `token key should start with 'color': ${token.key}`);
    assert.equal(typeof token.cssVar, "string");
    assert.ok(token.cssVar.startsWith("--"), `token cssVar should start with '--': ${token.cssVar}`);
  }
});

test("COLOR_TOKENS includes expected tokens for accent, canvas, ink, h1, and h2", () => {
  const keys = COLOR_TOKENS.map((t) => t.key);
  assert.ok(keys.includes("colorAccent"), "should include colorAccent");
  assert.ok(keys.includes("colorCanvas"), "should include colorCanvas");
  assert.ok(keys.includes("colorInk"), "should include colorInk");
  assert.ok(keys.includes("colorH1"), "should include colorH1");
  assert.ok(keys.includes("colorH2"), "should include colorH2");
});

test("buildDeckColorStyle returns empty string when no color keys are in metadata", () => {
  assert.equal(buildDeckColorStyle({}), "");
  assert.equal(buildDeckColorStyle({ title: "My Deck", theme: "night-slate" }), "");
});

test("buildDeckColorStyle emits a :root block for base color keys", () => {
  const css = buildDeckColorStyle({ colorAccent: "#d83933" });
  assert.ok(css.includes(":root {"), "should open a :root block");
  assert.ok(css.includes("--accent: #d83933;"), "should set --accent");
  assert.ok(!css.includes("data-color-mode"), "should not scope to light/dark mode");
});

test("buildDeckColorStyle emits mode-scoped blocks for Light and Dark variants", () => {
  const css = buildDeckColorStyle({
    colorAccentLight: "#d83933",
    colorAccentDark: "#f4908a",
  });
  assert.ok(css.includes('[data-color-mode="light"]'), "should include light mode scope");
  assert.ok(css.includes('[data-color-mode="dark"]'), "should include dark mode scope");
  assert.ok(css.includes("--accent: #d83933;"), "should set light accent");
  assert.ok(css.includes("--accent: #f4908a;"), "should set dark accent");
});

test("buildDeckColorStyle supports H1 and H2 color tokens", () => {
  const css = buildDeckColorStyle({ colorH1: "#162e51", colorH2: "#4a4a4a" });
  assert.ok(css.includes("--slide-h1-color: #162e51;"), "should set h1 color var");
  assert.ok(css.includes("--slide-h2-color: #4a4a4a;"), "should set h2 color var");
});

test("buildDeckColorStyle mixes base and mode-specific variants", () => {
  const css = buildDeckColorStyle({
    colorAccent: "#333",
    colorH1Light: "#162e51",
    colorH1Dark: "#91d5ff",
  });
  assert.ok(css.includes(":root {"), "should have root block for colorAccent");
  assert.ok(css.includes("--accent: #333;"), "should set base accent");
  assert.ok(css.includes('[data-color-mode="light"]'), "should have light block");
  assert.ok(css.includes("--slide-h1-color: #162e51;"), "should set light h1");
  assert.ok(css.includes('[data-color-mode="dark"]'), "should have dark block");
  assert.ok(css.includes("--slide-h1-color: #91d5ff;"), "should set dark h1");
});

test("buildDeckColorStyle sanitizes values containing semicolons", () => {
  const css = buildDeckColorStyle({ colorAccent: "red; --ink: blue" });
  assert.equal(css, "", "should reject values with semicolons");
});

test("buildDeckColorStyle sanitizes values containing curly braces", () => {
  const css = buildDeckColorStyle({ colorAccent: "red} body{color:red" });
  assert.equal(css, "", "should reject values with braces");
});

test("buildDeckColorStyle sanitizes values containing angle brackets", () => {
  const css = buildDeckColorStyle({ colorAccent: "<script>alert(1)</script>" });
  assert.equal(css, "", "should reject values with angle brackets");
});

test("buildDeckColorStyle accepts hex, named, rgb, and hsl color values", () => {
  const css = buildDeckColorStyle({
    colorAccent: "#d83933",
    colorCanvas: "white",
    colorInk: "rgb(16, 37, 66)",
    colorH1: "hsl(220, 60%, 30%)",
  });
  assert.ok(css.includes("--accent: #d83933;"));
  assert.ok(css.includes("--bg: white;"));
  assert.ok(css.includes("--ink: rgb(16, 37, 66);"));
  assert.ok(css.includes("--slide-h1-color: hsl(220, 60%, 30%);"));
});
