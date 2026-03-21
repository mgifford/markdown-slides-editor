import test from "node:test";
import assert from "node:assert/strict";
import { parseSource } from "../src/modules/parser.js";
import { renderDeck } from "../src/modules/render.js";
import { lintDeck } from "../src/modules/a11y.js";

test("parseSource extracts front matter, slides, and notes", () => {
  const source = `---
title: Demo
lang: en
---

# One

Body

Note:
Private note

---

# Two`;

  const deck = parseSource(source);
  assert.equal(deck.metadata.title, "Demo");
  assert.equal(deck.slides.length, 2);
  assert.equal(deck.slides[0].notes, "Private note");
});

test("lintDeck flags missing alt text and generic links", () => {
  const source = `# Slide

[click here](https://example.com)

![](https://example.com/image.png)`;

  const deck = parseSource(source);
  const rendered = renderDeck(deck);
  const issues = lintDeck(deck, rendered.renderedSlides);
  assert.equal(issues.some((issue) => issue.message.includes("non-descriptive link")), true);
  assert.equal(issues.some((issue) => issue.message.includes("without alt text")), true);
});
