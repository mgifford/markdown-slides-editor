import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { renderMarkdown } from "../../src/modules/markdown.js";

let markdownInput = "";
let renderedOutput = "";

Given("Markdown text {string}", function (text) {
  markdownInput = text;
});

Given("Markdown text containing an unordered list:", function (docString) {
  markdownInput = docString;
});

Given("Markdown text containing an ordered list:", function (docString) {
  markdownInput = docString;
});

When("I render the Markdown", function () {
  renderedOutput = renderMarkdown(markdownInput).html;
});

Then("the output contains {string}", function (expected) {
  assert.ok(
    renderedOutput.includes(expected),
    `Expected output to contain "${expected}", but got:\n${renderedOutput}`,
  );
});
