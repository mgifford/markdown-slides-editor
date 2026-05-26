import test from "node:test";
import assert from "node:assert/strict";
import {
  buildExportFilename,
  buildShortExportFilename,
  buildExportBundle,
  buildMhtmlDocument,
  buildOdpPresentation,
  buildOnePageHtml,
  buildSnapshotHtml,
  buildNotesExportHtml,
} from "../src/modules/export.js";
import { buildThemeLinkTag } from "../src/modules/theme.js";

test("buildExportFilename uses a clean title slug and compact date", () => {
  assert.equal(
    buildExportFilename("Digital Independence & Open Source Ecosystems", "2025-03-23"),
    "Digital-Independence-Open-Source-Ecosystems_23Mar2025.zip",
  );
});

test("buildShortExportFilename truncates the title to the first 5 words by default", () => {
  assert.equal(
    buildShortExportFilename("Code as Constitution Building Public Digital Infrastructure We Can Actually Trust", "2026-05-01"),
    "Code-as-Constitution-Building-Public_01May2026.zip",
  );
});

test("buildShortExportFilename respects a custom maxWords value", () => {
  assert.equal(
    buildShortExportFilename("One Two Three Four Five Six Seven", "2026-05-01", 3),
    "One-Two-Three_01May2026.zip",
  );
});

test("buildShortExportFilename falls back gracefully when title is empty", () => {
  const result = buildShortExportFilename("", "2026-05-01");
  assert.equal(result, "01May2026.zip");
});

test("buildThemeLinkTag includes an external stylesheet only when configured", () => {
  assert.equal(buildThemeLinkTag({}), "");
  assert.equal(
    buildThemeLinkTag({ themeStylesheet: "https://example.com/theme.css" }),
    '<link rel="stylesheet" href="https://example.com/theme.css" />',
  );
});

test("buildSnapshotHtml includes theme data, step counts, and embedded source payload", () => {
  const html = buildSnapshotHtml({
    title: "Deck snapshot",
    cssText: ".slide{color:black;}",
    renderedSlides: [
      { html: "<h1>One</h1>", stepCount: 2 },
      { html: "<h1>Two</h1>", stepCount: 0 },
    ],
    metadata: {
      lang: "en-CA",
      theme: "night-slate",
      themeStylesheet: "https://example.com/theme.css",
    },
    source: "# One",
  });

  assert.equal(html.includes('<html lang="en-CA" data-theme="night-slate">'), true, "data-theme should be on the <html> element so :root[data-theme] CSS rules apply");
  assert.equal(html.includes('href="https://example.com/theme.css"'), true);
  assert.equal(html.includes('data-step-count="2"'), true);
  assert.equal(html.includes('<script id="deck-source" type="application/json">'), true);
  assert.equal(html.includes('"slideCount":2'), true);
  assert.equal(html.includes('class="snapshot-body snapshot-viewer"'), true, "body should have snapshot-viewer class for viewport scaling");
  assert.equal(html.includes("slide-card__content"), true, "slides should include slide-card wrapper");
  assert.equal(html.includes("max-height: calc(100vh - 3rem)"), true, "slide-card should use viewport-filling max-height minus nav bar height");
  assert.equal(html.includes("setProperty(\"--snapshot-scale\""), false, "snapshot should not use transform-based viewport scaling");
});

test("buildSnapshotHtml escapes closing script tags inside embedded source", () => {
  const html = buildSnapshotHtml({
    title: "Escaping test",
    cssText: "",
    renderedSlides: [{ html: "<h1>One</h1>", stepCount: 0 }],
    metadata: {},
    source: "</script><script>alert('x')</script>",
  });

  assert.equal(html.includes("</script><script>alert"), false);
  assert.equal(html.includes("<\\/script><script>alert"), true);
});

