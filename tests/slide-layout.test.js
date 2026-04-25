import test from "node:test";
import assert from "node:assert/strict";
import { buildSlideDimensionStyle, calculateSlideBodyScale, getSlideDimensions } from "../src/modules/slide-layout.js";

test("getSlideDimensions uses defaults and valid front matter overrides", () => {
  assert.deepEqual(getSlideDimensions({}), {
    width: 1280,
    height: 720,
    aspectRatio: 1280 / 720,
  });

  assert.deepEqual(getSlideDimensions({ slideWidth: "1024", slideHeight: "768" }), {
    width: 1024,
    height: 768,
    aspectRatio: 1024 / 768,
  });
});

test("calculateSlideBodyScale grows body text when the slide has spare space", () => {
  const result = calculateSlideBodyScale((scale) => ({
    overflow: false,
    fillRatio: 0.45 * scale,
  }));

  assert.equal(result.overflow, false);
  assert.equal(result.scale > 1, true);
});

test("calculateSlideBodyScale shrinks body text when the slide overflows", () => {
  const result = calculateSlideBodyScale((scale) => ({
    overflow: scale > 0.84,
    fillRatio: 1.05,
  }));

  assert.equal(result.overflow, false);
  assert.equal(result.scale < 1, true);
});

test("getSlideDimensions falls back to defaults for zero or negative dimension values", () => {
  assert.deepEqual(getSlideDimensions({ slideWidth: "0", slideHeight: "-1" }), {
    width: 1280,
    height: 720,
    aspectRatio: 1280 / 720,
  });
});

test("getSlideDimensions falls back to defaults for non-numeric dimension strings", () => {
  assert.deepEqual(getSlideDimensions({ slideWidth: "abc", slideHeight: "NaN" }), {
    width: 1280,
    height: 720,
    aspectRatio: 1280 / 720,
  });
});

test("buildSlideDimensionStyle returns CSS custom properties for default slide dimensions", () => {
  const style = buildSlideDimensionStyle({});
  assert.equal(style.includes("--slide-width-px:1280"), true);
  assert.equal(style.includes("--slide-height-px:720"), true);
  assert.equal(style.includes("--slide-aspect-ratio:"), true);
  assert.ok(style.endsWith(";"));
});

test("calculateSlideBodyScale stops at MIN_BODY_SCALE and reports overflow when content never fits", () => {
  const result = calculateSlideBodyScale((_scale) => ({
    overflow: true,
    fillRatio: 1.5,
  }));

  assert.equal(result.overflow, true);
  assert.equal(result.scale, 0.5);
});

test("buildSlideDimensionStyle uses custom dimensions from metadata", () => {
  const style = buildSlideDimensionStyle({ slideWidth: "1024", slideHeight: "768" });
  assert.equal(style.includes("--slide-width-px:1024"), true);
  assert.equal(style.includes("--slide-height-px:768"), true);
});

test("calculateSlideBodyScale stays at scale 1 when content already fills the target ratio", () => {
  const result = calculateSlideBodyScale(() => ({
    overflow: false,
    fillRatio: 0.82,
  }));

  assert.equal(result.overflow, false);
  assert.equal(result.scale, 1);
});
