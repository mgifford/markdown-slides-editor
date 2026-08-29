import test from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown } from "../src/modules/markdown.js";

test("renderMarkdown returns empty html, headings, and stepCount for null input", () => {
  const result = renderMarkdown(null);
  assert.equal(result.html, "");
  assert.deepEqual(result.headings, []);
  assert.equal(result.stepCount, 0);
});

test("renderMarkdown returns empty html for empty string input", () => {
  const result = renderMarkdown("");
  assert.equal(result.html, "");
});

test("renderMarkdown escapes HTML entities in plain text", () => {
  const result = renderMarkdown('Hello & <world> "test"');
  assert.equal(result.html.includes("Hello &amp; &lt;world&gt; &quot;test&quot;"), true);
  assert.equal(result.html.includes("<p>"), true);
});

test("renderMarkdown renders paragraphs for plain text lines separated by blank lines", () => {
  const result = renderMarkdown("First paragraph\n\nSecond paragraph");
  assert.equal(result.html.includes("<p>First paragraph</p>"), true);
  assert.equal(result.html.includes("<p>Second paragraph</p>"), true);
});

test("renderMarkdown renders all six heading levels", () => {
  const result = renderMarkdown("# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6");
  assert.equal(result.html.includes("<h1>H1</h1>"), true);
  assert.equal(result.html.includes("<h2>H2</h2>"), true);
  assert.equal(result.html.includes("<h3>H3</h3>"), true);
  assert.equal(result.html.includes("<h4>H4</h4>"), true);
  assert.equal(result.html.includes("<h5>H5</h5>"), true);
  assert.equal(result.html.includes("<h6>H6</h6>"), true);
  assert.equal(result.headings.length, 6);
  assert.equal(result.headings[0].level, 1);
  assert.equal(result.headings[0].text, "H1");
  assert.equal(result.headings[5].level, 6);
});

test("renderMarkdown tracks headings in the returned headings array", () => {
  const result = renderMarkdown("# Title\n\n## Section");
  assert.equal(result.headings.length, 2);
  assert.equal(result.headings[0].text, "Title");
  assert.equal(result.headings[1].level, 2);
});

test("renderMarkdown escapes HTML entities in heading text", () => {
  const result = renderMarkdown("# Title with <special> & chars");
  assert.equal(result.html.includes("<h1>Title with &lt;special&gt; &amp; chars</h1>"), true);
  // The raw (unescaped) text is stored in the headings array.
  assert.equal(result.headings[0].text, "Title with <special> & chars");
});

test("renderMarkdown renders bold, italic, and inline code", () => {
  const result = renderMarkdown("**bold** *italic* `code`");
  assert.equal(result.html.includes("<strong>bold</strong>"), true);
  assert.equal(result.html.includes("<em>italic</em>"), true);
  assert.equal(result.html.includes("<code>code</code>"), true);
});

test("renderMarkdown renders inline links and images", () => {
  const result = renderMarkdown("[Link text](https://example.com)\n\n![Alt text](https://example.com/img.png)");
  assert.equal(result.html.includes('<a href="https://example.com">Link text</a>'), true);
  assert.equal(result.html.includes('<img src="https://example.com/img.png" alt="Alt text" />'), true);
});

test("renderMarkdown renders an unordered list", () => {
  const result = renderMarkdown("- Apple\n- Banana\n- Cherry");
  assert.equal(result.html.includes("<ul>"), true);
  assert.equal(result.html.includes("</ul>"), true);
  assert.equal(result.html.includes("<li>Apple</li>"), true);
  assert.equal(result.html.includes("<li>Cherry</li>"), true);
});

test("renderMarkdown flushes a list when a blank line separates it from the next block", () => {
  const result = renderMarkdown("- Item one\n- Item two\n\nParagraph after.");
  assert.equal(result.html.includes("<ul>"), true);
  assert.equal(result.html.includes("<p>Paragraph after.</p>"), true);
});

test("renderMarkdown renders separate ul and ol when list types change", () => {
  const result = renderMarkdown("- Unordered\n\n1. Ordered");
  assert.equal(result.html.includes("<ul>"), true);
  assert.equal(result.html.includes("<ol>"), true);
});

test("renderMarkdown renders the media-left directive with visual and body sections", () => {
  const result = renderMarkdown(
    "::media-left\n![Alt](https://example.com/img.jpg)\n---\nText beside the image.\n::",
  );
  assert.equal(result.html.includes('class="layout-media layout-media--left"'), true);
  assert.equal(result.html.includes('class="layout-media__visual"'), true);
  assert.equal(result.html.includes('class="layout-media__body"'), true);
});

