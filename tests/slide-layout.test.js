import test from "node:test";
import assert from "node:assert/strict";
import { getSlideDimensions } from "../src/modules/slide-layout.js";

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
