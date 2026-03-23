import test from "node:test";
import assert from "node:assert/strict";
import { calculateSlideBodyScale, getSlideDimensions } from "../src/modules/slide-layout.js";

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
