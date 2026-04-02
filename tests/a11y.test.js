import test from "node:test";
import assert from "node:assert/strict";

import { assessSlideDensity, lintDeck } from "../src/modules/a11y.js";

test("assessSlideDensity marks moderate slides as full before they become dense", () => {
  const density = assessSlideDensity({
    body: `A short introduction paragraph that is still getting a little long for a typical slide.\n\n- One point\n- Two point\n- Three point\n- Four point\n- Five point`,
  });

  assert.equal(density.level, "full");
  assert.equal(density.label, "Full");
});

test("assessSlideDensity marks overloaded slides as dense", () => {
  const density = assessSlideDensity({
    body: `This slide has a lot of text and keeps going to the point where it really should be split across more than one slide for audience readability and comfort.\n\nAnother paragraph adds even more explanatory copy that would be better suited to speaker notes or a script.\n\n- Point one\n- Point two\n- Point three\n- Point four\n- Point five\n- Point six\n- Point seven`,
  });

  assert.equal(density.level, "dense");
  assert.equal(density.label, "Dense");
});

test("lintDeck keeps using dense density as the layout warning threshold", () => {
  const deck = {
    slides: [
      {
        body: `This slide has a lot of text and keeps going to the point where it really should be split across more than one slide for audience readability and comfort.\n\nAnother paragraph adds even more explanatory copy that would be better suited to speaker notes or a script.\n\n- Point one\n- Point two\n- Point three\n- Point four\n- Point five\n- Point six\n- Point seven`,
        notes: "Speaker notes",
      },
    ],
  };

  const renderedSlides = [
    {
      headings: [{ level: 1, text: "Dense slide" }],
      html: "<h1>Dense slide</h1><p>Visible text</p>",
    },
  ];

  const issues = lintDeck(deck, renderedSlides);

  assert.equal(issues.some((issue) => issue.category === "layout" && issue.level === "warning"), true);
});

test("assessSlideDensity marks a sparse slide as comfortable", () => {
  const density = assessSlideDensity({ body: "# Title\n\nShort description." });
  assert.equal(density.level, "comfortable");
  assert.equal(density.label, "");
});

test("assessSlideDensity returns numeric word, bullet, and paragraph counts", () => {
  const density = assessSlideDensity({ body: "# Title\n\n- A bullet\n- Another bullet" });
  assert.equal(typeof density.wordCount, "number");
  assert.equal(typeof density.bulletCount, "number");
  assert.equal(typeof density.paragraphCount, "number");
});

test("lintDeck reports an error when a slide has no H1 heading", () => {
  const deck = { slides: [{ notes: "Has notes" }] };
  const renderedSlides = [{ headings: [{ level: 2, text: "Subtitle" }], html: "<h2>Subtitle</h2>" }];
  const issues = lintDeck(deck, renderedSlides);
  assert.equal(issues.some((i) => i.level === "error" && i.message.includes("exactly one H1")), true);
});

test("lintDeck reports an error when a slide has more than one H1 heading", () => {
  const deck = { slides: [{ notes: "Has notes" }] };
  const renderedSlides = [
    {
      headings: [{ level: 1, text: "Title A" }, { level: 1, text: "Title B" }],
      html: "<h1>Title A</h1><h1>Title B</h1>",
    },
  ];
  const issues = lintDeck(deck, renderedSlides);
  assert.equal(issues.some((i) => i.level === "error" && i.message.includes("exactly one H1")), true);
});

test("lintDeck reports an error when heading levels are skipped", () => {
  const deck = { slides: [{ notes: "Has notes" }] };
  const renderedSlides = [
    {
      headings: [{ level: 1, text: "Title" }, { level: 3, text: "Sub" }],
      html: "<h1>Title</h1><h3>Sub</h3>",
    },
  ];
  const issues = lintDeck(deck, renderedSlides);
  assert.equal(issues.some((i) => i.level === "error" && i.message.includes("skips heading levels")), true);
});

test("lintDeck reports an info issue when a slide has no speaker notes", () => {
  const deck = { slides: [{ notes: "" }] };
  const renderedSlides = [{ headings: [{ level: 1, text: "Title" }], html: "<h1>Title</h1>" }];
  const issues = lintDeck(deck, renderedSlides);
  assert.equal(issues.some((i) => i.level === "info" && i.message.includes("no speaker notes")), true);
});

test("lintDeck includes the slide number in each issue", () => {
  const deck = { slides: [{ notes: "" }] };
  const renderedSlides = [{ headings: [{ level: 1, text: "Title" }], html: "<h1>Title</h1>" }];
  const issues = lintDeck(deck, renderedSlides);
  for (const issue of issues) {
    assert.equal(typeof issue.slide, "number");
    assert.equal(issue.slide, 1);
  }
});
