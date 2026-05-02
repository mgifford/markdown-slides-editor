import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { assessSlideDensity, lintDeck } from "../../src/modules/a11y.js";

// ─── Shared state ─────────────────────────────────────────────────────────────

let deck = null;
let renderedSlides = null;
let issues = null;
let densityResult = null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDeck(slides) {
  return { slides };
}

function makeRenderedSlide({ headings = [], html = "" } = {}) {
  return { headings, html };
}

// ─── Givens ───────────────────────────────────────────────────────────────────

Given(
  "a rendered slide with exactly one H1 heading {string}",
  function (heading) {
    deck = makeDeck([{ notes: "Some notes" }]);
    renderedSlides = [
      makeRenderedSlide({
        headings: [{ level: 1, text: heading }],
        html: `<h1>${heading}</h1>`,
      }),
    ];
  },
);

Given("a rendered slide with no H1 heading", function () {
  deck = makeDeck([{ notes: "Some notes" }]);
  renderedSlides = [
    makeRenderedSlide({
      headings: [],
      html: "<p>No heading here</p>",
    }),
  ];
});

Given("a rendered slide with two H1 headings", function () {
  deck = makeDeck([{ notes: "Some notes" }]);
  renderedSlides = [
    makeRenderedSlide({
      headings: [
        { level: 1, text: "First" },
        { level: 1, text: "Second" },
      ],
      html: "<h1>First</h1><h1>Second</h1>",
    }),
  ];
});

Given("a rendered slide with a link labelled {string}", function (label) {
  deck = makeDeck([{ notes: "Some notes", body: "" }]);
  renderedSlides = [
    makeRenderedSlide({
      headings: [{ level: 1, text: "Links" }],
      html: `<h1>Links</h1><p><a href="https://example.com">${label}</a></p>`,
    }),
  ];
});

Given("a content slide with no speaker notes", function () {
  deck = makeDeck([{ notes: "", body: "Short body." }]);
  renderedSlides = [
    makeRenderedSlide({
      headings: [{ level: 1, text: "Slide" }],
      html: "<h1>Slide</h1><p>Short body.</p>",
    }),
  ];
});

Given("a slide body with more than 90 words and more than 6 bullets", function () {
  const bullets = Array.from({ length: 7 }, (_, i) => `- Bullet point ${i + 1} with some extra words to fill the count`).join("\n");
  const body = `A paragraph that adds many words to push past the ninety word threshold for the density check. Adding more words here. And here. And here. And here again.\n\n${bullets}`;
  deck = makeDeck([{ notes: "Some notes", body }]);
  renderedSlides = [
    makeRenderedSlide({
      headings: [{ level: 1, text: "Dense slide" }],
      html: "<h1>Dense slide</h1><p>Lots of content</p>",
    }),
  ];
  densityResult = assessSlideDensity(deck.slides[0]);
});

Given("a slide body with only a short paragraph", function () {
  const body = "One concise idea.";
  deck = makeDeck([{ notes: "Some notes", body }]);
  renderedSlides = [
    makeRenderedSlide({
      headings: [{ level: 1, text: "Simple slide" }],
      html: "<h1>Simple slide</h1><p>One concise idea.</p>",
    }),
  ];
  densityResult = assessSlideDensity(deck.slides[0]);
});

Given(
  "a rendered slide containing an img element with no alt attribute",
  function () {
    deck = makeDeck([{ notes: "Some notes", body: "" }]);
    renderedSlides = [
      makeRenderedSlide({
        headings: [{ level: 1, text: "Image slide" }],
        html: `<h1>Image slide</h1><img alt="" src="photo.jpg">`,
      }),
    ];
  },
);

// ─── Whens ────────────────────────────────────────────────────────────────────

When("I lint the deck", function () {
  issues = lintDeck(deck, renderedSlides);
});

// ─── Thens ────────────────────────────────────────────────────────────────────

Then("there are no heading errors for that slide", function () {
  const headingErrors = issues.filter(
    (i) => i.level === "error" && i.message.includes("H1"),
  );
  assert.equal(headingErrors.length, 0);
});

Then("there is a heading error for that slide", function () {
  const headingErrors = issues.filter(
    (i) => i.level === "error" && i.message.includes("H1"),
  );
  assert.ok(headingErrors.length > 0, "Expected a heading error but found none");
});

Then("there is a generic-link warning for that slide", function () {
  const linkWarnings = issues.filter(
    (i) => i.level === "warning" && i.message.includes("non-descriptive link"),
  );
  assert.ok(linkWarnings.length > 0, "Expected a generic-link warning but found none");
});

Then("there are no generic-link warnings for that slide", function () {
  const linkWarnings = issues.filter(
    (i) => i.level === "warning" && i.message.includes("non-descriptive link"),
  );
  assert.equal(linkWarnings.length, 0);
});

Then("there is a missing-notes info notice for that slide", function () {
  const noticeIssues = issues.filter(
    (i) => i.level === "info" && i.message.includes("speaker notes"),
  );
  assert.ok(noticeIssues.length > 0, "Expected a missing-notes info notice but found none");
});

Then("there is a layout warning for that slide", function () {
  const layoutWarnings = issues.filter(
    (i) => i.level === "warning" && i.category === "layout",
  );
  assert.ok(layoutWarnings.length > 0, "Expected a layout warning but found none");
});

Then("there are no layout warnings for that slide", function () {
  const layoutWarnings = issues.filter(
    (i) => i.level === "warning" && i.category === "layout",
  );
  assert.equal(layoutWarnings.length, 0);
});

Then("there is a missing-alt error for that slide", function () {
  const altErrors = issues.filter(
    (i) => i.level === "error" && i.message.includes("alt text"),
  );
  assert.ok(altErrors.length > 0, "Expected a missing-alt error but found none");
});
