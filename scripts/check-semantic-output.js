import { DEFAULT_SOURCE } from "../src/modules/storage.js";
import { parseSource } from "../src/modules/parser.js";
import { renderDeck } from "../src/modules/render.js";
import { buildSnapshotHtml } from "../src/modules/export.js";

const deck = renderDeck(parseSource(DEFAULT_SOURCE));
const html = buildSnapshotHtml({
  title: deck.metadata.title || "Snapshot",
  cssText: "",
  renderedSlides: deck.renderedSlides,
  metadata: deck.metadata,
  source: DEFAULT_SOURCE,
});

const checks = [
  {
    ok: html.includes("<main class=\"presentation-shell\""),
    message: "Snapshot export must include a main landmark.",
  },
  {
    ok: /<section class="slide/.test(html),
    message: "Snapshot export must render slides as section elements.",
  },
  {
    ok: !/<table[\s>]/i.test(html),
    message: "Snapshot export must not include table markup in the default deck.",
  },
  {
    ok: !/<div class="slide"/.test(html),
    message: "Snapshot export should not render slides as generic div containers.",
  },
  {
    ok: /<nav class="snapshot-controls"/.test(html),
    message: "Snapshot export must include navigation controls.",
  },
];

const failures = checks.filter((check) => !check.ok);

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`FAIL: ${failure.message}`);
  }
  process.exit(1);
}

console.log("Semantic export checks passed.");
