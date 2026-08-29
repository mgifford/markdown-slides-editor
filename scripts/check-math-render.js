// End-to-end math rendering check.
//
// Runs the real deck pipeline (parseSource -> renderDeck -> buildSnapshotHtml)
// on a deck that uses every supported math delimiter, and asserts that each
// produces a MathJax-ready `.math-tex` node while currency and code are left
// alone. This is the dependency-free guard that catches "the running app no
// longer recognises native \( \) / \[ \] math" — the failure a returning
// visitor hit when a stale service-worker cache served an older renderer.
//
// It exercises the same modules the browser loads, so a regression in
// recognition, protection, or the snapshot export fails `npm test` here rather
// than silently shipping.

import { parseSource } from "../src/modules/parser.js";
import { renderDeck } from "../src/modules/render.js";
import { buildSnapshotHtml } from "../src/modules/export.js";

const source = `---
title: Math render check
---

# Native delimiters

Inline \\( E = mc^2 \\) and display below.

\\[
\\psi^*(x)\\psi(x)
\\]

---

# Dollar and currency

Display $$a^2 + b^2 = c^2$$ and inline $x_1 + x_2$ work.

Currency such as $50 to $100 stays literal.

Use \`\\( x \\)\` for inline math.

\`\`\`latex
\\[ E = mc^2 \\]
\`\`\`
`;

const deck = renderDeck(parseSource(source));
const [mathSlide, mixedSlide] = deck.renderedSlides;
const snapshot = buildSnapshotHtml({
  title: "Math render check",
  cssText: "",
  renderedSlides: deck.renderedSlides,
  metadata: deck.metadata,
  source,
});

const checks = [
  {
    ok: mathSlide.hasMath === true,
    message: "Native-delimiter slide must be flagged as containing math.",
  },
  {
    ok: mathSlide.html.includes('class="math-tex math-tex--inline"')
      && mathSlide.html.includes('data-math-source="E = mc^2"'),
    message: "Inline \\( \\) math must render as a math node preserving its source.",
  },
  {
    ok: mathSlide.html.includes('class="math-tex math-tex--display"')
      && mathSlide.html.includes("\\psi^*(x)\\psi(x)")
      && !mathSlide.html.includes("<em>"),
    message: "Display \\[ \\] math must render as a block node without treating * as emphasis.",
  },
  {
    ok: mixedSlide.html.includes("\\[a^2 + b^2 = c^2\\]"),
    message: "Inline $$ ... $$ display math must render.",
  },
  {
    ok: mixedSlide.html.includes('data-math-source="x_1 + x_2"'),
    message: "Single-dollar inline math must render.",
  },
  {
    ok: mixedSlide.html.includes("$50 to $100") && !/\$50[\s\S]*math-tex/.test(mixedSlide.html),
    message: "Currency ($50 to $100) must stay literal, not become math.",
  },
  {
    ok: mixedSlide.html.includes("<code>\\( x \\)</code>"),
    message: "LaTeX inside inline code must stay code.",
  },
  {
    ok: mixedSlide.html.includes("language-latex") && mixedSlide.html.includes("E = mc^2"),
    message: "A fenced ```latex block must stay source, not be typeset.",
  },
  {
    ok: snapshot.includes('class="math-tex'),
    message: "Snapshot export must carry math nodes through to exported HTML.",
  },
];

const failures = checks.filter((check) => !check.ok);

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`FAIL: ${failure.message}`);
  }
  process.exit(1);
}

console.log(`Math render checks passed (${checks.length} assertions).`);
