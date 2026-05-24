import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseSource } from "../src/modules/parser.js";

const CUSTOM_DEMO_SOURCE = readFileSync(new URL("../deck.md", import.meta.url), "utf8");

test("custom demo deck demonstrates documented image-hero feature combinations", () => {
  const heroSlides = parseSource(CUSTOM_DEMO_SOURCE).slides
    .map((slide) => slide.body)
    .filter((body) => body.includes("::image-hero"));

  assert.ok(
    heroSlides.some((body) => body.includes("text-bottom-left logo-top-right")),
    "includes the default text/logo corner pairing from AUTHORING",
  );
  assert.ok(
    heroSlides.some((body) => body.includes("text-top-left logo-bottom-right")),
    "includes the opposite-corner hero pairing from AUTHORING",
  );
  assert.ok(
    heroSlides.some((body) => body.includes("text-bottom-right logo-top-left show-title show-subtitle")),
    "includes documented heading-visibility modifiers",
  );
  assert.ok(
    heroSlides.some((body) => body.includes("text-center") && body.includes("stay-3 transition-5 final-0.12")),
    "includes timed cinematic reveal modifiers with centered text",
  );
  assert.ok(
    heroSlides.some((body) => body.includes("Image-Only Pause") && !body.includes("\n---\n")),
    "includes image-only hero variant with optional sections omitted",
  );
  assert.ok(
    heroSlides.some((body) => body.includes("pan-") || body.includes("blur-") || body.includes("saturation-")),
    "includes documented pan/blur/saturation hero image treatments",
  );
});

test("custom demo deck demonstrates non-hero image wrapping options", () => {
  const mediaSlides = parseSource(CUSTOM_DEMO_SOURCE).slides
    .map((slide) => slide.body)
    .filter((body) => body.includes("::media-left") || body.includes("::media-right"));

  assert.ok(
    mediaSlides.some((body) => body.includes("::media-left") && body.includes("\n---\n")),
    "includes media-left example with image and wrapped supporting text",
  );
  assert.ok(
    mediaSlides.some((body) => body.includes("::media-right") && body.includes("\n---\n")),
    "includes media-right example with image and wrapped supporting text",
  );
});