test("renderMarkdown increments the mermaid counter for each separate mermaid block", () => {
  const result = renderMarkdown("::mermaid\ngraph A\n::\n\n::mermaid\ngraph B\n::");
  assert.equal(result.html.includes('data-mermaid-id="mermaid-1"'), true);
  assert.equal(result.html.includes('data-mermaid-id="mermaid-2"'), true);
});

test("renderMarkdown renders an empty mermaid block with a placeholder message", () => {
  const result = renderMarkdown("::mermaid\n::");
  assert.equal(result.html.includes("Mermaid diagram source is empty."), true);
});

test("renderMarkdown treats unknown directives as plain paragraph text", () => {
  const result = renderMarkdown("::unknown-directive\nContent line\n::");
  // ::unknown-directive is not a special directive, so it falls through to a paragraph.
  assert.equal(result.html.includes("::unknown-directive"), true);
  assert.equal(result.html.includes("<p>"), true);
});

test("renderMarkdown handles a single-line inline SVG", () => {
  const result = renderMarkdown(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>',
  );
  assert.equal(result.html.includes('class="layout-svg"'), true);
  assert.equal(result.html.includes("<svg"), true);
});

test("renderMarkdown renders an img tag inside ::svg as a figure", () => {
  const result = renderMarkdown(
    '::svg\n<img src="https://example.com/diagram.svg" alt="Architecture diagram">\n::',
  );
  assert.equal(result.html.includes('class="layout-svg"'), true);
  assert.equal(result.html.includes('<img src="https://example.com/diagram.svg"'), true);
  assert.equal(result.html.includes("&lt;img"), false);
});

test("renderMarkdown strips event handlers from img tag inside ::svg", () => {
  const result = renderMarkdown(
    '::svg\n<img src="https://example.com/diagram.svg" onerror="alert(1)" alt="Diagram">\n::',
  );
  assert.equal(result.html.includes('class="layout-svg"'), true);
  assert.equal(result.html.includes("onerror="), false);
  assert.equal(result.html.includes('<img src="https://example.com/diagram.svg"'), true);
});

test("renderMarkdown strips javascript: src from img tag inside ::svg", () => {
  const result = renderMarkdown('::svg\n<img src="javascript:alert(1)" alt="Bad">\n::');
  assert.equal(result.html.includes('class="layout-svg"'), true);
  assert.equal(result.html.includes("javascript:"), false);
  // The src attribute is dropped entirely when it holds a javascript: URL.
  assert.equal(result.html.includes("src="), false);
});

test("renderMarkdown strips data: src from img tag inside ::svg", () => {
  const result = renderMarkdown('::svg\n<img src="data:text/html,<script>alert(1)</script>" alt="Bad">\n::');
  assert.equal(result.html.includes('class="layout-svg"'), true);
  assert.equal(result.html.includes("data:"), false);
  assert.equal(result.html.includes("src="), false);
});

test("renderMarkdown allows relative and https src values in ::svg img tags", () => {
  const result = renderMarkdown('::svg\n<img src="./images/diagram.svg" alt="Diagram">\n::');
  assert.equal(result.html.includes('src="./images/diagram.svg"'), true);

  const result2 = renderMarkdown('::svg\n<img src="https://example.com/logo.svg" alt="Logo">\n::');
  assert.equal(result2.html.includes('src="https://example.com/logo.svg"'), true);
});

test("renderMarkdown renders column without explicit width", () => {
  const result = renderMarkdown("::column-left\nLeft content.\n::\n\n::column-right\nRight content.\n::");
  assert.equal(result.html.includes('class="layout-columns"'), true);
  assert.equal(result.html.includes("layout-columns__column--left"), true);
  assert.equal(result.html.includes("layout-columns__column--right"), true);
  // No inline style when width is omitted.
  assert.equal(result.html.includes("--column-basis"), false);
});

// --- Mathematics (LaTeX) recognition -----------------------------------------

test("renderMarkdown recognises inline $...$ math and preserves the source", () => {
  const result = renderMarkdown("The area is $A = \\pi r^2$ overall.");
  // A protected inline math node is emitted with the raw LaTeX source retained.
  assert.equal(result.html.includes('class="math-tex math-tex--inline"'), true);
  assert.equal(result.html.includes('data-math-source="A = \\pi r^2"'), true);
  // Surrounding prose is still rendered as a normal paragraph.
  assert.equal(result.html.includes("<p>The area is "), true);
  assert.equal(result.html.includes(" overall.</p>"), true);
  // The deck is flagged as containing math so the renderer can lazy-load MathJax.
  assert.equal(result.hasMath, true);
  assert.equal(result.mathCount, 1);
});

