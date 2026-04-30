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

test("parseSource places title slide at titleSlideNumber position", () => {
  const source = `---
title: Demo deck
titleSlide: true
titleSlideNumber: 3
---

# Slide one

---

# Slide two

---

# Slide three

---

# Slide four`;

  const deck = parseSource(source);
  // 4 content slides + 1 title = 5 total
  assert.equal(deck.slides.length, 5);
  assert.equal(deck.slides[2].kind, "title");
  assert.equal(deck.slides[0].id, "slide-1");
  assert.equal(deck.slides[1].id, "slide-2");
  assert.equal(deck.slides[3].id, "slide-3");
  assert.equal(deck.slides[4].id, "slide-4");
  // Indices must be sequential
  deck.slides.forEach((slide, i) => assert.equal(slide.index, i));
});

test("parseSource defaults to first position when titleSlideNumber is absent", () => {
  const source = `---
title: Demo deck
titleSlide: true
---

# Slide one`;

  const deck = parseSource(source);
  assert.equal(deck.slides[0].kind, "title");
  assert.equal(deck.slides[1].id, "slide-1");
});

test("parseSource places closing slide at closingSlideNumber: -1 (second to last)", () => {
  const source = `---
title: Demo deck
closingSlide: true
closingSlideNumber: -1
closingTitle: Questions?
---

# Slide one

---

# Slide two

---

# Slide three`;

  const deck = parseSource(source);
  // 3 content slides + 1 closing = 4 total
  assert.equal(deck.slides.length, 4);
  assert.equal(deck.slides[2].kind, "closing");
  assert.equal(deck.slides[3].id, "slide-3");
  deck.slides.forEach((slide, i) => assert.equal(slide.index, i));
});

test("parseSource places closing slide at positive closingSlideNumber position", () => {
  const source = `---
title: Demo deck
closingSlide: true
closingSlideNumber: 2
closingTitle: Questions?
---

# Slide one

---

# Slide two

---

# Slide three`;

  const deck = parseSource(source);
  // Closing at position 2 (1-indexed) → index 1
  assert.equal(deck.slides.length, 4);
  assert.equal(deck.slides[1].kind, "closing");
  assert.equal(deck.slides[0].id, "slide-1");
  assert.equal(deck.slides[2].id, "slide-2");
  assert.equal(deck.slides[3].id, "slide-3");
  deck.slides.forEach((slide, i) => assert.equal(slide.index, i));
});

test("parseSource handles both titleSlideNumber and closingSlideNumber together", () => {
  const source = `---
title: Demo deck
titleSlide: true
titleSlideNumber: 2
closingSlide: true
closingSlideNumber: -1
closingTitle: Questions?
---

# Slide one

---

# Slide two

---

# Slide three`;

  const deck = parseSource(source);
  // 3 content + title + closing = 5 total
  assert.equal(deck.slides.length, 5);
  // title at index 1 (titleSlideNumber: 2)
  assert.equal(deck.slides[1].kind, "title");
  // closing at 2nd to last → index 3
  assert.equal(deck.slides[3].kind, "closing");
  // content slide order
  assert.equal(deck.slides[0].id, "slide-1");
  assert.equal(deck.slides[2].id, "slide-2");
  assert.equal(deck.slides[4].id, "slide-3");
  deck.slides.forEach((slide, i) => assert.equal(slide.index, i));
});

test("getSlideIndexForSourceOffset respects titleSlideNumber", () => {
  const source = `---
title: Demo deck
titleSlide: true
titleSlideNumber: 3
---

# Slide one

---

# Slide two

---

# Slide three

---

# Slide four`;

  // Cursor at "Slide one" → content slide 0 → display index 0 (title is after it)
  assert.equal(getSlideIndexForSourceOffset(source, source.indexOf("# Slide one")), 0);
  // Cursor at "Slide two" → content slide 1 → display index 1 (title is after it)
  assert.equal(getSlideIndexForSourceOffset(source, source.indexOf("# Slide two")), 1);
  // Cursor at "Slide three" → content slide 2 → display index 3 (title inserted before at index 2)
  assert.equal(getSlideIndexForSourceOffset(source, source.indexOf("# Slide three")), 3);
  // Cursor at "Slide four" → content slide 3 → display index 4
  assert.equal(getSlideIndexForSourceOffset(source, source.indexOf("# Slide four")), 4);
});