test("buildSnapshotHtml HTML-escapes lang and theme in html element attributes", () => {
  const html = buildSnapshotHtml({
    title: "Escape test",
    cssText: "",
    renderedSlides: [{ html: "<h1>One</h1>", stepCount: 0 }],
    metadata: { lang: 'en" onload="alert(1)', theme: 'dark" onload="alert(2)' },
    source: "",
  });

  assert.equal(html.includes('lang="en" onload="alert(1)"'), false, "lang must not inject attributes");
  assert.equal(html.includes('data-theme="dark" onload="alert(2)"'), false, "theme must not inject attributes");
  assert.equal(html.includes("&quot;"), true, "double quotes must be HTML-escaped");
});

test("buildSnapshotHtml inlines themeStylesheetCss as a <style> block instead of a <link> tag", () => {
  const html = buildSnapshotHtml({
    title: "Inline theme test",
    cssText: "",
    themeStylesheetCss: ".custom-theme { color: navy; }",
    renderedSlides: [{ html: "<h1>One</h1>", stepCount: 0 }],
    metadata: { themeStylesheet: "https://example.com/theme.css" },
    source: "",
  });

  assert.equal(html.includes(".custom-theme { color: navy; }"), true, "theme CSS should be inlined in a <style> block");
  assert.equal(html.includes('href="https://example.com/theme.css"'), false, "external theme link should not be present when CSS is inlined");
});

test("buildOnePageHtml inlines themeStylesheetCss as a <style> block instead of a <link> tag", () => {
  const html = buildOnePageHtml({
    title: "Inline theme test",
    cssText: "",
    themeStylesheetCss: ".custom-theme { background: navy; }",
    renderedSlides: [{ html: "<h1>One</h1>" }],
    metadata: { themeStylesheet: "https://example.com/theme.css" },
  });

  assert.equal(html.includes(".custom-theme { background: navy; }"), true, "theme CSS should be inlined in a <style> block");
  assert.equal(html.includes('href="https://example.com/theme.css"'), false, "external theme link should not be present when CSS is inlined");
});

test("buildSnapshotHtml falls back to external <link> when themeStylesheetCss is not provided", () => {
  const html = buildSnapshotHtml({
    title: "Fallback link test",
    cssText: "",
    renderedSlides: [{ html: "<h1>One</h1>", stepCount: 0 }],
    metadata: { themeStylesheet: "https://example.com/theme.css" },
    source: "",
  });

  assert.equal(html.includes('href="https://example.com/theme.css"'), true, "should emit an external link when no CSS text is provided");
});

test("buildOnePageHtml falls back to external <link> when themeStylesheetCss is not provided", () => {
  const html = buildOnePageHtml({
    title: "Fallback link test",
    cssText: "",
    renderedSlides: [{ html: "<h1>One</h1>" }],
    metadata: { themeStylesheet: "https://example.com/theme.css" },
  });

  assert.equal(html.includes('href="https://example.com/theme.css"'), true, "should emit an external link when no CSS text is provided");
});

test("buildExportBundle includes markdown, html, odp, and one-page html files in the zip payload", () => {
  const bundle = buildExportBundle({
    markdownSource: "# Deck",
    deckJson: "{\"title\":\"Deck\"}",
    snapshotHtml: "<!doctype html><html><body>Deck</body></html>",
    odpBytes: new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
    onePageHtml: "<!doctype html><html><body>One page</body></html>",
  });

  const text = new TextDecoder().decode(bundle);
  assert.equal(text.includes("deck.md"), true);
  assert.equal(text.includes("deck.json"), true);
  assert.equal(text.includes("presentation.html"), true);
  assert.equal(text.includes("presentation.odp"), true);
  assert.equal(text.includes("presentation-one-page.html"), true);
  assert.equal(bundle[0], 0x50);
  assert.equal(bundle[1], 0x4b);
});

