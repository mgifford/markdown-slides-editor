import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import {
  buildExportBundle,
  buildExportFilename,
  buildOnePageHtml,
  buildShortExportFilename,
  buildSnapshotHtml,
} from "../../src/modules/export.js";

// ─── Shared state ─────────────────────────────────────────────────────────────

let deckTitle = "";
let deckDate = "";
let exportFilename = "";
let shortExportFilename = "";
let exportBundle = null;
let snapshotHtml = "";
let onePageHtml = "";
let deckTheme = "";

// ─── Givens ───────────────────────────────────────────────────────────────────

Given(
  "a deck titled {string} dated {string}",
  function (title, date) {
    deckTitle = title;
    deckDate = date;
  },
);

Given("a minimal deck with front matter and one content slide", function () {
  deckTitle = "Test Deck";
  deckDate = "2026-05-01";
  deckTheme = "default";
});

Given("a minimal deck with one content slide", function () {
  deckTitle = "Test Deck";
  deckDate = "2026-05-01";
  deckTheme = "default";
});

Given("a deck using theme {string}", function (theme) {
  deckTitle = "Themed Deck";
  deckDate = "2026-05-01";
  deckTheme = theme;
});

// ─── Whens ────────────────────────────────────────────────────────────────────

When("I generate an export filename", function () {
  exportFilename = buildExportFilename(deckTitle, deckDate);
});

When("I generate a short export filename", function () {
  shortExportFilename = buildShortExportFilename(deckTitle, deckDate);
});

When("I build the export bundle", function () {
  exportBundle = buildExportBundle({
    markdownSource: `---\ntitle: ${deckTitle}\n---\n\n# Slide`,
    deckJson: JSON.stringify({ title: deckTitle }),
    snapshotHtml: "<!doctype html><html><body>Deck</body></html>",
    odpBytes: new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
    onePageHtml: "<!doctype html><html><body>One page</body></html>",
    offlineHtml: "<!doctype html><html><body>Offline</body></html>",
  });
});

When("I build the snapshot HTML", function () {
  snapshotHtml = buildSnapshotHtml({
    title: deckTitle,
    cssText: "",
    renderedSlides: [{ html: "<h1>Slide</h1>", stepCount: 0 }],
    metadata: { theme: deckTheme },
    source: "# Slide",
  });
});

When("I build the one-page HTML", function () {
  onePageHtml = buildOnePageHtml({
    title: deckTitle,
    cssText: "",
    renderedSlides: [{ html: "<h1>Slide</h1>" }],
    metadata: {},
  });
});

// ─── Thens ────────────────────────────────────────────────────────────────────

Then("the filename is {string}", function (expected) {
  assert.equal(exportFilename, expected);
});

Then("the short filename is {string}", function (expected) {
  assert.equal(shortExportFilename, expected);
});

Then("the bundle contains {string}", function (expectedFile) {
  const text = new TextDecoder().decode(exportBundle);
  assert.ok(
    text.includes(expectedFile),
    `Expected bundle to contain "${expectedFile}"`,
  );
});

Then("the snapshot HTML contains data-theme {string}", function (theme) {
  assert.ok(
    snapshotHtml.includes(`data-theme="${theme}"`),
    `Expected snapshot HTML to contain data-theme="${theme}"`,
  );
});

Then("the one-page HTML contains {string}", function (expected) {
  assert.ok(
    onePageHtml.includes(expected),
    `Expected one-page HTML to contain "${expected}"`,
  );
});
