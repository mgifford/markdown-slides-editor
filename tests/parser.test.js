import test from "node:test";
import assert from "node:assert/strict";
import { parseSource } from "../src/modules/parser.js";
import { renderMarkdown } from "../src/modules/markdown.js";
import { renderDeck } from "../src/modules/render.js";
import { removeFrontMatterValue, updateFrontMatterValue } from "../src/modules/source-format.js";
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

test("renderMarkdown supports ordered lists and progressive disclosure markers", () => {
  const rendered = renderMarkdown(`# Slide

1. First item
2. [>] Reveal item`);

  assert.equal(rendered.html.includes("<ol>"), true);
  assert.equal(rendered.html.includes('class="next"'), true);
  assert.equal(rendered.stepCount, 1);
});

test("updateFrontMatterValue adds and updates theme metadata", () => {
  const base = "# Slide";
  const withTheme = updateFrontMatterValue(base, "theme", "night-slate");
  assert.equal(withTheme.includes("theme: night-slate"), true);

  const updated = updateFrontMatterValue(withTheme, "theme", "civic-bright");
  assert.equal(updated.includes("theme: civic-bright"), true);
});

test("removeFrontMatterValue removes optional theme stylesheet metadata", () => {
  const source = `---
title: Demo
themeStylesheet: https://example.com/theme.css
---

# Slide`;

  const updated = removeFrontMatterValue(source, "themeStylesheet");
  assert.equal(updated.includes("themeStylesheet"), false);
});
