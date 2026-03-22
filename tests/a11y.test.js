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
