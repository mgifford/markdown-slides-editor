import test from "node:test";
import assert from "node:assert/strict";
import { getSlideIndexForSourceOffset, getSourceOffsetForSlideIndex, parseSource } from "../src/modules/parser.js";
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

Resources:
- [Reference](https://example.com)

Script:
Full script text.

---

# Two`;

  const deck = parseSource(source);
  assert.equal(deck.metadata.title, "Demo");
  assert.equal(deck.slides.length, 2);
  assert.equal(deck.slides[0].notes, "Private note");
  assert.equal(deck.slides[0].resources, "- [Reference](https://example.com)");
  assert.equal(deck.slides[0].script, "Full script text.");
});

test("parseSource prepends an optional title slide from front matter", () => {
  const source = `---
title: Demo deck
titleSlide: true
subtitle: Better presentations
date: 2026-03-22
location: Toronto
speakers: Alice Example; Bob Example
---

# Slide one`;

  const deck = parseSource(source);
  assert.equal(deck.slides.length, 2);
  assert.equal(deck.slides[0].kind, "title");
  assert.equal(deck.slides[0].title, "Demo deck");
  assert.equal(deck.slides[0].speakers, "Alice Example; Bob Example");
});

test("getSlideIndexForSourceOffset maps source positions to rendered slide indexes", () => {
  const source = `---
title: Demo deck
titleSlide: true
---

# Slide one

Body

---

# Slide two

More body
`;

  assert.equal(getSlideIndexForSourceOffset(source, source.indexOf("# Slide one")), 1);
  assert.equal(getSlideIndexForSourceOffset(source, source.indexOf("# Slide two")), 2);
  assert.equal(getSlideIndexForSourceOffset(source, source.length), 2);
});

test("getSourceOffsetForSlideIndex maps rendered slides back to heading lines", () => {
  const source = `---
title: Demo deck
titleSlide: true
---


# Slide one

Body

---

### Slide two heading

More body
`;

  const deck = parseSource(source);
  const firstSlideOffset = getSourceOffsetForSlideIndex(source, 1, deck);
  const secondSlideOffset = getSourceOffsetForSlideIndex(source, 2, deck);

  assert.equal(firstSlideOffset, source.indexOf("# Slide one"));
  assert.equal(secondSlideOffset, source.indexOf("### Slide two heading"));
});

test("source/slide mapping remains stable for round-trip navigation", () => {
  const source = `---
title: Demo deck
titleSlide: true
---

# Slide one

Body one

---

# Slide two

Body two

---

# Slide three

Body three
`;

  const deck = parseSource(source);

  for (let slideIndex = 1; slideIndex <= 3; slideIndex += 1) {
    const offset = getSourceOffsetForSlideIndex(source, slideIndex, deck);
    assert.equal(getSlideIndexForSourceOffset(source, offset), slideIndex);
  }
});