test("buildExportBundle uses the provided filePrefix for presentation files", () => {
  const bundle = buildExportBundle({
    markdownSource: "# Deck",
    deckJson: "{\"title\":\"Deck\"}",
    snapshotHtml: "<!doctype html><html><body>Deck</body></html>",
    odpBytes: new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
    onePageHtml: "<!doctype html><html><body>One page</body></html>",
    filePrefix: "My-Deck_01May2026",
  });

  const text = new TextDecoder().decode(bundle);
  assert.equal(text.includes("My-Deck_01May2026.html"), true);
  assert.equal(text.includes("My-Deck_01May2026.odp"), true);
  assert.equal(text.includes("My-Deck_01May2026-one-page.html"), true);
  assert.equal(text.includes("My-Deck_01May2026-offline.html"), false);
  assert.equal(text.includes("deck.md"), true);
  assert.equal(text.includes("deck.json"), true);
});

test("buildOnePageHtml opens as a readable handout with save controls and support cards", () => {
  const html = buildOnePageHtml({
    title: "One page deck",
    cssText: ".slide{color:black;}",
    renderedSlides: [
      { html: "<h1>One</h1>", kind: "title", notesHtml: "<p>Opening note</p>" },
      { html: "<h1>Two</h1>", kind: "content", resourcesHtml: "<ul><li><a href=\"https://example.com\">Reference</a></li></ul>" },
    ],
    metadata: {
      lang: "en-CA",
      theme: "night-slate",
    },
  });

  assert.equal(html.includes('<html lang="en-CA" data-theme="night-slate">'), true, "data-theme should be on the <html> element so :root[data-theme] CSS rules apply");
  assert.equal(html.includes("one-page-body"), true);
  assert.equal(html.includes("one-page-slide-card"), true);
  assert.equal(html.includes('aria-label="Slide 1"'), true);
  assert.equal(html.includes('aria-label="Slide 2"'), true);
  assert.equal(html.includes("Save HTML"), true);
  assert.equal(html.includes("Print / Save PDF"), true);
  assert.equal(html.includes('name="slides-per-page"'), true, "should include the slides-per-page radio group");
  assert.equal(html.includes('value="4"'), true, "should include the 4-per-page option");
  assert.equal(html.includes("Slides per page"), true, "should include the slides per page legend");
  assert.equal(html.includes("one-page-show-notes"), true, "should include notes checkbox");
  assert.equal(html.includes("one-page-show-references"), true, "should include references checkbox");
  assert.equal(html.includes("one-page-support__card--notes"), true, "notes card should have modifier class");
  assert.equal(html.includes("one-page-support__card--references"), true, "references card should have modifier class");
  assert.equal(html.includes("Speaker notes"), true);
  assert.equal(html.includes("References"), true);
  assert.equal(html.includes("window.print()"), true);
});

test("buildOnePageHtml includes footer with presentation URL when provided", () => {
  const html = buildOnePageHtml({
    title: "Deck with URL",
    cssText: "",
    renderedSlides: [{ html: "<h1>Slide</h1>", kind: "content" }],
    metadata: { presentationUrl: "https://ox.ca/p/6" },
  });
  assert.equal(html.includes("one-page-footer"), true, "should include footer element");
  assert.equal(html.includes("ox.ca/p/6"), true, "should include the presentation URL in the footer");
});

test("buildOnePageHtml omits footer when no presentation URL", () => {
  const html = buildOnePageHtml({
    title: "Deck without URL",
    cssText: "",
    renderedSlides: [{ html: "<h1>Slide</h1>", kind: "content" }],
    metadata: {},
  });
  assert.equal(html.includes("one-page-footer"), false, "should not include footer when no URL");
});

test("buildOdpPresentation creates an OpenDocument Presentation archive", () => {
  const odp = buildOdpPresentation({
    title: "Deck ODP",
    renderedSlides: [
      {
        html: "<h1>Slide one</h1><p>Intro paragraph</p><ul><li>Point one</li><li>Point two</li></ul>",
        headings: [{ level: 1, text: "Slide one" }],
      },
    ],
    metadata: {
      slideWidth: 1280,
      slideHeight: 720,
    },
  });

  const text = new TextDecoder().decode(odp);
  assert.equal(text.includes("mimetype"), true);
  assert.equal(text.includes("content.xml"), true);
  assert.equal(text.includes("styles.xml"), true);
  assert.equal(text.includes("META-INF/manifest.xml"), true);
  assert.equal(text.includes("application/vnd.oasis.opendocument.presentation"), true);
});