test("getSlideIndexForSourceOffset respects closingSlideNumber: -1", () => {
  const source = `---
title: Demo deck
closingSlide: true
closingSlideNumber: -1
---

# Slide one

---

# Slide two

---

# Slide three`;

  // Closing is at index 3 (before last content slide, which is index 3... wait)
  // 3 content slides + closing = 4 slides
  // closing at -1: inserted before last → [c0, c1, closing, c2]
  // Cursor at "Slide one" → content 0 → display 0
  assert.equal(getSlideIndexForSourceOffset(source, source.indexOf("# Slide one")), 0);
  // Cursor at "Slide two" → content 1 → display 1
  assert.equal(getSlideIndexForSourceOffset(source, source.indexOf("# Slide two")), 1);
  // Cursor at "Slide three" → content 2 → display 3 (closing inserted before it)
  assert.equal(getSlideIndexForSourceOffset(source, source.indexOf("# Slide three")), 3);
});

test("getSourceOffsetForSlideIndex respects titleSlideNumber", () => {
  const source = `---
title: Demo deck
titleSlide: true
titleSlideNumber: 3
---

# Slide one

---

# Slide two

---

# Slide three`;

  const deck = parseSource(source);
  // slide 0 → "Slide one" (content before title)
  assert.equal(getSourceOffsetForSlideIndex(source, 0, deck), source.indexOf("# Slide one"));
  // slide 1 → "Slide two" (content before title)
  assert.equal(getSourceOffsetForSlideIndex(source, 1, deck), source.indexOf("# Slide two"));
  // slide 2 → title slide → returns 0
  assert.equal(getSourceOffsetForSlideIndex(source, 2, deck), 0);
  // slide 3 → "Slide three" (content after title)
  assert.equal(getSourceOffsetForSlideIndex(source, 3, deck), source.indexOf("# Slide three"));
});

test("getSourceOffsetForSlideIndex respects closingSlideNumber: -1", () => {
  const source = `---
title: Demo deck
closingSlide: true
closingSlideNumber: -1
---

# Slide one

---

# Slide two

---

# Slide three`;

  const deck = parseSource(source);
  // [c0(0), c1(1), closing(2), c2(3)]
  assert.equal(getSourceOffsetForSlideIndex(source, 0, deck), source.indexOf("# Slide one"));
  assert.equal(getSourceOffsetForSlideIndex(source, 1, deck), source.indexOf("# Slide two"));
  assert.equal(getSourceOffsetForSlideIndex(source, 2, deck), 0);  // closing slide → 0
  assert.equal(getSourceOffsetForSlideIndex(source, 3, deck), source.indexOf("# Slide three"));
});

test("source/slide mapping round-trip with repositioned title and closing slides", () => {
  const source = `---
title: Demo deck
titleSlide: true
titleSlideNumber: 2
closingSlide: true
closingSlideNumber: -1
---

# Slide one

---

# Slide two

---

# Slide three`;

  const deck = parseSource(source);
  // Slides: [c0(0), title(1), c1(2), closing(3), c2(4)]
  // Only content slides participate in round-trip (generated slides return 0)
  for (const slideIndex of [0, 2, 4]) {
    const offset = getSourceOffsetForSlideIndex(source, slideIndex, deck);
    assert.equal(getSlideIndexForSourceOffset(source, offset), slideIndex);
  }
});

