import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import {
  getSlideIndexForSourceOffset,
  parseSource,
} from "../../src/modules/parser.js";

// ─── State shared across steps in a scenario ────────────────────────────────

let source = "";
let deck = null;

// ─── Givens ──────────────────────────────────────────────────────────────────

Given("a Markdown source with front matter and multiple slides", function () {
  source = `---
title: Demo
lang: en
---

# One

Body

Note:
Private note

Resources:
- [Reference](https://example.com)

Script:
Full script text.

---

# Two`;
});

Given(
  "the source contains front matter with title {string} and lang {string}",
  function (title, lang) {
    source = `---\ntitle: ${title}\nlang: ${lang}\n---\n\n# Slide one`;
  },
);

Given("the source contains two slides separated by {string}", function (_sep) {
  source = `---\ntitle: Test\n---\n\n# Slide One\n\n---\n\n# Slide Two`;
});

Given(
  "the source contains a slide with a {string} section containing {string}",
  function (section, content) {
    source = `---\ntitle: Demo\nlang: en\n---\n\n# One\n\nBody\n\n${section}\n${content}\n\n---\n\n# Two`;
  },
);

Given(
  "the source has {string} in front matter with title {string}",
  function (frontMatterLine, title) {
    source = `---\ntitle: ${title}\n${frontMatterLine}\n---\n\n# Slide one`;
  },
);

Given(
  "a source with three slides each containing unique headings",
  function () {
    source = `---\ntitle: Multi\ntitleSlide: true\n---\n\n# Slide A\n\n---\n\n# Slide B\n\n---\n\n# Slide C`;
  },
);

// ─── Whens ───────────────────────────────────────────────────────────────────

When("I parse the source", function () {
  deck = parseSource(source);
});

When(
  "I request the slide index for an offset inside the second slide",
  function () {
    deck = parseSource(source);
    // Find an offset that falls inside the second slide body ("# Slide B")
    const idx = source.indexOf("# Slide B");
    this.slideIndex = getSlideIndexForSourceOffset(source, idx + 5);
  },
);

// ─── Thens ───────────────────────────────────────────────────────────────────

Then("the deck metadata title is {string}", function (expected) {
  assert.equal(deck.metadata.title, expected);
});

Then("the deck metadata lang is {string}", function (expected) {
  assert.equal(deck.metadata.lang, expected);
});

Then("the deck has {int} slides", function (count) {
  assert.equal(deck.slides.length, count);
});

Then("the first slide notes is {string}", function (expected) {
  assert.equal(deck.slides[0].notes, expected);
});

Then("the first slide resources is {string}", function (expected) {
  assert.equal(deck.slides[0].resources, expected);
});

Then("the first slide script is {string}", function (expected) {
  assert.equal(deck.slides[0].script, expected);
});

Then("the first slide kind is {string}", function (expected) {
  assert.equal(deck.slides[0].kind, expected);
});

Then("the first slide title is {string}", function (expected) {
  assert.equal(deck.slides[0].title, expected);
});

Then("the slide index is {int}", function (expected) {
  assert.equal(this.slideIndex, expected);
});