test("buildOdpPresentation formats title slide metadata without concatenation", () => {
  const odp = buildOdpPresentation({
    title: "My Talk",
    renderedSlides: [
      {
        kind: "title",
        title: "My Talk",
        subtitle: "A subtitle",
        date: "2026-05-01",
        location: "Ottawa, Canada",
        speakers: "Jane Doe",
        html: "",
        headings: [{ level: 1, text: "My Talk" }],
      },
      {
        html: "<h1>Slide one</h1><p>Content here</p>",
        headings: [{ level: 1, text: "Slide one" }],
      },
    ],
    metadata: { slideWidth: 1280, slideHeight: 720 },
  });

  const zip = new TextDecoder().decode(odp);
  // content.xml is stored uncompressed so its text is searchable in the raw bytes
  assert.equal(zip.includes("Date: 2026-05-01"), true, "date label and value should be separated");
  assert.equal(zip.includes("Location: Ottawa, Canada"), true, "location label and value should be separated");
  assert.equal(zip.includes("Speakers: Jane Doe"), true, "speakers label and value should be separated");
  assert.equal(zip.includes("Date2026"), false, "date label should not be concatenated with value");
});

test("buildOdpPresentation formats closing slide metadata without concatenation", () => {
  const odp = buildOdpPresentation({
    title: "My Talk",
    renderedSlides: [
      {
        kind: "closing",
        title: "Questions?",
        prompt: "What are you building?",
        contactUrl: "https://example.com/",
        socialLinks: "Mastodon @user@mastodon.social",
        presentationUrl: "https://example.com/slides/",
        html: "",
        headings: [{ level: 1, text: "Questions?" }],
      },
    ],
    metadata: { slideWidth: 1280, slideHeight: 720 },
  });

  const zip = new TextDecoder().decode(odp);
  assert.equal(zip.includes("What are you building?"), true, "closing prompt should be present");
  assert.equal(zip.includes("Website: example.com/"), true, "website label and value should be separated");
  assert.equal(zip.includes("Slides: example.com/slides/"), true, "slides label and value should be separated");
  assert.equal(zip.includes("Websitehttps"), false, "website label should not be concatenated with URL");
});

test("buildMhtmlDocument wraps one-page html as a single mhtml document", () => {
  const mhtml = buildMhtmlDocument({
    title: "Deck one page",
    html: "<!doctype html><html><body><h1>Deck</h1></body></html>",
  });

  assert.equal(mhtml.includes("MIME-Version: 1.0"), true);
  assert.equal(mhtml.includes('Content-Type: multipart/related; type="text/html"'), true);
  assert.equal(mhtml.includes("Content-Transfer-Encoding: base64"), true);
  assert.equal(mhtml.includes("PCFkb2N0eXBl"), true);
});


test("buildOdpPresentation uses PTitleLarge for title-kind slides and PTitle for regular slides", () => {
  const odp = buildOdpPresentation({
    title: "My Talk",
    renderedSlides: [
      {
        kind: "title",
        title: "My Talk",
        subtitle: "A subtitle",
        date: "2026-05-01",
        html: "",
        headings: [{ level: 1, text: "My Talk" }],
      },
      {
        html: "<h1>Regular Slide</h1><p>Body content here</p>",
        headings: [{ level: 1, text: "Regular Slide" }],
      },
    ],
    metadata: { slideWidth: 1280, slideHeight: 720 },
  });

  const zip = new TextDecoder().decode(odp);
  assert.equal(zip.includes('text:style-name="PTitleLarge"'), true, "title-kind slide should use PTitleLarge style");
  assert.equal(zip.includes('text:style-name="PTitle"'), true, "regular slide should use PTitle style");
  assert.equal(zip.includes('text:style-name="PSubtitle"'), true, "subtitle should use PSubtitle style");
  assert.equal(zip.includes('text:style-name="PMeta"'), true, "metadata lines should use PMeta style");
  assert.equal(zip.includes("fo:font-size=\"32pt\""), true, "PTitleLarge should define a 32pt font");
});