test("slide index mapping is correct with titleSlideNumber:4 and closingSlideNumber:-1 (regression)", () => {
  // Reproduces the navigation-loop bug: navigating to the title or closing slide
  // in the editor would reset activeSlideIndex to 0 because
  // getSourceOffsetForSlideIndex returns 0 for generated slides, causing
  // setEditorSelection(0) to fire a 'select' event that reset the index.
  const contentSlides = Array.from({ length: 6 }, (_, i) => `# Slide ${i + 1}`).join("\n\n---\n\n");
  const source = `---
title: Demo
titleSlide: true
titleSlideNumber: 4
closingSlide: true
closingSlideNumber: -1
---

${contentSlides}`;

  const deck = parseSource(source);
  // Slides: [c0(0), c1(1), c2(2), title(3), c3(4), c4(5), closing(6), c5(7)]
  assert.equal(deck.slides.length, 8);
  assert.equal(deck.slides[3].kind, "title");
  assert.equal(deck.slides[3].index, 3);
  assert.equal(deck.slides[6].kind, "closing");
  assert.equal(deck.slides[6].index, 6);

  // Generated slides must return 0 from getSourceOffsetForSlideIndex
  assert.equal(getSourceOffsetForSlideIndex(source, 3, deck), 0, "title slide offset should be 0");
  assert.equal(getSourceOffsetForSlideIndex(source, 6, deck), 0, "closing slide offset should be 0");

  // Content slides before the title slide map to rendered indices 0-2
  assert.equal(getSlideIndexForSourceOffset(source, source.indexOf("# Slide 1")), 0);
  assert.equal(getSlideIndexForSourceOffset(source, source.indexOf("# Slide 2")), 1);
  assert.equal(getSlideIndexForSourceOffset(source, source.indexOf("# Slide 3")), 2);
  // Content slides after the title slide map to rendered indices 4+
  assert.equal(getSlideIndexForSourceOffset(source, source.indexOf("# Slide 4")), 4);
  assert.equal(getSlideIndexForSourceOffset(source, source.indexOf("# Slide 5")), 5);
  // Content slide after the closing slide maps to rendered index 7
  assert.equal(getSlideIndexForSourceOffset(source, source.indexOf("# Slide 6")), 7);

  // Round-trip for content slides (title/closing slides are excluded since they
  // have no source content and always return offset 0)
  for (const slideIndex of [0, 1, 2, 4, 5, 7]) {
    const offset = getSourceOffsetForSlideIndex(source, slideIndex, deck);
    assert.equal(getSlideIndexForSourceOffset(source, offset), slideIndex,
      `round-trip failed for slide index ${slideIndex}`);
  }
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

test("parseSource preserves blank slides in the middle so subsequent slide numbering stays correct", () => {
  const source = `# Slide 1

---

---

# Slide 3`;

  const deck = parseSource(source);
  assert.equal(deck.slides.length, 3);
  assert.equal(deck.slides[0].id, "slide-1");
  assert.equal(deck.slides[1].id, "slide-2");
  assert.equal(deck.slides[1].body, "");
  assert.equal(deck.slides[2].id, "slide-3");
  assert.equal(deck.slides[2].body, "# Slide 3");
});

test("renderMarkdown adds next class and increments stepCount for on-click column", () => {
  const rendered = renderMarkdown(`# Slide

::column-left
Always visible.
::

::column-right on-click
Revealed on click.
::`);

  assert.equal(rendered.html.includes('class="layout-columns__column layout-columns__column--left"'), true);
  assert.equal(rendered.html.includes('class="layout-columns__column layout-columns__column--right next"'), true);
  assert.equal(rendered.stepCount, 1);
});

test("renderMarkdown counts multiple on-click columns as separate steps", () => {
  const rendered = renderMarkdown(`# Slide

::column-left on-click
First column.
::

::column-right on-click
Second column.
::`);

  assert.equal(rendered.stepCount, 2);
  assert.equal(rendered.html.includes('layout-columns__column--left next'), true);
  assert.equal(rendered.html.includes('layout-columns__column--right next'), true);
});

test("renderMarkdown adds next class and increments stepCount for on-click callout", () => {
  const rendered = renderMarkdown(`# Slide

::callout on-click
Key takeaway revealed on click.
::`);

  assert.equal(rendered.html.includes('class="layout-callout next"'), true);
  assert.equal(rendered.stepCount, 1);
});

test("renderMarkdown adds next class and increments stepCount for on-click quote", () => {
  const rendered = renderMarkdown(`# Slide

::quote on-click
Revealed quotation.
::`);

  assert.equal(rendered.html.includes('class="layout-quote next"'), true);
  assert.equal(rendered.stepCount, 1);
});

test("renderMarkdown adds next class and increments stepCount for on-click center", () => {
  const rendered = renderMarkdown(`# Slide

::center on-click
Centered content revealed on click.
::`);

  assert.equal(rendered.html.includes('class="layout-center next"'), true);
  assert.equal(rendered.stepCount, 1);
});

test("renderMarkdown adds next class for on-click media-left block", () => {
  const rendered = renderMarkdown(`# Slide

::media-left on-click
![Alt](https://example.com/img.jpg)
---
Text beside image.
::`);

  assert.equal(rendered.html.includes('layout-media--left next'), true);
  assert.equal(rendered.stepCount, 1);
});

test("renderMarkdown combines on-click blocks and [>] list items in stepCount", () => {
  const rendered = renderMarkdown(`# Slide

- [>] First reveal
- [>] Second reveal

::callout on-click
Third reveal.
::`);

  assert.equal(rendered.stepCount, 3);
});

test("renderMarkdown on-click column with custom width retains width style", () => {
  const rendered = renderMarkdown(`# Slide

::column-left-75% on-click
Wide column on-click.
::

::column-right-300px
Narrow always-visible.
::`);

  assert.equal(rendered.html.includes('layout-columns__column--left next'), true);
  assert.equal(rendered.html.includes('--column-basis:75%'), true);
  assert.equal(rendered.stepCount, 1);
});

test("nested on-click directives inside notes section are parsed correctly", () => {
  const source = `# Slide

Body.

::notes
See also:

::callout on-click
Nested callout in notes.
::

End of notes.
::`;

  const deck = parseSource(source);
  assert.equal(deck.slides[0].notes.includes("Nested callout in notes."), true);
  assert.equal(deck.slides[0].notes.includes("End of notes."), true);
});

test("renderMarkdown renders ::code directive with language class", () => {
  const rendered = renderMarkdown(`::code javascript
function hello() {
  return "world";
}
::`);

  assert.equal(rendered.html.includes('class="layout-code"'), true);
  assert.equal(rendered.html.includes('class="language-javascript"'), true);
  assert.equal(rendered.html.includes("function hello()"), true);
  // Content must be escaped, not executed as HTML
  assert.equal(rendered.html.includes("&lt;"), false);
  assert.equal(rendered.stepCount, 0);
});

test("renderMarkdown renders ::code on-click with language and progressive class", () => {
  const rendered = renderMarkdown(`::code python on-click
print("hello")
::`);

  assert.equal(rendered.html.includes('class="layout-code next"'), true);
  assert.equal(rendered.html.includes('class="language-python"'), true);
  assert.equal(rendered.stepCount, 1);
});

test("renderMarkdown renders ::code without a language", () => {
  const rendered = renderMarkdown(`::code
plain text block
::`);

  assert.equal(rendered.html.includes('class="layout-code"'), true);
  assert.equal(rendered.html.includes("<code>"), true);
  assert.equal(rendered.html.includes('class="language-'), false);
});

test("renderMarkdown escapes HTML entities in ::code content", () => {
  const rendered = renderMarkdown(`::code html
<div class="test">Hello &amp; World</div>
::`);

  assert.equal(rendered.html.includes("&lt;div"), true);
  assert.equal(rendered.html.includes("&amp;amp;"), true);
});

test("renderMarkdown renders ::table directive with header and data rows", () => {
  const rendered = renderMarkdown(`::table
| Name | Role |
| --- | --- |
| Alice | Engineer |
| Bob | Designer |
::`);

  assert.equal(rendered.html.includes('class="layout-table"'), true);
  assert.equal(rendered.html.includes("<table>"), true);
  assert.equal(rendered.html.includes("<thead>"), true);
  assert.equal(rendered.html.includes("<th>Name</th>"), true);
  assert.equal(rendered.html.includes("<th>Role</th>"), true);
  assert.equal(rendered.html.includes("<td>Alice</td>"), true);
  assert.equal(rendered.html.includes("<td>Designer</td>"), true);
  assert.equal(rendered.stepCount, 0);
});

test("renderMarkdown renders ::table with progressive rows using [>] prefix", () => {
  const rendered = renderMarkdown(`::table
| Feature | Status |
| --- | --- |
| Ready | Done |
| [>] Upcoming | Planned |
::`);

  assert.equal(rendered.html.includes('class="next"'), true);
  // The [>] prefix should be stripped from the cell content
  assert.equal(rendered.html.includes("[&gt;]"), false);
  assert.equal(rendered.html.includes("<td>Upcoming</td>"), true);
  assert.equal(rendered.stepCount, 1);
});

test("renderMarkdown renders ::table on-click makes whole table progressive", () => {
  const rendered = renderMarkdown(`::table on-click
| A | B |
| --- | --- |
| 1 | 2 |
::`);

  assert.equal(rendered.html.includes('class="layout-table next"'), true);
  assert.equal(rendered.stepCount, 1);
});

test("renderMarkdown renders ::figure directive with image and caption", () => {
  const rendered = renderMarkdown(`::figure
![A diagram](diagram.png)
---
Caption text here.
::`);

  assert.equal(rendered.html.includes('class="layout-figure"'), true);
  assert.equal(rendered.html.includes("<figcaption>"), true);
  assert.equal(rendered.html.includes("Caption text here."), true);
  assert.equal(rendered.html.includes('src="diagram.png"'), true);
  assert.equal(rendered.stepCount, 0);
});

test("renderMarkdown renders ::figure on-click adds progressive class", () => {
  const rendered = renderMarkdown(`::figure on-click
![A chart](chart.png)
---
Chart caption.
::`);

  assert.equal(rendered.html.includes('class="layout-figure next"'), true);
  assert.equal(rendered.stepCount, 1);
});

test("renderMarkdown renders ::figure without caption", () => {
  const rendered = renderMarkdown(`::figure
![No caption image](img.png)
::`);

  assert.equal(rendered.html.includes('class="layout-figure"'), true);
  assert.equal(rendered.html.includes("<figcaption>"), false);
});

test("renderMarkdown renders ::step directive as transparent wrapper", () => {
  const rendered = renderMarkdown(`::step
Some content.
::`);

  assert.equal(rendered.html.includes('class="layout-step"'), true);
  assert.equal(rendered.html.includes("Some content."), true);
  assert.equal(rendered.stepCount, 0);
});

test("renderMarkdown renders ::step on-click as progressive wrapper", () => {
  const rendered = renderMarkdown(`::step on-click
Reveal this block.
::`);

  assert.equal(rendered.html.includes('class="layout-step next"'), true);
  assert.equal(rendered.stepCount, 1);
});

test("renderMarkdown renders inline {>text} fragment as progressive span", () => {
  const rendered = renderMarkdown(`A paragraph with {>a hidden part} revealed later.`);

  assert.equal(rendered.html.includes('<span class="next">a hidden part</span>'), true);
  assert.equal(rendered.stepCount, 1);
});

test("renderMarkdown counts multiple inline fragments in stepCount", () => {
  const rendered = renderMarkdown(`First {>one} then {>two} then {>three}.`);

  assert.equal(rendered.html.includes('<span class="next">one</span>'), true);
  assert.equal(rendered.html.includes('<span class="next">two</span>'), true);
  assert.equal(rendered.html.includes('<span class="next">three</span>'), true);
  assert.equal(rendered.stepCount, 3);
});

test("renderMarkdown inline fragment supports inline markup inside the fragment", () => {
  const rendered = renderMarkdown(`See {>**bold fragment**} here.`);

  assert.equal(rendered.html.includes('<span class="next"><strong>bold fragment</strong></span>'), true);
});

test("renderMarkdown inline fragments in list items count toward stepCount", () => {
  const rendered = renderMarkdown(`- Item with {>a fragment} inside`);

  assert.equal(rendered.html.includes('<span class="next">a fragment</span>'), true);
  assert.equal(rendered.stepCount, 1);
});

test("renderMarkdown combines new directives and [>] list items in stepCount", () => {
  const rendered = renderMarkdown(`::code javascript on-click
const x = 1;
::

::step on-click
Revealed step.
::

- [>] List item reveal

A paragraph with {>inline fragment}.`);

  assert.equal(rendered.stepCount, 4);
});