test("renderMarkdown wraps inline math in MathJax inline delimiters", () => {
  const result = renderMarkdown("Value $x^2$ here.");
  assert.equal(result.html.includes("\\(x^2\\)"), true);
});

test("renderMarkdown recognises $$...$$ display math on a single line", () => {
  const result = renderMarkdown("$$E = mc^2$$");
  assert.equal(result.html.includes('class="math-tex math-tex--display"'), true);
  assert.equal(result.html.includes('data-math-source="E = mc^2"'), true);
  assert.equal(result.html.includes("\\[E = mc^2\\]"), true);
  assert.equal(result.mathCount, 1);
});

test("renderMarkdown recognises multi-line $$...$$ display math", () => {
  const result = renderMarkdown("$$\n\\int_0^1 x\\,dx = \\frac{1}{2}\n$$");
  assert.equal(result.html.includes('class="math-tex math-tex--display"'), true);
  assert.equal(result.html.includes("\\int_0^1"), true);
  assert.equal(result.html.includes("\\frac{1}{2}"), true);
  assert.equal(result.mathCount, 1);
});

test("renderMarkdown protects math from inline markdown substitutions", () => {
  // Underscores and asterisks inside math must NOT become <em>/<strong>.
  const result = renderMarkdown("Indices $a_1 * b_2$ stay intact.");
  assert.equal(result.html.includes("<em>"), false);
  assert.equal(result.html.includes("<strong>"), false);
  assert.equal(result.html.includes('data-math-source="a_1 * b_2"'), true);
});

test("renderMarkdown escapes HTML-special characters inside math source", () => {
  const result = renderMarkdown("Compare $a < b$ now.");
  // The rendered LaTeX and the stored source both escape the angle bracket.
  assert.equal(result.html.includes('data-math-source="a &lt; b"'), true);
  assert.equal(result.html.includes("\\(a &lt; b\\)"), true);
});

test("renderMarkdown does not treat a lone dollar sign as math", () => {
  const result = renderMarkdown("It costs $5 today.");
  assert.equal(result.html.includes("math-tex"), false);
  assert.equal(result.hasMath, false);
  assert.equal(result.html.includes("It costs $5 today."), true);
});

test("renderMarkdown does not treat an escaped dollar sign as a delimiter", () => {
  const result = renderMarkdown("Price is \\$5 and \\$9.");
  assert.equal(result.html.includes("math-tex"), false);
  assert.equal(result.hasMath, false);
  // The escaped dollars render as literal dollar signs.
  assert.equal(result.html.includes("$5"), true);
  assert.equal(result.html.includes("$9"), true);
});

test("renderMarkdown counts multiple math expressions across a slide", () => {
  const result = renderMarkdown("Inline $a$ and $b$.\n\n$$c$$");
  assert.equal(result.mathCount, 3);
  assert.equal(result.hasMath, true);
});

test("renderMarkdown reports hasMath false when there is no math", () => {
  const result = renderMarkdown("# Plain slide\n\nJust text.");
  assert.equal(result.hasMath, false);
  assert.equal(result.mathCount, 0);
});

// --- Native LaTeX delimiters: \( ... \) and \[ ... \] ------------------------

test("renderMarkdown recognises native inline \\( ... \\) math", () => {
  const result = renderMarkdown("Energy \\( E = mc^2 \\) is famous.");
  assert.equal(result.html.includes('class="math-tex math-tex--inline"'), true);
  assert.equal(result.html.includes('data-math-source="E = mc^2"'), true);
  assert.equal(result.html.includes("\\(E = mc^2\\)"), true);
  assert.equal(result.hasMath, true);
  assert.equal(result.mathCount, 1);
});

test("renderMarkdown recognises native display \\[ ... \\] math on one line", () => {
  const result = renderMarkdown("\\[ E = mc^2 \\]");
  assert.equal(result.html.includes('class="math-tex math-tex--display"'), true);
  assert.equal(result.html.includes('data-math-source="E = mc^2"'), true);
  assert.equal(result.html.includes("\\[E = mc^2\\]"), true);
  assert.equal(result.mathCount, 1);
});

test("renderMarkdown recognises native display \\[ ... \\] across multiple lines", () => {
  const result = renderMarkdown("\\[\n\\psi^*(x)\\psi(x)\n\\]");
  assert.equal(result.html.includes('class="math-tex math-tex--display"'), true);
  // The asterisk inside must NOT become emphasis, and the source survives.
  assert.equal(result.html.includes("<em>"), false);
  assert.equal(result.html.includes('data-math-source="\\psi^*(x)\\psi(x)"'), true);
  assert.equal(result.mathCount, 1);
});