test("buildOdpPresentation renders two-column layout as two side-by-side frames", () => {
  const columnHtml =
    '<h1>Columns Slide</h1>' +
    '<div class="layout-columns">' +
    '<section class="layout-columns__column layout-columns__column--left"><p>Left point</p><ul><li>Item A</li></ul></section>' +
    '<section class="layout-columns__column layout-columns__column--right"><p>Right point</p><ul><li>Item B</li></ul></section>' +
    "</div>";

  const odp = buildOdpPresentation({
    title: "Two Columns",
    renderedSlides: [
      {
        html: columnHtml,
        headings: [{ level: 1, text: "Columns Slide" }],
      },
    ],
    metadata: { slideWidth: 1280, slideHeight: 720 },
  });

  const zip = new TextDecoder().decode(odp);
  assert.equal(zip.includes("Left point"), true, "left column content should be present");
  assert.equal(zip.includes("Right point"), true, "right column content should be present");
  assert.equal(zip.includes("• Item A"), true, "left column bullet should be present");
  assert.equal(zip.includes("• Item B"), true, "right column bullet should be present");
  // Two separate draw:frame elements should appear for the body (left and right columns)
  const frameCount = (zip.match(/presentation:class="outline"/g) || []).length;
  assert.equal(frameCount, 2, "two-column slide should produce two body frames");
});

test("buildOdpPresentation applies PH2 and PH3 styles for headings inside slide body", () => {
  const odp = buildOdpPresentation({
    title: "Headings",
    renderedSlides: [
      {
        html: "<h1>Slide</h1><h2>Section heading</h2><p>Body text</p><h3>Sub heading</h3><ul><li>Item</li></ul>",
        headings: [{ level: 1, text: "Slide" }],
      },
    ],
    metadata: { slideWidth: 1280, slideHeight: 720 },
  });

  const zip = new TextDecoder().decode(odp);
  assert.equal(zip.includes('text:style-name="PH2"'), true, "H2 headings should use PH2 style");
  assert.equal(zip.includes("Section heading"), true, "H2 text should be present");
  assert.equal(zip.includes('text:style-name="PH3"'), true, "H3 headings should use PH3 style");
  assert.equal(zip.includes("Sub heading"), true, "H3 text should be present");
});

test("buildOdpPresentation preserves H2 sub-headings and text that appear before/after the two-column block", () => {
  // H2 sub-heading before the columns div and a paragraph after it must both
  // appear in the output even though they are outside the column sections.
  const html =
    "<h1>Title</h1>" +
    "<h2>Sub-heading</h2>" +
    '<div class="layout-columns">' +
    '<section class="layout-columns__column layout-columns__column--left"><p>Left text</p></section>' +
    '<section class="layout-columns__column layout-columns__column--right"><p>Right text</p></section>' +
    "</div>" +
    "<p>After columns</p>";

  const odp = buildOdpPresentation({
    title: "Outer content",
    renderedSlides: [{ html, headings: [{ level: 1, text: "Title" }] }],
    metadata: { slideWidth: 1280, slideHeight: 720 },
  });

  const zip = new TextDecoder().decode(odp);
  assert.equal(zip.includes("Sub-heading"), true, "H2 sub-heading before columns should be preserved");
  assert.equal(zip.includes('text:style-name="PH2"'), true, "H2 outside columns should use PH2 style");
  assert.equal(zip.includes("Left text"), true, "left column content should be present");
  assert.equal(zip.includes("Right text"), true, "right column content should be present");
  assert.equal(zip.includes("After columns"), true, "text after the columns block should be preserved");
});

