import test from "node:test";
import assert from "node:assert/strict";
import {
  buildExportFilename,
  buildShortExportFilename,
  buildExportBundle,
  buildMhtmlDocument,
  buildOdpPresentation,
  buildOnePageHtml,
  buildOfflinePresentationHtml,
  buildSnapshotHtml,
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
    offlineHtml: "<!doctype html><html><body>Offline</body></html>",
    filePrefix: "My-Deck_01May2026",
  });

  const text = new TextDecoder().decode(bundle);
  assert.equal(text.includes("My-Deck_01May2026.html"), true);
  assert.equal(text.includes("My-Deck_01May2026.odp"), true);
  assert.equal(text.includes("My-Deck_01May2026-one-page.html"), true);
  assert.equal(text.includes("My-Deck_01May2026-offline.html"), true);
  assert.equal(text.includes("deck.md"), true);
  assert.equal(text.includes("deck.json"), true);
});

test("buildExportBundle includes presentation-offline.html when offlineHtml is provided", () => {
  const bundle = buildExportBundle({
    markdownSource: "# Deck",
    deckJson: "{\"title\":\"Deck\"}",
    snapshotHtml: "<!doctype html><html><body>Deck</body></html>",
    odpBytes: new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
    onePageHtml: "<!doctype html><html><body>One page</body></html>",
    offlineHtml: "<!doctype html><html><body>Offline</body></html>",
  });

  const text = new TextDecoder().decode(bundle);
  assert.equal(text.includes("presentation-offline.html"), true);
});