test("renderMarkdown recognises inline \\( ... \\) alongside prose emphasis", () => {
  const result = renderMarkdown("This is *emphasised* and \\( a_{i,j} \\) is math.");
  assert.equal(result.html.includes("<em>emphasised</em>"), true);
  assert.equal(result.html.includes('data-math-source="a_{i,j}"'), true);
});

// --- Math source must survive Markdown-significant characters -----------------

test("renderMarkdown preserves math containing markdown-significant characters", () => {
  const cases = [
    ["\\( a*b \\)", "a*b"],
    ["\\( a_b \\)", "a_b"],
    ["\\( \\#1 \\)", "\\#1"],
    ["\\( \\alpha \\)", "\\alpha"],
    ["\\( \\{x\\} \\)", "\\{x\\}"],
    ["\\( [0,1] \\)", "[0,1]"],
  ];
  for (const [input, source] of cases) {
    const result = renderMarkdown(input);
    assert.equal(
      result.html.includes(`data-math-source="${source}"`),
      true,
      `expected source ${source} preserved for ${input}`,
    );
    assert.equal(result.html.includes("<em>"), false, `no emphasis for ${input}`);
    assert.equal(result.html.includes("<strong>"), false, `no strong for ${input}`);
  }
});

test("renderMarkdown escapes ampersands, pipes and angle brackets in math source", () => {
  const result = renderMarkdown("\\[\n\\begin{matrix} a & b \\\\ c & d \\end{matrix}\n\\]");
  // Ampersands are HTML-escaped in both the stored source and the delimited output.
  assert.equal(result.html.includes("a &amp; b"), true);
  assert.equal(result.mathCount, 1);
});

test("renderMarkdown preserves a multi-line aligned environment", () => {
  const source = "\\[\n\\begin{aligned}\nx &= 1 \\\\\ny &= 2\n\\end{aligned}\n\\]";
  const result = renderMarkdown(source);
  assert.equal(result.html.includes('class="math-tex math-tex--display"'), true);
  assert.equal(result.html.includes("\\begin{aligned}"), true);
  assert.equal(result.html.includes("\\end{aligned}"), true);
  assert.equal(result.mathCount, 1);
});

// --- Currency must not be mistaken for single-dollar math ---------------------

test("renderMarkdown does not treat currency ranges as math", () => {
  const result = renderMarkdown("The cost increased from $50 to $100.");
  assert.equal(result.html.includes("math-tex"), false);
  assert.equal(result.hasMath, false);
  assert.equal(result.html.includes("from $50 to $100."), true);
});

test("renderMarkdown does not treat a single currency amount as math", () => {
  const result = renderMarkdown("It costs $50 today.");
  assert.equal(result.html.includes("math-tex"), false);
  assert.equal(result.hasMath, false);
});

test("renderMarkdown does not treat spaced dollar amounts as math", () => {
  // A $ followed by whitespace never opens inline math.
  const result = renderMarkdown("We paid $ 50 and $ 100 total.");
  assert.equal(result.html.includes("math-tex"), false);
  assert.equal(result.hasMath, false);
});

test("renderMarkdown still recognises genuine single-dollar math", () => {
  const result = renderMarkdown("The value $x^2 + y^2$ is positive.");
  assert.equal(result.html.includes('data-math-source="x^2 + y^2"'), true);
  assert.equal(result.hasMath, true);
});

// --- Code must never be rendered as mathematics ------------------------------

test("renderMarkdown keeps native math delimiters inside inline code as code", () => {
  const result = renderMarkdown("Use `\\( E = mc^2 \\)` to create inline math.");
  assert.equal(result.html.includes("<code>\\( E = mc^2 \\)</code>"), true);
  assert.equal(result.html.includes("math-tex"), false);
  assert.equal(result.hasMath, false);
});

test("renderMarkdown keeps dollar math inside inline code as code", () => {
  const result = renderMarkdown("Write `$x$` for inline math.");
  assert.equal(result.html.includes("<code>$x$</code>"), true);
  assert.equal(result.html.includes("math-tex"), false);
  assert.equal(result.hasMath, false);
});

test("renderMarkdown keeps a fenced code block of LaTeX as source, not math", () => {
  const result = renderMarkdown("```latex\n\\[\nE = mc^2\n\\]\n```");
  // The block is rendered as code, its LaTeX shown verbatim, and no math node.
  assert.equal(result.html.includes("<pre>"), true);
  assert.equal(result.html.includes("<code"), true);
  assert.equal(result.html.includes("math-tex"), false);
  assert.equal(result.hasMath, false);
  assert.equal(result.html.includes("E = mc^2"), true);
});