test("buildOdpPresentation preserves H2 sub-headings inside columns even when nested divs are present", () => {
  // Columns whose inner HTML contains nested <div> elements must not confuse
  // the layout-columns wrapper search, and H2s before the wrapper must still
  // appear in the output.
  const html =
    "<h1>Title</h1>" +
    "<h2>Pre-column heading</h2>" +
    '<div class="layout-columns">' +
    '<section class="layout-columns__column layout-columns__column--left"><div><p>Nested left</p></div></section>' +
    '<section class="layout-columns__column layout-columns__column--right"><p>Right item</p></section>' +
    "</div>" +
    "<p>Footer text</p>";

  const odp = buildOdpPresentation({
    title: "Nested divs",
    renderedSlides: [{ html, headings: [{ level: 1, text: "Title" }] }],
    metadata: { slideWidth: 1280, slideHeight: 720 },
  });

  const zip = new TextDecoder().decode(odp);
  assert.equal(zip.includes("Pre-column heading"), true, "H2 before columns should survive nested inner divs");
  assert.equal(zip.includes("Nested left"), true, "left column nested content should be present");
  assert.equal(zip.includes("Footer text"), true, "footer text after columns should be preserved");
});

test("buildOdpPresentation includes img alt text and SVG placeholder in slide body", () => {
  const html =
    "<h1>Images</h1>" +
    '<p><img src="https://example.com/chart.svg" alt="Sales chart" /></p>' +
    '<figure class="layout-svg"><img src="./diagram.svg" alt="Architecture diagram" /></figure>' +
    "<p>Body text</p>";

  const odp = buildOdpPresentation({
    title: "Images",
    renderedSlides: [{ html, headings: [{ level: 1, text: "Images" }] }],
    metadata: { slideWidth: 1280, slideHeight: 720 },
  });

  const zip = new TextDecoder().decode(odp);
  assert.equal(zip.includes("[Image: Sales chart]"), true, "img alt text should be included as bracketed description");
  assert.equal(zip.includes("[Image: Architecture diagram]"), true, "alt text from SVG figure img should be included");
  assert.equal(zip.includes("Body text"), true, "regular body text after images should be present");
});

test("buildOdpPresentation includes SVG diagram placeholder for inline SVG blocks", () => {
  const html =
    "<h1>Diagram</h1>" +
    '<figure class="layout-svg"><svg width="100" height="100"><circle cx="50" cy="50" r="40"/></svg></figure>' +
    "<p>Caption text</p>";

  const odp = buildOdpPresentation({
    title: "SVG",
    renderedSlides: [{ html, headings: [{ level: 1, text: "Diagram" }] }],
    metadata: { slideWidth: 1280, slideHeight: 720 },
  });

  const zip = new TextDecoder().decode(odp);
  assert.equal(zip.includes("[SVG diagram]"), true, "inline SVG should produce a placeholder paragraph");
  assert.equal(zip.includes("Caption text"), true, "text after inline SVG should be present");
});

test("buildNotesExportHtml includes notes, resources, and script content", () => {
  const html = buildNotesExportHtml({
    title: "Test Deck",
    cssText: "body { margin: 0; }",
    themeStylesheetCss: "",
    renderedSlides: [
      {
        html: "<h1>Slide One</h1><p>Content</p>",
        headings: [{ level: 1, text: "Slide One" }],
        notesHtml: "<p>These are speaker notes.</p>",
        resourcesHtml: '<p><a href="https://example.com">A reference</a></p>',
        scriptHtml: "<p>Full spoken script for this slide.</p>",
        kind: "content",
      },
    ],
    metadata: { title: "Test Deck", lang: "en" },
  });

  assert.ok(html.includes("These are speaker notes."), "should include notes content");
  assert.ok(html.includes("A reference"), "should include resources content");
  assert.ok(html.includes("Full spoken script"), "should include script content");
  assert.ok(html.includes("Slide 1"), "should include slide number");
  assert.ok(html.includes("notes-export__supplemental"), "should include supplemental section");
});