test("getSourceOffsetForSlideIndex handles CRLF source and generated slides", () => {
  const source = `---\r
title: Demo deck\r
titleSlide: true\r
closingSlide: true\r
---\r
\r
# Slide one\r
\r
Body\r
`;

  const deck = parseSource(source);
  assert.equal(getSourceOffsetForSlideIndex(source, 0, deck), 0);
  assert.equal(getSourceOffsetForSlideIndex(source, 1, deck), source.indexOf("# Slide one"));
  assert.equal(getSourceOffsetForSlideIndex(source, 2, deck), 0);
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

test("lintDeck warns when visible slide copy is too dense", () => {
  const source = `# Dense slide

- Point one with explanatory text that keeps going for the audience.
- Point two with explanatory text that keeps going for the audience.
- Point three with explanatory text that keeps going for the audience.
- Point four with explanatory text that keeps going for the audience.
- Point five with explanatory text that keeps going for the audience.
- Point six with explanatory text that keeps going for the audience.
- Point seven with explanatory text that keeps going for the audience.

Note:
Speaker notes.`;

  const deck = parseSource(source);
  const rendered = renderDeck(deck);
  const issues = lintDeck(deck, rendered.renderedSlides);
  assert.equal(issues.some((issue) => issue.category === "layout"), true);
});

test("renderMarkdown supports ordered lists and progressive disclosure markers", () => {
  const rendered = renderMarkdown(`# Slide

1. First item
2. [>] Reveal item`);

  assert.equal(rendered.html.includes("<ol>"), true);
  assert.equal(rendered.html.includes('class="next"'), true);
  assert.equal(rendered.stepCount, 1);
});

test("renderMarkdown renders nested unordered lists up to three levels deep", () => {
  const rendered = renderMarkdown(`# Slide

- Platforms define:
  - Who gets access
  - What is permitted
    - Sub-point
  - How decisions are enforced
- Most of this logic is hidden`);

  assert.equal(rendered.html.includes("<ul>"), true);
  assert.equal(rendered.html.includes("Platforms define:"), true);
  assert.equal(rendered.html.includes("Who gets access"), true);
  assert.equal(rendered.html.includes("Sub-point"), true);
  assert.equal(rendered.html.includes("Most of this logic is hidden"), true);
  // Nested ul should be inside a parent li, not adjacent to it
  assert.equal(rendered.html.includes("Platforms define:<ul>"), true);
  // Level 2 item that has children should contain a nested ul
  assert.equal(rendered.html.includes("What is permitted<ul>"), true);
  // Third-level item should appear inside a doubly-nested ul
  assert.equal(rendered.html.includes("<ul><li>Sub-point</li></ul>"), true);
});

test("renderMarkdown supports centered blocks, columns, media, callouts, quotes, mermaid, and svg wrappers", () => {
  const rendered = renderMarkdown(`# Slide

::center
![Alt text](https://example.com/image.jpg)
::

::svg
![Architecture diagram](https://example.com/diagram.svg)
::

::mermaid
flowchart LR
  A[Author] --> B[Deck]
::

::column-left-75%
- Left bullet
::

::column-right-300px
Right column text.
::

::media-right
![Alt text](https://example.com/media.jpg)
---
Text beside the image.
::

::callout
Important point.
::

::quote
Memorable quote.
::`);

  assert.equal(rendered.html.includes('class="layout-center"'), true);
  assert.equal(rendered.html.includes('class="layout-columns"'), true);
  assert.equal(rendered.html.includes('class="layout-media layout-media--right"'), true);
  assert.equal(rendered.html.includes('class="layout-callout"'), true);
  assert.equal(rendered.html.includes('class="layout-quote"'), true);
  assert.equal(rendered.html.includes('class="layout-svg"'), true);
  assert.equal(rendered.html.includes('class="layout-mermaid"'), true);
  assert.equal(rendered.html.includes('data-mermaid-id="mermaid-1"'), true);
  assert.equal(rendered.html.includes("--column-basis:75%"), true);
  assert.equal(rendered.html.includes("--column-basis:300px"), true);
});

test("renderMarkdown renders inline svg blocks directly without escaping markup", () => {
  const rendered = renderMarkdown(`# Slide

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">
  <rect width="10" height="10" fill="red" />
</svg>`);

  assert.equal(rendered.html.includes('class="layout-svg"'), true);
  assert.equal(rendered.html.includes("<svg xmlns=\"http://www.w3.org/2000/svg\""), true);
  assert.equal(rendered.html.includes("&lt;svg"), false);
});

test("renderMarkdown strips risky script and event handler attributes from inline svg", () => {
  const rendered = renderMarkdown(`::svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" onload="alert('x')">
  <script>alert('x')</script>
  <a href="javascript:alert('x')"><text y="8">Bad link</text></a>
</svg>
::`);

  assert.equal(rendered.html.includes("<script"), false);
  assert.equal(rendered.html.includes("onload="), false);
  assert.equal(rendered.html.includes("javascript:"), false);
});

test("renderDeck renders title-slide metadata into semantic HTML", () => {
  const source = `---
title: Demo deck
titleSlide: true
subtitle: Better presentations
date: 2026-03-22
location: Toronto
speakers: Alice Example; Bob Example
---

# Slide one`;

  const deck = parseSource(source);
  const rendered = renderDeck(deck);
  assert.equal(rendered.renderedSlides[0].html.includes("<h1>Demo deck</h1>"), true);
  assert.equal(rendered.renderedSlides[0].html.includes("<dt>Date</dt>"), true);
  assert.equal(rendered.renderedSlides[0].html.includes("<dt>Speakers</dt>"), true);
  assert.equal(rendered.renderedSlides[0].html.includes("<ul class=\"title-slide__speakers\">"), true);
});

test("renderDeck renders resources and script sections for presenter support", () => {
  const source = `# Slide

Visible content.

Note:
Speaker notes.

Resources:
- [Reference](https://example.com)

Script:
Full script text.`;

  const deck = parseSource(source);
  const rendered = renderDeck(deck);
  assert.equal(rendered.renderedSlides[0].resourcesHtml.includes("<a href=\"https://example.com\">Reference</a>"), true);
  assert.equal(rendered.renderedSlides[0].scriptHtml.includes("<p>Full script text.</p>"), true);
});

test("parseSource appends an optional closing slide from front matter", () => {
  const source = `---
title: Demo deck
closingSlide: true
closingTitle: Questions?
closingPrompt: Thanks for listening.
contactEmail: hello@example.com
contactUrl: https://example.com
socialLinks: Mastodon @example; Bluesky @example.com
presentationUrl: https://ox.ca/demo-deck
---

# Slide one`;

  const deck = parseSource(source);
  assert.equal(deck.slides.length, 2);
  assert.equal(deck.slides[1].kind, "closing");
  assert.equal(deck.slides[1].presentationUrl, "https://ox.ca/demo-deck");
});

test("renderDeck renders a closing slide with contact details and qr code", () => {
  const source = `---
title: Demo deck
closingSlide: true
closingTitle: Questions?
contactEmail: hello@example.com
contactUrl: https://example.com
socialLinks: Mastodon @example; Bluesky @example.com
presentationUrl: https://ox.ca/demo-deck
---

# Slide one`;

  const deck = parseSource(source);
  const rendered = renderDeck(deck);
  const closingSlide = rendered.renderedSlides[1];
  assert.equal(closingSlide.html.includes("<h1>Questions?</h1>"), true);
  assert.equal(closingSlide.html.includes("mailto:hello@example.com"), true);
  assert.equal(closingSlide.html.includes("api.qrserver.com"), true);
});

test("renderDeck can show the presentation qr code on the title slide", () => {
  const source = `---
title: Demo deck
titleSlide: true
titleSlideQr: true
presentationUrl: https://ox.ca/demo-deck
---

# Slide one`;

  const deck = parseSource(source);
  const rendered = renderDeck(deck);
  assert.equal(rendered.renderedSlides[0].html.includes("api.qrserver.com"), true);
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

test("parseSource normalizes Language full name to lang ISO code", () => {
  const source = `---
title: Demo
Language: French
---

# Slide one`;

  const deck = parseSource(source);
  assert.equal(deck.metadata.lang, "fr");
  assert.equal(deck.metadata.Language, undefined);
});

test("parseSource normalizes Language ISO code passthrough", () => {
  const source = `---
title: Demo
Language: es
---

# Slide one`;

  const deck = parseSource(source);
  assert.equal(deck.metadata.lang, "es");
  assert.equal(deck.metadata.Language, undefined);
});

test("parseSource uses explicit lang when both lang and Language are present", () => {
  const source = `---
title: Demo
lang: de
Language: French
---

# Slide one`;

  const deck = parseSource(source);
  assert.equal(deck.metadata.lang, "de");
  assert.equal(deck.metadata.Language, undefined);
});

test("parseSource case-insensitively maps language names", () => {
  const source = `---
title: Demo
Language: SPANISH
---

# Slide one`;

  const deck = parseSource(source);
  assert.equal(deck.metadata.lang, "es");
});

test("parseSource supports ::notes directive as alternative to Note:", () => {
  const source = `# Slide

Body text.

::notes
Speaker note via directive.
::`;

  const deck = parseSource(source);
  assert.equal(deck.slides[0].body.trim(), "# Slide\n\nBody text.");
  assert.equal(deck.slides[0].notes, "Speaker note via directive.");
});

test("parseSource supports ::note (singular) directive", () => {
  const source = `# Slide

::note
Singular note directive.
::`;

  const deck = parseSource(source);
  assert.equal(deck.slides[0].notes, "Singular note directive.");
});

test("parseSource supports ::notes directive without closing ::", () => {
  const source = `# Slide

Body.

::notes
Note without closing marker.`;

  const deck = parseSource(source);
  assert.equal(deck.slides[0].notes, "Note without closing marker.");
});

test("parseSource supports ::resources directive as alternative to Resources:", () => {
  const source = `# Slide

Body.

::resources
- [Reference](https://example.com)
::`;

  const deck = parseSource(source);
  assert.equal(deck.slides[0].resources, "- [Reference](https://example.com)");
});

test("parseSource supports ::references directive as alternative to Resources:", () => {
  const source = `# Slide

Body.

::references
- [Alt link](https://example.com)
::`;

  const deck = parseSource(source);
  assert.equal(deck.slides[0].resources, "- [Alt link](https://example.com)");
});

test("parseSource supports ::script directive as alternative to Script:", () => {
  const source = `# Slide

Body.

::script
Full spoken script.
::`;

  const deck = parseSource(source);
  assert.equal(deck.slides[0].script, "Full spoken script.");
});

test("parseSource treats ::notes/::resources/::script case-insensitively", () => {
  const source = `# Slide

::Notes
Notes content.
::

::Resources
Resources content.
::

::Script
Script content.
::`;

  const deck = parseSource(source);
  assert.equal(deck.slides[0].notes, "Notes content.");
  assert.equal(deck.slides[0].resources, "Resources content.");
  assert.equal(deck.slides[0].script, "Script content.");
});

test("parseSource does not close ::notes section for nested directives in notes", () => {
  const source = `# Slide

::notes
Some note text.
::callout
Important callout inside notes.
::
More note text.
::`;

  const deck = parseSource(source);
  assert.equal(
    deck.slides[0].notes,
    "Some note text.\n::callout\nImportant callout inside notes.\n::\nMore note text.",
  );
});

test("parseSource allows all three :: sections on one slide", () => {
  const source = `# Slide

Visible body.

::notes
My note.
::

::references
- [Link](https://example.com)
::

::script
Full script here.
::`;

  const deck = parseSource(source);
  assert.equal(deck.slides[0].body.trim(), "# Slide\n\nVisible body.");
  assert.equal(deck.slides[0].notes, "My note.");
  assert.equal(deck.slides[0].resources, "- [Link](https://example.com)");
  assert.equal(deck.slides[0].script, "Full script here.");
});