test("buildExportBundle omits presentation-offline.html when offlineHtml is not provided", () => {
  const bundle = buildExportBundle({
    markdownSource: "# Deck",
    deckJson: "{\"title\":\"Deck\"}",
    snapshotHtml: "<!doctype html><html><body>Deck</body></html>",
    odpBytes: new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
    onePageHtml: "<!doctype html><html><body>One page</body></html>",
  });

  const text = new TextDecoder().decode(bundle);
  assert.equal(text.includes("presentation-offline.html"), false);
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
  assert.equal(html.includes("4 per page"), true, "should include the 4-per-page layout toggle");
  assert.equal(html.includes("Speaker notes"), true);
  assert.equal(html.includes("References"), true);
  assert.equal(html.includes("window.print()"), true);
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
  assert.equal(zip.includes("Website: https://example.com/"), true, "website label and value should be separated");
  assert.equal(zip.includes("Slides: https://example.com/slides/"), true, "slides label and value should be separated");
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

test("buildOfflinePresentationHtml produces a presenter-view HTML with embedded data and audience script", () => {
  const html = buildOfflinePresentationHtml({
    title: "My Offline Deck",
    cssText: ".slide{color:black;}",
    themeStylesheetCss: "",
    renderedSlides: [
      { html: "<h1>Slide One</h1>", kind: "title", notesHtml: "<p>Opening notes</p>", stepCount: 0 },
      { html: "<h1>Slide Two</h1>", kind: "content", notesHtml: "", stepCount: 2 },
    ],
    metadata: {
      lang: "en-CA",
      theme: "night-slate",
      durationMinutes: 20,
    },
  });

  assert.equal(html.includes('<!doctype html>'), true);
  assert.equal(html.includes('<html lang="en-CA" data-theme="night-slate">'), true, "data-theme should be on the <html> element so :root[data-theme] CSS rules apply");
  assert.equal(html.includes("My Offline Deck"), true);
  assert.equal(html.includes("Offline Presentation"), true);
  assert.equal(html.includes("Open Audience Window"), true);
  assert.equal(html.includes("current-slide-frame"), true);
  assert.equal(html.includes("next-slide-frame"), true);
  assert.equal(html.includes("presenter-notes"), true);
  assert.equal(html.includes("deck-payload"), true);
  assert.equal(html.includes("offline-audience-script"), true);
  assert.equal(html.includes('"duration":20'), true);
  assert.equal(html.includes('"stepCount":2'), true);
  assert.equal(html.includes("20:00"), true);
});

test("buildOfflinePresentationHtml embeds theme CSS inline when themeStylesheetCss is provided", () => {
  const html = buildOfflinePresentationHtml({
    title: "Themed Deck",
    cssText: ".slide{color:black;}",
    themeStylesheetCss: ".custom-theme { background: navy; }",
    renderedSlides: [{ html: "<h1>One</h1>", kind: "title", stepCount: 0 }],
    metadata: { theme: "default-high-contrast" },
  });

  assert.equal(html.includes(".custom-theme { background: navy; }"), true);
  assert.equal(html.includes(".slide{color:black;}"), true);
});

test("buildOfflinePresentationHtml does not include external theme link tags", () => {
  const html = buildOfflinePresentationHtml({
    title: "Deck",
    cssText: "",
    themeStylesheetCss: ".theme { color: red; }",
    renderedSlides: [{ html: "<h1>One</h1>", kind: "title", stepCount: 0 }],
    metadata: { themeStylesheet: "https://example.com/theme.css" },
  });

  assert.equal(html.includes('href="https://example.com/theme.css"'), false);
  assert.equal(html.includes(".theme { color: red; }"), true);
});

test("buildOfflinePresentationHtml does not contain unescaped closing script tags in payload", () => {
  const html = buildOfflinePresentationHtml({
    title: "Escape test",
    cssText: "",
    themeStylesheetCss: "",
    renderedSlides: [{ html: "<h1>One</h1>", stepCount: 0 }],
    metadata: {},
    source: "</script><script>alert('x')</script>",
  });

  assert.equal(html.includes("</script><script>alert"), false);
});

test("buildOfflinePresentationHtml escapes closing script tags in the embedded JSON payload for titles", () => {
  const maliciousTitle = 'Deck with </script><script>alert("xss")</script> end';
  const html = buildOfflinePresentationHtml({
    title: maliciousTitle,
    cssText: "",
    themeStylesheetCss: "",
    renderedSlides: [{ html: "<h1>One</h1>", stepCount: 0 }],
    metadata: {},
  });

  // The payload JSON inside the <script> block must not contain raw </script>
  const payloadMatch = html.match(/<script id="deck-payload"[^>]*>([\s\S]*?)<\/script>/);
  assert.ok(payloadMatch, "deck-payload script block should be present");
  assert.equal(payloadMatch[1].includes("</script>"), false, "raw </script> must not appear inside deck-payload block");
  assert.equal(payloadMatch[1].includes("<\\/script>"), true, "escaped form should be present in deck-payload");
});

test("buildOfflinePresentationHtml escapes uppercase and mixed-case closing script tags in the payload", () => {
  const html = buildOfflinePresentationHtml({
    title: "Case test",
    cssText: "",
    themeStylesheetCss: "",
    renderedSlides: [
      // Intentionally testing XSS prevention: uppercase/mixed-case </script> in slide content
      // must be escaped so they cannot prematurely close the <script type="application/json"> block.
      { html: "<h1>One</h1>", stepCount: 0, notesHtml: "</SCRIPT><script>alert('xss')</SCRIPT>" },
    ],
    metadata: {},
  });

  // All case variants must be escaped – none should appear raw inside the payload script block
  assert.equal(html.includes("</SCRIPT><script>alert"), false, "uppercase </SCRIPT> must be escaped");
  assert.equal(html.includes("</Script>"), false, "mixed-case </Script> must be escaped");
});

test("buildOfflinePresentationHtml uses document.write to open the audience window (no blob URL)", () => {
  const html = buildOfflinePresentationHtml({
    title: "Audience window test",
    cssText: "",
    themeStylesheetCss: "",
    renderedSlides: [{ html: "<h1>Slide</h1>", stepCount: 0 }],
    metadata: {},
  });

  assert.equal(html.includes("URL.createObjectURL"), false, "should not use blob URLs that fail in file:// context");
  assert.equal(html.includes("document.write"), true, "should use document.write for file:// compatibility");
  assert.equal(html.includes("window.open('', 'offline-audience-window')"), true, "should open a blank named window");
});

test("buildOfflinePresentationHtml escapes </style> in embedded CSS to prevent premature style block closure", () => {
  const maliciousCss = ".a { color: red; } </style><script>alert('xss')</script><style>";
  const html = buildOfflinePresentationHtml({
    title: "CSS escape test",
    cssText: maliciousCss,
    themeStylesheetCss: "",
    renderedSlides: [{ html: "<h1>One</h1>", stepCount: 0 }],
    metadata: {},
  });

  // The raw </style> must not appear inside the <style> block
  const styleMatch = html.match(/<style id="offline-app-styles">([\s\S]*?)<\/style>/);
  assert.ok(styleMatch, "offline-app-styles style block should be present");
  assert.equal(styleMatch[1].includes("</style>"), false, "raw </style> must not appear inside the style block");
  assert.equal(styleMatch[1].includes("<\\/style>"), true, "escaped form should be present in the style block");
});

test("buildOfflinePresentationHtml escapes </style> in external theme CSS", () => {
  const html = buildOfflinePresentationHtml({
    title: "Theme CSS escape test",
    cssText: ".base { color: black; }",
    themeStylesheetCss: ".theme { color: red; } </style><script>alert('theme-xss')</script><style>",
    renderedSlides: [{ html: "<h1>One</h1>", stepCount: 0 }],
    metadata: {},
  });

  const styleMatch = html.match(/<style id="offline-app-styles">([\s\S]*?)<\/style>/);
  assert.ok(styleMatch, "offline-app-styles style block should be present");
  assert.equal(styleMatch[1].includes("</style>"), false, "raw </style> from theme CSS must be escaped");
});

test("buildOfflinePresentationHtml HTML-escapes the title in attributes and text content", () => {
  const xssTitle = 'Deck <script>alert("xss")</script> title';
  const html = buildOfflinePresentationHtml({
    title: xssTitle,
    cssText: "",
    themeStylesheetCss: "",
    renderedSlides: [{ html: "<h1>One</h1>", stepCount: 0 }],
    metadata: {},
  });

  // The raw script tag must not appear unescaped in the rendered HTML outside the JSON payload
  assert.equal(html.includes('<script>alert("xss")</script>'), false, "raw script tag must not appear in the HTML output");
  assert.equal(html.includes("&lt;script&gt;"), true, "title should be HTML-escaped in the rendered output");
});

test("buildOfflinePresentationHtml HTML-escapes theme and deckStyleAttr in html element attributes", () => {
  const html = buildOfflinePresentationHtml({
    title: "Attr test",
    cssText: "",
    themeStylesheetCss: "",
    renderedSlides: [{ html: "<h1>One</h1>", stepCount: 0 }],
    metadata: { theme: 'night-slate" onload="alert(1)' },
  });

  assert.equal(html.includes('data-theme="night-slate" onload="alert(1)"'), false, "theme must not inject attributes");
  assert.equal(html.includes("&quot;"), true, "double quotes in theme must be HTML-escaped");
});

test("buildOfflinePresentationHtml inline script wraps JSON.parse in try-catch for graceful error handling", () => {
  const html = buildOfflinePresentationHtml({
    title: "Error handling test",
    cssText: "",
    themeStylesheetCss: "",
    renderedSlides: [{ html: "<h1>One</h1>", stepCount: 0 }],
    metadata: {},
  });

  assert.equal(html.includes("try {"), true, "inline script should have try block for JSON.parse");
  assert.equal(html.includes("} catch (parseErr) {"), true, "inline script should handle JSON.parse errors");
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