test("buildNotesExportHtml omits supplemental section for slides without notes", () => {
  const html = buildNotesExportHtml({
    title: "Test Deck",
    cssText: "",
    themeStylesheetCss: "",
    renderedSlides: [
      {
        html: "<h1>Empty Slide</h1>",
        headings: [{ level: 1, text: "Empty Slide" }],
        notesHtml: "",
        resourcesHtml: "",
        scriptHtml: "",
        kind: "content",
      },
    ],
    metadata: { title: "Test Deck", lang: "en" },
  });

  const mainContent = html.substring(html.indexOf("<main>"));
  assert.ok(!mainContent.includes("notes-export__supplemental"), "should not include supplemental section in slide content");
  assert.ok(mainContent.includes("Empty Slide"), "should still include slide content");
});

test("buildSnapshotHtml includes URL hash navigation: updateHash writes #N and #N.M, applyHashPosition reads them", () => {
  const html = buildSnapshotHtml({
    title: "Hash nav test",
    cssText: "",
    renderedSlides: [
      { html: "<h1>Slide 1</h1>", stepCount: 0 },
      { html: "<h1>Slide 2</h1>", stepCount: 2 },
    ],
    metadata: {},
    source: "",
  });

  // updateHash should write #N for reveal-step 0 and #N.M for step > 0
  assert.ok(
    html.includes("history.replaceState"),
    "snapshot should call history.replaceState to update the URL hash without a page reload",
  );
  assert.ok(
    html.includes("window.location.hash"),
    "snapshot should read window.location.hash to restore slide position from a direct link",
  );
  // Verify the hash format strings are present
  assert.ok(
    html.includes("#${slideNumber}.${revealStep}") || html.includes("`#${slideNumber}.${revealStep}`") || html.includes("`#\\${slideNumber}.\\${revealStep}`") || /`#\$\{slideNumber\}\.\$\{revealStep\}`/.test(html),
    "snapshot should build a #N.M hash for slides with active reveal steps",
  );
  // hashchange listener must re-apply position so browser back/forward works
  assert.ok(
    html.includes("hashchange"),
    "snapshot should listen for the hashchange event so the browser back button restores the correct slide",
  );
  // applyHashPosition and render must be called on page load so a direct link like #2.1 works
  assert.ok(
    html.includes("applyHashPosition()"),
    "snapshot should call applyHashPosition() on page load to support direct links like index.html#2.1",
  );
});

test("buildSnapshotHtml marks only the first slide as is-active in the initial HTML so CSS can hide the rest without JavaScript", () => {
  const html = buildSnapshotHtml({
    title: "Active slide test",
    cssText: "",
    renderedSlides: [
      { html: "<h1>Slide 1</h1>", stepCount: 0 },
      { html: "<h1>Slide 2</h1>", stepCount: 0 },
      { html: "<h1>Slide 3</h1>", stepCount: 0 },
    ],
    metadata: {},
    source: "",
  });

  // Exactly one section should have "is-active" in the initial markup
  const isActiveCount = (html.match(/class="slide is-active"/g) || []).length;
  assert.equal(isActiveCount, 1, "exactly one slide section should have is-active in the initial HTML");
  // Remaining sections should NOT have is-active
  assert.ok(
    html.includes('class="slide is-active"'),
    "the first slide should have the is-active class so CSS shows it before JavaScript runs",
  );
});

test("buildNotesExportHtml only renders subsections that have content", () => {
  const html = buildNotesExportHtml({
    title: "Partial Notes",
    cssText: "",
    themeStylesheetCss: "",
    renderedSlides: [
      {
        html: "<h1>Partial</h1>",
        headings: [{ level: 1, text: "Partial" }],
        notesHtml: "<p>Just notes here.</p>",
        resourcesHtml: "",
        scriptHtml: "",
        kind: "content",
      },
    ],
    metadata: { title: "Partial Notes", lang: "en" },
  });

  const mainContent = html.substring(html.indexOf("<main>"));
  assert.ok(mainContent.includes("notes-export__supplemental"), "should include supplemental section");
  assert.ok(mainContent.includes("notes-export__notes"), "should include notes subsection");
  assert.ok(!mainContent.includes("notes-export__resources"), "should not include empty resources subsection");
  assert.ok(!mainContent.includes("notes-export__script"), "should not include empty script subsection");
});
