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

test("renderMarkdown renders column without explicit width", () => {
  const result = renderMarkdown("::column-left\nLeft content.\n::\n\n::column-right\nRight content.\n::");
  assert.equal(result.html.includes('class="layout-columns"'), true);
  assert.equal(result.html.includes("layout-columns__column--left"), true);
  assert.equal(result.html.includes("layout-columns__column--right"), true);
  // No inline style when width is omitted.
  assert.equal(result.html.includes("--column-basis"), false);
});
