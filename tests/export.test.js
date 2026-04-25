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

  assert.equal(html.includes('<html lang="en-CA">'), true);
  assert.equal(html.includes('data-theme="night-slate"'), true);
  assert.equal(html.includes('href="https://example.com/theme.css"'), true);
  assert.equal(html.includes('data-step-count="2"'), true);
  assert.equal(html.includes('<script id="deck-source" type="application/json">'), true);
  assert.equal(html.includes('"slideCount":2'), true);
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

test("buildExportBundle includes markdown, html, odp, and mhtml files in the zip payload", () => {
  const bundle = buildExportBundle({
    markdownSource: "# Deck",
    deckJson: "{\"title\":\"Deck\"}",
    snapshotHtml: "<!doctype html><html><body>Deck</body></html>",
    odpBytes: new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
    onePageMhtml: "MIME-Version: 1.0",
  });

  const text = new TextDecoder().decode(bundle);
  assert.equal(text.includes("deck.md"), true);
  assert.equal(text.includes("deck.json"), true);
  assert.equal(text.includes("presentation.html"), true);
  assert.equal(text.includes("presentation.odp"), true);
  assert.equal(text.includes("presentation-one-page.mhtml"), true);
  assert.equal(bundle[0], 0x50);
  assert.equal(bundle[1], 0x4b);
});

test("buildExportBundle uses the provided filePrefix for presentation files", () => {
  const bundle = buildExportBundle({
    markdownSource: "# Deck",
    deckJson: "{\"title\":\"Deck\"}",
    snapshotHtml: "<!doctype html><html><body>Deck</body></html>",
    odpBytes: new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
    onePageMhtml: "MIME-Version: 1.0",
    offlineMhtml: "MIME-Version: 1.0 offline",
    filePrefix: "My-Deck_01May2026",
  });

  const text = new TextDecoder().decode(bundle);
  assert.equal(text.includes("My-Deck_01May2026.html"), true);
  assert.equal(text.includes("My-Deck_01May2026.odp"), true);
  assert.equal(text.includes("My-Deck_01May2026-one-page.mhtml"), true);
  assert.equal(text.includes("My-Deck_01May2026-offline.mhtml"), true);
  assert.equal(text.includes("deck.md"), true);
  assert.equal(text.includes("deck.json"), true);
});

test("buildExportBundle includes presentation-offline.mhtml when offlineMhtml is provided", () => {
  const bundle = buildExportBundle({
    markdownSource: "# Deck",
    deckJson: "{\"title\":\"Deck\"}",
    snapshotHtml: "<!doctype html><html><body>Deck</body></html>",
    odpBytes: new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
    onePageMhtml: "MIME-Version: 1.0",
    offlineMhtml: "MIME-Version: 1.0 offline",
  });

  const text = new TextDecoder().decode(bundle);
  assert.equal(text.includes("presentation-offline.mhtml"), true);
});

test("buildExportBundle omits presentation-offline.mhtml when offlineMhtml is not provided", () => {
  const bundle = buildExportBundle({
    markdownSource: "# Deck",
    deckJson: "{\"title\":\"Deck\"}",
    snapshotHtml: "<!doctype html><html><body>Deck</body></html>",
    odpBytes: new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
    onePageMhtml: "MIME-Version: 1.0",
  });

  const text = new TextDecoder().decode(bundle);
  assert.equal(text.includes("presentation-offline.mhtml"), false);
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

  assert.equal(html.includes('<html lang="en-CA">'), true);
  assert.equal(html.includes('data-theme="night-slate"'), true);
  assert.equal(html.includes("one-page-body"), true);
  assert.equal(html.includes("one-page-slide-card"), true);
  assert.equal(html.includes('aria-label="Slide 1"'), true);
  assert.equal(html.includes('aria-label="Slide 2"'), true);
  assert.equal(html.includes("Save HTML"), true);
  assert.equal(html.includes("Print / Save PDF"), true);
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
  assert.equal(html.includes('<html lang="en-CA">'), true);
  assert.equal(html.includes('data-theme="night-slate"'), true);
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
